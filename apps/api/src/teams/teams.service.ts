import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTeamDto } from './dto/create-team.dto'
import { UpdateTeamDto } from './dto/update-team.dto'

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: { members: { include: { user: true } } },
    })
  }

  async findAll(userId: string) {
    return this.prisma.team.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true, retros: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
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

    return this.prisma.team.update({
      where: { id: teamId },
      data: dto,
    })
  }

  async remove(userId: string, teamId: string) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    await this.prisma.team.delete({ where: { id: teamId } })
  }

  async addMember(userId: string, teamId: string, email: string) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    const userToAdd = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!userToAdd) {
      throw new NotFoundException('User not found')
    }

    return this.prisma.teamMember.create({
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
  }

  async removeMember(userId: string, teamId: string, memberUserId: string) {
    const team = await this.findTeamOrThrow(teamId)
    this.assertOwner(userId, team.ownerId)

    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberUserId } },
    })

    if (!membership) {
      throw new NotFoundException('Member not found')
    }

    if (memberUserId === team.ownerId) {
      throw new ForbiddenException('Cannot remove the team owner')
    }

    await this.prisma.teamMember.delete({
      where: { id: membership.id },
    })
  }

  private async findTeamOrThrow(teamId: string) {
    const team = await this.prisma.team.findUnique({
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
