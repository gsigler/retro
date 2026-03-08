interface CardAuthorData {
  id: string
  name: string | null
}

interface CardData {
  id: string
  columnId: string
  retroId: string
  content: string
  position: number
  createdAt: Date
  updatedAt: Date
  author: CardAuthorData
  authorId?: string
  _count?: { votes: number }
  parentCardId?: string | null
  children?: CardData[]
}

export class CardAuthorSummary {
  constructor(
    public id: string,
    public name: string | null,
  ) {}

  static from(user: CardAuthorData): CardAuthorSummary {
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
    public voteCount: number,
    public parentCardId: string | null,
    public children: CardResponse[],
  ) {}

  static from(card: CardData): CardResponse {
    return new CardResponse(
      card.id,
      card.columnId,
      card.retroId,
      card.content,
      card.position,
      card.createdAt,
      card.updatedAt,
      CardAuthorSummary.from(card.author),
      card._count?.votes ?? 0,
      card.parentCardId ?? null,
      (card.children ?? []).map(CardResponse.from),
    )
  }

  static hidden(card: CardData): CardResponse {
    return new CardResponse(
      card.id,
      card.columnId,
      card.retroId,
      '',
      card.position,
      card.createdAt,
      card.updatedAt,
      new CardAuthorSummary('anonymous', null),
      0,
      card.parentCardId ?? null,
      [],
    )
  }
}
