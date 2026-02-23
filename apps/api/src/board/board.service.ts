import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { RETRO_TEMPLATES } from './templates.js'
import { CreateCardDto } from './dto/create-card.dto.js'
import { MoveCardDto } from './dto/move-card.dto.js'
import { CardResponse } from './dto/card-response.dto.js'

const AUTHOR_SELECT = { id: true, name: true }

const CARD_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  _count: { select: { votes: true } },
  children: {
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  getTemplates() {
    return RETRO_TEMPLATES
  }

  async getBoard(userId: string, retroId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    const isHidden =
      retro.phase === 'ICEBREAKER' || retro.phase === 'RETROSPECT'

    const columns = await this.prisma.client.column.findMany({
      where: { retroId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          where: { parentCardId: null },
          orderBy: { position: 'asc' },
          include: CARD_INCLUDE,
        },
      },
    })

    if (!isHidden) return columns

    return columns.map((col) => ({
      ...col,
      cards: col.cards.map((card: any) =>
        card.authorId === userId ? card : CardResponse.hidden(card),
      ),
    }))
  }

  async getAllCards(userId: string, retroId: string) {
    await this.assertRetroAccess(userId, retroId)

    return this.prisma.client.column.findMany({
      where: { retroId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          where: { parentCardId: null },
          orderBy: { position: 'asc' },
          include: CARD_INCLUDE,
        },
      },
    })
  }

  async initBoard(userId: string, retroId: string, templateId: string) {
    await this.assertRetroAccess(userId, retroId)

    const template = RETRO_TEMPLATES.find((t) => t.id === templateId)
    if (!template) {
      throw new BadRequestException(`Unknown template: ${templateId}`)
    }

    const existing = await this.prisma.client.column.findFirst({
      where: { retroId },
    })
    if (existing) {
      throw new BadRequestException('Board is already initialized')
    }

    await this.prisma.client.column.createMany({
      data: template.columns.map((col) => ({
        retroId,
        name: col.name,
        description: col.description,
        color: col.color,
        position: col.position,
      })),
    })

    return this.prisma.client.column.findMany({
      where: { retroId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: CARD_INCLUDE,
        },
      },
    })
  }

  async createCard(userId: string, retroId: string, dto: CreateCardDto) {
    const retro = await this.assertRetroAccess(userId, retroId)

    const column = await this.prisma.client.column.findFirst({
      where: { id: dto.columnId, retroId },
    })
    if (!column) {
      throw new NotFoundException('Column not found in this retro')
    }

    const maxPosition = await this.prisma.client.card.aggregate({
      where: { columnId: dto.columnId },
      _max: { position: true },
    })

    const card = await this.prisma.client.card.create({
      data: {
        columnId: dto.columnId,
        retroId,
        authorId: userId,
        content: dto.content,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: CARD_INCLUDE,
    })

    return { card, phase: retro.phase }
  }

  async moveCard(
    userId: string,
    retroId: string,
    cardId: string,
    dto: MoveCardDto,
  ) {
    await this.assertRetroAccess(userId, retroId)

    const card = await this.prisma.client.card.findFirst({
      where: { id: cardId, retroId },
    })
    if (!card) {
      throw new NotFoundException('Card not found')
    }

    const column = await this.prisma.client.column.findFirst({
      where: { id: dto.columnId, retroId },
    })
    if (!column) {
      throw new NotFoundException('Target column not found in this retro')
    }

    const updatedCard = await this.prisma.client.card.update({
      where: { id: cardId },
      data: {
        columnId: dto.columnId,
        position: dto.position,
      },
      include: CARD_INCLUDE,
    })

    return updatedCard
  }

  async deleteCard(userId: string, retroId: string, cardId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    const card = await this.prisma.client.card.findFirst({
      where: { id: cardId, retroId },
    })
    if (!card) {
      throw new NotFoundException('Card not found')
    }

    if (card.authorId !== userId && retro.createdById !== userId) {
      throw new ForbiddenException(
        'Only the card author or facilitator can delete this card',
      )
    }

    await this.prisma.client.card.delete({ where: { id: cardId } })
  }

  async mergeCards(
    userId: string,
    retroId: string,
    parentCardId: string,
    childCardIds: string[],
  ) {
    const retro = await this.assertRetroAccess(userId, retroId)

    if (retro.phase !== 'GROUP_VOTE') {
      throw new BadRequestException('Merging is only allowed during GROUP_VOTE')
    }

    if (childCardIds.includes(parentCardId)) {
      throw new BadRequestException('Cannot merge a card into itself')
    }

    const parentCard = await this.prisma.client.card.findFirst({
      where: { id: parentCardId, retroId, parentCardId: null },
    })
    if (!parentCard) {
      throw new NotFoundException('Parent card not found or is already a child')
    }

    await this.prisma.client.card.updateMany({
      where: { id: { in: childCardIds }, retroId, parentCardId: null },
      data: { parentCardId, columnId: parentCard.columnId },
    })

    return this.prisma.client.card.findUniqueOrThrow({
      where: { id: parentCardId },
      include: CARD_INCLUDE,
    })
  }

  async unmergeCard(userId: string, retroId: string, cardId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    if (retro.phase !== 'GROUP_VOTE') {
      throw new BadRequestException(
        'Unmerging is only allowed during GROUP_VOTE',
      )
    }

    await this.prisma.client.card.updateMany({
      where: { parentCardId: cardId, retroId },
      data: { parentCardId: null },
    })

    return this.prisma.client.card.findUniqueOrThrow({
      where: { id: cardId },
      include: CARD_INCLUDE,
    })
  }

  async voteCard(userId: string, retroId: string, cardId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    if (retro.phase !== 'GROUP_VOTE') {
      throw new BadRequestException('Voting is only allowed during GROUP_VOTE')
    }

    const card = await this.prisma.client.card.findFirst({
      where: { id: cardId, retroId },
    })
    if (!card) {
      throw new NotFoundException('Card not found')
    }

    return this.prisma.client.$transaction(async (tx) => {
      const userVoteCount = await tx.vote.count({
        where: { retroId, userId },
      })
      if (userVoteCount >= retro.maxVotesPerUser) {
        throw new BadRequestException(
          `You have used all ${retro.maxVotesPerUser} votes`,
        )
      }

      const vote = await tx.vote.create({
        data: { cardId, userId, retroId },
      })

      const voteCount = await tx.vote.count({
        where: { cardId },
      })

      return {
        vote,
        voteCount,
        remainingVotes: retro.maxVotesPerUser - userVoteCount - 1,
      }
    })
  }

  async unvoteCard(userId: string, retroId: string, cardId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    if (retro.phase !== 'GROUP_VOTE') {
      throw new BadRequestException(
        'Unvoting is only allowed during GROUP_VOTE',
      )
    }

    const vote = await this.prisma.client.vote.findFirst({
      where: { cardId, userId, retroId },
    })
    if (!vote) {
      throw new NotFoundException('No vote to remove')
    }

    await this.prisma.client.vote.delete({ where: { id: vote.id } })

    const voteCount = await this.prisma.client.vote.count({
      where: { cardId },
    })

    const userVoteCount = await this.prisma.client.vote.count({
      where: { retroId, userId },
    })

    return { voteCount, remainingVotes: retro.maxVotesPerUser - userVoteCount }
  }

  async getUserVotes(userId: string, retroId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    const votes = await this.prisma.client.vote.findMany({
      where: { retroId, userId },
      select: { cardId: true },
    })

    return {
      votedCardIds: votes.map((v) => v.cardId),
      maxVotes: retro.maxVotesPerUser,
      remainingVotes: retro.maxVotesPerUser - votes.length,
    }
  }

  private async assertRetroAccess(userId: string, retroId: string) {
    const retro = await this.prisma.client.retro.findUnique({
      where: { id: retroId },
    })

    if (!retro) {
      throw new NotFoundException('Retro not found')
    }

    const membership = await this.prisma.client.teamMember.findUnique({
      where: { teamId_userId: { teamId: retro.teamId, userId } },
    })

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team')
    }

    return retro
  }
}
