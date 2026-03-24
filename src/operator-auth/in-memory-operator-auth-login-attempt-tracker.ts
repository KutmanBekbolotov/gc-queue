import { HttpException, HttpStatus } from '@nestjs/common';
import {
  OperatorAuthLoginAttemptTracker,
  OperatorAuthLoginRateLimitOptions,
} from './operator-auth.interfaces';

interface LoginAttemptState {
  timestamps: number[];
  blockedUntil?: number;
}

export class InMemoryOperatorAuthLoginAttemptTracker
  implements OperatorAuthLoginAttemptTracker
{
  private readonly attempts = new Map<string, LoginAttemptState>();

  constructor(
    private readonly options: Required<OperatorAuthLoginRateLimitOptions>,
  ) {}

  async assertCanAttempt(key: string): Promise<void> {
    const state = this.attempts.get(key);
    if (!state) {
      return;
    }

    const now = Date.now();
    this.purgeOldAttempts(state, now);

    if (state.blockedUntil && state.blockedUntil > now) {
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerFailure(key: string): Promise<void> {
    const now = Date.now();
    const state = this.attempts.get(key) ?? { timestamps: [] };

    this.purgeOldAttempts(state, now);
    state.timestamps.push(now);

    if (state.timestamps.length >= this.options.maxAttempts) {
      state.blockedUntil = now + this.options.blockDurationMs;
      state.timestamps = [];
    }

    this.attempts.set(key, state);
  }

  async reset(key: string): Promise<void> {
    this.attempts.delete(key);
  }

  private purgeOldAttempts(state: LoginAttemptState, now: number) {
    state.timestamps = state.timestamps.filter(
      (timestamp) => now - timestamp <= this.options.windowMs,
    );

    if (state.blockedUntil && state.blockedUntil <= now) {
      delete state.blockedUntil;
    }
  }
}
