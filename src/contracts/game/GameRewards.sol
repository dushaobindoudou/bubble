// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../token/interfaces/IBubbleToken.sol";
import "../nft/interfaces/IBubbleSkinNFT.sol";

/**
 * @title GameRewards
 * @dev 游戏奖励分发合约
 *
 * 功能特性：
 * - 基于游戏表现的奖励计算
 * - 支持代币和NFT奖励
 * - 防作弊机制
 * - 奖励历史记录
 * - 多种奖励类型
 */
contract GameRewards is AccessControl, ReentrancyGuard {
    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_SERVER_ROLE = keccak256("GAME_SERVER_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    // 合约引用
    IBubbleToken public bubbleToken;
    IBubbleSkinNFT public bubbleSkinNFT;

    // 游戏会话结构体
    struct GameSession {
        address player;            // 玩家地址
        uint256 finalRank;         // 最终排名 (1-based)
        uint256 maxMass;           // 最大体积
        uint256 survivalTime;      // 存活时间（秒）
        uint256 killCount;         // 击杀数量
        uint256 sessionEndTime;    // 游戏结束时间
        bytes32 sessionId;         // 会话ID（防重复）
        bool verified;             // 是否已验证
        bool claimed;              // 是否已领取奖励
        uint256 submittedAt;       // 提交时间
    }

    // 奖励配置
    struct RewardConfig {
        uint256 baseReward;        // 基础奖励
        uint256 rankMultiplier;    // 排名倍数 (basis points, 10000 = 1x)
        uint256 killBonus;         // 击杀奖励
        uint256 survivalBonus;     // 存活奖励（每分钟）
        uint256 massBonus;         // 体积奖励（每1000质量）
        uint256 maxReward;         // 最大奖励限制
        bool enabled;              // 是否启用
    }

    // 每日奖励限制
    struct DailyLimit {
        uint256 maxRewardsPerDay;  // 每日最大奖励次数
        uint256 maxTokensPerDay;   // 每日最大代币奖励
        uint256 lastResetDate;     // 上次重置日期
        uint256 todayRewardCount;  // 今日奖励次数
        uint256 todayTokenAmount;  // 今日代币数量
    }

    // 状态变量
    RewardConfig public rewardConfig;
    mapping(address => DailyLimit) public playerDailyLimits;
    mapping(bytes32 => bool) public processedSessions;
    mapping(address => GameSession[]) public playerSessions;

    // 新增：玩家提交的会话管理
    mapping(bytes32 => GameSession) public submittedSessions;  // 会话ID => 会话数据
    mapping(address => bytes32[]) public playerSubmittedSessions; // 玩家 => 提交的会话ID列表
    bytes32[] public pendingVerificationSessions; // 待审核的会话ID列表
    mapping(bytes32 => uint256) public sessionSubmissionTime; // 会话提交时间

    // 配置参数
    uint256 public sessionValidityPeriod = 7 days; // 会话有效期
    uint256 public maxSessionsPerDay = 20; // 每日最大提交会话数

    // 统计数据
    uint256 public totalRewardsDistributed;
    uint256 public totalTokensDistributed;
    uint256 public totalSessionsProcessed;
    uint256 public totalSessionsSubmitted;
    uint256 public totalSessionsVerified;

    // 事件
    event RewardDistributed(
        address indexed player,
        uint256 tokenAmount,
        bytes32 indexed sessionId,
        string rewardType
    );

    event NFTRewardDistributed(
        address indexed player,
        uint256 tokenId,
        bytes32 indexed sessionId
    );

    event RewardConfigUpdated(
        uint256 baseReward,
        uint256 rankMultiplier,
        uint256 killBonus,
        uint256 survivalBonus,
        uint256 massBonus
    );

    event SessionProcessed(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 totalReward
    );

    // 新增事件
    event PlayerSessionSubmitted(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 finalRank,
        uint256 maxMass,
        uint256 survivalTime,
        uint256 killCount
    );

    event SessionVerified(
        bytes32 indexed sessionId,
        address indexed verifier,
        bool approved
    );

    event RewardClaimed(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 tokenAmount,
        uint256 claimedAt
    );

    event SessionExpired(
        bytes32 indexed sessionId,
        address indexed player
    );

    constructor(address _bubbleToken, address _bubbleSkinNFT) {
        require(_bubbleToken != address(0), "GameRewards: invalid token address");
        require(_bubbleSkinNFT != address(0), "GameRewards: invalid NFT address");

        bubbleToken = IBubbleToken(_bubbleToken);
        bubbleSkinNFT = IBubbleSkinNFT(_bubbleSkinNFT);

        // 设置管理员权限
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // 设置默认奖励配置
        rewardConfig = RewardConfig({
            baseReward: 100 * 10**18,      // 100 BUB 基础奖励
            rankMultiplier: 15000,         // 1.5x 排名倍数
            killBonus: 10 * 10**18,        // 10 BUB 每击杀
            survivalBonus: 5 * 10**18,     // 5 BUB 每分钟存活
            massBonus: 1 * 10**18,         // 1 BUB 每1000质量
            maxReward: 1000 * 10**18,      // 1000 BUB 最大奖励
            enabled: true
        });

        // 初始化统计数据
        totalSessionsSubmitted = 0;
        totalSessionsVerified = 0;
    }

    // ============ 玩家自主提交功能 ============

    /**
     * @dev 玩家提交游戏会话数据
     * @param finalRank 最终排名 (1-based)
     * @param maxMass 最大体积
     * @param survivalTime 存活时间（秒）
     * @param killCount 击杀数量
     * @param sessionEndTime 游戏结束时间
     * @param sessionId 会话ID（防重复）
     */
    function submitPlayerSession(
        uint256 finalRank,
        uint256 maxMass,
        uint256 survivalTime,
        uint256 killCount,
        uint256 sessionEndTime,
        bytes32 sessionId
    ) external nonReentrant {
        require(sessionId != bytes32(0), "GameRewards: invalid session ID");
        require(!processedSessions[sessionId], "GameRewards: session already processed");
        require(submittedSessions[sessionId].player == address(0), "GameRewards: session already submitted");
        require(finalRank > 0, "GameRewards: invalid final rank");
        require(sessionEndTime <= block.timestamp, "GameRewards: future session end time");
        require(sessionEndTime > block.timestamp - 1 days, "GameRewards: session too old");

        // 检查每日提交限制
        _checkDailySubmissionLimit(msg.sender);

        // 创建游戏会话
        GameSession memory session = GameSession({
            player: msg.sender,
            finalRank: finalRank,
            maxMass: maxMass,
            survivalTime: survivalTime,
            killCount: killCount,
            sessionEndTime: sessionEndTime,
            sessionId: sessionId,
            verified: false,
            claimed: false,
            submittedAt: block.timestamp
        });

        // 存储会话数据
        submittedSessions[sessionId] = session;
        playerSubmittedSessions[msg.sender].push(sessionId);
        pendingVerificationSessions.push(sessionId);
        sessionSubmissionTime[sessionId] = block.timestamp;

        // 更新统计
        totalSessionsSubmitted++;

        emit PlayerSessionSubmitted(
            sessionId,
            msg.sender,
            finalRank,
            maxMass,
            survivalTime,
            killCount
        );
    }

    /**
     * @dev 检查每日提交限制
     * @param player 玩家地址
     */
    function _checkDailySubmissionLimit(address player) internal view {
        uint256 currentDate = block.timestamp / 1 days;
        uint256 todaySubmissions = 0;

        bytes32[] memory submittedSessionIds = playerSubmittedSessions[player];
        for (uint256 i = 0; i < submittedSessionIds.length; i++) {
            uint256 submissionDate = sessionSubmissionTime[submittedSessionIds[i]] / 1 days;
            if (submissionDate == currentDate) {
                todaySubmissions++;
            }
        }

        require(todaySubmissions < maxSessionsPerDay, "GameRewards: daily submission limit reached");
    }

    // ============ 管理员审核功能 ============

    /**
     * @dev 管理员审核玩家提交的会话
     * @param sessionId 会话ID
     * @param approved 是否批准
     */
    function verifyPlayerSession(bytes32 sessionId, bool approved)
        external onlyRole(ADMIN_ROLE) {
        require(submittedSessions[sessionId].player != address(0), "GameRewards: session not found");
        require(!submittedSessions[sessionId].verified, "GameRewards: session already verified");
        require(!_isSessionExpired(sessionId), "GameRewards: session expired");

        // 更新验证状态
        submittedSessions[sessionId].verified = approved;

        if (approved) {
            totalSessionsVerified++;
        } else {
            // 如果拒绝，从待审核列表中移除
            _removeFromPendingList(sessionId);
        }

        emit SessionVerified(sessionId, msg.sender, approved);
    }

    /**
     * @dev 批量审核会话
     * @param sessionIds 会话ID数组
     * @param approvals 批准状态数组
     */
    function verifyPlayerSessionsBatch(bytes32[] memory sessionIds, bool[] memory approvals)
        external onlyRole(ADMIN_ROLE) {
        require(sessionIds.length == approvals.length, "GameRewards: arrays length mismatch");
        require(sessionIds.length <= 50, "GameRewards: too many sessions");

        for (uint256 i = 0; i < sessionIds.length; i++) {
            bytes32 sessionId = sessionIds[i];
            bool approved = approvals[i];

            if (submittedSessions[sessionId].player != address(0) &&
                !submittedSessions[sessionId].verified &&
                !_isSessionExpired(sessionId)) {

                submittedSessions[sessionId].verified = approved;

                if (approved) {
                    totalSessionsVerified++;
                } else {
                    _removeFromPendingList(sessionId);
                }

                emit SessionVerified(sessionId, msg.sender, approved);
            }
        }
    }

    /**
     * @dev 检查会话是否过期
     * @param sessionId 会话ID
     * @return 是否过期
     */
    function _isSessionExpired(bytes32 sessionId) internal view returns (bool) {
        uint256 submissionTime = sessionSubmissionTime[sessionId];
        return block.timestamp > submissionTime + sessionValidityPeriod;
    }

    /**
     * @dev 从待审核列表中移除会话
     * @param sessionId 会话ID
     */
    function _removeFromPendingList(bytes32 sessionId) internal {
        for (uint256 i = 0; i < pendingVerificationSessions.length; i++) {
            if (pendingVerificationSessions[i] == sessionId) {
                pendingVerificationSessions[i] = pendingVerificationSessions[pendingVerificationSessions.length - 1];
                pendingVerificationSessions.pop();
                break;
            }
        }
    }

    // ============ 玩家自主领取奖励功能 ============

    /**
     * @dev 玩家领取已审核通过的会话奖励
     * @param sessionId 会话ID
     */
    function claimReward(bytes32 sessionId) external nonReentrant {
        GameSession storage session = submittedSessions[sessionId];

        require(session.player != address(0), "GameRewards: session not found");
        require(session.player == msg.sender, "GameRewards: not session owner");
        require(session.verified, "GameRewards: session not verified");
        require(!session.claimed, "GameRewards: reward already claimed");
        require(!_isSessionExpired(sessionId), "GameRewards: session expired");
        require(rewardConfig.enabled, "GameRewards: rewards disabled");

        // 检查每日限制
        _checkDailyLimit(msg.sender);

        // 计算奖励
        uint256 tokenReward = calculateReward(session);

        if (tokenReward > 0) {
            // 标记为已领取
            session.claimed = true;

            // 更新每日限制
            _updateDailyLimit(msg.sender, tokenReward);

            // 分发代币奖励
            bubbleToken.mintGameReward(
                msg.sender,
                tokenReward,
                "Player Claimed Reward"
            );

            // 更新统计
            totalRewardsDistributed++;
            totalTokensDistributed += tokenReward;

            // 检查是否有NFT奖励
            _checkNFTReward(session);

            // 保存到玩家会话历史
            playerSessions[msg.sender].push(session);
            totalSessionsProcessed++;

            // 从待审核列表中移除
            _removeFromPendingList(sessionId);

            emit RewardClaimed(sessionId, msg.sender, tokenReward, block.timestamp);
            emit RewardDistributed(msg.sender, tokenReward, sessionId, "player_claimed");
        }
    }

    /**
     * @dev 批量领取多个会话的奖励
     * @param sessionIds 会话ID数组
     */
    function claimRewardsBatch(bytes32[] memory sessionIds) external nonReentrant {
        require(sessionIds.length > 0, "GameRewards: empty sessions array");
        require(sessionIds.length <= 10, "GameRewards: too many sessions");

        for (uint256 i = 0; i < sessionIds.length; i++) {
            bytes32 sessionId = sessionIds[i];
            GameSession storage session = submittedSessions[sessionId];

            // 检查基本条件
            if (session.player == msg.sender &&
                session.verified &&
                !session.claimed &&
                !_isSessionExpired(sessionId) &&
                rewardConfig.enabled) {

                // 检查每日限制（内部版本，不抛出异常）
                if (_checkDailyLimitInternal(msg.sender)) {
                    uint256 tokenReward = calculateReward(session);

                    if (tokenReward > 0) {
                        // 标记为已领取
                        session.claimed = true;

                        // 更新每日限制
                        _updateDailyLimit(msg.sender, tokenReward);

                        // 分发代币奖励
                        bubbleToken.mintGameReward(
                            msg.sender,
                            tokenReward,
                            "Batch Claimed Reward"
                        );

                        // 更新统计
                        totalRewardsDistributed++;
                        totalTokensDistributed += tokenReward;

                        // 检查NFT奖励
                        _checkNFTReward(session);

                        // 保存到玩家会话历史
                        playerSessions[msg.sender].push(session);
                        totalSessionsProcessed++;

                        // 从待审核列表中移除
                        _removeFromPendingList(sessionId);

                        emit RewardClaimed(sessionId, msg.sender, tokenReward, block.timestamp);
                        emit RewardDistributed(msg.sender, tokenReward, sessionId, "batch_claimed");
                    }
                }
            }
        }
    }

    // ============ 奖励分发功能 ============

    /**
     * @dev 处理游戏会话并分发奖励
     * @param session 游戏会话数据
     */
    function distributeReward(GameSession memory session)
        external onlyRole(GAME_SERVER_ROLE) nonReentrant {
        require(session.player != address(0), "GameRewards: invalid player address");
        require(!processedSessions[session.sessionId], "GameRewards: session already processed");
        require(rewardConfig.enabled, "GameRewards: rewards disabled");

        // 标记会话已处理
        processedSessions[session.sessionId] = true;

        // 检查每日限制
        _checkDailyLimit(session.player);

        // 计算奖励
        uint256 tokenReward = calculateReward(session);

        if (tokenReward > 0) {
            // 更新每日限制
            _updateDailyLimit(session.player, tokenReward);

            // 分发代币奖励
            bubbleToken.mintGameReward(
                session.player,
                tokenReward,
                "Game Performance Reward"
            );

            // 更新统计
            totalRewardsDistributed++;
            totalTokensDistributed += tokenReward;

            emit RewardDistributed(
                session.player,
                tokenReward,
                session.sessionId,
                "performance"
            );
        }

        // 检查是否有NFT奖励
        _checkNFTReward(session);

        // 保存会话记录
        playerSessions[session.player].push(session);
        totalSessionsProcessed++;

        emit SessionProcessed(session.sessionId, session.player, tokenReward);
    }

    /**
     * @dev 计算游戏奖励
     * @param session 游戏会话
     * @return 奖励代币数量
     */
    function calculateReward(GameSession memory session) public view returns (uint256) {
        if (!rewardConfig.enabled) {
            return 0;
        }

        uint256 reward = rewardConfig.baseReward;

        // 排名奖励（排名越高奖励越多）
        if (session.finalRank > 0) {
            // 排名1-3有额外奖励
            if (session.finalRank <= 3) {
                uint256 rankBonus = rewardConfig.baseReward * (4 - session.finalRank) / 2;
                reward += rankBonus;
            }
        }

        // 击杀奖励
        reward += session.killCount * rewardConfig.killBonus;

        // 存活时间奖励（每分钟）
        uint256 survivalMinutes = session.survivalTime / 60;
        reward += survivalMinutes * rewardConfig.survivalBonus;

        // 体积奖励（每1000质量）
        uint256 massThousands = session.maxMass / 1000;
        reward += massThousands * rewardConfig.massBonus;

        // 应用最大奖励限制
        if (reward > rewardConfig.maxReward) {
            reward = rewardConfig.maxReward;
        }

        return reward;
    }

    /**
     * @dev 批量分发奖励
     * @param sessions 游戏会话数组
     */
    function distributeRewardsBatch(GameSession[] memory sessions)
        external onlyRole(GAME_SERVER_ROLE) nonReentrant {
        require(sessions.length > 0, "GameRewards: empty sessions array");
        require(sessions.length <= 50, "GameRewards: too many sessions");

        for (uint256 i = 0; i < sessions.length; i++) {
            if (!processedSessions[sessions[i].sessionId]) {
                // 内部调用，避免重复检查
                _distributeRewardInternal(sessions[i]);
            }
        }
    }

    /**
     * @dev 内部奖励分发函数
     */
    function _distributeRewardInternal(GameSession memory session) internal {
        require(session.player != address(0), "GameRewards: invalid player address");
        require(rewardConfig.enabled, "GameRewards: rewards disabled");

        // 标记会话已处理
        processedSessions[session.sessionId] = true;

        // 检查每日限制
        if (!_checkDailyLimitInternal(session.player)) {
            return; // 超出每日限制，跳过
        }

        // 计算奖励
        uint256 tokenReward = calculateReward(session);

        if (tokenReward > 0) {
            // 更新每日限制
            _updateDailyLimit(session.player, tokenReward);

            // 分发代币奖励
            bubbleToken.mintGameReward(
                session.player,
                tokenReward,
                "Batch Game Reward"
            );

            // 更新统计
            totalRewardsDistributed++;
            totalTokensDistributed += tokenReward;

            emit RewardDistributed(
                session.player,
                tokenReward,
                session.sessionId,
                "batch_performance"
            );
        }

        // 保存会话记录
        playerSessions[session.player].push(session);
        totalSessionsProcessed++;

        emit SessionProcessed(session.sessionId, session.player, tokenReward);
    }

    // ============ 辅助函数 ============

    /**
     * @dev 检查每日限制
     */
    function _checkDailyLimit(address player) internal view {
        DailyLimit storage limit = playerDailyLimits[player];
        uint256 currentDate = block.timestamp / 1 days;

        // 如果是新的一天，限制会被重置
        if (currentDate > limit.lastResetDate) {
            return; // 新的一天，可以获得奖励
        }

        require(
            limit.todayRewardCount < limit.maxRewardsPerDay || limit.maxRewardsPerDay == 0,
            "GameRewards: daily reward limit reached"
        );
    }

    /**
     * @dev 内部检查每日限制（不抛出异常）
     */
    function _checkDailyLimitInternal(address player) internal view returns (bool) {
        DailyLimit storage limit = playerDailyLimits[player];
        uint256 currentDate = block.timestamp / 1 days;

        // 如果是新的一天，限制会被重置
        if (currentDate > limit.lastResetDate) {
            return true;
        }

        return limit.todayRewardCount < limit.maxRewardsPerDay || limit.maxRewardsPerDay == 0;
    }

    /**
     * @dev 更新每日限制
     */
    function _updateDailyLimit(address player, uint256 tokenAmount) internal {
        DailyLimit storage limit = playerDailyLimits[player];
        uint256 currentDate = block.timestamp / 1 days;

        // 如果是新的一天，重置计数
        if (currentDate > limit.lastResetDate) {
            limit.lastResetDate = currentDate;
            limit.todayRewardCount = 0;
            limit.todayTokenAmount = 0;

            // 设置默认每日限制
            if (limit.maxRewardsPerDay == 0) {
                limit.maxRewardsPerDay = 10; // 默认每日10次
                limit.maxTokensPerDay = 5000 * 10**18; // 默认每日5000 BUB
            }
        }

        limit.todayRewardCount++;
        limit.todayTokenAmount += tokenAmount;
    }

    /**
     * @dev 检查NFT奖励
     */
    function _checkNFTReward(GameSession memory session) internal {
        // 特殊成就NFT奖励逻辑
        bool shouldGetNFT = false;

        // 第一名且击杀数>=5
        if (session.finalRank == 1 && session.killCount >= 5) {
            shouldGetNFT = true;
        }

        // 存活时间超过10分钟且体积超过5000
        if (session.survivalTime >= 600 && session.maxMass >= 5000) {
            shouldGetNFT = true;
        }

        if (shouldGetNFT) {
            // 随机选择一个稀有皮肤
            try bubbleSkinNFT.mintRandomSkin(session.player, IBubbleSkinNFT.RarityLevel.RARE)
                returns (uint256 tokenId) {
                emit NFTRewardDistributed(session.player, tokenId, session.sessionId);
            } catch {
                // NFT铸造失败，忽略错误
            }
        }
    }

    // ============ 管理功能 ============

    /**
     * @dev 更新奖励配置
     */
    function updateRewardConfig(
        uint256 _baseReward,
        uint256 _rankMultiplier,
        uint256 _killBonus,
        uint256 _survivalBonus,
        uint256 _massBonus,
        uint256 _maxReward
    ) external onlyRole(ADMIN_ROLE) {
        rewardConfig.baseReward = _baseReward;
        rewardConfig.rankMultiplier = _rankMultiplier;
        rewardConfig.killBonus = _killBonus;
        rewardConfig.survivalBonus = _survivalBonus;
        rewardConfig.massBonus = _massBonus;
        rewardConfig.maxReward = _maxReward;

        emit RewardConfigUpdated(
            _baseReward,
            _rankMultiplier,
            _killBonus,
            _survivalBonus,
            _massBonus
        );
    }

    /**
     * @dev 启用/禁用奖励系统
     */
    function setRewardEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        rewardConfig.enabled = enabled;
    }

    /**
     * @dev 设置玩家每日限制
     */
    function setPlayerDailyLimit(
        address player,
        uint256 maxRewardsPerDay,
        uint256 maxTokensPerDay
    ) external onlyRole(REWARD_MANAGER_ROLE) {
        DailyLimit storage limit = playerDailyLimits[player];
        limit.maxRewardsPerDay = maxRewardsPerDay;
        limit.maxTokensPerDay = maxTokensPerDay;
    }

    // ============ 查询功能 ============

    /**
     * @dev 获取玩家游戏会话历史
     */
    function getPlayerSessions(address player)
        external view returns (GameSession[] memory) {
        return playerSessions[player];
    }

    /**
     * @dev 获取玩家今日奖励状态
     */
    function getPlayerDailyStatus(address player)
        external view returns (uint256 rewardCount, uint256 tokenAmount, uint256 remaining) {
        DailyLimit storage limit = playerDailyLimits[player];
        uint256 currentDate = block.timestamp / 1 days;

        if (currentDate > limit.lastResetDate) {
            return (0, 0, limit.maxRewardsPerDay);
        }

        remaining = limit.maxRewardsPerDay > limit.todayRewardCount ?
                   limit.maxRewardsPerDay - limit.todayRewardCount : 0;

        return (limit.todayRewardCount, limit.todayTokenAmount, remaining);
    }

    /**
     * @dev 获取系统统计信息
     */
    function getSystemStats() external view returns (
        uint256 totalRewards,
        uint256 totalTokens,
        uint256 totalSessions,
        bool enabled
    ) {
        return (
            totalRewardsDistributed,
            totalTokensDistributed,
            totalSessionsProcessed,
            rewardConfig.enabled
        );
    }

    // ============ 新增查询功能 ============

    /**
     * @dev 获取玩家提交的会话列表
     * @param player 玩家地址
     * @return 会话ID数组
     */
    function getPlayerSubmittedSessions(address player)
        external view returns (bytes32[] memory) {
        return playerSubmittedSessions[player];
    }

    /**
     * @dev 获取玩家可领取的奖励会话
     * @param player 玩家地址
     * @return 可领取的会话ID数组
     */
    function getPlayerClaimableSessions(address player)
        external view returns (bytes32[] memory) {
        bytes32[] memory submittedSessionIds = playerSubmittedSessions[player];
        uint256 claimableCount = 0;

        // 计算可领取的会话数量
        for (uint256 i = 0; i < submittedSessionIds.length; i++) {
            GameSession memory session = submittedSessions[submittedSessionIds[i]];
            if (session.verified && !session.claimed && !_isSessionExpired(submittedSessionIds[i])) {
                claimableCount++;
            }
        }

        // 创建可领取会话数组
        bytes32[] memory claimableSessions = new bytes32[](claimableCount);
        uint256 index = 0;

        for (uint256 i = 0; i < submittedSessionIds.length; i++) {
            GameSession memory session = submittedSessions[submittedSessionIds[i]];
            if (session.verified && !session.claimed && !_isSessionExpired(submittedSessionIds[i])) {
                claimableSessions[index] = submittedSessionIds[i];
                index++;
            }
        }

        return claimableSessions;
    }

    /**
     * @dev 获取待审核的会话列表（管理员用）
     * @param offset 偏移量
     * @param limit 限制数量
     * @return 待审核的会话ID数组
     */
    function getPendingVerificationSessions(uint256 offset, uint256 limit)
        external view onlyRole(ADMIN_ROLE) returns (bytes32[] memory) {
        require(limit > 0 && limit <= 100, "GameRewards: invalid limit");

        if (offset >= pendingVerificationSessions.length) {
            return new bytes32[](0);
        }

        uint256 resultLength = pendingVerificationSessions.length - offset;
        if (resultLength > limit) {
            resultLength = limit;
        }

        bytes32[] memory result = new bytes32[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = pendingVerificationSessions[offset + i];
        }

        return result;
    }

    /**
     * @dev 获取会话详细信息
     * @param sessionId 会话ID
     * @return 会话详细信息
     */
    function getSessionDetails(bytes32 sessionId)
        external view returns (GameSession memory) {
        require(submittedSessions[sessionId].player != address(0), "GameRewards: session not found");
        return submittedSessions[sessionId];
    }

    /**
     * @dev 获取玩家会话统计信息
     * @param player 玩家地址
     * @return submitted 提交的会话数
     * @return verified 已审核的会话数
     * @return claimed 已领取的会话数
     * @return claimable 可领取的会话数
     */
    function getPlayerSessionStats(address player)
        external view returns (uint256 submitted, uint256 verified, uint256 claimed, uint256 claimable) {
        bytes32[] memory submittedSessionIds = playerSubmittedSessions[player];
        submitted = submittedSessionIds.length;

        for (uint256 i = 0; i < submittedSessionIds.length; i++) {
            GameSession memory session = submittedSessions[submittedSessionIds[i]];
            if (session.verified) {
                verified++;
                if (session.claimed) {
                    claimed++;
                } else if (!_isSessionExpired(submittedSessionIds[i])) {
                    claimable++;
                }
            }
        }

        return (submitted, verified, claimed, claimable);
    }

    /**
     * @dev 获取系统扩展统计信息
     * @return totalSubmitted 总提交会话数
     * @return totalVerified 总审核通过会话数
     * @return pendingCount 待审核会话数
     * @return expiredCount 过期会话数
     */
    function getExtendedSystemStats() external view returns (
        uint256 totalSubmitted,
        uint256 totalVerified,
        uint256 pendingCount,
        uint256 expiredCount
    ) {
        totalSubmitted = totalSessionsSubmitted;
        totalVerified = totalSessionsVerified;
        pendingCount = 0;
        expiredCount = 0;

        // 计算待审核和过期会话数
        for (uint256 i = 0; i < pendingVerificationSessions.length; i++) {
            bytes32 sessionId = pendingVerificationSessions[i];
            if (_isSessionExpired(sessionId)) {
                expiredCount++;
            } else {
                pendingCount++;
            }
        }

        return (totalSubmitted, totalVerified, pendingCount, expiredCount);
    }

    // ============ 管理员配置功能 ============

    /**
     * @dev 设置会话有效期
     * @param newPeriod 新的有效期（秒）
     */
    function setSessionValidityPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "GameRewards: invalid validity period");
        sessionValidityPeriod = newPeriod;
    }

    /**
     * @dev 设置每日最大提交会话数
     * @param newLimit 新的限制数量
     */
    function setMaxSessionsPerDay(uint256 newLimit) external onlyRole(ADMIN_ROLE) {
        require(newLimit > 0 && newLimit <= 100, "GameRewards: invalid session limit");
        maxSessionsPerDay = newLimit;
    }

    /**
     * @dev 清理过期的会话（管理员维护功能）
     * @param maxCleanup 最大清理数量
     */
    function cleanupExpiredSessions(uint256 maxCleanup) external onlyRole(ADMIN_ROLE) {
        require(maxCleanup > 0 && maxCleanup <= 100, "GameRewards: invalid cleanup limit");

        uint256 cleaned = 0;
        uint256 i = 0;

        while (i < pendingVerificationSessions.length && cleaned < maxCleanup) {
            bytes32 sessionId = pendingVerificationSessions[i];

            if (_isSessionExpired(sessionId)) {
                // 触发过期事件
                emit SessionExpired(sessionId, submittedSessions[sessionId].player);

                // 从待审核列表中移除
                pendingVerificationSessions[i] = pendingVerificationSessions[pendingVerificationSessions.length - 1];
                pendingVerificationSessions.pop();

                cleaned++;
            } else {
                i++;
            }
        }
    }
}
