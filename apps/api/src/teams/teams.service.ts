import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateTeamDto } from './dto/create-team.dto.js'
import { UpdateTeamDto } from './dto/update-team.dto.js'

export const NANOID = 'NANOID'
export type NanoidFn = (size?: number) => string

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NANOID) private readonly nanoid: NanoidFn,
  ) {}

  async create(userId: string, dto: CreateTeamDto) {
    try {
      return await this.prisma.client.team.create({
        data: {
          name: dto.name,
          description: dto.description,
          ownerId: userId,
          inviteCode: this.nanoid(10),
          members: {
            create: { userId, role: 'OWNER' },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      })
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as any).code === 'P2002'
      ) {
        throw new ConflictException('You already own a team')
      }
      throw error
    }
  }

  async joinByInviteCode(userId: string, inviteCode: string) {
    const team = await this.prisma.client.team.findUnique({
      where: { inviteCode },
    })

    if (!team) {
      throw new NotFoundException('Invalid invite code')
    }

    try {
      return await this.prisma.client.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: 'MEMBER',
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      })
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as any).code === 'P2002'
      ) {
        throw new ConflictException('You are already a member of this team')
      }
      throw error
    }
  }

  async findAll(userId: string) {
    return this.prisma.client.team.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true, retros: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(userId: string, teamId: string) {
    const team = await this.prisma.client.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { retros: true } },
      },
    })

    if (!team) {
      throw new NotFoundException('Team not found')
    }

    this.assertMember(userId, team.members)

    return team
  }

  async update(userId: string, teamId: string, dto: UpdateTeamDto) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    return this.prisma.client.team.update({
      where: { id: teamId },
      data: dto,
    })
  }

  async remove(userId: string, teamId: string) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    await this.prisma.client.team.delete({ where: { id: teamId } })
  }

  async addMember(userId: string, teamId: string, email: string) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    const userToAdd = await this.prisma.client.user.findUnique({
      where: { email },
    })

    if (!userToAdd) {
      throw new NotFoundException('User not found')
    }

    try {
      return await this.prisma.client.teamMember.create({
        data: {
          teamId,
          userId: userToAdd.id,
          role: 'MEMBER',
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      })
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as any).code === 'P2002'
      ) {
        throw new ConflictException('User is already a member of this team')
      }
      throw error
    }
  }

  async removeMember(userId: string, teamId: string, memberUserId: string) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    const membership = await this.prisma.client.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberUserId } },
    })

    if (!membership) {
      throw new NotFoundException('Member not found')
    }

    if (memberUserId === team.ownerId) {
      throw new ForbiddenException('Cannot remove the team owner')
    }

    await this.prisma.client.teamMember.delete({
      where: { id: membership.id },
    })
  }

  private async findTeamOrThrow(teamId: string) {
    const team = await this.prisma.client.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      throw new NotFoundException('Team not found')
    }

    return team
  }

  private assertOwner(userId: string, ownerId: string) {
    if (userId !== ownerId) {
      throw new ForbiddenException(
        'Only the team owner can perform this action',
      )
    }
  }

  private assertMember(userId: string, members: { userId: string }[]) {
    if (!members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('You are not a member of this team')
    }
  }
}
