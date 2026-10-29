/**
 * MR LEGEND 302 - Pure Business Logic and Validation Rules
 */

export interface UserUsage {
  messagesCount: number;
  callsSecondsUsed: number;
  downloadsCount: number;
  statusCount: number;
  lastResetDate: string; // YYYY-MM-DD
}

export interface AdminLimits {
  freeDailyMessages: number;
  freeCallDurationSeconds: number;
  freeDailyDownloads: number;
  freeDailyStatus: number;
}

export const DEFAULT_LIMITS: AdminLimits = {
  freeDailyMessages: 10,
  freeCallDurationSeconds: 60,
  freeDailyDownloads: 2,
  freeDailyStatus: 1,
};

/**
 * Validates a user-chosen numeric ID (must be digits only, length 3 to 12)
 */
export function validateNumericId(numericId: string): { valid: boolean; error?: string } {
  if (!numericId || typeof numericId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }
  const trimmed = numericId.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Numeric ID must contain numbers only' };
  }
  if (trimmed.length < 3 || trimmed.length > 12) {
    return { valid: false, error: 'Numeric ID must be between 3 and 12 digits' };
  }
  return { valid: true };
}

/**
 * Validates username (alphanumeric and underscores, 3-20 chars)
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Invalid email address format' };
  }
  return { valid: true };
}

/**
 * Validates password strength (min 6 characters)
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

/**
 * Calculates remaining daily limits for a user
 */
export function calculateRemainingUsage(
  membership: 'free' | 'monthly' | 'lifetime',
  usage: Partial<UserUsage> = {},
  limits: AdminLimits = DEFAULT_LIMITS
) {
  const isPremium = membership === 'monthly' || membership === 'lifetime';

  if (isPremium) {
    return {
      isPremium: true,
      messagesRemaining: Infinity,
      messagesUsed: usage.messagesCount || 0,
      callsRemainingSeconds: Infinity,
      downloadsRemaining: Infinity,
      downloadsUsed: usage.downloadsCount || 0,
      statusRemaining: 100,
      statusUsed: usage.statusCount || 0,
    };
  }

  const messagesUsed = usage.messagesCount || 0;
  const messagesRemaining = Math.max(0, limits.freeDailyMessages - messagesUsed);

  const downloadsUsed = usage.downloadsCount || 0;
  const downloadsRemaining = Math.max(0, limits.freeDailyDownloads - downloadsUsed);

  const statusUsed = usage.statusCount || 0;
  const statusRemaining = Math.max(0, limits.freeDailyStatus - statusUsed);

  return {
    isPremium: false,
    messagesRemaining,
    messagesUsed,
    callsRemainingSeconds: limits.freeCallDurationSeconds,
    downloadsRemaining,
    downloadsUsed,
    statusRemaining,
    statusUsed,
  };
}

/**
 * Checks whether subscription is currently active or expired
 */
export function isSubscriptionActive(
  membership: 'free' | 'monthly' | 'lifetime',
  expiresAt?: string | null
): boolean {
  if (membership === 'lifetime') return true;
  if (membership === 'free') return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

/**
 * Formats Pakistani Rupee currency
 */
export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

/**
 * Generates human readable reset countdown string (until midnight UTC or next 24h)
 */
export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
