"use client";

import React, { useState, useRef } from 'react';
import { 
  Type, Link, FormInput, Image, PenTool, Eraser, 
  MessageSquare, Square, Undo, Save, Download, FilePlus 
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

export default function PdfEditorComponent() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
    }
  };

  const applyWatermark = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText('EDITED WITH PRISM CONVERT', {
          x: width / 4,
          y: height / 2,
          size: 30,
          color: rgb(0.95, 0.1, 0.1),
          opacity: 0.5,
          rotate: { type: 'degrees', angle: 45 }
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url); // update preview
      
      // trigger download of edited file
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${pdfFile.name}`;
      a.click();
      
    } catch (error) {
      console.error("Error applying watermark:", error);
      alert("Failed to edit PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', backgroundColor: 'var(--bg-main)' }}>
      
      {/* HEADER TABS - matching Sedja style logic */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>PDF Editor</h2>
        <div style={{ flex: 1, display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <span>All Tools</span>
          <span>Compress</span>
          <span>Edit</span>
          <span>Fill & Sign</span>
          <span>Merge</span>
          <span>Delete Pages</span>
          <span>Crop</span>
        </div>
      </div>

      {/* Editor ToolBar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', gap: '5px', background: 'var(--bg-secondary)', padding: '5px', borderRadius: '5px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          <button className="pdf-tool-btn"><Type size={16}/> Text</button>
          <button className="pdf-tool-btn"><Link size={16}/> Links</button>
          <button className="pdf-tool-btn"><FormInput size={16}/> Forms</button>
          <button className="pdf-tool-btn"><Image size={16}/> Images</button>
          <button className="pdf-tool-btn"><PenTool size={16}/> Sign</button>
          <button className="pdf-tool-btn"><Eraser size={16}/> Whiteout</button>
          <button className="pdf-tool-btn"><MessageSquare size={16}/> Annotate</button>
          <button className="pdf-tool-btn"><Square size={16}/> Shapes</button>
          <div style={{ width: '1px', background: '#e5e7eb', margin: '0 5px' }} />
          <button className="pdf-tool-btn"><Undo size={16}/> Undo</button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', padding: '2rem', justifyContent: 'center', overflow: 'hidden' }}>
        {!pdfUrl ? (
          <div style={{ 
            width: '100%', maxWidth: '800px', border: '2px dashed var(--border-glass)', 
            borderRadius: '10px', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)' 
          }}>
            <FilePlus size={48} color="var(--primary-color)" style={{ marginBottom: '1rem'}}/>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Upload a PDF to edit</h3>
            <input 
              type="file" 
              accept=".pdf" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--primary-gradient)', color: 'white', padding: '0.75rem 1.5rem',
                borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: 'var(--shadow-glow)'
              }}
            >
              Select PDF Document
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`} 
              style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }} 
              title="PDF Preview"
            />
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={applyWatermark}
                disabled={isProcessing}
                style={{
                  background: 'var(--primary-gradient)', color: 'white', padding: '0.75rem 2rem',
                  borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                  fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                {isProcessing ? 'Processing...' : 'Apply changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pdf-tool-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          padding: 8px 12px;
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 4px;
        }
        .pdf-tool-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--border-glass);
          color: var(--primary-color);
        }
      `}} />
    </div>
  );
}
