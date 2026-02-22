import { Injectable } from '@nestjs/common'

interface TimerState {
  duration: number
  remaining: number
  running: boolean
  startedAt: number | null
}

export interface TimerSyncPayload {
  duration: number
  remaining: number
  running: boolean
}

const MIN_DURATION = 10
const MAX_DURATION = 3600

@Injectable()
export class TimerService {
  private timers = new Map<string, TimerState>()
  private timerIntervals = new Map<string, ReturnType<typeof setInterval>>()

  start(
    retroId: string,
    duration: number | undefined,
    onTick: (remaining: number) => void,
    onSync: (payload: TimerSyncPayload) => void,
  ): TimerSyncPayload | null {
    let timer = this.timers.get(retroId)

    if (duration !== undefined) {
      if (
        typeof duration !== 'number' ||
        duration < MIN_DURATION ||
        duration > MAX_DURATION
      ) {
        return null
      }
      this.clearInterval(retroId)
      timer = {
        duration,
        remaining: duration,
        running: true,
        startedAt: Date.now(),
      }
    } else if (timer) {
      timer = { ...timer, running: true, startedAt: Date.now() }
    } else {
      return null
    }

    this.timers.set(retroId, timer)
    const payload: TimerSyncPayload = {
      duration: timer.duration,
      remaining: timer.remaining,
      running: true,
    }
    this.startInterval(retroId, onTick, onSync)
    return payload
  }

  pause(retroId: string): TimerSyncPayload | null {
    const timer = this.timers.get(retroId)
    if (!timer || !timer.running) return null

    this.clearInterval(retroId)
    const elapsed = timer.startedAt
      ? Math.floor((Date.now() - timer.startedAt) / 1000)
      : 0
    const updated: TimerState = {
      ...timer,
      remaining: Math.max(0, timer.remaining - elapsed),
      running: false,
      startedAt: null,
    }
    this.timers.set(retroId, updated)
    return {
      duration: updated.duration,
      remaining: updated.remaining,
      running: false,
    }
  }

  reset(retroId: string): TimerSyncPayload | null {
    this.clearInterval(retroId)
    const timer = this.timers.get(retroId)
    if (!timer) return null

    const updated: TimerState = {
      duration: timer.duration,
      remaining: timer.duration,
      running: false,
      startedAt: null,
    }
    this.timers.set(retroId, updated)
    return {
      duration: updated.duration,
      remaining: updated.duration,
      running: false,
    }
  }

  getState(retroId: string): TimerSyncPayload | null {
    const timer = this.timers.get(retroId)
    if (!timer) return null

    const remaining =
      timer.running && timer.startedAt
        ? Math.max(
            0,
            timer.remaining - Math.floor((Date.now() - timer.startedAt) / 1000),
          )
        : timer.remaining

    return {
      duration: timer.duration,
      remaining,
      running: timer.running,
    }
  }

  cleanup(retroId: string) {
    this.clearInterval(retroId)
    this.timers.delete(retroId)
  }

  private startInterval(
    retroId: string,
    onTick: (remaining: number) => void,
    onSync: (payload: TimerSyncPayload) => void,
  ) {
    this.clearInterval(retroId)
    const interval = setInterval(() => {
      const timer = this.timers.get(retroId)
      if (!timer || !timer.running || !timer.startedAt) {
        this.clearInterval(retroId)
        return
      }

      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
      const remaining = Math.max(0, timer.remaining - elapsed)

      onTick(remaining)

      if (remaining <= 0) {
        this.clearInterval(retroId)
        const updated: TimerState = {
          ...timer,
          remaining: 0,
          running: false,
          startedAt: null,
        }
        this.timers.set(retroId, updated)
        onSync({
          duration: updated.duration,
          remaining: 0,
          running: false,
        })
      }
    }, 1000)
    this.timerIntervals.set(retroId, interval)
  }

  private clearInterval(retroId: string) {
    const interval = this.timerIntervals.get(retroId)
    if (interval) {
      clearInterval(interval)
      this.timerIntervals.delete(retroId)
    }
  }
}
