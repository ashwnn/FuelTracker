import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { GoogleGenAI } from '@google/genai';

interface FuelReceiptData {
  date?: string;
  amount?: number;
  volume?: number;
  pricePerLiter?: number;
  currency?: string;
  fuelType?: string;
  confidence?: number;
}

// POST /api/vehicles/[id]/entries/photo - Process photo and create entry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[ENTRY PHOTO] Request received');
  
  try {
    const user = await authenticate(req.headers);
    console.log('[ENTRY PHOTO] Authentication:', user ? 'OK' : 'FAILED');
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const vehicleId = parseInt(id);
    console.log('[ENTRY PHOTO] Vehicle ID:', vehicleId);

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: user.id },
    });

    if (!vehicle) {
      console.log('[ENTRY PHOTO] Vehicle not found');
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Parse FormData
    const formData = await req.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      console.log('[ENTRY PHOTO] No photo provided');
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    console.log('[ENTRY PHOTO] Photo received:', { name: photo.name, size: photo.size, type: photo.type });

    // Convert photo to base64
    console.log('[ENTRY PHOTO] Converting photo to base64...');
    const photoBuffer = await photo.arrayBuffer();
    const base64Photo = Buffer.from(photoBuffer).toString('base64');

    // Initialize Gemini AI client
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('[ENTRY PHOTO] GEMINI_API_KEY not found in environment');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Call Gemini Vision to analyze the receipt
    console.log('[ENTRY PHOTO] Sending photo to Gemini for analysis...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze this fuel receipt image and extract the following information in JSON format:
{
  "date": "YYYY-MM-DD format or null if not found",
  "amount": "Total amount paid (number or null)",
  "volume": "Fuel volume in liters (number or null)",
  "pricePerLiter": "Price per liter (number or null)",
  "currency": "Currency code (e.g., USD, EUR) or null",
  "fuelType": "Type of fuel (e.g., GASOLINE, DIESEL, ELECTRIC) or null",
  "confidence": "Confidence level 0-100"
}

If any information cannot be extracted, set it to null. Respond ONLY with the JSON object, no additional text.`,
            },
            {
              inlineData: {
                mimeType: photo.type || 'image/jpeg',
                data: base64Photo,
              },
            },
          ],
        },
      ],
    });

    console.log('[ENTRY PHOTO] Gemini response received');
    
    // Parse the AI response
    let fuelData: FuelReceiptData = {
      confidence: 0,
    };

    if (response.candidates && response.candidates[0]) {
      const content = response.candidates[0].content;
      if (content && content.parts && content.parts[0] && 'text' in content.parts[0]) {
        const text = (content.parts[0] as { text?: string }).text;
        console.log('[ENTRY PHOTO] AI Response text:', text);
        
        if (text) {
          try {
            fuelData = JSON.parse(text);
            console.log('[ENTRY PHOTO] Parsed fuel data:', fuelData);
          } catch (parseError) {
            console.error('[ENTRY PHOTO] Failed to parse AI response:', parseError);
            // Try to extract JSON from markdown code blocks or raw text
            let jsonStr = text;
            
            // Remove markdown code blocks if present
            const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
              jsonStr = codeBlockMatch[1];
            }
            
            // Extract JSON object
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                fuelData = JSON.parse(jsonMatch[0]);
                console.log('[ENTRY PHOTO] Extracted fuel data from response:', fuelData);
              } catch (secondParseError) {
                console.error('[ENTRY PHOTO] Failed to extract JSON:', secondParseError);
              }
            }
          }
        }
      }
    }

    // Return extracted data for user to review and confirm
    console.log('[ENTRY PHOTO] Returning extracted data for user confirmation');
    
    // Map fuel type to frontend format
    let frontendFuelType = fuelData.fuelType || 'GASOLINE';
    if (frontendFuelType === 'REGULAR') frontendFuelType = 'GASOLINE';
    if (frontendFuelType === 'OTHER') frontendFuelType = 'ELECTRIC';

    // Return pre-fill data without creating entry
    const preFilledData = {
      entryDate: fuelData.date || new Date().toISOString().split('T')[0],
      fuelVolumeL: fuelData.volume || '',
      totalCost: fuelData.amount || '',
      currency: fuelData.currency || 'USD',
      fuelType: frontendFuelType,
      pricePerLiter: fuelData.pricePerLiter || null,
      aiConfidence: fuelData.confidence || 0,
    };

    console.log('[ENTRY PHOTO] Returning pre-filled data:', preFilledData);
    
    return NextResponse.json({ 
      prefilledData: preFilledData,
      message: 'Photo processed. Please review and adjust the extracted data before saving.',
    }, { status: 200 });
  } catch (error) {
    console.error('[ENTRY PHOTO] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ENTRY PHOTO] Error message:', errorMessage);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    }, { status: 500 });
  }
}
