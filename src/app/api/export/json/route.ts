import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';

// GET /api/export/json - Export all user data as JSON
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all user data
    const [userDetails, vehicles, entries, budgets, apiKeys] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          defaultDistanceUnit: true,
          defaultVolumeUnit: true,
          defaultEconomyUnit: true,
          defaultCurrency: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.vehicle.findMany({
        where: { userId: user.id },
        include: {
          tanks: true,
        },
      }),
      prisma.fillUpEntry.findMany({
        where: { userId: user.id },
        include: {
          vehicle: {
            select: {
              name: true,
              make: true,
              model: true,
              year: true,
            },
          },
          tank: {
            select: {
              name: true,
              fuelType: true,
            },
          },
        },
        orderBy: { entryDate: 'desc' },
      }),
      prisma.monthlyBudget.findMany({
        where: { userId: user.id },
        // monthlyBudget in the Prisma schema doesn't have 'year' or 'month' fields.
        // Order by creation date instead to export most recent budgets first.
        orderBy: { createdAt: 'desc' },
      }),
      prisma.apiKey.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true,
          isActive: true,
          revokedAt: true,
        },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userDetails,
      vehicles,
      entries,
      budgets,
      apiKeys,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Export JSON error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
