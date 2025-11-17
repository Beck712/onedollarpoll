import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Generate a client hash based on headers for anonymous tracking
export function generateClientHash(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
}

// Generate a URL-safe slug
export function generateSlug(): string {
  return crypto.randomBytes(8).toString('hex');
}

// Get client IP address
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return xRealIp;
  }
  
  return '127.0.0.1';
}

// Validate poll options
export function validatePollOptions(options: string[]): boolean {
  return Array.isArray(options) && 
         options.length >= 2 && 
         options.length <= 10 &&
         options.every(opt => typeof opt === 'string' && opt.trim().length > 0 && opt.length <= 200);
}

// Validate poll type and choices
export function validatePollType(type: string, maxChoices: number, optionsLength: number): boolean {
  if (type === 'single') {
    return maxChoices === 1;
  }
  if (type === 'multi') {
    return maxChoices > 1 && maxChoices <= optionsLength;
  }
  return false;
}