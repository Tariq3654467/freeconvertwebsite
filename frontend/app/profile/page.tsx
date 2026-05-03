"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      }
    }, 50);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="auth-container">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '28rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            marginBottom: '1.25rem',
          }}
        >
          <ArrowLeft size={16} /> Back home
        </Link>

        <h1 className="auth-title" style={{ marginBottom: '0.5rem' }}>Your profile</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Signed in as PrismConvert user.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <User size={20} style={{ color: 'var(--primary-color)', marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Username
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.username}</div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <Mail size={20} style={{ color: 'var(--primary-color)', marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>{user.email}</div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <Shield size={20} style={{ color: 'var(--primary-color)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Role
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {user.is_admin ? 'Administrator' : 'Member'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          {user.is_admin && (
            <Link href="/admin" className="form-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Open admin panel
            </Link>
          )}
          <button type="button" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => logout()}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
