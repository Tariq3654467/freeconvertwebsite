"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API = 'http://127.0.0.1:5000';

const PAGE_KEYS = [
  { key: 'home-page', label: 'Home page' },
  { key: 'blog-page', label: 'Blog page' },
  { key: 'convert-page', label: 'Conversion page' },
  { key: 'compress-page', label: 'Compression page' },
  { key: 'unit-converter-page', label: 'Unit converter page' },
  { key: 'pdf-editor-page', label: 'PDF editor page' },
  { key: 'login-page', label: 'Login page' },
  { key: 'signup-page', label: 'Signup page' },
  { key: 'profile-page', label: 'Profile page' },
];

export default function AdminPagesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(PAGE_KEYS[0].key);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/pages/${selected}`);
        setTitle(res.data.title || '');
        setSubtitle(res.data.subtitle || '');
        setBody(res.data.body || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selected]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/pages/${selected}`, { title, subtitle, body }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Saved');
    } catch (err) {
      setMessage('Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Page content</h1>
          <p className="admin-page-subtitle">Update the text shown on conversion, compression, and other public pages.</p>
        </div>
        <button className="admin-btn-secondary" onClick={() => router.push('/admin')}>Back</button>
      </div>

      <div className="admin-form-container">
        <div className="admin-form-group">
          <label>Page</label>
          <select className="admin-form-select" value={selected} onChange={(e) => { setSelected(e.target.value); setLoading(true); }}>
            {PAGE_KEYS.map((page) => <option key={page.key} value={page.key}>{page.label}</option>)}
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input className="admin-form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Subtitle</label>
              <input className="admin-form-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Body</label>
              <textarea className="admin-form-textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            {message ? <p className="admin-page-subtitle">{message}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
