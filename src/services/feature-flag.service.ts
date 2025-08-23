import { clearCacheByPattern } from "@middlewares/cache.middleware"

// TODO: Add FeatureFlag model to Prisma schema before using this service
// import type { FeatureFlag } from "@prisma/client"

export class FeatureFlagService {
  private cachePrefix = "feature_flag"

  // TODO: Implement when FeatureFlag model is added to schema
  /*
  async getFeatureFlag(name: string): Promise<FeatureFlag | null> {
    try {
      const flag = await prisma.featureFlag.findUnique({ where: { name } })
      return flag
    } catch (error) {
      logger.error(`Error getting feature flag ${name}:`, error)
      throw new InternalServerError("Failed to get feature flag", "feature_flag.get_error")
    }
  }

  async setFeatureFlag(name: string, enabled: boolean): Promise<FeatureFlag> {
    try {
      const flag = await prisma.featureFlag.upsert({
        where: { name },
        update: { enabled },
        create: { name, enabled },
      })
      await clearCache(`${this.cachePrefix}:${name}`) // Invalidate specific flag cache
      return flag
    } catch (error) {
      logger.error(`Error setting feature flag ${name}:`, error)
      throw new InternalServerError("Failed to set feature flag", "feature_flag.set_error")
    }
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const flags = await prisma.featureFlag.findMany()
      return flags
    } catch (error) {
      logger.error("Error getting all feature flags:", error)
      throw new InternalServerError("Failed to get feature flags", "feature_flag.get_all_error")
    }
  }
  */

  async clearAllFeatureFlagsCache(): Promise<void> {
    await clearCacheByPattern(`${this.cachePrefix}:*`)
  }
}
