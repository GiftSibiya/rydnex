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

- `EXPO_PUBLIC_SKAFTIN_API_URL`
- `EXPO_PUBLIC_SKAFTIN_API_KEY`
- `EXPO_PUBLIC_SKAFTIN_ACCESS_TOKEN`
- `EXPO_PUBLIC_SKAFTIN_BUCKET_NAME`

## Data Mode

`src/constants/AppConfig.ts` currently sets:

```ts
export const STATIC_DATA_MODE = true;
```

This means the repository layer serves local fixture data instead of live backend calls for the current main flow.
