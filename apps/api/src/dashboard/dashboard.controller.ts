import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { DashboardService } from './dashboard.service.js'
import { DashboardSummaryResponse } from './dto/dashboard-summary-response.dto.js'

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(
    @Request() req: { user: { id: string } },
  ): Promise<DashboardSummaryResponse> {
    const data = await this.dashboardService.getSummary(req.user.id)
    return DashboardSummaryResponse.from(data)
  }
}
