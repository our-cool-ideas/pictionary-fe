# pictionary-fe

Frontend for the Pictionary-style multiplayer drawing game — both the guest-facing player app (`/`, `/room/[code]`) and the `/admin` panel live here. Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + TanStack React Query + react-hook-form + socket.io-client. Talks to [pictionary-be](../pictionary-be) over REST (admin CRUD, public categories) and Socket.IO (rooms/gameplay).

## Stack

- **Next.js 16** — App Router, `proxy.ts` (the renamed `middleware.ts` — see below)
- **shadcn/ui** on **Base UI** (not Radix — this shadcn version switched primitives; several APIs differ from older shadcn docs/training data, see "Gotchas" below)
- **TanStack React Query** — all server state
- **react-hook-form** + **zod** (`@hookform/resolvers`) — all form state/validation
- **Tailwind v4** — theme via CSS variables in `globals.css`, violet primary
- **jose** — JWT verification in `proxy.ts`
- **socket.io-client** — the player app's direct connection to the backend's realtime server (see "Player app" below)

## Getting started

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `BACKEND_API_URL` — the Fastify backend's URL (e.g. `http://localhost:4000`). **Server-only** (no `NEXT_PUBLIC_` prefix) — used by the admin BFF proxy; the client bundle never sees it.
- `NEXT_PUBLIC_SOCKET_URL` — the backend's Socket.IO endpoint (e.g. `http://localhost:4000`). **Public on purpose** — unlike the admin panel, the player app has no login step or BFF proxy for realtime traffic, so the browser connects to Socket.IO directly.
- `JWT_SECRET` — **must be identical** to `pictionary-be`'s `JWT_SECRET`. This app never issues tokens, only verifies them (for the `proxy.ts` route gate).

```bash
npm run dev
```

Visit `/admin` — you'll be redirected to `/admin/login`. Log in with an admin account (bootstrap one via `pictionary-be`'s `npm run db:seed:admin` if you haven't already).

## Architecture: `app/` + global `components/`/`hooks/` + `modules/`

```
src/
  app/                    # ROUTING ONLY — every file here is a server component.
                            # Each page.tsx just imports and renders a page component
                            # from the matching module's pages/ folder. No hooks, no
                            # "use client", no business logic lives here.
  components/             # GLOBAL, reused across modules: app-sidebar.tsx, providers.tsx,
                            # components/ui/ (shadcn-generated, don't hand-edit)
  hooks/                  # GLOBAL hooks only — currently just session state
                            # (use-current-user.ts, use-logout.ts) needed by the sidebar
                            # (a global component) and more than one module. Anything
                            # only one module needs belongs in that module's own hooks/,
                            # not here.
  lib/                     # Cross-cutting infra that isn't a component or a hook:
                            # api-client.ts, env.ts, jwt.ts, query-client.ts,
                            # constants/, enums/ (USER_TYPE — see below), types/
                            # (ApiResponse/ApiError, Pagination, User — genuinely
                            # shared domain types, not owned by one module)
  modules/
    auth/                   # login page + its own hook/validation/types
    categories/             # full CRUD: page, table, form dialog, delete dialog,
                              # hooks, types, validation, constants
    words/                    # same shape, plus its own local enum (WORD_DIFFICULTY)
    app-config/                 # same shape, plus its own local enum (APP_CONFIG_TYPE)
    users/                       # list + role select (no create/delete — the
                                  # backend doesn't expose those either)
    player/                        # home page: name entry + create-room form
                                    # (public categories hook lives here too)
    room/                           # everything room/gameplay-owned: socket-backed
                                     # RoomSessionContext, lobby, canvas, chat,
                                     # scoreboard, turn HUD, game-over/kicked/closed
                                     # screens, and room-page.tsx (the orchestrator
                                     # app/room/[code]/page.tsx renders)
  proxy.ts                # gates /admin/* — see Auth architecture below
```

