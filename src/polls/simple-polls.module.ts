import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimplePollsController } from './simple-polls.controller';
import { SimplePollsService } from './simple-polls.service';
import { SimplePoll } from './entities/simple-poll.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SimplePoll])],
  controllers: [SimplePollsController],
  providers: [SimplePollsService],
  exports: [SimplePollsService],
})
export class SimplePollsModule {}