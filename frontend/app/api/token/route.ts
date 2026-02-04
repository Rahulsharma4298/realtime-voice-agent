import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handleTokenRequest(req: NextRequest) {
    const roomName = 'voice-assistant-room';
    const { searchParams } = new URL(req.url);
    const identity = searchParams.get('identity') || 'User-' + Math.floor(Math.random() * 10000);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    // Use public URL if available (for client), otherwise fall back to internal URL
    const wsUrl = process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json(
            { error: 'Server misconfigured' },
            { status: 500 }
        );
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: identity,
    });

    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();

    // Return in the format expected by TokenSource.endpoint()
    return NextResponse.json({
        serverUrl: wsUrl,
        participantToken: token,
        participantName: identity,
    });
}

export async function GET(req: NextRequest) {
    return handleTokenRequest(req);
}

export async function POST(req: NextRequest) {
    return handleTokenRequest(req);
}
