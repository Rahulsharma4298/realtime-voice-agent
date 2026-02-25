import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Must match agent_name in WorkerOptions in agent.py
const AGENT_NAME = 'voice-assistant';

async function handleTokenRequest(req: NextRequest) {
    const roomName = 'voice-assistant-room';
    const { searchParams } = new URL(req.url);
    const identity = searchParams.get('identity') || 'User-' + Math.floor(Math.random() * 10000);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        console.error('[token] Missing env vars:', { apiKey: !!apiKey, apiSecret: !!apiSecret, wsUrl: !!wsUrl });
        return NextResponse.json(
            { error: 'Server misconfigured' },
            { status: 500 }
        );
    }

    // Build HTTPS URL for server-side API calls
    const httpUrl = wsUrl.replace(/^wss?:\/\//, 'https://');
    console.log(`[token] Using httpUrl: ${httpUrl}`);

    // Issue participant token
    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
    });
    const token = await at.toJwt();

    // Dispatch agent — only if not already dispatched to this room
    try {
        const dispatchClient = new AgentDispatchClient(httpUrl, apiKey, apiSecret);

        // Check if an agent already has an active dispatch for this room
        const existing = await dispatchClient.listDispatch(roomName);
        console.log(`[token] Existing dispatches for "${roomName}":`, existing.length);

        if (existing.length === 0) {
            const dispatch = await dispatchClient.createDispatch(roomName, AGENT_NAME);
            console.log(`[token] ✅ Dispatched agent "${AGENT_NAME}" → room "${roomName}", id: ${dispatch.id}`);
        } else {
            console.log(`[token] ℹ️  Agent already dispatched to "${roomName}", skipping.`);
        }
    } catch (err: any) {
        // Log full error so we can see what's going wrong in docker logs
        console.error(`[token] ❌ Agent dispatch FAILED:`, err?.message ?? err, err?.code ?? '');
    }

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
