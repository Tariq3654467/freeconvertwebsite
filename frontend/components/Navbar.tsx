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
    const event = new CustomEvent('selectTool', { detail: tool });
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            className="menu-btn"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              color: 'var(--text-main)',
              transition: 'background 0.2s'
            }}
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="logo-container">
            <div className="logo-icon">
              <RefreshCw size={20} />
            </div>
            <span>PrismConvert</span>
          </Link>
        </div>

        <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Link href="/profile" style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: 'var(--text-main)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                textDecoration: 'none'
              }}>
                <User size={18} /> {user?.username}
              </Link>
              <button onClick={handleLogout} style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#f87171', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: 'var(--text-muted)', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }} className="hover:text-white">
                Log In
              </Link>
              <Link 
                href="/signup" 
                style={{ 
                  background: 'var(--primary-gradient)',
                  padding: '0.625rem 1.25rem', 
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  color: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
              >
                Sign Up
              </Link>
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
