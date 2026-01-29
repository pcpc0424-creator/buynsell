'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement password reset API
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-12">
        <div className="max-w-md mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-check text-3xl text-green-500"></i>
            </div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-800 mb-4">
              Check Your <span className="gradient-text">Email</span>
            </h1>
            <p className="text-slate-500">
              We&apos;ve sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="glass-ultra rounded-2xl p-8 text-center">
            <p className="text-slate-600 mb-6">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-accent-blue hover:underline font-medium"
            >
              Try another email
            </button>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Link
                href="/login"
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-800 mb-4">
            Forgot <span className="gradient-text">Password</span>?
          </h1>
          <p className="text-slate-500">
            Enter your email and we&apos;ll send you instructions to reset your password
          </p>
        </div>

        <div className="glass-ultra rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
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

            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <Link
              href="/login"
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
