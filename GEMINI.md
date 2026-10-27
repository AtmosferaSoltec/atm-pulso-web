# GEMINI.md — Development Rules & Architecture Guidelines

This file inherits all project conventions and constraints defined for **atm-pulso-web**.

See [AGENTS.md](./AGENTS.md) for full context.

## Core Rules Summary

1. **Language Policy**:
   - 100% English for technical identifiers, functions, variables, components, interfaces, types, database fields, routes, and file names.
   - Spanish exclusively for user-facing strings (labels, placeholders, buttons, headings, toasts, alerts).

2. **Modular Architecture (`src/features/[module-name]/`)**:
   - Encapsulate business logic in `src/features/[module-name]/` (`components/`, `hooks/`, `services/`, `types/`, `index.ts`).
   - Import across features or into pages using feature barrel exports (`@/features/[module-name]`).

3. **Component Reusability**:
   - Check `src/components/ui/` (primitives) or feature components before creating new UI elements.
   - Use `src/components/common/` for shared application-wide components.
   - No hardcoded unmanaged inline styles or duplicate raw buttons/inputs.

4. **Strict Typing**:
   - Strict TypeScript types and interfaces on all functions, props, hooks, and API responses. No `any`.

5. **Path Aliasing**:
   - Use `@/*` pointing to `./src/*`.

