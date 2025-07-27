'use client'

import { useState, useEffect } from 'react'

/**
 * Available model interface
 */
export interface AvailableModel {
  id: string
  name: string
  display_name: string
  provider_name: string
  provider_display_name: string
  provider_id: string
  is_active: boolean
  has_api_key: boolean
}

const SELECTED_MODEL_KEY = 'selected_model'

/**
 * Hook for managing selected model state with localStorage persistence
 * This replaces the ProviderProvider functionality
 */
export const useSelectedModel = () => {
  const [selectedModel, setSelectedModelState] = useState<AvailableModel | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SELECTED_MODEL_KEY)
      if (stored) {
        try {
          const model = JSON.parse(stored)
          setSelectedModelState(model)
        } catch (error) {
          console.warn('Failed to parse stored selected model:', error)
          localStorage.removeItem(SELECTED_MODEL_KEY)
        }
      }
    }
  }, [])

  function setSelectedModel(model: AvailableModel | null) {
    setSelectedModelState(model)

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (model) {
        localStorage.setItem(SELECTED_MODEL_KEY, JSON.stringify(model))
      } else {
        localStorage.removeItem(SELECTED_MODEL_KEY)
      }
    }
  }

  return {
    selectedModel,
    setSelectedModel,
  }
}
