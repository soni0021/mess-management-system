// Utility functions for consistent date handling across the application

/**
 * Get the start of today in local timezone
 */
export function getLocalToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Get the start of tomorrow in local timezone
 */
export function getLocalTomorrow(): Date {
  const today = getLocalToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

/**
 * Get date in YYYY-MM-DD format in local timezone
 */
export function getLocalDateString(date: Date): string {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0')
}

/**
 * Get the local date string for today
 */
export function getTodayLocalDateString(): string {
  return getLocalDateString(new Date())
}

/**
 * Convert any date to local date string (for grouping purposes)
 */
export function toLocalDateString(date: Date): string {
  // Create a new date in local timezone to avoid UTC conversion issues
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
  return getLocalDateString(localDate)
}

/**
 * Get current month start and end in local timezone
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
} 