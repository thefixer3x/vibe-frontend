import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { encryptValue, decryptValue } from '@/lib/crypto/encryption';
import { eq, and, desc } from 'drizzle-orm';

const createKeySchema = z.object({
  service: z.string().min(1),
  keyName: z.string().min(1),
  keyValue: z.string().min(1),
});

const testKeySchema = z.object({
  service: z.string().min(1),
  keyValue: z.string().min(1),
});

// GET /api/keys - List API keys for current team
export async function GET() {
  try {
    // For now, return mock data to avoid database issues in development
    const mockKeys = [
      {
        id: 1,
        service: 'stripe',
        keyName: 'STRIPE_SECRET_KEY',
        isActive: true,
        lastUsed: null,
        createdAt: new Date().toISOString(),
        maskedValue: 'stripe_****1'
      },
      {
        id: 2,
        service: 'openai',
        keyName: 'OPENAI_API_KEY',
        isActive: true,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        maskedValue: 'openai_****2'
      }
    ];

    return NextResponse.json({ keys: mockKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, keyName, keyValue } = createKeySchema.parse(body);

    // For now, use mock values since auth is disabled
    const teamId = 1;
    const userId = 1;

    // Encrypt the API key value
    const encryptedValue = encryptValue(keyValue);

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        teamId,
        service,
        keyName,
        encryptedValue,
        createdBy: userId,
      })
      .returning({
        id: apiKeys.id,
        service: apiKeys.service,
        keyName: apiKeys.keyName,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      });

    return NextResponse.json({
      key: newKey,
      message: 'API key created successfully'
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// POST /api/keys/test - Test API key validity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, keyValue } = testKeySchema.parse(body);

    // Test the API key based on service type
    let isValid = false;
    let testResult = '';

    switch (service.toLowerCase()) {
      case 'stripe':
        isValid = await testStripeKey(keyValue);
        testResult = isValid ? 'Stripe key is valid' : 'Stripe key is invalid';
        break;
      case 'openai':
        isValid = await testOpenAIKey(keyValue);
        testResult = isValid ? 'OpenAI key is valid' : 'OpenAI key is invalid';
        break;
      case 'github':
        isValid = await testGitHubKey(keyValue);
        testResult = isValid ? 'GitHub key is valid' : 'GitHub key is invalid';
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported service for testing' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      valid: isValid,
      message: testResult,
      service
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to test API key' },
      { status: 500 }
    );
  }
}

// Helper functions to test API keys
async function testStripeKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.stripe.com/v1/charges', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function testOpenAIKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function testGitHubKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        'Authorization': `token ${key}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}