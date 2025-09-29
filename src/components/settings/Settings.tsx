import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SettingsSidebar from './SettingsSidebar';
import AccountInformation from './AccountInformation';
import PreferencesSection from './PreferencesSection';
import MonthlyTokens from './MonthlyTokens';
import ModelCategoriesSection from './ModelCategoriesSection';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active section from URL
  const getActiveSectionFromPath = (pathname: string): string => {
    if (pathname === '/settings/account') return 'account';
    if (pathname === '/settings/preferences') return 'preferences';
    if (pathname === '/settings/monthly-tokens') return 'monthly-tokens';
    if (pathname === '/settings/model-categories') return 'model-categories';
    return 'account'; // default
  };

  const activeSection = getActiveSectionFromPath(location.pathname);

  // Redirect /settings to /settings/account by default
  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/account', { replace: true });
    }
  }, [location.pathname, navigate]);

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountInformation />;
      case 'preferences':
        return <PreferencesSection />;
      case 'monthly-tokens':
        return <MonthlyTokens />;
      case 'model-categories':
        return <ModelCategoriesSection />;
      default:
        return <AccountInformation />;
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <SettingsSidebar 
        activeSection={activeSection}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;