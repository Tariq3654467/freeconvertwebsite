from datetime import datetime
from extensions import db
import uuid


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    jobs = db.relationship('Job', back_populates='user', lazy=True)
    admin_profile = db.relationship('Admin', back_populates='user', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat()
        }


class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    role = db.Column(db.String(20), default='moderator')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='admin_profile')
    blogs = db.relationship('Blog', back_populates='admin', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }


class Blog(db.Model):
    __tablename__ = 'blogs'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = db.Column(db.String(36), db.ForeignKey('admins.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(500))
    category = db.Column(db.String(50))
    tags = db.Column(db.JSON, default=list)
    featured_image = db.Column(db.String(255))
    status = db.Column(db.String(20), default='draft')
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    admin = db.relationship('Admin', back_populates='blogs')
    comments = db.relationship('BlogComment', back_populates='blog', cascade='all, delete-orphan')

    def to_dict(self, include_content=False):
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'category': self.category,
            'tags': self.tags or [],
            'featured_image': self.featured_image,
            'status': self.status,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_content:
            data['content'] = self.content
        return data


class BlogComment(db.Model):
    __tablename__ = 'blog_comments'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blog_id = db.Column(db.String(36), db.ForeignKey('blogs.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    content = db.Column(db.Text, nullable=False)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    blog = db.relationship('Blog', back_populates='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'blog_id': self.blog_id,
            'user_id': self.user_id,
            'content': self.content,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat()
        }


class AnonymousDailyUsage(db.Model):
    """Tracks guest upload counts per UTC day (hashed IP) for rate limiting."""
    __tablename__ = 'anonymous_daily_usage'
    __table_args__ = (
        db.UniqueConstraint('day', 'ip_hash', name='uq_anonymous_daily_ip'),
    )

    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date, nullable=False, index=True)
    ip_hash = db.Column(db.String(64), nullable=False, index=True)
    uploads = db.Column(db.Integer, nullable=False, default=0)


class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    original_filename = db.Column(db.String(512), nullable=False)
    target_format = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='pending')
    result_filename = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='jobs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_format': self.target_format,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
