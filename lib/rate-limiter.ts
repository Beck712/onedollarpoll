import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiters for different actions
export const voteLimiter = new RateLimiterMemory({
  keyGeneratorFunc: (req: any) => `vote:${req.ip}:${req.clientHash}`,
  points: 5, // Number of votes
  duration: 300, // Per 5 minutes
});

export const checkoutLimiter = new RateLimiterMemory({
  keyGeneratorFunc: (req: any) => `checkout:${req.ip}:${req.clientHash}`,
  points: 3, // Number of checkout attempts
  duration: 900, // Per 15 minutes
});

export const createPollLimiter = new RateLimiterMemory({
  keyGeneratorFunc: (req: any) => `create:${req.ip}`,
  points: 5, // Number of polls
  duration: 3600, // Per hour
});

export async function checkRateLimit(limiter: RateLimiterMemory, req: any): Promise<boolean> {
  try {
    await limiter.consume(req);
    return true;
  } catch (rejRes) {
    return false;
  }
}