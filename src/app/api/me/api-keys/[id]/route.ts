import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';

// DELETE /api/me/api-keys/[id] - Revoke an API key
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const keyId = parseInt(id);

    // Update the API key to revoke it
    const result = await prisma.apiKey.updateMany({
      where: {
        id: keyId,
        userId: user.id,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
