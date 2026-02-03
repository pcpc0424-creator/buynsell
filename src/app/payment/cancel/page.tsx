'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

export default function PaymentCancelPage() {
  return (
    <>
      <Header />

      <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-lg mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Cancel Icon */}
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-times text-4xl text-yellow-500"></i>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Cancelled</h1>
            <p className="text-slate-500 mb-6">
              Your payment was cancelled. No charges have been made to your account.
            </p>

            {/* Info Box */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-slate-800 mb-2">
                <i className="fas fa-question-circle mr-2 text-slate-400"></i>
                Why was my payment cancelled?
              </h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-check text-slate-400 mr-2 mt-1 w-4"></i>
                  You clicked the cancel button during checkout
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-slate-400 mr-2 mt-1 w-4"></i>
                  The payment session expired
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-slate-400 mr-2 mt-1 w-4"></i>
                  There was an issue with the payment provider
                </li>
              </ul>
            </div>

            {/* Help Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                Need Help?
              </h3>
              <p className="text-sm text-blue-700">
                If you&apos;re having trouble completing your payment, our support team is here to help.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="btn-premium text-white font-semibold px-8 py-3 rounded-full"
              >
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </Link>
              <Link
                href="/contact"
                className="bg-slate-100 text-slate-700 font-semibold px-8 py-3 rounded-full hover:bg-slate-200 transition-all"
              >
                <i className="fas fa-headset mr-2"></i>
                Contact Support
              </Link>
            </div>

            <Link
              href="/"
              className="inline-block mt-6 text-slate-500 hover:text-slate-700 text-sm"
            >
              <i className="fas fa-arrow-left mr-1"></i>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
