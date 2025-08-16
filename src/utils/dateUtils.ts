import { Conversation, GroupedConversations } from '../types/chat';

export const formatDateGroup = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }
  
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  // Format as dd MM yyyy
  const day = messageDate.getDate().toString().padStart(2, '0');
  const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
  const year = messageDate.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const groupConversationsByDate = (conversations: Conversation[]): GroupedConversations => {
  const grouped: GroupedConversations = {};
  
  conversations.forEach(conversation => {
    const date = new Date(conversation.updated_at);
    const group = formatDateGroup(date);
    
    if (!grouped[group]) {
      grouped[group] = [];
    }
    
    grouped[group].push(conversation);
  });
  
  // Sort each group by updated_at descending
  Object.keys(grouped).forEach(group => {
    grouped[group].sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });
  
  return grouped;
};

export const sortDateGroups = (groups: string[]): string[] => {
  return groups.sort((a, b) => {
    // Priority order: Today, Yesterday, then dates in descending order
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    
    // For date strings, convert back to date and compare
    const dateA = parseDateGroup(a);
    const dateB = parseDateGroup(b);
    
    return dateB.getTime() - dateA.getTime();
  });
};

const parseDateGroup = (dateGroup: string): Date => {
  // Parse "dd MM yyyy" format
  const [day, month, year] = dateGroup.split(' ').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 30) {
    return `${diffInDays}d`;
  } else {
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo`;
    } else {
      const diffInYears = Math.floor(diffInMonths / 12);
      return `${diffInYears}y`;
    }
  }
};