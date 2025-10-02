#!/usr/bin/env node

/**
 * Apple App Store Connect MCP Bridge
 *
 * Provides MCP-compatible interface to Apple App Store Connect API
 * Based on the 165k line OpenAPI specification from vibe-frontend
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';
import fs from 'fs';

class AppStoreConnectBridge {
  constructor() {
    this.name = 'Apple App Store Connect';
    this.version = '1.0.0';
    this.connected = false;
    this.apiKey = null;
    this.keyId = null;
    this.issuerId = null;
    this.privateKey = null;
    this.token = null;
    this.tokenExpiry = null;

    // Initialize from environment variables
    this.initializeFromEnvironment();
  }

  initializeFromEnvironment() {
    try {
      this.apiKey = process.env.APPLE_API_KEY;
      this.keyId = process.env.APPLE_KEY_ID;
      this.issuerId = process.env.APPLE_ISSUER_ID;
      this.privateKey = process.env.APPLE_PRIVATE_KEY;

      if (this.apiKey && this.keyId && this.issuerId && this.privateKey) {
        this.connected = true;
        console.log('✅ Apple App Store Connect bridge initialized');
      } else {
        console.log('⚠️ Apple App Store Connect credentials not configured');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Apple App Store Connect:', error.message);
    }
  }

  generateJWT() {
    if (!this.privateKey || !this.keyId || !this.issuerId) {
      throw new Error('Apple App Store Connect credentials not configured');
    }

    // Check if token is still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiry = now + (20 * 60); // 20 minutes

    const payload = {
      iss: this.issuerId,
      iat: now,
      exp: expiry,
      aud: 'appstoreconnect-v1'
    };

    const header = {
      alg: 'ES256',
      kid: this.keyId,
      typ: 'JWT'
    };

    this.token = jwt.sign(payload, this.privateKey, { header });
    this.tokenExpiry = expiry * 1000; // Convert to milliseconds

    return this.token;
  }

  async makeAPIRequest(endpoint, method = 'GET', data = null) {
    if (!this.connected) {
      throw new Error('Apple App Store Connect not configured');
    }

    const token = this.generateJWT();
    const url = `https://api.appstoreconnect.apple.com${endpoint}`;

    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`App Store Connect API error: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
    }
  }

  getTools() {
    return [
      // App Management
      {
        name: 'list_apps',
        description: 'List all apps in your App Store Connect account',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum number of apps to return' },
            include: { type: 'string', description: 'Comma-separated list of related data to include' }
          }
        }
      },
      {
        name: 'get_app',
        description: 'Get detailed information about a specific app',
        inputSchema: {
          type: 'object',
          required: ['app_id'],
          properties: {
            app_id: { type: 'string', description: 'The app ID to retrieve' },
            include: { type: 'string', description: 'Related data to include (builds, betaGroups, etc.)' }
          }
        }
      },
      {
        name: 'create_app',
        description: 'Create a new app in App Store Connect',
        inputSchema: {
          type: 'object',
          required: ['bundle_id', 'name', 'platform', 'primary_locale'],
          properties: {
            bundle_id: { type: 'string', description: 'The app bundle identifier' },
            name: { type: 'string', description: 'The app name' },
            platform: { type: 'string', enum: ['IOS', 'MAC_OS', 'TV_OS'], description: 'The app platform' },
            primary_locale: { type: 'string', description: 'The primary locale (e.g., en-US)' },
            sku: { type: 'string', description: 'The app SKU' }
          }
        }
      },

      // Build Management
      {
        name: 'list_builds',
        description: 'List builds for an app',
        inputSchema: {
          type: 'object',
          properties: {
            app_id: { type: 'string', description: 'Filter builds by app ID' },
            version: { type: 'string', description: 'Filter by version number' },
            limit: { type: 'number', description: 'Maximum number of builds to return' }
          }
        }
      },
      {
        name: 'get_build',
        description: 'Get detailed information about a specific build',
        inputSchema: {
          type: 'object',
          required: ['build_id'],
          properties: {
            build_id: { type: 'string', description: 'The build ID to retrieve' },
            include: { type: 'string', description: 'Related data to include' }
          }
        }
      },

      // TestFlight Management
      {
        name: 'list_beta_groups',
        description: 'List TestFlight beta groups',
        inputSchema: {
          type: 'object',
          properties: {
            app_id: { type: 'string', description: 'Filter by app ID' },
            limit: { type: 'number', description: 'Maximum number of groups to return' }
          }
        }
      },
      {
        name: 'create_beta_group',
        description: 'Create a new TestFlight beta group',
        inputSchema: {
          type: 'object',
          required: ['name', 'app_id'],
          properties: {
            name: { type: 'string', description: 'The beta group name' },
            app_id: { type: 'string', description: 'The app ID for this beta group' },
            is_internal_group: { type: 'boolean', description: 'Whether this is an internal group' }
          }
        }
      },
      {
        name: 'list_beta_testers',
        description: 'List TestFlight beta testers',
        inputSchema: {
          type: 'object',
          properties: {
            beta_group_id: { type: 'string', description: 'Filter by beta group ID' },
            email: { type: 'string', description: 'Filter by tester email' },
            limit: { type: 'number', description: 'Maximum number of testers to return' }
          }
        }
      },
      {
        name: 'invite_beta_tester',
        description: 'Invite a new beta tester to TestFlight',
        inputSchema: {
          type: 'object',
          required: ['email', 'first_name', 'last_name'],
          properties: {
            email: { type: 'string', description: 'The tester email address' },
            first_name: { type: 'string', description: 'The tester first name' },
            last_name: { type: 'string', description: 'The tester last name' },
            beta_group_ids: { type: 'array', items: { type: 'string' }, description: 'Beta group IDs to add the tester to' }
          }
        }
      },

      // Analytics
      {
        name: 'get_app_analytics',
        description: 'Get analytics data for an app',
        inputSchema: {
          type: 'object',
          required: ['app_id'],
          properties: {
            app_id: { type: 'string', description: 'The app ID to get analytics for' },
            measures: { type: 'string', description: 'Comma-separated list of measures (installs, crashes, etc.)' },
            start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            granularity: { type: 'string', enum: ['P1D', 'PT1H'], description: 'Data granularity' }
          }
        }
      },

      // Sales and Finance
      {
        name: 'get_sales_reports',
        description: 'Get sales and financial reports',
        inputSchema: {
          type: 'object',
          required: ['report_type'],
          properties: {
            report_type: { type: 'string', enum: ['SALES', 'SUBSCRIPTION'], description: 'Type of sales report' },
            report_subtype: { type: 'string', enum: ['SUMMARY', 'DETAILED'], description: 'Report detail level' },
            frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], description: 'Report frequency' },
            report_date: { type: 'string', description: 'Report date (YYYY-MM-DD)' }
          }
        }
      },

      // App Store Versions
      {
        name: 'list_app_store_versions',
        description: 'List App Store versions for an app',
        inputSchema: {
          type: 'object',
          properties: {
            app_id: { type: 'string', description: 'Filter by app ID' },
            platform: { type: 'string', enum: ['IOS', 'MAC_OS', 'TV_OS'], description: 'Filter by platform' },
            state: { type: 'string', description: 'Filter by version state' }
          }
        }
      },
      {
        name: 'create_app_store_version',
        description: 'Create a new App Store version',
        inputSchema: {
          type: 'object',
          required: ['app_id', 'platform', 'version_string'],
          properties: {
            app_id: { type: 'string', description: 'The app ID' },
            platform: { type: 'string', enum: ['IOS', 'MAC_OS', 'TV_OS'], description: 'The platform' },
            version_string: { type: 'string', description: 'The version number (e.g., 1.0.0)' },
            copyright: { type: 'string', description: 'Copyright notice' }
          }
        }
      },

      // Certificates and Profiles
      {
        name: 'list_certificates',
        description: 'List signing certificates',
        inputSchema: {
          type: 'object',
          properties: {
            certificate_type: { type: 'string', description: 'Filter by certificate type' },
            limit: { type: 'number', description: 'Maximum number of certificates to return' }
          }
        }
      },
      {
        name: 'list_profiles',
        description: 'List provisioning profiles',
        inputSchema: {
          type: 'object',
          properties: {
            profile_type: { type: 'string', description: 'Filter by profile type' },
            profile_state: { type: 'string', description: 'Filter by profile state' },
            limit: { type: 'number', description: 'Maximum number of profiles to return' }
          }
        }
      },

      // Users and Roles
      {
        name: 'list_users',
        description: 'List users in your App Store Connect team',
        inputSchema: {
          type: 'object',
          properties: {
            roles: { type: 'string', description: 'Filter by user roles' },
            limit: { type: 'number', description: 'Maximum number of users to return' }
          }
        }
      },

      // Health Check
      {
        name: 'health_check',
        description: 'Check App Store Connect API connectivity',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async executeTool(toolName, parameters) {
    try {
      switch (toolName) {
        case 'health_check':
          return await this.healthCheck();

        case 'list_apps':
          return await this.listApps(parameters);

        case 'get_app':
          return await this.getApp(parameters);

        case 'create_app':
          return await this.createApp(parameters);

        case 'list_builds':
          return await this.listBuilds(parameters);

        case 'get_build':
          return await this.getBuild(parameters);

        case 'list_beta_groups':
          return await this.listBetaGroups(parameters);

        case 'create_beta_group':
          return await this.createBetaGroup(parameters);

        case 'list_beta_testers':
          return await this.listBetaTesters(parameters);

        case 'invite_beta_tester':
          return await this.inviteBetaTester(parameters);

        case 'get_app_analytics':
          return await this.getAppAnalytics(parameters);

        case 'get_sales_reports':
          return await this.getSalesReports(parameters);

        case 'list_app_store_versions':
          return await this.listAppStoreVersions(parameters);

        case 'create_app_store_version':
          return await this.createAppStoreVersion(parameters);

        case 'list_certificates':
          return await this.listCertificates(parameters);

        case 'list_profiles':
          return await this.listProfiles(parameters);

        case 'list_users':
          return await this.listUsers(parameters);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error executing ${toolName}:`, error);
      throw error;
    }
  }

  // Tool implementations
  async healthCheck() {
    try {
      const response = await this.makeAPIRequest('/v1/apps?limit=1');
      return {
        status: 'healthy',
        message: 'Successfully connected to App Store Connect API',
        timestamp: new Date().toISOString(),
        api_version: 'v1'
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async listApps(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.include) queryParams.append('include', params.include);

    const endpoint = `/v1/apps${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async getApp(params) {
    const { app_id, include } = params;
    const queryParams = new URLSearchParams();
    if (include) queryParams.append('include', include);

    const endpoint = `/v1/apps/${app_id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async createApp(params) {
    const { bundle_id, name, platform, primary_locale, sku } = params;

    const data = {
      data: {
        type: 'apps',
        attributes: {
          bundleId: bundle_id,
          name,
          platform,
          primaryLocale: primary_locale,
          sku: sku || bundle_id
        }
      }
    };

    return await this.makeAPIRequest('/v1/apps', 'POST', data);
  }

  async listBuilds(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.app_id) queryParams.append('filter[app]', params.app_id);
    if (params.version) queryParams.append('filter[version]', params.version);
    if (params.limit) queryParams.append('limit', params.limit);

    const endpoint = `/v1/builds${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async getBuild(params) {
    const { build_id, include } = params;
    const queryParams = new URLSearchParams();
    if (include) queryParams.append('include', include);

    const endpoint = `/v1/builds/${build_id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async listBetaGroups(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.app_id) queryParams.append('filter[app]', params.app_id);
    if (params.limit) queryParams.append('limit', params.limit);

    const endpoint = `/v1/betaGroups${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async createBetaGroup(params) {
    const { name, app_id, is_internal_group } = params;

    const data = {
      data: {
        type: 'betaGroups',
        attributes: {
          name,
          isInternalGroup: is_internal_group || false
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: app_id
            }
          }
        }
      }
    };

    return await this.makeAPIRequest('/v1/betaGroups', 'POST', data);
  }

  async listBetaTesters(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.beta_group_id) queryParams.append('filter[betaGroups]', params.beta_group_id);
    if (params.email) queryParams.append('filter[email]', params.email);
    if (params.limit) queryParams.append('limit', params.limit);

    const endpoint = `/v1/betaTesters${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async inviteBetaTester(params) {
    const { email, first_name, last_name, beta_group_ids } = params;

    const data = {
      data: {
        type: 'betaTesters',
        attributes: {
          email,
          firstName: first_name,
          lastName: last_name
        }
      }
    };

    if (beta_group_ids && beta_group_ids.length > 0) {
      data.data.relationships = {
        betaGroups: {
          data: beta_group_ids.map(id => ({
            type: 'betaGroups',
            id
          }))
        }
      };
    }

    return await this.makeAPIRequest('/v1/betaTesters', 'POST', data);
  }

  async getAppAnalytics(params) {
    const { app_id, measures, start_date, end_date, granularity } = params;

    const queryParams = new URLSearchParams();
    if (measures) queryParams.append('filter[measures]', measures);
    if (start_date) queryParams.append('filter[startTime]', start_date);
    if (end_date) queryParams.append('filter[endTime]', end_date);
    if (granularity) queryParams.append('granularity', granularity);

    const endpoint = `/v1/apps/${app_id}/analyticsReportRequests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async getSalesReports(params) {
    const { report_type, report_subtype, frequency, report_date } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('filter[reportType]', report_type);
    if (report_subtype) queryParams.append('filter[reportSubType]', report_subtype);
    if (frequency) queryParams.append('filter[frequency]', frequency);
    if (report_date) queryParams.append('filter[reportDate]', report_date);

    const endpoint = `/v1/salesReports?${queryParams.toString()}`;
    return await this.makeAPIRequest(endpoint);
  }

  async listAppStoreVersions(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.app_id) queryParams.append('filter[app]', params.app_id);
    if (params.platform) queryParams.append('filter[platform]', params.platform);
    if (params.state) queryParams.append('filter[appStoreState]', params.state);

    const endpoint = `/v1/appStoreVersions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async createAppStoreVersion(params) {
    const { app_id, platform, version_string, copyright } = params;

    const data = {
      data: {
        type: 'appStoreVersions',
        attributes: {
          platform,
          versionString: version_string,
          copyright
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: app_id
            }
          }
        }
      }
    };

    return await this.makeAPIRequest('/v1/appStoreVersions', 'POST', data);
  }

  async listCertificates(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.certificate_type) queryParams.append('filter[certificateType]', params.certificate_type);
    if (params.limit) queryParams.append('limit', params.limit);

    const endpoint = `/v1/certificates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async listProfiles(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.profile_type) queryParams.append('filter[profileType]', params.profile_type);
    if (params.profile_state) queryParams.append('filter[profileState]', params.profile_state);
    if (params.limit) queryParams.append('limit', params.limit);

    const endpoint = `/v1/profiles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  async listUsers(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.roles) queryParams.append('filter[roles]', params.roles);
    if (params.limit) queryParams.append('limit', params.limit);

    const endpoint = `/v1/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeAPIRequest(endpoint);
  }

  getStatus() {
    return {
      connected: this.connected,
      name: this.name,
      version: this.version,
      token_valid: this.token && this.tokenExpiry && Date.now() < this.tokenExpiry
    };
  }
}

// Export singleton instance
const appStoreConnectBridge = new AppStoreConnectBridge();
export default appStoreConnectBridge;