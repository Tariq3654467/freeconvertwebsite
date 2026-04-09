"use client";

import Link from 'next/link';
import { Menu, RefreshCw } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="menu-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Menu size={24} color="#2c3e50" />
        </button>
        <Link href="/" className="logo-container">
          <div className="logo-icon">
            <RefreshCw size={18} />
          </div>
          <span>FreeConvert</span>
        </Link>
      </div>

      <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4a5568' }}>Log In</Link>
        <Link href="/signup" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Sign Up</Link>
      </div>
    </nav>
  );
}
