// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title BubbleToken
 * @dev Bubble Brawl 游戏平台代币 $BUB
 *
 * 功能特性：
 * - 标准 ERC-20 代币功能
 * - 游戏奖励铸造机制
 * - 反通胀销毁机制
 * - 多级权限管理
 * - 重入攻击防护
 *
 * 代币经济模型：
 * - 总供应量: 1,000,000,000 BUB
 * - 游戏奖励池: 40% (400M)
 * - 团队预留: 20% (200M)
 * - 社区激励: 20% (200M)
 * - 流动性挖矿: 15% (150M)
 * - 公开销售: 5% (50M)
 */
contract BubbleToken is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_REWARD_ROLE = keccak256("GAME_REWARD_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // 角色成员管理
    EnumerableSet.AddressSet private _gameRewardRoleMembers;

    // 代币供应量常量
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant GAME_REWARDS_POOL = 400_000_000 * 10**18;
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18;
    uint256 public constant COMMUNITY_INCENTIVES = 200_000_000 * 10**18;
    uint256 public constant LIQUIDITY_MINING = 150_000_000 * 10**18;
    uint256 public constant PUBLIC_SALE = 50_000_000 * 10**18;

    // 状态变量
    uint256 public gameRewardsMinted;
    uint256 public teamTokensReleased;
    uint256 public communityTokensReleased;
    uint256 public liquidityTokensReleased;
    uint256 public publicSaleTokensReleased;

    // 游戏奖励限制
    uint256 public dailyRewardLimit = 1_000_000 * 10**18; // 每日最大奖励 1M BUB
    uint256 public lastRewardDate;
    uint256 public dailyRewardsMinted;

    // 事件定义
    event GameRewardMinted(address indexed player, uint256 amount, string reason);
    event GameRewardsBatchMinted(address[] players, uint256[] amounts, string reason);
    event DailyRewardLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event TokensBurned(address indexed burner, uint256 amount);

    // 角色管理事件
    event GameRewardRoleGranted(address indexed account, address indexed admin);
    event GameRewardRoleRevoked(address indexed account, address indexed admin);

    /**
     * @dev 构造函数
     * 初始化代币并设置管理员权限
     */
    constructor() ERC20("BubbleToken", "BUB") {
        // 设置管理员角色
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // 铸造初始供应量给部署者（用于分配）
        _mint(msg.sender, PUBLIC_SALE);
        publicSaleTokensReleased = PUBLIC_SALE;

        // 初始化每日奖励日期
        lastRewardDate = block.timestamp / 1 days;
    }

    /**
     * @dev 游戏奖励铸造
     * @param player 玩家地址
     * @param amount 奖励数量
     * @param reason 奖励原因
     */
    function mintGameReward(
        address player,
        uint256 amount,
        string memory reason
    ) external onlyRole(GAME_REWARD_ROLE) nonReentrant {
        require(player != address(0), "BubbleToken: invalid player address");
        require(amount > 0, "BubbleToken: amount must be greater than 0");
        require(gameRewardsMinted + amount <= GAME_REWARDS_POOL, "BubbleToken: exceeds game rewards pool");

        _checkDailyRewardLimit(amount);

        gameRewardsMinted += amount;
        _mint(player, amount);

        emit GameRewardMinted(player, amount, reason);
    }

    /**
     * @dev 批量游戏奖励铸造
     * @param players 玩家地址数组
     * @param amounts 奖励数量数组
     * @param reason 奖励原因
     */
    function mintGameRewardsBatch(
        address[] memory players,
        uint256[] memory amounts,
        string memory reason
    ) external onlyRole(GAME_REWARD_ROLE) nonReentrant {
        require(players.length == amounts.length, "BubbleToken: arrays length mismatch");
        require(players.length > 0, "BubbleToken: empty arrays");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(players[i] != address(0), "BubbleToken: invalid player address");
            require(amounts[i] > 0, "BubbleToken: amount must be greater than 0");
            totalAmount += amounts[i];
        }

        require(gameRewardsMinted + totalAmount <= GAME_REWARDS_POOL, "BubbleToken: exceeds game rewards pool");
        _checkDailyRewardLimit(totalAmount);

        gameRewardsMinted += totalAmount;

        for (uint256 i = 0; i < players.length; i++) {
            _mint(players[i], amounts[i]);
        }

        emit GameRewardsBatchMinted(players, amounts, reason);
    }

    /**
     * @dev 团队代币释放
     * @param to 接收地址
     * @param amount 释放数量
     */
    function releaseTeamTokens(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "BubbleToken: invalid address");
        require(teamTokensReleased + amount <= TEAM_ALLOCATION, "BubbleToken: exceeds team allocation");

        teamTokensReleased += amount;
        _mint(to, amount);
    }

    /**
     * @dev 社区激励代币释放
     * @param to 接收地址
     * @param amount 释放数量
     */
    function releaseCommunityTokens(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "BubbleToken: invalid address");
        require(communityTokensReleased + amount <= COMMUNITY_INCENTIVES, "BubbleToken: exceeds community allocation");

        communityTokensReleased += amount;
        _mint(to, amount);
    }

    /**
     * @dev 流动性挖矿代币释放
     * @param to 接收地址
     * @param amount 释放数量
     */
    function releaseLiquidityTokens(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "BubbleToken: invalid address");
        require(liquidityTokensReleased + amount <= LIQUIDITY_MINING, "BubbleToken: exceeds liquidity allocation");

        liquidityTokensReleased += amount;
        _mint(to, amount);
    }

    /**
     * @dev 设置每日奖励限制
     * @param newLimit 新的每日限制
     */
    function setDailyRewardLimit(uint256 newLimit) external onlyRole(ADMIN_ROLE) {
        uint256 oldLimit = dailyRewardLimit;
        dailyRewardLimit = newLimit;
        emit DailyRewardLimitUpdated(oldLimit, newLimit);
    }

    // ============ GAME_REWARD_ROLE 管理功能 ============

    /**
     * @dev 授予游戏奖励角色
     * @param account 要授予角色的地址
     *
     * 要求：
     * - 调用者必须具有 DEFAULT_ADMIN_ROLE
     * - 账户地址不能为零地址
     * - 账户不能已经拥有该角色
     */
    function grantGameRewardRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(account != address(0), "BubbleToken: cannot grant role to zero address");
        require(!hasRole(GAME_REWARD_ROLE, account), "BubbleToken: account already has game reward role");

        // 授予角色（_grantRole 重写会自动处理枚举集合）
        _grantRole(GAME_REWARD_ROLE, account);

        emit GameRewardRoleGranted(account, msg.sender);
    }

    /**
     * @dev 撤销游戏奖励角色
     * @param account 要撤销角色的地址
     *
     * 要求：
     * - 调用者必须具有 DEFAULT_ADMIN_ROLE
     * - 账户地址不能为零地址
     * - 账户必须拥有该角色
     */
    function revokeGameRewardRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(account != address(0), "BubbleToken: cannot revoke role from zero address");
        require(hasRole(GAME_REWARD_ROLE, account), "BubbleToken: account does not have game reward role");

        // 撤销角色（_revokeRole 重写会自动处理枚举集合）
        _revokeRole(GAME_REWARD_ROLE, account);

        emit GameRewardRoleRevoked(account, msg.sender);
    }

    /**
     * @dev 检查地址是否拥有游戏奖励角色
     * @param account 要检查的地址
     * @return 如果地址拥有游戏奖励角色则返回 true
     */
    function hasGameRewardRole(address account) external view returns (bool) {
        return hasRole(GAME_REWARD_ROLE, account);
    }

    /**
     * @dev 获取所有拥有游戏奖励角色的地址
     * @return 拥有游戏奖励角色的地址数组
     */
    function getGameRewardRoleMembers() external view returns (address[] memory) {
        return _gameRewardRoleMembers.values();
    }

    /**
     * @dev 获取拥有游戏奖励角色的地址数量
     * @return 拥有游戏奖励角色的地址数量
     */
    function getGameRewardRoleMemberCount() external view returns (uint256) {
        return _gameRewardRoleMembers.length();
    }

    /**
     * @dev 获取指定索引的游戏奖励角色成员地址
     * @param index 索引位置
     * @return 指定索引位置的地址
     *
     * 要求：
     * - 索引必须小于成员总数
     */
    function getGameRewardRoleMemberAt(uint256 index) external view returns (address) {
        require(index < _gameRewardRoleMembers.length(), "BubbleToken: index out of bounds");
        return _gameRewardRoleMembers.at(index);
    }

    /**
     * @dev 销毁代币（重写以添加事件）
     * @param amount 销毁数量
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev 从指定账户销毁代币（重写以添加事件）
     * @param account 账户地址
     * @param amount 销毁数量
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev 检查每日奖励限制
     * @param amount 要检查的数量
     */
    function _checkDailyRewardLimit(uint256 amount) internal {
        uint256 currentDate = block.timestamp / 1 days;

        // 如果是新的一天，重置每日奖励计数
        if (currentDate > lastRewardDate) {
            lastRewardDate = currentDate;
            dailyRewardsMinted = 0;
        }

        require(dailyRewardsMinted + amount <= dailyRewardLimit, "BubbleToken: exceeds daily reward limit");
        dailyRewardsMinted += amount;
    }

    /**
     * @dev 获取剩余游戏奖励池
     * @return 剩余的游戏奖励代币数量
     */
    function getRemainingGameRewards() external view returns (uint256) {
        return GAME_REWARDS_POOL - gameRewardsMinted;
    }

    /**
     * @dev 获取剩余团队代币
     * @return 剩余的团队代币数量
     */
    function getRemainingTeamTokens() external view returns (uint256) {
        return TEAM_ALLOCATION - teamTokensReleased;
    }

    /**
     * @dev 获取剩余社区代币
     * @return 剩余的社区代币数量
     */
    function getRemainingCommunityTokens() external view returns (uint256) {
        return COMMUNITY_INCENTIVES - communityTokensReleased;
    }

    /**
     * @dev 获取剩余流动性代币
     * @return 剩余的流动性代币数量
     */
    function getRemainingLiquidityTokens() external view returns (uint256) {
        return LIQUIDITY_MINING - liquidityTokensReleased;
    }

    /**
     * @dev 获取今日剩余奖励额度
     * @return 今日剩余可发放的奖励数量
     */
    function getTodayRemainingRewards() external view returns (uint256) {
        uint256 currentDate = block.timestamp / 1 days;

        // 如果是新的一天，返回完整的每日限制
        if (currentDate > lastRewardDate) {
            return dailyRewardLimit;
        }

        return dailyRewardLimit - dailyRewardsMinted;
    }

    /**
     * @dev 获取代币分配统计
     * @return gameRewards 游戏奖励已发放数量
     * @return teamTokens 团队代币已释放数量
     * @return communityTokens 社区代币已释放数量
     * @return liquidityTokens 流动性代币已释放数量
     * @return publicSaleTokens 公开销售代币数量
     */
    function getAllocationStats() external view returns (
        uint256 gameRewards,
        uint256 teamTokens,
        uint256 communityTokens,
        uint256 liquidityTokens,
        uint256 publicSaleTokens
    ) {
        return (
            gameRewardsMinted,
            teamTokensReleased,
            communityTokensReleased,
            liquidityTokensReleased,
            publicSaleTokensReleased
        );
    }

    // ============ 内部角色管理重写 ============

    /**
     * @dev 重写角色授予函数以维护枚举集合
     * @param role 角色标识符
     * @param account 账户地址
     * @return 是否成功授予角色
     */
    function _grantRole(bytes32 role, address account) internal virtual override returns (bool) {
        bool result = super._grantRole(role, account);

        // 如果是游戏奖励角色，添加到枚举集合
        if (role == GAME_REWARD_ROLE && result) {
            _gameRewardRoleMembers.add(account);
        }

        return result;
    }

    /**
     * @dev 重写角色撤销函数以维护枚举集合
     * @param role 角色标识符
     * @param account 账户地址
     * @return 是否成功撤销角色
     */
    function _revokeRole(bytes32 role, address account) internal virtual override returns (bool) {
        bool result = super._revokeRole(role, account);

        // 如果是游戏奖励角色，从枚举集合中移除
        if (role == GAME_REWARD_ROLE && result) {
            _gameRewardRoleMembers.remove(account);
        }

        return result;
    }

    /**
     * @dev 检查是否支持接口
     * @param interfaceId 接口ID
     * @return 是否支持该接口
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
