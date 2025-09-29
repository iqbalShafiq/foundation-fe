import React, { useState, useEffect } from 'react';
import { ModelType } from '../../types/chat';
import { UserModelCategory, Model, isCustomCategory, getModelProvider, getModelInputCostPer1M, getModelOutputCostPer1M } from '../../types/models';
import { apiService } from '../../services/api';
import { Zap, Brain, Clock, Sparkles, Bot, DollarSign } from 'lucide-react';

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
  const [categories, setCategories] = useState<UserModelCategory[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelCategories();
  }, []);

  const loadModelCategories = async () => {
    try {
      setLoading(true);
      
      const [categoriesData, modelsData] = await Promise.all([
        apiService.getUserModelCategories(),
        apiService.getModels()
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
    } catch (error) {
      console.error('Failed to load model categories:', error);
      setCategories([]);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultModels = () => [
    {
      category_name: 'Fast',
      description: 'Quick responses for simple questions',
      icon: Zap,
      color: 'text-green-400 bg-green-900/30',
      isDefault: true
    },
    {
      category_name: 'Standard',
      description: 'Balanced performance for most conversations',
      icon: Clock,
      color: 'text-blue-400 bg-blue-900/30',
      isDefault: true
    },
    {
      category_name: 'Fast Reasoning',
      description: 'Quick but thoughtful analysis',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-900/30',
      isDefault: true
    },
    {
      category_name: 'Reasoning',
      description: 'Deep thinking for complex problems',
      icon: Brain,
      color: 'text-orange-400 bg-orange-900/30',
      isDefault: true
    }
  ];

  const handleModelSelect = (categoryName: string) => {
    onModelChange(categoryName as ModelType);
    onClose?.();
  };

  const formatCostPer1M = (costPerToken: number) => {
    return (costPerToken * 1000000).toFixed(2);
  };

  const getModelForCategory = (category: UserModelCategory) => {
    return (models || []).find(m => m.id === category.model_id);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400 mb-4">Loading available models...</p>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Combine default models with user categories
  const allModels = [
    ...getDefaultModels().map(model => ({ ...model, category: null })),
    ...(categories || [])
      .filter(cat => isCustomCategory(cat))
      .map(cat => ({
        category_name: cat.display_name || cat.category_name,
        description: cat.description,
        icon: Bot,
        color: 'text-blue-400 bg-blue-900/30',
        isDefault: false,
        category: cat
      }))
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-4">
        Choose the AI model that best fits your conversation needs.
      </p>
      
      {allModels.map((modelOption) => {
        const Icon = modelOption.icon;
        const isSelected = selectedModel === modelOption.category_name;
        const model = modelOption.category ? getModelForCategory(modelOption.category) : null;
        
        return (
          <button
            key={modelOption.category_name}
            onClick={() => handleModelSelect(modelOption.category_name)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              isSelected
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modelOption.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-100">
                      {modelOption.category_name}
                    </h4>
                    {!modelOption.isDefault && (
                      <span className="px-2 py-1 text-xs bg-purple-900/30 text-purple-300 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  )}
                </div>
                
                <p className="text-sm text-gray-400 mt-1">
                  {modelOption.description}
                </p>
                
                {modelOption.category && (
                  <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                    <span>{modelOption.category.model_name}</span>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        {formatCostPer1M(modelOption.category.model_pricing.prompt_price)}/1M in, {formatCostPer1M(modelOption.category.model_pricing.completion_price)}/1M out
                      </span>
                    </div>
                    <span>{modelOption.category.model_pricing.context_length.toLocaleString()} ctx</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
      
      {(categories || []).length === 0 && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 You can create custom model categories in Settings → Model Categories
          </p>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;