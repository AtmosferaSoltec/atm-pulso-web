# WEB-06: cleanup and release candidate

**Needs:** API-06. 

## Tasks

1. Delete the demo layer: `src/store/demoStore.ts`, `DemoProvider.tsx`, `DEMO_DATE`, sample data, demo accounts. `grep -rn "demo\|Demo" src` must only match legitimate words.
2. Remove unused dependencies and files; `pnpm build` with zero warnings that matter; `pnpm lint` clean.
3. Full e2e run against the local API for all four roles; fix flakiness (no fixed sleeps).
4. Accessibility pass: every `IconButton` has a label; focus states; dialogs only close with Cancel or X.
5. Check bundle size and that no token or personal data reaches `localStorage`, console logs or URLs.
6. Update `AGENTS.md` section 5 if rules changed, and write `docs/RELEASE.md`: what changed, new env vars (`VITE_API_URL` build arg and how the Dockerfile/workflow must pass it), gaps, owner decisions.

## Do not

Do not push, deploy or edit the GitHub workflow beyond what `RELEASE.md` requests; the deployer will wire `VITE_API_URL` into the build.
