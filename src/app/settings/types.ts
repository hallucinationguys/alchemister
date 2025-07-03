// Provider-related types
export interface Model {
  id: string
  name: string
  display_name: string
  is_active: boolean
  supports_vision?: boolean
  tags?: string[]
}

export interface ProviderResponse {
  id: string
  name: string
  display_name: string
  is_active: boolean
  models: Model[]
  icon?: string
  tags?: string[]
  color?: { bg: string; border: string; text: string }
}

export interface UserProviderSettingResponse {
  id: string
  provider_id: string
  provider_name: string
  provider_display_name: string
  is_active: boolean
  api_key_set: boolean
  api_base_override: string | null
  updated_at: string
}

export interface UpsertUserProviderSettingRequest {
  provider_id: string
  api_key: string
  api_base_override?: string
  is_active?: boolean
}

// User-related types
export interface UserResponse {
  id: string
  email: string
  email_verified: boolean
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  full_name: string
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export interface UpdateUserResponse {
  user: UserResponse
}

export interface GetUserResponse {
  user: UserResponse
}

// Enhanced types for frontend
export interface EnhancedProviderResponse extends ProviderResponse {
  brandIcon?: string
  color?: { bg: string; border: string; text: string }
}

// API Response wrapper types
export interface ApiSuccessResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: boolean
  error: {
    code: string
    message: string
    details?: string
  }
}

// Hook return types
export interface UseAiProvidersResult {
  providers: ProviderResponse[]
  userSettings: UserProviderSettingResponse[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface UseProviderSettingsResult {
  saveSettings: (
    data: UpsertUserProviderSettingRequest
  ) => Promise<UserProviderSettingResponse | undefined>
  loading: boolean
  error: string | null
}

export interface UseProfileResult {
  updateProfile: (data: UpdateUserRequest) => Promise<UserResponse | undefined>
  loading: boolean
  error: string | null
}