Each module has its own subset of: `components/`, `hooks/`, `pages/`, `types/`, `constants/`, `enums/`, `validation/` — only the ones it actually needs (e.g. `categories/` has no `enums/` since it doesn't own one). `pages/` holds the actual page component an `app/` route renders; nothing gets rendered directly from `app/`.

**Global vs. local is a real judgment call, not just "used more than once":**
- `USER_TYPE` lives in `lib/enums/` (global) because `proxy.ts`, an API route handler, and the users module all need it — it's not owned by any single module.
- `WORD_DIFFICULTY` / `APP_CONFIG_TYPE` live inside their own module's `enums/` because nothing outside that module touches them.
- `User` and `Pagination` live in `lib/types/` (global) because the auth module, the users module, and the global sidebar all need `User`, and both words and users paginate the same shape.
- `Category` stays inside `modules/categories/types/` even though the `words` module imports it (a word belongs to a category — a real cross-module domain relationship, not something that should be promoted to global just because two modules touch it). One module importing another module's exported type is normal here; it's not the same as reaching into another module's internals.

**Component-splitting rule applied throughout:** no dialog/table/page is one large file. Every module's `*-page.tsx` only orchestrates state and composes a `*-table.tsx`, a `*-form-dialog.tsx`, and a `*-delete-dialog.tsx` — each in its own file under that module's `components/`.

## Player app — guest-only, socket-driven, no cookies/localStorage

The player app (`/`, `/rooms`, `/room/[code]`) is entirely separate from the admin panel's auth model: no login, no account, no persisted identity anywhere in the browser. This mirrors the backend's own no-cookies design (see `pictionary-be`'s README) — a fresh page load always starts from a clean slate.

**Identity.** `lib/socket-client.ts` opens one `Socket` (module-level singleton, `autoConnect: false`) and connects it from `components/socket-provider.tsx`, an app-wide provider mounted in `components/providers.tsx`. The server assigns a `playerId` and pushes it back via an `identity` event right after connect; the provider holds it in React state and exposes `{socket, playerId, isConnected}` through `useSocket()`. Nothing is written to a cookie or `localStorage` — reload the tab and the player is a stranger again, by design.

**Two pages, one identity.** A second global provider, `components/player-identity-provider.tsx` (`usePlayerIdentity()`), holds the guest's chosen name *and* avatar (`avatarId`) — same in-memory-only, no-persistence stance as `playerId` above, just scoped to "this tab's lifetime" instead of "this socket connection."

- **`/` — Sign In** (`modules/player/pages/sign-in-page.tsx`): one card — a non-functional `GoogleSignInButton` (clicking it just surfaces an inline "coming soon" note via local `useState`; there's no OAuth wired up yet, that's the next increment), a divider, `AvatarPicker` (six hand-drawn avatars, `modules/player/constants/avatar.constant.ts`), and `PlayerNameField`. "Start" is disabled until a name is set, then routes to `/rooms`.
- **`/rooms` — Rooms** (`modules/player/pages/rooms-page.tsx`): a top bar (logo + `AvatarBadge` showing the identity just set), `QuickCreateStrip` (a single-row category/visibility/Create bar — deliberately compact, since the full ceremony already happened on the sign-in page), and `OpenRoomsList` as a card grid, now the main event of the page rather than a small panel. Guards itself: if `playerName` is empty (a direct visit or a refresh, which forgets the in-memory name same as it forgets `playerId`) it redirects straight back to `/` rather than rendering a broken page.
- `JoinRoomForm` (the shared-link entry point on `/room/[code]`, for a visitor who never touched `/`) reads the shared name if already set, or writes it on submit if not — one behavioral contract regardless of which door someone came in through.

`OpenRoomsList` (`modules/player/hooks/use-open-rooms.ts`) polls `GET /rooms` every 5s — there's no "lobby" Socket.IO channel to push this instead, and a 5s poll is plenty responsive for "browse and pick a room."

**Public vs. private.** `QuickCreateStrip` has an icon-only Public/Private toggle bound to `visibility: ROOM_VISIBILITY`, defaulting to `PUBLIC`. The distinction is enforced entirely server-side (see `pictionary-be`'s README) — the frontend's only job is to send the right value at create time and reflect it back: `PreGameBanner` shows a Public/Private `Badge`, so the host isn't left guessing whether the link is actually the only way in.

## The "gamified" player theme — scoped, not global

Bright yellow/blue/orange, thick ink borders, offset flat-color "sticker" shadows, Fredoka (display) + Comic Neue (body) — a deliberately different visual language from the admin panel's shadcn/violet theme, confined to the player-facing screens only:

- **New tokens, not overridden ones.** `app/globals.css`'s `@theme inline` block adds `--color-play-ink`/`-cream`/`-yellow`/`-blue`/`-orange`/`-green`/`-pink`/`-purple` and `--font-play-display`/`-body` as brand-new CSS custom properties (Tailwind v4 auto-generates `bg-play-yellow`, `font-play-display`, etc. from any `--color-*`/`--font-*` token). Critically, **`--primary`/`--background`/etc. — the semantic tokens the admin panel's shadcn components read — are never touched.** A component only picks up the new look if it explicitly reaches for a `play-*` class; nothing admin already renders does.
- **Fredoka + Comic Neue load globally** (`app/layout.tsx`, `next/font/google`, same pattern as the existing Geist fonts) because `next/font` calls must be module-level, but they're inert everywhere that doesn't use `font-play-display`/`font-play-body` — the admin panel stays on Geist without any extra work.
- **Fresh markup, not reskinned shadcn primitives.** The player screens' buttons/cards/inputs are plain `<button>`/`<div>`/`<input>` with Tailwind utility classes (including arbitrary-value box-shadows like `shadow-[4px_4px_0_var(--color-play-ink)]` for the sticker effect), not `components/ui/button.tsx` etc. with overridden classNames — fighting that component's own base classes for a genuinely different design language wasn't worth it, and this way the shared shadcn primitives (still used by the admin panel and by the in-room screens below) stay completely untouched.
- **Avatars are hand-drawn SVG, never emoji** (`modules/player/components/avatar-icon.tsx`) — six fixed options (star/bolt/controller/heart/moon/gem), each a colored circle. This is a deliberate contrast with the *category* icons (🍎🥕🚗), which stay real emoji because they're actual backend data (`category.icon`), not decorative UI chrome — the same category-icon-is-data-not-chrome distinction the room list already made.
- **The in-room screens are gamified too now** (a later pass, same day) — `GameBoard`, `RoomHud`, `TurnHud`, `CanvasBoard`/`CanvasToolbar`, `ChatPanel`, and `Scoreboard` all moved to the `play-*` tokens/fonts, matching the sign-in and rooms-browse screens. Nothing in the admin panel changed, same "additive tokens, not overridden ones" reasoning as above.

**Live room/game state — Context + `useReducer`, not React Query.** Sockets *push* state; React Query is a *pull* model, so it's the wrong tool here (React Query still handles the one REST call the player app makes — the public categories list, via `usePublicCategories`). `modules/room/context/room-session-provider.tsx` wires every `SOCKET_EVENT.*` listener the backend can emit for rooms/games into one `useReducer` (`room-session-reducer.ts`), and exposes both `state` and an `actions` object (`createRoom`, `joinRoom`, `leaveRoom`, `kickPlayer`, `sendMessage`, `startGame`, `submitStroke`, `clearCanvas`) via `useRoomSession()`. Every REST-shaped action (create/join/kick/chat/start) goes through `emitWithAck()` — a helper mirroring the backend's `{status, data, error, message}` envelope with an 8s timeout — so the caller gets a normal awaited result even though it's a socket emit under the hood.

**`room-page.tsx` is the view switch.** `app/room/[code]/page.tsx` (a server component, per the `app/`-is-routing-only rule) renders `modules/room/pages/room-page.tsx`, which picks one view from `RoomSessionState` with no local state of its own:

```
youWereKicked          → RoomNoticeScreen (kicked)
roomClosed              → RoomNoticeScreen (closed)
no room, or room.code   → JoinRoomForm  (guest identity is never persisted,
  doesn't match the URL     so a fresh load/refresh always re-prompts for a name)
gameOver                → GameOverScreen
otherwise                → GameBoard
```

There's no separate waiting-room screen anymore — joining lands straight on `GameBoard` (the drawing HUD), pre-game or not. `GameBoard` itself decides what goes where `TurnHud` normally sits: `!gameStarted` (neither `currentTurn` nor `lastTurnResult` has ever been set) renders pre-game controls (Copy invite link for everyone, Start Game for the host only — disabled below 2 connected players); once a game has started, `currentTurn`/`lastTurnResult` drive the same `TurnHud`/"word was X" states as before. The canvas, scoreboard, and chat are already mounted underneath during the pre-game state too — `CanvasBoard` just renders inert (nobody is `isDrawer` yet) and chat works as plain chat (the backend only intercepts messages as guesses once `isGameInProgress`), so nothing extra had to be built for "pre-game" to look right — the old `RoomLobby`/`RoomLobbyStartAction`/`PlayerList` components are gone.

**`Scoreboard` is now the one player-roster component for the whole room lifecycle** — it used to only show mid-game (score, drawing/correct-guess badges); the old separate `PlayerList` (host crown, reconnecting indicator, kick button) only ever appeared in the now-deleted waiting room. Merging them was necessary once there's no separate lobby screen to put `PlayerList` on, but it also fixed a real dormant bug: `RoomLobby` rendered `PlayerList` without ever passing it an `onKick` handler, so the kick button never actually appeared for anyone, ever — `Scoreboard` now correctly wires `onKick` to `actions.kickPlayer` when the viewer is host.

**`GameBoard`'s layout, and `RoomHud`** (a later pass, same day): room metadata moved into its own full-width bar on top (`RoomHud`) instead of living inline with the canvas — one persistent chunky card whose left side (room code, category, visibility) never changes and whose right side swaps between pre-game controls, the active `TurnHud`, and the between-turns reveal, so there's one consistent piece of chrome instead of the metadata jumping around as the game state changes. Below it: canvas on top with `ChatPanel` scrollable underneath (its own fixed-height box, not filling the remaining page), and the player roster as a `lg:sticky` sidebar on the right that scrolls independently once there are enough players to overflow it — matches the room-agnostic pattern `--color-play-*` tokens already established, just applied to the in-room screens this time.

**Avatars are now real room data, not just a sign-in-page-local choice.** `avatarId` is sent alongside `name` on both `room:create` and `room:join` (`PlayerIdentityProvider`'s `avatarId`, defaulting to `blue` for anyone who joins via a shared link without ever visiting the sign-in page) and comes back on every `RoomPlayer` in broadcasts — `Scoreboard` renders each player's actual chosen avatar (`getAvatarOption()` + `AvatarIcon`, both reused from `modules/player/`) instead of a generic initials circle. `RoomPlayer.avatarId` is typed as a plain `string` on the frontend (not the narrower `AvatarId` union) since it's data straight off the wire — `getAvatarOption()` already falls back gracefully for anything unrecognized, so there's no risk in not over-narrowing it.

**Canvas.** `modules/room/components/canvas-board.tsx` uses a **fixed internal resolution** (800×500, `modules/room/constants/canvas.constant.ts`) regardless of its on-screen CSS size — pointer coordinates are remapped by `canvas.width / rect.width` (and the height equivalent) before being recorded. This keeps a drawing identical across a phone and a desktop instead of trying to maintain a scaled/responsive coordinate space. Points are batched locally and flushed to the server every `STROKE_FLUSH_INTERVAL_MS` (60ms) via `actions.submitStroke` — a plain `socket.emit`, no ack, since the backend only broadcasts a stroke to *other* sockets in the room (`socket.to(code)`, excluding the sender), so `submitStroke` also dispatches a local `STROKE_BROADCAST` immediately for the drawer's own optimistic render. Rendering is fully declarative: every action-array change redraws the whole canvas from `state.strokes` (now `DrawAction[]` — see below) — no separate imperative "live preview" layer to keep in sync.

**Two tools: pen and fill.** `CanvasToolbar` holds local `tool: CanvasTool` state (`"pen" | "fill"`, `modules/room/types/canvas-tool.type.ts` — a plain union, not an enum, since it's local UI state rather than part of the socket protocol). The fill tool changes what a pointer-down does: instead of starting a stroke, one click calls `actions.submitFill({x, y, color})` — same fire-and-forget-plus-optimistic-local-dispatch shape as `submitStroke`. Both strokes and fills append to the **same** ordered `state.strokes: DrawAction[]` array (a discriminated union, `{kind: "stroke", points, color, width, drawerId} | {kind: "fill", x, y, color, drawerId}`) — one interleaved timeline, not two separate lists, which is what makes replay, undo, and redo all agree on "what happened when" regardless of which tool drew it.

The flood fill itself runs **client-side**, in `canvas-board.tsx`'s `floodFill()` — a classic stack-based 4-directional fill read/written through `ctx.getImageData`/`putImageData`, matching the exact pixel color at the clicked point (so it naturally stops at any drawn line, including anti-aliased edges) and replacing it with the selected color. It's re-run from scratch on every redraw this turn, in order, alongside every stroke — the server only stores and orders `{x, y, color}`, never computes pixels (see `pictionary-be`'s README), so each client fills against whatever it has actually rendered up to that point in the replay. Verified live at the canvas's full 800×500 size with no perceptible lag for an occasional click; not further optimized (no memoization/caching of prior fills) since a turn's action count is naturally bounded by 60 seconds of drawing — a documented trade-off, not an oversight, in the same spirit as this codebase's other "simple now, revisit if it's ever actually a problem" calls.

**Undo/redo.** `actions.undo()`/`actions.redo()` (`emitWithAck`, `GAME_UNDO`/`GAME_REDO`) deliberately do **no** optimistic local update, unlike every other canvas action — the server is the only side that knows what the resulting action list should look like, and it resends that full list to everyone (including the actor) via the same `GAME_STROKE_HISTORY` event already wired up for late-joiner replay, so the canvas updates through that one existing listener rather than a second bespoke sync path. The toolbar's Undo button is disabled when `state.strokes.length === 0`; Redo has no equivalent client-side tracking (whether the server's redo stack is non-empty) and is left enabled whenever the drawer's toolbar is showing — clicking it with nothing to redo just no-ops (the ack comes back `ok: false`, silently) rather than adding a second piece of state to keep in sync with the server's stack, the same low-key error-handling posture the Clear button already has.

**Guessing is the chat, not a separate control.** `ChatPanel` always just calls `actions.sendMessage()`; the backend decides server-side whether a message was a correct guess (see `pictionary-be`'s README) and pushes `GAME_CORRECT_GUESS`/`GAME_TURN_ENDED` events accordingly. The reducer turns those (plus `GAME_TURN_STARTED`/`GAME_OVER`) into synthetic system messages appended to the same `chatMessages` array, styled distinctly (`isSystem: true` — italic, no sender name) rather than routed through a separate notifications UI.

**The drawer can't chat at all.** `ChatPanel` disables its input and send button outright when `isDrawer` is true (placeholder switches to "You can't chat while drawing"), and `handleSubmit` no-ops as a second guard even if something managed to submit anyway. This is a UI courtesy only — the actual boundary is server-side (the backend rejects `ROOM_CHAT` from the active drawer with `DRAWER_CANNOT_CHAT`, see `pictionary-be`'s README), so there's nothing to keep in sync here: the client doesn't need to know *why* it's blocked, just that it is.

## Auth architecture — httpOnly cookie + BFF proxy

The browser **never** talks to the Fastify backend directly, and never sees the JWT:

1. `POST /api/auth/login` (`app/api/auth/login/route.ts`) calls the backend, and if (and only if) the returned user has `role: admin`, sets the token as an **httpOnly, secure, sameSite=lax** cookie. A valid non-admin login is rejected here with 403 — this is the admin panel, not the player app.
2. Every other API call goes through `app/api/proxy/[...path]/route.ts` — a generic reverse-proxy route handler that reads the cookie server-side, forwards it as `Authorization: Bearer <token>` to the backend, and relays the response back untouched. The client-side `apiClient` (`lib/api-client.ts`) always calls `/api/proxy/...`, never the backend's URL — which the client bundle never even sees (`BACKEND_API_URL` has no `NEXT_PUBLIC_` prefix).
3. `proxy.ts` (project root, `src/proxy.ts`) gates every `/admin/*` page: it verifies the cookie's JWT signature (via `jose`, same secret as the backend) and redirects to `/admin/login` if missing/invalid/non-admin. **This is a UX layer only** — the actual security boundary is the backend's own `requireAdmin` check on every request, which happens independently regardless of what `proxy.ts` decides.

## `proxy.ts`, not `middleware.ts`

Next.js 16 renamed the `middleware.js|ts` convention to `proxy.js|ts` (exported function is also renamed `middleware` → `proxy`). This project already reflects that — don't reintroduce a `middleware.ts` file. See [Next's migration doc](https://nextjs.org/docs/messages/middleware-to-proxy) if this looks unfamiliar.

## Gotchas from this shadcn version (Base UI, not Radix)

Worth knowing before touching `components/ui/*` or adding new shadcn components — several APIs differ from older shadcn/Radix docs and from typical training data:

- **No `asChild` prop.** Composition is done via a `render` prop instead: `<SidebarMenuButton render={<Link href="..." />}>{children}</SidebarMenuButton>` — children are merged onto the element passed to `render`, not nested inside it as a child.
- **`Select`'s `onValueChange` can receive `null`**, not just `string` — its signature is `(value: T | null, eventDetails) => void`. Guard for null (`(val) => val && ...`).
- **`Select.Value` does NOT auto-derive its label from the selected `Item`'s children** the way Radix did — by default it shows the raw value. Pass a children render-function to map value → label: `<SelectValue>{(value) => labelFor(value)}</SelectValue>`. Every `<SelectValue>` in this codebase already does this — copy that pattern for new ones.

## Forms: react-hook-form + zod, `Controller` for non-native inputs

Every form uses `useForm({ resolver: zodResolver(schema) })` with `register()` for plain `<input>`s. shadcn's `Select` and `Switch` aren't native form elements (no `onChange` event shape `register` expects), so they're wired through RHF's `<Controller>` — see any `*-form-dialog.tsx` for the pattern:

```tsx
<Controller
  name="isActive"
  control={control}
  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
/>
```

**Form dialogs remount-via-`key`, not reset-via-`useEffect`**, to reseed edit/create state. `react-hook-form`'s `defaultValues` are only read once, at mount — so the parent page increments a `formKey` counter on every `openCreate()`/`openEdit()` call and passes it as `key={formKey}` to the dialog, forcing a full remount. This is also what keeps `react-hooks/set-state-in-effect` from ever firing on these components. Follow this pattern for any new create/edit dialog.

(`src/hooks/use-mobile.ts` is shadcn's own generated file and fails this same lint rule if you run it — left untouched since it's tool-generated, not something this project owns, and its effect-based pattern is actually necessary there: `window.matchMedia` isn't available during SSR, so it can't be read in a lazy initializer.)

## Theme

Primary color is violet (`oklch(0.541 0.281 293.009)` light / `oklch(0.702 0.183 293.541)` dark) — set in `globals.css`'s `:root`/`.dark` blocks. Chosen for a creative/playful feel appropriate to a drawing game, distinct from generic SaaS blue.

## Verified live, not just typechecked

The full player flow was exercised against a running `pictionary-be` + local Redis, two browser tabs as two separate guests: home → create room (category picker) → invite link → second guest joins via the link, both lobbies live-updating off the same broadcasts → host starts the game → drawer's own strokes render optimistically while broadcasting in real time to the guesser's canvas → guesser sees the word masked to blanks matching its length, drawer sees the real word → correct guess scores both players and rotates to the next turn/drawer → (score pushed near the threshold directly in Redis to reach the win condition without playing ~10 full rounds) → `GAME_OVER` renders the sorted final scoreboard identically on both tabs → "Back to home" leaves the room and returns to `/`. This run is also what surfaced the `safeAck()` crash documented in `pictionary-be`'s README — the very first stroke drawn against a live server took the whole backend process down.

**The no-lobby HUD flow (2026-08-25)** was verified live too: create a room → land directly on `GameBoard`'s pre-game state (blank canvas, `PreGameBanner` with a disabled "Need at least 2 players" button, `Scoreboard` showing just the host) → a second guest joins via the link → `Scoreboard` now shows both players with the kick button next to the non-host (confirming the dormant kick-button bug above is actually fixed, not just typechecked) → Start Game enables and transitions straight into `TurnHud` with no lobby screen in between. The alone-room auto-close was verified against the real sweep, not just read: had the second player leave (dropped the room back to 1 player), confirmed `aloneSince` got stamped in Redis, fast-forwarded it past `ALONE_ROOM_CLOSE_MS` directly in Redis, and confirmed the next sweep tick actually closed the room.

## What's not built yet

- No pagination UI on the Words/Users lists (the backend supports it; the pages currently just request a large `pageSize` and show everything).
- No user creation from the admin panel (the backend doesn't expose one either — only role changes on existing accounts).
- No player results/history UI — the backend deliberately doesn't persist `game_sessions`/`player_results` yet either (explicitly deferred), so there's nothing to show. The game-over screen only ever reflects the just-finished game's in-memory scores.
- Logged-in (non-guest) play isn't wired up on this side yet — the socket layer already supports it (`playerId = userId` server-side for authenticated connections), but the player app's UI is guest-only for now: no login entry point, no "your past games" anywhere in `modules/player/` or `modules/room/`.
