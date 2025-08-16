import React from 'react';

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  const displayTitle = title || "New Chat";
  
  return (
    <header className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-4 min-w-0">
      <div className="flex items-center justify-center h-8 min-w-0">
        <h1 className="text-xl font-bold text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis min-w-0">{displayTitle}</h1>
      </div>
    </header>
  );
};

export default ChatHeader;