from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Admin, Blog, BlogComment
from security import get_password_hash
import uuid
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


def slugify(text):
    return text.lower().replace(' ', '-').replace('_', '-')


def is_admin(user_id):
    return db.session.query(Admin).filter_by(user_id=user_id).first() is not None


# ──────────────────────────────────────────────────────────────────────────────
# USER MANAGEMENT
# ──────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
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


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    auth_user_id = get_jwt_identity()
    if not is_admin(auth_user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    user = db.session.query(User).get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify(user.to_dict()), 200


@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@jwt_required()
def toggle_admin(user_id):
    auth_user_id = get_jwt_identity()
    if not is_admin(auth_user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    user = db.session.query(User).get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if user_id == auth_user_id:
        return jsonify({'message': 'Cannot modify your own admin status'}), 400

    user.is_admin = not user.is_admin

    if user.is_admin and not user.admin_profile:
        admin = Admin(user_id=user.id, role='moderator')
        db.session.add(admin)
    elif not user.is_admin and user.admin_profile:
        db.session.delete(user.admin_profile)

    db.session.commit()
    return jsonify({'message': 'Admin status updated', 'user': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    auth_user_id = get_jwt_identity()
    if not is_admin(auth_user_id):
        return jsonify({'message': 'Unauthorized'}), 403

    if user_id == auth_user_id:
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

@admin_bp.route('/blogs', methods=['GET'])
def get_blogs():
    status = request.args.get('status', 'published')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = db.session.query(Blog)
    if status:
        query = query.filter_by(status=status)
    else:
        query = query.filter_by(status='published')

    blogs = query.order_by(Blog.created_at.desc()).paginate(page=page, per_page=per_page)
    return jsonify({
        'blogs': [b.to_dict() for b in blogs.items],
        'total': blogs.total,
        'pages': blogs.pages,
        'current_page': page
    }), 200


@admin_bp.route('/blogs', methods=['POST'])
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


@admin_bp.route('/blogs/<blog_id>', methods=['GET'])
def get_blog(blog_id):
    blog = db.session.query(Blog).get(blog_id)
    if not blog:
        return jsonify({'message': 'Blog not found'}), 404

    if blog.status != 'published':
        return jsonify({'message': 'Blog not found'}), 404

    blog.view_count += 1
    db.session.commit()

    return jsonify(blog.to_dict(include_content=True)), 200


@admin_bp.route('/blogs/<blog_id>', methods=['PUT'])
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
    if data.get('excerpt'):
        blog.excerpt = data['excerpt']
    if data.get('category'):
        blog.category = data['category']
    if 'tags' in data:
        blog.tags = data['tags']
    if data.get('featured_image'):
        blog.featured_image = data['featured_image']
    if data.get('status'):
        blog.status = data['status']

    blog.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Blog updated', 'blog': blog.to_dict(include_content=True)}), 200


@admin_bp.route('/blogs/<blog_id>', methods=['DELETE'])
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


@admin_bp.route('/blogs/admin/all', methods=['GET'])
@jwt_required()
def get_admin_blogs():
    user_id = get_jwt_identity()
    admin = db.session.query(Admin).filter_by(user_id=user_id).first()
    if not admin:
        return jsonify({'message': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    blogs = db.session.query(Blog).filter_by(admin_id=admin.id).order_by(Blog.created_at.desc()).paginate(page=page, per_page=per_page)
    return jsonify({
        'blogs': [b.to_dict() for b in blogs.items],
        'total': blogs.total,
        'pages': blogs.pages,
        'current_page': page
    }), 200


# ──────────────────────────────────────────────────────────────────────────────
# DASHBOARD STATS
# ──────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
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
