import React from 'react';
import { GitBranch } from 'lucide-react';

interface BranchIndicatorProps {
  hasBranches?: boolean;
  branchId?: string | null;
  isActiveBranch?: boolean;
  onClick?: () => void;
}

const BranchIndicator: React.FC<BranchIndicatorProps> = ({ 
  hasBranches, 
  branchId, 
  isActiveBranch, 
  onClick 
}) => {
  if (!hasBranches && !branchId) return null;

  return (
    <div className="flex items-center space-x-2 mt-1">
      {hasBranches && (
        <button
          onClick={onClick}
          className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          title="This message has alternative branches"
        >
          <GitBranch className="h-3 w-3" />
          <span>Has branches</span>
        </button>
      )}
      
      {branchId && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <span>Branch:</span>
          <code className="px-1 py-0.5 bg-gray-700 rounded text-xs font-mono">
            {branchId.slice(0, 8)}...
          </code>
          {isActiveBranch && (
            <span className="text-green-400 text-xs">● active</span>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchIndicator;