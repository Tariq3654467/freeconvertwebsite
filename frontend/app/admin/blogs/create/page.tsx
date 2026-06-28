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
  const [authorName, setAuthorName] = useState('');
  const [authorProfession, setAuthorProfession] = useState('');
  const [authorLinkedin, setAuthorLinkedin] = useState('');
  const [authorFacebook, setAuthorFacebook] = useState('');
  const [authorInstagram, setAuthorInstagram] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
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

    if (title.length > 60) {
      setError('Title must be 60 characters or less');
      return;
    }

    if (metaDescription.length > 160) {
      setError('Meta description must be 160 characters or less');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('excerpt', excerpt);
      formData.append('category', category);
      formData.append('tags', tags);
      formData.append('status', status);
      formData.append('author_name', authorName);
      formData.append('author_profession', authorProfession);
      formData.append('author_linkedin', authorLinkedin);
      formData.append('author_facebook', authorFacebook);
      formData.append('author_instagram', authorInstagram);
      formData.append('meta_title', metaTitle);
      formData.append('meta_description', metaDescription);
      formData.append('keywords', keywords);
      if (featuredImage) formData.append('featured_image', featuredImage);

      await axios.post(`${API}/api/admin/blogs`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

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

      <div className="admin-form-container admin-article-editor">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">New Article</h1>
            <p className="admin-page-subtitle">Create a new blog post with rich metadata and preview-ready content.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => router.back()} className="admin-btn-secondary">
              Cancel
            </button>
            <button type="submit" form="article-create-form" disabled={isLoading} className="admin-btn-primary">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? 'Saving…' : 'Publish'}
            </button>
          </div>
        </div>

        <form id="article-create-form" onSubmit={handleSubmit} className="admin-page-grid">
          <div className="admin-primary-column">
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

            <div className="admin-form-group">
              <label>Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short summary of the article"
                className="admin-form-textarea"
                rows={3}
                maxLength={220}
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
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author name"
                  className="admin-form-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Author Profession</label>
                <input
                  type="text"
                  value={authorProfession}
                  onChange={(e) => setAuthorProfession(e.target.value)}
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
                  value={authorLinkedin}
                  onChange={(e) => setAuthorLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="admin-form-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Facebook</label>
                <input
                  type="url"
                  value={authorFacebook}
                  onChange={(e) => setAuthorFacebook(e.target.value)}
                  placeholder="https://facebook.com/username"
                  className="admin-form-input"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Instagram</label>
              <input
                type="url"
                value={authorInstagram}
                onChange={(e) => setAuthorInstagram(e.target.value)}
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                  onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
                  className="admin-form-input"
                />
              </div>
              {featuredImage ? (
                <p style={{ color: '#71717a', fontSize: '0.9rem', marginTop: '0.35rem' }}>{featuredImage.name}</p>
              ) : null}
            </div>

            <div className="admin-card-section">
              <h2>SEO settings</h2>
              <div className="admin-form-group">
                <label>Meta title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title"
                  className="admin-form-input"
                  maxLength={60}
                />
              </div>

              <div className="admin-form-group">
                <label>Meta description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
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
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
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
              <label>Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author name"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Author Profession</label>
              <input
                type="text"
                value={authorProfession}
                onChange={(e) => setAuthorProfession(e.target.value)}
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
                value={authorLinkedin}
                onChange={(e) => setAuthorLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Facebook</label>
              <input
                type="url"
                value={authorFacebook}
                onChange={(e) => setAuthorFacebook(e.target.value)}
                placeholder="https://facebook.com/username"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Instagram</label>
              <input
                type="url"
                value={authorInstagram}
                onChange={(e) => setAuthorInstagram(e.target.value)}
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
              onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label>SEO Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO title"
              className="admin-form-input"
              maxLength={60}
            />
          </div>

          <div className="admin-form-group">
            <label>SEO Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
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
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Comma-separated keywords"
              className="admin-form-input"
            />
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
