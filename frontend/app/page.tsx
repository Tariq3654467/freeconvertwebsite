"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronDown,
  Upload,
  Cloud,
  Link as LinkIcon,
  HardDrive,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import ToolsGrid from '../components/ToolsGrid';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('png');
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'processing'>('info');
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleSelect = (e: any) => {
        const tool = e.detail;
        if (tool.to) setTargetFormat(tool.to);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      window.addEventListener('selectTool', handleSelect);
      return () => window.removeEventListener('selectTool', handleSelect);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
      setDownloadLink('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setIsDropdownOpen(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setStatus('Uploading...');
      setStatusType('processing');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_format', targetFormat);

      const response = await axios.post('http://127.0.0.1:5000/api/convert/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      processFile(response.data.job_id);
    } catch (err) {
      console.error(err);
      setStatus('Upload failed.');
      setStatusType('error');
    }
  };

  const processFile = async (id: number) => {
    try {
      setStatus('Processing...');
      setStatusType('processing');
      await axios.post(`http://127.0.0.1:5000/api/convert/process/${id}`);
      checkStatus(id);
    } catch (err) {
      console.error(err);
      setStatus('Processing failed.');
      setStatusType('error');
    }
  };

  const checkStatus = async (id: number) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/convert/status/${id}`);
      if (response.data.status === 'done') {
        setStatus('Ready!');
        setStatusType('success');
        setDownloadLink(`http://127.0.0.1:5000/api/convert/download/${id}`);
      } else if (response.data.status === 'failed') {
        setStatus('Conversion failed.');
        setStatusType('error');
      } else {
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="main-container">
      <div className="hero-section">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Zap size={14} /> NEW: Prism Engine 2.0 is live!
        </div>
        <h1 className="hero-title">File Conversion,<br/>Refined.</h1>
        <p className="hero-subtitle">
          Experience the next generation of online file conversion. 
          Fast, private, and powered by our ultra-secure Prism engine.
        </p>

        {/* Trust Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '4rem', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <ShieldCheck size={18} /> <span>SSL Encrypted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Lock size={18} /> <span>Private Processing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Download size={18} /> <span>10k+ Files Daily</span>
          </div>
        </div>
      </div>

      <div className="converter-card" style={{ marginBottom: '8rem' }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="choose-btn-group">
          <button className="btn-choose" onClick={triggerFileInput}>
            <Upload size={24} />
            Choose Files
          </button>
          <button
            className="btn-dropdown"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <ChevronDown size={22} />
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={triggerFileInput}>
                <HardDrive size={18} /> From Device
              </button>
              <button className="dropdown-item">
                <Cloud size={18} /> Google Drive
              </button>
              <button className="dropdown-item">
                <Cloud size={18} /> Dropbox
              </button>
              <button className="dropdown-item">
                <LinkIcon size={18} /> From URL
              </button>
            </div>
          )}
        </div>

        {file && (
          <div style={{ marginTop: '2.5rem', textAlign: 'left', maxWidth: '450px', margin: '2.5rem auto' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '1.5rem', 
              padding: '1.25rem', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-glass)' 
            }}>
              <FileText color="var(--primary-color)" size={24} />
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Format:</span>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <optgroup label="Images" style={{ background: 'var(--bg-secondary)' }}>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WEBP</option>
                </optgroup>
                <optgroup label="Documents" style={{ background: 'var(--bg-secondary)' }}>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </optgroup>
                <optgroup label="Media" style={{ background: 'var(--bg-secondary)' }}>
                  <option value="mp3">MP3</option>
                  <option value="mp4">MP4</option>
                  <option value="ogg">OGG</option>
                </optgroup>
              </select>
            </div>

            <button className="btn-choose" style={{ width: '100%', borderRadius: 'var(--radius-lg)', justifyContent: 'center' }} onClick={handleUpload}>
              Convert Now
            </button>
          </div>
        )}

        {status && (
          <div style={{ marginTop: '2rem' }}>
            <div className={`status-badge status-${statusType}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
              {statusType === 'processing' && <Loader2 size={18} className="animate-spin" />}
              {statusType === 'success' && <CheckCircle2 size={18} />}
              {statusType === 'error' && <AlertCircle size={18} />}
              {status}
            </div>
          </div>
        )}

        {downloadLink && (
          <div style={{ marginTop: '2rem' }}>
            <a href={downloadLink} className="btn-choose" style={{ 
              width: '100%', 
              borderRadius: 'var(--radius-lg)', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              textDecoration: 'none', 
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}>
              <Download size={22} />
              Download Result
            </a>
          </div>
        )}

        <div className="info-text" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2rem' }}>
          Max file size <span style={{ color: 'var(--text-muted)' }}>1GB</span>. <Link href="/signup" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Upgrade to Pro</Link> for more.
        </div>
      </div>

      <ToolsGrid />
    </main>
  );
}
