#!/usr/bin/env python3
"""
Focused test suite for conversions that don't require FFmpeg
Tests: Image conversions, PDF conversions, DOCX conversions
"""

import os
import sys
import json
import requests
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:5000/api"
UPLOAD_FOLDER = "uploads"

# ANSI colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def create_test_image():
    """Create a test image file"""
    try:
        from PIL import Image
        img = Image.new('RGB', (200, 200), color='blue')
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
        c.drawString(100, 710, "It contains multiple lines of text.")
        c.save()
        print(f"{GREEN}✓{RESET} Created test_document.pdf")
        return True
    except Exception as e:
        print(f"{RED}✗{RESET} Failed to create test PDF: {e}")
        return False

def create_test_files():
    """Create all necessary test files"""
    print("\n" + "="*70)
    print("Creating test files...")
    print("="*70 + "\n")
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    success = True
    success &= create_test_image()
    success &= create_test_pdf()
    
    return success

def test_conversion(source_file, target_format):
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
            return f"{RED}FAIL{RESET}", f"Upload failed: {upload_response.json()}"
        
        job_id = upload_response.json().get('job_id')
        
        # Process the conversion
        process_response = requests.post(
            f"{BASE_URL}/convert/process/{job_id}",
            timeout=60
        )
        
        if process_response.status_code != 200:
            error_msg = process_response.json().get('message', 'Unknown error')
            return f"{RED}FAIL{RESET}", error_msg[:50]
        
        # Check status
        status_response = requests.get(
            f"{BASE_URL}/convert/status/{job_id}",
            timeout=10
        )
        
        if status_response.status_code == 200:
            status = status_response.json().get('status')
            if status == 'done':
                return f"{GREEN}PASS{RESET}", "✓ Success"
            else:
                return f"{RED}FAIL{RESET}", f"Status: {status}"
        else:
            return f"{RED}FAIL{RESET}", "Could not get status"
            
    except requests.exceptions.ConnectionError:
        return f"{RED}ERR{RESET}", "Cannot connect to server"
    except Exception as e:
        return f"{RED}ERR{RESET}", str(e)[:40]

def main():
    """Run conversion tests"""
    print("\n" + "="*70)
    print("FREECONVERT - Core Conversion Tests".center(70))
    print("(Image, PDF, Document conversions - no FFmpeg required)".center(70))
    print("="*70)
    
    # Create test files
    if not create_test_files():
        print(f"\n{RED}Error: Could not create test files{RESET}")
        return 1
    
    # Run conversion tests
    print("\n" + "="*70)
    print("Running conversion tests...")
    print("="*70)
    
    # Test matrix
    tests = [
        ("IMAGE CONVERSIONS", [
            ("test_image.png", ["jpg", "webp", "bmp", "gif", "tiff", "png"]),
        ]),
        ("PDF CONVERSIONS", [
            ("test_document.pdf", ["jpg", "png"]),
        ]),
        ("DOCUMENT CONVERSIONS", [
            ("test_document.pdf", ["docx"]),
        ]),
    ]
    
    total = 0
    passed = 0
    failed = 0
    
    for category, conversions in tests:
        print(f"\n{category}:")
        print("-" * 70)
        
        for source_file, target_formats in conversions:
            if not os.path.exists(source_file):
                print(f"  ⚠  {source_file:30} (file not found)")
                continue
                
            for target_format in target_formats:
                total += 1
                status, message = test_conversion(source_file, target_format)
                
                if "PASS" in status:
                    passed += 1
                elif "FAIL" in status or "ERR" in status:
                    failed += 1
                
                # Format output
                conversion_str = f"{source_file} → {target_format}"
                print(f"  {status} {conversion_str:40} {message}")
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY".center(70))
    print("="*70)
    print(f"Total Tests:  {total}")
    print(f"{GREEN}Passed:      {passed}{RESET}")
    print(f"{RED}Failed:      {failed}{RESET}")
    
    if total > 0:
        pass_rate = (passed / total) * 100
        print(f"Pass Rate:    {pass_rate:.1f}%")
    
    print("="*70)
    
    # Note about missing dependencies
    print("\n" + "⚠️  NOTES:".center(70))
    print("-" * 70)
    print("• Audio/Video conversions require FFmpeg")
    print("• SVG conversions require cairosvg and Cairo library")
    print("• Image-to-SVG requires vtracer")
    print("\nTo install FFmpeg on Windows:")
    print("  1. Download from: https://ffmpeg.org/download.html")
    print("  2. Add FFmpeg/bin to your PATH environment variable")
    print("="*70 + "\n")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
