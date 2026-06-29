# Next Steps — Production Readiness

## TL;DR

The app is a **feature-complete, well-tested demo**: 32 passing tests, clean
typecheck, accessible UI, resilient caching. It is **not yet production-grade** —
it has no CI gate, no error recovery, no production visibility, and it trusts the
external API's response shape without validation.

**If you do nothing else, do the P0 list below.** It converts the three failure
modes that would actually hurt users (silent crashes, silent bad data, invisible
production errors) into safe, observable ones — in roughly a day of work.

---

## Why it isn't production-ready yet

Each gap below is framed by its **real-world impact**, not the missing technology.

| Gap | What a user/operator actually experiences today |
|-----|--------------------------------------------------|
| No error boundary | One unexpected render error → **entire app goes blank**, no recovery |
| No runtime API validation | If TheSportsDB changes its response → **empty UI, no error**, looks "broken but fine" |
| No error monitoring | A production bug is **invisible** until a user complains |
| No CI gate | A broken commit can reach `main` with **nothing stopping it** |
| No linting (react-hooks) | A whole class of effect-dependency bugs ships **uncaught by types** |
| No rate-limit handling | Load fans out **15 parallel requests**; a fast refresh can trip the free tier's 30/min cap with no backoff |
| In-memory cache only | Every refresh **re-fetches everything**; no offline support |
| No routing | Leagues **can't be bookmarked or shared** |

---

## Action plan

Prioritized by impact-per-effort. Effort is rough: **S** ≈ hours, **M** ≈ 1–2 days.

### P0 — Safety net (do first, ~1 day total)

| # | Action | Why it matters | Effort |
|---|--------|----------------|--------|
| 1 | **CI workflow** (GitHub Actions): `typecheck → lint → test → build`, blocking on PR | Stops regressions at the door | S |
| 2 | **ESLint** + `eslint-plugin-react-hooks`, **Prettier** | Catches real hook-dependency bugs types miss | S |
| 3 | **Error boundary** at the `App` root | A crash becomes a recoverable message, not a blank screen | S |
| 4 | **Runtime API validation** (`zod`) at the `client.ts` boundary | A changed API fails loudly instead of showing empty cards | M |
| 5 | **Error monitoring** (Sentry) | Gives you eyes on production from day one | S |

### P1 — Resilience & product (next)

| # | Action | Why it matters | Effort |
|---|--------|----------------|--------|
| 6 | **Retry + backoff + timeout** in `fetchJson` (`AbortController`); throttle the 15-sport fan-out | Survives transient failures and the 30/min free-tier cap | M |
| 7 | **Persistent cache with TTL** — *this is where TanStack Query earns its place* | Refreshes stop re-fetching; stale data expires sensibly | M |
| 8 | **Routing** (`/league/:id` opens the modal) | Leagues become bookmarkable and shareable | M |
| 9 | **Product analytics** for the core funnel (searches, filters, opens) | Learn what users actually do | S |

### P2 — Scale & depth (later)

| # | Action | Why it matters | Effort |
|---|--------|----------------|--------|
| 10 | **Paginate or virtualize** the grid | Decouples render cost from list size (matters on a premium key) | M |
| 11 | **E2E tests** (Playwright): load → search → open → close → focus return | Covers the real browser flow | M |
| 12 | **Automated a11y tests** (`axe`) in CI | Prevents accessibility regressions | S |
| 13 | **Make the `SPORTS` list data-driven** | New sports appear without a code change | S |

---

## What we intentionally deferred (and why it was right)

These were correct scope cuts for a demo — list them so reviewers know they were
**decisions, not oversights**.

| Deferred | Why it was the right call for a demo |
|----------|--------------------------------------|
| Routing / deep links | One view + one modal; navigation added no demo value |
| Pagination / virtualization | ~60–70 leagues on the free key render instantly |
| Persistent cache | Session-lived cache fully demonstrates the dedupe/eviction design |
| Search debounce | Filtering is pure in-memory work — debouncing would add latency for no benefit |
| UI component library | Custom components gave full design control with zero bundle bloat |

---

## Deployment & the API key

- **Hosting:** build to `dist/`, serve as a static site from **S3 + CloudFront**,
  provisioned via a **Terraform PR** (no manual console changes).
- **API key:** `VITE_SPORTSDB_KEY` is **build-time and client-exposed** — anything
  `VITE_`-prefixed ships inside the browser bundle and is **not secret**. The
  default `123` is TheSportsDB's public free key, so this is fine as-is. A
  **premium** key would still be visible in the shipped bundle; if real billing is
  attached, proxy it through a backend rather than shipping it to the client.
