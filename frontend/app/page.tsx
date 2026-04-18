"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronDown, Upload, Cloud, Link as LinkIcon, HardDrive,
  FileText, Download, CheckCircle2, AlertCircle, Loader2,
  ShieldCheck, Zap, Lock, Layers, Settings2, X
} from 'lucide-react';
import Link from 'next/link';
import ToolsGrid from '../components/ToolsGrid';

const API = 'http://127.0.0.1:5000';

// ── Format groups shown in <select> ──────────────────────────────────────────
const FORMAT_GROUPS = [
  {
    label: 'Images',
    formats: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'svg', 'heic', 'jfif'],
  },
  {
    label: 'Documents',
    formats: ['pdf', 'docx'],
  },
  {
    label: 'Audio',
    formats: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
  },
  {
    label: 'Video',
    formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  },
];

// Tools that are "compress" rather than "convert"
const COMPRESS_IDS = new Set([
  'png-compressor', 'jpg-compressor', 'mp4-compressor',
  'video-compressor', 'audio-compressor', 'pdf-compressor',
  'compress-pdf',
]);

type Mode = 'convert' | 'compress' | 'merge';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState('png');
  const [mode, setMode] = useState<Mode>('convert');
  const [quality, setQuality] = useState(75);
  const [showSettings, setShowSettings] = useState(false);

  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'processing'>('info');
  const [downloadLink, setDownloadLink] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Listen for tool-grid selections
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: any) => {
      const tool = e.detail;
      if (COMPRESS_IDS.has(tool.id)) {
        setMode('compress');
      } else if (tool.id === 'merge-pdf') {
        setMode('merge');
      } else {
        setMode('convert');
        if (tool.to) setTargetFormat(tool.to);
      }
      setFiles([]);
      setStatus('');
      setDownloadLink('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('selectTool', handler);
    return () => window.removeEventListener('selectTool', handler);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const chosen = Array.from(e.target.files);
    setFiles(mode === 'merge' ? chosen : chosen.slice(0, 1));
    setStatus('');
    setDownloadLink('');
  };

  const removeFile = (idx: number) =>
    setFiles(prev => prev.filter((_, i) => i !== idx));

  // ── CONVERT ───────────────────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!files.length) return;
    try {
      setStatus('Uploading…');
      setStatusType('processing');
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('target_format', targetFormat);

      const { data } = await axios.post(`${API}/api/convert/upload`, formData);
      await runProcess(data.job_id);
    } catch {
      setStatus('Upload failed.');
      setStatusType('error');
    }
  };

  const runProcess = async (jobId: number) => {
    try {
      setStatus('Processing…');
      setStatusType('processing');
      await axios.post(`${API}/api/convert/process/${jobId}`);
      pollStatus(jobId);
    } catch {
      setStatus('Processing failed.');
      setStatusType('error');
    }
  };

  // ── COMPRESS ──────────────────────────────────────────────────────────────
  const handleCompress = async () => {
    if (!files.length) return;
    try {
      setStatus('Uploading…');
      setStatusType('processing');
      const formData = new FormData();
      formData.append('file', files[0]);
      // target_format = 'compress' signals the process route
      formData.append('target_format', files[0].name.split('.').pop()!.toLowerCase());

      const { data } = await axios.post(`${API}/api/convert/upload`, formData);
      // Use dedicated compress endpoint
      setStatus('Compressing…');
      await axios.post(`${API}/api/convert/compress/${data.job_id}`, { quality });
      pollStatus(data.job_id);
    } catch {
      setStatus('Compression failed.');
      setStatusType('error');
    }
  };

  // ── MERGE PDF ─────────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (files.length < 2) {
      setStatus('Select at least 2 PDF files to merge.');
      setStatusType('error');
      return;
    }
    try {
      setStatus('Uploading…');
      setStatusType('processing');
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      const { data } = await axios.post(`${API}/api/convert/upload-multiple`, formData);
      await runProcess(data.job_id);
    } catch {
      setStatus('Merge failed.');
      setStatusType('error');
    }
  };

  const pollStatus = async (id: number) => {
    try {
      const { data } = await axios.get(`${API}/api/convert/status/${id}`);
      if (data.status === 'done') {
        setStatus('Ready!');
        setStatusType('success');
        setDownloadLink(`${API}/api/convert/download/${id}`);
      } else if (data.status === 'failed') {
        setStatus('Conversion failed.');
        setStatusType('error');
      } else {
        setTimeout(() => pollStatus(id), 2000);
      }
    } catch {
      /* silent */
    }
  };

  const modeLabel = mode === 'compress' ? 'Compress' : mode === 'merge' ? 'Merge PDFs' : 'Convert';
  const actionLabel = mode === 'compress' ? 'Compress Now' : mode === 'merge' ? 'Merge Now' : 'Convert Now';
  const onAction = mode === 'compress' ? handleCompress : mode === 'merge' ? handleMerge : handleConvert;

  return (
    <main className="main-container">
      {/* ── Hero ── */}
      <div className="hero-section">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.08)', color: 'var(--primary-color)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.15)' }}>
          <Zap size={14} /> NEW: Prism Engine 2.0 is live!
        </div>
        <h1 className="hero-title">File Conversion,<br />Refined.</h1>
        <p className="hero-subtitle">
          Convert, compress, or merge any file — images, audio, video, PDFs and documents.
          Fast, private, powered by Prism Engine.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '4rem', opacity: 0.7 }}>
          {[['ShieldCheck', 'SSL Encrypted'], ['Lock', 'Private Processing'], ['Download', '10k+ Files Daily']].map(([, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              {label === 'SSL Encrypted' && <ShieldCheck size={18} />}
              {label === 'Private Processing' && <Lock size={18} />}
              {label === '10k+ Files Daily' && <Download size={18} />}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {(['convert', 'compress', 'merge'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setFiles([]); setStatus(''); setDownloadLink(''); }}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '2rem',
              border: '1px solid',
              borderColor: mode === m ? 'var(--primary-color)' : 'var(--border-glass)',
              background: mode === m ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: mode === m ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {m === 'merge' ? 'Merge PDF' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Converter Card ── */}
      <div className="converter-card" style={{ marginBottom: '8rem' }}>
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={mode === 'merge' ? '.pdf' : undefined}
          multiple={mode === 'merge'}
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={mergeInputRef}
          style={{ display: 'none' }}
          accept=".pdf"
          multiple
          onChange={handleFileChange}
        />

        {/* Choose button */}
        <div className="choose-btn-group">
          <button className="btn-choose" onClick={() => { fileInputRef.current?.click(); setIsDropdownOpen(false); }}>
            {mode === 'merge' ? <Layers size={24} /> : <Upload size={24} />}
            {mode === 'merge' ? 'Choose PDFs' : 'Choose File'}
          </button>
          {mode === 'convert' && (
            <button className="btn-dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <ChevronDown size={22} />
            </button>
          )}
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { fileInputRef.current?.click(); setIsDropdownOpen(false); }}>
                <HardDrive size={18} /> From Device
              </button>
              <button className="dropdown-item"><Cloud size={18} /> Google Drive</button>
              <button className="dropdown-item"><Cloud size={18} /> Dropbox</button>
              <button className="dropdown-item"><LinkIcon size={18} /> From URL</button>
            </div>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginTop: '2.5rem', maxWidth: '480px', margin: '2.5rem auto 0' }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', padding: '1rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <FileText color="var(--primary-color)" size={22} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Add more PDFs button (merge mode) */}
            {mode === 'merge' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', background: 'transparent', border: '1px dashed var(--border-glow)', borderRadius: '10px', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                + Add More PDFs
              </button>
            )}

            {/* Target format selector (convert only) */}
            {mode === 'convert' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Convert to:</span>
                <select
                  value={targetFormat}
                  onChange={e => setTargetFormat(e.target.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                >
                  {FORMAT_GROUPS.map(g => (
                    <optgroup key={g.label} label={g.label}>
                      {g.formats.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {/* Compression quality slider */}
            {mode === 'compress' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', marginBottom: '0.75rem' }}
                >
                  <Settings2 size={16} /> {showSettings ? 'Hide' : 'Show'} Settings
                </button>
                {showSettings && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={95}
                      value={quality}
                      onChange={e => setQuality(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>Smaller file</span>
                      <span>Better quality</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className="btn-choose"
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', justifyContent: 'center' }}
              onClick={onAction}
            >
              {actionLabel}
            </button>
          </div>
        )}

        {/* Status badge */}
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

        {/* Download */}
        {downloadLink && (
          <div style={{ marginTop: '2rem' }}>
            <a href={downloadLink} className="btn-choose" style={{ width: '100%', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', textDecoration: 'none', justifyContent: 'center', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              <Download size={22} /> Download Result
            </a>
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2rem' }}>
          Max file size <span style={{ color: 'var(--text-muted)' }}>1 GB</span>.{' '}
          <Link href="/signup" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Upgrade to Pro</Link> for more.
        </div>
      </div>

      <ToolsGrid />
    </main>
  );
}
