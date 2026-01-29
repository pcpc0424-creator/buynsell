import { Header, Footer } from '@/components/layout';

export default function AboutPage() {
  return (
    <>
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-slate-800 mb-8">
            About <span className="gradient-text">Us</span>
          </h1>

          <div className="glass-ultra rounded-2xl p-8 space-y-6">
            <p className="text-slate-600 leading-relaxed">
              Buy & Sell is the Philippines premier real estate platform, connecting property buyers,
              sellers, and renters with trusted agents and verified listings across the country.
            </p>

            <h2 className="text-2xl font-semibold text-slate-800 pt-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              To make property transactions simple, transparent, and accessible for everyone in the Philippines.
              We believe that finding your dream home or investment property should be an exciting journey,
              not a stressful process.
            </p>

            <h2 className="text-2xl font-semibold text-slate-800 pt-4">What We Offer</h2>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Verified property listings from trusted agents</li>
              <li>Advanced search and filtering tools</li>
              <li>Direct communication with property agents</li>
              <li>Market insights and property valuations</li>
              <li>Secure transaction support</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 pt-4">Contact Us</h2>
            <p className="text-slate-600">
              Email: info@buynsell.ph<br />
              Phone: +63 2 8888 1234<br />
              Address: Makati City, Metro Manila, Philippines
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
