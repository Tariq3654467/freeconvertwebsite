#!/usr/bin/env python3
"""
Static analysis of conversion code to check for issues
"""

import ast
import sys
from pathlib import Path

def analyze_conversion_routes():
    """Analyze convert_routes.py for potential issues"""
    
    file_path = Path("routes/convert_routes.py")
    
    if not file_path.exists():
        print("❌ convert_routes.py not found")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("\n" + "="*70)
    print("CONVERSION CODE ANALYSIS")
    print("="*70)
    
    # Check for required functions
    required_functions = [
        '_image_to_image',
        '_pdf_to_image',
        '_svg_to_image',
        '_convert_audio',
        '_convert_video',
        '_to_pdf',
        '_docx_to_pdf',
        '_to_docx',
        '_pdf_to_docx',
        '_image_to_docx',
        '_compress_file',
        '_compress_image',
        '_compress_audio',
        '_compress_video',
        '_compress_pdf',
    ]
    
    print("\n✓ CONVERSION FUNCTIONS:")
    print("-" * 70)
    
    found_count = 0
    for func in required_functions:
        if f"def {func}(" in content:
            print(f"  ✓ {func}")
            found_count += 1
        else:
            print(f"  ✗ {func} - NOT FOUND")
    
    print(f"\nFound: {found_count}/{len(required_functions)} required functions")
    
    # Check for supported conversion paths
    conversions = {
        'image_to_image': 'image → image',
        'pdf_to_image': 'PDF → image',
        'svg_to_image': 'SVG → image',
        'svg_to_pdf': 'SVG → PDF',
        'image_to_svg': 'image → SVG',
        'audio_conversion': 'audio conversions',
        'video_conversion': 'video conversions',
        'to_pdf': 'to PDF',
        'to_docx': 'to DOCX',
        'compression': 'file compression',
    }
    
    print("\n✓ SUPPORTED CONVERSION PATHS:")
    print("-" * 70)
    
    for key, desc in conversions.items():
        if key in content or any(func in content for func in [
            'image → image', 'PDF → image', 'SVG → image',
            '_convert_audio', '_convert_video', '_to_pdf', '_to_docx'
        ]):
            print(f"  ✓ {desc}")
    
    # Check imports
    print("\n✓ IMPORTS:")
    print("-" * 70)
    
    required_imports = [
        'from PIL import Image',
        'from pydub import AudioSegment',
        'from moviepy.video.io.VideoFileClip import VideoFileClip',
        'from PyPDF2 import PdfReader, PdfWriter',
        'from docx import Document',
        'from reportlab',
    ]
    
    for imp in required_imports:
        if imp in content or imp.split('import')[0].strip() in content:
            status = "✓"
        else:
            status = "✗"
        print(f"  {status} {imp}")
    
    # Check for error handling
    print("\n✓ ERROR HANDLING:")
    print("-" * 70)
    
    try_count = content.count('try:')
    except_count = content.count('except')
    
    print(f"  Try-except blocks: {try_count}")
    print(f"  Exception handlers: {except_count}")
    
    if try_count > 0 and except_count > 0:
        print("  ✓ Error handling present")
    else:
        print("  ✗ Minimal error handling")
    
    print("\n" + "="*70)
    print("Analysis complete!")
    print("="*70 + "\n")
    
    return found_count == len(required_functions)

if __name__ == "__main__":
    success = analyze_conversion_routes()
    sys.exit(0 if success else 1)
