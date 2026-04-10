"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, RefreshCw, User, LogOut } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { ToolItem } from '../constants/tools';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const handleSelectTool = (tool: ToolItem) => {
    console.log('Selected tool:', tool);
    // This will be handled by the page or a global state/event
    const event = new CustomEvent('selectTool', { detail: tool });
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="menu-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setIsDrawerOpen(true)}
          >
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
          {isAuthenticated ? (
            <>
              <Link href="/profile" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4a5568', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={18} /> {user?.username}
              </Link>
              <button onClick={handleLogout} style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4a5568' }}>Log In</Link>
              <Link href="/signup" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTool={handleSelectTool}
      />
    </>
  );
}
