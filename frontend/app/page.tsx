"use client";

import { useState, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('png');
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'processing'>('info');
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <h1 className="hero-title">File Converter</h1>
        <p className="hero-subtitle">
          Easily convert files from one format to another, online. 
          Fast, free, and secure.
        </p>
      </div>

      <div className="converter-card">
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
            <ChevronDown size={20} />
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
          <div style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '400px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <FileText color="var(--primary-color)" />
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Convert to:</span>
              <select 
                value={targetFormat} 
                onChange={(e) => setTargetFormat(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <button className="btn-choose" style={{ width: '100%', borderRadius: 'var(--radius-md)' }} onClick={handleUpload}>
              Convert
            </button>
          </div>
        )}

        {status && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className={`status-badge status-${statusType}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              {statusType === 'processing' && <Loader2 size={16} className="animate-spin" />}
              {statusType === 'success' && <CheckCircle2 size={16} />}
              {statusType === 'error' && <AlertCircle size={16} />}
              {status}
            </div>
          </div>
        )}

        {downloadLink && (
          <div style={{ marginTop: '1.5rem' }}>
            <a href={downloadLink} className="btn-choose" style={{ width: '100%', borderRadius: 'var(--radius-md)', background: '#28a745', textDecoration: 'none', justifyContent: 'center' }}>
              <Download size={20} />
              Download Result
            </a>
          </div>
        )}

        <div className="info-text">
          Max file size 1GB. <Link href="/signup">Sign Up</Link> for more
        </div>
        <div className="terms-text">
          By proceeding, you agree to our <Link href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Use</Link>.
        </div>
      </div>
    </main>
  );
}
