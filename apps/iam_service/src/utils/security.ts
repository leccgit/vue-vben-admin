/**
 * 安全防护工具
 */

import type { AuthError } from '#/types';

// 频率限制配置
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// 默认频率限制配置
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15分钟
    blockDurationMs: 30 * 60 * 1000, // 30分钟
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1小时
    blockDurationMs: 60 * 60 * 1000, // 1小时
  },
  changePassword: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15分钟
    blockDurationMs: 15 * 60 * 1000, // 15分钟
  },
};

// 存储失败尝试记录
interface FailureRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

/**
 * 频率限制管理器
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private storage: Map<string, FailureRecord> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * 获取剩余阻止时间（毫秒）
   */
  getBlockTimeRemaining(key: string): number {
    const record = this.storage.get(key);
    if (!record?.blockedUntil) return 0;

    const remaining = record.blockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * 获取剩余尝试次数
   */
  getRemainingAttempts(key: string): number {
    const record = this.storage.get(key);
    if (!record) return this.config.maxAttempts;

    const now = Date.now();
    if (now - record.firstAttempt > this.config.windowMs) {
      return this.config.maxAttempts;
    }

    return Math.max(0, this.config.maxAttempts - record.count);
  }

  /**
   * 检查是否被限制
   */
  isBlocked(key: string): boolean {
    const record = this.storage.get(key);
    if (!record) return false;

    const now = Date.now();

    // 检查是否在阻止期内
    if (record.blockedUntil && now < record.blockedUntil) {
      return true;
    }

    // 检查时间窗口是否过期
    if (now - record.firstAttempt > this.config.windowMs) {
      this.storage.delete(key);
      return false;
    }

    return record.count >= this.config.maxAttempts;
  }

  /**
   * 记录失败尝试
   */
  recordFailure(key: string): void {
    const now = Date.now();
    const record = this.storage.get(key);

    if (!record) {
      this.storage.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }

    // 检查时间窗口是否过期
    if (now - record.firstAttempt > this.config.windowMs) {
      this.storage.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }

    record.count++;
    record.lastAttempt = now;

    // 如果达到最大尝试次数，设置阻止时间
    if (record.count >= this.config.maxAttempts) {
      record.blockedUntil = now + this.config.blockDurationMs;
    }

    this.storage.set(key, record);
  }

  /**
   * 记录成功，清除失败记录
   */
  recordSuccess(key: string): void {
    this.storage.delete(key);
  }
}

// 创建频率限制器实例
export const rateLimiters = {
  login: new RateLimiter(DEFAULT_RATE_LIMITS.login),
  forgotPassword: new RateLimiter(DEFAULT_RATE_LIMITS.forgotPassword),
  changePassword: new RateLimiter(DEFAULT_RATE_LIMITS.changePassword),
};

/**
 * 生成用于频率限制的键
 */
export function generateRateLimitKey(
  action: string,
  identifier: string,
): string {
  return `${action}:${identifier}`;
}

/**
 * 检查频率限制
 */
export function checkRateLimit(
  action: keyof typeof rateLimiters,
  identifier: string,
): void {
  const limiter = rateLimiters[action];
  const key = generateRateLimitKey(action, identifier);

  if (limiter.isBlocked(key)) {
    const remainingTime = limiter.getBlockTimeRemaining(key);
    const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));

    const error: AuthError = {
      type: 'rate_limit_exceeded',
      message: `Too many attempts. Please try again in ${remainingMinutes} minutes.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: remainingTime,
    };

    throw error;
  }
}

/**
 * 记录失败尝试
 */
export function recordFailureAttempt(
  action: keyof typeof rateLimiters,
  identifier: string,
): void {
  const limiter = rateLimiters[action];
  const key = generateRateLimitKey(action, identifier);
  limiter.recordFailure(key);
}

/**
 * 记录成功尝试
 */
export function recordSuccessAttempt(
  action: keyof typeof rateLimiters,
  identifier: string,
): void {
  const limiter = rateLimiters[action];
  const key = generateRateLimitKey(action, identifier);
  limiter.recordSuccess(key);
}

/**
 * 密码强度检查
 */
export function checkPasswordStrength(password: string): {
  feedback: string[];
  isStrong: boolean;
  score: number;
} {
  const feedback: string[] = [];
  let score = 0;

  // 长度检查
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // 字符类型检查
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain special characters');
  }

  // 常见密码检查
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (
    commonPasswords.some((common) => password.toLowerCase().includes(common))
  ) {
    score -= 2;
    feedback.push('Password contains common patterns');
  }

  // 重复字符检查
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Password contains too many repeated characters');
  }

  const isStrong = score >= 5 && feedback.length === 0;

  return {
    score: Math.max(0, Math.min(6, score)),
    feedback,
    isStrong,
  };
}

/**
 * 输入清理和验证
 */
export function sanitizeInput(input: string): string {
  return input.trim().replaceAll(/[<>]/g, '');
}

/**
 * 检测可疑活动
 */
export function detectSuspiciousActivity(params: {
  ipAddress: string;
  loginTime: string;
  previousIpAddress?: string;
  previousLoginTime?: string;
  userAgent: string;
}): string[] {
  const warnings: string[] = [];

  // 检查用户代理变化
  if (params.previousLoginTime) {
    const timeDiff =
      new Date(params.loginTime).getTime() -
      new Date(params.previousLoginTime).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // 如果在短时间内从不同IP登录
    if (
      hoursDiff < 1 &&
      params.previousIpAddress &&
      params.ipAddress !== params.previousIpAddress
    ) {
      warnings.push('Login from different location within short time');
    }
  }

  // 检查可疑的用户代理
  if (
    params.userAgent.includes('bot') ||
    params.userAgent.includes('crawler')
  ) {
    warnings.push('Suspicious user agent detected');
  }

  return warnings;
}
