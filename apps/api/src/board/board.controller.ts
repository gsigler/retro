import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { BoardService } from './board.service'
import { InitBoardDto } from './dto/init-board.dto'
import { CreateCardDto } from './dto/create-card.dto'
import { MoveCardDto } from './dto/move-card.dto'
import { BoardResponse } from './dto/board-response.dto'
import { CardResponse } from './dto/card-response.dto'
import { ColumnResponse } from './dto/column-response.dto'
import { RetroTemplate } from './templates'

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get('retros/:retroId/board/templates')
  getTemplates(): RetroTemplate[] {
    return this.boardService.getTemplates()
  }

  @Get('retros/:retroId/board')
  async getBoard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
  ): Promise<BoardResponse> {
    const columns = await this.boardService.getBoard(req.user.id, retroId)
    return BoardResponse.from(retroId, columns)
  }

  @Post('retros/:retroId/board/init')
  async initBoard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: InitBoardDto,
  ): Promise<BoardResponse> {
    const columns = await this.boardService.initBoard(
      req.user.id,
      retroId,
      dto.templateId,
    )
    return BoardResponse.from(retroId, columns)
  }

  @Post('retros/:retroId/board/cards')
  async createCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: CreateCardDto,
  ): Promise<CardResponse> {
    const card = await this.boardService.createCard(req.user.id, retroId, dto)
    return CardResponse.from(card)
  }

  @Patch('retros/:retroId/board/cards/:cardId/move')
  async moveCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ): Promise<CardResponse> {
    const card = await this.boardService.moveCard(
      req.user.id,
      retroId,
      cardId,
      dto,
    )
    return CardResponse.from(card)
  }

  @Delete('retros/:retroId/board/cards/:cardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Param('cardId') cardId: string,
  ): Promise<void> {
    return this.boardService.deleteCard(req.user.id, retroId, cardId)
  }
}
