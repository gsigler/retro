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
import { ActionItemsService } from './action-items.service.js'
import { BoardGateway } from '../board/board.gateway.js'
import { CreateActionItemDto } from './dto/create-action-item.dto.js'
import { UpdateActionItemDto } from './dto/update-action-item.dto.js'
import { ReorderActionItemsDto } from './dto/reorder-action-items.dto.js'
import {
  ActionItemResponse,
  ActionItemUserSummary,
} from './dto/action-item-response.dto.js'

@Controller()
@UseGuards(JwtAuthGuard)
export class ActionItemsController {
  constructor(
    private readonly actionItemsService: ActionItemsService,
    private readonly boardGateway: BoardGateway,
  ) {}

  @Post('retros/:retroId/action-items')
  async create(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: CreateActionItemDto,
  ): Promise<ActionItemResponse> {
    const item = await this.actionItemsService.create(req.user.id, retroId, dto)
    const response = ActionItemResponse.from(item)
    this.boardGateway.emitActionItemCreated(retroId, response)
    return response
  }

  @Get('retros/:retroId/action-items')
  async findAll(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
  ): Promise<ActionItemResponse[]> {
    const items = await this.actionItemsService.findAllForRetro(
      req.user.id,
      retroId,
    )
    return items.map(ActionItemResponse.from)
  }

  @Get('retros/:retroId/members')
  async findMembers(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
  ): Promise<ActionItemUserSummary[]> {
    const members = await this.actionItemsService.findMembersForRetro(
      req.user.id,
      retroId,
    )
    return members.map(ActionItemUserSummary.from)
  }

  @Patch('retros/:retroId/action-items/reorder')
  async reorder(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: ReorderActionItemsDto,
  ): Promise<ActionItemResponse[]> {
    const items = await this.actionItemsService.reorder(
      req.user.id,
      retroId,
      dto.orderedIds,
    )
    const response = items.map(ActionItemResponse.from)
    this.boardGateway.emitActionItemsReordered(retroId, response)
    return response
  }

  @Get('action-items/:id')
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<ActionItemResponse> {
    const item = await this.actionItemsService.findOne(req.user.id, id)
    return ActionItemResponse.from(item)
  }

  @Patch('action-items/:id')
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateActionItemDto,
  ): Promise<ActionItemResponse> {
    const item = await this.actionItemsService.update(req.user.id, id, dto)
    const response = ActionItemResponse.from(item)
    this.boardGateway.emitActionItemUpdated(item.retroId, response)
    return response
  }

  @Delete('action-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<void> {
    const item = await this.actionItemsService.findOne(req.user.id, id)
    await this.actionItemsService.remove(req.user.id, id)
    this.boardGateway.emitActionItemDeleted(item.retroId, id)
  }
}
