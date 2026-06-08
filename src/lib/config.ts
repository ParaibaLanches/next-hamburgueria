/**
 * Centralize all environment variables and API URLs
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/api/ws'

export const CONFIG = {
  API_URL,
  WS_URL,
  IS_DEV: process.env.NODE_ENV === 'development',
}
