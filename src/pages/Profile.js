import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
          Profile
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mr-6">
              <User className="h-10 w-10 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize mt-2">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Profile editing functionality coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
