import prisma from '../src/config/database.js';
import { achievementService } from '../src/services/achievement.service.js';

async function main() {
  await achievementService.seedAchievements();
  console.log('✅ Achievements seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
