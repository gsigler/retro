export class VoteResponse {
  constructor(
    public voteCount: number,
    public remainingVotes: number,
  ) {}

  static from(data: {
    voteCount: number
    remainingVotes: number
  }): VoteResponse {
    return new VoteResponse(data.voteCount, data.remainingVotes)
  }
}

export class UserVotesResponse {
  constructor(
    public votedCardIds: string[],
    public maxVotes: number,
    public remainingVotes: number,
  ) {}

  static from(data: {
    votedCardIds: string[]
    maxVotes: number
    remainingVotes: number
  }): UserVotesResponse {
    return new UserVotesResponse(
      data.votedCardIds,
      data.maxVotes,
      data.remainingVotes,
    )
  }
}
