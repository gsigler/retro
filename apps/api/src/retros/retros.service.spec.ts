import { Test, TestingModule } from '@nestjs/testing'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { RetrosService } from './retros.service'
import { PrismaService } from '../prisma/prisma.service'

describe('RetrosService', () => {
  let service: RetrosService
  let prisma: {
    retro: {
      create: jest.Mock
      findMany: jest.Mock
      findUnique: jest.Mock
      update: jest.Mock
      delete: jest.Mock
    }
    team: { findUnique: jest.Mock }
    teamMember: { findUnique: jest.Mock }
  }

  const userId = 'user-1'
  const otherUserId = 'user-2'
  const teamId = 'team-1'
  const retroId = 'retro-1'

  const mockRetro = {
    id: retroId,
    name: 'Sprint 1 Retro',
    date: new Date('2026-02-16'),
    status: 'SCHEDULED' as const,
    teamId,
    createdById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: userId, email: 'owner@test.com', name: 'Owner' },
    _count: { actionItems: 0 },
  }

  const mockMembership = { teamId, userId }
  const mockTeam = { id: teamId, ownerId: userId }

  beforeEach(async () => {
    prisma = {
      retro: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      team: { findUnique: jest.fn() },
      teamMember: { findUnique: jest.fn() },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [RetrosService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<RetrosService>(RetrosService)
  })

  describe('create', () => {
    const dto = { name: 'Sprint 1 Retro', date: '2026-02-16' }

    it('should create a retro when user is a team member', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.create.mockResolvedValue(mockRetro)

      const result = await service.create(userId, teamId, dto)

      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId, userId } },
      })
      expect(prisma.retro.create).toHaveBeenCalledWith({
        data: {
          name: 'Sprint 1 Retro',
          date: new Date('2026-02-16'),
          status: undefined,
          teamId,
          createdById: userId,
        },
        include: {
          createdBy: { select: { id: true, email: true, name: true } },
        },
      })
      expect(result).toEqual(mockRetro)
    })

    it('should create a retro with an explicit status', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.create.mockResolvedValue({
        ...mockRetro,
        status: 'IN_PROGRESS',
      })

      await service.create(userId, teamId, {
        ...dto,
        status: 'IN_PROGRESS' as const,
      })

      expect(prisma.retro.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        }),
      )
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null)

      await expect(service.create(otherUserId, teamId, dto)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('findAll', () => {
    it('should return retros for a team when user is a member', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.findMany.mockResolvedValue([mockRetro])

      const result = await service.findAll(userId, teamId)

      expect(prisma.retro.findMany).toHaveBeenCalledWith({
        where: { teamId },
        include: {
          createdBy: { select: { id: true, email: true, name: true } },
          _count: { select: { actionItems: true } },
        },
        orderBy: { date: 'desc' },
      })
      expect(result).toEqual([mockRetro])
    })

    it('should return empty array when team has no retros', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.findMany.mockResolvedValue([])

      const result = await service.findAll(userId, teamId)

      expect(result).toEqual([])
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null)

      await expect(service.findAll(otherUserId, teamId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('findOne', () => {
    it('should return a retro when user is a team member', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)

      const result = await service.findOne(userId, retroId)

      expect(result).toEqual(mockRetro)
    })

    it('should throw NotFoundException when retro does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(null)

      await expect(service.findOne(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(null)

      await expect(service.findOne(otherUserId, retroId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('update', () => {
    it('should update a retro when user is a team member', async () => {
      const dto = { name: 'Updated Retro' }
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.update.mockResolvedValue({ ...mockRetro, ...dto })

      const result = await service.update(userId, retroId, dto)

      expect(prisma.retro.update).toHaveBeenCalledWith({
        where: { id: retroId },
        data: { name: 'Updated Retro' },
        include: {
          createdBy: { select: { id: true, email: true, name: true } },
          _count: { select: { actionItems: true } },
        },
      })
      expect(result.name).toBe('Updated Retro')
    })

    it('should allow forward status transition SCHEDULED → IN_PROGRESS', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.update.mockResolvedValue({
        ...mockRetro,
        status: 'IN_PROGRESS',
      })

      await service.update(userId, retroId, {
        status: 'IN_PROGRESS' as const,
      })

      expect(prisma.retro.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'IN_PROGRESS' },
        }),
      )
    })

    it('should allow forward status transition IN_PROGRESS → COMPLETED', async () => {
      const inProgressRetro = { ...mockRetro, status: 'IN_PROGRESS' as const }
      prisma.retro.findUnique.mockResolvedValue(inProgressRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.update.mockResolvedValue({
        ...inProgressRetro,
        status: 'COMPLETED',
      })

      await service.update(userId, retroId, {
        status: 'COMPLETED' as const,
      })

      expect(prisma.retro.update).toHaveBeenCalled()
    })

    it('should allow forward status transition SCHEDULED → COMPLETED', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.retro.update.mockResolvedValue({
        ...mockRetro,
        status: 'COMPLETED',
      })

      await service.update(userId, retroId, {
        status: 'COMPLETED' as const,
      })

      expect(prisma.retro.update).toHaveBeenCalled()
    })

    it('should throw BadRequestException for backward status transition COMPLETED → IN_PROGRESS', async () => {
      const completedRetro = { ...mockRetro, status: 'COMPLETED' as const }
      prisma.retro.findUnique.mockResolvedValue(completedRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.update(userId, retroId, {
          status: 'IN_PROGRESS' as const,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for backward status transition IN_PROGRESS → SCHEDULED', async () => {
      const inProgressRetro = { ...mockRetro, status: 'IN_PROGRESS' as const }
      prisma.retro.findUnique.mockResolvedValue(inProgressRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.update(userId, retroId, {
          status: 'SCHEDULED' as const,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for same-status transition', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.update(userId, retroId, {
          status: 'SCHEDULED' as const,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when retro does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(null)

      await expect(
        service.update(userId, 'nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(null)

      await expect(
        service.update(otherUserId, retroId, { name: 'X' }),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('remove', () => {
    it('should delete a retro when user is team owner', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.retro.delete.mockResolvedValue(mockRetro)

      await service.remove(userId, retroId)

      expect(prisma.retro.delete).toHaveBeenCalledWith({
        where: { id: retroId },
      })
    })

    it('should throw NotFoundException when retro does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(null)

      await expect(service.remove(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw NotFoundException when team does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.team.findUnique.mockResolvedValue(null)

      await expect(service.remove(userId, retroId)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not team owner', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.team.findUnique.mockResolvedValue(mockTeam)

      await expect(service.remove(otherUserId, retroId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })
})
