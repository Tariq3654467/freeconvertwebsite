"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <div className="admin-logo-icon">CMS</div>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="admin-nav">
        <Link
          href="/admin"
          className={`admin-nav-item ${isActive('/admin') ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/users"
          className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Users</span>
        </Link>
        <Link
          href="/admin/blogs"
          className={`admin-nav-item ${isActive('/admin/blogs') ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>Blogs</span>
        </Link>
      </nav>

      <div className="admin-sidebar-footer">
        <button
          onClick={logout}
          className="admin-nav-item logout"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
