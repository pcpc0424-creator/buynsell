import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <i className="fas fa-home text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold font-display">
                Buy <span className="gradient-text">&</span> Sell
              </span>
            </Link>
            <p className="text-white/40 mb-6">
              Your trusted partner in finding the perfect property.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:bg-accent-blue hover:text-white transition-all"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:bg-accent-blue hover:text-white transition-all"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:bg-accent-blue hover:text-white transition-all"
              >
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-semibold mb-6">Help</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="text-white/40 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/40 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-white/40 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-white/40 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/40 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="text-white font-semibold mb-6">Follow Us</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/40 hover:text-white transition-colors">
                  <i className="fab fa-facebook mr-2"></i>Facebook
                </a>
              </li>
              <li>
                <a href="#" className="text-white/40 hover:text-white transition-colors">
                  <i className="fab fa-instagram mr-2"></i>Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-white/40 hover:text-white transition-colors">
                  <i className="fab fa-twitter mr-2"></i>Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center">
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} Buy & Sell. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
