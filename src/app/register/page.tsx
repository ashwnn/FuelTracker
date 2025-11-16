'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('[REGISTER PAGE] Form submitted with email:', email);

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      console.log('[REGISTER PAGE]', msg);
      setError(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters';
      console.log('[REGISTER PAGE]', msg);
      setError(msg);
      return;
    }

    setLoading(true);

    try {
      console.log('[REGISTER PAGE] Calling register...');
      await register(email, password);
      console.log('[REGISTER PAGE] Registration successful, redirecting...');
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.message || 'Registration failed';
      console.error('[REGISTER PAGE] Registration error:', err);
      console.error('[REGISTER PAGE] Error message:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register-page">
      <div className="auth-card">
        <h1>FuelTracker</h1>
        <h2>Register</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
