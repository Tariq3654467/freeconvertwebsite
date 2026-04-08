"use client";

import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        email,
        password
      });
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful!');
      window.location.href = '/';
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="main-container">
      <h2>Login to FreeConvert Replica</h2>
      <form onSubmit={handleLogin} style={{ maxWidth: '400px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
        />
        <button type="submit" className="btn-primary">Login</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
