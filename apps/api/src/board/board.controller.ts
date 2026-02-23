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
import { MergeCardsDto } from './dto/merge-cards.dto.js'
import { BoardResponse } from './dto/board-response.dto.js'
import { CardResponse } from './dto/card-response.dto.js'
import { VoteResponse, UserVotesResponse } from './dto/vote-response.dto.js'
import { RetroTemplate } from './templates.js'

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly boardGateway: BoardGateway,
  ) {}

  @Get('board/templates')
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
    const { card, phase } = await this.boardService.createCard(
      req.user.id,
      retroId,
      dto,
    )
    const response = CardResponse.from(card)

    if (phase === 'RETROSPECT' || phase === 'ICEBREAKER') {
      const hiddenResponse = CardResponse.hidden(card)
      this.boardGateway.emitCardCreatedHidden(
        retroId,
        req.user.id,
        response,
        hiddenResponse,
      )
    } else {
      this.boardGateway.emitCardCreated(retroId, response)
    }

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

  @Post('retros/:retroId/board/cards/:cardId/vote')
  async voteCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Param('cardId') cardId: string,
  ): Promise<VoteResponse> {
    const result = await this.boardService.voteCard(
      req.user.id,
      retroId,
      cardId,
    )
    this.boardGateway.emitCardVoted(retroId, {
      cardId,
      voteCount: result.voteCount,
      userId: req.user.id,
    })
    return VoteResponse.from(result)
  }

  @Delete('retros/:retroId/board/cards/:cardId/vote')
  async unvoteCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Param('cardId') cardId: string,
  ): Promise<VoteResponse> {
    const result = await this.boardService.unvoteCard(
      req.user.id,
      retroId,
      cardId,
    )
    this.boardGateway.emitCardUnvoted(retroId, {
      cardId,
      voteCount: result.voteCount,
      userId: req.user.id,
    })
    return VoteResponse.from(result)
  }

  @Get('retros/:retroId/board/votes')
  async getUserVotes(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
  ): Promise<UserVotesResponse> {
    const result = await this.boardService.getUserVotes(req.user.id, retroId)
    return UserVotesResponse.from(result)
  }

  @Post('retros/:retroId/board/cards/merge')
  async mergeCards(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: MergeCardsDto,
  ): Promise<CardResponse> {
    const card = await this.boardService.mergeCards(
      req.user.id,
      retroId,
      dto.parentCardId,
      dto.childCardIds,
    )
    const response = CardResponse.from(card)
    this.boardGateway.emitCardsMerged(retroId, {
      parentCard: response,
      childCardIds: dto.childCardIds,
    })
    return response
  }

  @Post('retros/:retroId/board/cards/:cardId/unmerge')
  async unmergeCard(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Param('cardId') cardId: string,
  ): Promise<CardResponse> {
    const card = await this.boardService.unmergeCard(
      req.user.id,
      retroId,
      cardId,
    )
    const response = CardResponse.from(card)
    this.boardGateway.emitCardsUnmerged(retroId, response)
    return response
  }
}
