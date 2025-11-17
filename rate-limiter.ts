import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiters for different actions
export const voteLimiter = new RateLimiterMemory({
  points: 5, // Number of votes
  duration: 300, // Per 5 minutes
});

export const checkoutLimiter = new RateLimiterMemory({
  points: 3, // Number of checkout attempts
  duration: 900, // Per 15 minutes
});

export const createPollLimiter = new RateLimiterMemory({
  points: 5, // Number of polls
  duration: 3600, // Per hour
});

export async function checkRateLimit(limiter: RateLimiterMemory, key: string): Promise<boolean> {
  try {
    await limiter.consume(key);
    return true;
  } catch (rejRes) {
    return false;
  }
}