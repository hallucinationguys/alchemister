import { getAuthHeader } from '@/shared/lib/react-query/errorHandling'

/**
 * API response interface for standardized responses
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

/**
 * API error interface for standardized error responses
 */
export interface ApiErrorResponse {
  error: string
  details?: string
  status: number
  code?: string
  isRetryable?: boolean
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  withAuth?: boolean
  retries?: number
  retryDelay?: number
}

/**
 * Maximum number of retries for API requests
 */
const MAX_RETRIES = 3

/**
 * Base delay for exponential backoff (in milliseconds)
 */
const BASE_RETRY_DELAY = 1000

/**
 * HTTP status codes that are considered retryable
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * Base API client for making HTTP requests
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  },

  /**
   * Make a POST request
   */
  async post<T, D = unknown>(url: string, data?: D, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Make a PUT request
   */
  async put<T, D = unknown>(url: string, data?: D, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Make a PATCH request
   */
  async patch<T, D = unknown>(url: string, data?: D, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  },

  /**
   * Make a generic request with standardized error handling and retry logic
   */
  async request<T>(url: string, options: ApiRequestOptions = {}, retryCount = 0): Promise<T> {
    const {
      params,
      withAuth = true,
      retries = MAX_RETRIES,
      retryDelay = BASE_RETRY_DELAY,
      ...fetchOptions
    } = options

    // Build URL with query parameters
    const queryParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : ''

    const requestUrl = queryParams ? `${url}?${queryParams}` : url

    // Set default headers
    const headers = new Headers(fetchOptions.headers)

    if (
      !headers.has('Content-Type') &&
      fetchOptions.body &&
      !(fetchOptions.body instanceof FormData)
    ) {
      headers.set('Content-Type', 'application/json')
    }

    // Add auth header if needed
    if (withAuth) {
      const authHeader = getAuthHeader()
      if (authHeader.Authorization) {
        headers.set('Authorization', authHeader.Authorization)
      }
    }

    try {
      // Make the request
      const response = await fetch(requestUrl, {
        ...fetchOptions,
        headers,
      })

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/plain')) {
        const text = await response.text()
        if (!response.ok) {
          const error = {
            error: text,
            status: response.status,
            isRetryable: RETRYABLE_STATUS_CODES.includes(response.status),
          }

          // Retry if appropriate
          if (error.isRetryable && retryCount < retries) {
            return this.retryRequest<T>(url, options, retryCount, retryDelay)
          }

          throw error
        }
        return text as unknown as T
      }

      // Parse JSON response
      let data
      try {
        data = await response.json()
      } catch (error) {
        const parseError = {
          error: 'Failed to parse response',
          status: response.status,
          details: error instanceof Error ? error.message : String(error),
          isRetryable: false,
        }

        throw parseError
      }

      // Handle error responses
      if (!response.ok) {
        const apiError = {
          error: data.error || 'An error occurred',
          status: response.status,
          details: data.details || data.message,
          code: data.code,
          isRetryable: RETRYABLE_STATUS_CODES.includes(response.status) || data.isRetryable,
        }

        // Retry if appropriate
        if (apiError.isRetryable && retryCount < retries) {
          return this.retryRequest<T>(url, options, retryCount, retryDelay)
        }

        throw apiError
      }

      return data
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('network')) {
        const networkError = {
          error: 'Network error',
          details: error.message,
          code: 'NETWORK_ERROR',
          isRetryable: true,
        }

        // Retry if appropriate
        if (retryCount < retries) {
          return this.retryRequest<T>(url, options, retryCount, retryDelay)
        }

        throw networkError
      }

      // Re-throw other errors
      throw error
    }
  },

  /**
   * Retry a request with exponential backoff
   */
  async retryRequest<T>(
    url: string,
    options: ApiRequestOptions,
    retryCount: number,
    baseDelay: number
  ): Promise<T> {
    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(baseDelay * Math.pow(2, retryCount) * (0.8 + Math.random() * 0.4), 30000)

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay))

    // Retry the request with incremented retry count
    return this.request<T>(url, options, retryCount + 1)
  },
}
