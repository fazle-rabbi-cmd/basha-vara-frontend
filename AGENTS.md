# Basha Vara - Agent Coding Rules

**Purpose:** This document provides rules and guidelines for AI agents (and developers) working on the Basha Vara project.

**Last Updated:** November 6, 2026

**Related Documentation:**
- Architecture: `docs/ARCHITECTURE.md`
- Business Rules: `docs/BUSINESS_RULES.md`
- API Specification: `docs/API_SPECIFICATION.md`
- Database Dictionary: `docs/DATABASE_DICTIONARY.md`
- Security: `docs/SECURITY.md`
- Design System: `docs/DESIGN_SYSTEM.md`
- UI Components: `docs/UI_COMPONENTS.md`
- UI Improvement Plan: `docs/UI_IMPROVEMENT_PLAN.md`
- Project Status: `PROJECT_STATUS.md`
- Roadmap: `ROADMAP.md`
- Performance Optimization: `docs/PERFORMANCE.md`
- OTA Updates: `docs/OTA_UPDATES.md`
- Branding Guide: `docs/BRANDING_GUIDE.md`
- Mobile App Setup: `docs/MOBILE_APP_SETUP.md`
- GitHub Actions Build: `docs/GITHUB_ACTIONS_BUILD_GUIDE.md`

---

## Core Principles

### 1. Free-First Strategy
- **ALL services must use free tiers initially**
- No AWS, no paid cloud services unless absolutely necessary
- Only upgrade to paid tiers when hitting free-tier limits
- Preferred free services:
  - Hosting: Vercel (frontend), Render/Railway (backend)
  - Database: Supabase, Neon, Railway
  - Storage: Cloudinary, Supabase Storage
  - Email: Resend (3,000 emails/month free)
  - Maps: Leaflet + OpenStreetMap (completely free)
  - Push: Firebase FCM (completely free)
  - Redis: Redis Cloud free tier or local Redis

### 2. Local Development First
- Always ensure features work locally before considering deployment
- Use Docker Compose for PostgreSQL locally
- Test everything in local development environment
- Deployment is deferred until after local development is complete

### 3. No Destructive Operations Without Permission
- Never run `DROP TABLE`, `DELETE FROM`, or similar destructive commands without explicit user confirmation
- Never reset database with real data without permission
- Always backup before destructive operations

### 4. Code Quality Standards
- Follow existing code patterns in the codebase
- Don't reinvent the wheel - use existing libraries and utilities
- Write compact, idiomatic code
- Avoid excessive error handling - error boundaries at the right level
- Do NOT add or remove comments unless asked

### 5. Technology Constraints
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** NestJS 12, TypeScript, Prisma, PostgreSQL
- **Mobile:** Capacitor (no React Native - wraps existing Next.js app)
- **No new dependencies** without checking if already used in project
- Prefer packages published at least 7 days ago (security)

### 6. Database Rules
- Use UUID primary keys
- Store monetary values as Decimal or integers (never float)
- Normalize emails and phone numbers
- Ensure unique constraints
- Use indexes on frequently queried fields
- Foreign key relationships with proper cascade behavior
- Use transactions for multi-step operations

### 7. Security Rules
- Never commit secrets or API keys to Git
- Never log sensitive data (passwords, tokens)
- Use bcryptjs or argon2id for password hashing
- Implement RBAC (Role-Based Access Control)
- Validate all inputs with class-validator
- Use environment variables for configuration
- HttpOnly secure cookies or access/refresh tokens

### 8. API Design
- REST API versioned under `/api/v1`
- Use DTOs with class-validator for validation
- Return consistent response formats
- Implement proper error handling (401, 403, 404, 500)
- Document with Swagger/OpenAPI
- Use pagination for list endpoints

### 9. Frontend Rules
- Mobile-first responsive design
- Use existing UI components when possible
- Maintain existing design system
- Implement loading states for all async operations
- Handle errors gracefully with user-friendly messages
- Use TypeScript types matching backend DTOs

### 10. Testing Rules
- Write tests before fixing bugs (when possible)
- Test happy path and error cases
- Test RBAC enforcement
- Test frontend-backend integration
- Aim for >80% test coverage

---

## Project Structure

```
basha-vara/
├── frontend/           # Next.js frontend
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── features/      # Feature-specific components
│   ├── lib/           # Utilities
│   └── types/         # TypeScript types
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── admin/     # Admin module
│   │   ├── auth/      # Authentication module
│   │   ├── common/    # Shared utilities
│   │   ├── properties/# Properties module
│   │   ├── users/     # Users module
│   │   └── ...
│   └── prisma/        # Database schema and migrations
└── docs/              # Documentation
```

