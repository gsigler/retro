import { ActionItemResponse } from '../../action-items/dto/action-item-response.dto.js'

export class UpcomingRetroResponse {
  constructor(
    public id: string,
    public name: string,
    public status: string,
    public date: Date,
    public teamId: string,
    public createdAt: Date,
  ) {}

  static from(retro: any): UpcomingRetroResponse {
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

  static from(data: any): DashboardSummaryResponse {
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
