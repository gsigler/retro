import { Test, TestingModule } from '@nestjs/testing'
import { BoardController } from './board.controller'
import { BoardService } from './board.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { BoardResponse } from './dto/board-response.dto'
import { CardResponse } from './dto/card-response.dto'
import { RETRO_TEMPLATES } from './templates'

describe('BoardController', () => {
  let controller: BoardController
  let boardService: {
    getTemplates: jest.Mock
    getBoard: jest.Mock
    initBoard: jest.Mock
    createCard: jest.Mock
    moveCard: jest.Mock
    deleteCard: jest.Mock
  }

  const req = { user: { id: 'user-1' } }
  const retroId = 'retro-1'

  const mockColumn = {
    id: 'column-1',
    retroId,
    name: 'Start',
    description: 'Things we should start doing',
    color: '#22c55e',
    position: 0,
    cards: [],
  }

  const mockCard = {
    id: 'card-1',
    columnId: 'column-1',
    retroId,
    content: 'Test card',
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 'user-1', name: 'Test User' },
  }

  beforeEach(async () => {
    boardService = {
      getTemplates: jest.fn(),
      getBoard: jest.fn(),
      initBoard: jest.fn(),
      createCard: jest.fn(),
      moveCard: jest.fn(),
      deleteCard: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [{ provide: BoardService, useValue: boardService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<BoardController>(BoardController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', BoardController)
    expect(guards).toBeDefined()
    expect(guards).toContain(JwtAuthGuard)
  })

  describe('getTemplates', () => {
    it('should return all templates', () => {
      boardService.getTemplates.mockReturnValue(RETRO_TEMPLATES)

      const result = controller.getTemplates()

      expect(result).toEqual(RETRO_TEMPLATES)
    })
  })

  describe('getBoard', () => {
    it('should return a BoardResponse', async () => {
      boardService.getBoard.mockResolvedValue([mockColumn])

      const result = await controller.getBoard(req, retroId)

      expect(boardService.getBoard).toHaveBeenCalledWith('user-1', retroId)
      expect(result).toBeInstanceOf(BoardResponse)
      expect(result.retroId).toBe(retroId)
      expect(result.columns).toHaveLength(1)
    })
  })

  describe('initBoard', () => {
    it('should return a BoardResponse after initialization', async () => {
      boardService.initBoard.mockResolvedValue([mockColumn])

      const result = await controller.initBoard(req, retroId, {
        templateId: 'start-stop-continue',
      })

      expect(boardService.initBoard).toHaveBeenCalledWith(
        'user-1',
        retroId,
        'start-stop-continue',
      )
      expect(result).toBeInstanceOf(BoardResponse)
    })
  })

  describe('createCard', () => {
    it('should return a CardResponse', async () => {
      boardService.createCard.mockResolvedValue(mockCard)

      const result = await controller.createCard(req, retroId, {
        columnId: 'column-1',
        content: 'Test card',
      })

      expect(boardService.createCard).toHaveBeenCalledWith('user-1', retroId, {
        columnId: 'column-1',
        content: 'Test card',
      })
      expect(result).toBeInstanceOf(CardResponse)
      expect(result.id).toBe('card-1')
    })
  })

  describe('moveCard', () => {
    it('should return a CardResponse', async () => {
      boardService.moveCard.mockResolvedValue({
        ...mockCard,
        columnId: 'column-2',
        position: 1,
      })

      const result = await controller.moveCard(req, retroId, 'card-1', {
        columnId: 'column-2',
        position: 1,
      })

      expect(boardService.moveCard).toHaveBeenCalledWith(
        'user-1',
        retroId,
        'card-1',
        { columnId: 'column-2', position: 1 },
      )
      expect(result).toBeInstanceOf(CardResponse)
    })
  })

  describe('deleteCard', () => {
    it('should call boardService.deleteCard', async () => {
      boardService.deleteCard.mockResolvedValue(undefined)

      const result = await controller.deleteCard(req, retroId, 'card-1')

      expect(boardService.deleteCard).toHaveBeenCalledWith(
        'user-1',
        retroId,
        'card-1',
      )
      expect(result).toBeUndefined()
    })
  })
})
