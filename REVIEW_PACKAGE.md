# CoinLocator MVP Review (Interview Prep)

**Prepared for:** Marcos Alexandre Alves Noronha  
**Prepared by:** [Your Name]  
**Date:** [YYYY-MM-DD]

---

## Screenshots (attach at top)

> **Dashboard page screenshot** — attach here.
>
> **Listcoin page screenshot** — attach here.

---

## Run note (local)

- Ran locally via `npm start` (React dev server + Express pre-step). Browsed UI without signing transactions.  

---

## First pass: architecture + intent

- **Overall architecture:** React SPA (`src/`) + small Express server (`app/`) used for pre-step/serving build. On-chain touchpoints are limited to a Nitrogem contract ABI/source under `src/helpers/abis`, with web3 interactions in `src/helpers/contract.js` + `src/helpers/interact.js`. Firebase Realtime DB is the primary persistence layer for coin listings, vote counts, and rate limiting.
- **Main user flows:** (1) Browse/promote coins, view details, vote. (2) Buy tiers/Nitrogem to increase voting power. (3) UI promotes coins based on vote counts and tier thresholds.
- **Smart-contract vs frontend:** Contract usage is limited to `buy*` and `voteWithNitrogem`. Most state (coin list, vote counts, tiers, daily vote limits) is Firebase + React UI.
- **MVP assumptions:** Off-chain state is trusted; config is hardcoded in `ENVS`; governance is a simple vote counter vs. proposal → vote → execution lifecycle.

---

## Second pass: smart contract review (high leverage)

- **Responsibilities:** `NitrogemContract` tracks a simple balance mapping (`amountNitrogem`) and exposes purchase methods, a spend method, and owner withdrawal.
- **Upgrade strategy:** None evident; address is hardcoded in the frontend.
- **Reward accounting model:** No staking/reward accrual logic; purchases increase balances, voting burns balances; tier purchases emit events but do not change balances.
- **Governance flow assumptions:** Voting is not governed on-chain; off-chain (Firebase/UI) handles limits and tier thresholds.
- **Gas/security smells (obvious):** Large if/else ladder for fixed-price purchases; no events for `voteWithNitrogem`; minimal input validation; owner withdrawal is all-or-nothing; env-like placeholders in Solidity likely need deployment/config injection or replacement with constants/constructor params.

---

## Third pass: integration + DX

- **Frontend indexing:** Indexer would mostly rely on Firebase; on-chain events are limited to `buy*` flows.
- **Event consistency:** Purchases emit events, voting doesn’t; tier events don’t necessarily reflect on-chain balance changes.
- **DX pain points:** Mixed sources of truth; hardcoded chain config; Express backend appears incidental to core flows.
- **Where bugs show up first:** Firebase vote limits/tier transitions; chain ID mismatch; missing vote events complicate debugging.

---

## 6–10 bullets (3 solid, 3 risks, 2–4 improvements)

**Solid**
1. Clear separation between pages/components makes UI flows easy to trace.
2. Centralized web3 interaction wrappers simplify contract calls.
3. Firebase-backed listings enable fast MVP iteration.

**Risks / gaps**
1. Governance/voting looks off-chain today — fast for MVP; confirm long-term plan for on-chain anchoring/events.
2. Chain config looks inconsistent (Goerli address with mainnet `0x1`), which can cause wallet/network mismatches.
3. Missing vote events limit indexability and audit trails.

**Improvements**
1. Emit vote/tier events and anchor vote counts on-chain (or via signed attestations).
2. Add minimal governance module (proposal → vote → execution) if roadmap includes on-chain governance.
3. Centralize environment config in `.env` and align chain IDs.
4. Define upgrade/migration strategy (proxy or documented redeploy + data migration).
