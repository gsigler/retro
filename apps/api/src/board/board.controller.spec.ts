import { Test, TestingModule } from '@nestjs/testing'
import { BoardController } from './board.controller.js'
import { BoardService } from './board.service.js'
import { BoardGateway } from './board.gateway.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { BoardResponse } from './dto/board-response.dto.js'
import { CardResponse } from './dto/card-response.dto.js'
import { RETRO_TEMPLATES } from './templates.js'

describe('BoardController', () => {
  let controller: BoardController
  let boardGateway: {
    emitBoardInitialized: jest.Mock
    emitCardCreated: jest.Mock
    emitCardCreatedToAuthor: jest.Mock
    emitCardMoved: jest.Mock
    emitCardDeleted: jest.Mock
    emitCardVoted: jest.Mock
    emitCardUnvoted: jest.Mock
    emitCardsMerged: jest.Mock
    emitCardsUnmerged: jest.Mock
  }
  let boardService: {
    getTemplates: jest.Mock
    getBoard: jest.Mock
    initBoard: jest.Mock
    createCard: jest.Mock
    moveCard: jest.Mock
    deleteCard: jest.Mock
    getRetroPhase: jest.Mock
    voteCard: jest.Mock
    unvoteCard: jest.Mock
    getUserVotes: jest.Mock
    mergeCards: jest.Mock
    unmergeCard: jest.Mock
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
    _count: { votes: 0 },
    parentCardId: null,
    children: [],
  }

  beforeEach(async () => {
    boardGateway = {
      emitBoardInitialized: jest.fn(),
      emitCardCreated: jest.fn(),
      emitCardCreatedToAuthor: jest.fn(),
      emitCardMoved: jest.fn(),
      emitCardDeleted: jest.fn(),
      emitCardVoted: jest.fn(),
      emitCardUnvoted: jest.fn(),
      emitCardsMerged: jest.fn(),
      emitCardsUnmerged: jest.fn(),
    }

    boardService = {
      getTemplates: jest.fn(),
      getBoard: jest.fn(),
      initBoard: jest.fn(),
      createCard: jest.fn(),
      moveCard: jest.fn(),
      deleteCard: jest.fn(),
      getRetroPhase: jest.fn(),
      voteCard: jest.fn(),
      unvoteCard: jest.fn(),
      getUserVotes: jest.fn(),
      mergeCards: jest.fn(),
      unmergeCard: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [
        { provide: BoardService, useValue: boardService },
        { provide: BoardGateway, useValue: boardGateway },
      ],
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
    it('should return a BoardResponse after initialization and emit event', async () => {
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
      expect(boardGateway.emitBoardInitialized).toHaveBeenCalledWith(
        retroId,
        result.columns,
      )
    })
  })

  describe('createCard', () => {
    it('should broadcast to all when phase is GROUP_VOTE', async () => {
      boardService.createCard.mockResolvedValue(mockCard)
      boardService.getRetroPhase.mockResolvedValue('GROUP_VOTE')

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
      expect(boardGateway.emitCardCreated).toHaveBeenCalledWith(retroId, result)
    })

    it('should emit only to author when phase is RETROSPECT', async () => {
      boardService.createCard.mockResolvedValue(mockCard)
      boardService.getRetroPhase.mockResolvedValue('RETROSPECT')

      const result = await controller.createCard(req, retroId, {
        columnId: 'column-1',
        content: 'Test card',
      })

      expect(result).toBeInstanceOf(CardResponse)
      expect(boardGateway.emitCardCreatedToAuthor).toHaveBeenCalledWith(
        retroId,
        'user-1',
        result,
      )
      expect(boardGateway.emitCardCreated).not.toHaveBeenCalled()
    })
  })

  describe('moveCard', () => {
    it('should return a CardResponse and emit event', async () => {
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
      expect(boardGateway.emitCardMoved).toHaveBeenCalledWith(retroId, result)
    })
  })

  describe('deleteCard', () => {
    it('should call boardService.deleteCard and emit event', async () => {
      boardService.deleteCard.mockResolvedValue(undefined)

      await controller.deleteCard(req, retroId, 'card-1')

      expect(boardService.deleteCard).toHaveBeenCalledWith(
        'user-1',
        retroId,
        'card-1',
      )
      expect(boardGateway.emitCardDeleted).toHaveBeenCalledWith(
        retroId,
        'card-1',
      )
    })
  })
})
