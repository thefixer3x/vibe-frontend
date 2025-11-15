#!/usr/bin/env node
/**
 * Script to update PM2 metadata for vibe-mcp process
 * 
 * Usage: node update-pm2-metadata.js
 */

// Try to require pm2, fallback to using PM2 CLI if module not found
let pm2;
try {
  pm2 = require('pm2');
} catch (err) {
  console.error('PM2 module not found. Installing...');
  console.error('Please run: npm install pm2 --save (or bun add pm2)');
  console.error('Or install globally: npm install -g pm2');
  process.exit(1);
}

const METADATA = {
  name: 'vibe-mcp',
  description: 'Unified MCP Gateway - Aggregates multiple MCP sources into a single endpoint',
  version: '1.0.0',
  author: 'Lanonasis',
  repository: 'https://github.com/lanonasis/vibe-frontend',
  keywords: ['mcp', 'gateway', 'model-context-protocol', 'websocket', 'sse'],
  environment: 'production',
  service: {
    type: 'gateway',
    protocol: ['http', 'websocket', 'sse'],
    ports: [7777, 7778],
    endpoints: {
      primary: '/mcp',
      health: '/health',
      admin: '/admin/add-source'
    }
  },
  sources: {
    core: {
      name: 'mcp-core',
      tools: 18,
      protocol: 'stdio'
    },
    'quick-auth': {
      name: 'quick-auth',
      tools: 0,
      protocol: 'http'
    },
    neon: {
      name: 'neon',
      tools: 0,
      protocol: 'sse'
    },
    appstore: {
      name: 'onasis-gateway',
      tools: 17,
      protocol: 'http'
    }
  },
  monitoring: {
    metrics: {
      enabled: true,
      interval: 5000,
      custom: true
    },
    logs: {
      error: '/var/log/pm2/vibe-mcp-error.log',
      output: '/var/log/pm2/vibe-mcp-out.log',
      application: '/var/log/mcp-gateway.log'
    }
  },
  performance: {
    maxMemory: '512M',
    nodeArgs: '--max-old-space-size=512',
    interpreter: 'tsx'
  }
};

pm2.connect((err) => {
  if (err) {
    console.error('Failed to connect to PM2:', err);
    process.exit(1);
  }

  // Find the vibe-mcp process
  pm2.list((err, processes) => {
    if (err) {
      console.error('Error listing processes:', err);
      pm2.disconnect();
      process.exit(1);
    }

    const process = processes.find((p) => p.name === 'vibe-mcp' || p.pm_id === 4);
    
    if (!process) {
      console.error('vibe-mcp process not found');
      pm2.disconnect();
      process.exit(1);
    }

    console.log(`Found process: ${process.name} (ID: ${process.pm_id})`);
    console.log('Updating metadata...');

    // Update process metadata using PM2 API
    // Note: PM2 doesn't have a direct metadata API, so we'll use environment variables
    // and create a metadata file that can be read by monitoring tools
    
    // Set environment variables for metadata
    const envVars = {
      PM2_METADATA_NAME: METADATA.name,
      PM2_METADATA_DESCRIPTION: METADATA.description,
      PM2_METADATA_VERSION: METADATA.version,
      PM2_METADATA_AUTHOR: METADATA.author,
      PM2_METADATA_REPOSITORY: METADATA.repository,
      PM2_METADATA_KEYWORDS: METADATA.keywords.join(','),
      PM2_METADATA_ENVIRONMENT: METADATA.environment,
      PM2_METADATA_SERVICE_TYPE: METADATA.service.type,
      PM2_METADATA_PORTS: METADATA.service.ports.join(','),
    };

    // Save metadata to a JSON file that can be read by monitoring tools
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(process.env.HOME || '/root', '.pm2', 'vibe-mcp-metadata.json');
    
    fs.writeFileSync(metadataPath, JSON.stringify(METADATA, null, 2));
    console.log(`Metadata saved to: ${metadataPath}`);

    // Update process with new environment variables
    pm2.reload('vibe-mcp', {
      updateEnv: true,
      env: envVars
    }, (err) => {
      if (err) {
        console.error('Error updating process:', err);
      } else {
        console.log('✓ Process metadata updated successfully');
        console.log('\nMetadata Summary:');
        console.log(`  Name: ${METADATA.name}`);
        console.log(`  Version: ${METADATA.version}`);
        console.log(`  Description: ${METADATA.description}`);
        console.log(`  Ports: ${METADATA.service.ports.join(', ')}`);
        console.log(`  Sources: ${Object.keys(METADATA.sources).length}`);
        console.log(`  Custom Metrics: ${METADATA.monitoring.metrics.enabled ? 'Enabled' : 'Disabled'}`);
      }
      
      pm2.disconnect();
    });
  });
});

