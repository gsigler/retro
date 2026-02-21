import { IsEnum } from 'class-validator'
import { RetroPhase } from '../retros.service.js'

export class UpdatePhaseDto {
  @IsEnum(RetroPhase)
  phase!: RetroPhase
}
