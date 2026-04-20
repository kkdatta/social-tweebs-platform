# Credit usage: Modash (vendor) vs ZorbitAds (platform)

ZorbitAds uses **two separate credit concepts**. They are **not** the same unit of account: one is what **your Modash subscription** spends when the backend calls their API; the other is what **your customers** spend inside ZorbitAds when they use features.

### Overview: two billing domains

```
User / team (ZorbitAds credits)                    Backend (Modash API key)
    │                                                    │
    ▼                                                    ▼
credit_accounts.unified_balance              Bearer token → Modash API
    │                                                    │
    ▼                                                    ├── Discovery credits (billing.credits)
credit_transactions (debits)                           └── Raw API monthly quota (billing.rawRequests)
```

The two columns are **independent balances** — related only by your product design, not automatically synchronized.

---

## 1. Modash credits — platform spending

**What it is:** Billing on **Modash’s side** against your organization’s Modash API key. Every live call to Modash in production can consume:

- **Discovery credits** — decimal balance, charged per Discovery API endpoint (search, profile report, collaborations, audience overlap, etc.).
- **Raw API requests** — **monthly integer quota**; each Raw API call typically consumes **1** request (see [modash-integration.md](./modash-integration.md)).

**Who “pays”:** The **platform operator** (your Modash contract). End users do not see Modash’s balance directly.

**How it’s checked:** Modash exposes balances on `GET /user/info` as `billing.credits` and `billing.rawRequests` (see [credit-pricing.md](./credit-pricing.md)).

**When it is spent (production):** Whenever a service calls Modash and the [core caching pattern](./api-flows.md) does **not** avoid the call — for example cache miss, stale data that requires a refresh, or an endpoint that always hits the network. Some features use **0** Discovery credits but still use **Raw** quota (mention tracking, sentiments).

```
ZorbitAds backend (services)
    │
    ▼
HTTPS + Bearer API key → Modash
    │
    ├── Discovery credits (decimal)     ← check balance: GET /user/info → billing.credits
    │
    └── Raw requests (monthly quota)    ← check balance: GET /user/info → billing.rawRequests
```

```
Outbound call to Modash
    │
    ▼
Which product?
    │
    ├── [Discovery API] search, report, collaborations, overlap, …
    │       └── Deduct Discovery credits (vendor meter)
    │
    └── [Raw API] feeds, comments, …
            └── Deduct 1 from Raw monthly quota per successful request
```

---

## 2. Platform credits — user spending

**What it is:** An **internal ledger** in your PostgreSQL database: each user has a **credit account** (`credit_accounts.unified_balance`) and every deduction is recorded (e.g. `credit_transactions`). This is implemented by the **Credits** module (`CreditsService.deductCredits`, action types, and fixed **CREDIT_RULES** in code).

**Who “pays”:** The **logged-in user** (or team allocation flow): they must have enough **platform** credits or the action fails with “insufficient credits.”

**Typical platform prices (examples from code):** Actions map to types such as `INFLUENCER_INSIGHT`, `REPORT_GENERATION`, `REPORT_REFRESH`, `INFLUENCER_UNBLUR`, etc., each with a **platform** credit cost. These numbers are **product pricing**, not Modash’s invoice line items.

**Relationship to Modash:** Platform credit deduction is **gated in your app** — it does not replace Modash billing. For many flows, **both** apply: the user spends platform credits **and** (in production) the backend may call Modash and spend vendor credits or Raw quota.

```
User
    │
    ▼
credit_accounts (unified_balance per user)
    │
    ▼
credit_transactions (append debits / audit trail)
```

```
CreditsService.deductCredits()
    │
    ▼
CREDIT_RULES × quantity
    │
    ▼
unified_balance sufficient?
    │
    ├── Yes → Update credit_accounts + insert credit_transactions
    │
    └── No  → 400 Insufficient credits
```

---

## 3. How they work together (mental model)

| Layer | Meaning | Stored / visible where |
|--------|---------|-------------------------|
| **Modash** | Cost of **API usage** to the vendor | Modash dashboard / `GET /user/info` |
| **Platform** | **Entitlement** for the user inside ZorbitAds | `credit_accounts`, `credit_transactions` |

### End-to-end: one HTTP request, two possible meters

