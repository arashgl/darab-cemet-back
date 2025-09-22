import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PollSeederService } from './poll-seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const pollSeederService = app.get(PollSeederService);

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        console.log('🌱 Seeding Darab Cement poll...');
        await pollSeederService.seedDarabCementSurvey();
        console.log('✅ Seeding completed successfully!');
        break;

      case 'clear':
        console.log('🧹 Clearing all polls...');
        await pollSeederService.clearPolls();
        console.log('✅ Clearing completed successfully!');
        break;

      default:
        console.log(`
Usage: npm run seed:polls [command]

Commands:
  seed    - Seed the Darab Cement supplier satisfaction survey
  clear   - Clear all polls and questions from database

Examples:
  npm run seed:polls seed
  npm run seed:polls clear
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();