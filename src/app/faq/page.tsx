import { Header, Footer } from '@/components/layout';

const faqs = [
  {
    question: 'How do I list my property?',
    answer: 'Register as an agent, complete your profile, then click "Add Listing" from your dashboard. Fill in the property details, upload photos, and submit for approval.',
  },
  {
    question: 'How long does listing approval take?',
    answer: 'Most listings are reviewed and approved within 24-48 hours. You will receive an email notification once your listing is live.',
  },
  {
    question: 'What are the fees for listing a property?',
    answer: 'Basic listings are free. Premium placement and featured listings are available for Gold and Premium tier members.',
  },
  {
    question: 'How do I contact a property agent?',
    answer: 'Click on any property listing and use the inquiry form or contact details provided. You can also schedule a viewing directly through the platform.',
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Yes, we use industry-standard encryption and never share your personal information with third parties without your consent.',
  },
  {
    question: 'Can I save properties to view later?',
    answer: 'Yes, create an account and use the heart icon to save properties to your favorites list.',
  },
];

export default function FAQPage() {
  return (
    <>
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-slate-800 mb-8 text-center">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-ultra rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">
                  <i className="fas fa-question-circle text-accent-blue mr-2"></i>
                  {faq.question}
                </h3>
                <p className="text-slate-600 leading-relaxed pl-7">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-500 mb-4">Still have questions?</p>
            <a
              href="/contact"
              className="btn-premium text-white font-semibold px-8 py-3 rounded-full inline-block"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
