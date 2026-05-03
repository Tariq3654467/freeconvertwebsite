"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, RefreshCw, User, LogOut, ChevronDown } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { TOOLS_DATA } from '../constants/tools';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'Convert' | 'Compress' | null>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <button
            className="menu-btn"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-glass)', 
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
          <div className="navbar-left-tools">
            {(['Convert', 'Compress'] as const).map((section) => (
              <div
                key={section}
                className="nav-mega"
                onMouseEnter={() => setActiveMenu(section)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button className="nav-mega-trigger">
                  {section} <ChevronDown size={15} />
                </button>
                {activeMenu === section && (
                  <div className="nav-mega-panel">
                    {TOOLS_DATA[section].map((category) => (
                      <div key={category.name} className="nav-mega-col">
                        <h4>{category.name}</h4>
                        <div>
                          {category.items.slice(0, 8).map((tool) => (
                            <button
                              key={tool.id}
                              className="nav-mega-link"
                              onClick={() => {
                                router.push(`/convert/${tool.id}`);
                                setActiveMenu(null);
                              }}
                            >
                              {tool.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/blog" style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}>
            Blog
          </Link>
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
      />
    </>
  );
}
