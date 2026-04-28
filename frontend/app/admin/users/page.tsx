"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard as Edit2, Trash2, CircleCheck as CheckCircle2, Circle, Loader as Loader2 } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin/users?page=${page}&per_page=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: number) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admin/users/${userId}/toggle-admin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle admin:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">User Management</h1>
        <p className="admin-page-subtitle">Manage registered users and permissions</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-weight-600">{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <div className="admin-badge" style={{
                    background: user.is_admin ? '#d1fae5' : '#f3f4f6',
                    color: user.is_admin ? '#059669' : '#6b7280'
                  }}>
                    {user.is_admin ? '✓ Admin' : 'User'}
                  </div>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="admin-actions">
                  <button
                    onClick={() => toggleAdmin(user.id)}
                    disabled={actionLoading === user.id}
                    className="admin-action-btn admin-action-toggle"
                    title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  >
                    {actionLoading === user.id ? <Loader2 size={16} /> : (user.is_admin ? <CheckCircle2 size={16} /> : <Circle size={16} />)}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={actionLoading === user.id}
                    className="admin-action-btn admin-action-delete"
                    title="Delete user"
                  >
                    {actionLoading === user.id ? <Loader2 size={16} /> : <Trash2 size={16} />}
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
