import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimplePoll } from './entities/simple-poll.entity';
import { CreateSimplePollDto } from './dto/simple-poll.dto';

@Injectable()
export class SimplePollsService {
  constructor(
    @InjectRepository(SimplePoll)
    private simplePollRepository: Repository<SimplePoll>,
  ) {}

  async create(
    createSimplePollDto: CreateSimplePollDto,
    sessionInfo?: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<SimplePoll> {
    const poll = this.simplePollRepository.create({
      ...createSimplePollDto,
      ...sessionInfo,
    });

    return await this.simplePollRepository.save(poll);
  }

  async findAll(): Promise<SimplePoll[]> {
    return await this.simplePollRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SimplePoll | null> {
    return await this.simplePollRepository.findOne({
      where: { id },
    });
  }

  async getStatistics(): Promise<any> {
    const polls = await this.findAll();

    const stats = {
      totalResponses: polls.length,
      questionStats: {},
    };

    // Aggregate statistics for each question
    polls.forEach(poll => {
      poll.answers.forEach(answer => {
        if (!stats.questionStats[answer.questionId]) {
          stats.questionStats[answer.questionId] = {
            questionTitle: answer.questionTitle,
            importance: {},
            performance: {},
            competitorComparison: {},
            companyStatus: {},
          };
        }

        const questionStat = stats.questionStats[answer.questionId];

        // Count each response type
        questionStat.importance[answer.importance] =
          (questionStat.importance[answer.importance] || 0) + 1;
        questionStat.performance[answer.performance] =
          (questionStat.performance[answer.performance] || 0) + 1;
        questionStat.competitorComparison[answer.competitorComparison] =
          (questionStat.competitorComparison[answer.competitorComparison] || 0) + 1;
        questionStat.companyStatus[answer.companyStatus] =
          (questionStat.companyStatus[answer.companyStatus] || 0) + 1;
      });
    });

    return stats;
  }

  async remove(id: number): Promise<void> {
    await this.simplePollRepository.delete(id);
  }
}