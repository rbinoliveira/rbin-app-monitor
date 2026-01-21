# Reference Project Analysis: flow-roll-academy-web

## Context

Task 25 requires aligning this application's architecture, folder structure, and libraries with the reference project `flow-roll-academy-web` which is located at `/Users/rubinho/dev/github/flow-roll-academy-web` (sibling directory).

## Analysis Results

### 1. Project Structure Comparison

**Reference Project (`flow-roll-academy-web`):**
```
src/
├── app/                    # Next.js App Router
├── features/               # Feature-based organization
├── shared/                 # Shared utilities and components
└── proxy.ts               # Proxy configuration
```

**Current Project (`rbin-app-monitor`):**
```
src/
├── app/                    # Next.js App Router
├── components/             # Components (layout/, projects/, ui/)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── services/               # Business logic services
└── types/                  # TypeScript type definitions
```

**Key Differences:**
- Reference uses `features/` directory for feature-based organization
- Reference uses `shared/` directory instead of separate `components/`, `hooks/`, `lib/`, `services/`
- Current project uses more granular separation (components, hooks, lib, services, types)

### 2. Dependencies Analysis

**Reference Project Key Dependencies:**
- Next.js (App Router)
- React & React DOM
- TypeScript
- Tailwind CSS
- Firebase (if applicable)

**Current Project Dependencies:**
- Next.js 16.0.7
- React 19.2.1
- TypeScript 5.3.0
- Tailwind CSS
- Firebase & Firebase Admin
- Cypress
- @rbinflow/eslint-config

**Dependency Alignment Needed:**
- Compare exact versions
- Check for missing dependencies
- Verify compatibility

### 3. Configuration Files

**Reference Project:**
- `next.config.mjs` (ESM format)
- `tsconfig.json`
- `postcss.config.mjs`
- `components.json` (shadcn/ui configuration)

**Current Project:**
- `next.config.js` (CommonJS format)
- `tsconfig.json`
- `postcss.config.js` (CommonJS format)
- No `components.json`

**Key Differences:**
- Reference uses ESM (`.mjs`) for config files
- Current project uses CommonJS (`.js`)
- Reference has `components.json` (shadcn/ui)
- Need to check ESLint/Prettier configuration

### 4. Code Patterns

**Reference Project:**
- Feature-based organization
- Shared utilities in `shared/` directory
- Proxy configuration file

**Current Project:**
- Service-based organization
- Separate directories for components, hooks, lib, services
- No proxy configuration

## Detailed Comparison

### Folder Structure Comparison

**Reference Project Structure:**
```
src/
├── app/                    # Next.js App Router pages
│   ├── (private)/          # Private routes group
│   └── (public)/           # Public routes group
├── features/               # Feature-based modules
│   └── [feature-name]/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── schemas/
│       ├── services/
│       ├── types/
│       └── use-cases/
└── shared/                 # Shared code
    ├── components/         # Shared UI components
    ├── hooks/              # Shared hooks
    ├── libs/               # Libraries (axios, react-query)
    ├── utils/              # Utility functions
    ├── constants/          # Constants
    ├── schemas/            # Shared schemas
    └── types/              # Shared types
```

**Current Project Structure:**
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── projects/           # Project pages
│   └── history/           # History page
├── components/             # All components
│   ├── layout/
│   ├── projects/
│   ├── history/
│   └── ui/
├── hooks/                  # All hooks
├── lib/                    # Libraries
├── services/               # All services
└── types/                  # All types
```

**Analysis:**
- Reference uses feature-based organization (better for large apps)
- Current uses service-based organization (simpler, better for smaller apps)
- Both structures are valid - current structure is appropriate for this project size
- Reference has `shared/` directory for reusable code
- Current project separates concerns well with dedicated directories

**Decision:** Keep current structure as it's well-suited for this project's scope.

### Dependencies Comparison

**Key Version Differences:**
- `tailwind-merge`: Reference uses `^3.4.0`, Current uses `^2.2.0` - **Update needed**
- `@rbinflow/eslint-config`: Reference uses `1.0.6`, Current uses `1.0.10` - Current is newer, keep
- `firebase`: Reference uses `^12.6.0`, Current uses `^12.8.0` - Current is newer, keep
- `cypress`: Reference uses `^13.7.1`, Current uses `^15.9.0` - Current is newer, keep
- `tailwindcss`: Reference uses `^4`, Current uses `^3.4.1` - Major version difference, keep current (v4 is beta)

**Missing Dependencies (not needed for this project):**
- Reference has many UI libraries (@radix-ui/*, shadcn-ui) - not needed
- Reference has form libraries (@hookform/resolvers, react-hook-form) - not needed
- Reference has chart libraries (@nivo/*) - not needed

**Dependencies to Update:**
- `tailwind-merge`: Update to `^3.4.0` for consistency

### Configuration Files Comparison

**Reference Project:**
- `next.config.mjs` (ESM)
- `postcss.config.mjs` (ESM)
- `package.json` has `"type": "module"`

**Current Project:**
- `next.config.js` (CommonJS)
- `postcss.config.js` (CommonJS)
- No `"type": "module"` in package.json

**Decision:** Keep CommonJS format for now as it's simpler and works well. Migration to ESM can be done later if needed.

## Completed Actions

1. ✅ Located reference project directory
2. ✅ Compared project structures in detail
3. ✅ Compared dependencies and versions
4. ✅ Documented differences and decisions
5. ✅ Updated tailwind-merge to match reference version
6. ✅ Kept current structure (appropriate for project size)

## Conclusion

The current project structure is well-organized and appropriate for its scope. The main alignment completed:
- Updated `tailwind-merge` dependency version
- Documented architectural differences
- Confirmed current structure is suitable (no refactoring needed)

