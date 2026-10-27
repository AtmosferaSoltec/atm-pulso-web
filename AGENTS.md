# AGENTS.md — Development Rules & Architecture Guidelines

> Connecting to the real API? Start at `docs/README.md` (implementation plans) before changing code.

Welcome to **atm-pulso-web**. All agents, assistants, and developers working on this codebase must adhere strictly to the following rules, conventions, and architectural patterns.

---

## 1. Core Development Rules

### Rule 1: Language Policy
- **100% English for Technical Code**: All code, variable names, function names, component names, interfaces, types, database fields, API routes, service calls, and file/folder names must be written in **English**.
- **Spanish Exclusively for User-Facing UI**: Only literal text rendered directly to the end user (labels, placeholders, buttons, headings, dialogs, validation messages, toasts, alerts, and tooltips) must be written in **Spanish**.
- *Example*:
  ```tsx
  // ✅ Correct:
  interface MemberFormProps {
    onSubmit: (memberData: CreateMemberDTO) => Promise<void>;
  }

  export const MemberForm = ({ onSubmit }: MemberFormProps) => {
    return (
      <form onSubmit={...}>
        <label htmlFor="fullName">Nombre Completo</label>
        <Input id="fullName" placeholder="Ingresa el nombre del miembro" />
        <Button type="submit">Guardar Miembro</Button>
      </form>
    );
  };

  // ❌ Incorrect:
  interface FormularioMiembroProps { ... } // Do NOT use Spanish identifiers
  ```

### Rule 2: Modular Feature Architecture (`src/features/[module-name]/`)
- All domain-specific business logic must be encapsulated inside its respective module in `src/features/[module-name]/`.
- **Do not spread business logic across global folders.**
- Each feature module must maintain the following internal structure:
  ```text
  src/features/[module-name]/
  ├── components/  # Components exclusive to this feature (e.g., MemberTable.tsx, MemberForm.tsx)
  ├── hooks/       # Custom React hooks exclusive to this feature (e.g., useMembers.ts)
  ├── services/    # API calls and external data fetchers (e.g., memberService.ts)
  ├── types/       # TypeScript interfaces and types for this module (e.g., member.types.ts)
  └── index.ts     # Public barrel export exposing only what outside modules/pages need
  ```
- **External access rule**: Code outside the feature module (such as pages or other features) should import from the feature's barrel file (`@/features/[module-name]`), not deep internal paths.

### Rule 3: Component Reusability & UI Consistency
- **Check existing components first**: Always check `src/components/ui/` (shadcn/ui style base components) or existing feature components before creating a new UI element.
- **No unmanaged inline styles**: Do not hardcode arbitrary inline styles or unmanaged raw buttons/inputs when a reusable component exists.
- **Component separation**:
  - `src/components/ui/`: Atomic, headless or styled primitive UI elements (e.g., `button.tsx`, `dialog.tsx`, `input.tsx`, `card.tsx`).
  - `src/components/common/`: Shared cross-cutting components with layout/app logic (e.g., `Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx`).
  - `src/features/[module-name]/components/`: Domain-specific components belonging only to that feature.

### Rule 4: Strict Typing
- Every function, component prop, custom hook, and API response must be strictly typed.
- Avoid using `any` under all circumstances. Use generics, unions, or `unknown` with type guards when dynamic typing is required.
- Place shared types in `src/types/` and feature-specific types in `src/features/[module-name]/types/`.

---

## 2. Project Directory Structure

