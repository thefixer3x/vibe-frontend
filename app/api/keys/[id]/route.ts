import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { encryptValue, decryptValue } from '@/lib/crypto/encryption';
import { eq, and } from 'drizzle-orm';

const updateKeySchema = z.object({
  keyValue: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/keys/[id] - Get specific API key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid key ID' },
        { status: 400 }
      );
    }

    // For now, use a mock team ID since auth is disabled
    const teamId = 1;

    const [key] = await db
      .select({
        id: apiKeys.id,
        service: apiKeys.service,
        keyName: apiKeys.keyName,
        isActive: apiKeys.isActive,
        lastUsed: apiKeys.lastUsed,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.teamId, teamId)));

    if (!key) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

// PUT /api/keys/[id] - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid key ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { keyValue, isActive } = updateKeySchema.parse(body);

    // For now, use a mock team ID since auth is disabled
    const teamId = 1;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (keyValue !== undefined) {
      updateData.encryptedValue = encryptValue(keyValue);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.teamId, teamId)))
      .returning({
        id: apiKeys.id,
        service: apiKeys.service,
        keyName: apiKeys.keyName,
        isActive: apiKeys.isActive,
        updatedAt: apiKeys.updatedAt,
      });

    if (!updatedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key: updatedKey,
      message: 'API key updated successfully'
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid key ID' },
        { status: 400 }
      );
    }

    // For now, use a mock team ID since auth is disabled
    const teamId = 1;

    const [deletedKey] = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.teamId, teamId)))
      .returning({
        id: apiKeys.id,
        service: apiKeys.service,
        keyName: apiKeys.keyName,
      });

    if (!deletedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'API key deleted successfully',
      key: deletedKey
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// POST /api/keys/[id]/reveal - Reveal encrypted API key value (temporary)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid key ID' },
        { status: 400 }
      );
    }

    // For now, use a mock team ID since auth is disabled
    const teamId = 1;

    const [key] = await db
      .select({
        id: apiKeys.id,
        service: apiKeys.service,
        keyName: apiKeys.keyName,
        encryptedValue: apiKeys.encryptedValue,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.teamId, teamId)));

    if (!key) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Decrypt the key value
    const decryptedValue = decryptValue(key.encryptedValue);

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));

    return NextResponse.json({
      keyValue: decryptedValue,
      service: key.service,
      keyName: key.keyName,
    });
  } catch (error) {
    console.error('Error revealing API key:', error);
    return NextResponse.json(
      { error: 'Failed to reveal API key' },
      { status: 500 }
    );
  }
}