import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-300 border-t border-black mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-gray-800">Beachदे.com</span>
            </div>
            <p className="text-gray-600 mb-4">
              Buy and sell anything with ease. Discover great deals nearby and turn your items into cash.
            </p>
            <div className="flex items-center space-x-3">
              <a href="#" aria-label="Facebook" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Facebook className="w-5 h-5 text-gray-600" />
              </a>
              <a href="#" aria-label="Instagram" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Instagram className="w-5 h-5 text-gray-600" />
              </a>
              <a href="#" aria-label="Twitter" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Twitter className="w-5 h-5 text-gray-600" />
              </a>
              <a href="#" aria-label="YouTube" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Youtube className="w-5 h-5 text-gray-600" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Marketplace</h4>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link to="/products" className="hover:text-blue-600">Browse Products</Link>
              </li>
              <li>
                <Link to="/create-product" className="hover:text-blue-600">Sell an Item</Link>
              </li>
              <li>
                <Link to="/my-products" className="hover:text-blue-600">My Listings</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-blue-600">My Profile</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Popular Categories</h4>
            <ul className="grid grid-cols-2 gap-3 text-gray-600">
              <li><Link to="/products?category=Electronics" className="hover:text-blue-600">Electronics</Link></li>
              <li><Link to="/products?category=Vehicles" className="hover:text-blue-600">Vehicles</Link></li>
              <li><Link to="/products?category=Home%20%26%20Garden" className="hover:text-blue-600">Home & Garden</Link></li>
              <li><Link to="/products?category=Fashion" className="hover:text-blue-600">Fashion</Link></li>
              <li><Link to="/products?category=Sports" className="hover:text-blue-600">Sports</Link></li>
              <li><Link to="/products?category=Books" className="hover:text-blue-600">Books</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                <span>India</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-gray-500" />
                <a href="tel:+910000000000" className="hover:text-blue-600">+91 00000 00000</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-gray-500" />
                <a href="mailto:support@example.com" className="hover:text-blue-600">support@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-10 mt-10 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Beachदे.com. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <Link to="#" className="hover:text-blue-600">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="#" className="hover:text-blue-600">Terms</Link>
            <span className="text-gray-300">|</span>
            <Link to="#" className="hover:text-blue-600">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
