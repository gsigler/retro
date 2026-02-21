import { Test, TestingModule } from '@nestjs/testing'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { ActionItemsService } from './action-items.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

describe('ActionItemsService', () => {
  let service: ActionItemsService
  let prisma: {
    client: {
      actionItem: {
        create: jest.Mock
        findMany: jest.Mock
        findUnique: jest.Mock
        update: jest.Mock
        delete: jest.Mock
        count: jest.Mock
      }
      retro: { findUnique: jest.Mock }
      team: { findUnique: jest.Mock }
      teamMember: { findUnique: jest.Mock; findMany: jest.Mock }
      $transaction: jest.Mock
    }
  }

  const userId = 'user-1'
  const otherUserId = 'user-2'
  const nonMemberUserId = 'user-3'
  const teamId = 'team-1'
  const retroId = 'retro-1'
  const actionItemId = 'action-item-1'

  const mockRetro = { id: retroId, teamId }
  const mockTeam = { id: teamId, ownerId: userId }
  const mockMembership = { teamId, userId }

  const mockActionItem = {
    id: actionItemId,
    title: 'Fix the bug',
    description: 'It is broken',
    status: 'OPEN' as const,
    dueDate: new Date('2026-03-01'),
    retroId,
    createdById: userId,
    assigneeId: otherUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: { id: otherUserId, name: 'Other', avatarUrl: null },
    createdBy: { id: userId, name: 'Owner', avatarUrl: null },
  }

  beforeEach(async () => {
    prisma = {
      client: {
        actionItem: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          count: jest.fn(),
        },
        retro: { findUnique: jest.fn() },
        team: { findUnique: jest.fn() },
        teamMember: { findUnique: jest.fn(), findMany: jest.fn() },
        $transaction: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionItemsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<ActionItemsService>(ActionItemsService)
  })

  describe('create', () => {
    const dto = {
      title: 'Fix the bug',
      description: 'It is broken',
      assigneeId: otherUserId,
      dueDate: '2026-03-01',
    }

    it('should create an action item when user is a team member', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.actionItem.count.mockResolvedValue(3)
      prisma.client.actionItem.create.mockResolvedValue(mockActionItem)

      const result = await service.create(userId, retroId, dto)

      expect(prisma.client.retro.findUnique).toHaveBeenCalledWith({
        where: { id: retroId },
      })
      expect(prisma.client.teamMember.findUnique).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId, userId } },
      })
      expect(prisma.client.actionItem.create).toHaveBeenCalledWith({
        data: {
          title: 'Fix the bug',
          description: 'It is broken',
          assigneeId: otherUserId,
          dueDate: new Date('2026-03-01'),
          retroId,
          createdById: userId,
          position: 3,
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
      expect(result).toEqual(mockActionItem)
    })

    it('should create an action item without optional fields', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.actionItem.count.mockResolvedValue(0)
      prisma.client.actionItem.create.mockResolvedValue({
        ...mockActionItem,
        assignee: null,
        dueDate: null,
      })

      await service.create(userId, retroId, { title: 'Minimal item' })

      expect(prisma.client.actionItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Minimal item',
            assigneeId: undefined,
            dueDate: undefined,
            position: 0,
          }),
        }),
      )
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(null)

      await expect(
        service.create(nonMemberUserId, retroId, dto),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException when retro does not exist', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(null)

      await expect(service.create(userId, 'nonexistent', dto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findAllForRetro', () => {
    it('should return action items for a retro', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.actionItem.findMany.mockResolvedValue([mockActionItem])

      const result = await service.findAllForRetro(userId, retroId)

      expect(prisma.client.actionItem.findMany).toHaveBeenCalledWith({
        where: { retroId },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { position: 'asc' },
      })
      expect(result).toEqual([mockActionItem])
    })

    it('should return empty array when retro has no action items', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.actionItem.findMany.mockResolvedValue([])

      const result = await service.findAllForRetro(userId, retroId)

      expect(result).toEqual([])
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(null)

      await expect(
        service.findAllForRetro(nonMemberUserId, retroId),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findOne', () => {
    it('should return an action item when user is a team member', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      const result = await service.findOne(userId, actionItemId)

      expect(result).toEqual(mockActionItem)
    })

    it('should throw NotFoundException when action item does not exist', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(null)

      await expect(service.findOne(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(null)

      await expect(
        service.findOne(nonMemberUserId, actionItemId),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('update', () => {
    it('should update an action item when user is a team member', async () => {
      const dto = { title: 'Updated title' }
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.actionItem.update.mockResolvedValue({
        ...mockActionItem,
        ...dto,
      })

      const result = await service.update(userId, actionItemId, dto)

      expect(prisma.client.actionItem.update).toHaveBeenCalledWith({
        where: { id: actionItemId },
        data: { title: 'Updated title' },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
      expect(result.title).toBe('Updated title')
    })

    it('should allow status transition OPEN → DONE', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.actionItem.update.mockResolvedValue({
        ...mockActionItem,
        status: 'DONE',
      })

      await service.update(userId, actionItemId, {
        status: 'DONE' as const,
      })

      expect(prisma.client.actionItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'DONE' },
        }),
      )
    })

    it('should throw BadRequestException for transition DONE → OPEN', async () => {
      const doneItem = { ...mockActionItem, status: 'DONE' as const }
      prisma.client.actionItem.findUnique.mockResolvedValue(doneItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.update(userId, actionItemId, {
          status: 'OPEN' as const,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for same-status transition', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.update(userId, actionItemId, { status: 'OPEN' as const }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when action item does not exist', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(null)

      await expect(
        service.update(userId, 'nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(null)

      await expect(
        service.update(nonMemberUserId, actionItemId, { title: 'X' }),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('remove', () => {
    it('should delete an action item when user is the creator', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(mockActionItem)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.team.findUnique.mockResolvedValue(mockTeam)
      prisma.client.actionItem.delete.mockResolvedValue(mockActionItem)

      await service.remove(userId, actionItemId)

      expect(prisma.client.actionItem.delete).toHaveBeenCalledWith({
        where: { id: actionItemId },
      })
    })

    it('should delete an action item when user is the team owner', async () => {
      const itemByOther = { ...mockActionItem, createdById: otherUserId }
      prisma.client.actionItem.findUnique.mockResolvedValue(itemByOther)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.team.findUnique.mockResolvedValue(mockTeam)
      prisma.client.actionItem.delete.mockResolvedValue(itemByOther)

      await service.remove(userId, actionItemId)

      expect(prisma.client.actionItem.delete).toHaveBeenCalledWith({
        where: { id: actionItemId },
      })
    })

    it('should throw ForbiddenException when user is neither creator nor team owner', async () => {
      const itemByOwner = { ...mockActionItem, createdById: userId }
      prisma.client.actionItem.findUnique.mockResolvedValue(itemByOwner)
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.team.findUnique.mockResolvedValue(mockTeam)

      await expect(service.remove(otherUserId, actionItemId)).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('should throw NotFoundException when action item does not exist', async () => {
      prisma.client.actionItem.findUnique.mockResolvedValue(null)

      await expect(service.remove(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
