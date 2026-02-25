'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    // If user is an agent, redirect to agent listings page
    if (session?.user?.role === 'AGENT') {
      router.replace('/agent/listings/new');
      return;
    }

    setChecking(false);
  }, [session, status, router]);

  // Show loading while checking session
  if (status === 'loading' || checking) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
        </div>
        <Footer />
      </>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <>
        <Header />
        <section className="py-20">
          <div className="max-w-lg mx-auto px-6 text-center">
            <div className="glass-ultra rounded-2xl p-8">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-sign-in-alt text-3xl text-yellow-400"></i>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-4">Login Required</h1>
              <p className="text-slate-500 mb-8">
                Please login to your agent account to list a property.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login?callbackUrl=/sell"
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold hover:opacity-90 transition-all"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i> Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
                >
                  Create Agent Account
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // Logged in but not an agent
  return (
    <>
      <Header />
      <section className="py-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="glass-ultra rounded-2xl p-8">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-lock text-3xl text-red-400"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Agent Access Only</h1>
            <p className="text-slate-500 mb-8">
              Only registered agents can list properties. If you want to become an agent,
              please contact us or register as an agent.
            </p>
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold hover:opacity-90 transition-all"
              >
                <i className="fas fa-home mr-2"></i> Go to Home
              </Link>
              <Link
                href="/contact"
                className="block w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
              >
                <i className="fas fa-envelope mr-2"></i> Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
