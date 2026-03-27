export const STAKING_ABI = [
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "function earned(address account) view returns (uint256)",
  "function balances(address account) view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardPaid(address indexed user, uint256 reward)",
]

export const GOVERNANCE_ABI = [
  "function createProposal(address target, uint256 value, bytes callData, string description) returns (uint256)",
  "function castVote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  "function proposalState(uint256 proposalId) view returns (string)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed target, uint256 value, uint256 startTime, uint256 endTime, string description)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
  "event ProposalExecuted(uint256 indexed proposalId, address indexed target, uint256 value)",
]

export const PARTNER_CAMPAIGNS_ABI = [
  "function campaignCount() view returns (uint256)",
  "function claimCampaignRewards(uint256 campaignId)",
  "function userPoints(uint256 campaignId, address user) view returns (uint256)",
  "event CampaignCreated(uint256 indexed campaignId, address indexed partner, string propertyId, uint256 budget, uint256 rewardPerPoint, string metadataURI)",
  "event RewardsClaimed(uint256 indexed campaignId, address indexed user, uint256 amount)",
]
