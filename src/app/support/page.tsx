import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const supportTopics = [
  {
    icon: 'fa-user-plus',
    title: 'Account & Registration',
    description: 'Help with creating accounts, login issues, and profile settings',
    color: 'accent-blue',
  },
  {
    icon: 'fa-building',
    title: 'Property Listings',
    description: 'How to list, edit, or manage your property listings',
    color: 'accent-purple',
  },
  {
    icon: 'fa-search',
    title: 'Searching Properties',
    description: 'Tips for finding the perfect property using our search tools',
    color: 'accent-pink',
  },
  {
    icon: 'fa-credit-card',
    title: 'Payments & Subscriptions',
    description: 'Information about pricing plans and payment methods',
    color: 'accent-cyan',
  },
  {
    icon: 'fa-shield-alt',
    title: 'Safety & Security',
    description: 'Protecting your account and safe transaction tips',
    color: 'green-500',
  },
  {
    icon: 'fa-bug',
    title: 'Report a Problem',
    description: 'Found a bug or issue? Let us know so we can fix it',
    color: 'amber-500',
  },
];

export default function SupportPage() {
  return (
    <>
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-slate-800 mb-4">
              How Can We <span className="gradient-text">Help</span>?
            </h1>
            <p className="text-slate-500">
              Browse our support topics or contact us directly
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {supportTopics.map((topic) => (
              <div
                key={topic.title}
                className="glass-ultra rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-${topic.color}/10 flex items-center justify-center mb-4`}>
                  <i className={`fas ${topic.icon} text-${topic.color} text-xl`}></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{topic.title}</h3>
                <p className="text-slate-500 text-sm">{topic.description}</p>
              </div>
            ))}
          </div>

          <div className="glass-ultra rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Still Need Help?</h2>
            <p className="text-slate-500 mb-6">
              Our support team is available Monday to Friday, 9AM - 6PM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="btn-premium text-white font-semibold px-8 py-3 rounded-full"
              >
                <i className="fas fa-envelope mr-2"></i>
                Contact Us
              </Link>
              <Link
                href="/faq"
                className="text-slate-600 hover:text-accent-blue font-semibold px-8 py-3 rounded-full border border-slate-300 hover:border-accent-blue transition-all"
              >
                <i className="fas fa-question-circle mr-2"></i>
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
