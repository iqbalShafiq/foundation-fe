import React from 'react';
import { Bot } from 'lucide-react';

const AnsweringIndicator: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
        <Bot className="h-5 w-5" />
      </div>
      
      <div className="flex-1 max-w-3xl">
        <div className="inline-block px-5 py-3 bg-gray-700 rounded-2xl rounded-tl-md shadow-md">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-gray-300 text-sm">
              Answering...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnsweringIndicator;