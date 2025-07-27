import { toast } from 'sonner'

/**
 * Standard API error interface
 */
export interface ApiError {
  message: string
  status?: number
  details?: string
  code?: string
  isRetryable?: boolean
}

/**
 * Error codes that are considered retryable
 */
export const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'NETWORK_ERROR',
  'TIMEOUT',
  'STREAM_INTERRUPTED',
]

/**
 * HTTP status codes that are considered retryable
 */
export const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]

/**
 * Determines if an error is retryable based on its code or status
 */
export const isRetryableError = (error: ApiError): boolean => {
  if (error.isRetryable !== undefined) {
    return error.isRetryable
  }

  if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true
  }

  if (error.status && RETRYABLE_STATUS_CODES.includes(error.status)) {
    return true
  }

  return false
}

/**
 * Handles and normalizes API errors from various sources
 */
export const handleQueryError = (error: unknown): ApiError => {
  const apiError: ApiError = {
    message: 'An unexpected error occurred',
    isRetryable: false,
  }

  if (error instanceof Error) {
    apiError.message = error.message
    apiError.code = 'code' in error ? String(error.code) : undefined

    // Check for network errors which are typically retryable
    if (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('connection')
    ) {
      apiError.isRetryable = true
    }
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>
    apiError.message = typeof errorObj.message === 'string' ? errorObj.message : apiError.message
    apiError.status = typeof errorObj.status === 'number' ? errorObj.status : undefined
    apiError.details = typeof errorObj.details === 'string' ? errorObj.details : undefined
    apiError.code = typeof errorObj.code === 'string' ? errorObj.code : undefined

    // Determine if the error is retryable based on status code
    if (apiError.status && RETRYABLE_STATUS_CODES.includes(apiError.status)) {
      apiError.isRetryable = true
    }
  }

  return apiError
}

/**
 * Shows an error toast with optional retry functionality
 */
export const showQueryError = (error: ApiError, retry?: () => void) => {
  const isRetryable = isRetryableError(error) || !!retry

  toast.error(error.message, {
    description: error.details,
    action: isRetryable
      ? {
          label: 'Retry',
          onClick: retry || (() => {}),
        }
      : undefined,
    duration: isRetryable ? 10000 : 5000, // Show retryable errors longer
  })

  // Log the error for debugging
  console.error('API Error:', error)
}

/**
 * Helper to get authentication headers for API requests
 */
export const getAuthHeader = () => {
  if (typeof window === 'undefined') return {}

  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Custom error for streaming responses
 */
export class StreamingError extends Error implements ApiError {
  status?: number
  details?: string
  code?: string
  isRetryable: boolean

  constructor(message: string, options?: Partial<ApiError>) {
    super(message)
    this.name = 'StreamingError'
    this.status = options?.status
    this.details = options?.details
    this.code = options?.code || 'STREAM_ERROR'
    this.isRetryable = options?.isRetryable ?? true
  }
}
