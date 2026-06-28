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
  featured_image?: string;
  author_name?: string;
  author_profession?: string;
  author_linkedin?: string;
  author_facebook?: string;
  author_instagram?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
}

export default function EditBlogPage() {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
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
      const formData = new FormData();
      formData.append('title', blog.title);
      formData.append('content', blog.content);
      formData.append('excerpt', blog.excerpt || '');
      formData.append('category', blog.category || '');
      formData.append('tags', blog.tags.join(','));
      formData.append('status', blog.status);
      formData.append('author_name', blog.author_name || '');
      formData.append('author_profession', blog.author_profession || '');
      formData.append('author_linkedin', blog.author_linkedin || '');
      formData.append('author_facebook', blog.author_facebook || '');
      formData.append('author_instagram', blog.author_instagram || '');
      formData.append('meta_title', blog.meta_title || '');
      formData.append('meta_description', blog.meta_description || '');
      formData.append('keywords', blog.keywords || '');
      if (featuredImageFile) {
        formData.append('featured_image', featuredImageFile);
      }

      await axios.put(
        `${API}/api/admin/blogs/${blogId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
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

      <div className="admin-form-container admin-article-editor">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Edit Article</h1>
            <p className="admin-page-subtitle">Update article details, metadata, and publish state in one place.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => router.back()} className="admin-btn-secondary">
              Cancel
            </button>
            <button type="submit" form="article-edit-form" disabled={isLoading} className="admin-btn-primary">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <form id="article-edit-form" onSubmit={handleSubmit} className="admin-page-grid">
          <div className="admin-primary-column">
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

            <div className="admin-form-group">
              <label>Excerpt</label>
              <textarea
                value={blog.excerpt}
                onChange={(e) => setBlog({ ...blog, excerpt: e.target.value })}
                placeholder="Short summary of the blog"
                className="admin-form-textarea"
                rows={3}
                maxLength={200}
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
                  rows={16}
                  required
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Author Name</label>
                <input
                  type="text"
                  value={blog.author_name || ''}
                  onChange={(e) => setBlog({ ...blog, author_name: e.target.value })}
                  placeholder="Author name"
                  className="admin-form-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Author Profession</label>
                <input
                  type="text"
                  value={blog.author_profession || ''}
                  onChange={(e) => setBlog({ ...blog, author_profession: e.target.value })}
                  placeholder="Author profession"
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>LinkedIn</label>
                <input
                  type="url"
                  value={blog.author_linkedin || ''}
                  onChange={(e) => setBlog({ ...blog, author_linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="admin-form-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Facebook</label>
                <input
                  type="url"
                  value={blog.author_facebook || ''}
                  onChange={(e) => setBlog({ ...blog, author_facebook: e.target.value })}
                  placeholder="https://facebook.com/username"
                  className="admin-form-input"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Instagram</label>
              <input
                type="url"
                value={blog.author_instagram || ''}
                onChange={(e) => setBlog({ ...blog, author_instagram: e.target.value })}
                placeholder="https://instagram.com/username"
                className="admin-form-input"
              />
            </div>
          </div>

          <aside className="admin-sidebar-panel">
            <div className="admin-card-section">
              <h2>Post settings</h2>
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

              <div className="admin-form-group">
                <label>Featured image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFeaturedImageFile(e.target.files?.[0] || null)}
                  className="admin-form-input"
                />
              </div>
              {blog.featured_image ? (
                <img src={blog.featured_image} alt="Current featured" className="admin-image-preview" />
              ) : null}
            </div>

            <div className="admin-card-section">
              <h2>SEO settings</h2>
              <div className="admin-form-group">
                <label>Meta title</label>
                <input
                  type="text"
                  value={blog.meta_title || ''}
                  onChange={(e) => setBlog({ ...blog, meta_title: e.target.value })}
                  placeholder="SEO title"
                  className="admin-form-input"
                  maxLength={60}
                />
              </div>

              <div className="admin-form-group">
                <label>Meta description</label>
                <textarea
                  value={blog.meta_description || ''}
                  onChange={(e) => setBlog({ ...blog, meta_description: e.target.value })}
                  placeholder="SEO description"
                  className="admin-form-textarea"
                  rows={4}
                  maxLength={160}
                />
              </div>

              <div className="admin-form-group">
                <label>Keywords</label>
                <input
                  type="text"
                  value={blog.keywords || ''}
                  onChange={(e) => setBlog({ ...blog, keywords: e.target.value })}
                  placeholder="Comma-separated keywords"
                  className="admin-form-input"
                />
              </div>
            </div>
          </aside>

          {error && <div className="admin-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

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

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Author Name</label>
              <input
                type="text"
                value={blog.author_name || ''}
                onChange={(e) => setBlog({ ...blog, author_name: e.target.value })}
                placeholder="Author name"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Author Profession</label>
              <input
                type="text"
                value={blog.author_profession || ''}
                onChange={(e) => setBlog({ ...blog, author_profession: e.target.value })}
                placeholder="Author profession"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                value={blog.author_linkedin || ''}
                onChange={(e) => setBlog({ ...blog, author_linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Facebook</label>
              <input
                type="url"
                value={blog.author_facebook || ''}
                onChange={(e) => setBlog({ ...blog, author_facebook: e.target.value })}
                placeholder="https://facebook.com/username"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Instagram</label>
              <input
                type="url"
                value={blog.author_instagram || ''}
                onChange={(e) => setBlog({ ...blog, author_instagram: e.target.value })}
                placeholder="https://instagram.com/username"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Featured image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFeaturedImageFile(e.target.files?.[0] || null)}
              className="admin-form-input"
            />
            {blog.featured_image ? (
              <img src={blog.featured_image} alt="Current featured" className="admin-image-preview" />
            ) : null}
          </div>

          <div className="admin-form-group">
            <label>SEO Meta Title</label>
            <input
              type="text"
              value={blog.meta_title || ''}
              onChange={(e) => setBlog({ ...blog, meta_title: e.target.value })}
              placeholder="SEO title"
              className="admin-form-input"
              maxLength={60}
            />
          </div>

          <div className="admin-form-group">
            <label>SEO Meta Description</label>
            <textarea
              value={blog.meta_description || ''}
              onChange={(e) => setBlog({ ...blog, meta_description: e.target.value })}
              placeholder="SEO description"
              className="admin-form-textarea"
              rows={4}
              maxLength={160}
            />
          </div>

          <div className="admin-form-group">
            <label>Keywords</label>
            <input
              type="text"
              value={blog.keywords || ''}
                onChange={(e) => setBlog({ ...blog, keywords: e.target.value })}
                placeholder="Comma-separated keywords"
                className="admin-form-input"
              />
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
