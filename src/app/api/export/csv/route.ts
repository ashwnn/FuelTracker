import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';

// GET /api/export/csv - Export entries as CSV
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req.headers);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    // Get entries
    const entries = await prisma.fillUpEntry.findMany({
      where: {
        userId: user.id,
        ...(vehicleId && { vehicleId: parseInt(vehicleId) }),
      },
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
      orderBy: { entryDate: 'asc' },
    });

    // Build CSV
    const headers = [
      'Entry Date',
      'Vehicle',
      'Tank',
      'Odometer (km)',
      'Fuel Volume (L)',
      'Total Cost',
      'Currency',
      'Price per Liter',
      'Fuel Type',
      'Fill Level',
      'Distance Since Last (km)',
      'Economy (L/100km)',
      'Economy (MPG)',
      'Cost per km',
      'Source',
    ];

    const rows = entries.map((entry) => [
      entry.entryDate.toISOString(),
      entry.vehicle.name,
      entry.tank?.name || '',
      entry.odometerKm.toString(),
      entry.fuelVolumeL.toString(),
      entry.totalCost.toString(),
      entry.currency,
      entry.pricePerLiter?.toString() || '',
      entry.fuelType,
      entry.fillLevel,
      entry.distanceSinceLastKm?.toString() || '',
      entry.economyLPer100Km?.toString() || '',
      entry.economyMpg?.toString() || '',
      entry.costPerKm?.toString() || '',
      entry.sourceType,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fueltracker-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
