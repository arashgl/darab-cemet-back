import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateTicketDto, SendReplyDto, UpdateTicketStatusDto } from './dto';
import { MessageSender, TicketMessage } from './entities/ticket-message.entity';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import {
  Ticket as TicketInterface,
  TicketMessage as TicketMessageInterface,
  TicketsResponse,
} from './interfaces/ticket.interface';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private ticketMessagesRepository: Repository<TicketMessage>,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    status?: TicketStatus,
    userId?: string,
  ): Promise<TicketsResponse> {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .leftJoinAndSelect('messages.senderUser', 'senderUser');

    if (status) {
      query.where('ticket.status = :status', { status });
    }

    if (userId) {
      query.andWhere('ticket.userId = :userId', { userId });
    }

    const [tickets, totalItems] = await query
      .orderBy('ticket.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data: TicketInterface[] = tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .map(
          (message): TicketMessageInterface => ({
            id: message.id,
            sender: message.sender,
            message: message.message,
            createdAt: message.createdAt.toISOString(),
          }),
        ),
    }));

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: string, userId?: string): Promise<TicketInterface> {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .leftJoinAndSelect('messages.senderUser', 'senderUser')
      .where('ticket.id = :id', { id });

    if (userId) {
      query.andWhere('ticket.userId = :userId', { userId });
    }

    const ticket = await query.getOne();

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .map(
          (message): TicketMessageInterface => ({
            id: message.id,
            sender: message.sender,
            message: message.message,
            createdAt: message.createdAt.toISOString(),
          }),
        ),
    };
  }

  async create(
    createTicketDto: CreateTicketDto,
    user: User,
  ): Promise<TicketInterface> {
    // Create the ticket
    const ticket = this.ticketsRepository.create({
      subject: createTicketDto.subject,
      userId: user.id,
      user,
      status: TicketStatus.OPEN,
    });

    const savedTicket = await this.ticketsRepository.save(ticket);

    // Create the initial message
    const message = this.ticketMessagesRepository.create({
      message: createTicketDto.message,
      sender: MessageSender.USER,
      ticketId: savedTicket.id,
      senderUserId: user.id,
      senderUser: user,
    });

    await this.ticketMessagesRepository.save(message);

    // Return the ticket with the message
    return this.findOne(savedTicket.id);
  }

  async sendReply(
    ticketId: string,
    sendReplyDto: SendReplyDto,
    user: User,
    isAdmin = false,
  ): Promise<TicketInterface> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if user has permission to reply to this ticket
    if (!isAdmin && ticket.userId !== user.id) {
      throw new ForbiddenException('You can only reply to your own tickets');
    }

    // Create the reply message
    const message = this.ticketMessagesRepository.create({
      message: sendReplyDto.message,
      sender: isAdmin ? MessageSender.ADMIN : MessageSender.USER,
      ticketId: ticket.id,
      senderUserId: user.id,
      senderUser: user,
    });

    await this.ticketMessagesRepository.save(message);

    // Update ticket status if it was closed and user is replying
    if (ticket.status === TicketStatus.CLOSED && !isAdmin) {
      ticket.status = TicketStatus.OPEN;
      await this.ticketsRepository.save(ticket);
    }

    // If admin is replying, set status to pending
    if (isAdmin && ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.PENDING;
      await this.ticketsRepository.save(ticket);
    }

    return this.findOne(ticketId);
  }

  async updateStatus(
    id: string,
    updateTicketStatusDto: UpdateTicketStatusDto,
    user: User,
    isAdmin = false,
  ): Promise<TicketInterface> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Only admins can update ticket status, or users can close their own tickets
    if (
      !isAdmin &&
      !(
        ticket.userId === user.id &&
        updateTicketStatusDto.status === TicketStatus.CLOSED
      )
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to update ticket status',
      );
    }

    if (updateTicketStatusDto.status) {
      ticket.status = updateTicketStatusDto.status;
      await this.ticketsRepository.save(ticket);
    }

    return this.findOne(id);
  }

  async remove(id: string, user: User, isAdmin = false): Promise<void> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Only admins or ticket owner can delete tickets
    if (!isAdmin && ticket.userId !== user.id) {
      throw new ForbiddenException(
        'Insufficient permissions to delete this ticket',
      );
    }

    await this.ticketsRepository.remove(ticket);
  }

  // Admin-specific methods
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    pending: number;
    resolved: number;
    closed: number;
  }> {
    const [total, open, pending, resolved, closed] = await Promise.all([
      this.ticketsRepository.count(),
      this.ticketsRepository.count({ where: { status: TicketStatus.OPEN } }),
      this.ticketsRepository.count({ where: { status: TicketStatus.PENDING } }),
      this.ticketsRepository.count({
        where: { status: TicketStatus.RESOLVED },
      }),
      this.ticketsRepository.count({ where: { status: TicketStatus.CLOSED } }),
    ]);

    return { total, open, pending, resolved, closed };
  }
}
