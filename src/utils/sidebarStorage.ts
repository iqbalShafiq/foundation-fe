const SIDEBAR_STORAGE_KEY = 'foundation-chat-sidebar-collapsed';

export const getSidebarCollapsedState = (): boolean => {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.warn('Failed to load sidebar state from localStorage:', error);
    return false;
  }
};

export const setSidebarCollapsedState = (isCollapsed: boolean): void => {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isCollapsed));
  } catch (error) {
    console.warn('Failed to save sidebar state to localStorage:', error);
  }
};