import { apiClient } from './api-client'
import { handleQueryError } from '@/lib/react-query/errorHandling'
import type {
  ProviderResponse,
  UserProviderSettingResponse,
  UpsertUserProviderSettingRequest,
  UserResponse,
  UpdateUserRequest,
  GetUserResponse,
  UpdateUserResponse,
} from '@/features/settings/types/types'

const API_BASE = '/api/settings'

/**
 * Service for profile-related API operations
 */
export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserResponse> {
    try {
      const response = await apiClient.get<{ data: GetUserResponse; success: boolean }>(
        `${API_BASE}/profile`
      )
      if (!response || !response.data || !response.data.user) {
        throw new Error('Invalid response format: missing user data')
      }
      return response.data.user
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateUserRequest): Promise<UserResponse> {
    try {
      const response = await apiClient.patch<{ data: UpdateUserResponse; success: boolean }>(
        `${API_BASE}/profile`,
        data
      )
      if (!response || !response.data || !response.data.user) {
        throw new Error('Invalid response format: missing user data')
      }
      return response.data.user
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },
}

/**
 * Service for provider settings API operations
 */
export const providerSettingsService = {
  /**
   * Get all available providers
   */
  async getProviders(): Promise<ProviderResponse[]> {
    try {
      const response = await apiClient.get<{ data: ProviderResponse[]; success: boolean }>(
        `${API_BASE}/provider`
      )
      if (!response || !response.data) {
        return []
      }
      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Get user provider settings
   */
  async getUserProviderSettings(): Promise<UserProviderSettingResponse[]> {
    try {
      const response = await apiClient.get<{
        data: UserProviderSettingResponse[]
        success: boolean
      }>(`${API_BASE}/provider/settings`)
      if (!response || !response.data) {
        return []
      }
      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Update user provider settings
   */
  async updateProviderSettings(
    data: UpsertUserProviderSettingRequest
  ): Promise<UserProviderSettingResponse> {
    try {
      const response = await apiClient.post<{
        data: UserProviderSettingResponse
        success: boolean
      }>(`${API_BASE}/provider/settings`, data)
      if (!response || !response.data) {
        throw new Error('Invalid response format: missing provider setting data')
      }
      return response.data
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },

  /**
   * Delete user provider settings
   */
  async deleteProviderSettings(providerId: string): Promise<void> {
    try {
      return await apiClient.delete<void>(`${API_BASE}/provider/settings/${providerId}`)
    } catch (error) {
      const apiError = handleQueryError(error)
      throw apiError
    }
  },
}
