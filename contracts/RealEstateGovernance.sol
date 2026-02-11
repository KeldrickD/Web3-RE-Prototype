// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IStakingVotingPower {
    function votingPower(address account) external view returns (uint256);
}

/// @title RealEstateGovernance
/// @notice Simple proposal + vote + execute governance powered by staking voting balances.
contract RealEstateGovernance is Ownable {
    struct Proposal {
        address proposer;
        address target;
        uint256 value;
        bytes callData;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }

    IStakingVotingPower public immutable staking;

    uint256 public proposalCount;
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 5 days;
    uint256 public timelockDelay = 1 days;
    uint256 public quorum = 1_000 ether;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed target, uint256 value, uint256 startTime, uint256 endTime, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, address indexed target, uint256 value);
    event ProposalCanceled(uint256 indexed proposalId);
    event GovernanceConfigUpdated(uint256 votingDelay, uint256 votingPeriod, uint256 timelockDelay, uint256 quorum);

    error ProposalNotActive();
    error ProposalNotSuccessful();
    error AlreadyVoted();
    error NoVotingPower();

    constructor(address stakingAddress, address initialOwner) Ownable(initialOwner) {
        staking = IStakingVotingPower(stakingAddress);
    }

    function createProposal(address target, uint256 value, bytes calldata callData, string calldata description)
        external
        returns (uint256 proposalId)
    {
        require(target != address(0), "Invalid target");
        require(staking.votingPower(msg.sender) > 0, "Stake required");

        proposalId = ++proposalCount;
        uint256 start = block.timestamp + votingDelay;
        uint256 end = start + votingPeriod;

        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            target: target,
            value: value,
            callData: callData,
            description: description,
            startTime: start,
            endTime: end,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalId, msg.sender, target, value, start, end, description);
    }

    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];

        if (!(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime && !proposal.canceled)) {
            revert ProposalNotActive();
        }
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 weight = staking.votingPower(msg.sender);
        if (weight == 0) revert NoVotingPower();

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external payable {
        Proposal storage proposal = proposals[proposalId];

        bool voteClosed = block.timestamp > proposal.endTime;
        bool timelockComplete = block.timestamp >= proposal.endTime + timelockDelay;
        bool successful = proposal.forVotes > proposal.againstVotes && proposal.forVotes >= quorum;

        if (!voteClosed || !timelockComplete || proposal.executed || proposal.canceled || !successful) {
            revert ProposalNotSuccessful();
        }

        proposal.executed = true;

        (bool ok,) = proposal.target.call{value: proposal.value}(proposal.callData);
        require(ok, "Execution failed");

        emit ProposalExecuted(proposalId, proposal.target, proposal.value);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer || msg.sender == owner(), "Not authorized");
        require(!proposal.executed, "Already executed");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function setGovernanceConfig(uint256 _votingDelay, uint256 _votingPeriod, uint256 _timelockDelay, uint256 _quorum)
        external
        onlyOwner
    {
        require(_votingPeriod >= 1 days, "Period too short");
        require(_quorum > 0, "Zero quorum");

        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        timelockDelay = _timelockDelay;
        quorum = _quorum;

        emit GovernanceConfigUpdated(_votingDelay, _votingPeriod, _timelockDelay, _quorum);
    }

    function proposalState(uint256 proposalId) external view returns (string memory) {
        Proposal memory p = proposals[proposalId];

        if (p.canceled) return "Canceled";
        if (p.executed) return "Executed";
        if (block.timestamp < p.startTime) return "Pending";
        if (block.timestamp <= p.endTime) return "Active";

        bool successful = p.forVotes > p.againstVotes && p.forVotes >= quorum;
        if (!successful) return "Defeated";

        if (block.timestamp < p.endTime + timelockDelay) return "Queued";
        return "ReadyForExecution";
    }
}
