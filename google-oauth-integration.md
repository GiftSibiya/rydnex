# Google OAuth Integration

This document describes how Google Sign-In is wired up in `freshcut-client` end-to-end — from the OAuth library to token storage. For the specific bug history and how it was fixed, see [google-signin-fix.md](./google-signin-fix.md).

---

## Library

**`@react-native-google-signin/google-signin` v16**

This is the official React Native Google Sign-In library. It wraps the native Google Identity SDK on both platforms. No Expo proxy (`expo-auth-session`) is used.

---

## Architecture overview

```
User taps "Continue with Google"
        │
        ▼
GoogleSignin.signIn()          ← native Google chooser
        │
        ▼
idToken (JWT, signed by Google)
        │
        ▼
POST /Auth/customer/google_sign_in   ← backend verifies JWT
        │
        ▼
{ accessToken, refreshToken, roles }
        │
        ▼
SecureStore                    ← tokens persisted locally
        │
        ▼
GET /Customer                  ← fetch customer profile
        │
        ▼
AuthContext state update       ← app considers user logged in
```

---

## Configuration

### Global setup — `app/_layout.tsx`

`GoogleSignin.configure()` is called once at module scope before any route mounts:

```ts
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  offlineAccess: false,
});
```

**Do not call `configure()` anywhere else.** Race conditions from duplicate calls were the root cause of the `401 untrusted 'aud'` bug. See [google-signin-fix.md](./google-signin-fix.md) for full details.

### Environment variables — `.env`

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_WEB_CLIENT_ID` | Web OAuth client (`client_type: 3` in `google-services.json`). The ID token's `aud` claim will equal this. The backend validates against it. |
| `EXPO_PUBLIC_IOS_CLIENT_ID` | iOS OAuth client. Passed as `iosClientId` so the native SDK can use the correct bundle identity. |
| `EXPO_PUBLIC_ANDROID_CLIENT_ID` | Android OAuth client. Present in `.env` for reference; the native build reads it directly from `google-services.json`. |

**`google-services.json` is the source of truth.** If `.env` and the native config disagree, update `.env` to match — never the other way around.

### Expo plugin — `app.json`

```json
"plugins": [
  [
    "@react-native-google-signin/google-signin",
    { "iosUrlScheme": "com.googleusercontent.apps.<IOS_CLIENT_ID_PREFIX>" }
  ]
]
```

This writes the iOS URL scheme into the native project so Google can redirect back to the app after sign-in.

### Android — `android/app/google-services.json`

Firebase configuration file. Contains three client entries for this project:
- `client_type: 1` — Android client for `com.freshcut.client`
- `client_type: 1` — Android client for `com.freshcut.pro`
- `client_type: 3` — Shared Web client (the `aud` value the backend trusts)

---

## Sign-in flow — step by step

### 1. Trigger (Login and Register screens)

Both `app/login.tsx` and `app/register-email.tsx` have an identical `signInWithGoogle()` function:

```ts
async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();           // Android: ensures Play Services available
  const user = await GoogleSignin.signIn();       // opens native Google chooser
  const idToken = user.data?.idToken;

  if (!idToken) throw new Error("No ID token returned");

  await onLoginWithGoogle(idToken);               // delegates to AuthContext
}
```

Error handling catches `statusCodes.SIGN_IN_CANCELLED` (user dismissed the sheet) separately from unexpected errors.

### 2. Backend exchange — `context/AuthContext.tsx`

`loginWithGoogle(idToken)` sends the raw Google ID token to the backend:

```ts
const response = await axios.post(
  `${baseUrl}/Auth/customer/google_sign_in`,
  { idToken }
);

const { accessToken, refreshToken, roles } = response.data;
```

The backend verifies the JWT signature and `aud` claim, then returns its own short-lived access token and a refresh token.

### 3. Role guard

If the returned `roles` array contains `"Barber"`, the login is blocked and a bottom sheet informs the user they need the barber app. This prevents a barber account from being used in the customer app.

### 4. Token storage

```ts
await SecureStore.setItemAsync("accessToken", accessToken);
await SecureStore.setItemAsync("refreshToken", refreshToken);
```

Tokens are stored in `expo-secure-store` (iOS Keychain / Android Keystore).

### 5. Profile fetch

After storing tokens, the app immediately fetches the customer profile:

```ts
const customerResponse = await axios.get(`${baseUrl}/Customer`);
await SecureStore.setItemAsync("clientData", JSON.stringify(customerResponse.data));
```

The axios interceptor in `context/axiosInceptor.ts` automatically attaches the `accessToken` as a `Bearer` header on every request.

### 6. State update

`AuthContext` state is updated with user info and tokens, navigating the app to the authenticated screens.

---

## Token lifecycle

| Token | Storage key | Used for |
|---|---|---|
| `accessToken` | `"accessToken"` in SecureStore | Bearer header on every API request (injected by axios interceptor) |
| `refreshToken` | `"refreshToken"` in SecureStore | Not yet wired to an auto-refresh interceptor — used for manual re-auth |
| `clientData` | `"clientData"` in SecureStore | Cached customer profile, hydrated on app launch |

---

## Scopes

No explicit scopes are passed to `configure()`. The defaults (`profile` and `email`) are sufficient for authentication.

**Never add sensitive scopes** (e.g. `drive.readonly`) to the sign-in flow. Doing so triggers Google's "App not verified" warning for users outside the test-user allow-list and is unnecessary for login. See [google-signin-fix.md § Root cause #2](./google-signin-fix.md) for the backstory.

---

## Applying this to `freshcut-pro` (barber app)

The barber app shares the same Firebase project (`project_number: 363072838954`) and therefore the same **Web client ID** (`EXPO_PUBLIC_WEB_CLIENT_ID`). Only the Android and iOS client IDs differ.

- `EXPO_PUBLIC_WEB_CLIENT_ID` — same value as the customer app
- `EXPO_PUBLIC_ANDROID_CLIENT_ID` — the `com.freshcut.pro` Android client from `google-services.json`
- `EXPO_PUBLIC_IOS_CLIENT_ID` — the pro app's iOS client (read from its `app.json`)
- Backend endpoint becomes `/Auth/barber/google_sign_in` but validates the same `aud`

All other rules (single `configure()` in `_layout.tsx`, no sensitive scopes, native rebuild required) are identical.

---

## Key files at a glance

| File | Role |
|---|---|
| [app/_layout.tsx](../app/_layout.tsx) | `GoogleSignin.configure()` — the only place this should appear |
| [app/login.tsx](../app/login.tsx) | Login screen `signInWithGoogle()` trigger |
| [app/register-email.tsx](../app/register-email.tsx) | Register screen `signInWithGoogle()` trigger |
| [context/AuthContext.tsx](../context/AuthContext.tsx) | `loginWithGoogle()` — backend exchange, role check, token storage |
| [context/axiosInceptor.ts](../context/axiosInceptor.ts) | Axios interceptor that attaches `accessToken` to requests |
| [android/app/google-services.json](../android/app/google-services.json) | Firebase/Google Cloud config for Android (source of truth for client IDs) |
| [app.json](../app.json) | Expo plugin entry for iOS URL scheme |
| [.env](../.env) | Environment variables for client IDs and API base URL |
| [docs/google-signin-fix.md](./google-signin-fix.md) | Root cause analysis and fix guide for the `401 untrusted 'aud'` bug |
