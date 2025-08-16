import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  collapsed?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  className = '',
  collapsed = false
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-2 hover:bg-gray-700 rounded-lg transition-all duration-200 group ${
        isActive ? 'bg-blue-900/30 border border-blue-500/30' : ''
      } ${className} ${collapsed ? 'justify-center py-1' : 'py-1'}`}
      title={label}
    >
      <div className={`flex items-center justify-center w-6 h-6 text-gray-400 group-hover:text-gray-200 transition-all duration-200 flex-shrink-0 ${
        isActive ? 'text-blue-400' : ''
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-sm font-medium text-gray-200 group-hover:text-white ml-3 whitespace-nowrap transition-all duration-300 ${
        isActive ? 'text-white' : ''
      } ${collapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 delay-100'}`}>
        {label}
      </span>
    </button>
  );
};

export default SidebarButton;