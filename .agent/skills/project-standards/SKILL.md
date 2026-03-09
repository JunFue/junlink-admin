---
name: pos-next-project-standards
description: Coding standards, conventions, and patterns for the PUNCH POS (pos-next) project. Reference this skill before writing any code, creating components, server actions, hooks, or database migrations.
---

# PUNCH POS — Project Standards & Conventions

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | **Next.js** (App Router) | 16 |
| Language | **TypeScript** | 5 |
| Styling | **TailwindCSS** | v4 (with `@theme inline` + CSS variables) |
| Database / Auth | **Supabase** (`@supabase/ssr`) | 2.x |
| State Management | **Zustand** | 5 |
| Data Fetching | **TanStack React Query** | 5 |
| Forms | **React Hook Form** + **Zod** (v4) | 7 / 4 |
| Icons | **lucide-react** | latest |
| Theming | **next-themes** (dark / light / system) | 0.4 |
| Image Compression | **browser-image-compression** | 2 |
| Charts | **Recharts** | 3 |

---

## Directory Structure

```
pos-next/
├── app/
│   ├── actions/          # Server actions (auth.ts, store.ts, profile.ts, ...)
│   ├── api/              # API routes
│   ├── hooks/            # Global custom hooks (usePermissions, useDebounce, ...)
│   ├── components/       # App-wide shared components
│   ├── globals.css        # TailwindCSS v4 theme + global styles
│   ├── layout.tsx         # Root layout (providers, theme, auth)
│   ├── page.tsx           # Home page (redirects to dashboard)
│   ├── <feature>/        # Feature modules (dashboard, inventory, settings, ...)
│   │   ├── components/   # Feature-scoped components
│   │   ├── hooks/        # Feature-scoped hooks
│   │   ├── lib/          # Feature-scoped utilities / API functions
│   │   ├── store/        # Feature-scoped Zustand stores
│   │   └── page.tsx
│   └── onboarding/       # Onboarding flow
├── components/            # Global shared components
│   ├── providers/         # ThemeProvider, QueryProvider
│   ├── reusables/         # SessionMonitor, etc.
│   ├── navigation/        # Nav components
│   ├── sales-terminal/    # POS terminal components
│   └── window-layouts/    # MainWindow, sidebar
├── store/                 # Global Zustand stores
│   ├── useAuthStore.ts
│   ├── useSettingsStore.ts
│   └── useFilterStore.ts
├── utils/
│   └── supabase/
│       ├── client.ts      # Browser Supabase client
│       └── server.ts      # Server Supabase client (uses cookies)
├── lib/
│   ├── types.ts           # Shared TypeScript types
│   └── utils/             # Shared utilities (currency, etc.)
├── supabase/
│   └── migrations/        # SQL migrations (YYYYMMDD format)
├── middleware.ts           # Auth, subscription, maintenance guards
└── tests/                 # Playwright e2e tests
```

### Key Rules
- **Feature modules live inside `app/<feature>/`** with their own `components/`, `hooks/`, `lib/`, and `store/` subfolders.
- **Global shared code** goes in top-level `components/`, `store/`, `utils/`, and `lib/`.
- **Settings tabs** follow a nested folder pattern: `app/settings/components/<tab-name>/TabComponent.tsx` + section sub-components in the same folder.
- When extracting sections from a larger component, create individual `*Section.tsx` files in the same directory.

---

## Server Actions

All server actions live in `app/actions/` and follow this pattern:

```typescript
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function doSomething(data: { ... }) {
  const supabase = await createClient();

  // 1. Always authenticate first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 2. Execute logic with clear numbered comments
  const { data: result, error } = await supabase
    .from("table")
    .select("columns")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Revalidate affected paths
  revalidatePath("/", "layout");
  revalidatePath("/settings");

  return { success: true, data: result };
}
```

### Rules
- **Always** start with `"use server"` directive.
- **Always** use `createClient()` from `@/utils/supabase/server`.
- **Always** return `{ success: boolean, error?: string, ...data }`.
- **Always** authenticate first via `supabase.auth.getUser()`.
- Use `revalidatePath()` after mutations to bust the cache.
- Use numbered comments (`// 1. ...`, `// 2. ...`) for multi-step logic.
- Wrap in try-catch with `catch (error: any)` → `{ success: false, error: error.message }`.
- For RPC calls: `await supabase.rpc("function_name", { params })`.

---

## Client Components

```typescript
"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

interface MyComponentProps {
  // ...
}

export function MyComponent({ ... }: MyComponentProps) {
  // State + hooks
  // Handlers
  // Render with theme-aware classes
}
```

