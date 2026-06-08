import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage } from '@/types'
import { API_URL } from '@/lib/config'

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const esRef = useRef<EventSource | null>(null)
  const isClosing = useRef(false)
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed')
  
  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (esRef.current?.readyState === EventSource.OPEN) return
    if (isClosing.current) return

    setStatus('connecting')
    
    // Construct the SSE URL
    const sseUrl = `${API_URL}/api/stream/orders`
    const es = new EventSource(sseUrl)
    esRef.current = es

    es.onopen = () => {
      console.debug('[SSE] Connected to:', sseUrl)
      setStatus('open')
    }

    es.onmessage = (event) => {
      try {
        const text = event.data
        if (text.startsWith(':')) return // ignore pings
        
        const msg: WSMessage = JSON.parse(text)
        onMessageRef.current(msg)
      } catch (err) {
        console.error('[SSE] Parse error:', err)
      }
    }

    es.onerror = (event) => {
      if (isClosing.current) {
        setStatus('closed')
        return
      }
      setStatus('connecting') // EventSource will try to reconnect automatically
    }
  }, [])

  useEffect(() => {
    isClosing.current = false
    connect()
    
    return () => {
      isClosing.current = true
      if (esRef.current) {
        esRef.current.close()
        setStatus('closed')
      }
    }
  }, [connect])

  return { wsRef: esRef, status }
}
