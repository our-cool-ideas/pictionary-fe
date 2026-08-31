"use client";

import { useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { SocketContext } from "@/components/socket-provider";
import { RoomSessionContext, type RoomSessionActions } from "@/modules/room/context/room-session-provider";
import type { RoomSessionState } from "@/modules/room/context/room-session.type";
import { GameBoard } from "@/modules/room/components/game-board";
import { RoomNoticeScreen } from "@/modules/room/components/room-notice-screen";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_ID } from "@/modules/player/constants/avatar.constant";
import { TURN_TRANSITION_DELAY_MS } from "@/modules/room/constants/turn.constant";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import type { RoomPlayer, RoomState, ChatMessage } from "@/modules/room/types/room.type";
import type { DrawAction, TurnEndedPayload, TurnStartedPayload } from "@/modules/room/types/game.type";
import { cn } from "@/lib/utils";

// A fake but stable identity for "you" — GameBoard/ChatPanel/etc. only
// ever read `playerId` off useSocket(), never anything socket-shaped, so
// a real Socket instance/connection is never needed here at all.
const YOU_ID = "sandbox-you";
const BOT_NAMES = ["Riya", "Sam", "Jordan", "Priya", "Casey", "Marco", "Nina"];
const AVATAR_IDS = AVATAR_OPTIONS.map((a) => a.id);
const MOCK_WORD = "Rainbow";

function buildPlayers(count: number): RoomPlayer[] {
  const you: RoomPlayer = { playerId: YOU_ID, name: "You", avatarId: AVATAR_IDS[0] ?? DEFAULT_AVATAR_ID, isGuest: true, isHost: true, connected: true, joinedAt: Date.now() };
  const bots: RoomPlayer[] = Array.from({ length: Math.max(0, count - 1) }, (_, i) => ({
    playerId: `bot-${i + 1}`,
    name: BOT_NAMES[i % BOT_NAMES.length] ?? `Bot ${i + 1}`,
    avatarId: AVATAR_IDS[(i + 1) % AVATAR_IDS.length] ?? DEFAULT_AVATAR_ID,
    isGuest: true,
    isHost: false,
    connected: true,
    joinedAt: Date.now(),
  }));
  return [you, ...bots];
}

function buildRoom(players: RoomPlayer[]): RoomState {
  return {
    code: "TESTXX",
    hostPlayerId: YOU_ID,
    settings: { categoryId: "general", turnsPerPlayer: 3, targetScore: null, maxPlayers: 8, visibility: ROOM_VISIBILITY.PUBLIC },
    createdAt: Date.now(),
    emptySince: null,
    aloneSince: null,
    players,
  };
}

function buildScores(players: RoomPlayer[]): Record<string, number> {
  return Object.fromEntries(players.map((p, i) => [p.playerId, Math.max(0, (players.length - i) * 15 - 5)]));
}

// A plain module-level helper (not called during render) — same reasoning
// as makeTurn/buildRoom below using Date.now() directly: react-hooks'
// purity check flags an impure call made straight in a component body,
// even one that only actually runs from an event handler like goToView.
function mockNextTurnAt(): number {
  return Date.now() + TURN_TRANSITION_DELAY_MS;
}

function makeTurn(players: RoomPlayer[], drawerIsYou: boolean, turnNumber: number): TurnStartedPayload | null {
  const drawer = drawerIsYou ? players[0] : (players[1] ?? players[0]);
  if (!drawer) return null;
  return { turnNumber, drawerId: drawer.playerId, drawerName: drawer.name, wordLength: MOCK_WORD.length, turnEndsAt: Date.now() + 90_000, scores: buildScores(players) };
}

function systemMessage(text: string, isCorrectGuess = false): ChatMessage {
  return { id: `system-${Date.now()}-${Math.random()}`, playerId: "system", name: "System", message: text, sentAt: Date.now(), isSystem: true, isCorrectGuess };
}

function seedChatMessages(players: RoomPlayer[]): ChatMessage[] {
  const bot = players[1];
  const msgs: ChatMessage[] = [systemMessage(`${players[0]?.name ?? "You"} is drawing now — go!`)];
  if (bot) msgs.push({ id: "seed-1", playerId: bot.playerId, name: bot.name, message: "ooh is that an animal?", sentAt: Date.now() });
  if (bot) msgs.push(systemMessage(`${bot.name} guessed the word! 🎉`, true));
  return msgs;
}

type ViewMode = "pre-game" | "playing" | "turn-ended" | "kicked" | "closed";

