"use client";

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

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
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful! Redirecting...');
      setTimeout(() => window.location.href = '/', 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login to FreeConvert</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className={`form-input ${errors.email && 'error'}`}
              placeholder="Enter your email" 
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
              placeholder="Enter your password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            {errors.password && <p className="error-small">{errors.password}</p>}
          </div>
          <button type="submit" className="form-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          <div className="auth-links">
            <a href="/forgot-password" className="auth-link">Forgot Password?</a>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Don't have an account? <Link href="/signup" className="auth-link">Sign Up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}


