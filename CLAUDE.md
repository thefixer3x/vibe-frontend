# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build production version
- `bun run start` - Start production server
- `bun run lint` - Run ESLint (enforced during builds)
- `bun run type-check` - Run TypeScript type checking (enforced during builds)

**Database Operations:**
- `bun run db:setup` - Initialize database schema
- `bun run db:seed` - Populate database with seed data
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Apply database migrations
- `bun run db:studio` - Open Drizzle Studio for database inspection

## Project Architecture

**Vibe** is a universal API warehouse and VPS management platform built with Next.js 15. The application provides centralized management for APIs, server monitoring, and various integrations.

### Core Structure

**App Router Layout:**
- `app/(dashboard)/` - Protected dashboard routes with shared layout
- `app/(login)/` - Authentication routes (sign-in, sign-up)
- `app/api/` - API routes for backend functionality

**Key Features:**
1. **API Management** - Universal API integration and testing platform
2. **VPS Server Management** - SSH terminal, file management, system monitoring
3. **Memory System** - Knowledge base with vector search capabilities
4. **MCP Integration** - Model Context Protocol for AI agent interactions
5. **Authentication** - JWT-based session management with bcrypt password hashing

### Database Schema

Uses Drizzle ORM with PostgreSQL. Key tables:
- `users` - User accounts with role-based access
- `teams` - Team management with Stripe integration
- `team_members` - User-team relationships
- `activity_logs` - Audit trail for all actions
- `invitations` - Team invitation system

Database configured in `drizzle.config.ts` with schema at `lib/db/schema.ts`.

### Authentication Architecture

**Session Management:**
- JWT tokens with 24-hour expiration
- HttpOnly cookies for secure token storage
- Password hashing with bcrypt (10 salt rounds)
- Session verification in `lib/auth/session.ts`

**Current State:** Authentication is temporarily disabled in middleware but infrastructure remains intact.

### Key Integration Points

**MCP (Model Context Protocol):**
- Client implementation in `lib/mcp/client.ts`
- Memory service integration for AI context
- WebSocket connections for real-time communication

**Memory System:**
- Vector-based semantic search
- Components in `components/memory/`
- API routes at `/api/memory/`

**Apple App Store Connect:**
- API integration for app management
- Configuration in `lib/apple/appstore.ts`
- OpenAPI spec in `app_store_connect_api_openapi.json`

### Security Configuration

**Headers:** Comprehensive security headers in `next.config.ts` including CSP, XSS protection, and HSTS.

**Environment Variables Required:**
- `POSTGRES_URL` - Database connection
- `AUTH_SECRET` - JWT signing key
- Various API keys for integrations (Picsart, OpenAI, GitHub, Stripe, etc.)

### Component Architecture

**UI Framework:**
- Tailwind CSS for styling
- shadcn/ui components in `components/ui/`
- Radix UI primitives for accessibility

**State Management:**
- SWR for data fetching and caching
- React hooks for component state
- Custom hooks in `lib/hooks/`

## Development Notes

**Build Requirements:**
- ESLint and TypeScript checks are enforced during builds
- Use `npm run type-check` before committing
- Database setup required before first run

**Testing Structure:**
- Test results stored in `test-results/` directory
- Authentication flow tests available for multiple browsers

**Deployment:**
- Vercel-optimized configuration
- Netlify deployment configuration in `netlify.toml`
- Image optimization disabled for better compatibility

## Current State & Development Plan

### Recently Completed (January 2025)
✅ **Secure API Key Management System**
- AES-256-GCM encryption for sensitive credentials storage
- Complete CRUD interface at `/dashboard/secrets`
- Service enablement based on configured API keys
- Real-time testing and validation of API connections
- Database schema with encrypted storage in `apiKeys` table

### Phased Development Plan

**PHASE 1: Foundation & UX (Priority: High)**
- 🔧 Fix hardcoded "ACME" branding - make configurable
- 🎨 Implement typography refinements and consistent design system
- 🌐 Add internationalization (i18n) support for language switching
- 🐛 Fix memory page console errors in `lib/memory/client.ts:318`
- 📱 Improve responsive design across all dashboard pages

**PHASE 2: AI & Integration (Priority: Medium)**
- 🤖 Enable AI orchestrator integration using `components/orchestrator/`
- 🔗 Fix MCP (Model Context Protocol) connection and networking issues
- ⚡ Enhance WebSocket stability for real-time AI interactions
- 🧠 Integrate memory system with AI orchestrator for context awareness
- 🔄 Implement API key rotation and management workflows

**PHASE 3: Monitoring & Reliability (Priority: Medium)**
- 📊 Enhanced service monitoring with health checks and metrics
- 🚨 Comprehensive error handling and user feedback systems
- 📈 Performance monitoring and optimization
- 🔒 Advanced security features and audit logging
- 📋 Service usage analytics and reporting

### Critical Dependencies
- **Database**: PostgreSQL with Drizzle ORM migrations current
- **MCP Client**: `lib/mcp/client.ts` requires network stability fixes
- **Memory Service**: Vector search implementation needs error handling
- **API Services**: `lib/services/api-service.ts` provides encryption layer

### Known Issues
1. Memory page throwing server errors in `MemoryClient.getMemoryStats`
2. MCP WebSocket connections may be unstable
3. Hardcoded branding throughout UI components
4. Missing i18n infrastructure for multi-language support
5. Typography inconsistencies across dashboard