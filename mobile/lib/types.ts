// Shared types for the mobile app

export interface User {
  id: string;
  partnerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isVeraPartner?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}
