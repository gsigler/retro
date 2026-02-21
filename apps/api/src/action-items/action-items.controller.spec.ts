import { Test, TestingModule } from '@nestjs/testing'
import { ActionItemsController } from './action-items.controller.js'
import { ActionItemsService } from './action-items.service.js'
import { BoardGateway } from '../board/board.gateway.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ActionItemResponse } from './dto/action-item-response.dto.js'

describe('ActionItemsController', () => {
  let controller: ActionItemsController
  let actionItemsService: {
    create: jest.Mock
    findAllForRetro: jest.Mock
    findOne: jest.Mock
    update: jest.Mock
    remove: jest.Mock
    reorder: jest.Mock
    findMembersForRetro: jest.Mock
  }
  let boardGateway: {
    emitActionItemCreated: jest.Mock
    emitActionItemUpdated: jest.Mock
    emitActionItemDeleted: jest.Mock
    emitActionItemsReordered: jest.Mock
  }

  const req = { user: { id: 'user-1' } }

  beforeEach(async () => {
    actionItemsService = {
      create: jest.fn(),
      findAllForRetro: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reorder: jest.fn(),
      findMembersForRetro: jest.fn(),
    }

    boardGateway = {
      emitActionItemCreated: jest.fn(),
      emitActionItemUpdated: jest.fn(),
      emitActionItemDeleted: jest.fn(),
      emitActionItemsReordered: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionItemsController],
      providers: [
        { provide: ActionItemsService, useValue: actionItemsService },
        { provide: BoardGateway, useValue: boardGateway },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<ActionItemsController>(ActionItemsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', ActionItemsController)
    expect(guards).toBeDefined()
    expect(guards).toContain(JwtAuthGuard)
  })

  describe('create', () => {
    it('should return an ActionItemResponse', async () => {
      const dto = { title: 'Fix bug', description: 'Broken' }
      const prismaResult = {
        id: 'item-1',
        title: 'Fix bug',
        description: 'Broken',
        status: 'OPEN',
        dueDate: null,
        retroId: 'retro-1',
        createdById: 'user-1',
        assigneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        createdBy: { id: 'user-1', name: 'Owner', avatarUrl: null },
      }
      actionItemsService.create.mockResolvedValue(prismaResult)

      const result = await controller.create(req, 'retro-1', dto)

      expect(actionItemsService.create).toHaveBeenCalledWith(
        'user-1',
        'retro-1',
        dto,
      )
      expect(result).toBeInstanceOf(ActionItemResponse)
      expect(result.id).toBe('item-1')
      expect(result.assignee).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return ActionItemResponse array', async () => {
      const prismaResult = [
        {
          id: 'item-1',
          title: 'Fix bug',
          description: null,
          status: 'OPEN',
          dueDate: null,
          retroId: 'retro-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: { id: 'user-2', name: 'Dev', avatarUrl: null },
          createdBy: { id: 'user-1', name: 'Owner', avatarUrl: null },
        },
      ]
      actionItemsService.findAllForRetro.mockResolvedValue(prismaResult)

      const result = await controller.findAll(req, 'retro-1')

      expect(actionItemsService.findAllForRetro).toHaveBeenCalledWith(
        'user-1',
        'retro-1',
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(ActionItemResponse)
    })
  })

  describe('findOne', () => {
    it('should return an ActionItemResponse', async () => {
      const prismaResult = {
        id: 'item-1',
        title: 'Fix bug',
        description: null,
        status: 'OPEN',
        dueDate: null,
        retroId: 'retro-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        createdBy: { id: 'user-1', name: 'Owner', avatarUrl: null },
      }
      actionItemsService.findOne.mockResolvedValue(prismaResult)

      const result = await controller.findOne(req, 'item-1')

      expect(actionItemsService.findOne).toHaveBeenCalledWith(
        'user-1',
        'item-1',
      )
      expect(result).toBeInstanceOf(ActionItemResponse)
    })
  })

  describe('update', () => {
    it('should return an ActionItemResponse', async () => {
      const dto = { title: 'Updated' }
      const prismaResult = {
        id: 'item-1',
        title: 'Updated',
        description: null,
        status: 'OPEN',
        dueDate: null,
        retroId: 'retro-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        createdBy: { id: 'user-1', name: 'Owner', avatarUrl: null },
      }
      actionItemsService.update.mockResolvedValue(prismaResult)

      const result = await controller.update(req, 'item-1', dto)

      expect(actionItemsService.update).toHaveBeenCalledWith(
        'user-1',
        'item-1',
        dto,
      )
      expect(result).toBeInstanceOf(ActionItemResponse)
      expect(result.title).toBe('Updated')
    })
  })

  describe('remove', () => {
    it('should call actionItemsService.remove and emit deletion', async () => {
      actionItemsService.findOne.mockResolvedValue({
        id: 'item-1',
        retroId: 'retro-1',
      })
      actionItemsService.remove.mockResolvedValue(undefined)

      await controller.remove(req, 'item-1')

      expect(actionItemsService.findOne).toHaveBeenCalledWith(
        'user-1',
        'item-1',
      )
      expect(actionItemsService.remove).toHaveBeenCalledWith('user-1', 'item-1')
      expect(boardGateway.emitActionItemDeleted).toHaveBeenCalledWith(
        'retro-1',
        'item-1',
      )
    })
  })
})
