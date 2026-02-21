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
import { RetrosService } from './retros.service.js'
import { BoardGateway } from '../board/board.gateway.js'
import { CreateRetroDto } from './dto/create-retro.dto.js'
import { UpdateRetroDto } from './dto/update-retro.dto.js'
import { UpdatePhaseDto } from './dto/update-phase.dto.js'
import {
  RetroResponse,
  RetroWithCountsResponse,
} from './dto/retro-response.dto.js'

@Controller()
@UseGuards(JwtAuthGuard)
export class RetrosController {
  constructor(
    private readonly retrosService: RetrosService,
    private readonly boardGateway: BoardGateway,
  ) {}

  @Post('teams/:teamId/retros')
  async create(
    @Request() req: { user: { id: string } },
    @Param('teamId') teamId: string,
    @Body() dto: CreateRetroDto,
  ): Promise<RetroResponse> {
    const retro = await this.retrosService.create(req.user.id, teamId, dto)
    return RetroResponse.from(retro)
  }

  @Get('teams/:teamId/retros')
  async findAll(
    @Request() req: { user: { id: string } },
    @Param('teamId') teamId: string,
  ): Promise<RetroWithCountsResponse[]> {
    const retros = await this.retrosService.findAll(req.user.id, teamId)
    return retros.map(RetroWithCountsResponse.from)
  }

  @Get('retros/:id')
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<RetroWithCountsResponse> {
    const retro = await this.retrosService.findOne(req.user.id, id)
    return RetroWithCountsResponse.from(retro)
  }

  @Patch('retros/:id')
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateRetroDto,
  ): Promise<RetroWithCountsResponse> {
    const retro = await this.retrosService.update(req.user.id, id, dto)
    return RetroWithCountsResponse.from(retro)
  }

  @Patch('retros/:id/phase')
  async updatePhase(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePhaseDto,
  ): Promise<RetroWithCountsResponse> {
    const retro = await this.retrosService.updatePhase(
      req.user.id,
      id,
      dto.phase,
    )
    this.boardGateway.emitPhaseChanged(id, dto.phase)
    return RetroWithCountsResponse.from(retro)
  }

  @Delete('retros/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.retrosService.remove(req.user.id, id)
  }
}
