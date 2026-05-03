"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Clock, Folder, ChevronRight } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  view_count: number;
  created_at: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/auth/blogs?status=published&page=${page}&per_page=9`);
      setBlogs(response.data.blogs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="blog-main">
      <div className="blog-hero">
        <h1 className="blog-hero-title">Latest Articles</h1>
        <p className="blog-hero-subtitle">
          Discover insights, tips, and stories about file conversion
        </p>
      </div>

      {loading ? (
        <div className="blog-container"><p>Loading articles...</p></div>
      ) : (
        <>
          <div className="blog-grid">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="blog-card">
                <div className="blog-card-header">
                  {blog.category && (
                    <span className="blog-category">
                      <Folder size={14} /> {blog.category}
                    </span>
                  )}
                </div>
                <h2 className="blog-card-title">{blog.title}</h2>
                <p className="blog-card-excerpt">{blog.excerpt}</p>
                <div className="blog-card-footer">
                  <span className="blog-meta">
                    <Clock size={14} /> {new Date(blog.created_at).toLocaleDateString()}
                  </span>
                  <span className="blog-read-more">
                    Read More <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {blogs.length === 0 && (
            <div className="blog-empty">
              <p>No articles published yet. Check back soon!</p>
            </div>
          )}

          {total > 9 && (
            <div className="blog-pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="blog-pagination-btn"
              >
                Previous
              </button>
              <span className="blog-page-info">Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 9 >= total}
                className="blog-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
