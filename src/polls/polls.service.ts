import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll, PollStatus } from './entities/poll.entity';
import { PollQuestion } from './entities/poll-question.entity';
import { PollResponse, ResponseStatus } from './entities/poll-response.entity';
import { PollAnswer } from './entities/poll-answer.entity';
import { CreatePollDto, UpdatePollDto, SubmitResponseDto } from './dto';
import {
  CreateSupplierPollDto,
  SubmitSupplierResponseDto,
} from './dto/create-supplier-poll.dto';
import { QuestionType } from './entities/poll-question.entity';
import { PollType } from './entities/poll.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(PollQuestion)
    private questionRepository: Repository<PollQuestion>,
    @InjectRepository(PollResponse)
    private responseRepository: Repository<PollResponse>,
    @InjectRepository(PollAnswer)
    private answerRepository: Repository<PollAnswer>,
  ) {}

  async create(createPollDto: CreatePollDto, user?: User): Promise<Poll> {
    const poll = this.pollRepository.create({
      ...createPollDto,
      createdBy: user,
      questions: createPollDto.questions?.map((q, index) => ({
        ...q,
        order: q.order ?? index,
      })),
    });

    return await this.pollRepository.save(poll);
  }

  async findAll(filters?: {
    status?: PollStatus;
    type?: string;
    createdBy?: number;
  }): Promise<Poll[]> {
    const query = this.pollRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.questions', 'questions')
      .orderBy('poll.createdAt', 'DESC')
      .addOrderBy('questions.order', 'ASC');

    if (filters?.status) {
      query.andWhere('poll.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('poll.type = :type', { type: filters.type });
    }

    if (filters?.createdBy) {
      query.andWhere('poll.createdById = :createdBy', {
        createdBy: filters.createdBy,
      });
    }

    return await query.getMany();
  }

  async findActive(): Promise<Poll[]> {
    const now = new Date();
    return await this.pollRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.questions', 'questions')
      .where('poll.status = :status', { status: PollStatus.ACTIVE })
      .andWhere('(poll.startDate IS NULL OR poll.startDate <= :now)', { now })
      .andWhere('(poll.endDate IS NULL OR poll.endDate >= :now)', { now })
      .orderBy('poll.createdAt', 'DESC')
      .addOrderBy('questions.order', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Poll> {
    const poll = await this.pollRepository.findOne({
      where: { id },
      relations: ['questions', 'createdBy'],
    });

    if (!poll) {
      throw new NotFoundException(`Poll with ID ${id} not found`);
    }

    await this.incrementViewCount(id);

    return poll;
  }

  async update(
    id: number,
    updatePollDto: UpdatePollDto,
    user?: User,
  ): Promise<Poll> {
    const poll = await this.findOne(id);

    if (user && poll.createdBy?.id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own polls');
    }

    if (updatePollDto.questions) {
      await this.questionRepository.delete({ poll: { id } });
      updatePollDto.questions = updatePollDto.questions.map((q, index) => ({
        ...q,
        order: q.order ?? index,
      })) as any;
    }

    Object.assign(poll, updatePollDto);
    return await this.pollRepository.save(poll);
  }

  async remove(id: number, user?: User): Promise<void> {
    const poll = await this.findOne(id);

    if (user && poll.createdBy?.id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own polls');
    }

    await this.pollRepository.remove(poll);
  }

  async submitResponse(
    pollId: number,
    submitResponseDto: SubmitResponseDto,
    user?: User,
    sessionInfo?: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<PollResponse> {
    const poll = await this.findOne(pollId);

    if (poll.status !== PollStatus.ACTIVE) {
      throw new BadRequestException('This poll is not active');
    }

    const now = new Date();
    if (poll.startDate && poll.startDate > now) {
      throw new BadRequestException('This poll has not started yet');
    }

    if (poll.endDate && poll.endDate < now) {
      throw new BadRequestException('This poll has ended');
    }

    if (poll.requiresAuth && !user) {
      throw new ForbiddenException('This poll requires authentication');
    }

    if (!poll.allowMultipleSubmissions) {
      const existingResponse = await this.responseRepository.findOne({
        where: {
          poll: { id: pollId },
          ...(user
            ? { user: { id: user.id } }
            : { sessionId: sessionInfo?.sessionId }),
          status: ResponseStatus.COMPLETED,
        },
      });

      if (existingResponse) {
        throw new BadRequestException(
          'You have already responded to this poll',
        );
      }
    }

    const response = this.responseRepository.create({
      poll,
      user,
      ...sessionInfo,
      ...submitResponseDto,
      status: ResponseStatus.COMPLETED,
      completedAt: new Date(),
      progressPercentage: 100,
    });

    const savedResponse = await this.responseRepository.save(response);

    const answers = await Promise.all(
      submitResponseDto.answers.map(async (answerDto) => {
        const question = await this.questionRepository.findOne({
          where: { id: answerDto.questionId, poll: { id: pollId } },
        });

        if (!question) {
          throw new BadRequestException(
            `Question with ID ${answerDto.questionId} not found`,
          );
        }

        return this.answerRepository.create({
          response: savedResponse,
          question,
          value: answerDto.value,
          textValue: answerDto.textValue,
          selectedOptions: answerDto.selectedOptions,
          ratingValue: answerDto.ratingValue,
          matrixValue: answerDto.matrixValue,
          otherValue: answerDto.otherValue,
        });
      }),
    );

    await this.answerRepository.save(answers);

    await this.pollRepository.increment({ id: pollId }, 'responseCount', 1);

    const result = await this.responseRepository.findOne({
      where: { id: savedResponse.id },
      relations: ['answers', 'answers.question'],
    });
    if (!result) {
      throw new NotFoundException('Response not found');
    }
    return result;
  }

  async getResponses(pollId: number, user?: User): Promise<PollResponse[]> {
    const poll = await this.findOne(pollId);

    if (user && poll.createdBy?.id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'You can only view responses for your own polls',
      );
    }

    return await this.responseRepository.find({
      where: { poll: { id: pollId } },
      relations: ['answers', 'answers.question', 'user'],
      order: { completedAt: 'DESC' },
    });
  }

  async getResponseById(
    responseId: number,
    user?: User,
  ): Promise<PollResponse> {
    const response = await this.responseRepository.findOne({
      where: { id: responseId },
      relations: [
        'poll',
        'poll.createdBy',
        'answers',
        'answers.question',
        'user',
      ],
    });

    if (!response) {
      throw new NotFoundException(`Response with ID ${responseId} not found`);
    }

    if (
      user &&
      response.poll.createdBy?.id !== user.id &&
      response.user?.id !== user.id &&
      user.role !== 'admin'
    ) {
      throw new ForbiddenException(
        'You can only view your own responses or responses to your polls',
      );
    }

    return response;
  }

  async getStatistics(pollId: number): Promise<any> {
    const poll = await this.findOne(pollId);

    if (!poll.showResults) {
      throw new ForbiddenException('Results are not available for this poll');
    }

    const responses = await this.responseRepository.find({
      where: { poll: { id: pollId }, status: ResponseStatus.COMPLETED },
      relations: ['answers', 'answers.question'],
    });

    const statistics = {
      pollId,
      title: poll.title,
      totalResponses: responses.length,
      viewCount: poll.viewCount,
      responseRate:
        poll.viewCount > 0 ? (responses.length / poll.viewCount) * 100 : 0,
      questions: [] as any[],
    };

    for (const question of poll.questions) {
      const questionStats = {
        id: question.id,
        question: question.question,
        type: question.type,
        totalAnswers: 0,
        answers: {},
      };

      const questionAnswers = responses.flatMap((r) =>
        r.answers.filter((a) => a.question.id === question.id),
      );

      questionStats.totalAnswers = questionAnswers.length;

      switch (question.type) {
        case 'single_choice':
        case 'multiple_choice':
        case 'dropdown':
        case 'yes_no':
          const optionCounts = {};
          questionAnswers.forEach((answer) => {
            if (answer.selectedOptions) {
              answer.selectedOptions.forEach((option) => {
                optionCounts[option] = (optionCounts[option] || 0) + 1;
              });
            } else if (answer.value) {
              optionCounts[answer.value] =
                (optionCounts[answer.value] || 0) + 1;
            }
          });
          questionStats.answers = optionCounts;
          break;

        case 'rating':
        case 'scale':
        case 'likert':
          const ratings = questionAnswers
            .map((a) => a.ratingValue)
            .filter((r) => r !== null);
          const distribution: Record<number, number> = {};
          ratings.forEach((rating) => {
            distribution[rating] = (distribution[rating] || 0) + 1;
          });
          questionStats.answers = {
            average:
              ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0,
            distribution,
          };
          break;

        case 'text':
        case 'textarea':
          questionStats.answers = {
            responses: questionAnswers.map((a) => a.textValue).filter((t) => t),
          };
          break;

        case 'matrix':
          const matrixData = {};
          questionAnswers.forEach((answer) => {
            if (answer.matrixValue) {
              Object.entries(answer.matrixValue).forEach(([row, col]) => {
                if (!matrixData[row]) matrixData[row] = {};
                matrixData[row][col] = (matrixData[row][col] || 0) + 1;
              });
            }
          });
          questionStats.answers = matrixData;
          break;
      }

      statistics.questions.push(questionStats);
    }

    return statistics;
  }

  async exportResponses(
    pollId: number,
    format: 'json' | 'csv' = 'json',
  ): Promise<any> {
    const responses = await this.getResponses(pollId);

    if (format === 'json') {
      return responses;
    }

    const csvData: any[] = [];
    const headers = [
      'Response ID',
      'User',
      'Email',
      'Company',
      'Supplier Type',
      'Submitted At',
    ];

    const poll = await this.findOne(pollId);
    poll.questions.forEach((q) => {
      headers.push(q.question);
    });

    csvData.push(headers);

    responses.forEach((response) => {
      const row = [
        response.id,
        response.respondentName || response.user?.email || 'Anonymous',
        response.respondentEmail || response.user?.email || '',
        response.respondentCompany || '',
        response.supplierType || '',
        response.completedAt?.toISOString() || '',
      ];

      poll.questions.forEach((question) => {
        const answer = response.answers.find(
          (a) => a.question.id === question.id,
        );
        if (answer) {
          row.push(
            answer.textValue ||
              answer.selectedOptions?.join(', ') ||
              answer.ratingValue?.toString() ||
              JSON.stringify(answer.matrixValue) ||
              answer.value?.toString() ||
              '',
          );
        } else {
          row.push('');
        }
      });

      csvData.push(row);
    });

    return csvData;
  }

  private async incrementViewCount(pollId: number): Promise<void> {
    await this.pollRepository.increment({ id: pollId }, 'viewCount', 1);
  }

  async clonePoll(pollId: number, user?: User): Promise<Poll> {
    const originalPoll = await this.findOne(pollId);

    const clonedPoll = this.pollRepository.create({
      ...originalPoll,
      id: undefined,
      title: `${originalPoll.title} (Copy)`,
      status: PollStatus.DRAFT,
      createdBy: user,
      responseCount: 0,
      viewCount: 0,
      createdAt: undefined,
      updatedAt: undefined,
      questions: originalPoll.questions.map((q) => ({
        ...q,
        id: undefined,
        poll: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      })),
    });

    return await this.pollRepository.save(clonedPoll);
  }

  async createSupplierPoll(
    createSupplierPollDto: CreateSupplierPollDto,
    user?: User,
  ): Promise<Poll> {
    const { supplierGroups, tableQuestions, questionColumns } =
      createSupplierPollDto;

    // Create matrix configuration for table-based questions
    const matrixConfig = {
      rows: tableQuestions.map((q) => ({ value: q.id, label: q.title })),
      columns: [
        { value: 'importance', label: 'اهمیت موضوع' },
        { value: 'importanceOfTopic', label: 'میزان اهمیت موضوع' },
        { value: 'companyPerformance', label: 'عملکرد شرکت در موضوع' },
        { value: 'companyStatus', label: 'وضعیت شرکت در مقایسه با رقبا' },
      ],
      multipleResponses: false,
    };

    // Create questions array - first the supplier group selection, then the matrix question, then text fields
    const questions = [
      {
        question: 'لطفاً نوع همکاری خود با شرکت سیمان داراب را مشخص کنید:',
        type: QuestionType.SINGLE_CHOICE,
        required: true,
        order: 0,
        options: supplierGroups.map((group) => ({
          value: group.id,
          label: group.label,
        })),
      },
      {
        question: 'ارزیابی عملکرد شرکت سیمان داراب',
        description:
          'لطفاً هر یک از موارد زیر را بر اساس تجربه خود ارزیابی کنید:',
        type: QuestionType.MATRIX,
        required: true,
        order: 1,
        matrixConfig,
        options: [
          ...questionColumns.importance.map((opt) => ({
            value: `importance_${opt.id}`,
            label: opt.label,
          })),
          ...questionColumns.importanceOfTopic.map((opt) => ({
            value: `importanceOfTopic_${opt.id}`,
            label: opt.label,
          })),
          ...questionColumns.companyPerformance.map((opt) => ({
            value: `companyPerformance_${opt.id}`,
            label: opt.label,
          })),
          ...questionColumns.companyStatus.map((opt) => ({
            value: `companyStatus_${opt.id}`,
            label: opt.label,
          })),
        ],
      },
      {
        question: '۱۳- نحوه ارتباط شما با مدیران شرکت را چگونه ارزیابی می نمایید ؟',
        type: QuestionType.TEXTAREA,
        required: false,
        order: 2,
        placeholder: 'لطفاً نظرات خود را بنویسید...',
      },
      {
        question: '۱۴- نقطه نظرات و پیشنهادات شما در راستای بهبود عملکرد روابط تأمین کنندگان چیست ؟',
        type: QuestionType.TEXTAREA,
        required: false,
        order: 3,
        placeholder: 'لطفاً پیشنهادات خود را بنویسید...',
      },
      {
        question: '۱۵- در صورت، شما کالا یا خدماتی دیگری جهت عرضه ندارید که در راستای تولید محصولات شرکت مفید واقع شود ؟',
        type: QuestionType.TEXTAREA,
        required: false,
        order: 4,
        placeholder: 'لطفاً توضیح دهید...',
      },
    ];

    const poll = this.pollRepository.create({
      title: createSupplierPollDto.title,
      description: createSupplierPollDto.description,
      type: PollType.SATISFACTION,
      status: PollStatus.ACTIVE,
      allowAnonymous: true,
      requiresAuth: false,
      allowMultipleSubmissions: false,
      showResults: false,
      createdBy: user,
      metadata: {
        pollType: 'supplier_satisfaction',
        supplierGroups,
        questionColumns,
      },
      questions: questions.map((q, index) => ({
        ...q,
        order: q.order ?? index,
      })),
    });

    return await this.pollRepository.save(poll);
  }

  async submitSupplierResponse(
    pollId: number,
    submitSupplierResponseDto: SubmitSupplierResponseDto,
    sessionInfo?: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<PollResponse> {
    const poll = await this.findOne(pollId);

    if (poll.status !== PollStatus.ACTIVE) {
      throw new BadRequestException('This poll is not active');
    }

    if (!poll.allowMultipleSubmissions) {
      const existingResponse = await this.responseRepository.findOne({
        where: {
          poll: { id: pollId },
          sessionId: sessionInfo?.sessionId,
          status: ResponseStatus.COMPLETED,
        },
      });

      if (existingResponse) {
        throw new BadRequestException(
          'You have already responded to this poll',
        );
      }
    }

    const response = this.responseRepository.create({
      poll,
      ...sessionInfo,
      supplierType: submitSupplierResponseDto.supplierType,
      respondentName: submitSupplierResponseDto.respondentName,
      respondentEmail: submitSupplierResponseDto.respondentEmail,
      respondentPhone: submitSupplierResponseDto.respondentPhone,
      respondentCompany: submitSupplierResponseDto.respondentCompany,
      feedback: submitSupplierResponseDto.feedback,
      status: ResponseStatus.COMPLETED,
      completedAt: new Date(),
      progressPercentage: 100,
    });

    const savedResponse = await this.responseRepository.save(response);

    // Create answers for supplier group selection and matrix responses
    const answers: PollAnswer[] = [];

    // Answer for supplier group selection (first question)
    const supplierGroupQuestion = poll.questions.find((q) => q.order === 0);
    if (supplierGroupQuestion) {
      answers.push(
        this.answerRepository.create({
          response: savedResponse,
          question: supplierGroupQuestion,
          value: submitSupplierResponseDto.supplierType,
          selectedOptions: [submitSupplierResponseDto.supplierType],
        }),
      );
    }

    // Answer for matrix question (second question)
    const matrixQuestion = poll.questions.find((q) => q.order === 1);
    if (matrixQuestion) {
      const matrixValue: Record<string, string> = {};
      submitSupplierResponseDto.responses.forEach((resp) => {
        matrixValue[`${resp.questionId}_importance`] = resp.importance;
        matrixValue[`${resp.questionId}_importanceOfTopic`] =
          resp.importanceOfTopic;
        matrixValue[`${resp.questionId}_companyPerformance`] =
          resp.companyPerformance;
        matrixValue[`${resp.questionId}_companyStatus`] = resp.companyStatus;
      });

      answers.push(
        this.answerRepository.create({
          response: savedResponse,
          question: matrixQuestion,
          matrixValue,
        }),
      );
    }

    await this.answerRepository.save(answers);
    await this.pollRepository.increment({ id: pollId }, 'responseCount', 1);

    const result = await this.responseRepository.findOne({
      where: { id: savedResponse.id },
      relations: ['answers', 'answers.question'],
    });
    if (!result) {
      throw new NotFoundException('Response not found');
    }
    return result;
  }
}
