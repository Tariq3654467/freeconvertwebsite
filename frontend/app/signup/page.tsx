"use client";

import { useState } from 'react';
import axios from 'axios';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:5000/api/auth/signup', {
        username,
        email,
        password
      });
      setMessage('Signup successful! You can now login.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="main-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleSignup} style={{ maxWidth: '400px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          required 
          style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
        />
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
        <button type="submit" className="btn-primary">Sign Up</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
