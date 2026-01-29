import { Header, Footer } from '@/components/layout';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-slate-800 mb-8">
            Privacy <span className="gradient-text">Policy</span>
          </h1>

          <div className="glass-ultra rounded-2xl p-8 space-y-6 text-slate-600">
            <p className="text-sm text-slate-400">Last updated: January 2024</p>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Information We Collect</h2>
              <p className="leading-relaxed">
                We collect information you provide directly, including name, email, phone number,
                and property preferences. We also collect usage data to improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To provide and maintain our services</li>
                <li>To notify you about changes to our services</li>
                <li>To provide customer support</li>
                <li>To gather analysis to improve our services</li>
                <li>To detect and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your personal information.
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Cookies</h2>
              <p className="leading-relaxed">
                We use cookies to enhance your experience. You can configure your browser to refuse
                cookies, but some features may not function properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Third-Party Services</h2>
              <p className="leading-relaxed">
                We may employ third-party companies to facilitate our service. These parties have
                access to your information only to perform tasks on our behalf.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at privacy@buynsell.ph
              </p>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
