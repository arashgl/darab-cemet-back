import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SupplierPollSeederService } from './supplier-poll-seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const supplierPollSeederService = app.get(SupplierPollSeederService);

  try {
    console.log('🌱 Seeding supplier satisfaction poll...');
    await supplierPollSeederService.seedSupplierPoll();
    console.log('🎉 Supplier poll seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
