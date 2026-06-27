"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { ChevronDown, Upload, Cloud, Link as LinkIcon, HardDrive, FileText, Download, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, ShieldCheck, Zap, Lock, Settings2, X } from 'lucide-react';
import Link from 'next/link';
import ToolsGrid from '../components/ToolsGrid';
import { useAuth } from '../contexts/AuthContext';
import { getToolById } from '../constants/tools';

const API = 'http://127.0.0.1:5000';

/** Signed-in users can queue multiple files per run; guests submit one file at a time. */
const MEMBER_BATCH_MAX = 15;

// ── Format groups shown in <select> ──────────────────────────────────────────
const FORMAT_GROUPS = [
  {
    label: 'Images',
    formats: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'svg', 'heic', 'jfif'],
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
    formats: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'webm'],
  },
];

const ALL_CONVERT_TARGETS = new Set(FORMAT_GROUPS.flatMap(g => g.formats));

/** Raster/image inputs (matches backend IMAGE_EXTENSIONS minus svg). */
const IMAGE_RASTER_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'heic', 'jfif',
]);
const AUDIO_EXTS = new Set(['mp3', 'ogg', 'wav', 'flac', 'm4a']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'mkv', 'wmv', 'webm']);

/**
 * Target formats the backend accepts for this source extension
 * (mirrors backend `_assert_conversion_supported`).
 * Returns null = show full list (unknown source type).
 */
function allowedConversionTargets(originalExt: string): Set<string> | null {
  const o = originalExt.toLowerCase();
  const out = new Set<string>();

  if (o === 'pdf') {
    IMAGE_RASTER_EXTS.forEach(e => out.add(e));
    out.add('docx');
    return out;
  }
  if (o === 'docx') {
    out.add('pdf');
    return out;
  }
  if (o === 'svg') {
    IMAGE_RASTER_EXTS.forEach(e => out.add(e));
    out.add('pdf');
    return out;
  }
  if (IMAGE_RASTER_EXTS.has(o)) {
    IMAGE_RASTER_EXTS.forEach(e => out.add(e));
    out.add('svg');
    out.add('pdf');
    out.add('docx');
    return out;
  }
  if (AUDIO_EXTS.has(o)) {
    AUDIO_EXTS.forEach(e => out.add(e));
    return out;
  }
  if (VIDEO_EXTS.has(o)) {
    VIDEO_EXTS.forEach(e => out.add(e));
    AUDIO_EXTS.forEach(e => out.add(e));
    return out;
  }
  return null;
}

/** Output formats valid for every file in the batch (intersection). */
function intersectTargetsForFiles(fileList: File[]): Set<string> {
  if (!fileList.length) return new Set();
  let result: Set<string> | null = null;
  for (const f of fileList) {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const allowed = allowedConversionTargets(ext);
    const next = allowed === null ? new Set(ALL_CONVERT_TARGETS) : allowed;
    result = result === null ? new Set(next) : new Set(Array.from(result).filter(x => next.has(x)));
  }
  return result ?? new Set();
}

// Tools that are "compress" rather than "convert"
const COMPRESS_IDS = new Set([
  'png-compressor', 'jpg-compressor', 'mp4-compressor',
  'video-compressor', 'audio-compressor', 'pdf-compressor',
  'compress-pdf',
]);

const COMPRESS_GROUPS = {
  Images: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'heic', 'jfif'],
  Audio: ['mp3', 'ogg', 'wav', 'flac', 'm4a'],
  Video: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'webm'],
  Documents: ['pdf'],
} as const;

const COMPRESS_BY_TOOL: Record<string, string[]> = {
  'png-compressor': ['png'],
  'jpg-compressor': ['jpg', 'jpeg'],
  'mp4-compressor': ['mp4'],
  'video-compressor': [...COMPRESS_GROUPS.Video],
  'audio-compressor': [...COMPRESS_GROUPS.Audio],
  'pdf-compressor': ['pdf'],
  'compress-pdf': ['pdf'],
};

type Mode = 'convert' | 'compress';

interface HomeProps {
  initialToolId?: string;
}

