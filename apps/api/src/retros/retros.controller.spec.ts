import { Test, TestingModule } from '@nestjs/testing'
import { RetrosController } from './retros.controller.js'
import { RetrosService } from './retros.service.js'
import { BoardService } from '../board/board.service.js'
import { BoardGateway } from '../board/board.gateway.js'
import { DashboardGateway } from '../dashboard/dashboard.gateway.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import {
  RetroResponse,
  RetroWithCountsResponse,
} from './dto/retro-response.dto.js'

describe('RetrosController', () => {
  let controller: RetrosController
  let retrosService: {
    create: jest.Mock
    findAll: jest.Mock
    findOne: jest.Mock
    update: jest.Mock
    updatePhase: jest.Mock
    remove: jest.Mock
  }
  let boardService: { getAllCards: jest.Mock }
  let boardGateway: {
    emitPhaseChanged: jest.Mock
    emitBoardRevealed: jest.Mock
  }
  let dashboardGateway: {
    emitRetroCreated: jest.Mock
    emitRetroUpdated: jest.Mock
    emitRetroDeleted: jest.Mock
  }

  const req = { user: { id: 'user-1' } }

  const mockPrismaRetro = {
    id: 'retro-1',
    name: 'Sprint 1 Retro',
    status: 'SCHEDULED',
    phase: 'BRAINSTORM',
    date: new Date('2026-02-16'),
    teamId: 'team-1',
    createdAt: new Date(),
    createdById: 'user-1',
    createdBy: { id: 'user-1', email: 'owner@test.com', name: 'Owner' },
  }

  const mockPrismaRetroWithCounts = {
    ...mockPrismaRetro,
    _count: { actionItems: 3 },
  }

  beforeEach(async () => {
    retrosService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updatePhase: jest.fn(),
      remove: jest.fn(),
    }

    boardService = {
      getAllCards: jest.fn(),
    }

    boardGateway = {
      emitPhaseChanged: jest.fn(),
      emitBoardRevealed: jest.fn(),
    }

    dashboardGateway = {
      emitRetroCreated: jest.fn(),
      emitRetroUpdated: jest.fn(),
      emitRetroDeleted: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetrosController],
      providers: [
        { provide: RetrosService, useValue: retrosService },
        { provide: BoardService, useValue: boardService },
        { provide: BoardGateway, useValue: boardGateway },
        { provide: DashboardGateway, useValue: dashboardGateway },
      ],
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
    it('should return a RetroResponse and emit dashboard event', async () => {
      const dto = { name: 'Sprint 1 Retro', date: '2026-02-16' }
      retrosService.create.mockResolvedValue(mockPrismaRetro)

      const result = await controller.create(req, 'team-1', dto)

      expect(retrosService.create).toHaveBeenCalledWith('user-1', 'team-1', dto)
      expect(dashboardGateway.emitRetroCreated).toHaveBeenCalledWith('team-1')
      expect(result).toBeInstanceOf(RetroResponse)
      expect(result.id).toBe('retro-1')
      expect(result.createdBy.email).toBe('owner@test.com')
      expect(result).not.toHaveProperty('createdById')
    })
  })

  describe('findAll', () => {
    it('should return RetroWithCountsResponse array', async () => {
      retrosService.findAll.mockResolvedValue([mockPrismaRetroWithCounts])

      const result = await controller.findAll(req, 'team-1')

      expect(retrosService.findAll).toHaveBeenCalledWith('user-1', 'team-1')
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(RetroWithCountsResponse)
      expect(result[0].actionItemCount).toBe(3)
      expect(result[0]).not.toHaveProperty('_count')
    })
  })

  describe('findOne', () => {
    it('should return a RetroWithCountsResponse', async () => {
      retrosService.findOne.mockResolvedValue(mockPrismaRetroWithCounts)

      const result = await controller.findOne(req, 'retro-1')

      expect(retrosService.findOne).toHaveBeenCalledWith('user-1', 'retro-1')
      expect(result).toBeInstanceOf(RetroWithCountsResponse)
      expect(result.actionItemCount).toBe(3)
      expect(result).not.toHaveProperty('_count')
      expect(result).not.toHaveProperty('createdById')
    })
  })

  describe('update', () => {
    it('should return a RetroWithCountsResponse and emit dashboard event', async () => {
      const dto = { name: 'Updated Retro' }
      retrosService.update.mockResolvedValue({
        ...mockPrismaRetroWithCounts,
        name: 'Updated Retro',
      })

      const result = await controller.update(req, 'retro-1', dto)

      expect(retrosService.update).toHaveBeenCalledWith(
        'user-1',
        'retro-1',
        dto,
      )
      expect(dashboardGateway.emitRetroUpdated).toHaveBeenCalledWith('team-1')
      expect(result).toBeInstanceOf(RetroWithCountsResponse)
      expect(result.name).toBe('Updated Retro')
    })
  })

  describe('remove', () => {
    it('should call retrosService.remove and emit dashboard event', async () => {
      retrosService.findOne.mockResolvedValue(mockPrismaRetroWithCounts)
      retrosService.remove.mockResolvedValue(undefined)

      await controller.remove(req, 'retro-1')

      expect(retrosService.findOne).toHaveBeenCalledWith('user-1', 'retro-1')
      expect(retrosService.remove).toHaveBeenCalledWith('user-1', 'retro-1')
      expect(dashboardGateway.emitRetroDeleted).toHaveBeenCalledWith('team-1')
    })
  })
})
