import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings as SettingsIcon, CreditCard } from 'lucide-react';

interface SettingsSidebarProps {
  activeSection: string;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeSection }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'account',
      label: 'Account Information',
      icon: User,
      href: '/settings/account'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: SettingsIcon,
      href: '/settings/preferences'
    },
    {
      id: 'monthly-tokens',
      label: 'Monthly Tokens',
      icon: CreditCard,
      href: '/settings/monthly-tokens'
    }
  ];

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 bg-gray-900">
        <div className="flex items-center justify-between h-8">
          <h2 className="text-lg font-semibold text-gray-100">
            Settings
          </h2>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Back to chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-2 pt-3">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Link
                key={item.id}
                to={item.href}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gray-800 border-l-2 border-blue-500 text-gray-200'
                    : 'text-gray-300 hover:text-gray-100 hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 flex justify-center w-full">
          Foundation Chat Settings
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar;