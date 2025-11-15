# PM2 Metrics Integration Guide for unified-gateway.ts

This guide shows how to integrate the PM2 metrics module into your unified-gateway.ts file.

## Integration Steps

### 1. Import the metrics module at the top of unified-gateway.ts

Add this import after your other imports:

```typescript
import { getMetrics } from './pm2-metrics';
```

### 2. Initialize metrics after logger setup

Add this after the logger initialization (around line 60):

```typescript
// Initialize PM2 metrics
const metrics = getMetrics();
metrics.connect().catch((err) => {
  logger.error('Failed to initialize PM2 metrics:', err);
});
```

### 3. Add metrics middleware for HTTP requests

Add this middleware after `app.use(express.json())` (around line 283):

```typescript
// Metrics middleware for HTTP requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    metrics.recordHttpRequest(req.path, success, responseTime);
  });
  
  next();
});
```

### 4. Update WebSocket connection handlers

In the `handleWebSocketConnection` function (around line 269), add:

```typescript
primaryWss.on('connection', (ws) => {
  metrics.recordWebSocketConnection();
  handleWebSocketConnection(ws, PRIMARY_PORT);
  
  ws.on('close', () => {
    metrics.recordWebSocketDisconnection();
  });
  
  ws.on('message', (message) => {
    metrics.recordWebSocketMessage(false); // received
  });
});

fallbackWss.on('connection', (ws) => {
  metrics.recordWebSocketConnection();
  handleWebSocketConnection(ws, FALLBACK_PORT);
  
  ws.on('close', () => {
    metrics.recordWebSocketDisconnection();
  });
  
  ws.on('message', (message) => {
    metrics.recordWebSocketMessage(false); // received
  });
});
```

### 5. Track tool calls

In the tool call handler (around line 200), wrap the tool call:

```typescript
} else if (method === 'tools/call') {
  const toolName = params.name;
  const [sourceId] = toolName.split('_');
  const originalToolName = toolName.substring(sourceId.length + 1);
  const startTime = Date.now();
  
  try {
    // ... existing tool call logic ...
    
    const responseTime = Date.now() - startTime;
    metrics.recordToolCall(sourceId, originalToolName, true, responseTime);
    
    // ... send response ...
  } catch (error) {
    const responseTime = Date.now() - startTime;
    metrics.recordToolCall(sourceId, originalToolName, false, responseTime);
    throw error;
  }
}
```

### 6. Update database pool metrics

Add this after the dbPool initialization (around line 95):

```typescript
// Update database metrics periodically
if (dbPool) {
  setInterval(() => {
    const pool = dbPool as any;
    metrics.updateDatabaseMetrics(
      pool.totalCount || 0,
      pool.totalCount - (pool.idleCount || 0),
      pool.idleCount || 0
    );
  }, 5000);
  
  // Track query errors
  dbPool.on('error', (error) => {
    metrics.recordDatabaseQuery(false);
  });
}
```

### 7. Track source health

In your source health check logic, add:

```typescript
// Example: when checking source availability
metrics.updateSourceHealth(sourceId, isAvailable);
```

### 8. Add metrics endpoint (optional)

Add a new endpoint to expose metrics:

```typescript
app.get('/metrics', (req, res) => {
  res.json({
    status: 'ok',
    metrics: metrics.getMetrics(),
    timestamp: Date.now()
  });
});
```

### 9. Graceful shutdown

Add cleanup on process termination:

```typescript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  metrics.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  metrics.stop();
  process.exit(0);
});
```

## Installation

Make sure to install the pm2 package if not already installed:

```bash
npm install pm2 --save
# or
bun add pm2
```

## Testing

After integration, you can test the metrics by:

1. Making requests to your gateway
2. Checking the `/metrics` endpoint (if added)
3. Using `pm2 describe vibe-mcp` to see process information
4. Checking PM2 logs for metrics output

