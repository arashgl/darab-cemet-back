import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MessageSender {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: MessageSender,
    default: MessageSender.USER,
  })
  sender: MessageSender;

  @ManyToOne('Ticket', 'messages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: any;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sender_id' })
  senderUser: User;

  @Column({ name: 'sender_id' })
  senderUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
