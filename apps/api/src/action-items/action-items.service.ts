import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { ActionItemStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateActionItemDto } from './dto/create-action-item.dto'
import { UpdateActionItemDto } from './dto/update-action-item.dto'

const userSelect = { id: true, name: true, avatarUrl: true }

const VALID_TRANSITIONS: Record<ActionItemStatus, ActionItemStatus[]> = {
  OPEN: [ActionItemStatus.DONE],
  IN_PROGRESS: [ActionItemStatus.DONE],
  DONE: [],
}

@Injectable()
export class ActionItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, retroId: string, dto: CreateActionItemDto) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    return this.prisma.actionItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        retroId,
        createdById: userId,
      },
      include: {
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    })
  }

  async findAllForRetro(userId: string, retroId: string) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    return this.prisma.actionItem.findMany({
      where: { retroId },
      include: {
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(userId: string, actionItemId: string) {
    const item = await this.findActionItemOrThrow(actionItemId)
    const retro = await this.findRetroOrThrow(item.retroId)
    await this.assertTeamMember(userId, retro.teamId)

    return item
  }

  async update(userId: string, actionItemId: string, dto: UpdateActionItemDto) {
    const item = await this.findActionItemOrThrow(actionItemId)
    const retro = await this.findRetroOrThrow(item.retroId)
    await this.assertTeamMember(userId, retro.teamId)

    if (dto.status) {
      this.assertValidStatusTransition(item.status, dto.status)
    }

    return this.prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
      include: {
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    })
  }

  async remove(userId: string, actionItemId: string) {
    const item = await this.findActionItemOrThrow(actionItemId)
    const retro = await this.findRetroOrThrow(item.retroId)

    const isCreator = item.createdById === userId
    const isTeamOwner = await this.isTeamOwner(userId, retro.teamId)

    if (!isCreator && !isTeamOwner) {
      throw new ForbiddenException(
        'Only the creator or team owner can delete this action item',
      )
    }

    await this.prisma.actionItem.delete({ where: { id: actionItemId } })
  }

  private async findActionItemOrThrow(actionItemId: string) {
    const item = await this.prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    })

    if (!item) {
      throw new NotFoundException('Action item not found')
    }

    return item
  }

  private async findRetroOrThrow(retroId: string) {
    const retro = await this.prisma.retro.findUnique({
      where: { id: retroId },
    })

    if (!retro) {
      throw new NotFoundException('Retro not found')
    }

    return retro
  }

  private async assertTeamMember(userId: string, teamId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team')
    }
  }

  private async isTeamOwner(userId: string, teamId: string): Promise<boolean> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    })
    return team?.ownerId === userId
  }

  private assertValidStatusTransition(
    current: ActionItemStatus,
    next: ActionItemStatus,
  ) {
    if (!VALID_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      )
    }
  }
}
