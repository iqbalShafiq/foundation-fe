import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  direction?: 'up' | 'down';
  align?: 'left' | 'right';
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  direction = 'up',
  align = 'left',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    setIsOpen(false);
  };

  const dropdownPosition = direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';
  const dropdownAlign = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div className={`absolute ${dropdownPosition} ${dropdownAlign} w-56 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 py-1`}>
          {items.map((item) => {
            const Icon = item.icon;
            const itemVariant = item.variant === 'danger' 
              ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300' 
              : 'text-gray-200 hover:bg-gray-600 hover:text-gray-100';

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-all duration-200 ${itemVariant}`}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;