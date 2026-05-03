"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Eye, Activity } from 'lucide-react';

const API = 'http://127.0.0.1:5000';

interface Stats {
  total_users: number;
  total_blogs: number;
  published_blogs: number;
  draft_blogs: number;
  total_views: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;
  if (!stats) return <div className="admin-page"><p>Failed to load stats</p></div>;

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.total_users, color: '#6366f1' },
    { icon: FileText, label: 'Total Blogs', value: stats.total_blogs, color: '#8b5cf6' },
    { icon: FileText, label: 'Published', value: stats.published_blogs, color: '#10b981' },
    { icon: FileText, label: 'Drafts', value: stats.draft_blogs, color: '#f59e0b' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Site overview and publishing stats.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ backgroundColor: `${card.color}20` }}>
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">{card.label}</p>
                <p className="admin-stat-value">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card-large">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Eye size={24} style={{ color: '#6366f1' }} />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total Views</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6366f1' }}>{stats.total_views}</p>
        </div>
      </div>
    </div>
  );
}
