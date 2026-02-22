import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { BoardService } from '../board/board.service.js'
import { CreateRetroDto } from './dto/create-retro.dto.js'
import { UpdateRetroDto } from './dto/update-retro.dto.js'

export const RetroStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

export type RetroStatus = (typeof RetroStatus)[keyof typeof RetroStatus]

const STATUS_ORDER: Record<RetroStatus, number> = {
  SCHEDULED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
}

export const RetroPhase = {
  ICEBREAKER: 'ICEBREAKER',
  RETROSPECT: 'RETROSPECT',
  GROUP_VOTE: 'GROUP_VOTE',
  DISCUSS_ACTION: 'DISCUSS_ACTION',
} as const

export type RetroPhase = (typeof RetroPhase)[keyof typeof RetroPhase]

const PHASE_ORDER: Record<RetroPhase, number> = {
  ICEBREAKER: 0,
  RETROSPECT: 1,
  GROUP_VOTE: 2,
  DISCUSS_ACTION: 3,
}

@Injectable()
export class RetrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
  ) {}

  async create(userId: string, teamId: string, dto: CreateRetroDto) {
    await this.assertTeamMember(userId, teamId)

    const retro = await this.prisma.client.retro.create({
      data: {
        name: dto.name,
        date: new Date(dto.date),
        status: dto.status,
        teamId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    })

    if (dto.templateId) {
      await this.boardService.initBoard(userId, retro.id, dto.templateId)
    }

    return retro
  }

  async findAll(userId: string, teamId: string) {
    await this.assertTeamMember(userId, teamId)

    return this.prisma.client.retro.findMany({
      where: { teamId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { actionItems: true } },
      },
      orderBy: { date: 'desc' },
    })
  }

  async findOne(userId: string, retroId: string) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    return retro
  }

  async update(userId: string, retroId: string, dto: UpdateRetroDto) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamMember(userId, retro.teamId)

    if (dto.status) {
      this.assertValidStatusTransition(retro.status, dto.status)
    }

    return this.prisma.client.retro.update({
      where: { id: retroId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { actionItems: true } },
      },
    })
  }

  async updatePhase(userId: string, retroId: string, phase: RetroPhase) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertFacilitator(userId, retro)

    const currentOrder = PHASE_ORDER[retro.phase as RetroPhase]
    const nextOrder = PHASE_ORDER[phase]
    const diff = nextOrder - currentOrder

    if (diff === 0) {
      throw new BadRequestException('Already in this phase')
    }

    if (diff < -1) {
      throw new BadRequestException(
        'Cannot go back more than one phase at a time',
      )
    }

    return this.prisma.client.retro.update({
      where: { id: retroId },
      data: { phase },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { actionItems: true } },
      },
    })
  }

  async remove(userId: string, retroId: string) {
    const retro = await this.findRetroOrThrow(retroId)
    await this.assertTeamOwner(userId, retro.teamId)

    await this.prisma.client.retro.delete({ where: { id: retroId } })
  }

  private async findRetroOrThrow(retroId: string) {
    const retro = await this.prisma.client.retro.findUnique({
      where: { id: retroId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { actionItems: true } },
      },
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

  private async assertFacilitator(
    userId: string,
    retro: { createdById: string; teamId: string },
  ) {
    if (retro.createdById === userId) {
      return
    }
    await this.assertTeamOwner(userId, retro.teamId)
  }

  private async assertTeamOwner(userId: string, teamId: string) {
    const team = await this.prisma.client.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      throw new NotFoundException('Team not found')
    }

    if (team.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the team owner can perform this action',
      )
    }
  }

  private assertValidStatusTransition(current: RetroStatus, next: RetroStatus) {
    if (STATUS_ORDER[next] <= STATUS_ORDER[current]) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      )
    }
  }
}
