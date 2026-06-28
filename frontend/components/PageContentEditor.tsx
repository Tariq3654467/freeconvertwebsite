"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://127.0.0.1:5000';

interface PageContentEditorProps {
  pageKey: string;
  titleLabel?: string;
  subtitleLabel?: string;
}

export default function PageContentEditor({ pageKey, titleLabel = 'Title', subtitleLabel = 'Subtitle' }: PageContentEditorProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/pages/${pageKey}`);
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
  }, [pageKey]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/pages/${pageKey}`, { title, subtitle, body }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Saved');
    } catch (err) {
      setMessage('Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user?.is_admin) return null;
  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-form-container" style={{ marginTop: '2rem' }}>
      <h2 className="admin-page-title" style={{ fontSize: '1.5rem' }}>Edit page content</h2>
      <p className="admin-page-subtitle">Update the content shown on this page.</p>
      <div className="admin-form" style={{ marginTop: '1rem' }}>
        <div className="admin-form-group">
          <label>{titleLabel}</label>
          <input className="admin-form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label>{subtitleLabel}</label>
          <input className="admin-form-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label>Body</label>
          <textarea className="admin-form-textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
        {message ? <p className="admin-page-subtitle">{message}</p> : null}
      </div>
    </div>
  );
}
