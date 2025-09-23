import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Ip,
  Headers,
  Session,
} from '@nestjs/common';
import { SimplePollsService } from './simple-polls.service';
import { CreateSimplePollDto } from './dto/simple-poll.dto';

@Controller('simple-polls')
export class SimplePollsController {
  constructor(private readonly simplePollsService: SimplePollsService) {}

  @Post()
  async create(
    @Body() body: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Session() session: any,
  ) {
    const sessionInfo = {
      sessionId: session?.id || `session_${Date.now()}_${Math.random()}`,
      ipAddress: ip,
      userAgent,
    };

    // Handle array format
    let createSimplePollDto: CreateSimplePollDto;
    if (Array.isArray(body) && body.length > 0) {
      const data = body[0];
      createSimplePollDto = {
        question: data.qustion || data.question, // Handle typo
        answers: data.answers,
        respondentName: data.respondentName,
        respondentEmail: data.respondentEmail,
        respondentPhone: data.respondentPhone,
        respondentCompany: data.respondentCompany,
        supplierType: data.supplierType,
      };
    } else {
      // Handle object format
      createSimplePollDto = {
        question: body.qustion || body.question, // Handle typo
        answers: body.answers,
        respondentName: body.respondentName,
        respondentEmail: body.respondentEmail,
        respondentPhone: body.respondentPhone,
        respondentCompany: body.respondentCompany,
        supplierType: body.supplierType,
      };
    }

    return await this.simplePollsService.create(createSimplePollDto, sessionInfo);
  }

  @Get()
  async findAll() {
    return await this.simplePollsService.findAll();
  }

  @Get('statistics')
  async getStatistics() {
    return await this.simplePollsService.getStatistics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.simplePollsService.findOne(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.simplePollsService.remove(+id);
    return { message: 'Poll deleted successfully' };
  }
}