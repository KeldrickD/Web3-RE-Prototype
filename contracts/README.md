# Real Estate Web3 MVP Contracts

This folder adds an integration-ready smart-contract suite for a tokenized real-estate MVP.

## Contracts

- `RealEstateToken.sol`
  - ERC20 governance/reward token (`REGT`)
  - Role-based minting (`MINTER_ROLE`)
- `RealEstateStaking.sol`
  - Stake / unstake / claim
  - Reward-rate distribution model (`notifyRewardAmount`)
  - Emits full staking lifecycle events for indexers
- `RealEstateGovernance.sol`
  - Proposal creation
  - Voting with stake-based voting power
  - Timelocked execution and cancellation
- `PartnerCampaigns.sol`
  - Partner promotion campaigns
  - Per-user points and reward claims
  - Oracle role to update points from backend/indexer

## Upgrade strategy recommendation

Current contracts are deployable as-is (non-proxy).

For production upgrades:
1. Deploy via Transparent Proxy/UUPS using OpenZeppelin Upgradeable contracts.
2. Keep storage layout frozen between versions.
3. Introduce `ContractRegistry` so frontend/indexers can discover latest addresses.
4. Gate upgrades behind governance + timelock.

## Indexing events (subgraph/backend)

Suggested events to index first:

- `Staked`, `Withdrawn`, `RewardPaid`, `RewardAdded`
- `ProposalCreated`, `VoteCast`, `ProposalExecuted`, `ProposalCanceled`
- `CampaignCreated`, `CampaignFunded`, `UserPointsUpdated`, `RewardsClaimed`

These are designed to support wallet dashboards, governance timelines, and partner reward analytics.
