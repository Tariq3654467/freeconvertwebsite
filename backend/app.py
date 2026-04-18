import os
import static_ffmpeg

# Initialize bundled ffmpeg as early as possible
static_ffmpeg.add_paths()

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from models import db
from routes.auth_routes import auth_bp
from routes.convert_routes import convert_bp
from extensions import jwt
from security import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta


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

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
