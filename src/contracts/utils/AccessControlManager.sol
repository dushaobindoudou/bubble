// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AccessControlManager
 * @dev 统一的权限管理器合约
 *
 * 功能特性：
 * - 集中管理所有合约的权限
 * - 支持角色继承和权限委托
 * - 提供权限查询和管理接口
 * - 支持批量权限操作
 * - 权限变更日志记录
 */
contract AccessControlManager is AccessControl, ReentrancyGuard {
    // 预定义角色
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant CONTRACT_ADMIN_ROLE = keccak256("CONTRACT_ADMIN_ROLE");
    bytes32 public constant GAME_ADMIN_ROLE = keccak256("GAME_ADMIN_ROLE");
    bytes32 public constant SKIN_MANAGER_ROLE = keccak256("SKIN_MANAGER_ROLE");
    bytes32 public constant MAP_MANAGER_ROLE = keccak256("MAP_MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GAME_SERVER_ROLE = keccak256("GAME_SERVER_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    // 合约地址映射
    mapping(string => address) public contractAddresses;
    mapping(address => string) public contractNames;

    // 角色描述
    mapping(bytes32 => string) public roleDescriptions;

    // 权限变更历史
    struct PermissionChange {
        bytes32 role;
        address account;
        bool granted;
        uint256 timestamp;
        address operator;
    }

    PermissionChange[] public permissionHistory;
    mapping(address => uint256[]) public userPermissionHistory;

    // 事件
    event ContractRegistered(string name, address contractAddress);
    event ContractUnregistered(string name, address contractAddress);
    event RoleDescriptionUpdated(bytes32 indexed role, string description);
    event BatchRoleGranted(bytes32 indexed role, address[] accounts, address indexed operator);
    event BatchRoleRevoked(bytes32 indexed role, address[] accounts, address indexed operator);

    constructor() {
        // 设置角色层次结构
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);

        // 设置角色管理权限
        _setRoleAdmin(SUPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(CONTRACT_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(GAME_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(SKIN_MANAGER_ROLE, GAME_ADMIN_ROLE);
        _setRoleAdmin(MAP_MANAGER_ROLE, GAME_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, GAME_ADMIN_ROLE);
        _setRoleAdmin(GAME_SERVER_ROLE, CONTRACT_ADMIN_ROLE);
        _setRoleAdmin(REWARD_MANAGER_ROLE, GAME_ADMIN_ROLE);

        // 设置角色描述
        _setRoleDescription(SUPER_ADMIN_ROLE, "Super Administrator - Full system access");
        _setRoleDescription(CONTRACT_ADMIN_ROLE, "Contract Administrator - Manage contract settings");
        _setRoleDescription(GAME_ADMIN_ROLE, "Game Administrator - Manage game features");
        _setRoleDescription(SKIN_MANAGER_ROLE, "Skin Manager - Manage skin templates and NFTs");
        _setRoleDescription(MAP_MANAGER_ROLE, "Map Manager - Manage map templates and NFTs");
        _setRoleDescription(MINTER_ROLE, "Minter - Mint NFTs and tokens");
        _setRoleDescription(GAME_SERVER_ROLE, "Game Server - Server-side game operations");
        _setRoleDescription(REWARD_MANAGER_ROLE, "Reward Manager - Manage game rewards");
    }

    // ============ 合约管理 ============

    /**
     * @dev 注册合约地址
     * @param name 合约名称
     * @param contractAddress 合约地址
     */
    function registerContract(string memory name, address contractAddress)
        external onlyRole(CONTRACT_ADMIN_ROLE) {
        require(contractAddress != address(0), "AccessControlManager: invalid contract address");
        require(bytes(name).length > 0, "AccessControlManager: invalid contract name");

        contractAddresses[name] = contractAddress;
        contractNames[contractAddress] = name;

        emit ContractRegistered(name, contractAddress);
    }

    /**
     * @dev 注销合约地址
     * @param name 合约名称
     */
    function unregisterContract(string memory name)
        external onlyRole(CONTRACT_ADMIN_ROLE) {
        address contractAddress = contractAddresses[name];
        require(contractAddress != address(0), "AccessControlManager: contract not found");

        delete contractAddresses[name];
        delete contractNames[contractAddress];

        emit ContractUnregistered(name, contractAddress);
    }

    // ============ 角色管理 ============

    /**
     * @dev 批量授予角色
     * @param role 角色
     * @param accounts 账户地址数组
     */
    function grantRoleBatch(bytes32 role, address[] memory accounts)
        external onlyRole(getRoleAdmin(role)) nonReentrant {
        require(accounts.length > 0, "AccessControlManager: empty accounts array");

        for (uint256 i = 0; i < accounts.length; i++) {
            if (!hasRole(role, accounts[i])) {
                _grantRole(role, accounts[i]);
                _recordPermissionChange(role, accounts[i], true);
            }
        }

        emit BatchRoleGranted(role, accounts, msg.sender);
    }

    /**
     * @dev 批量撤销角色
     * @param role 角色
     * @param accounts 账户地址数组
     */
    function revokeRoleBatch(bytes32 role, address[] memory accounts)
        external onlyRole(getRoleAdmin(role)) nonReentrant {
        require(accounts.length > 0, "AccessControlManager: empty accounts array");

        for (uint256 i = 0; i < accounts.length; i++) {
            if (hasRole(role, accounts[i])) {
                _revokeRole(role, accounts[i]);
                _recordPermissionChange(role, accounts[i], false);
            }
        }

        emit BatchRoleRevoked(role, accounts, msg.sender);
    }

    /**
     * @dev 设置角色描述
     * @param role 角色
     * @param description 描述
     */
    function setRoleDescription(bytes32 role, string memory description)
        external onlyRole(SUPER_ADMIN_ROLE) {
        _setRoleDescription(role, description);
    }

    /**
     * @dev 内部设置角色描述
     */
    function _setRoleDescription(bytes32 role, string memory description) internal {
        roleDescriptions[role] = description;
        emit RoleDescriptionUpdated(role, description);
    }

    // ============ 查询功能 ============

    /**
     * @dev 获取用户的所有角色
     * @param account 用户地址
     * @return 角色数组
     */
    function getUserRoles(address account) external view returns (bytes32[] memory) {
        bytes32[] memory allRoles = new bytes32[](8);
        allRoles[0] = SUPER_ADMIN_ROLE;
        allRoles[1] = CONTRACT_ADMIN_ROLE;
        allRoles[2] = GAME_ADMIN_ROLE;
        allRoles[3] = SKIN_MANAGER_ROLE;
        allRoles[4] = MAP_MANAGER_ROLE;
        allRoles[5] = MINTER_ROLE;
        allRoles[6] = GAME_SERVER_ROLE;
        allRoles[7] = REWARD_MANAGER_ROLE;

        uint256 roleCount = 0;
        for (uint256 i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], account)) {
                roleCount++;
            }
        }

        bytes32[] memory userRoles = new bytes32[](roleCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], account)) {
                userRoles[index] = allRoles[i];
                index++;
            }
        }

        return userRoles;
    }



    /**
     * @dev 获取用户权限变更历史
     * @param account 用户地址
     * @return 权限变更索引数组
     */
    function getUserPermissionHistory(address account)
        external view returns (uint256[] memory) {
        return userPermissionHistory[account];
    }

    /**
     * @dev 获取权限变更详情
     * @param index 历史记录索引
     * @return 权限变更详情
     */
    function getPermissionChange(uint256 index)
        external view returns (PermissionChange memory) {
        require(index < permissionHistory.length, "AccessControlManager: invalid index");
        return permissionHistory[index];
    }

    /**
     * @dev 获取权限变更历史总数
     * @return 历史记录总数
     */
    function getPermissionHistoryCount() external view returns (uint256) {
        return permissionHistory.length;
    }

    // ============ 内部函数 ============

    /**
     * @dev 记录权限变更
     */
    function _recordPermissionChange(bytes32 role, address account, bool granted) internal {
        PermissionChange memory change = PermissionChange({
            role: role,
            account: account,
            granted: granted,
            timestamp: block.timestamp,
            operator: msg.sender
        });

        permissionHistory.push(change);
        userPermissionHistory[account].push(permissionHistory.length - 1);
    }

    /**
     * @dev 重写 grantRole 以记录历史
     */
    function grantRole(bytes32 role, address account)
        public override onlyRole(getRoleAdmin(role)) {
        if (!hasRole(role, account)) {
            super.grantRole(role, account);
            _recordPermissionChange(role, account, true);
        }
    }

    /**
     * @dev 重写 revokeRole 以记录历史
     */
    function revokeRole(bytes32 role, address account)
        public override onlyRole(getRoleAdmin(role)) {
        if (hasRole(role, account)) {
            super.revokeRole(role, account);
            _recordPermissionChange(role, account, false);
        }
    }
}
