"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Mail, Lock, User, X, Github, Chrome, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

interface QuickSignupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signup' | 'signin';
  onSuccess?: () => void;
}

export function QuickSignup({
  isOpen,
  onClose,
  defaultMode = 'signup',
  onSuccess
}: QuickSignupProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>(defaultMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signUp, signIn, signInWithProvider, canClaimAnonymousData } = useOptionalAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(
          formData.email,
          formData.password,
          { display_name: formData.displayName }
        );
        if (error) {
          setError(error.message);
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        setError(error.message);
      }
      // Note: OAuth redirect will handle success case
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', password: '', displayName: '' });
    setError(null);
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleClose} className="p-2 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === 'signup'
              ? 'Save your events and get personalized scheduling assistance'
              : 'Sign in to access your events and preferences'
            }
          </p>
          {canClaimAnonymousData() && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="text-primary font-medium">✨ Your anonymous data will be saved</p>
              <p className="text-muted-foreground">We&apos;ll link your previous events to your new account.</p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* OAuth Providers */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleProviderSignIn('google')}
              disabled={loading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleProviderSignIn('github')}
              disabled={loading}
            >
              <Github className="h-4 w-4 mr-2" />
              Continue with GitHub
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="How should we call you?"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Mode Toggle */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {mode === 'signup' ? 'Already have an account?' : "Don&apos;t have an account?"}
            </span>
            {' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}