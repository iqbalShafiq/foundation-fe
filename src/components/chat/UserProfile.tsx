import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Dropdown from '../ui/Dropdown';

interface UserProfileProps {
  className?: string;
  collapsed?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '', collapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const dropdownItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => navigate('/settings')
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOut,
      onClick: logout,
      variant: 'danger' as const
    }
  ];

  const triggerComponent = collapsed ? (
    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-xs font-medium cursor-pointer hover:bg-blue-700 transition-all duration-200">
      {user.username.charAt(0).toUpperCase()}
    </div>
  ) : (
    <div className="flex items-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 cursor-pointer border border-gray-600 hover:border-gray-500 w-full">
      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
        {user.username.charAt(0).toUpperCase()}
      </div>
      <span className="text-gray-200 text-sm font-medium">{user.username}</span>
    </div>
  );

  return (
    <Dropdown
      trigger={triggerComponent}
      items={dropdownItems}
      direction="up"
      align="left"
      className={className}
    />
  );
};

export default UserProfile;