export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Description */}
          <div className="col-span-2">
            <h2 className="font-black text-2xl bg-gradient-to-r from-red-500 to-blue-500 inline-block text-transparent bg-clip-text">
              Therms.
            </h2>
            <p className="mt-4 text-gray-600 max-w-md">
              Revolutionizing foot comfort with smart thermoregulation technology. Experience the future of wearable temperature control.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-gray-600 hover:text-gray-900">About Us</a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 hover:text-gray-900">Contact</a>
              </li>
              <li>
                <a href="/support" className="text-gray-600 hover:text-gray-900">Support</a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright and Made with love */}
        <div className="mt-8 pt-8 border-t flex justify-between items-center">
          <p className="text-gray-500 text-sm flex items-center">
            Made with 
            <svg className="w-4 h-4 mx-1 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            by The Big 3
          </p>
          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} Therms. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 