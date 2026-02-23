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
import { TeamsService } from './teams.service.js'
import { CreateTeamDto } from './dto/create-team.dto.js'
import { UpdateTeamDto } from './dto/update-team.dto.js'
import { AddMemberDto } from './dto/add-member.dto.js'
import { JoinTeamDto } from './dto/join-team.dto.js'
import {
  TeamResponse,
  TeamWithCountsResponse,
  TeamDetailResponse,
  TeamMemberResponse,
} from './dto/team-response.dto.js'

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  async create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateTeamDto,
  ): Promise<TeamResponse> {
    const team = await this.teamsService.create(req.user.id, dto)
    return TeamResponse.from(team)
  }

  @Post('join')
  async join(
    @Request() req: { user: { id: string } },
    @Body() dto: JoinTeamDto,
  ): Promise<TeamMemberResponse> {
    const member = await this.teamsService.joinByInviteCode(
      req.user.id,
      dto.inviteCode,
    )
    return TeamMemberResponse.from(member)
  }

  @Get()
  async findAll(
    @Request() req: { user: { id: string } },
  ): Promise<TeamWithCountsResponse[]> {
    const teams = await this.teamsService.findAll(req.user.id)
    return teams.map(TeamWithCountsResponse.from)
  }

  @Get(':id')
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<TeamDetailResponse> {
    const team = await this.teamsService.findOne(req.user.id, id)
    return TeamDetailResponse.from(team)
  }

  @Patch(':id')
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamResponse> {
    const team = await this.teamsService.update(req.user.id, id, dto)
    return TeamResponse.from(team)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.teamsService.remove(req.user.id, id)
  }

  @Post(':id/invite/regenerate')
  async regenerateInviteCode(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<TeamResponse> {
    const team = await this.teamsService.regenerateInviteCode(req.user.id, id)
    return TeamResponse.from(team)
  }

  @Post(':id/members')
  async addMember(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ): Promise<TeamMemberResponse> {
    const member = await this.teamsService.addMember(req.user.id, id, dto.email)
    return TeamMemberResponse.from(member)
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.teamsService.removeMember(req.user.id, id, userId)
  }
}
