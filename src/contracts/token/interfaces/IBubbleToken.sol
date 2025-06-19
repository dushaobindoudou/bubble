// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IBubbleToken
 * @dev Bubble Token 合约接口
 */
interface IBubbleToken is IERC20 {
    // 事件
    event GameRewardMinted(address indexed player, uint256 amount, string reason);
    event GameRewardsBatchMinted(address[] players, uint256[] amounts, string reason);
    event DailyRewardLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event TokensBurned(address indexed burner, uint256 amount);

    // 游戏奖励功能
    function mintGameReward(address player, uint256 amount, string memory reason) external;
    function mintGameRewardsBatch(address[] memory players, uint256[] memory amounts, string memory reason) external;

    // 代币分配功能
    function releaseTeamTokens(address to, uint256 amount) external;
    function releaseCommunityTokens(address to, uint256 amount) external;
    function releaseLiquidityTokens(address to, uint256 amount) external;

    // 管理功能
    function setDailyRewardLimit(uint256 newLimit) external;

    // 查询功能
    function getRemainingGameRewards() external view returns (uint256);
    function getRemainingTeamTokens() external view returns (uint256);
    function getRemainingCommunityTokens() external view returns (uint256);
    function getRemainingLiquidityTokens() external view returns (uint256);
    function getTodayRemainingRewards() external view returns (uint256);
    function getAllocationStats() external view returns (uint256, uint256, uint256, uint256, uint256);

    // 常量
    function MAX_SUPPLY() external view returns (uint256);
    function GAME_REWARDS_POOL() external view returns (uint256);
    function TEAM_ALLOCATION() external view returns (uint256);
    function COMMUNITY_INCENTIVES() external view returns (uint256);
    function LIQUIDITY_MINING() external view returns (uint256);
    function PUBLIC_SALE() external view returns (uint256);
}
