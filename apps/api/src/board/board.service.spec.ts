import { Test, TestingModule } from '@nestjs/testing'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { BoardService } from './board.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { RETRO_TEMPLATES } from './templates.js'

describe('BoardService', () => {
  let service: BoardService
  let prisma: {
    client: {
      retro: { findUnique: jest.Mock }
      teamMember: { findUnique: jest.Mock }
      column: {
        findMany: jest.Mock
        findFirst: jest.Mock
        createMany: jest.Mock
      }
      card: {
        findFirst: jest.Mock
        findUnique: jest.Mock
        findUniqueOrThrow: jest.Mock
        create: jest.Mock
        update: jest.Mock
        updateMany: jest.Mock
        delete: jest.Mock
        aggregate: jest.Mock
      }
      $transaction: jest.Mock
      vote: {
        count: jest.Mock
        create: jest.Mock
        findFirst: jest.Mock
        findMany: jest.Mock
        delete: jest.Mock
      }
    }
  }

  const userId = 'user-1'
  const otherUserId = 'user-2'
  const retroId = 'retro-1'
  const teamId = 'team-1'
  const columnId = 'column-1'
  const cardId = 'card-1'

  const facilitatorId = 'facilitator-1'
  const mockRetro = {
    id: retroId,
    teamId,
    phase: 'ICEBREAKER',
    createdById: facilitatorId,
  }
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
      client: {
        retro: { findUnique: jest.fn() },
        teamMember: { findUnique: jest.fn() },
        column: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          createMany: jest.fn(),
        },
        card: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          findUniqueOrThrow: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          delete: jest.fn(),
          aggregate: jest.fn(),
        },
        $transaction: jest.fn(),
        vote: {
          count: jest.fn(),
          create: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          delete: jest.fn(),
        },
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
    it('should always fetch all cards (no authorId filter)', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findMany.mockResolvedValue([mockColumn])

      await service.getBoard(userId, retroId)

      expect(prisma.client.column.findMany).toHaveBeenCalledWith({
        where: { retroId },
        orderBy: { position: 'asc' },
        include: {
          cards: {
            where: { parentCardId: null },
            orderBy: { position: 'asc' },
            include: {
              author: { select: { id: true, name: true } },
              _count: { select: { votes: true } },
              children: {
                include: {
                  author: { select: { id: true, name: true } },
                  _count: { select: { votes: true } },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      })
    })

    it('should mask non-owned cards during ICEBREAKER phase', async () => {
      const otherCard = {
        ...mockCard,
        id: 'card-other',
        authorId: otherUserId,
        content: 'Secret content',
        author: { id: otherUserId, name: 'Other User' },
        _count: { votes: 3 },
        children: [],
      }
      const ownCard = {
        ...mockCard,
        authorId: userId,
      }
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findMany.mockResolvedValue([
        { ...mockColumn, cards: [ownCard, otherCard] },
      ])

      const result = await service.getBoard(userId, retroId)

      // Own card is untouched
      expect(result[0].cards[0]).toEqual(ownCard)
      // Other user's card is masked
      expect(result[0].cards[1].id).toBe('card-other')
      expect(result[0].cards[1].content).toBe('')
      expect(result[0].cards[1].author).toEqual({ id: 'anonymous', name: null })
      expect(result[0].cards[1].voteCount).toBe(0)
    })

    it('should mask non-owned cards during RETROSPECT phase', async () => {
      const otherCard = {
        ...mockCard,
        id: 'card-other',
        authorId: otherUserId,
        content: 'Secret',
        author: { id: otherUserId, name: 'Other' },
        _count: { votes: 0 },
        children: [],
      }
      prisma.client.retro.findUnique.mockResolvedValue({
        ...mockRetro,
        phase: 'RETROSPECT',
      })
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findMany.mockResolvedValue([
        { ...mockColumn, cards: [otherCard] },
      ])

      const result = await service.getBoard(userId, retroId)

      expect(result[0].cards[0].content).toBe('')
      expect(result[0].cards[0].author.id).toBe('anonymous')
    })

    it('should return all cards unmasked during GROUP_VOTE phase', async () => {
      const otherCard = {
        ...mockCard,
        id: 'card-other',
        authorId: otherUserId,
        content: 'Visible content',
        author: { id: otherUserId, name: 'Other User' },
        _count: { votes: 0 },
        children: [],
      }
      prisma.client.retro.findUnique.mockResolvedValue({
        ...mockRetro,
        phase: 'GROUP_VOTE',
      })
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findMany.mockResolvedValue([
        { ...mockColumn, cards: [otherCard] },
      ])

      const result = await service.getBoard(userId, retroId)

      expect(result[0].cards[0].content).toBe('Visible content')
      expect(result[0].cards[0].author.name).toBe('Other User')
    })

    it('should throw NotFoundException when retro does not exist', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(null)

      await expect(service.getBoard(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw ForbiddenException when user is not a team member', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(null)

      await expect(service.getBoard(otherUserId, retroId)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('initBoard', () => {
    it('should create columns from a template', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findFirst.mockResolvedValue(null)
      prisma.client.column.createMany.mockResolvedValue({ count: 3 })
      prisma.client.column.findMany.mockResolvedValue([mockColumn])

      const result = await service.initBoard(
        userId,
        retroId,
        'start-stop-continue',
      )

      expect(prisma.client.column.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ retroId, name: 'Start', position: 0 }),
        ]),
      })
      expect(result).toEqual([mockColumn])
    })

    it('should throw BadRequestException for unknown template', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.initBoard(userId, retroId, 'nonexistent'),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException if board is already initialized', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findFirst.mockResolvedValue(mockColumn)

      await expect(
        service.initBoard(userId, retroId, 'start-stop-continue'),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createCard', () => {
    it('should create a card in the specified column', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findFirst.mockResolvedValue(mockColumn)
      prisma.client.card.aggregate.mockResolvedValue({ _max: { position: 2 } })
      prisma.client.card.create.mockResolvedValue(mockCard)

      const result = await service.createCard(userId, retroId, {
        columnId,
        content: 'Test card content',
      })

      expect(prisma.client.card.create).toHaveBeenCalledWith({
        data: {
          columnId,
          retroId,
          authorId: userId,
          content: 'Test card content',
          position: 3,
        },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true } },
          children: {
            include: {
              author: { select: { id: true, name: true } },
              _count: { select: { votes: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      expect(result).toEqual({ card: mockCard, phase: 'ICEBREAKER' })
    })

    it('should set position to 0 when column has no cards', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findFirst.mockResolvedValue(mockColumn)
      prisma.client.card.aggregate.mockResolvedValue({
        _max: { position: null },
      })
      prisma.client.card.create.mockResolvedValue(mockCard)

      await service.createCard(userId, retroId, {
        columnId,
        content: 'First card',
      })

      expect(prisma.client.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 0 }),
        }),
      )
    })

    it('should throw NotFoundException when column is not in the retro', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.column.findFirst.mockResolvedValue(null)

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
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(mockCard)
      prisma.client.column.findFirst.mockResolvedValue(mockColumn)
      prisma.client.card.update.mockResolvedValue({
        ...mockCard,
        columnId: 'column-2',
        position: 1,
      })

      const result = await service.moveCard(userId, retroId, cardId, {
        columnId: 'column-2',
        position: 1,
      })

      expect(prisma.client.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { columnId: 'column-2', position: 1 },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true } },
          children: {
            include: {
              author: { select: { id: true, name: true } },
              _count: { select: { votes: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      expect(result.columnId).toBe('column-2')
    })

    it('should throw NotFoundException when card does not exist', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(null)

      await expect(
        service.moveCard(userId, retroId, 'nonexistent', {
          columnId,
          position: 0,
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when target column is not in the retro', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(mockCard)
      prisma.client.column.findFirst.mockResolvedValue(null)

      await expect(
        service.moveCard(userId, retroId, cardId, {
          columnId: 'wrong-column',
          position: 0,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteCard', () => {
    it('should allow card author to delete their own card', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(mockCard)
      prisma.client.card.delete.mockResolvedValue(mockCard)

      await service.deleteCard(userId, retroId, cardId)

      expect(prisma.client.card.delete).toHaveBeenCalledWith({
        where: { id: cardId },
      })
    })

    it('should allow facilitator to delete any card', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue({
        teamId,
        userId: facilitatorId,
      })
      prisma.client.card.findFirst.mockResolvedValue(mockCard)
      prisma.client.card.delete.mockResolvedValue(mockCard)

      await service.deleteCard(facilitatorId, retroId, cardId)

      expect(prisma.client.card.delete).toHaveBeenCalledWith({
        where: { id: cardId },
      })
    })

    it('should throw ForbiddenException when non-author non-facilitator deletes', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue({
        teamId,
        userId: otherUserId,
      })
      prisma.client.card.findFirst.mockResolvedValue(mockCard)

      await expect(
        service.deleteCard(otherUserId, retroId, cardId),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException when card does not exist', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(null)

      await expect(
        service.deleteCard(userId, retroId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('voteCard', () => {
    const mockGroupVoteRetro = {
      ...mockRetro,
      phase: 'GROUP_VOTE',
      maxVotesPerUser: 5,
    }

    it('should create a vote and return vote count', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(mockCard)
      prisma.client.$transaction.mockImplementation((cb) => cb(prisma.client))
      prisma.client.vote.count
        .mockResolvedValueOnce(2) // userVoteCount
        .mockResolvedValueOnce(3) // voteCount for card
      prisma.client.vote.create.mockResolvedValue({
        id: 'vote-1',
        cardId,
        userId,
        retroId,
      })

      const result = await service.voteCard(userId, retroId, cardId)

      expect(result).toEqual({
        vote: { id: 'vote-1', cardId, userId, retroId },
        voteCount: 3,
        remainingVotes: 2,
      })
    })

    it('should throw BadRequestException when not in GROUP_VOTE phase', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(service.voteCard(userId, retroId, cardId)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw NotFoundException when card not found', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(null)

      await expect(service.voteCard(userId, retroId, cardId)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw BadRequestException when vote limit reached', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(mockCard)
      prisma.client.$transaction.mockImplementation((cb) => cb(prisma.client))
      prisma.client.vote.count.mockResolvedValueOnce(5) // userVoteCount >= maxVotesPerUser

      await expect(service.voteCard(userId, retroId, cardId)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('unvoteCard', () => {
    const mockGroupVoteRetro = {
      ...mockRetro,
      phase: 'GROUP_VOTE',
      maxVotesPerUser: 5,
    }

    it('should remove a vote and return updated counts', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.vote.findFirst.mockResolvedValue({
        id: 'vote-1',
        cardId,
        userId,
        retroId,
      })
      prisma.client.vote.delete.mockResolvedValue({})
      prisma.client.vote.count
        .mockResolvedValueOnce(2) // voteCount for card
        .mockResolvedValueOnce(3) // userVoteCount

      const result = await service.unvoteCard(userId, retroId, cardId)

      expect(prisma.client.vote.delete).toHaveBeenCalledWith({
        where: { id: 'vote-1' },
      })
      expect(result).toEqual({
        voteCount: 2,
        remainingVotes: 2,
      })
    })

    it('should throw BadRequestException when not in GROUP_VOTE phase', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(service.unvoteCard(userId, retroId, cardId)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw NotFoundException when no vote exists', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.vote.findFirst.mockResolvedValue(null)

      await expect(service.unvoteCard(userId, retroId, cardId)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('mergeCards', () => {
    const mockGroupVoteRetro = {
      ...mockRetro,
      phase: 'GROUP_VOTE',
      maxVotesPerUser: 5,
    }

    const parentCardId = 'card-parent'
    const childCardIds = ['card-child-1', 'card-child-2']

    const mockParentCard = {
      ...mockCard,
      id: parentCardId,
      parentCardId: null,
    }

    const mockMergedParent = {
      ...mockParentCard,
      children: [
        {
          id: 'card-child-1',
          content: 'Child 1',
          author: mockAuthor,
          _count: { votes: 0 },
        },
        {
          id: 'card-child-2',
          content: 'Child 2',
          author: mockAuthor,
          _count: { votes: 0 },
        },
      ],
    }

    it('should merge child cards into parent', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(mockParentCard)
      prisma.client.card.updateMany.mockResolvedValue({ count: 2 })
      prisma.client.card.findUniqueOrThrow.mockResolvedValue(mockMergedParent)

      const result = await service.mergeCards(
        userId,
        retroId,
        parentCardId,
        childCardIds,
      )

      expect(prisma.client.card.updateMany).toHaveBeenCalledWith({
        where: { id: { in: childCardIds }, retroId, parentCardId: null },
        data: { parentCardId, columnId: mockParentCard.columnId },
      })
      expect(result).toEqual(mockMergedParent)
    })

    it('should throw BadRequestException when not in GROUP_VOTE phase', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.mergeCards(userId, retroId, parentCardId, childCardIds),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when merging card into itself', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.mergeCards(userId, retroId, parentCardId, [parentCardId]),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when parent card not found', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.findFirst.mockResolvedValue(null)

      await expect(
        service.mergeCards(userId, retroId, parentCardId, childCardIds),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('unmergeCard', () => {
    const mockGroupVoteRetro = {
      ...mockRetro,
      phase: 'GROUP_VOTE',
      maxVotesPerUser: 5,
    }

    const mockUnmergedCard = {
      ...mockCard,
      children: [],
    }

    it('should unmerge children from parent card', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.card.updateMany.mockResolvedValue({ count: 2 })
      prisma.client.card.findUniqueOrThrow.mockResolvedValue(mockUnmergedCard)

      const result = await service.unmergeCard(userId, retroId, cardId)

      expect(prisma.client.card.updateMany).toHaveBeenCalledWith({
        where: { parentCardId: cardId, retroId },
        data: { parentCardId: null },
      })
      expect(result).toEqual(mockUnmergedCard)
    })

    it('should throw BadRequestException when not in GROUP_VOTE phase', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)

      await expect(
        service.unmergeCard(userId, retroId, cardId),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('getUserVotes', () => {
    const mockGroupVoteRetro = {
      ...mockRetro,
      phase: 'GROUP_VOTE',
      maxVotesPerUser: 5,
    }

    it('should return voted card IDs and remaining votes', async () => {
      prisma.client.retro.findUnique.mockResolvedValue(mockGroupVoteRetro)
      prisma.client.teamMember.findUnique.mockResolvedValue(mockMembership)
      prisma.client.vote.findMany.mockResolvedValue([
        { cardId: 'card-1' },
        { cardId: 'card-2' },
        { cardId: 'card-3' },
      ])

      const result = await service.getUserVotes(userId, retroId)

      expect(prisma.client.vote.findMany).toHaveBeenCalledWith({
        where: { retroId, userId },
        select: { cardId: true },
      })
      expect(result).toEqual({
        votedCardIds: ['card-1', 'card-2', 'card-3'],
        maxVotes: 5,
        remainingVotes: 2,
      })
    })
  })
})
