import {
  AUTH_ERROR_MESSAGES,
  DEMO_ERROR_EMAIL,
  DEMO_REQUEST_DELAY,
  DEMO_REQUEST_DELAY_REGISTER,
} from '../../../constants';
import type { AuthResult, Credentials } from '../types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolve(payload: Credentials): AuthResult {
  if (payload.email.trim().toLowerCase() === DEMO_ERROR_EMAIL) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.credentialsInvalid };
  }
  return { ok: true };
}

export function signIn(payload: Credentials): Promise<AuthResult> {
  return delay(DEMO_REQUEST_DELAY).then(() => resolve(payload));
}

export function signUp(payload: Credentials): Promise<AuthResult> {
  return delay(DEMO_REQUEST_DELAY_REGISTER).then(() => resolve(payload));
}