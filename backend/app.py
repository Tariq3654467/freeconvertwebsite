import os
import static_ffmpeg
from datetime import timedelta, datetime

# Initialize bundled ffmpeg as early as possible
static_ffmpeg.add_paths()

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

from models import db, Job
from routes.auth_routes import auth_bp
from routes.convert_routes import convert_bp
from extensions import jwt
from security import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES


def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app, origins=os.getenv('ALLOWED_ORIGINS', '*').split(','))

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/freeconvert'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024 * 1024  # 1 GB

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(convert_bp, url_prefix='/api/convert')

    with app.app_context():
        db.create_all()
        # Initialize scheduler for file cleanup
        init_scheduler(app)

    return app


def cleanup_old_files(app):
    """Delete uploaded files older than 5 minutes"""
    with app.app_context():
        # Find jobs created more than 5 minutes ago
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        old_jobs = Job.query.filter(
            Job.created_at < five_minutes_ago
        ).all()
        
        upload_folder = app.config['UPLOAD_FOLDER']
        
        for job in old_jobs:
            try:
                filepath = os.path.join(upload_folder, job.original_filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
                    print(f"Deleted uploaded file: {job.original_filename}")
            except Exception as e:
                print(f"Error deleting file {job.original_filename}: {str(e)}")


def init_scheduler(app):
    """Initialize the background scheduler"""
    scheduler = BackgroundScheduler()
    
    # Schedule cleanup task to run every minute
    scheduler.add_job(
        func=cleanup_old_files,
        args=[app],
        trigger="interval",
        minutes=1,
        id="cleanup_old_files",
        name="Clean up files older than 5 minutes",
        replace_existing=True
    )
    
    scheduler.start()
    print("File cleanup scheduler started")



if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
