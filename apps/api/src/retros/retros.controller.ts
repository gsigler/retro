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
import { RetrosService } from './retros.service'
import { CreateRetroDto } from './dto/create-retro.dto'
import { UpdateRetroDto } from './dto/update-retro.dto'

@Controller()
@UseGuards(JwtAuthGuard)
export class RetrosController {
  constructor(private readonly retrosService: RetrosService) {}

  @Post('teams/:teamId/retros')
  create(
    @Request() req: { user: { id: string } },
    @Param('teamId') teamId: string,
    @Body() dto: CreateRetroDto,
  ) {
    return this.retrosService.create(req.user.id, teamId, dto)
  }

  @Get('teams/:teamId/retros')
  findAll(
    @Request() req: { user: { id: string } },
    @Param('teamId') teamId: string,
  ) {
    return this.retrosService.findAll(req.user.id, teamId)
  }

  @Get('retros/:id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.retrosService.findOne(req.user.id, id)
  }

  @Patch('retros/:id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateRetroDto,
  ) {
    return this.retrosService.update(req.user.id, id, dto)
  }

  @Delete('retros/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.retrosService.remove(req.user.id, id)
  }
}
