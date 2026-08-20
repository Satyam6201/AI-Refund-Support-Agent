import { NextResponse } from 'next/server';
import { validateOpenAIConfig } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = validateOpenAIConfig();
  const isSimulated = process.env.SIMULATE_AI_FAILURE === 'true';

  let status: 'available' | 'unconfigured' | 'simulated_failure' = 'available';
  if (isSimulated) {
    status = 'simulated_failure';
  } else if (!config.configured) {
    status = 'unconfigured';
  }

  return NextResponse.json(
    {
      provider: 'openai',
      configured: config.configured,
      model: config.model,
      status,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
