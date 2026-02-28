import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// Must match agent_name in WorkerOptions in agent.py
const AGENT_NAME = 'voice-assistant';

export async function POST(req: NextRequest) {
    try {
        if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        // Parse request body from TokenSource.endpoint()
        const body = await req.json().catch(() => ({}));

        // Use provided room name or generate a unique one
        const roomName: string =
            body?.room_name ||
            `voice-assistant-${Math.random().toString(36).substring(2, 9)}`;

        const participantIdentity: string =
            body?.participant_identity ||
            `user-${Math.random().toString(36).substring(2, 9)}`;

        const participantName: string =
            body?.participant_name || 'User';

        // Parse room config from request body (for agent dispatch via RoomConfiguration)
        // This is the official LiveKit pattern — dispatch agent by embedding it in the JWT
        let roomConfig: RoomConfiguration | undefined;
        try {
            roomConfig = RoomConfiguration.fromJson(
                body?.room_config ?? {
                    agents: [{ agentName: AGENT_NAME }],
                },
                { ignoreUnknownFields: true }
            );
        } catch {
            // Fallback: construct config manually
            roomConfig = new RoomConfiguration({
                agents: [{ agentName: AGENT_NAME }],
            });
        }

        const participantToken = await createParticipantToken(
            { identity: participantIdentity, name: participantName },
            roomName,
            roomConfig
        );

        return NextResponse.json(
            {
                serverUrl: LIVEKIT_URL,
                roomName,
                participantName,
                participantToken,
                // Also return snake_case fields for TokenSourceResponse protocol compat
                server_url: LIVEKIT_URL,
                participant_token: participantToken,
            },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('[token] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Also support GET for backward compatibility
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get('room') || `voice-assistant-${Math.random().toString(36).substring(2, 9)}`;
    const identity = searchParams.get('identity') || `user-${Math.random().toString(36).substring(2, 9)}`;

    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const roomConfig = new RoomConfiguration({
        agents: [{ agentName: AGENT_NAME }],
    });

    const token = await createParticipantToken(
        { identity, name: 'User' },
        roomName,
        roomConfig
    );

    return NextResponse.json(
        {
            serverUrl: LIVEKIT_URL,
            roomName,
            participantToken: token,
            participantName: identity,
            server_url: LIVEKIT_URL,
            participant_token: token,
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}

function createParticipantToken(
    userInfo: AccessTokenOptions,
    roomName: string,
    roomConfig: RoomConfiguration
): Promise<string> {
    const at = new AccessToken(API_KEY, API_SECRET, {
        ...userInfo,
        ttl: '1h',
    });

    const grant: VideoGrant = {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
    };
    at.addGrant(grant);
    at.roomConfig = roomConfig;

    return at.toJwt();
}
