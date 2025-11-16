import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';

export async function GET(req: NextRequest) {
  console.log('[AUTH ME] Request received');
  
  try {
    console.log('[AUTH ME] Authenticating...');
    const user = await authenticate(req.headers);
    console.log('[AUTH ME] Authentication result:', user ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');

    if (!user) {
      console.log('[AUTH ME] User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[AUTH ME] Fetching user details for id:', user.id);
    // Get full user details
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        defaultDistanceUnit: true,
        defaultVolumeUnit: true,
        defaultEconomyUnit: true,
        defaultCurrency: true,
        createdAt: true,
      },
    });

    if (!userDetails) {
      console.log('[AUTH ME] User not found in database for id:', user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[AUTH ME] Returning user details:', { id: userDetails.id, email: userDetails.email });
    return NextResponse.json({ user: userDetails });
  } catch (error) {
    console.error('[AUTH ME] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AUTH ME] Error message:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
