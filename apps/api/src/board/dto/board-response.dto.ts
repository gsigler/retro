import { ColumnResponse } from './column-response.dto.js'

export class BoardResponse {
  constructor(
    public retroId: string,
    public columns: ColumnResponse[],
  ) {}

  static from(retroId: string, columns: any[]): BoardResponse {
    return new BoardResponse(retroId, columns.map(ColumnResponse.from))
  }

  static fromAnonymous(retroId: string, columns: any[]): BoardResponse {
    return new BoardResponse(retroId, columns.map(ColumnResponse.fromAnonymous))
  }
}
