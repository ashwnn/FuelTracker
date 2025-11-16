import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { hashPassword } from '@/server/auth';
import { registerSchema } from '@/server/utils/validation';

export async function POST(req: NextRequest) {
  console.log('[REGISTER] Request received');
  
  // Check if registrations are disabled
  if (process.env.DISABLE_REGISTRATIONS === 'true') {
    console.log('[REGISTER] Registrations are disabled');
    return NextResponse.json(
      { error: 'Registrations are currently disabled' },
      { status: 403 }
    );
  }
  
  try {
    const body = await req.json();
    console.log('[REGISTER] Body parsed:', { email: body.email, passwordLength: body.password?.length });
    
    const parsed = registerSchema.safeParse(body);
    console.log('[REGISTER] Schema validation result:', parsed.success ? 'PASS' : 'FAIL');

    if (!parsed.success) {
      console.log('[REGISTER] Validation errors:', parsed.error.errors);
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    console.log('[REGISTER] Creating user for:', email);

    // Check if user already exists
    console.log('[REGISTER] Checking if user exists...');
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    console.log('[REGISTER] User exists check:', existing ? 'YES' : 'NO');

    if (existing) {
      console.log('[REGISTER] User already exists for email:', email);
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user
    console.log('[REGISTER] Hashing password...');
    const passwordHash = await hashPassword(password);
    console.log('[REGISTER] Password hash created, now creating user...');
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
    console.log('[REGISTER] User created successfully:', { id: user.id, email: user.email });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[REGISTER] Error message:', errorMessage);
    console.error('[REGISTER] Error stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          stack: errorStack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}
