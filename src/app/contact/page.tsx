'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components/layout';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-slate-800 mb-8 text-center">
            Contact <span className="gradient-text">Us</span>
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-ultra rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Get in Touch</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-map-marker-alt text-accent-blue"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Address</h3>
                    <p className="text-slate-500 text-sm">Makati City, Metro Manila, Philippines</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-envelope text-accent-purple"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Email</h3>
                    <p className="text-slate-500 text-sm">info@buynsell.ph</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-pink/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-phone text-accent-pink"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Phone</h3>
                    <p className="text-slate-500 text-sm">+63 2 8888 1234</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-clock text-accent-cyan"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Business Hours</h3>
                    <p className="text-slate-500 text-sm">Mon - Fri: 9AM - 6PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-ultra rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Subject"
                  className="form-input"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="form-input"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
                <button type="submit" className="w-full btn-premium text-white font-semibold py-3 rounded-xl">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
