'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '@/public/images/logo.png';
import { errorMessage, login, signup } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signup(username, password);
        setNotice('Account created. You can log in now.');
        setMode('login');
      } else {
        await login(username, password);
        router.replace('/');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-blue-primary';

  return (
    <div className="flex h-full w-full items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-800 p-8 text-white">
        <div className="mb-6 flex items-center gap-2">
          <Image src={logo} className="h-6 w-6" alt="Logo" />
          <span className="font-logo text-2xl">queuely</span>
        </div>
        <h1 className="mb-6 text-lg font-semibold">{mode === 'login' ? 'Log in' : 'Create an account'}</h1>

        {error && <p className="mb-4 rounded-md bg-red-900/40 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="mb-4 rounded-md bg-green-900/40 px-3 py-2 text-sm text-green-200">{notice}</p>}

        <div className="flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === 'signup' && (
            <p className="text-xs text-neutral-400">
              Username: 3–20 lowercase letters or digits. Password: 8–72 characters.
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-primary py-3 font-semibold hover:bg-blue-primary/70 disabled:opacity-50">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
          <button
            type="button"
            className="text-blue-400 hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
              setNotice(null);
            }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  );
}
