# pictionary-fe

Admin panel frontend for the Pictionary-style multiplayer drawing game. Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + TanStack React Query + react-hook-form.

The player-facing app (guest rooms, drawing, realtime gameplay) isn't built yet — this is the `/admin` side only, talking to [pictionary-be](../pictionary-be).

## Stack

- **Next.js 16** — App Router, `proxy.ts` (the renamed `middleware.ts` — see below)
- **shadcn/ui** on **Base UI** (not Radix — this shadcn version switched primitives; several APIs differ from older shadcn docs/training data, see "Gotchas" below)
- **TanStack React Query** — all server state
- **react-hook-form** + **zod** (`@hookform/resolvers`) — all form state/validation
- **Tailwind v4** — theme via CSS variables in `globals.css`, violet primary
- **jose** — JWT verification in `proxy.ts`

## Getting started

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `BACKEND_API_URL` — the Fastify backend's URL (e.g. `http://localhost:4000`)
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
  proxy.ts                # gates /admin/* — see Auth architecture below
```

Each module has its own subset of: `components/`, `hooks/`, `pages/`, `types/`, `constants/`, `enums/`, `validation/` — only the ones it actually needs (e.g. `categories/` has no `enums/` since it doesn't own one). `pages/` holds the actual page component an `app/` route renders; nothing gets rendered directly from `app/`.

**Global vs. local is a real judgment call, not just "used more than once":**
- `USER_TYPE` lives in `lib/enums/` (global) because `proxy.ts`, an API route handler, and the users module all need it — it's not owned by any single module.
- `WORD_DIFFICULTY` / `APP_CONFIG_TYPE` live inside their own module's `enums/` because nothing outside that module touches them.
- `User` and `Pagination` live in `lib/types/` (global) because the auth module, the users module, and the global sidebar all need `User`, and both words and users paginate the same shape.
- `Category` stays inside `modules/categories/types/` even though the `words` module imports it (a word belongs to a category — a real cross-module domain relationship, not something that should be promoted to global just because two modules touch it). One module importing another module's exported type is normal here; it's not the same as reaching into another module's internals.

**Component-splitting rule applied throughout:** no dialog/table/page is one large file. Every module's `*-page.tsx` only orchestrates state and composes a `*-table.tsx`, a `*-form-dialog.tsx`, and a `*-delete-dialog.tsx` — each in its own file under that module's `components/`.

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

## What's not built yet

- No public (non-admin) pages/routes for any module — this pass was admin-only, per the "admin side first" build order.
- No pagination UI on the Words/Users lists (the backend supports it; the pages currently just request a large `pageSize` and show everything).
- No user creation from the admin panel (the backend doesn't expose one either — only role changes on existing accounts).
