import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { UserPreferencesUpdate } from '../../types/preferences';
import { Card, Input, Button, Alert } from '../ui';
import { Save, Settings as SettingsIcon } from 'lucide-react';

const PreferencesSection: React.FC = () => {
  const [formData, setFormData] = useState<UserPreferencesUpdate>({
    nickname: '',
    job: '',
    chatbot_preference: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const userPrefs = await apiService.getUserPreferences();
      setFormData({
        nickname: userPrefs.nickname || '',
        job: userPrefs.job || '',
        chatbot_preference: userPrefs.chatbot_preference || ''
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setError('Failed to load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserPreferencesUpdate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null
    }));
    // Clear success message when user starts editing
    if (success) setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await apiService.updateUserPreferences(formData);
      setSuccess('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadPreferences();
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Preferences</h2>
            <p className="text-gray-400">Loading your preferences...</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading preferences...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-6 w-6 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Preferences</h2>
          <p className="text-gray-400">Customize your chat experience and personal settings</p>
        </div>
      </div>

      {/* Preferences Form */}
      <Card>
        <div className="space-y-6">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          {success && (
            <Alert variant="success">{success}</Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100">Personal Information</h3>
              <p className="text-sm text-gray-400">How you'd like to be identified and addressed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nickname"
                placeholder="Enter your preferred nickname"
                value={formData.nickname || ''}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                helperText="How you'd like to be addressed in conversations"
              />

              <Input
                label="Job/Profession"
                placeholder="Enter your job or profession"
                value={formData.job || ''}
                onChange={(e) => handleInputChange('job', e.target.value)}
                helperText="Your current job or profession"
              />
            </div>
          </div>

          {/* Chat Preferences */}
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100">Chat Preferences</h3>
              <p className="text-sm text-gray-400">Customize how the AI assistant interacts with you</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Chatbot Interaction Style
              </label>
              <textarea
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                placeholder="Describe how you'd like the chatbot to interact with you (tone, style, level of detail, etc.)"
                value={formData.chatbot_preference || ''}
                onChange={(e) => handleInputChange('chatbot_preference', e.target.value)}
                rows={4}
              />
              <p className="text-sm text-gray-400">
                Examples: "Be concise and technical", "Use friendly and casual tone", "Provide detailed explanations", etc.
              </p>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-300 mb-2">💡 Tips for better interactions</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Be specific about your communication preferences</li>
              <li>• Mention your expertise level in relevant topics</li>
              <li>• Include any special requirements or constraints</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Saved
            </Button>
            
            <Button
              icon={Save}
              iconPosition="left"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PreferencesSection;