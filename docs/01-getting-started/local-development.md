# Local Development

## Prerequisites

- Node.js (LTS recommended)
- npm
- Expo-compatible device/simulator setup

## Install

```bash
npm install
```

## Run

Use either script:

```bash
npm run start
```

or

```bash
npm run dev
```

Both run `expo start --localhost`.

## Useful Scripts

- `npm run typecheck` -> TypeScript type checking
- `npm run build` -> project build script wrapper
- `npm run build:vehicle-json` -> vehicle JSON generation utility
- `npm run serve` -> local server script (if needed by workflow)

## Environment Variables

Configured through `.env`:

- `EXPO_PUBLIC_SKAFTIN_API_URL` — API host root only (e.g. `https://api.example.com`), no `/app-api` suffix. If this points at a website that serves HTML, requests will fail with a clear client error instead of a JSON parse exception.
- `EXPO_PUBLIC_SKAFTIN_API_KEY`
- `EXPO_PUBLIC_SKAFTIN_ACCESS_TOKEN`
- `EXPO_PUBLIC_SKAFTIN_BUCKET_NAME`

## Data Mode

`src/constants/AppConfig.ts` currently sets:

```ts
export const STATIC_DATA_MODE = true;
```

When `STATIC_DATA_MODE` is `true`, the repository layer and `authService` use local fixtures / stubs instead of live Skaftin HTTP calls.

Set `STATIC_DATA_MODE` to `false` to use the real Skaftin API for auth and (when wired) database operations. You need at least `EXPO_PUBLIC_SKAFTIN_API_URL` and `EXPO_PUBLIC_SKAFTIN_API_KEY` in `.env`. Auth endpoints follow `client-sdk-mobile/requests/01-AUTH-REQUESTS.md` (`/app-api/auth/login`, `/app-api/auth/register`, etc.).
