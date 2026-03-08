import { ActionItemResponse } from '../../action-items/dto/action-item-response.dto.js'

interface UpcomingRetroData {
  id: string
  name: string
  status: string
  date: Date
  teamId: string
  createdAt: Date
}

interface DashboardSummaryData {
  memberCount: number
  retroCount: number
  openActionItemCount: number
  completedActionItemCount: number
  upcomingRetros: UpcomingRetroData[]
  recentActionItems: Parameters<typeof ActionItemResponse.from>[0][]
}

export class UpcomingRetroResponse {
  constructor(
    public id: string,
    public name: string,
    public status: string,
    public date: Date,
    public teamId: string,
    public createdAt: Date,
  ) {}

  static from(retro: UpcomingRetroData): UpcomingRetroResponse {
    return new UpcomingRetroResponse(
      retro.id,
      retro.name,
      retro.status,
      retro.date,
      retro.teamId,
      retro.createdAt,
    )
  }
}

export class DashboardSummaryResponse {
  constructor(
    public memberCount: number,
    public retroCount: number,
    public openActionItemCount: number,
    public completedActionItemCount: number,
    public upcomingRetros: UpcomingRetroResponse[],
    public recentActionItems: ActionItemResponse[],
  ) {}

  static from(data: DashboardSummaryData): DashboardSummaryResponse {
    return new DashboardSummaryResponse(
      data.memberCount,
      data.retroCount,
      data.openActionItemCount,
      data.completedActionItemCount,
      data.upcomingRetros.map(UpcomingRetroResponse.from),
      data.recentActionItems.map(ActionItemResponse.from),
    )
  }
}
