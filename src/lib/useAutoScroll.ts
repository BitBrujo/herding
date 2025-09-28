import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  threshold?: number; // Distance from bottom to trigger auto-scroll (default: 100px)
  behavior?: ScrollBehavior; // 'smooth' or 'auto' (default: 'smooth')
  enabled?: boolean; // Whether auto-scroll is enabled (default: true)
  delay?: number; // Delay before scrolling to allow DOM updates (default: 50ms)
}

export function useAutoScroll<T extends HTMLElement>(
  dependencies: readonly unknown[] = [],
  options: UseAutoScrollOptions = {}
) {
  const {
    threshold = 100,
    behavior = 'smooth',
    enabled = true,
    delay = 50
  } = options;

  const containerRef = useRef<T>(null);
  const wasNearBottomRef = useRef(true);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const rafRef = useRef<number>();

  // Debounced scroll handler
  const debouncedScrollHandler = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      wasNearBottomRef.current = isNearBottom();
    }, 150);
  }, [isNearBottom]);

  // Check if user is near the bottom of the scroll area
  const isNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= threshold;
  }, [threshold]);

  // Smooth scroll to bottom function with animation frame
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container || !enabled || isScrollingRef.current) return;

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      isScrollingRef.current = true;

      // Use smooth scrolling with proper timing
      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior
      });

      // Reset scrolling flag after animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, behavior === 'smooth' ? 500 : 100);
    });
  }, [behavior, enabled]);

  // Update scroll position tracking on scroll
  const handleScroll = useCallback(() => {
    if (!isScrollingRef.current) {
      debouncedScrollHandler();
    }
  }, [debouncedScrollHandler]);

  // Auto-scroll when dependencies change and user was near bottom
  useEffect(() => {
    if (!enabled || isScrollingRef.current) return;

    // Use requestAnimationFrame for better timing
    const timeoutId = setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        if (wasNearBottomRef.current && !isScrollingRef.current) {
          scrollToBottom();
        }
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom, enabled, delay, ...dependencies]);

  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Initialize scroll position tracking
    wasNearBottomRef.current = isNearBottom();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll, isNearBottom, enabled]);

  return {
    containerRef,
    scrollToBottom,
    isNearBottom
  };
}