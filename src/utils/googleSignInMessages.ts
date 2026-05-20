/** Whether Google sign-in created a new app user or signed into an existing one. */
export type GoogleSignInAccountKind = 'created' | 'existing';

const NEW_ACCOUNT_WINDOW_MS = 90_000;

function isRecentlyCreated(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_ACCOUNT_WINDOW_MS;
}

/** Infer account kind from Skaftin google-sign-in `data` (supports future `is_new_user` flags). */
export function googleSignInAccountKindFromApi(
  payloadData: Record<string, unknown> | null | undefined
): GoogleSignInAccountKind {
  if (!payloadData) return 'existing';

  const explicitFlags = [
    payloadData.is_new_user,
    payloadData.isNewUser,
    payloadData.new_user,
    payloadData.user_created,
  ];
  if (explicitFlags.some((v) => v === true)) return 'created';

  const user =
    payloadData.user && typeof payloadData.user === 'object'
      ? (payloadData.user as Record<string, unknown>)
      : null;
  if (user) {
    const created = user.created_at ?? user.createdAt;
    if (typeof created === 'string' && isRecentlyCreated(created)) {
      return 'created';
    }
  }

  return 'existing';
}

export function googleSignInSuccessToastMessage(
  kind: GoogleSignInAccountKind,
  screen: 'login' | 'register'
): string {
  if (kind === 'created') {
    return screen === 'register'
      ? 'Account created with Google. Welcome to Rydnex!'
      : 'Welcome to Rydnex! Your account was created.';
  }
  return screen === 'register'
    ? 'Signed in to your existing account.'
    : 'Welcome back!';
}
