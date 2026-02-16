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
import { TeamsService } from './teams.service'
import { CreateTeamDto } from './dto/create-team.dto'
import { UpdateTeamDto } from './dto/update-team.dto'
import { AddMemberDto } from './dto/add-member.dto'

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(req.user.id, dto)
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.teamsService.findAll(req.user.id)
  }

  @Get(':id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.teamsService.findOne(req.user.id, id)
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(req.user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.teamsService.remove(req.user.id, id)
  }

  @Post(':id/members')
  addMember(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.teamsService.addMember(req.user.id, id, dto.email)
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.teamsService.removeMember(req.user.id, id, userId)
  }
}
