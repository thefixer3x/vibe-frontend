# PM2 Custom Metrics and Metadata for vibe-mcp

This directory contains custom metrics and metadata configuration for the vibe-mcp PM2 process (ID: 4).

## Files

- **pm2-metrics.ts** - Custom metrics module that tracks application-specific metrics
- **update-pm2-metadata.js** - Script to update PM2 process metadata
- **ecosystem.config.updated.cjs** - Updated ecosystem config with metadata
- **integrate-metrics.md** - Integration guide for adding metrics to unified-gateway.ts
- **apply-pm2-updates.sh** - Automated script to apply all updates

## Quick Start

### 1. Apply Updates

```bash
cd /opt/lanonasis/vibe-frontend/lib/mcp/gateway
./apply-pm2-updates.sh
```

### 2. Integrate Metrics

Follow the guide in `integrate-metrics.md` to add metrics tracking to your `unified-gateway.ts` file.

### 3. Restart Process

```bash
pm2 restart vibe-mcp
```

## Custom Metrics Tracked

The metrics module tracks:

### HTTP Metrics
- Total requests
- Success/error counts
- Requests by endpoint
- Response times (avg, p95, p99)
- Request rate (requests/second)

### WebSocket Metrics
- Active connections
- Total connections
- Messages sent/received
- Connection lifecycle

### Tool Call Metrics
- Total tool calls
- Calls by source
- Calls by tool name
- Error rate
- Average response time

### Database Metrics
- Connection pool size
- Active/idle connections
- Query count
- Query errors

### Source Health Metrics
- Available/unavailable sources
- Last health check time
- Per-source status

## Viewing Metrics

### Via PM2 CLI

```bash
# View process details
pm2 describe vibe-mcp

# Monitor in real-time
pm2 monit

# View logs
pm2 logs vibe-mcp
```

### Via HTTP Endpoint

If you add the `/metrics` endpoint (see integration guide), you can access:

```bash
curl http://localhost:7777/metrics
```

### Via Metadata File

```bash
cat ~/.pm2/vibe-mcp-metadata.json
```

## Metadata

The metadata includes:
- Service description and version
- Author and repository information
- Service configuration (ports, endpoints)
- Source information
- Monitoring configuration

## Updating Metadata

To update metadata, run:

```bash
node update-pm2-metadata.js
```

Or edit the `METADATA` object in `update-pm2-metadata.js` and run the script again.

## Integration Example

Here's a minimal example of how to use metrics in your code:

```typescript
import { getMetrics } from './pm2-metrics';

const metrics = getMetrics();

// Initialize
await metrics.connect();

// Track HTTP request
metrics.recordHttpRequest('/mcp', true, 150); // endpoint, success, responseTime

// Track tool call
metrics.recordToolCall('core', 'list_tools', true, 200);

// Track WebSocket connection
metrics.recordWebSocketConnection();

// Get current metrics
const currentMetrics = metrics.getMetrics();
console.log(currentMetrics);
```

## Troubleshooting

### Metrics not appearing

1. Check that metrics module is imported and initialized
2. Verify PM2 connection: `pm2 list`
3. Check logs: `pm2 logs vibe-mcp`
4. Ensure pm2 package is installed: `npm list pm2`

### Metadata not updating

1. Verify process name: `pm2 describe vibe-mcp`
2. Check script permissions: `chmod +x update-pm2-metadata.js`
3. Check metadata file: `cat ~/.pm2/vibe-mcp-metadata.json`

### TypeScript compilation errors

The metrics module uses TypeScript. Make sure:
- `tsx` is installed and working
- Type definitions for `pm2` are available
- Node.js version is compatible

## Advanced Usage

### Custom Metric Reporting Interval

Edit `pm2-metrics.ts` and change the interval in `startReporting()`:

```typescript
this.updateInterval = setInterval(() => {
  this.reportMetrics();
}, 10000); // Change from 5000 to 10000 for 10-second intervals
```

### Adding Custom Metrics

Extend the `Metrics` interface and add tracking methods:

```typescript
// In pm2-metrics.ts
interface Metrics {
  // ... existing metrics
  custom: {
    myMetric: number;
  };
}

// Add tracking method
public recordCustomMetric(value: number): void {
  this.metrics.custom.myMetric = value;
}
```

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs vibe-mcp`
2. Review integration guide: `integrate-metrics.md`
3. Check PM2 documentation: https://pm2.keymetrics.io/

