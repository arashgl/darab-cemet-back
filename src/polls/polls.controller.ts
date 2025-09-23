import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpException,
  HttpStatus,
  Ip,
  Headers,
  Session,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto, UpdatePollDto, SubmitResponseDto } from './dto';
import {
  CreateSupplierPollDto,
  SubmitSupplierResponseDto,
} from './dto/create-supplier-poll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PollStatus } from './entities/poll.entity';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPollDto: CreatePollDto, @Request() req) {
    return await this.pollsService.create(createPollDto, req.user);
  }

  @Get()
  async findAll(@Query() query: any) {
    const filters = {
      status: query.status,
      type: query.type,
      createdBy: query.createdBy ? parseInt(query.createdBy) : undefined,
    };

    return await this.pollsService.findAll(filters);
  }

  @Get('active')
  async findActive() {
    return await this.pollsService.findActive();
  }

  @Get('my-polls')
  @UseGuards(JwtAuthGuard)
  async getMyPolls(@Request() req) {
    return await this.pollsService.findAll({ createdBy: req.user.id });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.pollsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePollDto: UpdatePollDto,
    @Request() req,
  ) {
    return await this.pollsService.update(+id, updatePollDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    await this.pollsService.remove(+id, req.user);
    return { message: 'Poll deleted successfully' };
  }

  @Post(':id/responses')
  async submitResponse(
    @Param('id') id: string,
    @Body() submitResponseDto: SubmitResponseDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Session() session: any,
  ) {
    const sessionInfo = {
      sessionId: session.id || `session_${Date.now()}_${Math.random()}`,
      ipAddress: ip,
      userAgent,
    };

    return await this.pollsService.submitResponse(
      +id,
      submitResponseDto,
      req.user,
      sessionInfo,
    );
  }

  @Get(':id/responses')
  @UseGuards(JwtAuthGuard)
  async getResponses(@Param('id') id: string, @Request() req) {
    return await this.pollsService.getResponses(+id, req.user);
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return await this.pollsService.getStatistics(+id);
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard)
  async exportResponses(
    @Param('id') id: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Request() req,
  ) {
    return await this.pollsService.exportResponses(+id, format);
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard)
  async clonePoll(@Param('id') id: string, @Request() req) {
    return await this.pollsService.clonePoll(+id, req.user);
  }

  @Get('responses/:responseId')
  @UseGuards(JwtAuthGuard)
  async getResponseById(
    @Param('responseId') responseId: string,
    @Request() req,
  ) {
    return await this.pollsService.getResponseById(+responseId, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PollStatus,
    @Request() req,
  ) {
    const poll = await this.pollsService.findOne(+id);

    if (poll.createdBy?.id !== req.user.id && req.user.role !== 'admin') {
      throw new HttpException(
        'You can only update status of your own polls',
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.pollsService.update(+id, { status }, req.user);
  }

  @Get(':id/preview')
  async previewPoll(@Param('id') id: string) {
    const poll = await this.pollsService.findOne(+id);

    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      questions: poll.questions.map((q) => ({
        id: q.id,
        question: q.question,
        description: q.description,
        type: q.type,
        required: q.required,
        options: q.options,
        ratingConfig: q.ratingConfig,
        matrixConfig: q.matrixConfig,
        allowOther: q.allowOther,
        placeholder: q.placeholder,
      })),
      metadata: poll.metadata,
    };
  }

  @Post('admin/bulk-action')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async bulkAction(
    @Body()
    body: {
      action: 'delete' | 'activate' | 'close';
      pollIds: number[];
    },
  ) {
    const { action, pollIds } = body;
    const results: any[] = [];

    for (const pollId of pollIds) {
      try {
        switch (action) {
          case 'delete':
            await this.pollsService.remove(pollId);
            results.push({ pollId, success: true, action: 'deleted' });
            break;
          case 'activate':
            await this.pollsService.update(pollId, {
              status: PollStatus.ACTIVE,
            });
            results.push({ pollId, success: true, action: 'activated' });
            break;
          case 'close':
            await this.pollsService.update(pollId, {
              status: PollStatus.CLOSED,
            });
            results.push({ pollId, success: true, action: 'closed' });
            break;
        }
      } catch (error) {
        results.push({ pollId, success: false, error: error.message });
      }
    }

    return { results };
  }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdminDashboard() {
    const allPolls = await this.pollsService.findAll();

    const stats = {
      total: allPolls.length,
      active: allPolls.filter((p) => p.status === PollStatus.ACTIVE).length,
      draft: allPolls.filter((p) => p.status === PollStatus.DRAFT).length,
      closed: allPolls.filter((p) => p.status === PollStatus.CLOSED).length,
      totalResponses: allPolls.reduce((sum, p) => sum + p.responseCount, 0),
      totalViews: allPolls.reduce((sum, p) => sum + p.viewCount, 0),
      recentPolls: allPolls.slice(0, 10),
    };

    return stats;
  }

  @Post('supplier-poll')
  @UseGuards(JwtAuthGuard)
  async createSupplierPoll(
    @Body() createSupplierPollDto: CreateSupplierPollDto,
    @Request() req,
  ) {
    return await this.pollsService.createSupplierPoll(
      createSupplierPollDto,
      req.user,
    );
  }

  @Post(':id/supplier-response')
  async submitSupplierResponse(
    @Param('id') id: string,
    @Body() submitSupplierResponseDto: SubmitSupplierResponseDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Session() session: any,
  ) {
    const sessionInfo = {
      sessionId: session.id || `session_${Date.now()}_${Math.random()}`,
      ipAddress: ip,
      userAgent,
    };

    return await this.pollsService.submitSupplierResponse(
      +id,
      submitSupplierResponseDto,
      sessionInfo,
    );
  }
}
