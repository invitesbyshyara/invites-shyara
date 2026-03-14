import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing or invalid.');
      return;
    }

    void api.confirmEmailVerification(token)
      .then(async (result) => {
        await refreshUser().catch(() => null);
        setStatus('success');
        setMessage(result.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unable to verify this email.');
      });
  }, [refreshUser, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-display text-3xl font-bold mb-3">
            {status === 'loading' ? 'Verifying Email' : status === 'success' ? 'Email Verified' : 'Verification Failed'}
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
