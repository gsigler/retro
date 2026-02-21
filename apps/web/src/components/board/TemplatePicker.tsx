import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTemplates, initBoard } from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'
import { useBoardContext } from './BoardProvider'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import type { RetroTemplate } from '@/types/api'

interface TemplatePickerProps {
  token: string
  retroId: string
}

export function TemplatePicker({ token, retroId }: TemplatePickerProps) {
  const { theme } = useTheme()
  const { dispatch } = useBoardContext()
  const [loading, setLoading] = useState<string | null>(null)

  const { data: templates } = useQuery({
    queryKey: ['board-templates', retroId],
    queryFn: () => fetchTemplates(token, retroId),
    enabled: !!token,
  })

  async function handleSelect(template: RetroTemplate) {
    setLoading(template.id)
    try {
      const board = await initBoard(token, retroId, template.id)
      dispatch({ type: 'BOARD_INITIALIZED', columns: board.columns })
    } catch {
      // Server broadcast will also update state
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Choose a Template</h2>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: theme.textTertiary,
          }}
        >
          Pick a retrospective format to get started
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates?.map((template) => (
          <TerminalFrame key={template.id} title={template.name}>
            <div
              className="flex flex-wrap gap-1.5"
              style={{ marginBottom: 12 }}
            >
              {template.columns.map((col) => (
                <span
                  key={col.position}
                  style={{
                    color: col.color,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: col.color,
                      display: 'inline-block',
                    }}
                  />
                  {col.name}
                </span>
              ))}
            </div>
            <TerminalButton
              disabled={loading !== null}
              onClick={() => handleSelect(template)}
            >
              {loading === template.id ? 'Setting up...' : 'Use Template'}
            </TerminalButton>
          </TerminalFrame>
        ))}
      </div>
    </div>
  )
}
