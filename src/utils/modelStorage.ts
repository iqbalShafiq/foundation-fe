import { ModelType } from '../types/chat';

const MODEL_STORAGE_KEY = 'foundation_chat_selected_model';

export const modelStorage = {
  save: (model: ModelType): void => {
    try {
      sessionStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch (error) {
      console.warn('Failed to save model to session storage:', error);
    }
  },

  load: (defaultModel: ModelType = 'Standard'): ModelType => {
    try {
      const saved = sessionStorage.getItem(MODEL_STORAGE_KEY);
      if (saved && ['Fast', 'Standard', 'Fast Reasoning', 'Reasoning'].includes(saved)) {
        return saved as ModelType;
      }
    } catch (error) {
      console.warn('Failed to load model from session storage:', error);
    }
    return defaultModel;
  },

  clear: (): void => {
    try {
      sessionStorage.removeItem(MODEL_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear model from session storage:', error);
    }
  }
};