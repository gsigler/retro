import { Test, TestingModule } from '@nestjs/testing'
import { DashboardService } from './dashboard.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

describe('DashboardService', () => {
  let service: DashboardService
  let prisma: {
    client: {
      team: { findUnique: jest.Mock }
      teamMember: { findMany: jest.Mock }
      retro: { count: jest.Mock; findMany: jest.Mock }
      actionItem: { count: jest.Mock; findMany: jest.Mock }
    }
  }

  const userId = 'user-1'
  const teamId = 'team-1'

  beforeEach(async () => {
    prisma = {
      client: {
        team: { findUnique: jest.fn() },
        teamMember: { findMany: jest.fn() },
        retro: { count: jest.fn(), findMany: jest.fn() },
        actionItem: { count: jest.fn(), findMany: jest.fn() },
      },
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
      prisma.client.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.client.team.findUnique.mockResolvedValue({
        id: teamId,
        ownerId: userId,
        _count: { members: 5 },
      })
      prisma.client.retro.count.mockResolvedValue(10)
      prisma.client.actionItem.count
        .mockResolvedValueOnce(3) // open
        .mockResolvedValueOnce(7) // completed
      prisma.client.retro.findMany.mockResolvedValue([
        {
          id: 'retro-1',
          name: 'Sprint 5',
          status: 'SCHEDULED',
          date: new Date('2026-03-01'),
          teamId,
          createdAt: new Date(),
        },
      ])
      prisma.client.actionItem.findMany.mockResolvedValue([
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
      prisma.client.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.client.team.findUnique.mockResolvedValue(null)
      prisma.client.retro.count.mockResolvedValue(0)
      prisma.client.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.client.retro.findMany.mockResolvedValue([])
      prisma.client.actionItem.findMany.mockResolvedValue([])

      const result = await service.getSummary(userId)

      expect(result.memberCount).toBe(0)
    })

    it('should return empty lists when user has no teams', async () => {
      prisma.client.teamMember.findMany.mockResolvedValue([])
      prisma.client.team.findUnique.mockResolvedValue(null)
      prisma.client.retro.count.mockResolvedValue(0)
      prisma.client.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.client.retro.findMany.mockResolvedValue([])
      prisma.client.actionItem.findMany.mockResolvedValue([])

      const result = await service.getSummary(userId)

      expect(result.retroCount).toBe(0)
      expect(result.upcomingRetros).toEqual([])
      expect(result.recentActionItems).toEqual([])
    })

    it('should query upcoming retros sorted by date ascending with take 5', async () => {
      prisma.client.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.client.team.findUnique.mockResolvedValue(null)
      prisma.client.retro.count.mockResolvedValue(0)
      prisma.client.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.client.retro.findMany.mockResolvedValue([])
      prisma.client.actionItem.findMany.mockResolvedValue([])

      await service.getSummary(userId)

      expect(prisma.client.retro.findMany).toHaveBeenCalledWith({
        where: { teamId: { in: [teamId] }, status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        take: 5,
      })
    })

    it('should query all action items across team with take 50', async () => {
      prisma.client.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.client.team.findUnique.mockResolvedValue(null)
      prisma.client.retro.count.mockResolvedValue(0)
      prisma.client.actionItem.count.mockResolvedValue(0).mockResolvedValue(0)
      prisma.client.retro.findMany.mockResolvedValue([])
      prisma.client.actionItem.findMany.mockResolvedValue([])

      await service.getSummary(userId)

      expect(prisma.client.actionItem.findMany).toHaveBeenCalledWith({
        where: {
          retro: { teamId: { in: [teamId] } },
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
      prisma.client.teamMember.findMany.mockResolvedValue([{ teamId }])
      prisma.client.team.findUnique.mockResolvedValue(null)
      prisma.client.retro.count.mockResolvedValue(0)
      prisma.client.actionItem.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
      prisma.client.retro.findMany.mockResolvedValue([])
      prisma.client.actionItem.findMany.mockResolvedValue([])

      await service.getSummary(userId)

      expect(prisma.client.actionItem.count).toHaveBeenCalledWith({
        where: {
          retro: { teamId: { in: [teamId] } },
          status: { not: 'DONE' },
        },
      })
    })
  })
})
