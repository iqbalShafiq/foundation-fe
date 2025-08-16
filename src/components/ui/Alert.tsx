import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  children,
  className = ''
}) => {
  const variantConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-700',
      textColor: 'text-green-400',
      iconColor: 'text-green-400'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700',
      textColor: 'text-red-400',
      iconColor: 'text-red-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-900/30',
      borderColor: 'border-yellow-700',
      textColor: 'text-yellow-400',
      iconColor: 'text-yellow-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-700',
      textColor: 'text-blue-400',
      iconColor: 'text-blue-400'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`
      rounded-lg border p-4 ${config.bgColor} ${config.borderColor} ${className}
    `}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${config.textColor}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-1' : ''} text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;