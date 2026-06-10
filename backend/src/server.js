const start = async () => {
  try {
    // Start server first
    app.listen(config.port, () => {
      console.log(`🌟 Aurora API running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
    });

    // Seed achievements separately
    try {
      await achievementService.seedAchievements();
      console.log('✅ Achievements seeded successfully');
    } catch (seedError) {
      console.error('⚠️ Achievement seeding skipped:', seedError.message);
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();