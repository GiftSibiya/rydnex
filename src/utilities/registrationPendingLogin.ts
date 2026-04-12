/**
 * Holds email/password in memory only between register → OTP when verify-otp succeeds
 * without returning a session (`data: {}`). Never put these in route params.
 */
type Pending = { email: string; password: string };

let pending: Pending | null = null;

export function setPendingRegistrationLogin(creds: Pending): void {
  pending = creds;
}

export function takePendingRegistrationLogin(): Pending | null {
  const p = pending;
  pending = null;
  return p;
}

export function clearPendingRegistrationLogin(): void {
  pending = null;
}