const VIEW_MODE_LABEL: Record<ViewMode, string> = {
  "pre-game": "Pre-game",
  playing: "Playing",
  "turn-ended": "Turn ended",
  kicked: "Kicked",
  closed: "Room closed",
};

/**
 * `/test` — a local-only sandbox that renders the exact same screens
 * RoomPage would (GameBoard, RoomNoticeScreen) against
 * fabricated state instead of a real socket connection, so CSS/layout
 * work on the game HUD doesn't require actually running a room with a
 * second browser tab acting as another player every time. Nothing here
 * is linked from the app's real navigation.
 *
 * How this works: GameBoard and everything under it only ever reach the
 * app's real state through useSocket()/useRoomSession() — both are just
 * React context reads. This component re-provides fresh SocketContext /
 * RoomSessionContext values (with mock data and mock actions) around the
 * exact same production components, which is enough for them to render
 * and behave normally with zero changes to GameBoard/CanvasBoard/etc.
 * themselves. The real SocketProvider/RoomSessionProvider higher up in
 * the tree (root layout) are still mounted and still connect a real
 * (idle, room-less) socket in the background — harmless, just unrelated.
 */
export function GameBoardSandboxPage() {
  const [playerCount, setPlayerCount] = useState(4);
  const [youAreDrawer, setYouAreDrawer] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);

  const players = useMemo(() => buildPlayers(playerCount), [playerCount]);
  const room = useMemo(() => buildRoom(players), [players]);

  const [currentTurn, setCurrentTurn] = useState<TurnStartedPayload | null>(() => makeTurn(buildPlayers(4), true, 1));
  const [lastTurnResult, setLastTurnResult] = useState<TurnEndedPayload | null>(null);
  const [correctGuesserIds, setCorrectGuesserIds] = useState<string[]>([]);
  const [yourWord, setYourWord] = useState<string | null>(MOCK_WORD);
  const [youWereKicked, setYouWereKicked] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [strokes, setStrokes] = useState<DrawAction[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => seedChatMessages(buildPlayers(4)));
  // Popped-undo history for the mock redo() — mirrors the real backend's
  // undo/redo pairing closely enough for CSS/interaction testing, without
  // needing the actual server round trip STROKE_HISTORY relies on.
  const redoStackRef = useRef<DrawAction[]>([]);

  const viewMode: ViewMode = youWereKicked ? "kicked" : roomClosed ? "closed" : currentTurn ? "playing" : lastTurnResult ? "turn-ended" : "pre-game";

  function goToView(mode: ViewMode) {
    setYouWereKicked(mode === "kicked");
    setRoomClosed(mode === "closed");
    if (mode === "pre-game") {
      setCurrentTurn(null);
      setLastTurnResult(null);
      setCorrectGuesserIds([]);
      setYourWord(null);
      setStrokes([]);
      redoStackRef.current = [];
    } else if (mode === "playing") {
      const turn = makeTurn(players, youAreDrawer, (currentTurn?.turnNumber ?? 0) + 1);
      if (!turn) return;
      setCurrentTurn(turn);
      setLastTurnResult(null);
      setCorrectGuesserIds([]);
      setYourWord(turn.drawerId === YOU_ID ? MOCK_WORD : null);
      setStrokes([]);
      redoStackRef.current = [];
      setChatMessages((prev) => [...prev, systemMessage(`${turn.drawerName} is drawing now — go!`)]);
    } else if (mode === "turn-ended") {
      const drawerId = currentTurn?.drawerId ?? players[0]?.playerId ?? YOU_ID;
      setLastTurnResult({
        word: MOCK_WORD,
        drawerId,
        correctGuesserIds,
        scores: currentTurn?.scores ?? buildScores(players),
        reason: "timeout",
        nextTurnAt: mockNextTurnAt(),
      });
      setCurrentTurn(null);
      setYourWord(null);
      setChatMessages((prev) => [...prev, systemMessage(`Turn over — the word was "${MOCK_WORD}".`)]);
    }
  }

  function setDrawer(isYou: boolean) {
    setYouAreDrawer(isYou);
    const drawer = isYou ? players[0] : (players[1] ?? players[0]);
    if (!drawer) return;
    setCurrentTurn((prev) => (prev ? { ...prev, drawerId: drawer.playerId, drawerName: drawer.name } : prev));
    setYourWord(isYou ? MOCK_WORD : null);
  }

  const state: RoomSessionState = {
    room,
    currentTurn,
    yourWord,
    correctGuesserIds,
    lastTurnResult,
    chatMessages,
    strokes,
    youWereKicked,
    roomClosed,
  };

  const actions: RoomSessionActions = {
    async createRoom() {
      return { ok: false, message: "Not available in the sandbox", code: null };
    },
    async joinRoom() {
      return { ok: false, message: "Not available in the sandbox", code: null };
    },
    async leaveRoom() {
      goToView("pre-game");
    },
    async kickPlayer(playerId) {
      setPlayerCount((c) => Math.max(1, c - 1));
      void playerId;
      return { ok: true, message: "Kicked (sandbox)" };
    },
    async sendMessage(message) {
      setChatMessages((prev) => [...prev, { id: `you-${Date.now()}`, playerId: YOU_ID, name: "You", message, sentAt: Date.now() }]);
      return { ok: true, message: "" };
    },
    async startGame() {
      goToView("playing");
      return { ok: true, message: "" };
    },
    submitStroke(stroke) {
      if (!currentTurn) return;
      setStrokes((prev) => [...prev, { kind: "stroke", ...stroke, drawerId: currentTurn.drawerId }]);
      redoStackRef.current = [];
    },
    submitFill(fill) {
      if (!currentTurn) return;
      setStrokes((prev) => [...prev, { kind: "fill", ...fill, drawerId: currentTurn.drawerId }]);
      redoStackRef.current = [];
    },
    clearCanvas() {
      setStrokes([]);
      redoStackRef.current = [];
    },
    async undo() {
      setStrokes((prev) => {
        if (prev.length === 0) return prev;
        const popped = prev[prev.length - 1];
        if (popped) redoStackRef.current.push(popped);
        return prev.slice(0, -1);
      });
      return { ok: true, message: "" };
    },
    async redo() {
      const popped = redoStackRef.current.pop();
      if (popped) setStrokes((prev) => [...prev, popped]);
      return { ok: true, message: "" };
    },
  };

  const mockSocket = useMemo(() => ({}) as unknown as Socket, []);

  function renderScreen() {
    if (youWereKicked) return <RoomNoticeScreen variant="kicked" />;
    if (roomClosed) return <RoomNoticeScreen variant="closed" />;
    return <GameBoard />;
  }

  return (
    <SocketContext.Provider value={{ socket: mockSocket, playerId: YOU_ID, isConnected: true }}>
      <RoomSessionContext.Provider value={{ state, actions }}>
        {renderScreen()}

        {/* Floating, fixed-position dev panel — deliberately NOT part of
            the document flow, so it can't shift or shrink anything
            GameBoard renders. What's on screen behind it is exactly what
            production renders at this viewport size. */}
        <div className="fixed right-4 bottom-4 z-[100] flex flex-col items-end gap-2 font-play-body">
          {panelOpen && (
            <div className="flex w-72 flex-col gap-3 rounded-2xl border-[3px] border-play-ink bg-white p-3 text-play-ink shadow-[5px_5px_0_var(--color-play-ink)]">
              <p className="font-play-display text-xs font-bold tracking-wide text-play-ink/60 uppercase">🧪 Test sandbox — /test</p>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold tracking-wide text-play-ink/45 uppercase">Screen</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(VIEW_MODE_LABEL) as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => goToView(mode)}
                      className={cn(
                        "rounded-lg border-2 border-play-ink px-2 py-1 text-xs font-bold transition-transform",
                        viewMode === mode ? "translate-x-0.5 bg-play-blue text-white" : "bg-white text-play-ink",
                      )}
                    >
                      {VIEW_MODE_LABEL[mode]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold tracking-wide text-play-ink/45 uppercase">Drawer</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    className={cn("rounded-lg border-2 border-play-ink px-2 py-1 text-xs font-bold", youAreDrawer ? "bg-play-blue text-white" : "bg-white")}
                  >
                    You draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    className={cn("rounded-lg border-2 border-play-ink px-2 py-1 text-xs font-bold", !youAreDrawer ? "bg-play-blue text-white" : "bg-white")}
                  >
                    Bot draws
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold tracking-wide text-play-ink/45 uppercase">Players ({playerCount})</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPlayerCount((c) => Math.max(1, c - 1))}
                    className="rounded-lg border-2 border-play-ink bg-white px-2 py-1 text-xs font-bold"
                  >
                    − Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlayerCount((c) => Math.min(8, c + 1))}
                    className="rounded-lg border-2 border-play-ink bg-white px-2 py-1 text-xs font-bold"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="rounded-full border-2 border-play-ink bg-white px-3 py-1.5 text-xs font-bold text-play-ink shadow-[3px_3px_0_var(--color-play-ink)]"
          >
            {panelOpen ? "Hide test panel" : "🧪 Test panel"}
          </button>
        </div>
      </RoomSessionContext.Provider>
    </SocketContext.Provider>
  );
}
