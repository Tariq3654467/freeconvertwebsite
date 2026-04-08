import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image

from models import Job
from extensions import db

convert_bp = Blueprint('convert', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@convert_bp.route('/upload', methods=['POST'])
@jwt_required(optional=True)
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
        
    file = request.files['file']
    target_format = request.form.get('target_format', '').lower()
    
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
        
    if not target_format or target_format not in ALLOWED_EXTENSIONS:
        return jsonify({'message': 'Invalid target format'}), 400
        
    if file and allowed_file(file.filename):
        user_identity = get_jwt_identity()
        original_filename = secure_filename(file.filename)
        
        # Save original file
        unique_id = str(uuid.uuid4())
        ext = original_filename.rsplit('.', 1)[1].lower()
        save_name = f"{unique_id}.{ext}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], save_name)
        file.save(filepath)
        
        # Create job
        new_job = Job(
            user_id=user_identity,
            original_filename=save_name,
            target_format=target_format,
            status='pending'
        )
        db.session.add(new_job)
        db.session.commit()
        
        return jsonify({'message': 'File uploaded', 'job_id': new_job.id}), 201
        
    return jsonify({'message': 'File type not allowed'}), 400

@convert_bp.route('/process/<int:job_id>', methods=['POST'])
def process_job(job_id):
    job = Job.query.get_or_404(job_id)
    if job.status != 'pending':
         return jsonify({'message': 'Job already processed'}), 400
         
    job.status = 'processing'
    db.session.commit()
    
    try:
        # Perform image conversion (blocking for now)
        input_path = os.path.join(current_app.config['UPLOAD_FOLDER'], job.original_filename)
        output_filename = f"{job.original_filename.rsplit('.', 1)[0]}.{job.target_format}"
        output_path = os.path.join(current_app.config['UPLOAD_FOLDER'], output_filename)
        
        with Image.open(input_path) as img:
             # convert to RGB if saving to JPEG
             if job.target_format in ['jpg', 'jpeg'] and img.mode in ('RGBA', 'P'):
                 img = img.convert('RGB')
             img.save(output_path)
             
        job.status = 'done'
        job.result_filename = output_filename
        db.session.commit()
        return jsonify({'message': 'Job complete', 'job_id': job.id, 'status': 'done'}), 200
        
    except Exception as e:
        job.status = 'failed'
        db.session.commit()
        return jsonify({'message': f'Conversion failed: {str(e)}'}), 500

@convert_bp.route('/status/<int:job_id>', methods=['GET'])
def get_status(job_id):
    job = Job.query.get_or_404(job_id)
    return jsonify({
        'job_id': job.id,
        'status': job.status,
        'original_filename': job.original_filename,
        'target_format': job.target_format
    }), 200

@convert_bp.route('/download/<int:job_id>', methods=['GET'])
def download_file(job_id):
    job = Job.query.get_or_404(job_id)
    if job.status == 'done' and job.result_filename:
        return send_from_directory(
            os.path.abspath(current_app.config['UPLOAD_FOLDER']), 
            job.result_filename, 
            as_attachment=True
        )
    return jsonify({'message': 'File not ready or job failed'}), 400
