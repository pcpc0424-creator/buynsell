'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Welcome <span className="gradient-text">Back</span>
          </h1>
          <p className="text-white/50">Sign in to continue to your account</p>
        </div>

        <div className="glass-ultra rounded-2xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button type="button" onClick={handleGoogleSignIn} className="social-btn">
              <i className="fab fa-google"></i>
              <span>Google</span>
            </button>
            <button type="button" className="social-btn" disabled>
              <i className="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </button>
          </div>

          <div className="divider mb-6">or continue with email</div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-custom"
                />
                <span className="text-white/60 text-sm">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-accent-blue text-sm hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-white/50 mt-6 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-accent-blue hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function LoginFormFallback() {
  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Welcome <span className="gradient-text">Back</span>
          </h1>
          <p className="text-white/50">Sign in to continue to your account</p>
        </div>
        <div className="glass-ultra rounded-2xl p-8 animate-pulse">
          <div className="h-12 bg-white/10 rounded-xl mb-4"></div>
          <div className="h-12 bg-white/10 rounded-xl mb-4"></div>
          <div className="h-12 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
