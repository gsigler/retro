export class CardAuthorSummary {
  constructor(
    public id: string,
    public name: string | null,
  ) {}

  static from(user: any): CardAuthorSummary {
    return new CardAuthorSummary(user.id, user.name)
  }
}

export class CardResponse {
  constructor(
    public id: string,
    public columnId: string,
    public retroId: string,
    public content: string,
    public position: number,
    public createdAt: Date,
    public updatedAt: Date,
    public author: CardAuthorSummary,
  ) {}

  static from(card: any): CardResponse {
    return new CardResponse(
      card.id,
      card.columnId,
      card.retroId,
      card.content,
      card.position,
      card.createdAt,
      card.updatedAt,
      CardAuthorSummary.from(card.author),
    )
  }
}
