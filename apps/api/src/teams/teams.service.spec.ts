import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { PrismaService } from '../prisma/prisma.service'

describe('TeamsService', () => {
  let service: TeamsService
  let prisma: {
    team: {
      create: jest.Mock
      findMany: jest.Mock
      findUnique: jest.Mock
      update: jest.Mock
      delete: jest.Mock
    }
    user: { findUnique: jest.Mock }
    teamMember: {
      create: jest.Mock
      findUnique: jest.Mock
      delete: jest.Mock
    }
  }

  const userId = 'user-1'
  const otherUserId = 'user-2'
  const teamId = 'team-1'

  const mockTeam = {
    id: teamId,
    name: 'My Team',
    description: 'A test team',
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    prisma = {
      team: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      teamMember: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamsService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<TeamsService>(TeamsService)
  })

  describe('create', () => {
    it('should create a team with the user as owner and member', async () => {
      const dto = { name: 'My Team', description: 'A test team' }
      const expected = {
        ...mockTeam,
        members: [{ userId, role: 'OWNER', user: { id: userId } }],
      }
      prisma.team.create.mockResolvedValue(expected)

      const result = await service.create(userId, dto)

      expect(prisma.team.create).toHaveBeenCalledWith({
        data: {
          name: 'My Team',
          description: 'A test team',
          ownerId: userId,
          members: {
            create: { userId, role: 'OWNER' },
          },
        },
        include: { members: { include: { user: true } } },
      })
      expect(result).toEqual(expected)
    })

    it('should create a team without description', async () => {
      const dto = { name: 'Minimal Team' }
      prisma.team.create.mockResolvedValue({
        ...mockTeam,
        description: undefined,
      })

      await service.create(userId, dto)

      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Minimal Team',
            description: undefined,
          }),
        }),
      )
    })
  })

  describe('findAll', () => {
    it('should return teams where user is a member', async () => {
      const teams = [{ ...mockTeam, _count: { members: 2, retros: 3 } }]
      prisma.team.findMany.mockResolvedValue(teams)

      const result = await service.findAll(userId)

      expect(prisma.team.findMany).toHaveBeenCalledWith({
        where: { members: { some: { userId } } },
        include: {
          _count: { select: { members: true, retros: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(teams)
    })

    it('should return empty array when user has no teams', async () => {
      prisma.team.findMany.mockResolvedValue([])

      const result = await service.findAll(userId)

      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    const teamWithMembers = {
      ...mockTeam,
      members: [
        {
          userId,
          user: {
            id: userId,
            email: 'owner@test.com',
            name: 'Owner',
            avatarUrl: null,
          },
        },
      ],
      _count: { retros: 2 },
    }

    it('should return a team when user is a member', async () => {
      prisma.team.findUnique.mockResolvedValue(teamWithMembers)

      const result = await service.findOne(userId, teamId)

      expect(result).toEqual(teamWithMembers)
    })

    it('should throw NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null)

      await expect(service.findOne(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not a member', async () => {
      prisma.team.findUnique.mockResolvedValue(teamWithMembers)

      await expect(service.findOne('stranger', teamId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('update', () => {
    it('should update a team when user is owner', async () => {
      const dto = { name: 'Updated Name' }
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.team.update.mockResolvedValue({ ...mockTeam, ...dto })

      const result = await service.update(userId, teamId, dto)

      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: teamId },
        data: dto,
      })
      expect(result.name).toBe('Updated Name')
    })

    it('should throw NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null)

      await expect(
        service.update(userId, 'nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when user is not owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)

      await expect(
        service.update(otherUserId, teamId, { name: 'X' }),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('remove', () => {
    it('should delete a team when user is owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.team.delete.mockResolvedValue(mockTeam)

      await service.remove(userId, teamId)

      expect(prisma.team.delete).toHaveBeenCalledWith({
        where: { id: teamId },
      })
    })

    it('should throw NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null)

      await expect(service.remove(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)

      await expect(service.remove(otherUserId, teamId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('addMember', () => {
    const memberUser = { id: otherUserId, email: 'other@test.com' }

    it('should add a member when user is owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.user.findUnique.mockResolvedValue(memberUser)
      const created = {
        teamId,
        userId: otherUserId,
        role: 'MEMBER',
        user: {
          id: otherUserId,
          email: 'other@test.com',
          name: 'Other',
          avatarUrl: null,
        },
      }
      prisma.teamMember.create.mockResolvedValue(created)

      const result = await service.addMember(userId, teamId, 'other@test.com')

      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: { teamId, userId: otherUserId, role: 'MEMBER' },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      })
      expect(result).toEqual(created)
    })

    it('should throw NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null)

      await expect(
        service.addMember(userId, 'nonexistent', 'x@test.com'),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when user is not owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)

      await expect(
        service.addMember(otherUserId, teamId, 'x@test.com'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException when user to add does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.addMember(userId, teamId, 'nobody@test.com'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('removeMember', () => {
    const membership = {
      id: 'membership-1',
      teamId,
      userId: otherUserId,
      role: 'MEMBER',
    }

    it('should remove a member when user is owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.teamMember.findUnique.mockResolvedValue(membership)
      prisma.teamMember.delete.mockResolvedValue(membership)

      await service.removeMember(userId, teamId, otherUserId)

      expect(prisma.teamMember.delete).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
      })
    })

    it('should throw NotFoundException when team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null)

      await expect(
        service.removeMember(userId, 'nonexistent', otherUserId),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when user is not owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)

      await expect(
        service.removeMember(otherUserId, teamId, 'someone'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException when membership does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.teamMember.findUnique.mockResolvedValue(null)

      await expect(
        service.removeMember(userId, teamId, 'unknown-user'),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when trying to remove the owner', async () => {
      prisma.team.findUnique.mockResolvedValue(mockTeam)
      prisma.teamMember.findUnique.mockResolvedValue({
        ...membership,
        userId,
        role: 'OWNER',
      })

      await expect(
        service.removeMember(userId, teamId, userId),
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
