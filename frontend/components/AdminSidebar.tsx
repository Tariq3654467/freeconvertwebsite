"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderOpen,
  Tag,
  LogOut,
  ArrowLeft,
  Crosshair,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) =>
    path === '/admin'
      ? pathname === '/admin'
      : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-brand-mark" aria-hidden>
          <Crosshair size={18} strokeWidth={2} />
        </div>
        <span className="admin-sidebar-brand-text">CMS</span>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        <Link
          href="/admin"
          className={`admin-sidebar-link ${isActive('/admin') ? 'admin-sidebar-link--active' : ''}`}
        >
          <LayoutDashboard size={18} strokeWidth={1.75} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/blogs"
          className={`admin-sidebar-link ${isActive('/admin/blogs') ? 'admin-sidebar-link--active' : ''}`}
        >
          <FileText size={18} strokeWidth={1.75} />
          <span>Articles</span>
        </Link>
        <span className="admin-sidebar-link admin-sidebar-link--soon" title="Coming soon">
          <FolderOpen size={18} strokeWidth={1.75} />
          <span>Categories</span>
        </span>
        <Link
          href="/admin/users"
          className={`admin-sidebar-link ${isActive('/admin/users') ? 'admin-sidebar-link--active' : ''}`}
        >
          <Users size={18} strokeWidth={1.75} />
          <span>Authors</span>
        </Link>
        <span className="admin-sidebar-link admin-sidebar-link--soon" title="Coming soon">
          <Tag size={18} strokeWidth={1.75} />
          <span>Tags</span>
        </span>
      </nav>

      <div className="admin-sidebar-footer">
        <button type="button" className="admin-sidebar-signout" onClick={() => logout()}>
          <LogOut size={18} strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
        <Link href="/" className="admin-sidebar-site">
          <ArrowLeft size={18} strokeWidth={1.75} />
          <span>Back to Site</span>
        </Link>
      </div>
    </aside>
  );
}
