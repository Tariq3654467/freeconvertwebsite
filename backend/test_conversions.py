import sys
import os
import shutil
import uuid

# Add current path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Base, engine
from models import Job
from routes.convert_routes import perform_conversion

# Create tables
Base.metadata.create_all(bind=engine)

os.makedirs("uploads", exist_ok=True)

# 1. Test PNG to JPG
dummy_img_path = "test_image.png"
if not os.path.exists(dummy_img_path):
    from PIL import Image
    Image.new('RGB', (10, 10)).save(dummy_img_path)

test_id = str(uuid.uuid4())
original_filename = f"{test_id}.png"
shutil.copy(dummy_img_path, os.path.join("uploads", original_filename))

db = SessionLocal()
job = Job(
    original_filename=original_filename,
    target_format="jpg",
    status="pending"
)
db.add(job)
db.commit()
db.refresh(job)
job_id = job.id
db.close()

print(f"Testing PNG to JPG (Job {job_id})")
perform_conversion(job_id, SessionLocal)

db = SessionLocal()
job = db.query(Job).get(job_id)
print(f"Job status: {job.status}")
if job.status == 'done':
    print(f"Success: {job.result_filename}")
else:
    print(f"FAILED")
db.close()

# 2. Test Audio Conversions
# Create dummy mp3?
