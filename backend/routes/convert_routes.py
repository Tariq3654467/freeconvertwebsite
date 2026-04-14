import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Job, User
from schemas import JobResponse
from security import get_current_user

# Conversion imports
from PIL import Image
import moviepy as mp
from pydub import AudioSegment
from PyPDF2 import PdfReader, PdfWriter
from docx import Document
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pdf2image import convert_from_path
import pillow_heif
import vtracer

pillow_heif.register_heif_opener()

router = APIRouter()

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'svg', 'heic', 'jfif', 'pdf', 'docx', 'mp4', 'mp3', 'mov', 'avi', 'ogg', 'wav', 'm4a', 'flac'}
IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'heic', 'jfif'}
AUDIO_EXTENSIONS = {'mp3', 'ogg', 'wav', 'flac', 'm4a'}
VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def perform_conversion(job_id: int, db_session_factory):
    # We need a new session since this runs in a background thread
    db = db_session_factory()
    job = db.query(Job).get(job_id)
    if not job:
        db.close()
        return

    try:
        job.status = 'processing'
        db.commit()

        input_path = os.path.join(UPLOAD_FOLDER, job.original_filename)
        original_ext = job.original_filename.rsplit('.', 1)[1].lower()
        target_ext = job.target_format
        
        output_filename = f"{job.original_filename.rsplit('.', 1)[0]}.{target_ext}"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)
        
        # --- Conversion Logic ---
        if target_ext in IMAGE_EXTENSIONS and original_ext == 'pdf':
            images = convert_from_path(input_path)
            if images:
                images[0].save(output_path)
        elif target_ext == 'svg':
            if original_ext in IMAGE_EXTENSIONS:
                vtracer.convert_image_to_svg_py(input_path, output_path)
            else:
                raise ValueError(f"Cannot convert {original_ext} to SVG")
        elif target_ext in IMAGE_EXTENSIONS:
            with Image.open(input_path) as img:
                if target_ext in ['jpg', 'jpeg', 'jfif'] and img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                format_map = {'jfif': 'JPEG'}
                img.save(output_path, format=format_map.get(target_ext))
        elif target_ext in AUDIO_EXTENSIONS:
            if original_ext in AUDIO_EXTENSIONS:
                audio = AudioSegment.from_file(input_path)
            elif original_ext in VIDEO_EXTENSIONS:
                video = mp.VideoFileClip(input_path)
                audio_path = input_path.replace('.' + original_ext, '_temp.wav')
                video.audio.write_audiofile(audio_path)
                audio = AudioSegment.from_wav(audio_path)
                os.remove(audio_path)
                video.close()
            else:
                raise ValueError("Unsupported source for audio conversion")
            
            audio.export(output_path, format=target_ext)
        elif target_ext in VIDEO_EXTENSIONS:
            if original_ext in VIDEO_EXTENSIONS:
                video = mp.VideoFileClip(input_path)
                video.write_videofile(output_path)
                video.close()
            else:
                raise ValueError("Unsupported source for video conversion")
        elif target_ext == 'pdf':
            if original_ext == 'docx':
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
                img = Image.open(input_path)
                img.convert('RGB').save(output_path, 'PDF')
            else:
                raise ValueError("Unsupported source for PDF conversion")
        elif target_ext == 'docx':
            if original_ext == 'pdf':
                reader = PdfReader(input_path)
                doc = Document()
                for page in reader.pages:
                    text = page.extract_text()
                    doc.add_paragraph(text)
                doc.save(output_path)
            else:
                raise ValueError("Unsupported source for DOCX conversion")
        else:
            raise ValueError(f"Conversion from {original_ext} to {target_ext} not supported")

        job.status = 'done'
        job.result_filename = output_filename
        db.commit()

    except Exception as e:
        print(f"ERROR processing job {job_id}: {str(e)}")
        job.status = 'failed'
        db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    target_format: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
        
    if target_format.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid target format")

    unique_id = str(uuid.uuid4())
    ext = file.filename.rsplit('.', 1)[1].lower()
    save_name = f"{unique_id}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, save_name)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_job = Job(
        user_id=current_user.id if current_user else None,
        original_filename=save_name,
        target_format=target_format.lower(),
        status='pending'
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return new_job

@router.post("/process/{job_id}")
async def process_job(
    job_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != 'pending':
        return {"message": "Job already processed", "status": job.status}
    
    # Needs a session factory for the background task
    from database import SessionLocal
    background_tasks.add_task(perform_conversion, job_id, SessionLocal)
    
    return {"message": "Conversion started", "job_id": job_id}

@router.get("/status/{job_id}", response_model=JobResponse)
async def get_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/download/{job_id}")
async def download_file(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != 'done' or not job.result_filename:
        raise HTTPException(status_code=400, detail="File not ready or job failed")
        
    filepath = os.path.abspath(os.path.join(UPLOAD_FOLDER, job.result_filename))
    return FileResponse(filepath, filename=job.result_filename, media_type='application/octet-stream')
