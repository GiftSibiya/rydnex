# Rydnex Documentation

This folder contains project documentation for the Rydnex Expo app.

## Documentation Map

- `00-overview/product-overview.md`  
  Product purpose, platform scope, and current feature set.
- `00-overview/navigation.md`  
  Current routing and navigation structure (Expo Router stack + tabs).
- `01-getting-started/local-development.md`  
  Local setup, scripts, and environment configuration.
- `02-architecture/application-architecture.md`  
  High-level architecture and important implementation patterns.
- `03-features/feature-guide.md`  
  Feature-by-feature behavior and user flows.
- `04-data/data-and-storage.md`  
  Data models, static fixtures, and persistence notes.

## Current Status Note

The codebase is in an active transition with two data/state paths:

1. Context + AsyncStorage flow (`src/contexts/*`) used by Expo Router screens in `src/app/*`.
2. Store + repository flow (`src/features/*`, `src/backend/*`) used by modular feature screens.

Both are documented so contributors can work safely in either path while consolidation continues.
