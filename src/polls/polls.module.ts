import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { Poll } from './entities/poll.entity';
import { PollQuestion } from './entities/poll-question.entity';
import { PollResponse } from './entities/poll-response.entity';
import { PollAnswer } from './entities/poll-answer.entity';
import { PollSeederService } from './seeders/poll-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Poll,
      PollQuestion,
      PollResponse,
      PollAnswer,
    ]),
  ],
  controllers: [PollsController],
  providers: [PollsService, PollSeederService],
  exports: [PollsService, PollSeederService],
})
export class PollsModule {}