import React from 'react';
import { Bot } from 'lucide-react';

interface ThinkingIndicatorProps {
  content?: string;
  phase: 'thinking' | 'reasoning';
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ content, phase }) => {
  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
        <Bot className="h-5 w-5" />
      </div>
      
      <div className="flex-1 max-w-3xl">
        <div className="inline-block px-5 py-3 bg-gray-700 rounded-2xl rounded-tl-md shadow-md">
          {content ? (
            <div className="relative">
              {/* Content with pulse overlay */}
              <div className="text-gray-300 text-sm whitespace-pre-wrap relative">
                <div className="absolute inset-0 bg-gray-700 opacity-60 animate-pulse rounded"></div>
                <div className="relative z-10 opacity-70">
                  {content}
                </div>
              </div>
              
              {/* Phase indicator */}
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-blue-400 text-xs font-medium animate-pulse">
                  {phase === 'thinking' ? 'Thinking...' : 'Reasoning...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-300 text-sm">
                {phase === 'thinking' ? 'Thinking...' : 'Processing...'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;