'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/config';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const password = formData.password;
  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  }, [password]);

  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const strengthTexts = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push('/login');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Create <span className="gradient-text">Account</span>
          </h1>
          <p className="text-slate-500">Join us and start finding your dream property</p>
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

          <div className="divider mb-6">or register with email</div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+63 900 000 0000"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="form-input pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <div className="mt-2">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: formData.password.length === 0 ? '0%' : `${passwordStrength * 25}%`,
                      background: strengthColors[passwordStrength - 1] || strengthColors[0],
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {formData.password.length === 0
                    ? 'Password strength'
                    : strengthTexts[passwordStrength - 1] || strengthTexts[0]}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="checkbox-custom mt-0.5"
              />
              <span className="text-slate-500 text-sm">
                I agree to the{' '}
                <Link href="/terms" className="text-accent-blue hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent-blue hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-blue hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