export default function Home({ initialToolId }: HomeProps) {
  const { token, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState('png');
  const [mode, setMode] = useState<Mode>('convert');
  const [selectedCompressTool, setSelectedCompressTool] = useState<string>('all');
  const [quality, setQuality] = useState(75);
  const [compressionPreset, setCompressionPreset] = useState<'high' | 'balanced' | 'small' | 'custom'>('balanced');
  const [resizePercent, setResizePercent] = useState(100);
  const [showSettings, setShowSettings] = useState(false);


  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'processing'>('info');
  const [downloadLinks, setDownloadLinks] = useState<{ url: string; name: string }[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } as const : {}),
    [token]
  );

  const waitUntilJobDone = async (jobId: number) => {
    for (;;) {
      const { data } = await axios.get(`${API}/api/convert/status/${jobId}`, { headers: authHeaders });
      if (data.status === 'done') return;
      if (data.status === 'failed') throw new Error('Processing failed.');
      await new Promise(r => setTimeout(r, 1500));
    }
  };
  const allowedCompressExts =
    selectedCompressTool === 'all'
      ? [
          ...COMPRESS_GROUPS.Images,
          ...COMPRESS_GROUPS.Audio,
          ...COMPRESS_GROUPS.Video,
          ...COMPRESS_GROUPS.Documents,
        ]
      : (COMPRESS_BY_TOOL[selectedCompressTool] ?? [
          ...COMPRESS_GROUPS.Images,
          ...COMPRESS_GROUPS.Audio,
          ...COMPRESS_GROUPS.Video,
          ...COMPRESS_GROUPS.Documents,
        ]);
  const compressAccept = allowedCompressExts.map(ext => `.${ext}`).join(',');

  const convertFormatGroups = useMemo(() => {
    if (mode !== 'convert' || files.length === 0) return FORMAT_GROUPS;
    const inter = intersectTargetsForFiles(files);
    if (inter.size === 0) return [];
    return FORMAT_GROUPS.map(g => ({
      ...g,
      formats: g.formats.filter(f => inter.has(f)),
    })).filter(g => g.formats.length > 0);
  }, [mode, files]);

  useEffect(() => {
    if (mode !== 'convert' || files.length === 0) return;
    const flat = intersectTargetsForFiles(files);
    const opts = Array.from(flat);
    if (!opts.length) return;
    setTargetFormat(prev => (opts.includes(prev) ? prev : opts[0]));
  }, [mode, files]);

  const applyToolSelection = useCallback((toolId: string) => {
    const tool = getToolById(toolId);
    if (!tool) return;
    if (COMPRESS_IDS.has(tool.id)) {
      setMode('compress');
      setSelectedCompressTool(tool.id);
    } else {
      setMode('convert');
      setSelectedCompressTool('all');
      if (tool.to) setTargetFormat(tool.to);
    }
    setFiles([]);
    setStatus('');
    setDownloadLinks([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!initialToolId) return;
    applyToolSelection(initialToolId);
  }, [initialToolId, applyToolSelection]);

  // Backward compatibility for any in-page tool dispatches.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const tool = (e as CustomEvent).detail as { id?: string } | undefined;
      if (tool?.id) applyToolSelection(tool.id);
    };
    window.addEventListener('selectTool', handler as EventListener);
    return () => window.removeEventListener('selectTool', handler as EventListener);
  }, [applyToolSelection]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const raw = Array.from(e.target.files);
    const maxFiles = isAuthenticated ? MEMBER_BATCH_MAX : 1;

    let chosen = raw;
    if (mode === 'compress') {
      const valid = chosen.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return allowedCompressExts.includes(ext);
      });
      if (valid.length < chosen.length) {
        setStatusType('error');
        setStatus('Some files were skipped — unsupported type for this compressor.');
      }
      chosen = valid.slice(0, maxFiles);
      if (!chosen.length) {
        setFiles([]);
        setDownloadLinks([]);
        e.target.value = '';
        return;
      }
    } else {
      chosen = chosen.slice(0, maxFiles);
    }

    setFiles(chosen);
    setStatus('');
    setDownloadLinks([]);
  };

  const removeFile = (idx: number) =>
    setFiles(prev => prev.filter((_, i) => i !== idx));

  // ── CONVERT ───────────────────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!files.length) return;
    const common = intersectTargetsForFiles(files);
    if (!common.size || !common.has(targetFormat)) {
      setStatusType('error');
      setStatus('Choose an output format that works for every selected file.');
      return;
    }
    try {
      setDownloadLinks([]);
      setStatusType('processing');
      const links: { url: string; name: string }[] = [];
      const n = files.length;
      for (let i = 0; i < n; i++) {
        setStatus(`Uploading file ${i + 1} of ${n}…`);
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('target_format', targetFormat);
        const { data } = await axios.post(`${API}/api/convert/upload`, formData, { headers: authHeaders });
        setStatus(`Processing file ${i + 1} of ${n}…`);
        await axios.post(`${API}/api/convert/process/${data.job_id}`, {}, { headers: authHeaders });
        await waitUntilJobDone(data.job_id);
        links.push({ url: `${API}/api/convert/download/${data.job_id}`, name: files[i].name });
      }
      setDownloadLinks(links);
      setStatus(n > 1 ? `All ${n} files converted.` : 'Ready!');
      setStatusType('success');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? '')
        : '';
      setStatus(msg || 'Conversion failed.');
      setStatusType('error');
    }
  };

  // ── COMPRESS ──────────────────────────────────────────────────────────────
  const handleCompress = async () => {
    if (!files.length) return;
    const invalid = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return !allowedCompressExts.includes(ext);
    });
    if (invalid.length) {
      setStatusType('error');
      setStatus('Every file must match this compressor’s supported types.');
      return;
    }
    try {
      setDownloadLinks([]);
      setStatusType('processing');
      const links: { url: string; name: string }[] = [];
      const n = files.length;
      for (let i = 0; i < n; i++) {
        setStatus(`Uploading file ${i + 1} of ${n}…`);
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('target_format', files[i].name.split('.').pop()!.toLowerCase());
        const { data } = await axios.post(`${API}/api/convert/upload`, formData, { headers: authHeaders });
        setStatus(`Compressing file ${i + 1} of ${n}…`);
        await axios.post(`${API}/api/convert/compress/${data.job_id}`, {
          quality,
          preset: compressionPreset,
          resize_percent: resizePercent,
        }, { headers: authHeaders });
        await waitUntilJobDone(data.job_id);
        links.push({ url: `${API}/api/convert/download/${data.job_id}`, name: files[i].name });
      }
      setDownloadLinks(links);
      setStatus(n > 1 ? `All ${n} files compressed.` : 'Ready!');
      setStatusType('success');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? '')
        : '';
      setStatus(msg || 'Compression failed.');
      setStatusType('error');
    }
  };

  const actionLabel =
    mode === 'compress'
      ? files.length > 1 ? `Compress all (${files.length})` : 'Compress Now'
      : files.length > 1 ? `Convert all (${files.length})` : 'Convert Now';
  const onAction = mode === 'compress' ? handleCompress : handleConvert;

  return (
    <main className="main-container">
      {/* ── Hero ── */}
      <div className="hero-section animate-fadeInUp stagger-1">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.08)', color: 'var(--primary-color)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.15)' }}>
          <Zap size={14} /> NEW: Prism Engine 2.0 is live!
        </div>
        <h1 className="hero-title">File Conversion,<br />Refined.</h1>
        <p className="hero-subtitle">
          Convert or compress any file — images, audio, video, PDFs and documents.
          Fast, private, and built for focused workflows.
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
        {(['convert', 'compress'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              if (m !== 'compress') setSelectedCompressTool('all');
              setFiles([]);
              setStatus('');
              setDownloadLinks([]);
            }}
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
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Converter Card ── */}
      <div className="converter-card animate-fadeInScale" style={{ marginBottom: '8rem' }}>
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple={isAuthenticated}
          accept={mode === 'compress' ? compressAccept : undefined}
          onChange={handleFileChange}
        />

        {/* Choose button */}
        <div className="choose-btn-group">
          <button className="btn-choose btn-magnetic btn-shine" onClick={() => { fileInputRef.current?.click(); setIsDropdownOpen(false); }}>
            <Upload size={24} />
            Choose File
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

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          {!isAuthenticated ? (
            <>
              Guests can upload up to <strong style={{ color: 'var(--text-muted)' }}>3 files per UTC day</strong>,{' '}
              <strong style={{ color: 'var(--text-muted)' }}>one file per run</strong>.{' '}
              <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Sign in</Link>{' '}
              for unlimited uploads and batch processing.
            </>
          ) : (
            <>
              Signed in: select up to <strong style={{ color: 'var(--text-muted)' }}>{MEMBER_BATCH_MAX} files</strong> at once — the same convert or compress settings apply to each.
            </>
          )}
        </p>

        {mode === 'compress' && (
          <div
            style={{
              marginTop: '1.25rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Supported compression formats
            </div>
            <div>Images: {COMPRESS_GROUPS.Images.join(', ').toUpperCase()}</div>
            <div>Audio: {COMPRESS_GROUPS.Audio.join(', ').toUpperCase()}</div>
            <div>Video: {COMPRESS_GROUPS.Video.join(', ').toUpperCase()}</div>
            <div>Documents: {COMPRESS_GROUPS.Documents.join(', ').toUpperCase()}</div>
            {selectedCompressTool !== 'all' && (
              <div style={{ marginTop: '0.45rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                Selected tool accepts: {allowedCompressExts.join(', ').toUpperCase()}
              </div>
            )}
          </div>
        )}

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

            {/* Target format selector (convert only) */}
            {mode === 'convert' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-glass)', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', flexShrink: 0 }}>Convert to:</span>
                  {convertFormatGroups.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600, textAlign: 'right' }}>
                      No shared format for this selection
                    </span>
                  ) : (
                  <select
                    value={targetFormat}
                    onChange={e => setTargetFormat(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', outline: 'none', maxWidth: '52%' }}
                  >
                    {convertFormatGroups.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {g.formats.map(f => (
                          <option key={f} value={f}>{f.toUpperCase()}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  )}
                </div>
                {files.length === 1 &&
                  allowedConversionTargets(files[0].name.split('.').pop()?.toLowerCase() || '') !== null && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', paddingLeft: '0.25rem' }}>
                    Only output formats supported for your uploaded file are listed.
                  </p>
                )}
                {files.length > 1 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', paddingLeft: '0.25rem' }}>
                    Batch: only formats that work for every selected file are listed. Same format applies to all.
                  </p>
                )}
              </div>
            )}

            {/* Compression settings */}
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
                    {/* Compression Presets */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        Preset:
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { key: 'high', label: 'High Quality', quality: 90 },
                          { key: 'balanced', label: 'Balanced', quality: 75 },
                          { key: 'small', label: 'Small Size', quality: 50 }
                        ].map(preset => (
                          <button
                            key={preset.key}
                            onClick={() => {
                              setCompressionPreset(preset.key as any);
                              setQuality(preset.quality);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: compressionPreset === preset.key ? 'var(--primary-color)' : 'var(--border-glass)',
                              background: compressionPreset === preset.key ? 'rgba(99,102,241,0.1)' : 'transparent',
                              color: compressionPreset === preset.key ? 'var(--primary-color)' : 'var(--text-main)',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              flex: 1
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Quality Slider */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        Quality: {quality}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={95}
                        value={quality}
                        onChange={e => {
                          setQuality(Number(e.target.value));
                          setCompressionPreset('custom' as any); // Mark as custom
                        }}
                        style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span>Smaller file</span>
                        <span>Better quality</span>
                      </div>
                    </div>

                    {/* Resize Option (for images) */}
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        Resize: {resizePercent}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={10}
                        value={resizePercent}
                        onChange={e => setResizePercent(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span>Smaller</span>
                        <span>Original</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn-choose"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                justifyContent: 'center',
                opacity: mode === 'convert' && convertFormatGroups.length === 0 ? 0.55 : 1,
                cursor: mode === 'convert' && convertFormatGroups.length === 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={mode === 'convert' && convertFormatGroups.length === 0}
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
        {downloadLinks.length > 0 && (
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            {downloadLinks.map((dl, idx) => (
              <a
                key={`${dl.url}-${idx}`}
                href={dl.url}
                className="btn-choose"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
                  textDecoration: 'none',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                  fontSize: downloadLinks.length > 1 ? '0.95rem' : undefined,
                }}
              >
                <Download size={22} /> Download{downloadLinks.length > 1 ? `: ${dl.name}` : ' Result'}
              </a>
            ))}
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