---

## Workflow Rules

### Before Making Changes
1. Read existing code to understand patterns
2. Check if similar functionality already exists
3. Verify technology choices match project stack
4. Consider impact on existing features

### During Development
1. Make incremental changes
2. Test frequently
3. Run linters before committing
4. Ensure builds pass

### Branch and Release Workflow
- Develop normally on the `dev` branch.
- Push changes to `dev` and open a pull request from `dev` into `main`.
- Merge the pull request through GitHub after review and verification.
- After merging, update the local `main` branch before creating any release tag.
- Never create a release tag, publish an APK, or trigger a production release automatically.
- Before any release action, explicitly ask the user: "Do you want to release this version now?"
- Only create and push a `v*.*.*` tag after the user confirms the release.
- Update `APP_VERSION` and increment `APP_BUILD_NUMBER` only for an intentional APK release.
- Web-only changes do not require a version bump, APK build, or release tag.

### After Making Changes
1. Verify the feature works end-to-end
2. Test on different screen sizes (mobile)
3. Update relevant documentation
4. Commit with clear, descriptive messages

### Session Resumption Workflow
When starting a new session (new login or session timeout):

1. **Read Key Documentation First**
   - Read `ROADMAP.md` to understand current phase and task status
   - Read `AGENTS.md` for coding rules and patterns
   - Read `PROJECT_STATUS.md` (if exists) for latest progress notes
   - Check recent git history: `git log --oneline -10`

2. **Understand Current State**
   - Identify which tasks are marked as completed
   - Note any in-progress tasks or blockers
   - Check which phase is currently active

3. **Before Ending a Session**
   - Update `ROADMAP.md` to mark completed tasks with `[x]`
   - If significant progress made, update "Last Updated" date in relevant docs
   - Make a git commit with descriptive message explaining what was done
   - If session interrupted mid-task, add a note to `PROJECT_STATUS.md` describing:
     - What was being worked on
     - Current state (partial implementation, error encountered, etc.)
     - Next steps to continue

4. **Git Commit Pattern**
   ```
   git commit -m "$(cat <<'EOF'
feat: complete 5.1 API client infrastructure

- Created centralized API client with interceptors
- Added JWT token injection and refresh logic
- Implemented typed API response interfaces
- Added loading state utilities and retry logic

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
   ```

5. **Why This Matters**
   - AI sessions are ephemeral - no memory across different logins
   - Documentation + git history provides persistent context
   - Manual documentation is reliable and works with any tool
   - Forces clear thinking about progress and state

---

## Phase-Specific Rules

### Phase 5: Frontend Integration
- Create centralized API client in `frontend/lib/api-client.ts`
- Replace mock data with live API calls
- Implement authentication context/provider
- Connect all user dashboards to backend
- Implement loading and error states
- Test all API integrations

### Phase 6: Verification
- Write unit tests for backend services
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Run security audit
- Verify production builds work locally
- Optimize performance

### Phase 6.5: Notifications
- Implement in-app notifications (database)
- Set up email notifications (Resend free)
- Set up push notifications (Firebase FCM free)
- Use Redis + BullMQ for job queuing
- Test all notification channels

### Phase 6.6: Mobile Packaging
- Use Capacitor (do NOT use React Native)
- Test on emulators and physical devices
- Ensure location features work on mobile
- Test map rendering on mobile
- Build APK/AAB for Android
- Build IPA for iOS (if Mac available)

### Phase 7: Deployment
- Use free-tier hosting only
- Vercel for frontend
- Render/Railway for backend
- Supabase/Neon for database
- Cloudinary for storage
- No AWS, no paid services

---

## Common Patterns

### Error Handling
```typescript
// Backend
try {
  // operation
} catch (error) {
  throw new BadRequestException('User-friendly error message');
}

// Frontend
try {
  await apiCall();
} catch (error) {
  // Show user-friendly error message
  // Log error for debugging
}
```

### Validation
```typescript
// Backend DTO
export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDecimal()
  rentAmount: Decimal;
}
```

### Authentication Check
```typescript
// Backend guard
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
async getMyProperties() { ... }
```

---

## What to Avoid

❌ Adding new dependencies without checking existing ones
❌ Reinventing existing utilities
❌ Hardcoding values (use environment variables)
❌ Committing secrets or API keys
❌ Skipping validation
❌ Ignoring mobile responsiveness
❌ Using paid services when free alternatives exist
❌ Running destructive database operations without permission
❌ Adding unnecessary comments
❌ Creating overly complex solutions

