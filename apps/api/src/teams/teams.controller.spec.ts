import { Test, TestingModule } from '@nestjs/testing'
import { TeamsController } from './teams.controller'
import { TeamsService } from './teams.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

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
    it('should call teamsService.create with user id and dto', async () => {
      const dto = { name: 'New Team', description: 'desc' }
      const expected = { id: 'team-1', ...dto, ownerId: 'user-1' }
      teamsService.create.mockResolvedValue(expected)

      const result = await controller.create(req, dto)

      expect(teamsService.create).toHaveBeenCalledWith('user-1', dto)
      expect(result).toEqual(expected)
    })
  })

  describe('findAll', () => {
    it('should call teamsService.findAll with user id', async () => {
      const teams = [{ id: 'team-1', name: 'Team' }]
      teamsService.findAll.mockResolvedValue(teams)

      const result = await controller.findAll(req)

      expect(teamsService.findAll).toHaveBeenCalledWith('user-1')
      expect(result).toEqual(teams)
    })
  })

  describe('findOne', () => {
    it('should call teamsService.findOne with user id and team id', async () => {
      const team = { id: 'team-1', name: 'Team', members: [] }
      teamsService.findOne.mockResolvedValue(team)

      const result = await controller.findOne(req, 'team-1')

      expect(teamsService.findOne).toHaveBeenCalledWith('user-1', 'team-1')
      expect(result).toEqual(team)
    })
  })

  describe('update', () => {
    it('should call teamsService.update with user id, team id, and dto', async () => {
      const dto = { name: 'Updated' }
      const expected = { id: 'team-1', name: 'Updated' }
      teamsService.update.mockResolvedValue(expected)

      const result = await controller.update(req, 'team-1', dto)

      expect(teamsService.update).toHaveBeenCalledWith('user-1', 'team-1', dto)
      expect(result).toEqual(expected)
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
    it('should call teamsService.addMember with user id, team id, and email', async () => {
      const dto = { email: 'new@test.com' }
      const expected = { userId: 'user-2', role: 'MEMBER' }
      teamsService.addMember.mockResolvedValue(expected)

      const result = await controller.addMember(req, 'team-1', dto)

      expect(teamsService.addMember).toHaveBeenCalledWith(
        'user-1',
        'team-1',
        'new@test.com',
      )
      expect(result).toEqual(expected)
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
