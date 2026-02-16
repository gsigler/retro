import { Test, TestingModule } from '@nestjs/testing'
import { RetrosController } from './retros.controller'
import { RetrosService } from './retros.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

describe('RetrosController', () => {
  let controller: RetrosController
  let retrosService: {
    create: jest.Mock
    findAll: jest.Mock
    findOne: jest.Mock
    update: jest.Mock
    remove: jest.Mock
  }

  const req = { user: { id: 'user-1' } }

  beforeEach(async () => {
    retrosService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetrosController],
      providers: [{ provide: RetrosService, useValue: retrosService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<RetrosController>(RetrosController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', RetrosController)
    expect(guards).toBeDefined()
    expect(guards).toContain(JwtAuthGuard)
  })

  describe('create', () => {
    it('should call retrosService.create with user id, team id, and dto', async () => {
      const dto = { name: 'Sprint 1 Retro', date: '2026-02-16' }
      const expected = { id: 'retro-1', ...dto, teamId: 'team-1' }
      retrosService.create.mockResolvedValue(expected)

      const result = await controller.create(req, 'team-1', dto)

      expect(retrosService.create).toHaveBeenCalledWith('user-1', 'team-1', dto)
      expect(result).toEqual(expected)
    })
  })

  describe('findAll', () => {
    it('should call retrosService.findAll with user id and team id', async () => {
      const retros = [{ id: 'retro-1', name: 'Sprint 1 Retro' }]
      retrosService.findAll.mockResolvedValue(retros)

      const result = await controller.findAll(req, 'team-1')

      expect(retrosService.findAll).toHaveBeenCalledWith('user-1', 'team-1')
      expect(result).toEqual(retros)
    })
  })

  describe('findOne', () => {
    it('should call retrosService.findOne with user id and retro id', async () => {
      const retro = { id: 'retro-1', name: 'Sprint 1 Retro' }
      retrosService.findOne.mockResolvedValue(retro)

      const result = await controller.findOne(req, 'retro-1')

      expect(retrosService.findOne).toHaveBeenCalledWith('user-1', 'retro-1')
      expect(result).toEqual(retro)
    })
  })

  describe('update', () => {
    it('should call retrosService.update with user id, retro id, and dto', async () => {
      const dto = { name: 'Updated Retro' }
      const expected = { id: 'retro-1', name: 'Updated Retro' }
      retrosService.update.mockResolvedValue(expected)

      const result = await controller.update(req, 'retro-1', dto)

      expect(retrosService.update).toHaveBeenCalledWith(
        'user-1',
        'retro-1',
        dto,
      )
      expect(result).toEqual(expected)
    })
  })

  describe('remove', () => {
    it('should call retrosService.remove with user id and retro id', async () => {
      retrosService.remove.mockResolvedValue(undefined)

      const result = await controller.remove(req, 'retro-1')

      expect(retrosService.remove).toHaveBeenCalledWith('user-1', 'retro-1')
      expect(result).toBeUndefined()
    })
  })
})
