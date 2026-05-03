"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import '../../styles/admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setChecked(true);
      if (!isAuthenticated || !user || !user.is_admin) {
        if (!isAuthenticated || !user) {
          router.replace('/login');
        } else {
          router.replace('/');
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  if (!checked || !isAuthenticated || !user || !user.is_admin) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.5rem',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
