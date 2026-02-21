import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateActionItemDto } from './dto/create-action-item.dto.js'
import { UpdateActionItemDto } from './dto/update-action-item.dto.js'

export const ActionItemStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const

export type ActionItemStatus =
  (typeof ActionItemStatus)[keyof typeof ActionItemStatus]

const userSelect = { id: true, name: true, avatarUrl: true }

const VALID_TRANSITIONS: Record<ActionItemStatus, ActionItemStatus[]> = {
  OPEN: [ActionItemStatus.DONE],
  IN_PROGRESS: [ActionItemStatus.DONE],
  DONE: [ActionItemStatus.OPEN],
}

@Injectable()
export class ActionItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, retroId: string, dto: CreateActionItemDto) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    const count = await this.prisma.client.actionItem.count({
      where: { retroId },
    })

    return this.prisma.client.actionItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        retroId,
        createdById: userId,
        position: count,
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

    return this.prisma.client.actionItem.findMany({
      where: { retroId },
      include: {
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
      orderBy: { position: 'asc' },
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

    return this.prisma.client.actionItem.update({
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

  async reorder(userId: string, retroId: string, orderedIds: string[]) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    await this.prisma.client.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.client.actionItem.update({
          where: { id },
          data: { position: index },
        }),
      ),
    )

    return this.findAllForRetro(userId, retroId)
  }

  async findMembersForRetro(userId: string, retroId: string) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    const members = await this.prisma.client.teamMember.findMany({
      where: { teamId: retro.teamId },
      select: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return members.map((m) => m.user)
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

    await this.prisma.client.actionItem.delete({ where: { id: actionItemId } })
  }

  private async findActionItemOrThrow(actionItemId: string) {
    const item = await this.prisma.client.actionItem.findUnique({
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
    const retro = await this.prisma.client.retro.findUnique({
      where: { id: retroId },
    })

    if (!retro) {
      throw new NotFoundException('Retro not found')
    }

    return retro
  }

  private async assertTeamMember(userId: string, teamId: string) {
    const membership = await this.prisma.client.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team')
    }
  }

  private async isTeamOwner(userId: string, teamId: string): Promise<boolean> {
    const team = await this.prisma.client.team.findUnique({
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
