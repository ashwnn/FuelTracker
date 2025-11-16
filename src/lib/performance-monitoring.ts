/**
 * Performance monitoring utilities for FuelTracker
 * Tracks Web Vitals and reports performance metrics
 */

/**
 * Core Web Vitals metrics
 */
export interface WebVitals {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  LCP: number; // Largest Contentful Paint
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
}

/**
 * Report Web Vitals metrics
 * This helps identify performance regressions
 */
export function reportWebVitals(metric: any): void {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: new Date().toISOString(),
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', body);
    }
  }
}

/**
 * Measure operation duration
 */
export function measureOperation(name: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    // Report to analytics
    if (process.env.NODE_ENV === 'production') {
      navigator.sendBeacon('/api/metrics', JSON.stringify({
        type: 'operation',
        name,
        duration,
        timestamp: new Date().toISOString(),
      }));
    }
  };
}

/**
 * Track API call performance
 */
export async function trackApiCall<T>(
  endpoint: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fetcher();
    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'production') {
      navigator.sendBeacon('/api/metrics', JSON.stringify({
        type: 'api',
        endpoint,
        duration,
        status: 'success',
        timestamp: new Date().toISOString(),
      }));
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'production') {
      navigator.sendBeacon('/api/metrics', JSON.stringify({
        type: 'api',
        endpoint,
        duration,
        status: 'error',
        timestamp: new Date().toISOString(),
      }));
    }

    throw error;
  }
}

/**
 * Get Navigation Timing metrics
 */
export function getNavigationMetrics(): any {
  if (typeof window === 'undefined') return null;

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

  return {
    pageLoadTime,
    connectTime: perfData.responseEnd - perfData.requestStart,
    renderTime: perfData.domComplete - perfData.domLoading,
    domInteractiveTime: perfData.domInteractive - perfData.navigationStart,
    resourceLoadTime: perfData.loadEventStart - perfData.responseEnd,
  };
}

/**
 * Monitor long tasks (operations > 50ms)
 */
export function monitorLongTasks(callback: (task: PerformanceEntry) => void): void {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            callback(entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks not supported
    }
  }
}

/**
 * Get estimated 3G connection speed
 */
export function getConnectionSpeed(): string {
  if (typeof navigator === 'undefined') return 'unknown';

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) return 'unknown';

  return connection.effectiveType || 'unknown'; // '4g', '3g', '2g', etc.
}

/**
 * Measure memory usage (if available)
 */
export function getMemoryUsage(): any {
  if (typeof performance === 'undefined' || !(performance as any).memory) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    jsHeapUsed: (memory.jsHeapUsed / 1048576).toFixed(2) + ' MB',
    jsHeapSizeDelta: (memory.jsHeapSizeDelta / 1048576).toFixed(2) + ' MB',
  };
}

/**
 * Log performance metrics (development only)
 */
export function logPerformanceMetrics(): void {
  if (process.env.NODE_ENV === 'development') {
    const navMetrics = getNavigationMetrics();
    const connectionSpeed = getConnectionSpeed();
    const memoryUsage = getMemoryUsage();

    console.group('📊 Performance Metrics');
    console.log('Navigation:', navMetrics);
    console.log('Connection:', connectionSpeed);
    console.log('Memory:', memoryUsage);
    console.groupEnd();
  }
}
