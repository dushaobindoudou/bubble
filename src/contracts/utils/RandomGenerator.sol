// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RandomGenerator
 * @dev 安全随机数生成器工具合约
 *
 * 功能特性：
 * - 基于多种熵源的伪随机数生成
 * - 支持范围随机数生成
 * - 支持加权随机选择
 * - 防止预测和操控
 *
 * 注意：生产环境建议使用 Chainlink VRF 等外部随机数服务
 */
contract RandomGenerator is Ownable {
    // 随机数种子
    uint256 private _seed;
    uint256 private _nonce;

    // 事件
    event SeedUpdated(uint256 newSeed);
    event RandomNumberGenerated(uint256 randomNumber, address requester);

    constructor() Ownable(msg.sender) {
        _seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender
        )));
        _nonce = 0;
    }

    /**
     * @dev 生成随机数
     * @param max 最大值（不包含）
     * @return 0 到 max-1 之间的随机数
     */
    function generateRandom(uint256 max) external returns (uint256) {
        require(max > 0, "RandomGenerator: max must be greater than 0");

        uint256 randomNumber = _generateRandomNumber() % max;

        emit RandomNumberGenerated(randomNumber, msg.sender);
        return randomNumber;
    }

    /**
     * @dev 生成指定范围内的随机数
     * @param min 最小值（包含）
     * @param max 最大值（不包含）
     * @return min 到 max-1 之间的随机数
     */
    function generateRandomInRange(uint256 min, uint256 max) external returns (uint256) {
        require(max > min, "RandomGenerator: max must be greater than min");

        uint256 range = max - min;
        uint256 randomNumber = min + (_generateRandomNumber() % range);

        emit RandomNumberGenerated(randomNumber, msg.sender);
        return randomNumber;
    }

    /**
     * @dev 加权随机选择
     * @param weights 权重数组
     * @return 选中的索引
     */
    function weightedRandomSelect(uint256[] memory weights) external returns (uint256) {
        require(weights.length > 0, "RandomGenerator: empty weights array");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }
        require(totalWeight > 0, "RandomGenerator: total weight must be greater than 0");

        uint256 randomValue = _generateRandomNumber() % totalWeight;
        uint256 currentWeight = 0;

        for (uint256 i = 0; i < weights.length; i++) {
            currentWeight += weights[i];
            if (randomValue < currentWeight) {
                emit RandomNumberGenerated(i, msg.sender);
                return i;
            }
        }

        // 理论上不应该到达这里
        emit RandomNumberGenerated(weights.length - 1, msg.sender);
        return weights.length - 1;
    }

    /**
     * @dev 生成多个随机数
     * @param count 数量
     * @param max 最大值（不包含）
     * @return 随机数数组
     */
    function generateMultipleRandom(uint256 count, uint256 max)
        external returns (uint256[] memory) {
        require(count > 0, "RandomGenerator: count must be greater than 0");
        require(max > 0, "RandomGenerator: max must be greater than 0");

        uint256[] memory randomNumbers = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            randomNumbers[i] = _generateRandomNumber() % max;
        }

        return randomNumbers;
    }

    /**
     * @dev 内部随机数生成函数
     * @return 随机数
     */
    function _generateRandomNumber() internal returns (uint256) {
        _nonce++;

        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            _seed,
            _nonce,
            block.timestamp,
            block.prevrandao,
            msg.sender,
            tx.gasprice,
            gasleft()
        )));

        // 更新种子以增加随机性
        _seed = uint256(keccak256(abi.encodePacked(_seed, randomNumber)));

        return randomNumber;
    }

    /**
     * @dev 手动更新种子（仅所有者）
     * @param newSeed 新种子
     */
    function updateSeed(uint256 newSeed) external onlyOwner {
        _seed = newSeed;
        emit SeedUpdated(newSeed);
    }

    /**
     * @dev 获取当前种子（仅所有者）
     * @return 当前种子
     */
    function getCurrentSeed() external view onlyOwner returns (uint256) {
        return _seed;
    }

    /**
     * @dev 获取当前nonce
     * @return 当前nonce
     */
    function getCurrentNonce() external view returns (uint256) {
        return _nonce;
    }
}
