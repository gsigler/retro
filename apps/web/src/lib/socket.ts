import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function createBoardSocket(token: string): Socket {
  return io(`${API_URL}/board`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: false,
  })
}
