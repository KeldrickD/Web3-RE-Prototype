// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title PartnerCampaigns
/// @notice Promotion incentive contract for real-estate partners and campaigns.
contract PartnerCampaigns is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant CAMPAIGN_ADMIN_ROLE = keccak256("CAMPAIGN_ADMIN_ROLE");
    bytes32 public constant CAMPAIGN_ORACLE_ROLE = keccak256("CAMPAIGN_ORACLE_ROLE");

    struct Campaign {
        address partner;
        string propertyId;
        string metadataURI;
        IERC20 rewardToken;
        uint256 rewardPerPoint;
        uint256 budget;
        uint256 remaining;
        bool active;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public userPoints;
    mapping(uint256 => mapping(address => uint256)) public userClaimed;

    event CampaignCreated(uint256 indexed campaignId, address indexed partner, string propertyId, uint256 budget, uint256 rewardPerPoint, string metadataURI);
    event CampaignFunded(uint256 indexed campaignId, uint256 amount, uint256 newBudget);
    event CampaignStatusChanged(uint256 indexed campaignId, bool active);
    event UserPointsUpdated(uint256 indexed campaignId, address indexed user, uint256 points);
    event RewardsClaimed(uint256 indexed campaignId, address indexed user, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CAMPAIGN_ADMIN_ROLE, admin);
    }

    function createCampaign(
        address partner,
        string calldata propertyId,
        string calldata metadataURI,
        address rewardToken,
        uint256 rewardPerPoint,
        uint256 initialBudget,
        bool active
    ) external onlyRole(CAMPAIGN_ADMIN_ROLE) returns (uint256 campaignId) {
        require(partner != address(0), "Invalid partner");
        require(rewardToken != address(0), "Invalid token");
        require(rewardPerPoint > 0, "Invalid reward");

        campaignId = ++campaignCount;
        Campaign storage campaign = campaigns[campaignId];
        campaign.partner = partner;
        campaign.propertyId = propertyId;
        campaign.metadataURI = metadataURI;
        campaign.rewardToken = IERC20(rewardToken);
        campaign.rewardPerPoint = rewardPerPoint;
        campaign.budget = initialBudget;
        campaign.remaining = initialBudget;
        campaign.active = active;

        if (initialBudget > 0) {
            campaign.rewardToken.safeTransferFrom(msg.sender, address(this), initialBudget);
        }

        emit CampaignCreated(campaignId, partner, propertyId, initialBudget, rewardPerPoint, metadataURI);
    }

    function fundCampaign(uint256 campaignId, uint256 amount) external onlyRole(CAMPAIGN_ADMIN_ROLE) {
        Campaign storage campaign = campaigns[campaignId];
        require(address(campaign.rewardToken) != address(0), "Campaign missing");
        require(amount > 0, "Zero amount");

        campaign.rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        campaign.budget += amount;
        campaign.remaining += amount;

        emit CampaignFunded(campaignId, amount, campaign.budget);
    }

    function setCampaignStatus(uint256 campaignId, bool active) external onlyRole(CAMPAIGN_ADMIN_ROLE) {
        campaigns[campaignId].active = active;
        emit CampaignStatusChanged(campaignId, active);
    }

    /// @notice Update user campaign points from a backend/indexer oracle.
    function setUserPoints(uint256 campaignId, address user, uint256 points) external onlyRole(CAMPAIGN_ORACLE_ROLE) {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Inactive campaign");
        userPoints[campaignId][user] = points;
        emit UserPointsUpdated(campaignId, user, points);
    }

    function claimCampaignRewards(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Inactive campaign");

        uint256 eligibleReward = userPoints[campaignId][msg.sender] * campaign.rewardPerPoint;
        uint256 alreadyClaimed = userClaimed[campaignId][msg.sender];
        require(eligibleReward > alreadyClaimed, "Nothing to claim");

        uint256 toClaim = eligibleReward - alreadyClaimed;
        require(campaign.remaining >= toClaim, "Campaign depleted");

        userClaimed[campaignId][msg.sender] = eligibleReward;
        campaign.remaining -= toClaim;
        campaign.rewardToken.safeTransfer(msg.sender, toClaim);

        emit RewardsClaimed(campaignId, msg.sender, toClaim);
    }
}
