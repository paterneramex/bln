import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('token/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credential profile mapping.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur shadow-2xl">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="h-9 w-9 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">B</div>
          <h1 className="text-2xl font-bold tracking-tight">BLN Engine Gateway</h1>
        </div>
        {error && <div className="p-3 mb-4 rounded bg-rose-950/50 border border-rose-900 text-rose-400 text-xs font-mono">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition font-medium text-sm cursor-pointer disabled:opacity-50">
            {loading ? 'Authenticating...' : 'Establish Session'}
          </button>
        </form>
      </div>
    </div>
  );
}