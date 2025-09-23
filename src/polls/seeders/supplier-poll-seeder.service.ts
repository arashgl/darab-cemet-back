import { Injectable } from '@nestjs/common';
import { PollsService } from '../polls.service';
import { CreateSupplierPollDto } from '../dto/create-supplier-poll.dto';

@Injectable()
export class SupplierPollSeederService {
  constructor(private readonly pollsService: PollsService) {}

  async seedSupplierPoll(): Promise<void> {
    console.log('🌱 Seeding supplier satisfaction poll...');

    const supplierPollData: CreateSupplierPollDto = {
      title: 'نظرسنجی رضایتمندی تأمین‌کنندگان - شرکت سیمان داراب',
      description:
        'لطفاً با ارزیابی عملکرد شرکت سیمان داراب در ارتباط با تأمین‌کنندگان، ما را در بهبود خدمات یاری کنید.',
      supplierGroups: [
        { id: 'main', label: 'تأمین‌کننده اصلی' },
        { id: 'agency', label: 'نمایندگی/توزیع کننده' },
        { id: 'importer', label: 'شرکت بازرگانی/واردکننده' },
      ],
      tableQuestions: [
        {
          id: 'tq1',
          title:
            '۱- عملکرد شرکت در خصوص اطلاع رسانی و آگاهی دادن به تامین کنندگان را چگونه ارزیابی می کنید ؟',
          required: true,
        },
        {
          id: 'tq2',
          title:
            '۲- عملکرد شرکت سیمان داراب در انعقاد قرارداد متعهدانه با تامین کنندگان چگونه می باشد ؟',
          required: true,
        },
        {
          id: 'tq3',
          title:
            '۳- عملکرد شرکت سیمان داراب در خصوص میزان مقاومت فرآیند انتخاب تامین کنندگان را چگونه ارزیابی می کنید ؟',
          required: true,
        },
        {
          id: 'tq4',
          title:
            '۴- پیگیری همکاران بازرگانی سیمان داراب را بر روند مناقصات ارائه شده چگونه ارزیابی می کنید ؟',
          required: true,
        },
        {
          id: 'tq5',
          title:
            '۵- مکانیزم بازرسی فنی شرکت را در خصوص تایید یا عدم تایید محصولات و خدمات خود چگونه ارزیابی می کنید ؟',
          required: true,
        },
        {
          id: 'tq6',
          title:
            '۶- انضباط کاری، نحوه برخورد و رفتار پرسنل و مدیران پاسخگوی شرکت را چگونه ارزیابی می کنید ؟',
          required: true,
        },
        {
          id: 'tq7',
          title:
            '۷- اطلاع رسانی در رابطه با نواقص و مرجوعی ها توسط شرکت سیمان داراب و همچنین زمان لازم مناسب برای رفع آنها به تامین کننده را چگونه ارزیابی می نمایید ؟',
          required: true,
        },
        {
          id: 'tq8',
          title:
            '۸- عملکرد شرکت سیمان داراب در خصوص رضایت و زمان مناسب، مناقصات خرید و همچنین عدم تغییر مشخصات خرید در حین کار را چگونه ارزیابی می نمایید ؟',
          required: true,
        },
        {
          id: 'tq9',
          title:
            '۹- عملکرد شرکت سیمان داراب در خصوص ارائه راهنمایی های لازم و اطلاعات مناسب در هنگام بروز مشکلات را چگونه ارزیابی می نمایید ؟',
          required: true,
        },
        {
          id: 'tq10',
          title:
            '۱۰- عملکرد شرکت سیمان داراب در عمل به تعهدات مالی را چگونه ارزیابی می نمایید ؟',
          required: true,
        },
        {
          id: 'tq11',
          title:
            '۱۱- عملکرد شرکت سیمان داراب در اطلاع رسانی به موقع و ارتباط مؤثر در مواقعی که تعهدات مالی به تعویق می افتد را چگونه ارزیابی می نمایید ؟',
          required: true,
        },
        {
          id: 'tq12',
          title:
            '۱۲- در مجموع عملکرد شرکت را در خصوص برآورده سازی رضایتمندی تامین کنندگان چگونه ارزیابی می کنید ؟',
          required: true,
        },
      ],
      questionColumns: {
        importance: [
          { id: 'has', label: 'دارد' },
          { id: 'hasNot', label: 'ندارد' },
        ],
        importanceOfTopic: [
          { id: 'high', label: 'زیاد' },
          { id: 'medium', label: 'متوسط' },
          { id: 'low', label: 'کم' },
        ],
        companyPerformance: [
          { id: 'excellent', label: 'عالی' },
          { id: 'good', label: 'خوب' },
          { id: 'average', label: 'متوسط' },
          { id: 'poor', label: 'ضعیف' },
          { id: 'veryPoor', label: 'خیلی ضعیف' },
        ],
        companyStatus: [
          { id: 'better', label: 'بهتر' },
          { id: 'similar', label: 'مشابه' },
          { id: 'worse', label: 'بدتر' },
        ],
      },
    };

    try {
      const poll = await this.pollsService.createSupplierPoll(supplierPollData);
      console.log(
        `✅ Successfully created supplier poll: ${poll.title} (ID: ${poll.id})`,
      );
    } catch (error) {
      console.error('❌ Error creating supplier poll:', error.message);
      throw error;
    }
  }
}
