#!/usr/bin/env python3
"""
Comprehensive test suite for all file conversions
Tests image, audio, video, PDF, and document conversions
"""

import os
import sys
import json
import requests
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:5000/api"
UPLOAD_FOLDER = "uploads"
TEST_FILES = {
    'test_image.png': 'image',
    'test_image.jpg': 'image',
    'test_audio.mp3': 'audio',
    'test_video.mp4': 'video',
    'test_document.pdf': 'document',
}

# Test conversions mapping
CONVERSION_TESTS = {
    'image': [
        # Image to image conversions
        ('test_image.png', ['jpg', 'webp', 'bmp', 'gif', 'tiff']),
        ('test_image.jpg', ['png', 'webp', 'bmp', 'gif']),
    ],
    'pdf': [
        # PDF conversions
        ('test_document.pdf', ['png', 'jpg', 'docx']),
    ],
    'audio': [
        # Audio conversions
        ('test_audio.mp3', ['wav', 'ogg', 'flac', 'm4a']),
    ],
    'video': [
        # Video conversions
        ('test_video.mp4', ['webm', 'avi', 'mov']),
    ],
}

# ANSI colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def create_test_image():
    """Create a test image file"""
    try:
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save('test_image.png')
        print(f"{GREEN}✓{RESET} Created test_image.png")
        return True
    except Exception as e:
        print(f"{RED}✗{RESET} Failed to create test image: {e}")
        return False

def create_test_pdf():
    """Create a test PDF file"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        c = canvas.Canvas("test_document.pdf", pagesize=letter)
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 730, "This is a test document for conversion testing.")
        c.save()
        print(f"{GREEN}✓{RESET} Created test_document.pdf")
        return True
    except Exception as e:
        print(f"{RED}✗{RESET} Failed to create test PDF: {e}")
        return False

def create_test_audio():
    """Create a test audio file"""
    try:
        from pydub import AudioSegment
        # Create 1 second of silence at 44.1kHz
        audio = AudioSegment.silent(duration=1000, frame_rate=44100)
        audio.export("test_audio.mp3", format="mp3", bitrate="128k")
        print(f"{GREEN}✓{RESET} Created test_audio.mp3")
        return True
    except Exception as e:
        print(f"{RED}✗{RESET} Failed to create test audio: {e}")
        return False

def create_test_video():
    """Create a test video file"""
    try:
        import subprocess
        # Use ffmpeg to create a simple test video
        cmd = [
            'ffmpeg', '-f', 'lavfi', '-i', 'color=c=red:s=640x480:d=1',
            '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono:d=1',
            '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-c:a', 'aac',
            'test_video.mp4', '-y', '-loglevel', 'error'
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode == 0:
            print(f"{GREEN}✓{RESET} Created test_video.mp4")
            return True
        else:
            print(f"{YELLOW}⚠{RESET} Could not create test video (ffmpeg issue)")
            return False
    except Exception as e:
        print(f"{YELLOW}⚠{RESET} Skipping video tests: {e}")
        return False

def create_test_files():
    """Create all necessary test files"""
    print("\n" + "="*50)
    print("Creating test files...")
    print("="*50)
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    success = True
    success &= create_test_image()
    success &= create_test_pdf()
    success &= create_test_audio()
    # Video creation is optional
    create_test_video()
    
    return success

def test_upload_and_convert(source_file, target_format):
    """Test uploading and converting a file"""
    try:
        # Check if source file exists
        if not os.path.exists(source_file):
            return f"{YELLOW}SKIP{RESET}", f"Source file not found"
        
        # Upload file
        with open(source_file, 'rb') as f:
            files = {'file': f}
            data = {'target_format': target_format}
            upload_response = requests.post(
                f"{BASE_URL}/convert/upload",
                files=files,
                data=data,
                timeout=10
            )
        
        if upload_response.status_code not in [200, 201]:
            return f"{RED}FAIL{RESET}", f"Upload failed: {upload_response.text}"
        
        job_id = upload_response.json().get('job_id')
        
        # Process the conversion
        process_response = requests.post(
            f"{BASE_URL}/convert/process/{job_id}",
            timeout=60
        )
        
        if process_response.status_code != 200:
            return f"{RED}FAIL{RESET}", f"Conversion failed: {process_response.text}"
        
        # Check status
        status_response = requests.get(
            f"{BASE_URL}/convert/status/{job_id}",
            timeout=10
        )
        
        if status_response.status_code == 200:
            status = status_response.json().get('status')
            if status == 'done':
                return f"{GREEN}PASS{RESET}", "Success"
            else:
                return f"{RED}FAIL{RESET}", f"Status: {status}"
        else:
            return f"{RED}FAIL{RESET}", "Could not get status"
            
    except requests.exceptions.ConnectionError:
        return f"{RED}ERR{RESET}", "Cannot connect to server (is it running?)"
    except Exception as e:
        return f"{RED}ERR{RESET}", str(e)

def main():
    """Run all conversion tests"""
    print("\n" + "="*70)
    print("FREECONVERT - File Conversion Test Suite".center(70))
    print("="*70)
    
    # Create test files
    if not create_test_files():
        print(f"\n{YELLOW}⚠ Warning: Some test files could not be created{RESET}")
    
    # Run conversion tests
    print("\n" + "="*70)
    print("Running conversion tests...")
    print("="*70)
    
    results = {}
    test_count = 0
    pass_count = 0
    fail_count = 0
    
    for file_type, conversions in CONVERSION_TESTS.items():
        print(f"\n{file_type.upper()} CONVERSIONS:")
        print("-" * 70)
        
        for source_file, target_formats in conversions:
            if not os.path.exists(source_file):
                print(f"  ⚠  {source_file:30} → (file not found, skipping)")
                continue
                
            for target_format in target_formats:
                test_count += 1
                status, message = test_upload_and_convert(source_file, target_format)
                
                if "PASS" in status:
                    pass_count += 1
                elif "FAIL" in status:
                    fail_count += 1
                
                # Format output
                conversion_str = f"{source_file} → {target_format}"
                print(f"  {status} {conversion_str:40} {message}")
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY".center(70))
    print("="*70)
    print(f"Total Tests:  {test_count}")
    print(f"{GREEN}Passed:      {pass_count}{RESET}")
    print(f"{RED}Failed:      {fail_count}{RESET}")
    
    if test_count > 0:
        pass_rate = (pass_count / test_count) * 100
        print(f"Pass Rate:    {pass_rate:.1f}%")
    
    print("="*70 + "\n")
    
    return 0 if fail_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
