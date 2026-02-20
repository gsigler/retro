import { IsString, Length } from 'class-validator'

export class JoinTeamDto {
  @IsString()
  @Length(10, 10)
  inviteCode!: string
}
