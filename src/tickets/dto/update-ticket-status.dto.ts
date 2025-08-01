import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from '../entities/ticket.entity';

export class UpdateTicketStatusDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
