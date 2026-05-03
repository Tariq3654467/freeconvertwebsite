"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ChevronLeft, Loader2 } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

export default function CreateBlogPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/api/admin/blogs`,
        {
          title,
          content,
          excerpt,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          status
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push('/admin/blogs');
    } catch (err) {
      setError('Failed to create blog');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <button
        onClick={() => router.back()}
        className="admin-back-btn"
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div className="admin-form-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '-0.5rem' }}>
          <h1 className="admin-page-title" style={{ marginBottom: 0 }}>New Article</h1>
          <button type="submit" form="article-create-form" disabled={isLoading} className="admin-btn-primary">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLoading ? 'Saving…' : 'Save'}
          </button>
        </div>

        <form id="article-create-form" onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title"
              className="admin-form-input"
              required
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Technology"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Excerpt</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short description of the blog"
              className="admin-form-input"
              maxLength={200}
            />
          </div>

          <div className="admin-form-group">
            <label>Content *</label>
            <div className="admin-editor-shell">
              <div className="admin-editor-toolbar" aria-hidden>
                <span>B</span>
                <span>I</span>
                <span>U</span>
                <span>H2</span>
                <span>List</span>
                <span>Quote</span>
                <span>Link</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article…"
                className="admin-form-textarea"
                rows={14}
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="admin-form-select"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <div className="admin-form-actions">
            <button
              type="button"
              onClick={() => router.back()}
              className="admin-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