```text
atm-pulso-web/
├── public/                 # Global static assets (favicons, public images)
├── src/
│   ├── assets/             # Global bundled assets (fonts, logos, global CSS)
│   ├── components/         # Global and reusable UI components
│   │   ├── ui/             # Primitive UI components (button.tsx, dialog.tsx, input.tsx)
│   │   └── common/         # Shared business/app components (Navbar.tsx, Sidebar.tsx)
│   ├── config/             # Global configs (axios/fetch client, env variables, base constants)
│   ├── features/           # Modular architecture by business domain
│   │   ├── members/        # Gym Members Management Module
│   │   │   ├── components/ # Module-exclusive components (MemberTable.tsx, MemberForm.tsx)
│   │   │   ├── hooks/      # Module-exclusive custom hooks (useMembers.ts)
│   │   │   ├── services/   # Module API service calls (memberService.ts)
│   │   │   ├── types/      # Module TypeScript types (member.types.ts)
│   │   │   └── index.ts    # Barrel file (public module interface)
│   │   ├── memberships/    # Memberships & Plans Module (same internal structure)
│   │   └── dashboard/      # Main Dashboard Module (same internal structure)
│   ├── hooks/              # Global reusable hooks (useAuth, useLocalStorage, useMediaQuery)
│   ├── layouts/            # Page layouts (DashboardLayout.tsx, AuthLayout.tsx)
│   ├── pages/              # Main route views (LoginPage.tsx, MembersPage.tsx)
│   ├── routes/             # Route declarations and guards (AppRoutes.tsx, PrivateRoute.tsx)
│   ├── services/           # Global HTTP client, interceptors, and global services
│   ├── store/              # Global state management (Zustand or Context API)
│   ├── types/              # Global TypeScript declarations (api.types.ts, user.types.ts)
│   ├── utils/              # Pure helper functions and formatters (formatCurrency.ts, formatDate.ts)
│   ├── App.tsx             # Root application component
│   └── main.tsx            # React application entrypoint
├── .env                    # Local environment variables
├── .env.example            # Environment variables template
├── tsconfig.json           # TypeScript project configuration
├── tsconfig.app.json       # TypeScript app configuration with path aliases
├── vite.config.ts          # Vite build configuration with alias resolution
└── package.json            # Project manifest and scripts
```

---

## 3. Path Aliasing

All internal imports must use the `@/*` alias mapped to `./src/*`:
```tsx
// ✅ Correct:
import { Button } from '@/components/ui/button';
import { useMembers } from '@/features/members';
import { formatDate } from '@/utils/formatDate';

// ❌ Avoid long relative paths:
import { Button } from '../../../components/ui/button';
```

---

## 4. Code Style & Quality Checklist

Before completing any task, ensure:
1. `pnpm build` or `tsc -b` passes with zero type errors.
2. No unused imports or variables exist.
3. Identifiers and comments are in English; rendered strings are in Spanish.
4. Business logic is placed in the proper feature module.
5. All new components check `src/components/ui/` first for reusable elements.


---

## 5. UI Simplicity Principles

Our clients are gym owners and reception staff, not software users. Teach once, they remember.

- **Icons over words.** Row and toolbar actions use `IconButton` (`src/components/ui/icon-button.tsx`) and always carry a `label` (accessible name + tooltip). Text is reserved for the single primary action of a screen (e.g. "Nuevo miembro").
- **Same icon, same place, everywhere.** Add `plus`, edit `edit`, view `eye`, renew `renewals`, WhatsApp `message`, search `search`. Row actions keep fixed slots so icons never jump between rows.
- **Status by colour.** Green = vigente, amber = por vencer, red = vencido, blue = por iniciar. Filters are colour dots with counts.
- **No explanatory subtitles, breadcrumbs or footers.** If a screen needs a paragraph to be understood, redesign the screen.
- **Daily vs. once.** Daily pages live in the sidebar; one-time configuration (gyms and rules, users, identity) lives under "Configuración". Page lists are in `src/config/pages.ts`.
- **Never show invented data.** No hardcoded dates or sample charts; derive from `DEMO_DATE` or real records.
- **Comfortable sizes.** Body text in tables is 14px, touch targets are at least 38px.
- **Form controls.** Never use a native `<select>` or `<input type="date">`. Short fixed lists use `OptionCards` (`card` or `chip` variant); dates use `DatePicker` (`src/components/ui/`). Every field goes in `Field`; pass `required` to show the red asterisk and leave it off for optional fields, and add the "* Obligatorio" note to the form footer.

---

## 6. Business Rules to Remember

- **Pulso is free, with limits**: 1 gym and up to 1 branch per gym per client. The limits live in `src/config/freePlan.ts`; do not hardcode them elsewhere.
- Extra gyms or branches are **agreed directly with Atmósfera**, which creates and charges for them. Owners and admins never add gyms or branches themselves; only the superadmin does, and must confirm the extra agreement.
- The member directory is always shared across an owner's gyms and branches. "Access between branches" is a per-gym rule set by that gym's administrator.
- Only an owner creates administrators; an administrator creates reception staff.
