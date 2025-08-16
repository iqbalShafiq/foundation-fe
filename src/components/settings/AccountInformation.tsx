import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Input } from '../ui';
import { User } from 'lucide-react';

const AccountInformation: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User className="h-6 w-6 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Account Information</h2>
          <p className="text-gray-400">View your account details and status</p>
        </div>
      </div>

      {/* Account Details Card */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-700">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-100">{user?.username}</h3>
              <p className="text-gray-400">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.is_active 
                    ? 'bg-green-900/30 text-green-400 border border-green-700' 
                    : 'bg-red-900/30 text-red-400 border border-red-700'
                }`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Username"
              value={user?.username || ''}
              disabled
              helperText="Your unique username identifier"
            />
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Your registered email address"
            />
            <Input
              label="Account Role"
              value={user?.role || ''}
              disabled
              helperText="Your permission level in the system"
            />
            <Input
              label="Account Status"
              value={user?.is_active ? 'Active' : 'Inactive'}
              disabled
              helperText="Current status of your account"
            />
          </div>

          {/* Additional Information */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-200 mb-2">Account Security</h4>
            <p className="text-sm text-gray-400 mb-3">
              Your account information is read-only and managed by system administrators. 
              If you need to update any of these details, please contact support.
            </p>
            <div className="text-xs text-gray-500">
              For security reasons, sensitive account changes require administrator approval.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AccountInformation;