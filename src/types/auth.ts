export type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
};