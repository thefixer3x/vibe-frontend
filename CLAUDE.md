# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (enforced during builds)
- `npm run type-check` - Run TypeScript type checking (enforced during builds)

**Database Operations:**
- `npm run db:setup` - Initialize database schema
- `npm run db:seed` - Populate database with seed data
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio for database inspection

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