"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { ChevronLeft, Loader2 } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: string;
}

export default function EditBlogPage() {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const blogId = params.id as string;

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin/blogs/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlog(response.data);
    } catch (err) {
      setError('Failed to load blog');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog?.title.trim() || !blog?.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/api/admin/blogs/${blogId}`,
        {
          title: blog.title,
          content: blog.content,
          excerpt: blog.excerpt,
          category: blog.category,
          tags: blog.tags,
          status: blog.status
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push('/admin/blogs');
    } catch (err) {
      setError('Failed to update blog');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-page"><p>Loading...</p></div>;
  }

  if (error || !blog) {
    return (
      <div className="admin-page">
        <button onClick={() => router.back()} className="admin-back-btn">
          <ChevronLeft size={20} /> Back
        </button>
        <p className="admin-error">{error || 'Blog not found'}</p>
      </div>
    );
  }

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
          <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Edit Article</h1>
          <button type="submit" form="article-edit-form" disabled={isLoading} className="admin-btn-primary">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLoading ? 'Saving…' : 'Save'}
          </button>
        </div>

        <form id="article-edit-form" onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-group">
            <label>Title *</label>
            <input
              type="text"
              value={blog.title}
              onChange={(e) => setBlog({ ...blog, title: e.target.value })}
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
                value={blog.category}
                onChange={(e) => setBlog({ ...blog, category: e.target.value })}
                placeholder="e.g., Technology"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Tags</label>
              <input
                type="text"
                value={blog.tags.join(', ')}
                onChange={(e) => setBlog({ ...blog, tags: e.target.value.split(',').map(t => t.trim()) })}
                placeholder="Comma-separated tags"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Excerpt</label>
            <input
              type="text"
              value={blog.excerpt}
              onChange={(e) => setBlog({ ...blog, excerpt: e.target.value })}
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
                value={blog.content}
                onChange={(e) => setBlog({ ...blog, content: e.target.value })}
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
              value={blog.status}
              onChange={(e) => setBlog({ ...blog, status: e.target.value })}
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
