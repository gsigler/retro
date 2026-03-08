import { IsString } from 'class-validator'

export class DashboardLeaveDto {
  @IsString()
  teamId!: string
}
