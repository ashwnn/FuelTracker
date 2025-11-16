import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';

// GET /api/me/budgets/[year]/[month]/usage - Get budget usage for a month
// Note: Budget is now single per user, but we still calculate usage per month
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { year, month } = await params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    // Get user's single budget
    const budget = await prisma.monthlyBudget.findUnique({
      where: { userId: user.id },
    });

    // Calculate spending for the requested month
    const monthStart = new Date(yearNum, monthNum - 1, 1);
    const monthEnd = new Date(yearNum, monthNum, 1);

    const entries = await prisma.fillUpEntry.findMany({
      where: {
        userId: user.id,
        entryDate: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    });

    const totalSpent = entries.reduce((sum, entry) => sum + Number(entry.totalCost), 0);

    let percentUsed = null;
    if (budget) {
      percentUsed = (totalSpent / Number(budget.amount)) * 100;
    }

    return NextResponse.json({
      budget: budget
        ? {
            amount: Number(budget.amount),
            currency: budget.currency,
          }
        : null,
      totalSpent,
      percentUsed,
      entryCount: entries.length,
    });
  } catch (error) {
    console.error('Get budget usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
