export type UserPreferences = {
  id: number;
  user_id: number;
  nickname: string | null;
  job: string | null;
  chatbot_preference: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPreferencesUpdate = {
  nickname?: string | null;
  job?: string | null;
  chatbot_preference?: string | null;
};