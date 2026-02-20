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
import { ActionItemsService } from './action-items.service'
import { CreateActionItemDto } from './dto/create-action-item.dto'
import { UpdateActionItemDto } from './dto/update-action-item.dto'
import { ActionItemResponse } from './dto/action-item-response.dto'

@Controller()
@UseGuards(JwtAuthGuard)
export class ActionItemsController {
  constructor(private readonly actionItemsService: ActionItemsService) {}

  @Post('retros/:retroId/action-items')
  async create(
    @Request() req: { user: { id: string } },
    @Param('retroId') retroId: string,
    @Body() dto: CreateActionItemDto,
  ): Promise<ActionItemResponse> {
    const item = await this.actionItemsService.create(req.user.id, retroId, dto)
    return ActionItemResponse.from(item)
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
    return ActionItemResponse.from(item)
  }

  @Delete('action-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.actionItemsService.remove(req.user.id, id)
  }
}
