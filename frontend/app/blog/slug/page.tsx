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
}

export default function BlogDetailPage() {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`${API}/api/admin/blogs?status=published`);
        const foundBlog = response.data.blogs.find((b: Blog) => b.id === slug);
        if (foundBlog) {
          setBlog(foundBlog);
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        setError('Failed to load blog');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

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
