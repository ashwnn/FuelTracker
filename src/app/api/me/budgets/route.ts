import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { z } from 'zod';

const budgetSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
});

// GET /api/me/budgets - Get user's budget
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const budget = await prisma.monthlyBudget.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Get budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/me/budgets - Create or update budget
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const budget = await prisma.monthlyBudget.upsert({
      where: { userId: user.id },
      update: {
        currency: parsed.data.currency,
        amount: parsed.data.amount,
      },
      create: {
        userId: user.id,
        currency: parsed.data.currency,
        amount: parsed.data.amount,
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Create/update budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/me/budgets - Delete user's budget
export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await prisma.monthlyBudget.delete({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
