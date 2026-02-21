export class RetroUserSummary {
  constructor(
    public id: string,
    public email: string,
    public name: string | null,
  ) {}

  static from(user: any): RetroUserSummary {
    return new RetroUserSummary(user.id, user.email, user.name)
  }
}

export class RetroResponse {
  constructor(
    public id: string,
    public name: string,
    public status: string,
    public phase: string,
    public date: Date,
    public teamId: string,
    public createdAt: Date,
    public createdBy: RetroUserSummary,
  ) {}

  static from(retro: any): RetroResponse {
    return new RetroResponse(
      retro.id,
      retro.name,
      retro.status,
      retro.phase,
      retro.date,
      retro.teamId,
      retro.createdAt,
      RetroUserSummary.from(retro.createdBy),
    )
  }
}

export class RetroWithCountsResponse {
  constructor(
    public id: string,
    public name: string,
    public status: string,
    public phase: string,
    public date: Date,
    public teamId: string,
    public createdAt: Date,
    public createdBy: RetroUserSummary,
    public actionItemCount: number,
  ) {}

  static from(retro: any): RetroWithCountsResponse {
    return new RetroWithCountsResponse(
      retro.id,
      retro.name,
      retro.status,
      retro.phase,
      retro.date,
      retro.teamId,
      retro.createdAt,
      RetroUserSummary.from(retro.createdBy),
      retro._count.actionItems,
    )
  }
}
