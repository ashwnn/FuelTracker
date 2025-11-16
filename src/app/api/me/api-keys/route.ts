import { NextRequest, NextResponse } from 'next/server';
import { authenticate, generateApiKey } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { createApiKeySchema } from '@/server/utils/validation';

// GET /api/me/api-keys - List all API keys for user
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/me/api-keys - Create new API key
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createApiKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { key, hash } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        keyHash: hash,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true,
      },
    });

    // Return the raw key only once
    return NextResponse.json({
      apiKey: {
        ...apiKey,
        key, // Only returned on creation
      },
      warning: 'Save this key securely. It will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
