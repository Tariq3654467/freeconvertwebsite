import os

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
    create_access_token,
)
from extensions import db
from models import User, Admin, Blog, BlogComment
from security import get_password_hash, verify_password
import uuid
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


def slugify(text):
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


def is_admin(user_id):
    return db.session.query(Admin).filter_by(user_id=user_id).first() is not None


# ──────────────────────────────────────────────────────────────────────────────
# SIGN UP / LOGIN
# ──────────────────────────────────────────────────────────────────────────────


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({'message': 'Username, email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already taken'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 400

    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        is_admin=False,
    )
    db.session.add(user)
    db.session.flush()

    admin_email = os.getenv('ADMIN_EMAIL', 'tariq.devp@gmail.com').strip().lower()
    if admin_email and email == admin_email:
        user.is_admin = True
        if not user.admin_profile:
            db.session.add(Admin(user_id=user.id, role='moderator'))

    db.session.commit()
    return jsonify({'message': 'Account created'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'message': 'Invalid email or password'}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'username': user.username,
            'email': user.email,
            'is_admin': bool(user.is_admin),
        },
    )
    return jsonify({'access_token': token}), 200


# ──────────────────────────────────────────────────────────────────────────────
# USER MANAGEMENT
# ──────────────────────────────────────────────────────────────────────────────

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    users = db.session.query(User).paginate(page=page, per_page=per_page)
    return jsonify({
        'users': [u.to_dict() for u in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': page
    }), 200


@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    auth_user_id = get_jwt_identity()
    if not is_admin(auth_user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    user = db.session.query(User).get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify(user.to_dict()), 200


@auth_bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@jwt_required()
def toggle_admin(user_id):
    auth_user_id = get_jwt_identity()
    if not is_admin(auth_user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    user = db.session.query(User).get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if user_id == int(auth_user_id):
        return jsonify({'message': 'Cannot modify your own admin status'}), 400

    user.is_admin = not user.is_admin

    if user.is_admin and not user.admin_profile:
        admin = Admin(user_id=user.id, role='moderator')
        db.session.add(admin)
    elif not user.is_admin and user.admin_profile:
        db.session.delete(user.admin_profile)

    db.session.commit()
    return jsonify({'message': 'Admin status updated', 'user': user.to_dict()}), 200


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    auth_user_id = get_jwt_identity()
    if not is_admin(auth_user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    if user_id == int(auth_user_id):
        return jsonify({'message': 'Cannot delete your own account'}), 400

    user = db.session.query(User).get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'}), 200


# ──────────────────────────────────────────────────────────────────────────────
# BLOG MANAGEMENT
# ──────────────────────────────────────────────────────────────────────────────

@auth_bp.route('/blogs', methods=['GET'])
def get_blogs():
    """Public endpoint: returns published blogs. Admins can pass ?status=draft too."""
    status = request.args.get('status', 'published')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = db.session.query(Blog).filter_by(status=status)
    blogs = query.order_by(Blog.created_at.desc()).paginate(page=page, per_page=per_page)

    return jsonify({
        'blogs': [b.to_dict() for b in blogs.items],
        'total': blogs.total,
        'pages': blogs.pages,
        'current_page': page
    }), 200


@auth_bp.route('/blogs', methods=['POST'])
@jwt_required()
def create_blog():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    if not title or not content:
        return jsonify({'message': 'Title and content are required'}), 400

    admin = db.session.query(Admin).filter_by(user_id=user_id).first()
    slug = slugify(title)
    existing = db.session.query(Blog).filter_by(slug=slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:8]}"

    blog = Blog(
        admin_id=admin.id,
        title=title,
        slug=slug,
        content=content,
        excerpt=data.get('excerpt'),
        category=data.get('category'),
        tags=data.get('tags', []),
        featured_image=data.get('featured_image'),
        status=data.get('status', 'draft')
    )
    db.session.add(blog)
    db.session.commit()

    return jsonify({'message': 'Blog created', 'blog': blog.to_dict(include_content=True)}), 201


@auth_bp.route('/blogs/<blog_id>', methods=['GET'])
def get_blog(blog_id):
    """
    Fetch a single blog by its ID.
    - Public users: only published blogs.
    - Admins (valid JWT): any blog.
    """
    blog = db.session.query(Blog).get(blog_id)
    if not blog:
        # Also try by slug
        blog = db.session.query(Blog).filter_by(slug=blog_id).first()
    if not blog:
        return jsonify({'message': 'Blog not found'}), 404

    # Check if requester is admin (optional JWT)
    requester_is_admin = False
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid and is_admin(uid):
            requester_is_admin = True
    except Exception:
        pass

    if blog.status != 'published' and not requester_is_admin:
        return jsonify({'message': 'Blog not found'}), 404

    # Only increment view count for published blogs on public access
    if blog.status == 'published':
        blog.view_count += 1
        db.session.commit()

    return jsonify(blog.to_dict(include_content=True)), 200


@auth_bp.route('/blogs/<blog_id>', methods=['PUT'])
@jwt_required()
def update_blog(blog_id):
    user_id = get_jwt_identity()
    admin = db.session.query(Admin).filter_by(user_id=user_id).first()
    if not admin:
        return jsonify({'message': 'Unauthorized'}), 403

    blog = db.session.query(Blog).get(blog_id)
    if not blog:
        return jsonify({'message': 'Blog not found'}), 404

    if blog.admin_id != admin.id:
        return jsonify({'message': 'You can only edit your own blogs'}), 403

    data = request.get_json()
    if data.get('title'):
        blog.title = data['title']
    if data.get('content'):
        blog.content = data['content']
    if 'excerpt' in data:
        blog.excerpt = data['excerpt']
    if 'category' in data:
        blog.category = data['category']
    if 'tags' in data:
        blog.tags = data['tags']
    if 'featured_image' in data:
        blog.featured_image = data['featured_image']
    if data.get('status'):
        blog.status = data['status']

    blog.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Blog updated', 'blog': blog.to_dict(include_content=True)}), 200


@auth_bp.route('/blogs/<blog_id>', methods=['DELETE'])
@jwt_required()
def delete_blog(blog_id):
    user_id = get_jwt_identity()
    admin = db.session.query(Admin).filter_by(user_id=user_id).first()
    if not admin:
        return jsonify({'message': 'Unauthorized'}), 403

    blog = db.session.query(Blog).get(blog_id)
    if not blog:
        return jsonify({'message': 'Blog not found'}), 404

    if blog.admin_id != admin.id:
        return jsonify({'message': 'You can only delete your own blogs'}), 403

    db.session.delete(blog)
    db.session.commit()

    return jsonify({'message': 'Blog deleted'}), 200


@auth_bp.route('/blogs/admin/all', methods=['GET'])
@jwt_required()
def get_admin_blogs():
    user_id = get_jwt_identity()
    admin = db.session.query(Admin).filter_by(user_id=user_id).first()
    if not admin:
        return jsonify({'message': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    blogs = (db.session.query(Blog)
             .filter_by(admin_id=admin.id)
             .order_by(Blog.created_at.desc())
             .paginate(page=page, per_page=per_page))

    return jsonify({
        'blogs': [b.to_dict() for b in blogs.items],
        'total': blogs.total,
        'pages': blogs.pages,
        'current_page': page
    }), 200


# ──────────────────────────────────────────────────────────────────────────────
# DASHBOARD STATS
# ──────────────────────────────────────────────────────────────────────────────

@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    total_users = db.session.query(User).count()
    total_blogs = db.session.query(Blog).count()
    published_blogs = db.session.query(Blog).filter_by(status='published').count()
    draft_blogs = db.session.query(Blog).filter_by(status='draft').count()
    total_views = db.session.query(db.func.sum(Blog.view_count)).scalar() or 0

    return jsonify({
        'total_users': total_users,
        'total_blogs': total_blogs,
        'published_blogs': published_blogs,
        'draft_blogs': draft_blogs,
        'total_views': total_views
    }), 200
