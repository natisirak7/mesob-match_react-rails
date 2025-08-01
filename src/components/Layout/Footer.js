import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Heart, Github, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <ChefHat className="h-8 w-8 text-primary-400" />
              <span className="font-display font-bold text-xl">MesobMatch</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Discover authentic Ethiopian recipes based on the ingredients you have. 
              Connect with traditional flavors and modern cooking techniques.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@mesobmatch.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/recipes" className="text-gray-300 hover:text-white transition-colors">
                  Browse Recipes
                </Link>
              </li>
              <li>
                <Link to="/ingredients" className="text-gray-300 hover:text-white transition-colors">
                  Ingredients
                </Link>
              </li>
              <li>
                <Link to="/match" className="text-gray-300 hover:text-white transition-colors">
                  Recipe Match
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-white transition-colors">
                  Join Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">Ingredient-Based Matching</li>
              <li className="text-gray-300">Recipe Management</li>
              <li className="text-gray-300">User Dashboard</li>
              <li className="text-gray-300">Image Upload</li>
              <li className="text-gray-300">Ethiopian Cuisine Focus</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © 2024 MesobMatch. Built with{' '}
            <Heart className="h-4 w-4 inline text-red-500" />{' '}
            for Ethiopian cuisine lovers.
          </div>
          <div className="text-gray-400 text-sm mt-2 sm:mt-0">
            Powered by Rails API & React
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
