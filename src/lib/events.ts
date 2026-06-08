import { EventEmitter } from 'events'
import Redis from 'ioredis'

// Usamos EventEmitter local para manter fallback, mas o principal é o Redis.
const localEmitter = new EventEmitter()
localEmitter.setMaxListeners(100)

let redisPub: Redis | null = null
let redisSub: Redis | null = null

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Apenas inicia o Redis se a variável de ambiente estiver presente ou se quisermos forçar localhost.
// O Next.js no build process pode não ter redis. Evitamos falhas de build.
if (process.env.NODE_ENV !== 'test' && !process.env.NEXT_PHASE_PRODUCTION_BUILD) {
  try {
    redisPub = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 })
    redisSub = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 })

    redisSub.on('error', (err) => console.error('Redis Sub Error:', err.message))
    redisPub.on('error', (err) => console.error('Redis Pub Error:', err.message))

    // Inscrever-se no canal de ordens
    redisSub.subscribe('events:orders', (err) => {
      if (err) console.error('Failed to subscribe to events:orders', err)
    })

    redisSub.on('message', (channel, message) => {
      if (channel === 'events:orders') {
        try {
          const { event, data } = JSON.parse(message)
          // Emite o evento localmente (para a rota SSE no mesmo container)
          localEmitter.emit(event, data)
        } catch (error) {
          console.error('Failed to parse redis message', error)
        }
      }
    })
  } catch (error) {
    console.error('Failed to initialize Redis:', error)
  }
}

export const appEmitter = {
  on: (event: string, listener: (...args: any[]) => void) => {
    localEmitter.on(event, listener)
  },
  off: (event: string, listener: (...args: any[]) => void) => {
    localEmitter.off(event, listener)
  },
  emit: (event: string, data: any) => {
    // Emite no Redis (para todos os containers)
    if (redisPub && redisPub.status === 'ready') {
      redisPub.publish('events:orders', JSON.stringify({ event, data })).catch(console.error)
    } else {
      // Fallback para memória se o Redis estiver fora
      localEmitter.emit(event, data)
    }
  }
}
