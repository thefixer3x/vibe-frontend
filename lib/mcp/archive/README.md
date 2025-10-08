# MCP Archive

This directory contains archived MCP-related files that are no longer actively used in the frontend but are kept for reference.

## Files

### unified-gateway.ts
- **Source**: VPS deployment at `/root/.claude/mcp-gateway/gateway.js`
- **Purpose**: Server-side unified MCP gateway implementation
- **Status**: Archived - This is a Node.js server implementation that was migrated from the VPS deployment
- **Note**: This file contains the working App Store Connect bridge integration that was successfully deployed on the VPS

## Migration Notes

The App Store Connect bridge functionality has been integrated into the vibe-frontend project through:
- Updated bridge files in `/lib/mcp/bridges/`
- API endpoints in `/app/api/appstore/`
- Frontend interface in `/app/(dashboard)/dashboard/appstore/`

The server-side gateway implementation is kept here for reference and potential future server-side deployments.
