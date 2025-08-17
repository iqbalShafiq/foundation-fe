import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  className?: string;
  collapsed?: boolean;
  iconColor?: 'default' | 'blue';
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  href,
  isActive = false,
  className = '',
  collapsed = false,
  iconColor = 'default'
}) => {
  const baseClassName = `flex items-center justify-center w-full hover:bg-gray-700 rounded-lg transition-all duration-200 group ${
    isActive ? 'bg-blue-900/30 border border-blue-500/30' : ''
  } ${className}`;

  const iconClassName = `w-4 h-4 transition-all duration-200 ${
    iconColor === 'blue' 
      ? 'text-blue-500 group-hover:text-blue-400' 
      : isActive 
        ? 'text-blue-400' 
        : 'text-gray-400 group-hover:text-gray-200'
  }`;

  if (collapsed) {
    if (href) {
      return (
        <Link
          to={href}
          className={`${baseClassName} h-10`}
          title={label}
        >
          <Icon className={iconClassName} />
        </Link>
      );
    }
    
    return (
      <button
        onClick={onClick}
        className={`${baseClassName} h-10`}
        title={label}
      >
        <Icon className={iconClassName} />
      </button>
    );
  }

  const expandedClassName = `flex items-center w-full py-1 px-2 hover:bg-gray-700 rounded-lg transition-all duration-200 group ${
    isActive ? 'bg-blue-900/30 border border-blue-500/30' : ''
  } ${className}`;

  if (href) {
    return (
      <Link
        to={href}
        className={expandedClassName}
        title={label}
      >
        <div className={`flex items-center justify-center w-6 h-6 transition-all duration-200 flex-shrink-0 ${
          iconColor === 'blue' 
            ? 'text-blue-500 group-hover:text-blue-400' 
            : isActive 
              ? 'text-blue-400' 
              : 'text-gray-400 group-hover:text-gray-200'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium text-gray-200 group-hover:text-white ml-3 whitespace-nowrap transition-all duration-300 ${
          isActive ? 'text-white' : ''
        } opacity-100 delay-100`}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={expandedClassName}
      title={label}
    >
      <div className={`flex items-center justify-center w-6 h-6 transition-all duration-200 flex-shrink-0 ${
        iconColor === 'blue' 
          ? 'text-blue-500 group-hover:text-blue-400' 
          : isActive 
            ? 'text-blue-400' 
            : 'text-gray-400 group-hover:text-gray-200'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-sm font-medium text-gray-200 group-hover:text-white ml-3 whitespace-nowrap transition-all duration-300 ${
        isActive ? 'text-white' : ''
      } opacity-100 delay-100`}>
        {label}
      </span>
    </button>
  );
};

export default SidebarButton;