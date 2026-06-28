"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PageContentRenderer from '../../components/PageContentRenderer';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.values(newErrors).every(err => !err);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        email,
        password
      });
      login(response.data.access_token);
      setMessage('Login successful! Redirecting...');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div style={{ maxWidth: '940px', width: '100%', display: 'grid', gap: '1.25rem' }}>
        <div className="auth-card" style={{ maxWidth: 'none', padding: '1.5rem 2rem' }}>
          <PageContentRenderer
            pageKey="login-page"
            fallbackTitle="Welcome back to Prism Engine"
            fallbackSubtitle="Sign in to continue converting files faster, upload more content, and keep your recent work in one place."
            fallbackBody="Your account unlocks batch tools, secure uploads, and access to the full workspace experience."
          />
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
            <div>• Batch uploads for multiple files at once</div>
            <div>• Faster access to recent convert and compress jobs</div>
            <div>• A smoother experience for frequent users</div>
          </div>
        </div>
        <div className="auth-card">
          <h1 className="auth-title">Access Prism Engine</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', marginTop: '-1.5rem', fontSize: '0.95rem' }}>
            Welcome back. The engine is ready.
          </p>
          <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              className={`form-input ${errors.email && 'error'}`}
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            {errors.email && <p className="error-small">{errors.email}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className={`form-input ${errors.password && 'error'}`}
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            {errors.password && <p className="error-small">{errors.password}</p>}
          </div>
          <button type="submit" className="form-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          <div className="auth-links">
            <Link href="/forgot-password" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot Password?</Link>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              New to Prism? <Link href="/signup" className="auth-link">Create Account</Link>
            </p>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}


