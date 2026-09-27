# BioVera Architecture Guide

## 📐 Backend Architecture

### Folder Structure
```
backend/src/
├── common/              # Shared utilities, constants, filters
│   ├── constants/       # Application-wide constants
│   ├── dto/            # Base DTOs
│   ├── exceptions/     # Custom exceptions
│   ├── filters/        # Exception filters
│   └── utils/          # Utility functions
├── auth/               # Authentication module
│   ├── dto/            # DTOs for auth endpoints
│   ├── guards/         # Auth guards
│   ├── strategies/     # Passport strategies
│   └── decorators/     # Custom decorators
├── [feature]/          # Feature modules (estates, orders, etc.)
│   ├── dto/            # Feature-specific DTOs
│   ├── [feature].controller.ts
│   ├── [feature].service.ts
│   └── [feature].module.ts
└── prisma/             # Prisma service
```

### Key Principles

1. **DTOs (Data Transfer Objects)**
   - All API endpoints use DTOs for request/response validation
   - Use `class-validator` decorators for validation
   - DTOs are in `dto/` folder within each module

2. **Error Handling**
   - Custom exceptions in `common/exceptions/`
   - Global exception filter in `common/filters/`
   - Consistent error response format

3. **Validation**
   - Global `ValidationPipe` with whitelist enabled
   - Automatic transformation of payloads to DTO instances
   - Type-safe request handling

4. **Constants**
   - All constants in `common/constants/`
   - No magic numbers or strings in code

## 📱 Mobile Architecture

### Folder Structure
```
mobile/
├── app/                # Expo Router screens
│   ├── (auth)/        # Auth screens
│   ├── (buyer)/       # Buyer feature screens
│   ├── (producer)/    # Producer feature screens
│   └── [shared]/      # Shared screens
├── features/          # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── buyer/
│   ├── producer/
│   └── shared/
├── shared/            # Shared across features
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Shared hooks
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript types
│   └── constants/     # App constants
└── lib/               # Legacy (migrate to shared/)
```

### Key Principles

1. **Feature-Based Structure**
   - Each feature is self-contained
   - Features can be easily extracted or removed
   - Clear separation of concerns

2. **Shared Resources**
   - Common components in `shared/components/`
   - API services in `shared/services/`
   - Types in `shared/types/`

3. **Type Safety**
   - All API responses typed
   - No `any` types (unless absolutely necessary)
   - Shared types between frontend and backend

## 🔄 Migration Plan

### Phase 1: Backend DTOs ✅
- [x] Create base DTOs
- [x] Create auth DTOs
- [x] Add global validation pipe
- [x] Add exception filter
- [ ] Migrate all controllers to use DTOs

### Phase 2: Mobile Reorganization
- [ ] Create feature-based structure
- [ ] Move components to appropriate features
- [ ] Organize shared resources
- [ ] Update imports

### Phase 3: Type Safety
- [ ] Generate shared types from backend
- [ ] Remove all `any` types
- [ ] Add strict TypeScript checks

## 📝 Naming Conventions

### Backend
- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **DTOs**: `*.dto.ts` (e.g., `register-buyer.dto.ts`)
- **Modules**: `*.module.ts`
- **Guards**: `*.guard.ts`
- **Filters**: `*.filter.ts`

### Mobile
- **Screens**: `*.tsx` in `app/`
- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Hooks**: `use*.ts` (e.g., `useAuth.ts`)
- **Services**: `*.service.ts` (e.g., `api.service.ts`)
- **Types**: `*.types.ts` or `types.ts`

## 🎯 Best Practices

1. **Always use DTOs** for API endpoints
2. **Validate input** at the boundary (controller)
3. **Handle errors** consistently
4. **Type everything** - avoid `any`
5. **Keep features isolated** - minimal coupling
6. **Reuse shared code** - DRY principle
7. **Document complex logic** - comments where needed
