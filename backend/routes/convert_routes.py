import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
import moviepy.editor as mp
from pydub import AudioSegment
from PyPDF2 import PdfReader, PdfWriter
from docx import Document
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pdf2image import convert_from_path
import io

from models import Job
from extensions import db

convert_bp = Blueprint('convert', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'svg', 'heic', 'pdf', 'docx', 'mp4', 'mp3', 'mov', 'avi', 'ogg', 'wav', 'm4a', 'flac'}

IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif'}
AUDIO_EXTENSIONS = {'mp3', 'ogg', 'wav', 'flac', 'm4a'}
VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi'}

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
        input_path = os.path.join(current_app.config['UPLOAD_FOLDER'], job.original_filename)
        original_ext = job.original_filename.rsplit('.', 1)[1].lower()
        target_ext = job.target_format
        
        output_filename = f"{job.original_filename.rsplit('.', 1)[0]}.{target_ext}"
        output_path = os.path.join(current_app.config['UPLOAD_FOLDER'], output_filename)
        
        if target_ext in IMAGE_EXTENSIONS:
            # Image conversion
            with Image.open(input_path) as img:
                if target_ext in ['jpg', 'jpeg'] and img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                img.save(output_path)
        elif target_ext in AUDIO_EXTENSIONS:
            # Audio conversion
            if original_ext in AUDIO_EXTENSIONS:
                audio = AudioSegment.from_file(input_path)
            elif original_ext in VIDEO_EXTENSIONS:
                # Extract audio from video
                video = mp.VideoFileClip(input_path)
                audio_path = input_path.replace('.' + original_ext, '_temp.wav')
                video.audio.write_audiofile(audio_path)
                audio = AudioSegment.from_wav(audio_path)
                os.remove(audio_path)
                video.close()
            else:
                raise ValueError("Unsupported source for audio conversion")
            
            # Export to target format
            if target_ext == 'mp3':
                audio.export(output_path, format='mp3')
            elif target_ext == 'wav':
                audio.export(output_path, format='wav')
            elif target_ext == 'ogg':
                audio.export(output_path, format='ogg')
            elif target_ext == 'flac':
                audio.export(output_path, format='flac')
            elif target_ext == 'm4a':
                audio.export(output_path, format='m4a')
        elif target_ext in VIDEO_EXTENSIONS:
            # Video conversion (basic)
            if original_ext in VIDEO_EXTENSIONS:
                video = mp.VideoFileClip(input_path)
                video.write_videofile(output_path)
                video.close()
            else:
                raise ValueError("Unsupported source for video conversion")
        elif target_ext == 'pdf':
            if original_ext == 'docx':
                # DOCX to PDF
                doc = Document(input_path)
                c = canvas.Canvas(output_path, pagesize=letter)
                width, height = letter
                for para in doc.paragraphs:
                    c.drawString(100, height - 100, para.text)
                    height -= 20
                    if height < 100:
                        c.showPage()
                        height = letter[1]
                c.save()
            elif original_ext in IMAGE_EXTENSIONS:
                # Image to PDF
                img = Image.open(input_path)
                img.convert('RGB').save(output_path, 'PDF')
            else:
                raise ValueError("Unsupported source for PDF conversion")
        elif target_ext == 'docx':
            if original_ext == 'pdf':
                # PDF to DOCX (basic text extraction)
                reader = PdfReader(input_path)
                doc = Document()
                for page in reader.pages:
                    text = page.extract_text()
                    doc.add_paragraph(text)
                doc.save(output_path)
            else:
                raise ValueError("Unsupported source for DOCX conversion")
        elif target_ext in IMAGE_EXTENSIONS and original_ext == 'pdf':
            # PDF to image
            images = convert_from_path(input_path)
            if images:
                images[0].save(output_path)  # Save first page
        else:
            raise ValueError(f"Conversion from {original_ext} to {target_ext} not supported")
        
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
