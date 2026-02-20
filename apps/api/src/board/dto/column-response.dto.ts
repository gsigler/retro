import { CardResponse } from './card-response.dto.js'

export class ColumnResponse {
  constructor(
    public id: string,
    public retroId: string,
    public name: string,
    public description: string | null,
    public color: string,
    public position: number,
    public cards: CardResponse[],
  ) {}

  static from(column: any): ColumnResponse {
    return new ColumnResponse(
      column.id,
      column.retroId,
      column.name,
      column.description,
      column.color,
      column.position,
      (column.cards ?? []).map(CardResponse.from),
    )
  }
}