---

## Learned Information

### Local Development Setup

**Database Setup:**
- Use Docker Compose for PostgreSQL locally
- Database runs on port 5433 (not 5432 to avoid conflicts)
- Connection string: `postgresql://basha_vara_user:local_dev_password_change_me@localhost:5433/basha_vara?schema=public`
- Run migrations: `cd backend && npx prisma migrate dev`
- Seed database: `cd backend && npx prisma db seed`
- Open Prisma Studio: `cd backend && npx prisma studio`

**Quick Start Commands:**
```bash
# Start database
docker-compose up -d

# Start backend
cd backend
npm run start:dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

**Alternative: Use startup scripts:**
- Windows: `start-dev.bat`
- Mac/Linux: `./start-dev.sh`

**Environment Variables:**
- Backend: See `backend/.env.example` and `docs/ENVIRONMENT_VARIABLES.md`
- Frontend: Create `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`

**Testing:**
- Backend unit tests: `cd backend && npm run test` (58 tests passing)
- Frontend E2E tests: `cd frontend && npm run test:e2e`
- Integration tests require running database

**Build Verification:**
- Backend: `cd backend && npm run build` (TypeScript compilation)
- Frontend: `cd frontend && npm run build` (Next.js production build)

**Security Notes:**
- JWT access token expiration set to 15 minutes (fixed from 7 days)
- See `docs/SECURITY_AUDIT.md` for complete security review
- All secrets must be set via environment variables
- Never commit `.env` files

**Documentation:**
- Local Development Guide: `docs/LOCAL_DEVELOPMENT_SETUP.md`
- Environment Variables: `docs/ENVIRONMENT_VARIABLES.md`
- Security Audit: `docs/SECURITY_AUDIT.md`
- Mobile App Setup: `docs/MOBILE_APP_SETUP.md`

**Mobile App Packaging (Capacitor):**
- Capacitor installed: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- Capacitor initialized with app ID: `com.bashavara.app`
- Config file: `frontend/capacitor.config.ts`
- To add Android platform: `cd frontend && npx cap add android`
- To sync web assets: `cd frontend && npx cap sync android`
- To open in Android Studio: `cd frontend && npx cap open android`
- Android Studio installation required for APK/AAB builds
- See `docs/MOBILE_APP_SETUP.md` for complete guide

**OTA (Over-The-Air) Updates:**
- App uses live web URL: `https://basha-vara-frontend-beta.vercel.app`
- Updates are automatic when deploying to Vercel
- No APK redistribution needed for UI/UX changes
- Only rebuild APK for native plugin changes
- See `docs/OTA_UPDATES.md` for complete guide

**Performance Optimizations:**
- Next.js configured with SWC minification
- Image optimization with AVIF/WebP formats
- Package import optimization for lucide-react
- CSS optimization enabled
- Hardware acceleration enabled in Android
- Server-side rendering for initial page load
- See `docs/PERFORMANCE.md` for complete guide

**App Branding:**
- Custom app icon with house design and teal gradient
- Modern splash screen with animation
- Brand colors: Primary #14b8a6, Dark #0d9488, Accent #2dd4bf
- Generated via `@capacitor/assets` from SVG sources
- Source files in `frontend/resources/`
- See `docs/BRANDING_GUIDE.md` for customization

**GitHub Actions Build:**
- Automatic APK build on push to dev/main branches
- Branding assets auto-generated during build
- Workflow file: `.github/workflows/build-android-apk.yml`
- See `docs/GITHUB_ACTIONS_BUILD_GUIDE.md` for usage

---

## When to Ask Questions

Ask the user for clarification when:
- A business decision is unclear (e.g., "should X feature allow Y?")
- Security implications are uncertain
- Multiple valid approaches exist and user preference matters
- A destructive operation is about to be performed
- Adding a new technology/library to the stack

Do NOT ask for clarification on:
- How to implement standard patterns (use existing code as reference)
- Which library to use (check what's already in the project)
- Code style (follow existing patterns)
- Database schema design (follow Prisma schema patterns)

---

## Verification Checklist

Before considering a task complete:
- [ ] Code follows existing patterns
- [ ] No linting errors
- [ ] Build passes (both frontend and backend)
- [ ] Feature works end-to-end
- [ ] Mobile responsive (if applicable)
- [ ] Error handling implemented
- [ ] No secrets committed
- [ ] Documentation updated (if needed)

---

## Notes

- This document is a living document - update it as rules evolve
- When in doubt, prefer simplicity over complexity
- The goal is a maintainable, scalable, free-tier-first application
- Local development is the priority before deployment
