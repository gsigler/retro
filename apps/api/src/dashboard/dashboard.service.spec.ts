import { Test, TestingModule } from '@nestjs/testing'
import { DashboardService } from './dashboard.service'
import { PrismaService } from '../prisma/prisma.service'

describe('DashboardService', () => {
  let service: DashboardService
  let prisma: {
    team: { findUnique: jest.Mock }
    teamMember: { findMany: jest.Mock }
    retro: { count: jest.Mock; findMany: jest.Mock }
    actionItem: { count: jest.Mock; findMany: jest.Mock }
  }

  const userId = 'user-1'
  const teamId = 'team-1'

  beforeEach(async () => {
    prisma = {
      team: { findUnique: jest.fn() },
      teamMember: { findMany: jest.fn() },
      retro: { count: jest.fn(), findMany: jest.fn() },
      actionItem: { count: jest.fn(), findMany: jest.fn() },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<DashboardService>(DashboardService)
  })

  describe('getSummary', () => {
    it('should return full summary when user owns a team', async () => {
      prisma.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.team.findUnique.mockResolvedValue({
        id: teamId,
        ownerId: userId,
        _count: { members: 5 },
      })
      prisma.retro.count.mockResolvedValue(10)
      prisma.actionItem.count
        .mockResolvedValueOnce(3) // open
        .mockResolvedValueOnce(7) // completed
      prisma.retro.findMany.mockResolvedValue([
        {
          id: 'retro-1',
          name: 'Sprint 5',
          status: 'SCHEDULED',
          date: new Date('2026-03-01'),
          teamId,
          createdAt: new Date(),
        },
      ])
      prisma.actionItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          title: 'Fix bug',
          description: null,
          status: 'OPEN',
          dueDate: null,
          retroId: 'retro-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: { id: userId, name: 'Owner', avatarUrl: null },
          createdBy: { id: userId, name: 'Owner', avatarUrl: null },
        },
      ])

      const result = await service.getSummary(userId)

      expect(result.memberCount).toBe(5)
      expect(result.retroCount).toBe(10)
      expect(result.openActionItemCount).toBe(3)
      expect(result.completedActionItemCount).toBe(7)
      expect(result.upcomingRetros).toHaveLength(1)
      expect(result.recentActionItems).toHaveLength(1)
    })

    it('should return memberCount 0 when user does not own a team', async () => {
      prisma.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.team.findUnique.mockResolvedValue(null)
      prisma.retro.count.mockResolvedValue(0)
      prisma.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.retro.findMany.mockResolvedValue([])
      prisma.actionItem.findMany.mockResolvedValue([])

      const result = await service.getSummary(userId)

      expect(result.memberCount).toBe(0)
    })

    it('should return empty lists when user has no teams', async () => {
      prisma.teamMember.findMany.mockResolvedValue([])
      prisma.team.findUnique.mockResolvedValue(null)
      prisma.retro.count.mockResolvedValue(0)
      prisma.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.retro.findMany.mockResolvedValue([])
      prisma.actionItem.findMany.mockResolvedValue([])

      const result = await service.getSummary(userId)

      expect(result.retroCount).toBe(0)
      expect(result.upcomingRetros).toEqual([])
      expect(result.recentActionItems).toEqual([])
    })

    it('should query upcoming retros sorted by date ascending with take 5', async () => {
      prisma.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.team.findUnique.mockResolvedValue(null)
      prisma.retro.count.mockResolvedValue(0)
      prisma.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.retro.findMany.mockResolvedValue([])
      prisma.actionItem.findMany.mockResolvedValue([])

      await service.getSummary(userId)

      expect(prisma.retro.findMany).toHaveBeenCalledWith({
        where: { teamId: { in: [teamId] }, status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        take: 5,
      })
    })

    it('should query open action items across team with take 50', async () => {
      prisma.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.team.findUnique.mockResolvedValue(null)
      prisma.retro.count.mockResolvedValue(0)
      prisma.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.retro.findMany.mockResolvedValue([])
      prisma.actionItem.findMany.mockResolvedValue([])

      await service.getSummary(userId)

      expect(prisma.actionItem.findMany).toHaveBeenCalledWith({
        where: {
          retro: { teamId: { in: [teamId] } },
          status: { not: 'DONE' },
        },
        include: {
          assignee: {
            select: { id: true, name: true, avatarUrl: true },
          },
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    it('should count open action items as not DONE', async () => {
      prisma.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.team.findUnique.mockResolvedValue(null)
      prisma.retro.count.mockResolvedValue(0)
      prisma.actionItem.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2)
      prisma.retro.findMany.mockResolvedValue([])
      prisma.actionItem.findMany.mockResolvedValue([])

      await service.getSummary(userId)

      expect(prisma.actionItem.count).toHaveBeenCalledWith({
        where: {
          retro: { teamId: { in: [teamId] } },
          status: { not: 'DONE' },
        },
      })
    })
  })
})
