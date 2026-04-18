from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    jobs = db.relationship('Job', back_populates='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    original_filename = db.Column(db.String(512), nullable=False)   # longer for pipe-separated merge
    target_format = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='pending')             # pending | processing | done | failed
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
