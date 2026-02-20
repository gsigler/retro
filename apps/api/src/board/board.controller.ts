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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { BoardService } from './board.service.js'
import { BoardGateway } from './board.gateway.js'
import { InitBoardDto } from './dto/init-board.dto.js'
import { CreateCardDto } from './dto/create-card.dto.js'
import { MoveCardDto } from './dto/move-card.dto.js'
import { BoardResponse } from './dto/board-response.dto.js'
import { CardResponse } from './dto/card-response.dto.js'
import { RetroTemplate } from './templates.js'

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly boardGateway: BoardGateway,
  ) {}

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
    const response = BoardResponse.from(retroId, columns)
    this.boardGateway.emitBoardInitialized(retroId, response.columns)
    return response
  }

  @Post('retros/:retroId/board/cards')
  async createCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: CreateCardDto,
  ): Promise<CardResponse> {
    const card = await this.boardService.createCard(req.user.id, retroId, dto)
    const response = CardResponse.from(card)
    this.boardGateway.emitCardCreated(retroId, response)
    return response
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
    const response = CardResponse.from(card)
    this.boardGateway.emitCardMoved(retroId, response)
    return response
  }

  @Delete('retros/:retroId/board/cards/:cardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Param('cardId') cardId: string,
  ): Promise<void> {
    await this.boardService.deleteCard(req.user.id, retroId, cardId)
    this.boardGateway.emitCardDeleted(retroId, cardId)
  }
}