```
User request (feature action)
    │
    ▼
Controller (validates, auth)
    │
    ▼
Optional: CreditsService.deductCredits (if module charges platform credits)
    │
    ├── Insufficient balance → 400 Insufficient credits (stop)
    │
    └── OK → PostgreSQL: credit_accounts + credit_transactions
                │
                ▼
            Service layer
                │
                ├── [development] Simulated / dummy DB — no Modash billing
                │
                └── [production]
                        │
                        ├── Cache hit + no call needed? → Read PostgreSQL only (0 Modash vendor credits for that step)
                        │
                        └── Cache miss or call required?
                                └── Modash client → Modash API (vendor bills Discovery and/or Raw)
                                        └── Store / update rows in PostgreSQL
    │
    ▼
Response DTO
```

Not every step runs for every feature: some actions skip `CreditsService`, some skip Modash entirely, and some use Raw without Discovery.

---

## 4. Per-feature map: platform API use → Modash billing

Below, **platform** = credits deducted via `CreditsService` and `CREDIT_RULES` in code. **Discovery** / **Raw** = Modash-side meters (production, live Modash/Raw calls). Amounts for Modash are **typical** values from [api-flows.md](./api-flows.md) and [credit-pricing.md](./credit-pricing.md); real Modash spend depends on pages fetched, cache hits, and retries.

| User-facing feature (backend area) | Platform credits | Translates to Modash Discovery credits? | Translates to Raw API quota? |
|-----------------------------------|-------------------|----------------------------------------|------------------------------|
| **Discovery — search** (`searchInfluencers`) | **0** (`INFLUENCER_SEARCH` = 0) | **Yes** — ~**0.15** per page (15 results) per `POST /{platform}/search` | **No** |
| **Discovery — unblur** | **0.04 ×** each newly unlocked profile (`INFLUENCER_UNBLUR`) | **No** for this step — reads **cache**; Discovery was spent when results were searched/cached | **No** |
| **Discovery — view insights** (first access only) | **1** (`INFLUENCER_INSIGHT`) | **Yes** — **1** for `GET /{platform}/profile/{id}/report` when Modash is enabled | **No** |
| **Discovery — view insights** (return visit) | **0** | **No** if served from cache without refetch | **No** |
| **Discovery — refresh insights** | **1** (`REPORT_REFRESH`) | **Yes** — **1** report call | **No** |
| **Discovery — export** | **0.04 ×** each exported profile (`INFLUENCER_EXPORT`), unlocked profiles only | **No** — export uses stored profile data | **No** |
| **Insights module — unlock insight** (by username) | **1** (`INFLUENCER_INSIGHT`) | **Yes** — **1** report if Modash enabled; **No** Modash call if disabled (local DB only), but platform still charges **1** | **No** |
| **Insights module — get by id** | **0** | **No** | **No** |
| **Insights module — force refresh** | **1** (`REPORT_REFRESH`) if Modash enabled; **0** if Modash disabled | **Yes** — **1** report when Modash enabled | **No** |
| **Collab check — create report** | **1 ×** number of influencers (`REPORT_GENERATION`) | **Yes** — ~**0.4** per influencer (posts + summary) | **No** |
| **Collab check — refresh** | **1** (`REPORT_REFRESH`) | **Yes** — same collaboration endpoints again (variable) | **No** |
| **Paid collaboration — create** | **1** per report (`REPORT_GENERATION`) | **Yes** — search pages (~0.15 each) + ~**0.2** per influencer for collaboration posts | **No** |
| **Paid collaboration — refresh** | **1** (`REPORT_REFRESH`) | **Yes** (variable) | **No** |
| **Audience overlap — create** | **1** (`REPORT_GENERATION`) | **Yes** — **1** fixed for `audience/overlap` | **No** |
| **Audience overlap — retry failed** | **1** (`REPORT_GENERATION`) | **Yes** — **1** again on reprocess | **No** |
| **Competition analysis — create** | **1** (`REPORT_GENERATION`) | **Yes** — ~**0.4** per brand (posts + summary) | **No** |
| **Competition analysis — refresh** | **1** (`REPORT_REFRESH`) | **Yes** (variable) | **No** |
| **Mention tracking — create** | **1** (`REPORT_GENERATION`) | **No** Discovery credits (Raw-only flows in doc) | **Yes** — many Raw calls (hashtag/user feeds, etc.) |
| **Mention tracking — refresh** | **1** (`REPORT_REFRESH`) | **No** Discovery | **Yes** |
| **Sentiments — create** | **1 ×** number of URLs (`REPORT_GENERATION`) | **No** Discovery (comment endpoints are Raw) | **Yes** — scales with URLs/pages |
| **Sentiments — refresh** | **1** (`REPORT_REFRESH`) | **No** Discovery | **Yes** |
| **Custom ER — create / process** | **0** (explicitly no deduction in `CustomErService`) | **Sometimes** — up to **1** if profile report fetched; optional collaboration call ~**0.2** | **Yes** — feed/video endpoints |
| **Tie breaker — create comparison** | **1 ×** each influencer not already unlocked for this flow (`PROFILE_UNLOCK`) | **Yes** — up to **1** report per influencer still missing fresh cached report data (see [api-flows.md](./api-flows.md) — section “12. Tie Breaker”) | **No** |
| **Campaigns** (credit-gated create) | **1** (`REPORT_GENERATION`) | **No** Modash in architecture list for campaigns | **No** |

