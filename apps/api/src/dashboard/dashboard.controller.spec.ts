import { Test, TestingModule } from '@nestjs/testing'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DashboardSummaryResponse } from './dto/dashboard-summary-response.dto'

describe('DashboardController', () => {
  let controller: DashboardController
  let dashboardService: { getSummary: jest.Mock }

  const req = { user: { id: 'user-1' } }

  beforeEach(async () => {
    dashboardService = { getSummary: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<DashboardController>(DashboardController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', DashboardController)
    expect(guards).toBeDefined()
    expect(guards).toContain(JwtAuthGuard)
  })

  describe('getSummary', () => {
    it('should return a DashboardSummaryResponse', async () => {
      const serviceResult = {
        memberCount: 5,
        retroCount: 10,
        openActionItemCount: 3,
        completedActionItemCount: 7,
        upcomingRetros: [
          {
            id: 'retro-1',
            name: 'Sprint 5',
            status: 'SCHEDULED',
            date: new Date('2026-03-01'),
            teamId: 'team-1',
            createdAt: new Date(),
          },
        ],
        recentActionItems: [
          {
            id: 'item-1',
            title: 'Fix bug',
            description: null,
            status: 'OPEN',
            dueDate: null,
            retroId: 'retro-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            assignee: { id: 'user-1', name: 'Owner', avatarUrl: null },
            createdBy: { id: 'user-1', name: 'Owner', avatarUrl: null },
          },
        ],
      }
      dashboardService.getSummary.mockResolvedValue(serviceResult)

      const result = await controller.getSummary(req)

      expect(dashboardService.getSummary).toHaveBeenCalledWith('user-1')
      expect(result).toBeInstanceOf(DashboardSummaryResponse)
      expect(result.memberCount).toBe(5)
      expect(result.retroCount).toBe(10)
      expect(result.upcomingRetros).toHaveLength(1)
      expect(result.recentActionItems).toHaveLength(1)
    })
  })
})
