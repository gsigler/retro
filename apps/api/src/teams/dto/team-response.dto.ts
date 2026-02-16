export class UserSummary {
  constructor(
    public id: string,
    public email: string,
    public name: string | null,
    public avatarUrl: string | null,
  ) {}

   
  static from(user: any): UserSummary {
    return new UserSummary(user.id, user.email, user.name, user.avatarUrl)
  }
}

export class TeamMemberResponse {
  constructor(
    public id: string,
    public role: string,
    public joinedAt: Date,
    public user: UserSummary,
  ) {}

   
  static from(member: any): TeamMemberResponse {
    return new TeamMemberResponse(
      member.id,
      member.role,
      member.joinedAt,
      UserSummary.from(member.user),
    )
  }
}

export class TeamResponse {
  constructor(
    public id: string,
    public name: string,
    public description: string | null,
    public ownerId: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

   
  static from(team: any): TeamResponse {
    return new TeamResponse(
      team.id,
      team.name,
      team.description,
      team.ownerId,
      team.createdAt,
      team.updatedAt,
    )
  }
}

export class TeamWithCountsResponse {
  constructor(
    public id: string,
    public name: string,
    public description: string | null,
    public ownerId: string,
    public memberCount: number,
    public retroCount: number,
    public createdAt: Date,
  ) {}

   
  static from(team: any): TeamWithCountsResponse {
    return new TeamWithCountsResponse(
      team.id,
      team.name,
      team.description,
      team.ownerId,
      team._count.members,
      team._count.retros,
      team.createdAt,
    )
  }
}

export class TeamDetailResponse {
  constructor(
    public id: string,
    public name: string,
    public description: string | null,
    public ownerId: string,
    public members: TeamMemberResponse[],
    public retroCount: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

   
  static from(team: any): TeamDetailResponse {
    return new TeamDetailResponse(
      team.id,
      team.name,
      team.description,
      team.ownerId,
      team.members.map(TeamMemberResponse.from),
      team._count.retros,
      team.createdAt,
      team.updatedAt,
    )
  }
}
