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
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-2 py-1 hover:bg-gray-700 rounded-lg transition-all duration-200 group ${
        isActive ? 'bg-blue-900/30 border border-blue-500/30' : ''
      } ${className}`}
      title={label}
    >
      <div className={`flex items-center justify-center w-6 h-6 text-gray-400 group-hover:text-gray-200 transition-all duration-200 ${
        isActive ? 'text-blue-400' : ''
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-sm font-medium text-gray-200 group-hover:text-white ml-3 ${
        isActive ? 'text-white' : ''
      }`}>
        {label}
      </span>
    </button>
  );
};

export default SidebarButton;