export interface ColumnDefinition {
  name: string
  description: string
  color: string
  position: number
}

export interface RetroTemplate {
  id: string
  name: string
  columns: ColumnDefinition[]
}

export const RETRO_TEMPLATES: RetroTemplate[] = [
  {
    id: 'start-stop-continue',
    name: 'Start / Stop / Continue',
    columns: [
      {
        name: 'Start',
        description: 'Things we should start doing',
        color: '#22c55e',
        position: 0,
      },
      {
        name: 'Stop',
        description: 'Things we should stop doing',
        color: '#ef4444',
        position: 1,
      },
      {
        name: 'Continue',
        description: 'Things we should keep doing',
        color: '#3b82f6',
        position: 2,
      },
    ],
  },
  {
    id: 'went-well-didnt-actions',
    name: "What Went Well / Didn't / Action Items",
    columns: [
      {
        name: 'What Went Well',
        description: 'Positive outcomes and successes',
        color: '#22c55e',
        position: 0,
      },
      {
        name: "What Didn't Go Well",
        description: 'Challenges and areas for improvement',
        color: '#ef4444',
        position: 1,
      },
      {
        name: 'Action Items',
        description: 'Concrete next steps',
        color: '#f59e0b',
        position: 2,
      },
    ],
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad / Sad / Glad',
    columns: [
      {
        name: 'Mad',
        description: 'Things that frustrated or angered us',
        color: '#ef4444',
        position: 0,
      },
      {
        name: 'Sad',
        description: 'Things that disappointed us',
        color: '#8b5cf6',
        position: 1,
      },
      {
        name: 'Glad',
        description: 'Things that made us happy',
        color: '#22c55e',
        position: 2,
      },
    ],
  },
  {
    id: '4ls',
    name: '4Ls: Liked / Learned / Lacked / Longed For',
    columns: [
      {
        name: 'Liked',
        description: 'Things we enjoyed',
        color: '#22c55e',
        position: 0,
      },
      {
        name: 'Learned',
        description: 'Things we learned',
        color: '#3b82f6',
        position: 1,
      },
      {
        name: 'Lacked',
        description: 'Things we felt were missing',
        color: '#f59e0b',
        position: 2,
      },
      {
        name: 'Longed For',
        description: 'Things we wished we had',
        color: '#8b5cf6',
        position: 3,
      },
    ],
  },
]
