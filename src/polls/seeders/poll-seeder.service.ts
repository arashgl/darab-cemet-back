import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll, PollType, PollStatus } from '../entities/poll.entity';
import { PollQuestion, QuestionType } from '../entities/poll-question.entity';

@Injectable()
export class PollSeederService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(PollQuestion)
    private questionRepository: Repository<PollQuestion>,
  ) {}

  async seedDarabCementSurvey(): Promise<void> {
    const existingPoll = await this.pollRepository.findOne({
      where: { title: 'Supplier Satisfaction Survey - Darab Cement' },
    });

    if (existingPoll) {
      console.log('Darab Cement Survey already exists. Skipping seeding.');
      return;
    }

    const poll = this.pollRepository.create({
      title: 'Supplier Satisfaction Survey - Darab Cement',
      description: 'Comprehensive supplier evaluation and satisfaction survey for Darab Cement Company',
      type: PollType.SATISFACTION,
      status: PollStatus.ACTIVE,
      requiresAuth: false,
      allowAnonymous: true,
      allowMultipleSubmissions: false,
      showResults: false,
      randomizeQuestions: false,
      metadata: {
        category: 'supplier_evaluation',
        department: 'procurement',
        version: '1.0',
      },
    });

    const savedPoll = await this.pollRepository.save(poll);

    const questions = [
      {
        question: 'نوع تامین کننده شما',
        description: 'لطفا نوع تامین کننده خود را انتخاب کنید',
        type: QuestionType.DROPDOWN,
        required: true,
        order: 0,
        options: [
          { value: 'manufacturer', label: 'تولید کننده اصلی' },
          { value: 'official_representative', label: 'نماینده رسمی' },
          { value: 'distributor', label: 'توزیع کننده' },
          { value: 'trading_company', label: 'شرکت بازرگانی' },
          { value: 'importer', label: 'واردکننده' },
        ],
      },
      {
        question: 'ارتباط اطلاع رسانی و آگاهی',
        description: 'ارزیابی کیفیت ارتباطات و اطلاع رسانی تامین کننده',
        type: QuestionType.MATRIX,
        required: true,
        order: 1,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'مذاکره منصفانه قرارداد',
        description: 'ارزیابی فرآیند مذاکره و تنظیم قرارداد',
        type: QuestionType.MATRIX,
        required: true,
        order: 2,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'شفافیت فرآیند انتخاب تامین کننده',
        description: 'میزان شفافیت در فرآیند انتخاب و ارزیابی تامین کنندگان',
        type: QuestionType.MATRIX,
        required: true,
        order: 3,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'عملکرد پیگیری سفارش',
        description: 'کیفیت پیگیری و نظارت بر سفارشات',
        type: QuestionType.MATRIX,
        required: true,
        order: 4,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'مکانیزم بازرسی فنی',
        description: 'فرآیند کنترل کیفی و بازرسی فنی محصولات',
        type: QuestionType.MATRIX,
        required: true,
        order: 5,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'حرفه‌ای بودن و پاسخگویی کارکنان',
        description: 'ارزیابی کیفیت خدمات و حرفه‌ای بودن کارکنان',
        type: QuestionType.MATRIX,
        required: true,
        order: 6,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'گزارش نقص و رفع عیب',
        description: 'فرآیند گزارش دهی و رفع نواقص محصولات',
        type: QuestionType.MATRIX,
        required: true,
        order: 7,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'دقت در سفارش خرید',
        description: 'میزان دقت و صحت در ثبت و پردازش سفارشات',
        type: QuestionType.MATRIX,
        required: true,
        order: 8,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'راهنمایی در هنگام حل مشکل',
        description: 'کیفیت پشتیبانی و راهنمایی در زمان بروز مشکلات',
        type: QuestionType.MATRIX,
        required: true,
        order: 9,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'انجام تعهدات مالی',
        description: 'وفای به تعهدات مالی و پرداخت‌های موعد',
        type: QuestionType.MATRIX,
        required: true,
        order: 10,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'اطلاع رسانی تاخیر مالی',
        description: 'شفافیت در اطلاع رسانی مشکلات و تاخیرات مالی',
        type: QuestionType.MATRIX,
        required: true,
        order: 11,
        matrixConfig: {
          rows: [
            { value: 'availability', label: 'وجود دارد' },
            { value: 'importance', label: 'اهمیت' },
            { value: 'performance', label: 'عملکرد' },
            { value: 'comparison', label: 'مقایسه با رقبا' },
          ],
          columns: [
            { value: 'yes', label: 'بله' },
            { value: 'no', label: 'خیر' },
            { value: 'low', label: 'کم' },
            { value: 'medium', label: 'متوسط' },
            { value: 'high', label: 'زیاد' },
            { value: 'very_poor', label: 'خیلی ضعیف' },
            { value: 'poor', label: 'ضعیف' },
            { value: 'average', label: 'متوسط' },
            { value: 'good', label: 'خوب' },
            { value: 'excellent', label: 'عالی' },
            { value: 'better', label: 'بهتر' },
            { value: 'same', label: 'مشابه' },
            { value: 'worse', label: 'بدتر' },
          ],
        },
      },
      {
        question: 'رضایت کلی از تامین کننده',
        description: 'ارزیابی کلی رضایتمندی از همکاری با تامین کننده',
        type: QuestionType.RATING,
        required: true,
        order: 12,
        ratingConfig: {
          min: 1,
          max: 5,
          step: 1,
          labels: {
            '1': 'خیلی ناراضی',
            '2': 'ناراضی',
            '3': 'متوسط',
            '4': 'راضی',
            '5': 'خیلی راضی',
          },
        },
      },
      {
        question: 'سه نقطه قوت و ضعف',
        description: 'لطفا سه نقطه قوت و ضعف تامین کننده را ذکر کنید',
        type: QuestionType.TEXTAREA,
        required: false,
        order: 13,
        placeholder: 'نقاط قوت و ضعف را بنویسید...',
        validationRules: {
          maxLength: 1000,
        },
      },
      {
        question: 'موضوعات مهم اضافی',
        description: 'موضوعات مهم دیگری که در این نظرسنجی نیامده است',
        type: QuestionType.TEXTAREA,
        required: false,
        order: 14,
        placeholder: 'موضوعات اضافی را بنویسید...',
        validationRules: {
          maxLength: 1000,
        },
      },
      {
        question: 'پیشنهادات بهبود',
        description: 'پیشنهادات خود برای بهبود همکاری را ارائه دهید',
        type: QuestionType.TEXTAREA,
        required: false,
        order: 15,
        placeholder: 'پیشنهادات خود را بنویسید...',
        validationRules: {
          maxLength: 1000,
        },
      },
    ];

    for (const questionData of questions) {
      const question = this.questionRepository.create({
        ...questionData,
        poll: savedPoll,
      });
      await this.questionRepository.save(question);
    }

    console.log('Darab Cement Supplier Satisfaction Survey has been seeded successfully!');
  }

  async clearPolls(): Promise<void> {
    await this.questionRepository.delete({});
    await this.pollRepository.delete({});
    console.log('All polls and questions have been cleared.');
  }
}