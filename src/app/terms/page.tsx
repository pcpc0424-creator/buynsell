import { Header, Footer } from '@/components/layout';

export default function TermsPage() {
  return (
    <>
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-slate-800 mb-8">
            Terms of <span className="gradient-text">Service</span>
          </h1>

          <div className="glass-ultra rounded-2xl p-8 space-y-6 text-slate-600">
            <p className="text-sm text-slate-400">Last updated: January 2024</p>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Buy & Sell, you accept and agree to be bound by these Terms
                of Service. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">2. User Accounts</h2>
              <p className="leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials.
                You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Property Listings</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>All listings must be accurate and truthful</li>
                <li>You must have the right to list the property</li>
                <li>Listings are subject to review and approval</li>
                <li>We reserve the right to remove any listing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Prohibited Activities</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Posting false or misleading information</li>
                <li>Harassment of other users or agents</li>
                <li>Unauthorized data collection</li>
                <li>Any illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Limitation of Liability</h2>
              <p className="leading-relaxed">
                Buy & Sell is a platform connecting buyers, sellers, and agents. We are not responsible
                for the actual property transactions or disputes between parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Changes to Terms</h2>
              <p className="leading-relaxed">
                We may modify these terms at any time. Continued use of the service after changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Contact</h2>
              <p className="leading-relaxed">
                For questions about these Terms, contact us at legal@buynsell.ph
              </p>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
