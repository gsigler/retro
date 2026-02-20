import { Test, TestingModule } from '@nestjs/testing'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { BoardService } from './board.service'
import { PrismaService } from '../prisma/prisma.service'
import { RETRO_TEMPLATES } from './templates'

describe('BoardService', () => {
  let service: BoardService
  let prisma: {
    retro: { findUnique: jest.Mock }
    teamMember: { findUnique: jest.Mock }
    column: {
      findMany: jest.Mock
      findFirst: jest.Mock
      createMany: jest.Mock
    }
    card: {
      findFirst: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      aggregate: jest.Mock
    }
  }

  const userId = 'user-1'
  const otherUserId = 'user-2'
  const retroId = 'retro-1'
  const teamId = 'team-1'
  const columnId = 'column-1'
  const cardId = 'card-1'

  const mockRetro = { id: retroId, teamId }
  const mockMembership = { teamId, userId }
  const mockAuthor = { id: userId, name: 'Test User' }

  const mockColumn = {
    id: columnId,
    retroId,
    name: 'Start',
    description: 'Things we should start doing',
    color: '#22c55e',
    position: 0,
    cards: [],
  }

  const mockCard = {
    id: cardId,
    columnId,
    retroId,
    authorId: userId,
    content: 'Test card content',
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: mockAuthor,
  }

  beforeEach(async () => {
    prisma = {
      retro: { findUnique: jest.fn() },
      teamMember: { findUnique: jest.fn() },
      column: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        createMany: jest.fn(),
      },
      card: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [BoardService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<BoardService>(BoardService)
  })

  describe('getTemplates', () => {
    it('should return all retro templates', () => {
      const templates = service.getTemplates()

      expect(templates).toEqual(RETRO_TEMPLATES)
      expect(templates).toHaveLength(4)
      expect(templates[0].id).toBe('start-stop-continue')
    })
  })

  describe('getBoard', () => {
    it('should return columns with cards for a retro', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.column.findMany.mockResolvedValue([mockColumn])

      const result = await service.getBoard(userId, retroId)

      expect(prisma.column.findMany).toHaveBeenCalledWith({
        where: { retroId },
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
            include: { author: { select: { id: true, name: true } } },
          },
        },
      })
      expect(result).toEqual([mockColumn])
    })

    it('should throw NotFoundException when retro does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(null)

      await expect(service.getBoard(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(null)

      await expect(service.getBoard(otherUserId, retroId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('initBoard', () => {
    it('should create columns from a template', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.column.findFirst.mockResolvedValue(null)
      prisma.column.createMany.mockResolvedValue({ count: 3 })
      prisma.column.findMany.mockResolvedValue([mockColumn])

      const result = await service.initBoard(
        userId,
        retroId,
        'start-stop-continue',
      )

      expect(prisma.column.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ retroId, name: 'Start', position: 0 }),
        ]),
      })
      expect(result).toEqual([mockColumn])
    })

    it('should throw BadRequestException for unknown template', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.initBoard(userId, retroId, 'nonexistent'),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException if board is already initialized', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.column.findFirst.mockResolvedValue(mockColumn)

      await expect(
        service.initBoard(userId, retroId, 'start-stop-continue'),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createCard', () => {
    it('should create a card in the specified column', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.column.findFirst.mockResolvedValue(mockColumn)
      prisma.card.aggregate.mockResolvedValue({ _max: { position: 2 } })
      prisma.card.create.mockResolvedValue(mockCard)

      const result = await service.createCard(userId, retroId, {
        columnId,
        content: 'Test card content',
      })

      expect(prisma.card.create).toHaveBeenCalledWith({
        data: {
          columnId,
          retroId,
          authorId: userId,
          content: 'Test card content',
          position: 3,
        },
        include: { author: { select: { id: true, name: true } } },
      })
      expect(result).toEqual(mockCard)
    })

    it('should set position to 0 when column has no cards', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.column.findFirst.mockResolvedValue(mockColumn)
      prisma.card.aggregate.mockResolvedValue({ _max: { position: null } })
      prisma.card.create.mockResolvedValue(mockCard)

      await service.createCard(userId, retroId, {
        columnId,
        content: 'First card',
      })

      expect(prisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 0 }),
        }),
      )
    })

    it('should throw NotFoundException when column is not in the retro', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.column.findFirst.mockResolvedValue(null)

      await expect(
        service.createCard(userId, retroId, {
          columnId: 'wrong-column',
          content: 'Test',
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('moveCard', () => {
    it('should move a card to a new column and position', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.card.findFirst.mockResolvedValue(mockCard)
      prisma.column.findFirst.mockResolvedValue(mockColumn)
      prisma.card.update.mockResolvedValue({
        ...mockCard,
        columnId: 'column-2',
        position: 1,
      })

      const result = await service.moveCard(userId, retroId, cardId, {
        columnId: 'column-2',
        position: 1,
      })

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { columnId: 'column-2', position: 1 },
        include: { author: { select: { id: true, name: true } } },
      })
      expect(result.columnId).toBe('column-2')
    })

    it('should throw NotFoundException when card does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.card.findFirst.mockResolvedValue(null)

      await expect(
        service.moveCard(userId, retroId, 'nonexistent', {
          columnId,
          position: 0,
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when target column is not in the retro', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.card.findFirst.mockResolvedValue(mockCard)
      prisma.column.findFirst.mockResolvedValue(null)

      await expect(
        service.moveCard(userId, retroId, cardId, {
          columnId: 'wrong-column',
          position: 0,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.card.findFirst.mockResolvedValue(mockCard)
      prisma.card.delete.mockResolvedValue(mockCard)

      await service.deleteCard(userId, retroId, cardId)

      expect(prisma.card.delete).toHaveBeenCalledWith({
        where: { id: cardId },
      })
    })

    it('should throw NotFoundException when card does not exist', async () => {
      prisma.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.card.findFirst.mockResolvedValue(null)

      await expect(
        service.deleteCard(userId, retroId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
