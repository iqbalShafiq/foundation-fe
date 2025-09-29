import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { UserModelCategory, Model, CreateUserModelCategoryRequest, isCustomCategory, getModelProvider } from '../../types/models';
import { Card, Input, Button, Alert } from '../ui';
import { Bot, Plus, Trash2, DollarSign, Info, List } from 'lucide-react';
import ModelsModal from '../chat/ModelsModal';

const ModelCategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<UserModelCategory[]>([]);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add new category state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  
  
  // Models modal state
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, modelsData] = await Promise.all([
        apiService.getUserModelCategories(),
        apiService.getModels()
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setAvailableModels(Array.isArray(modelsData) ? modelsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load model categories. Please try again.');
      // Set empty arrays as fallback
      setCategories([]);
      setAvailableModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedModelId) {
      setError('Please provide both category name and select a model.');
      return;
    }

    try {
      setAddingCategory(true);
      setError(null);
      
      const newCategory: CreateUserModelCategoryRequest = {
        category_name: newCategoryName.trim(),
        display_name: newCategoryName.trim(),
        model_id: selectedModelId
      };
      
      await apiService.createUserModelCategory(newCategory);
      await loadData(); // Reload data
      
      setSuccess('Model category created successfully!');
      setNewCategoryName('');
      setSelectedModelId('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      setError('Failed to create model category. Please try again.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this model category?')) {
      return;
    }

    try {
      setError(null);
      await apiService.deleteUserModelCategory(categoryId);
      await loadData();
      setSuccess('Model category deleted successfully!');
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError('Failed to delete model category. Please try again.');
    }
  };


  const formatCostPer1M = (costPerToken: number) => {
    return (costPerToken * 1000000).toFixed(2); // Convert cost per token to cost per 1M tokens
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Model Categories</h2>
            <p className="text-gray-400">Loading model categories...</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading model categories...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Model Categories</h2>
            <p className="text-gray-400">Manage your custom AI model categories</p>
          </div>
        </div>
        
        <Button
          icon={Plus}
          iconPosition="left"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={showAddForm}
        >
          Add Category
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Add New Category Form */}
      {showAddForm && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Add New Model Category</h3>
            
            <div className="space-y-4">
              {/* Category Name - Full Width */}
              <div>
                <Input
                  label="Category Name"
                  placeholder="e.g., Creative, Coding, Analysis"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              
              {/* Select Model - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Select Model
                </label>
                
                {/* Selected Model Display */}
                {selectedModelId && (
                  <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                    {(() => {
                      const selectedModel = availableModels.find(m => m.id === selectedModelId);
                      if (!selectedModel) return <span className="text-gray-400">Model not found</span>;
                      
                      return (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-100">{selectedModel.name}</div>
                            <div className="text-sm text-gray-400">
                              {getModelProvider(selectedModel)} • 
                              ${formatCostPer1M(selectedModel.prompt_price)}/1M input • 
                              ${formatCostPer1M(selectedModel.completion_price)}/1M output
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedModelId('')}
                          >
                            Change
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Browse Models Button */}
                {!selectedModelId && (
                  <Button
                    variant="outline"
                    onClick={() => setIsModelsModalOpen(true)}
                    icon={List}
                    iconPosition="left"
                    className="w-full"
                  >
                    Browse Available Models
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategoryName('');
                  setSelectedModelId('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleAddCategory}
                loading={addingCategory}
                disabled={!newCategoryName.trim() || !selectedModelId || addingCategory}
              >
                Add Category
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Current Categories */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Your Model Categories</h3>
          
          {(categories || []).length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No model categories configured yet.</p>
              <p className="text-gray-500 text-sm">Add your first custom model category to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(categories || []).map((category) => {
                const isCustomCat = isCustomCategory(category);
                
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-gray-700/50 border border-gray-600 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-blue-400" />
                          <span className="font-medium text-gray-100">{category.display_name || category.category_name}</span>
                          {!isCustomCat && (
                            <span className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-400">
                        <p>{category.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span>{category.model_name}</span>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatCostPer1M(category.model_pricing.prompt_price)}/1M in, {formatCostPer1M(category.model_pricing.completion_price)}/1M out</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Info className="h-3 w-3" />
                            <span>{category.model_pricing.context_length.toLocaleString()} context</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isCustomCat && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          icon={Trash2}
                          iconPosition="left"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-300 mb-2">💡 About Model Categories</h4>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Model categories let you customize your AI experience beyond the default options</li>
            <li>• Each category maps to a specific AI model with its own capabilities and pricing</li>
            <li>• Custom categories appear in your model selector alongside Fast, Standard, etc.</li>
            <li>• Default categories (Fast, Standard, Fast Reasoning, Reasoning) cannot be deleted</li>
          </ul>
        </div>
      </Card>

      {/* Models Modal */}
      <ModelsModal
        isOpen={isModelsModalOpen}
        onClose={() => setIsModelsModalOpen(false)}
        selectionMode={true}
        onSelectModel={(model) => {
          setSelectedModelId(model.id);
          setIsModelsModalOpen(false);
        }}
      />
    </div>
  );
};

export default ModelCategoriesSection;