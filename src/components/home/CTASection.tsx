import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 blur-3xl"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-accent-pink/5 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-accent-cyan/5 to-transparent blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <span className="inline-block px-5 py-2 glass-ultra rounded-full text-sm text-slate-600 mb-8">
          <i className="fas fa-rocket mr-2 text-accent-blue"></i>Get Started Today
        </span>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-slate-800 mb-6">
          Ready to find your <span className="gradient-text">dream property</span>?
        </h2>

        <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">
          Join thousands of satisfied customers who found their perfect home with Buy & Sell.
          Start your journey today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/properties"
            className="btn-premium text-white font-semibold px-10 py-5 rounded-2xl text-lg"
          >
            <i className="fas fa-search mr-3"></i>Browse Properties
          </Link>
          <Link
            href="/sell"
            className="glass-ultra text-slate-700 font-semibold px-10 py-5 rounded-2xl text-lg hover:bg-slate-50 transition-all"
          >
            <i className="fas fa-plus mr-3"></i>List Your Property
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center space-x-3 text-slate-500">
            <i className="fas fa-shield-alt text-2xl text-accent-blue"></i>
            <span>Secure Transactions</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500">
            <i className="fas fa-headset text-2xl text-accent-purple"></i>
            <span>24/7 Support</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500">
            <i className="fas fa-check-circle text-2xl text-accent-pink"></i>
            <span>Verified Listings</span>
          </div>
        </div>
      </div>
    </section>
  );
}
