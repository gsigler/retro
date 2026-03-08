import type { Socket } from 'socket.io'

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string
    email: string
    userName?: string
  }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {}
  const cookies: Record<string, string> = {}
  for (const pair of cookieHeader.split(';')) {
    const [name, ...rest] = pair.trim().split('=')
    if (name) cookies[name] = rest.join('=')
  }
  return cookies
}
