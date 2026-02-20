import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const userSelect = { id: true, name: true, avatarUrl: true }

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const teamIds = await this.getUserTeamIds(userId)

    const [
      memberCount,
      retroCount,
      openActionItemCount,
      completedActionItemCount,
      upcomingRetros,
      recentActionItems,
    ] = await Promise.all([
      this.getMemberCount(userId),
      this.prisma.retro.count({ where: { teamId: { in: teamIds } } }),
      this.prisma.actionItem.count({
        where: {
          retro: { teamId: { in: teamIds } },
          status: 'OPEN',
        },
      }),
      this.prisma.actionItem.count({
        where: {
          retro: { teamId: { in: teamIds } },
          status: 'DONE',
        },
      }),
      this.prisma.retro.findMany({
        where: { teamId: { in: teamIds }, status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      this.prisma.actionItem.findMany({
        where: {
          retro: { teamId: { in: teamIds } },
          status: { not: 'DONE' },
        },
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      memberCount,
      retroCount,
      openActionItemCount,
      completedActionItemCount,
      upcomingRetros,
      recentActionItems,
    }
  }

  private async getUserTeamIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    })
    return memberships.map((m) => m.teamId)
  }

  private async getMemberCount(userId: string): Promise<number> {
    const ownedTeam = await this.prisma.team.findUnique({
      where: { ownerId: userId },
      include: { _count: { select: { members: true } } },
    })
    return ownedTeam?._count.members ?? 0
  }
}
