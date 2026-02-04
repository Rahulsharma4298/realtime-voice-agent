"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  BarVisualizer,
  useVoiceAssistant,
  VoiceAssistantControlBar,
  DisconnectButton,
  useConnectionState,
  TrackToggle,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import "@livekit/components-styles";
import { useEffect, useState } from "react";

export default function Home() {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let userId = '';
        if (typeof window !== 'undefined') {
          userId = localStorage.getItem('livekit_user_id') || '';
          if (!userId) {
            userId = `user_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem('livekit_user_id', userId);
          }
        }

        const resp = await fetch(`/api/token?identity=${userId}`, { cache: 'no-store' });
        if (!resp.ok) {
          throw new Error(`Token fetch failed: ${resp.statusText}`);
        }
        const data = await resp.json();

        setToken(data.participantToken || data.token);
        setUrl(data.serverUrl || data.url);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to fetch token");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 max-w-md">
          <div className="text-red-400 font-medium mb-2">Connection Error</div>
          <div className="text-red-300/80 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (token === "") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-400 text-sm">Connecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={url}
        connect={token !== ""}
        className="h-full flex flex-col"
      >
        <RoomAudioRenderer />
        <StartAudio label="Click to enable audio" />

        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm py-4 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Voice Assistant</h1>
                <ConnectionStatus />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Full Height */}
        <div className="flex-1 flex px-6 py-4 overflow-hidden">
          <div className="w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Voice Visualizer */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex flex-col overflow-hidden">
                <VoiceVisualizer />
              </div>

              {/* Camera Preview */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl flex flex-col overflow-hidden">
                <CameraPreview />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <footer className="border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm py-3">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3">
              <VoiceAssistantControlBar
                controls={{ leave: false }}
                className="border-none"
              />
              <div className="w-px h-8 bg-slate-700" />
              <TrackToggle
                source={Track.Source.Camera}
                className="!scale-150 !mx-3"
              />
              <div className="w-px h-8 bg-slate-700" />
              <DisconnectButton>
                <span className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors inline-block cursor-pointer">
                  End Call
                </span>
              </DisconnectButton>
            </div>
          </div>
        </footer>
      </LiveKitRoom >
    </div >
  );
}

function ConnectionStatus() {
  const state = useConnectionState();

  if (state === ConnectionState.Connected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Connected</span>
      </div>
    );
  }

  if (state === ConnectionState.Connecting || state === ConnectionState.Reconnecting) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-400">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        <span>{state === ConnectionState.Reconnecting ? 'Reconnecting...' : 'Connecting...'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      <span>Disconnected</span>
    </div>
  );
}

function VoiceVisualizer() {
  const { state, audioTrack } = useVoiceAssistant();

  const getStatusText = () => {
    switch (state) {
      case 'listening': return 'Listening';
      case 'speaking': return 'Speaking';
      case 'thinking': return 'Processing';
      default: return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'listening': return 'text-blue-400';
      case 'speaking': return 'text-emerald-400';
      case 'thinking': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Animated Avatar */}
      {/* Animated Avatar */}
      <div className="flex justify-center mb-2 mt-32">
        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${state === 'speaking' ? 'bg-emerald-500/20 ring-4 ring-emerald-500/30' :
          state === 'listening' ? 'bg-blue-500/20 ring-4 ring-blue-500/30 animate-pulse' :
            'bg-slate-700/30'
          }`}>
          <svg className={`w-12 h-12 ${getStatusColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          {state === 'speaking' && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          style={{ height: "200px", width: "100%" }}
          options={{
            minHeight: 20,
            maxHeight: 200,
          }}
        />
      </div>
    </div>
  );
}

function CameraPreview() {
  const tracks = useTracks([Track.Source.Camera]);
  const cameraTrack = tracks.find((track) => track.source === Track.Source.Camera);

  // Check if camera is off: no track, not published, or muted
  const isCameraOff = !cameraTrack ||
    !cameraTrack.publication ||
    cameraTrack.publication.isMuted ||
    !cameraTrack.publication.isSubscribed;

  if (isCameraOff) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center min-h-[500px] bg-slate-900/50 rounded-lg w-full">
          <div className="text-center space-y-3">
            <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="text-slate-400 text-sm">
              Camera is off
            </div>
            <div className="text-slate-500 text-xs">
              Click the Camera button below to enable
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative rounded-lg overflow-hidden bg-slate-900 flex-1">
        <VideoTrack
          trackRef={cameraTrack}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-slate-300">Camera Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
