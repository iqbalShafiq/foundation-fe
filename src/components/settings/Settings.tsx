import React, { useState } from 'react';
import SettingsSidebar from './SettingsSidebar';
import AccountInformation from './AccountInformation';
import PreferencesSection from './PreferencesSection';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('account');

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountInformation />;
      case 'preferences':
        return <PreferencesSection />;
      default:
        return <AccountInformation />;
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <SettingsSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
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