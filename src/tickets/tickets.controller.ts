import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsAdmin } from '../auth/decorators';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTicketDto, SendReplyDto, UpdateTicketStatusDto } from './dto';
import { TicketStatus } from './entities/ticket.entity';
import {
  Ticket as TicketInterface,
  TicketsResponse,
} from './interfaces/ticket.interface';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: TicketStatus,
  ): Promise<TicketsResponse> {
    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? undefined : req.user.id;
    return this.ticketsService.findAll(+page, +limit, status, userId);
  }

  @Get('stats')
  @IsAdmin()
  async getStats() {
    return this.ticketsService.getTicketStats();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<TicketInterface> {
    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? undefined : req.user.id;
    return this.ticketsService.findOne(id, userId);
  }

  @Post()
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: any,
  ): Promise<TicketInterface> {
    return this.ticketsService.create(createTicketDto, req.user);
  }

  @Post(':id/reply')
  async sendReply(
    @Param('id') id: string,
    @Body() sendReplyDto: SendReplyDto,
    @Req() req: any,
  ): Promise<TicketInterface> {
    const isAdmin = req.user.role === 'admin';
    return this.ticketsService.sendReply(id, sendReplyDto, req.user, isAdmin);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
    @Req() req: any,
  ): Promise<TicketInterface> {
    const isAdmin = req.user.role === 'admin';
    return this.ticketsService.updateStatus(
      id,
      updateTicketStatusDto,
      req.user,
      isAdmin,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user.role === 'admin';
    await this.ticketsService.remove(id, req.user, isAdmin);
    return { message: 'Ticket deleted successfully' };
  }

  // Admin-only endpoints
  @Get('admin/all')
  @IsAdmin()
  async findAllForAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: TicketStatus,
  ): Promise<TicketsResponse> {
    return this.ticketsService.findAll(+page, +limit, status);
  }

  @Post('admin/:id/reply')
  @IsAdmin()
  async sendAdminReply(
    @Param('id') id: string,
    @Body() sendReplyDto: SendReplyDto,
    @Req() req: any,
  ): Promise<TicketInterface> {
    return this.ticketsService.sendReply(id, sendReplyDto, req.user, true);
  }

  @Patch('admin/:id/status')
  @IsAdmin()
  async updateStatusAsAdmin(
    @Param('id') id: string,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
    @Req() req: any,
  ): Promise<TicketInterface> {
    return this.ticketsService.updateStatus(
      id,
      updateTicketStatusDto,
      req.user,
      true,
    );
  }
}
