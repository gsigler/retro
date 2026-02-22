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

const AUTHOR_SELECT = { id: true, name: true }

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  getTemplates() {
    return RETRO_TEMPLATES
  }

  async getBoard(userId: string, retroId: string) {
    const retro = await this.assertRetroAccess(userId, retroId)

    const isRevealed =
      retro.phase === 'GROUP_VOTE' || retro.phase === 'DISCUSS_ACTION'

    return this.prisma.client.column.findMany({
      where: { retroId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          where: isRevealed ? undefined : { authorId: userId },
          orderBy: { position: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    })
  }

  async getAllCards(userId: string, retroId: string) {
    await this.assertRetroAccess(userId, retroId)

    return this.prisma.client.column.findMany({
      where: { retroId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
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
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    })
  }

  async createCard(userId: string, retroId: string, dto: CreateCardDto) {
    await this.assertRetroAccess(userId, retroId)

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
      include: { author: { select: AUTHOR_SELECT } },
    })

    return card
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
      include: { author: { select: AUTHOR_SELECT } },
    })

    return updatedCard
  }

  async deleteCard(userId: string, retroId: string, cardId: string) {
    await this.assertRetroAccess(userId, retroId)

    const card = await this.prisma.client.card.findFirst({
      where: { id: cardId, retroId },
    })
    if (!card) {
      throw new NotFoundException('Card not found')
    }

    await this.prisma.client.card.delete({ where: { id: cardId } })
  }

  async getRetroPhase(retroId: string): Promise<string> {
    const retro = await this.prisma.client.retro.findUnique({
      where: { id: retroId },
      select: { phase: true },
    })
    if (!retro) {
      throw new NotFoundException('Retro not found')
    }
    return retro.phase
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
