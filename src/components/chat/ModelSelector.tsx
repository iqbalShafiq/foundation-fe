import React from 'react';
import { ModelType } from '../../types/chat';
import { Zap, Brain, Clock, Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onClose?: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  onClose
}) => {
  const models = [
    {
      type: 'Fast' as ModelType,
      name: 'Fast',
      description: 'Quick responses for simple questions',
      icon: Zap,
      color: 'text-green-400 bg-green-900/30'
    },
    {
      type: 'Standard' as ModelType,
      name: 'Standard',
      description: 'Balanced performance for most conversations',
      icon: Clock,
      color: 'text-blue-400 bg-blue-900/30'
    },
    {
      type: 'Fast Reasoning' as ModelType,
      name: 'Fast Reasoning',
      description: 'Quick but thoughtful analysis',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-900/30'
    },
    {
      type: 'Reasoning' as ModelType,
      name: 'Reasoning',
      description: 'Deep thinking for complex problems',
      icon: Brain,
      color: 'text-orange-400 bg-orange-900/30'
    }
  ];

  const handleModelSelect = (model: ModelType) => {
    onModelChange(model);
    onClose?.();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-4">
        Choose the AI model that best fits your conversation needs.
      </p>
      
      {models.map((model) => {
        const Icon = model.icon;
        const isSelected = selectedModel === model.type;
        
        return (
          <button
            key={model.type}
            onClick={() => handleModelSelect(model.type)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              isSelected
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${model.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-100">
                    {model.name}
                  </h4>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {model.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ModelSelector;