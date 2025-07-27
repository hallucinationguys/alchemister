'use client'

import { useRef, useEffect } from 'react'

interface ScrollRestorationOptions {
  /**
   * The element to restore scroll position for
   */
  scrollElement?: HTMLElement | null

  /**
   * The key to use for storing the scroll position in sessionStorage
   */
  storageKey?: string

  /**
   * Whether to enable scroll restoration
   */
  enabled?: boolean
}

/**
 * Hook for restoring scroll position when navigating back to a page
 */
export function useScrollRestoration({
  scrollElement,
  storageKey = 'scroll-position',
  enabled = true,
}: ScrollRestorationOptions = {}) {
  const scrollPos = useRef<number>(0)

  // Save scroll position before unmounting
  useEffect(() => {
    if (!enabled) return

    const element = scrollElement || window
    const key = `${storageKey}-${window.location.pathname}`

    // Try to restore scroll position on mount
    const savedScrollPos = sessionStorage.getItem(key)
    if (savedScrollPos) {
      const scrollPosition = parseInt(savedScrollPos, 10)
      if (!isNaN(scrollPosition)) {
        setTimeout(() => {
          if (element === window) {
            window.scrollTo(0, scrollPosition)
          } else {
            ;(element as HTMLElement).scrollTop = scrollPosition
          }
        }, 0)
      }
      sessionStorage.removeItem(key)
    }

    // Save scroll position on unmount
    return () => {
      const currentPos =
        element === window ? window.scrollY : (element as HTMLElement)?.scrollTop || 0

      scrollPos.current = currentPos
      sessionStorage.setItem(key, String(currentPos))
    }
  }, [scrollElement, storageKey, enabled])

  return scrollPos
}

/**
 * Hook for handling infinite scroll with scroll restoration
 */
export function useInfiniteScroll<T>({
  data,
  hasNextPage,
  fetchNextPage,
  isLoading,
  threshold = 200,
  scrollElement,
}: {
  data: T[] | undefined
  hasNextPage: boolean | undefined
  fetchNextPage: () => Promise<unknown>
  isLoading: boolean
  threshold?: number
  scrollElement?: HTMLElement | null
}) {
  // Use scroll restoration
  useScrollRestoration({ scrollElement })

  // Set up infinite scroll
  useEffect(() => {
    if (!hasNextPage || isLoading) return

    const element = scrollElement || window

    const handleScroll = () => {
      const scrollHeight =
        element === window
          ? document.documentElement.scrollHeight
          : (element as HTMLElement).scrollHeight

      const scrollTop = element === window ? window.scrollY : (element as HTMLElement).scrollTop

      const clientHeight =
        element === window ? window.innerHeight : (element as HTMLElement).clientHeight

      // Load more when user scrolls near the bottom
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        fetchNextPage()
      }
    }

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [data, hasNextPage, isLoading, fetchNextPage, threshold, scrollElement])
}
