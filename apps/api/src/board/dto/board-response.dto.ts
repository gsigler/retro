import { ColumnResponse } from './column-response.dto.js'

export class BoardResponse {
  constructor(
    public retroId: string,
    public columns: ColumnResponse[],
  ) {}

  static from(
    retroId: string,
    columns: Parameters<typeof ColumnResponse.from>[0][],
  ): BoardResponse {
    return new BoardResponse(retroId, columns.map(ColumnResponse.from))
  }
}
