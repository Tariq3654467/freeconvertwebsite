"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';


export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');

  const router = useRouter();

  const validateForm = () => {
    const newErrors = { username: '', email: '', password: '', confirmPassword: '' };
    if (!username) newErrors.username = 'Username is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.values(newErrors).every(err => !err);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setMessage('');
    try {
      await axios.post('http://127.0.0.1:5000/api/auth/signup', {
        username,
        email,
        password
      });
      setMessage('Signup successful! You can now log in.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              className={`form-input ${errors.username && 'error'}`}
              placeholder="Choose a username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
            {errors.username && <p className="error-small">{errors.username}</p>}
          </div>
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
            <div style={{ position: 'relative' }}>
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                className={`form-input ${errors.password && 'error'}`}
                placeholder="Create a password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="error-small">{errors.password}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword"
              type="password" 
              className={`form-input ${errors.confirmPassword && 'error'}`}
              placeholder="Confirm your password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
            />
            {errors.confirmPassword && <p className="error-small">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="form-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          <div className="auth-links">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              Already have an account? <Link href="/login" className="auth-link">Log In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

