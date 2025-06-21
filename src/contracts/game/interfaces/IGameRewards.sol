// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGameRewards
 * @dev 游戏奖励合约接口
 */
interface IGameRewards {
    // 结构体定义
    struct GameSession {
        address player;
        uint256 finalRank;
        uint256 maxMass;
        uint256 survivalTime;
        uint256 killCount;
        uint256 sessionEndTime;
        bytes32 sessionId;
        bool verified;
        bool claimed;              // 是否已领取奖励
        uint256 submittedAt;       // 提交时间
    }

    struct RewardConfig {
        uint256 baseReward;
        uint256 rankMultiplier;
        uint256 killBonus;
        uint256 survivalBonus;
        uint256 massBonus;
        uint256 maxReward;
        bool enabled;
    }

    // 事件
    event RewardDistributed(address indexed player, uint256 tokenAmount, bytes32 indexed sessionId, string rewardType);
    event NFTRewardDistributed(address indexed player, uint256 tokenId, bytes32 indexed sessionId);
    event RewardConfigUpdated(uint256 baseReward, uint256 rankMultiplier, uint256 killBonus, uint256 survivalBonus, uint256 massBonus);
    event SessionProcessed(bytes32 indexed sessionId, address indexed player, uint256 totalReward);

    // 新增事件
    event PlayerSessionSubmitted(bytes32 indexed sessionId, address indexed player, uint256 finalRank, uint256 maxMass, uint256 survivalTime, uint256 killCount);
    event SessionVerified(bytes32 indexed sessionId, address indexed verifier, bool approved);
    event RewardClaimed(bytes32 indexed sessionId, address indexed player, uint256 tokenAmount, uint256 claimedAt);
    event SessionExpired(bytes32 indexed sessionId, address indexed player);

    // 奖励分发功能
    function distributeReward(GameSession memory session) external;
    function distributeRewardsBatch(GameSession[] memory sessions) external;
    function calculateReward(GameSession memory session) external view returns (uint256);

    // 管理功能
    function updateRewardConfig(uint256 _baseReward, uint256 _rankMultiplier, uint256 _killBonus, uint256 _survivalBonus, uint256 _massBonus, uint256 _maxReward) external;
    function setRewardEnabled(bool enabled) external;
    function setPlayerDailyLimit(address player, uint256 maxRewardsPerDay, uint256 maxTokensPerDay) external;

    // 玩家自主提交功能
    function submitPlayerSession(uint256 finalRank, uint256 maxMass, uint256 survivalTime, uint256 killCount, uint256 sessionEndTime, bytes32 sessionId) external;

    // 管理员审核功能
    function verifyPlayerSession(bytes32 sessionId, bool approved) external;
    function verifyPlayerSessionsBatch(bytes32[] memory sessionIds, bool[] memory approvals) external;

    // 玩家自主领取功能
    function claimReward(bytes32 sessionId) external;
    function claimRewardsBatch(bytes32[] memory sessionIds) external;

    // 查询功能
    function getPlayerSessions(address player) external view returns (GameSession[] memory);
    function getPlayerDailyStatus(address player) external view returns (uint256 rewardCount, uint256 tokenAmount, uint256 remaining);
    function getSystemStats() external view returns (uint256 totalRewards, uint256 totalTokens, uint256 totalSessions, bool enabled);

    // 新增查询功能
    function getPlayerSubmittedSessions(address player) external view returns (bytes32[] memory);
    function getPlayerClaimableSessions(address player) external view returns (bytes32[] memory);
    function getPendingVerificationSessions(uint256 offset, uint256 limit) external view returns (bytes32[] memory);
    function getSessionDetails(bytes32 sessionId) external view returns (GameSession memory);
    function getPlayerSessionStats(address player) external view returns (uint256 submitted, uint256 verified, uint256 claimed, uint256 claimable);
    function getExtendedSystemStats() external view returns (uint256 totalSubmitted, uint256 totalVerified, uint256 pendingCount, uint256 expiredCount);

    // 管理员配置功能
    function setSessionValidityPeriod(uint256 newPeriod) external;
    function setMaxSessionsPerDay(uint256 newLimit) external;
    function cleanupExpiredSessions(uint256 maxCleanup) external;
}
