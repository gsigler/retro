import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTemplates, initBoard } from '@/lib/api'
import { useBoardContext } from './BoardProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RetroTemplate } from '@/types/api'

interface TemplatePickerProps {
  token: string
  retroId: string
}

export function TemplatePicker({ token, retroId }: TemplatePickerProps) {
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
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold">Choose a Template</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Pick a retrospective format to get started
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates?.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {template.columns.map((col) => (
                  <span
                    key={col.position}
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: col.color }}
                  >
                    {col.name}
                  </span>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={loading !== null}
                onClick={() => handleSelect(template)}
              >
                {loading === template.id ? 'Setting up...' : 'Use Template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
