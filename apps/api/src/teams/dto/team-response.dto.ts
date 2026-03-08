interface UserData {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

interface TeamMemberData {
  id: string
  role: string
  joinedAt: Date
  user: UserData
}

interface TeamData {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteCode: string
  createdAt: Date
  updatedAt: Date
}

interface TeamWithCountsData {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: Date
  _count: { members: number; retros: number }
}

interface TeamDetailData extends TeamData {
  members: TeamMemberData[]
  _count: { retros: number }
}

export class UserSummary {
  constructor(
    public id: string,
    public email: string,
    public name: string | null,
    public avatarUrl: string | null,
  ) {}

  static from(user: UserData): UserSummary {
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

  static from(member: TeamMemberData): TeamMemberResponse {
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
    public inviteCode: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static from(team: TeamData): TeamResponse {
    return new TeamResponse(
      team.id,
      team.name,
      team.description,
      team.ownerId,
      team.inviteCode,
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

  static from(team: TeamWithCountsData): TeamWithCountsResponse {
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
    public inviteCode: string,
    public members: TeamMemberResponse[],
    public retroCount: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static from(team: TeamDetailData): TeamDetailResponse {
    return new TeamDetailResponse(
      team.id,
      team.name,
      team.description,
      team.ownerId,
      team.inviteCode,
      team.members.map(TeamMemberResponse.from),
      team._count.retros,
      team.createdAt,
      team.updatedAt,
    )
  }
}
