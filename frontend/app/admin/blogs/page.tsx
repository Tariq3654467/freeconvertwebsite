"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Plus, CreditCard as Edit2, Trash2, Eye, Loader as Loader2 } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

interface Blog {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  view_count: number;
  created_at: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin/blogs/admin/all?page=${page}&per_page=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(response.data.blogs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    try {
      setActionLoading(blogId);
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/admin/blogs/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBlogs();
    } catch (error) {
      console.error('Failed to delete blog:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Blog Management</h1>
        <button
          onClick={() => router.push('/admin/blogs/create')}
          className="admin-btn-primary"
        >
          <Plus size={18} /> New Blog
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Views</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id}>
                <td className="font-weight-600">{blog.title}</td>
                <td>{blog.category || '-'}</td>
                <td>
                  <div className="admin-badge" style={{
                    background: blog.status === 'published' ? '#d1fae5' : '#fef3c7',
                    color: blog.status === 'published' ? '#059669' : '#92400e'
                  }}>
                    {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Eye size={16} /> {blog.view_count}
                  </div>
                </td>
                <td>{new Date(blog.created_at).toLocaleDateString()}</td>
                <td className="admin-actions">
                  <button
                    onClick={() => router.push(`/admin/blogs/${blog.id}/edit`)}
                    className="admin-action-btn admin-action-edit"
                    title="Edit blog"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteBlog(blog.id)}
                    disabled={actionLoading === blog.id}
                    className="admin-action-btn admin-action-delete"
                    title="Delete blog"
                  >
                    {actionLoading === blog.id ? <Loader2 size={16} /> : <Trash2 size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="admin-btn-secondary"
        >
          Previous
        </button>
        <span className="admin-page-info">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page * 10 >= total}
          className="admin-btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
}
