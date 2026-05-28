const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

type AttemptState = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, AttemptState>();

function keyForEmail(email: string) {
  return email.trim().toLowerCase();
}

export function assertCanTryLogin(email: string) {
  const key = keyForEmail(email);
  const current = loginAttempts.get(key);
  const now = Date.now();

  if (!current || current.resetAt <= now) {
    loginAttempts.delete(key);
    return;
  }

  if (current.count >= MAX_FAILED_ATTEMPTS) {
    const minutes = Math.max(1, Math.ceil((current.resetAt - now) / 60000));
    throw new Error(`Too many failed login attempts. Try again in ${minutes} minutes.`);
  }
}

export function recordFailedLogin(email: string) {
  const key = keyForEmail(email);
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS
    });
    return;
  }

  current.count += 1;
  loginAttempts.set(key, current);
}

export function clearFailedLogins(email: string) {
  loginAttempts.delete(keyForEmail(email));
}