### Rules
- **Always** use `"use client"` directive for interactive components.
- **Always** use named exports (`export function Component`), not default exports (except `page.tsx`).
- Icons: Import from `lucide-react`. Common ones: `Loader2` (loading), `AlertTriangle` (errors), `Check`, `X`, `ArrowRight`.
- Keep component files focused; extract sub-sections into `*Section.tsx` files.
- Use TypeScript interfaces for props (not `type`).

---

## Styling & Theming

### TailwindCSS v4 with CSS Variables
The project uses TailwindCSS v4 with `@theme inline` and CSS custom properties for theming. **Never hardcode colors.**

```css
/* globals.css defines the theme tokens */
@import "tailwindcss";

@theme inline {
  --color-background: var(--color-background);
  --color-foreground: var(--color-foreground);
  --color-primary: var(--color-primary);
  --color-muted: var(--color-muted);
  --color-border: var(--color-border);
  --color-card: var(--color-card);
  /* ... etc */
}
```

### Theme-Aware Class Usage
```
✅ CORRECT: text-foreground, bg-background, bg-card, text-muted-foreground, border-border
✅ CORRECT: bg-primary, text-primary-foreground, hover:bg-primary/90
✅ CORRECT: bg-muted, text-accent

❌ WRONG: text-gray-900, bg-gray-800, text-white (hardcoded colors)
❌ WRONG: dark:bg-gray-800 (use CSS variable system instead)
```

### Design Standards
- **Premium, modern UI** — never create basic/plain interfaces.
- Use subtle **entry animations** (CSS transitions, opacity + transform on mount).
- Use **glassmorphism** where appropriate (`backdrop-blur`, semi-transparent backgrounds).
- Use **hover effects** on interactive elements.
- Error states: `text-red-500`, `border-red-500` (exception to the no-hardcoded-colors rule).
- Loading states: `<Loader2 className="w-5 h-5 animate-spin" />`.
- Buttons: `bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md transition-colors`.
- Labels: `block mb-2 font-medium text-muted-foreground text-sm`.
- Input fields: `w-full bg-background border border-input text-foreground rounded-md focus:border-ring focus:ring-1 focus:ring-ring`.
- Input icons: Wrap in `<span className="left-0 absolute inset-y-0 flex items-center pl-3">` and add `pl-10!` to input.

---

## Forms

Use **React Hook Form** + **Zod** for all form validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const mySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof mySchema>;

