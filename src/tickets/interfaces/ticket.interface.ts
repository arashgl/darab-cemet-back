export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

export type MessageSender = 'user' | 'admin';

export interface TicketMessage {
  id: string;
  sender: MessageSender;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  status: TicketStatus;
  messages: TicketMessage[];
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
}

export interface SendReplyRequest {
  message: string;
}

export interface TicketsResponse {
  data: Ticket[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