### Translation patterns (platform vs Modash)

**A — Both meters can move**

```
User debited (platform credits)
    │
    ▼
Modash charges operator (Discovery and/or Raw)
```

**B — Platform only on this request**

```
User debited (platform credits)
    │
    ▼
No new Modash call on this request (cache, export, unblur)
```

**C — Modash Discovery, 0 platform line for search**

```
0 platform credits (INFLUENCER_SEARCH = 0)
    │
    ▼
Discovery still charged per search page (production)
```

**D — Operator Raw-heavy**

```
User pays fixed platform fee (e.g. 1 credit per report)
    │
    ▼
Modash: 0 Discovery credits + many Raw API calls
```

### How to read “translates” vs “does not translate”

- **Platform → Modash Discovery**  
  - **Translates** when the backend actually calls a **Discovery**-billed endpoint in production; your user’s platform debit and Modash’s Discovery debit often happen **together**, but **not 1:1** in numeric value (e.g. user pays **1** platform credit for overlap; Modash also charges **1** Discovery credit for that call — same number by coincidence here, not a universal rule).  
  - **Does not translate** when the operation is **cache-only**, **local DB**, or **Raw-only** — users may still spend platform credits while Modash Discovery stays **0**, or Modash Discovery is spent (search) while platform credits stay **0**.

- **Platform → Raw quota**  
  - Mostly **no** platform line item maps 1:1 to Raw. Raw is a **separate monthly counter**: mention tracking, sentiments, and custom ER can burn **many** Raw requests while Discovery credits move little or not at all.

### Exceptions called out in architecture docs

- **Unblur:** Platform cost **without** a Modash call on that request — Discovery was “paid” earlier when search populated the cache.
- **Search:** Modash Discovery cost **without** a platform per-search charge (**0** platform credits for `INFLUENCER_SEARCH`).
- **Custom ER:** **No** platform credit in current code; Modash costs can still apply to the operator (report + Raw + optional collaboration).

---

## 5. Development vs production

```
APP_MODE (.env)
    │
    ├── development
    │       ├── Modash: disabled / simulated
    │       ├── DB: postgres (dummy / dev data)
    │       └── No real Modash billing
    │
    └── production
            ├── Modash: live API + cache (zorbitads_production)
            ├── Real Discovery + Raw usage on outbound calls
            └── Platform credits: real deductions where implemented
```

From [README.md](./README.md):

| Mode | Modash | Platform credit behavior |
|------|--------|---------------------------|
| `APP_MODE=development` | Disabled / simulated | No real Modash spend; platform credit paths may still run depending on module — confirm per feature |
| `APP_MODE=production` | Live API + caching | Real Modash spend + real platform deductions where implemented |

---

## 6. Related documentation

| Document | Role |
|----------|------|
| [api-flows.md](./api-flows.md) | Per-endpoint flows; labels **Modash cost** vs **CreditsService** / tables |
| [credit-pricing.md](./credit-pricing.md) | Modash Discovery vs Raw costs per user action (vendor-side) |
| [modash-integration.md](./modash-integration.md) | Modash products, endpoints, billing counters |
| [README.md](./README.md) | High-level architecture and module list |

---

## Summary

- **Modash credits (and Raw quota)** = **your platform’s** spend when calling Modash in production.
- **Platform credits** = **your users’** spend tracked in **ZorbitAds**’s own ledger; unrelated units and rules unless you intentionally align them in product design.

Keeping both in mind avoids conflating “1 credit” on an invoice from Modash with “1 credit” deducted from a user’s `unified_balance`.
