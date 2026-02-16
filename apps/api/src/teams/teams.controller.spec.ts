import { Test, TestingModule } from '@nestjs/testing'
import { TeamsController } from './teams.controller'
import { TeamsService } from './teams.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import {
  TeamResponse,
  TeamWithCountsResponse,
  TeamDetailResponse,
  TeamMemberResponse,
} from './dto/team-response.dto'

describe('TeamsController', () => {
  let controller: TeamsController
  let teamsService: {
    create: jest.Mock
    findAll: jest.Mock
    findOne: jest.Mock
    update: jest.Mock
    remove: jest.Mock
    addMember: jest.Mock
    removeMember: jest.Mock
  }

  const req = { user: { id: 'user-1' } }

  beforeEach(async () => {
    teamsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: teamsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<TeamsController>(TeamsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', TeamsController)
    expect(guards).toBeDefined()
    expect(guards).toContain(JwtAuthGuard)
  })

  describe('create', () => {
    it('should return a TeamResponse', async () => {
      const dto = { name: 'New Team', description: 'desc' }
      const prismaResult = {
        id: 'team-1',
        name: 'New Team',
        description: 'desc',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [],
      }
      teamsService.create.mockResolvedValue(prismaResult)

      const result = await controller.create(req, dto)

      expect(teamsService.create).toHaveBeenCalledWith('user-1', dto)
      expect(result).toBeInstanceOf(TeamResponse)
      expect(result.id).toBe('team-1')
      expect(result).not.toHaveProperty('members')
    })
  })

  describe('findAll', () => {
    it('should return TeamWithCountsResponse array', async () => {
      const prismaResult = [
        {
          id: 'team-1',
          name: 'Team',
          description: null,
          ownerId: 'user-1',
          createdAt: new Date(),
          _count: { members: 2, retros: 3 },
        },
      ]
      teamsService.findAll.mockResolvedValue(prismaResult)

      const result = await controller.findAll(req)

      expect(teamsService.findAll).toHaveBeenCalledWith('user-1')
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(TeamWithCountsResponse)
      expect(result[0].memberCount).toBe(2)
      expect(result[0].retroCount).toBe(3)
      expect(result[0]).not.toHaveProperty('_count')
    })
  })

  describe('findOne', () => {
    it('should return a TeamDetailResponse', async () => {
      const prismaResult = {
        id: 'team-1',
        name: 'Team',
        description: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 'member-1',
            role: 'OWNER',
            joinedAt: new Date(),
            user: {
              id: 'user-1',
              email: 'owner@test.com',
              name: 'Owner',
              avatarUrl: null,
            },
          },
        ],
        _count: { retros: 2 },
      }
      teamsService.findOne.mockResolvedValue(prismaResult)

      const result = await controller.findOne(req, 'team-1')

      expect(teamsService.findOne).toHaveBeenCalledWith('user-1', 'team-1')
      expect(result).toBeInstanceOf(TeamDetailResponse)
      expect(result.retroCount).toBe(2)
      expect(result.members).toHaveLength(1)
      expect(result.members[0]).toBeInstanceOf(TeamMemberResponse)
      expect(result).not.toHaveProperty('_count')
    })
  })

  describe('update', () => {
    it('should return a TeamResponse', async () => {
      const dto = { name: 'Updated' }
      const prismaResult = {
        id: 'team-1',
        name: 'Updated',
        description: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      teamsService.update.mockResolvedValue(prismaResult)

      const result = await controller.update(req, 'team-1', dto)

      expect(teamsService.update).toHaveBeenCalledWith('user-1', 'team-1', dto)
      expect(result).toBeInstanceOf(TeamResponse)
      expect(result.name).toBe('Updated')
    })
  })

  describe('remove', () => {
    it('should call teamsService.remove with user id and team id', async () => {
      teamsService.remove.mockResolvedValue(undefined)

      const result = await controller.remove(req, 'team-1')

      expect(teamsService.remove).toHaveBeenCalledWith('user-1', 'team-1')
      expect(result).toBeUndefined()
    })
  })

  describe('addMember', () => {
    it('should return a TeamMemberResponse', async () => {
      const dto = { email: 'new@test.com' }
      const prismaResult = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-2',
        role: 'MEMBER',
        joinedAt: new Date(),
        user: {
          id: 'user-2',
          email: 'new@test.com',
          name: 'New User',
          avatarUrl: null,
        },
      }
      teamsService.addMember.mockResolvedValue(prismaResult)

      const result = await controller.addMember(req, 'team-1', dto)

      expect(teamsService.addMember).toHaveBeenCalledWith(
        'user-1',
        'team-1',
        'new@test.com',
      )
      expect(result).toBeInstanceOf(TeamMemberResponse)
      expect(result.role).toBe('MEMBER')
      expect(result).not.toHaveProperty('teamId')
    })
  })

  describe('removeMember', () => {
    it('should call teamsService.removeMember with user id, team id, and member user id', async () => {
      teamsService.removeMember.mockResolvedValue(undefined)

      const result = await controller.removeMember(req, 'team-1', 'user-2')

      expect(teamsService.removeMember).toHaveBeenCalledWith(
        'user-1',
        'team-1',
        'user-2',
      )
      expect(result).toBeUndefined()
    })
  })
})
