"use client";

import { useMemo, useState } from "react";
import {
  SessionProvider,
  RoomAudioRenderer,
  StartAudio,
  BarVisualizer,
  useAgent,
  useSession,
  useSessionContext,
  VoiceAssistantControlBar,
  DisconnectButton,
  TrackToggle,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { TokenSource } from "livekit-client";
import { Track } from "livekit-client";
import "@livekit/components-styles";

const AGENT_NAME = "voice-assistant";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [pendingRoomName, setPendingRoomName] = useState<string | null>(null);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name:
              pendingRoomName && pendingRoomName.trim() !== ""
                ? pendingRoomName.trim().toLowerCase().replace(/\s+/g, "-")
                : undefined,
            room_config: { agents: [{ agentName: AGENT_NAME }] },
          }),
        });
        if (!res.ok) throw new Error("Token fetch failed");
        return await res.json();
      }),
    [pendingRoomName]
  );

  const session = useSession(tokenSource, { agentName: AGENT_NAME });

  return (
    <SessionProvider session={session}>
      <RoomAudioRenderer />
      <StartAudio label="Click to enable audio" />
      <AppLayout
        roomName={roomName}
        setRoomName={setRoomName}
        setPendingRoomName={setPendingRoomName}
      />
    </SessionProvider>
  );
}

function AppLayout({
  roomName,
  setRoomName,
  setPendingRoomName,
}: {
  roomName: string;
  setRoomName: (v: string) => void;
  setPendingRoomName: (v: string | null) => void;
}) {
  const { isConnected, start } = useSessionContext();

  if (!isConnected) {
    return (
      <WelcomeScreen
        roomName={roomName}
        setRoomName={setRoomName}
        onStart={(name) => {
          setPendingRoomName(name || null);
          start();
        }}
      />
    );
  }

  return <SessionScreen />;
}

/* ──────────────────────────────────────────────
   Welcome Screen
────────────────────────────────────────────── */
function WelcomeScreen({
  roomName,
  setRoomName,
  onStart,
}: {
  roomName: string;
  setRoomName: (v: string) => void;
  onStart: (roomName: string) => void;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4 py-10">
      {/* Glowing background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-7">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-blue-600/20 ring-2 ring-blue-500/40 flex items-center justify-center backdrop-blur-sm">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Voice Assistant</h1>
          <p className="text-slate-400 text-sm mt-1">Powered by LiveKit + Gemini</p>
        </div>

        {/* Form */}
        <div className="w-full space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Room Name <span className="text-slate-600 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onStart(roomName)}
            placeholder="e.g. my-team-room"
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 text-sm transition-all backdrop-blur-sm"
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            Leave empty to start a solo session, or enter a name to share with others.
          </p>
        </div>

        {/* CTA */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => onStart(roomName)}
            className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-blue-600/20 text-sm"
          >
            {roomName.trim() ? "Join / Create Room" : "Start Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Session Screen
────────────────────────────────────────────── */
function SessionScreen() {
  return (
    <div className="h-[100dvh] bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6 py-3">
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-white leading-tight">Voice Assistant</h1>
            <AgentStatus />
          </div>
        </div>
      </header>

      {/* Main — scrollable on very small screens */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
        <div className="w-full max-w-5xl mx-auto h-full">
          {/* On mobile: stacked; on lg: side-by-side */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 h-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-6 flex flex-col min-h-[280px] lg:min-h-0">
              <VoiceVisualizer />
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col min-h-[240px] lg:min-h-0">
              <CameraPreview />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-center flex-wrap gap-2 sm:gap-3">
          <VoiceAssistantControlBar
            controls={{ leave: false }}
            className="border-none"
          />
          <div className="hidden sm:block w-px h-6 bg-slate-700 flex-shrink-0" />
          <TrackToggle
            source={Track.Source.Camera}
            className="flex-shrink-0"
          />
          <div className="hidden sm:block w-px h-6 bg-slate-700 flex-shrink-0" />
          <DisconnectButton>
            <span className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              End Call
            </span>
          </DisconnectButton>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Agent Status Badge
────────────────────────────────────────────── */
function AgentStatus() {
  const { state } = useAgent();

  const statusMap: Record<string, { color: string; dot: string; label: string }> = {
    speaking: { color: "text-emerald-400", dot: "bg-emerald-400", label: "Speaking" },
    listening: { color: "text-blue-400", dot: "bg-blue-400", label: "Listening" },
    thinking: { color: "text-yellow-400", dot: "bg-yellow-400", label: "Thinking" },
    connecting: { color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse", label: "Connecting…" },
    initializing: { color: "text-slate-400", dot: "bg-slate-400 animate-pulse", label: "Initializing…" },
  };

  const info = statusMap[state ?? ""] ?? { color: "text-slate-500", dot: "bg-slate-500", label: "Ready" };

  return (
    <div className={`flex items-center gap-1.5 text-xs ${info.color} mt-0.5`}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${info.dot}`} />
      <span className="truncate">{info.label}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Voice Visualizer
────────────────────────────────────────────── */
function VoiceVisualizer() {
  const { state, microphoneTrack } = useAgent();

  const avatarClass =
    state === "speaking"
      ? "bg-emerald-500/20 ring-4 ring-emerald-500/30"
      : state === "listening"
        ? "bg-blue-500/20 ring-4 ring-blue-500/30 animate-pulse"
        : "bg-slate-700/30";

  const iconClass =
    state === "speaking" ? "text-emerald-400"
      : state === "listening" ? "text-blue-400"
        : "text-slate-400";

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6">
      {/* Avatar */}
      <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${avatarClass}`}>
        <svg className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-300 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
        {state === "speaking" && (
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        )}
      </div>

      {/* Bar Visualizer */}
      <div className="w-full">
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={microphoneTrack}
          style={{ height: "120px", width: "100%" }}
          options={{ minHeight: 15 }}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Camera Preview
────────────────────────────────────────────── */
function CameraPreview() {
  const tracks = useTracks([Track.Source.Camera]);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);

  const isCameraOff =
    !cameraTrack ||
    !cameraTrack.publication ||
    cameraTrack.publication.isMuted ||
    !cameraTrack.publication.isSubscribed;

  if (isCameraOff) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500 text-sm">Camera off</p>
          <p className="text-slate-600 text-xs">Toggle camera below to enable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-xs text-slate-300">Live</span>
        </div>
      </div>
    </div>
  );
}
