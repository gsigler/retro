import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || ''
const SOCKET_URL = API_URL.replace(/\/api$/, '')

export function createBoardSocket(): Socket {
  return io(`${SOCKET_URL}/board`, {
    withCredentials: true,
    transports: ['websocket'],
    autoConnect: false,
  })
}

export function createDashboardSocket(): Socket {
  return io(`${SOCKET_URL}/dashboard`, {
    withCredentials: true,
    transports: ['websocket'],
    autoConnect: false,
  })
}
