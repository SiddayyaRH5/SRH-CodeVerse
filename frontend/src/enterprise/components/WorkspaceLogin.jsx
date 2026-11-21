import React, { useState } from 'react';
import { workspaceAuthApi, setWorkspaceSessionToken } from '../services/apiClient.js';

export default function WorkspaceLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await workspaceAuthApi.login(email.trim(), password);
      if (res && res.token) {
        setWorkspaceSessionToken(res.token);
        window.location.reload();
      } else {
        setError('Login failed.');
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Enterprise Workspace Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: '100%' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <button type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}