// Inside component:
const {
  register,
  handleSubmit,
  formState: { errors },
  setError: setFormError,
} = useForm<FormValues>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});
```

### Form UX Behavior (Enter Key Progression)
Forms should prevent default submission when the user presses "Enter" on an input field. Instead, the focus should jump to the next logical input field. Only the last input field in the sequence (or an explicit submit action, e.g. Shift+Enter) should trigger form submission.

Implement a `handleKeyDown` helper and attach it to `onKeyDown` for inputs in the sequence:
```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, nextField: string) => {
  if (e.key === "Enter") {
    if (e.shiftKey) return; // Allow Shift+Enter to submit if desired
    e.preventDefault();
    const nextInput = document.querySelector(`[name="${nextField}"]`) as HTMLElement;
    if (nextInput) nextInput.focus();
  }
};
```

### Error Display Pattern
```tsx
{errors.fieldName && (
  <p className="mt-2 text-red-500 text-sm">
    {errors.fieldName.message}
  </p>
)}
```

### Server Error Display
```tsx
{errors.root?.serverError && (
  <div className="flex items-center gap-2 text-red-500 text-sm">
    <AlertTriangle className="w-5 h-5" />
    <span>{errors.root.serverError.message}</span>
  </div>
)}
```

---

## State Management

### Zustand (Global State)
Located in `store/` (global) or `app/<feature>/store/` (feature-scoped).

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MyState {
  value: string;
  setValue: (v: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      value: '',
      setValue: (value) => set({ value }),
    }),
    {
      name: 'pos-my-storage', // localStorage key prefix: always "pos-"
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### TanStack React Query (Server Data)
Used for all server data fetching in hooks:

```typescript
const { data, isLoading, isFetching, refetch } = useQuery({
  queryKey: ["descriptive-key", dependency],
  queryFn: () => fetchFunction(dependency),
  staleTime: 1000 * 30,           // 30 seconds typical
  refetchInterval: isLive ? 1000 * 30 : false,
});
```

### Rules
- `queryKey` must be a descriptive array including all dependencies.
- API/fetch functions live in the feature's `lib/` directory (e.g., `dashboard.api.ts`).
- Use `enabled` flag for conditional fetching.
- Hooks return a clean object with all needed state and handlers.

---

## Custom Hooks

### Naming Convention
- Global hooks: `app/hooks/use<Name>.ts` (e.g., `usePermissions.ts`, `useDebounce.ts`)
- Feature hooks: `app/<feature>/hooks/use<Name>.ts` (e.g., `useDashboard.ts`)

### Pattern
```typescript
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useMyHook() {
  // State
  // Effects for data fetching (client-side uses createClient from utils/supabase/client)
  // Handlers
  // Return clean object with categorized sections using comments:
  //   // ─── Section Name ──────────
  return {
    // Data
    data,
    isLoading,
    // Handlers
    handleAction,
  };
}
```

---

## Supabase

### Client Setup
- **Server** (`utils/supabase/server.ts`): Uses `createServerClient` with cookies. Used in server actions and middleware.
- **Client** (`utils/supabase/client.ts`): Uses `createBrowserClient`. Used in `"use client"` hooks.
- **Path alias**: Always import as `@/utils/supabase/server` or `@/utils/supabase/client`.

### Migration Files
- Location: `supabase/migrations/`
- Naming: `YYYYMMDDHHMMSS_description.sql` (e.g., `20260302000000_update_store_permissions.sql`)
- Always include `DROP ... IF EXISTS` before `CREATE OR REPLACE` for idempotency.

### RLS (Row Level Security)
- Always consider RLS when writing queries.
- For admin-only queries that bypass RLS, create dedicated server actions using service role key.
- When debugging query failures, check RLS policies first.

---

## Middleware

The `middleware.ts` handles multiple guard layers in this order:
1. **Maintenance mode** guard
2. **Authentication** guard (redirect to `/login`)
3. **Account status** guard (deleted/deactivated accounts)
4. **Onboarding** guard (incomplete profile → redirect to `/onboarding`)
5. **Subscription** guard (expired → redirect to `/subscribe-required`)

**Do NOT** modify the guard ordering without understanding the cascade.

---

## Permissions

- JWT-based permissions embedded in `app_metadata.permissions`.
- Decoded client-side via `usePermissions()` hook from `app/hooks/usePermissions.ts`.
- Permission keys: `can_backdate`, `can_edit_price`, `can_edit_transaction`, `can_delete_transaction`, `can_manage_items`, `can_manage_categories`, `can_manage_customers`, `can_manage_expenses`, `can_manage_store`.
- Always gate UI actions behind permission checks.

---

## Provider Hierarchy (Root Layout)

```
<html>
  <body>
    <SessionMonitor />         — Silent auth watcher
    <ThemeProvider>             — next-themes (dark/light/system)
      <AuthInit>               — Zustand auth initialization
        <QueryProvider>        — TanStack Query client
          <MainWindow>         — Sidebar + header layout
            {children}
          </MainWindow>
        </QueryProvider>
      </AuthInit>
    </ThemeProvider>
  </body>
</html>
```

---

## File Upload Pattern

1. Compress image with `browser-image-compression` (maxSizeMB: 0.3, maxWidthOrHeight: 512).
2. Create a `FormData` and append the file.
3. Call a server action that uploads to Supabase Storage.
4. Server action returns `{ success, url }`.
5. Use the URL in subsequent updates.

---

## Code Comment Style

- Use **section dividers** in hooks/large files:
  ```
  // ─── Section Name ──────────────────────────────────────────────────────────
  ```
- Use **numbered steps** in server actions:
  ```
  // 1. Authenticate
  // 2. Fetch user data
  // 3. Update record
  ```
- Use **block comments with ── delimiters** in middleware:
  ```
  // ============================================
  // SECTION NAME
  // ============================================
  ```

---

## Verification Checklist

After any change:
1. Run `npm run build` — must pass with no errors.
2. Check TypeScript: `npm run type-check` (alias for `tsc --noEmit`).
3. For UI changes: visually verify in the browser (dev server: `npm run dev`).
4. For database changes: apply migration and verify RLS policies.
5. E2E tests: `npm run test:e2e` (Playwright).

---

## Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|---|---|
| Hardcode colors (`text-gray-900`) | Use theme variables (`text-foreground`) |
| Use default exports for components | Use named exports |
| Put feature code in global `components/` | Put in `app/<feature>/components/` |
| Skip authentication in server actions | Always check `supabase.auth.getUser()` first |
| Return raw errors from server actions | Return `{ success: false, error: message }` |
| Use `any` types freely | Define proper TypeScript interfaces |
| Create basic/plain UI | Apply premium design with animations and effects |
| Skip `revalidatePath` after mutations | Always revalidate affected paths |
| Mix server and client Supabase clients | Use `server.ts` in actions, `client.ts` in hooks |
