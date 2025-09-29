import React, { useState, useEffect } from 'react';
import { Bot, AlertCircle, Type, Image, File } from 'lucide-react';
import { Modal } from '../ui';
import { Model, getModelProvider } from '../../types/models';
import { apiService } from '../../services/api';

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel?: (model: Model) => void; // Optional callback for model selection
  selectionMode?: boolean; // Whether modal is for selection or just viewing
}

const ModelsModal: React.FC<ModelsModalProps> = ({ isOpen, onClose, onSelectModel, selectionMode = false }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && models.length === 0) {
      loadModels();
    }
  }, [isOpen, models.length]);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError('');
      const modelsData = await apiService.getModels();
      setModels(modelsData);
    } catch (err: unknown) {
      setError('Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getModelProvider(model).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatContextLength = (length: number) => {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  const formatPrice = (price: number) => {
    const pricePerMillion = price * 1000000;
    if (pricePerMillion < 0.01) return '<$0.01';
    return `$${pricePerMillion.toFixed(2)}`;
  };

  const handleSelectModel = (model: Model) => {
    if (onSelectModel) {
      onSelectModel(model);
      onClose();
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality.toLowerCase()) {
      case 'text':
        return <Type className="h-3 w-3" />;
      case 'image':
        return <Image className="h-3 w-3" />;
      case 'document':
      case 'file':
        return <File className="h-3 w-3" />;
      default:
        return <Type className="h-3 w-3" />;
    }
  };

  const cleanModelName = (modelName: string, providerName: string) => {
    // Remove provider prefix from model name if it exists
    const providerPrefixes = [
      `${providerName}:`,
      `${providerName}/`,
      `${providerName}-`,
      providerName.toLowerCase() + ':',
      providerName.toLowerCase() + '/',
      providerName.toLowerCase() + '-'
    ];
    
    let cleanName = modelName;
    for (const prefix of providerPrefixes) {
      if (cleanName.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanName = cleanName.substring(prefix.length);
        break;
      }
    }
    
    return cleanName;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={selectionMode ? "Select a Model" : "Available Models"} size="lg">
      <div className="space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Loading models...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center space-x-2 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Models Grid */}
        {!loading && !error && (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4 pr-2">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className={`bg-gray-700 border border-gray-600 rounded-lg p-3 transition-all duration-200 hover:shadow-lg ${
                    selectionMode && model.is_active 
                      ? 'hover:bg-gray-600 cursor-pointer hover:border-blue-500' 
                      : selectionMode 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-600'
                  }`}
                  onClick={() => selectionMode && model.is_active && handleSelectModel(model)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <Bot className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    {model.is_active ? (
                      <span className="px-1.5 py-0.5 text-xs bg-green-900/30 text-green-400 rounded border border-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-500 rounded border border-gray-700">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {/* Model Name */}
                  <h3 className="text-sm font-semibold text-gray-100 mb-1 line-clamp-1">
                    {cleanModelName(model.name, getModelProvider(model))}
                  </h3>
                  
                  {/* Provider */}
                  <p className="text-xs text-gray-400 mb-3">
                    {getModelProvider(model)}
                  </p>
                  
                  {/* Stats Grid */}
                  <div className="space-y-2 text-xs">
                    {/* Context & Max Output */}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Context:</span>
                      <span className="text-gray-200">{formatContextLength(model.context_length)}</span>
                    </div>
                    
                    {/* Input Price with Icons */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">IN:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-200">{formatPrice(model.prompt_price)}/1M</span>
                        <div className="flex space-x-0.5">
                          {model.input_modalities.map((modality) => (
                            <span key={modality} className="text-blue-400" title={modality}>
                              {getModalityIcon(modality)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Output Price with Icons */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">OUT:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-200">{formatPrice(model.completion_price)}/1M</span>
                        <div className="flex space-x-0.5">
                          {model.output_modalities.map((modality) => (
                            <span key={modality} className="text-green-400" title={modality}>
                              {getModalityIcon(modality)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredModels.length === 0 && !loading && !error && (
              <div className="text-center py-8 text-gray-400">
                No models found matching your search.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-600">
          <p className="text-sm text-gray-400">
            {filteredModels.length} of {models.length} models
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModelsModal;