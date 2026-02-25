import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createDashboardSocket } from './socket'

export function useDashboardSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = createDashboardSocket()

    socket.on('connect', () => {
      socket.emit('dashboard:join')
    })

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['retros'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    }

    socket.on('retro:created', invalidate)
    socket.on('retro:updated', invalidate)
    socket.on('retro:deleted', invalidate)

    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [queryClient])
}
