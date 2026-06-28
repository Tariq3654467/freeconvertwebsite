"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Clock, Folder, ChevronLeft } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  view_count: number;
  created_at: string;
  slug: string;
  featured_image?: string;
  author_name?: string;
  author_profession?: string;
  author_linkedin?: string;
  author_facebook?: string;
  author_instagram?: string;
}

export default function BlogDetailPage() {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug as string | undefined;
  const slugParam = rawSlug
    ? decodeURIComponent(rawSlug).trim().toLowerCase()
    : '';

  useEffect(() => {
    if (!slugParam) {
      setLoading(false);
      setError('Blog not found');
      return;
    }

    const fetchBlog = async () => {
      try {
        // Public endpoint: resolves UUID or slug (see backend auth_routes.get_blog)
        const { data } = await axios.get<Blog>(
          `${API}/api/auth/blogs/${encodeURIComponent(slugParam)}`
        );
        setBlog(data);
      } catch (err) {
        setError('Failed to load blog');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slugParam]);

  if (loading) {
    return (
      <main className="blog-detail-main">
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="blog-detail-main">
        <button onClick={() => router.back()} className="blog-back-btn">
          <ChevronLeft size={20} /> Back
        </button>
        <p className="blog-error">{error || 'Blog not found'}</p>
      </main>
    );
  }

  return (
    <main className="blog-detail-main">
      <button onClick={() => router.back()} className="blog-back-btn">
        <ChevronLeft size={20} /> Back
      </button>

      <article className="blog-detail-container">
        {blog.featured_image && (
          <div className="blog-detail-image-wrap">
            <img src={blog.featured_image} alt={blog.title} className="blog-detail-image" />
          </div>
        )}
        <div className="blog-detail-header">
          <h1 className="blog-detail-title">{blog.title}</h1>
          <div className="blog-detail-meta">
            <span className="blog-meta-item">
              <Clock size={16} /> {new Date(blog.created_at).toLocaleDateString()}
            </span>
            {blog.category && (
              <span className="blog-meta-item">
                <Folder size={16} /> {blog.category}
              </span>
            )}
          </div>
          {(blog.author_name || blog.author_profession) && (
            <div className="blog-detail-author">
              <p className="blog-detail-author-name">{blog.author_name}</p>
              {blog.author_profession ? <p className="blog-detail-author-profession">{blog.author_profession}</p> : null}
              <div className="blog-detail-author-links">
                {blog.author_linkedin && (
                  <a href={blog.author_linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
                )}
                {blog.author_facebook && (
                  <a href={blog.author_facebook} target="_blank" rel="noreferrer">Facebook</a>
                )}
                {blog.author_instagram && (
                  <a href={blog.author_instagram} target="_blank" rel="noreferrer">Instagram</a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="blog-detail-content">
          {blog.content.split('\n\n').map((paragraph: string, i: number) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {blog.tags && blog.tags.length > 0 && (
          <div className="blog-detail-tags">
            <h3>Tags:</h3>
            <div className="blog-tags-list">
              {blog.tags.map((tag: string) => (
                <span key={tag} className="blog-tag">#{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="blog-detail-footer">
          <p className="blog-views">
            <span className="blog-views-icon">👁️</span>
            {blog.view_count} views
          </p>
        </div>
      </article>
    </main>
  );
}

