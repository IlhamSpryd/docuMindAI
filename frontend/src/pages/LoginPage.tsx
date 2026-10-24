import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        login('mock-test-token-demo-reviewer', {
          id: '00000000-0000-0000-0000-000000000001',
          email: email || 'user@documind.ai',
        });
        navigate('/');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        login(data.session.access_token, {
          id: data.user.id,
          email: data.user.email ?? email,
        });
        navigate('/');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not sign in. Check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form className="w-full max-w-[360px]" onSubmit={handleLogin}>
        <p className="pb-6 text-[15px] font-semibold">DocuMind</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        {errorMsg && (
          <p role="alert" className="mt-3 text-destructive">
            {errorMsg}
          </p>
        )}
        <label htmlFor="email" className="mb-1.5 mt-4 block text-[13px] font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="pw" className="mb-1.5 mt-4 block text-[13px] font-medium">
          Password
        </label>
        <Input
          id="pw"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Continue'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-3 w-full"
          onClick={() => {
            loginDemo();
            navigate('/');
          }}
        >
          Try demo account
        </Button>
        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          No account?{' '}
          <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
};
