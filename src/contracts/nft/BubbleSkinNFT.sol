// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


/**
 * @title BubbleSkinNFT
 * @dev Bubble Brawl 泡泡皮肤 NFT 合约（增强版）
 *
 * 功能特性：
 * - 标准 ERC-721 NFT 功能
 * - 管理员权限控制系统
 * - 皮肤模板管理系统
 * - 皮肤属性和稀有度系统
 * - 批量铸造功能
 * - 动态元数据更新
 * - 完整的事件日志记录
 *
 * 权限角色：
 * - ADMIN_ROLE: 超级管理员，可以管理所有功能
 * - SKIN_MANAGER_ROLE: 皮肤管理员，可以创建和管理皮肤模板
 * - MINTER_ROLE: 铸造者，可以铸造皮肤NFT
 */
contract BubbleSkinNFT is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard {

    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SKIN_MANAGER_ROLE = keccak256("SKIN_MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // 稀有度等级枚举
    enum RarityLevel { COMMON, RARE, EPIC, LEGENDARY }

    // 特效类型枚举
    enum EffectType { NONE, GLOW, SPARKLE, RAINBOW, LIGHTNING, BUBBLE, FLAME }

    // 颜色配置结构体
    struct ColorConfig {
        string primaryColor;       // 主色调 (hex格式，如 "#FFB6C1")
        string secondaryColor;     // 辅助色 (hex格式)
        string accentColor;        // 强调色 (hex格式)
        uint8 transparency;        // 透明度 (0-255)
    }

    // 皮肤模板结构体
    struct SkinTemplate {
        uint256 templateId;        // 模板ID
        string name;               // 皮肤名称
        string description;        // 皮肤描述
        RarityLevel rarity;        // 稀有度等级
        EffectType effectType;     // 特效类型
        ColorConfig colorConfig;   // 颜色配置
        string content;            // 皮肤内容（SVG代码或URL地址）
        bool isActive;             // 是否启用
        uint256 maxSupply;         // 最大供应量 (0表示无限制)
        uint256 currentSupply;     // 当前供应量
        uint256 createdAt;         // 创建时间
        address creator;           // 创建者地址
    }

    // 皮肤NFT信息结构体
    struct SkinInfo {
        uint256 templateId;        // 所属模板ID
        uint256 mintedAt;          // 铸造时间
        address originalOwner;     // 原始拥有者
        uint256 serialNumber;      // 序列号（在该模板中的编号）
    }

    // 计数器
    uint256 private _tokenIdCounter;
    uint256 private _templateIdCounter;

    // 存储映射
    mapping(uint256 => SkinTemplate) public skinTemplates;           // 模板ID => 皮肤模板
    mapping(uint256 => SkinInfo) public skinInfos;                   // 代币ID => 皮肤信息
    mapping(address => uint256[]) public userSkins;                  // 用户地址 => 拥有的皮肤代币ID数组
    mapping(RarityLevel => uint256[]) public templatesByRarity;      // 稀有度 => 模板ID数组
    mapping(uint256 => bool) public templateExists;                  // 模板ID => 是否存在

    // 基础URI
    string private _baseTokenURI;

    // 事件定义
    event SkinTemplateCreated(
        uint256 indexed templateId,
        string name,
        RarityLevel rarity,
        uint256 maxSupply,
        address indexed creator
    );

    event SkinTemplateUpdated(
        uint256 indexed templateId,
        string name,
        string description,
        bool isActive
    );

    event SkinTemplateContentUpdated(
        uint256 indexed templateId,
        string content,
        address indexed updater
    );

    event SkinTemplateStatusChanged(
        uint256 indexed templateId,
        bool isActive,
        address indexed updater
    );

    event SkinMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed templateId,
        uint256 serialNumber
    );

    event BatchSkinsMinted(
        address indexed to,
        uint256[] tokenIds,
        uint256[] templateIds,
        uint256 totalCount
    );

    event BaseURIUpdated(string oldBaseURI, string newBaseURI);

    /**
     * @dev 构造函数
     * @param name NFT集合名称
     * @param symbol NFT集合符号
     * @param baseURI 基础URI
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        // 设置管理员角色
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SKIN_MANAGER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // 设置基础URI
        _baseTokenURI = baseURI;

        // 初始化计数器（从1开始）
        _tokenIdCounter = 1;
        _templateIdCounter = 1;
    }

    // ============ 皮肤模板管理功能 ============

    /**
     * @dev 创建新的皮肤模板
     * @param name 皮肤名称
     * @param description 皮肤描述
     * @param rarity 稀有度等级
     * @param effectType 特效类型
     * @param colorConfig 颜色配置
     * @param content 皮肤内容（SVG代码或URL地址）
     * @param maxSupply 最大供应量 (0表示无限制)
     * @return templateId 创建的模板ID
     */
    function createSkinTemplate(
        string memory name,
        string memory description,
        RarityLevel rarity,
        EffectType effectType,
        ColorConfig memory colorConfig,
        string memory content,
        uint256 maxSupply
    ) external onlyRole(SKIN_MANAGER_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "BubbleSkinNFT: name cannot be empty");
        require(bytes(description).length > 0, "BubbleSkinNFT: description cannot be empty");
        require(bytes(content).length > 0, "BubbleSkinNFT: content cannot be empty");
        require(_isValidColorConfig(colorConfig), "BubbleSkinNFT: invalid color config");
        require(_isValidContent(content), "BubbleSkinNFT: invalid content format");

        uint256 templateId = _templateIdCounter;
        _templateIdCounter++;

        // 创建皮肤模板
        skinTemplates[templateId] = SkinTemplate({
            templateId: templateId,
            name: name,
            description: description,
            rarity: rarity,
            effectType: effectType,
            colorConfig: colorConfig,
            content: content,
            isActive: true,
            maxSupply: maxSupply,
            currentSupply: 0,
            createdAt: block.timestamp,
            creator: msg.sender
        });

        // 标记模板存在
        templateExists[templateId] = true;

        // 添加到稀有度分类
        templatesByRarity[rarity].push(templateId);

        emit SkinTemplateCreated(templateId, name, rarity, maxSupply, msg.sender);

        return templateId;
    }

    /**
     * @dev 批量创建皮肤模板
     * @param names 皮肤名称数组
     * @param descriptions 皮肤描述数组
     * @param rarities 稀有度等级数组
     * @param effectTypes 特效类型数组
     * @param colorConfigs 颜色配置数组
     * @param contents 皮肤内容数组（SVG代码或URL地址）
     * @param maxSupplies 最大供应量数组
     * @return templateIds 创建的模板ID数组
     */
    function createSkinTemplatesBatch(
        string[] memory names,
        string[] memory descriptions,
        RarityLevel[] memory rarities,
        EffectType[] memory effectTypes,
        ColorConfig[] memory colorConfigs,
        string[] memory contents,
        uint256[] memory maxSupplies
    ) external onlyRole(SKIN_MANAGER_ROLE) returns (uint256[] memory) {
        require(names.length > 0, "BubbleSkinNFT: empty arrays");
        require(
            names.length == descriptions.length &&
            names.length == rarities.length &&
            names.length == effectTypes.length &&
            names.length == colorConfigs.length &&
            names.length == contents.length &&
            names.length == maxSupplies.length,
            "BubbleSkinNFT: arrays length mismatch"
        );

        uint256[] memory templateIds = new uint256[](names.length);

        for (uint256 i = 0; i < names.length; i++) {
            require(bytes(names[i]).length > 0, "BubbleSkinNFT: name cannot be empty");
            require(bytes(descriptions[i]).length > 0, "BubbleSkinNFT: description cannot be empty");
            require(bytes(contents[i]).length > 0, "BubbleSkinNFT: content cannot be empty");
            require(_isValidColorConfig(colorConfigs[i]), "BubbleSkinNFT: invalid color config");
            require(_isValidContent(contents[i]), "BubbleSkinNFT: invalid content format");

            uint256 templateId = _templateIdCounter;
            _templateIdCounter++;

            // 创建皮肤模板
            skinTemplates[templateId] = SkinTemplate({
                templateId: templateId,
                name: names[i],
                description: descriptions[i],
                rarity: rarities[i],
                effectType: effectTypes[i],
                colorConfig: colorConfigs[i],
                content: contents[i],
                isActive: true,
                maxSupply: maxSupplies[i],
                currentSupply: 0,
                createdAt: block.timestamp,
                creator: msg.sender
            });

            // 标记模板存在
            templateExists[templateId] = true;

            // 添加到稀有度分类
            templatesByRarity[rarities[i]].push(templateId);

            templateIds[i] = templateId;

            emit SkinTemplateCreated(templateId, names[i], rarities[i], maxSupplies[i], msg.sender);
        }

        return templateIds;
    }

    /**
     * @dev 更新皮肤模板信息
     * @param templateId 模板ID
     * @param name 新的皮肤名称
     * @param description 新的皮肤描述
     */
    function updateSkinTemplate(
        uint256 templateId,
        string memory name,
        string memory description
    ) external onlyRole(SKIN_MANAGER_ROLE) {
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");
        require(bytes(name).length > 0, "BubbleSkinNFT: name cannot be empty");
        require(bytes(description).length > 0, "BubbleSkinNFT: description cannot be empty");

        SkinTemplate storage template = skinTemplates[templateId];
        template.name = name;
        template.description = description;

        emit SkinTemplateUpdated(templateId, name, description, template.isActive);
    }

    /**
     * @dev 设置皮肤模板状态（启用/禁用）
     * @param templateId 模板ID
     * @param isActive 是否启用
     */
    function setTemplateActive(uint256 templateId, bool isActive)
        external onlyRole(SKIN_MANAGER_ROLE) {
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");

        skinTemplates[templateId].isActive = isActive;

        emit SkinTemplateStatusChanged(templateId, isActive, msg.sender);
    }

    /**
     * @dev 批量设置皮肤模板状态
     * @param templateIds 模板ID数组
     * @param isActive 是否启用
     */
    function setTemplatesActiveBatch(uint256[] memory templateIds, bool isActive)
        external onlyRole(SKIN_MANAGER_ROLE) {
        require(templateIds.length > 0, "BubbleSkinNFT: empty array");

        for (uint256 i = 0; i < templateIds.length; i++) {
            require(templateExists[templateIds[i]], "BubbleSkinNFT: template does not exist");
            skinTemplates[templateIds[i]].isActive = isActive;
            emit SkinTemplateStatusChanged(templateIds[i], isActive, msg.sender);
        }
    }

    /**
     * @dev 验证颜色配置是否有效
     * @param colorConfig 颜色配置
     * @return 是否有效
     */
    function _isValidColorConfig(ColorConfig memory colorConfig) internal pure returns (bool) {
        // 检查颜色格式是否为有效的hex格式（简单检查）
        bytes memory primaryBytes = bytes(colorConfig.primaryColor);
        bytes memory secondaryBytes = bytes(colorConfig.secondaryColor);
        bytes memory accentBytes = bytes(colorConfig.accentColor);

        // 基本长度检查（#RRGGBB格式应该是7个字符）
        if (primaryBytes.length != 7 || secondaryBytes.length != 7 || accentBytes.length != 7) {
            return false;
        }

        // 检查是否以#开头
        if (primaryBytes[0] != 0x23 || secondaryBytes[0] != 0x23 || accentBytes[0] != 0x23) {
            return false;
        }

        return true;
    }

    /**
     * @dev 验证皮肤内容是否有效
     * @param content 皮肤内容（SVG代码或URL地址）
     * @return 是否有效
     */
    function _isValidContent(string memory content) internal pure returns (bool) {
        bytes memory contentBytes = bytes(content);

        // 内容不能为空
        if (contentBytes.length == 0) {
            return false;
        }

        // 检查是否为SVG格式（以<svg开头）
        if (contentBytes.length >= 4) {
            if (contentBytes[0] == 0x3C && // <
                contentBytes[1] == 0x73 && // s
                contentBytes[2] == 0x76 && // v
                contentBytes[3] == 0x67) { // g
                return true; // 是SVG格式
            }
        }

        // 检查是否为URL格式（以http://、https://或ipfs://开头）
        if (contentBytes.length >= 7) {
            // 检查 http://
            if (contentBytes[0] == 0x68 && // h
                contentBytes[1] == 0x74 && // t
                contentBytes[2] == 0x74 && // t
                contentBytes[3] == 0x70 && // p
                contentBytes[4] == 0x3A && // :
                contentBytes[5] == 0x2F && // /
                contentBytes[6] == 0x2F) { // /
                return true;
            }
        }

        if (contentBytes.length >= 8) {
            // 检查 https://
            if (contentBytes[0] == 0x68 && // h
                contentBytes[1] == 0x74 && // t
                contentBytes[2] == 0x74 && // t
                contentBytes[3] == 0x70 && // p
                contentBytes[4] == 0x73 && // s
                contentBytes[5] == 0x3A && // :
                contentBytes[6] == 0x2F && // /
                contentBytes[7] == 0x2F) { // /
                return true;
            }
        }

        if (contentBytes.length >= 7) {
            // 检查 ipfs://
            if (contentBytes[0] == 0x69 && // i
                contentBytes[1] == 0x70 && // p
                contentBytes[2] == 0x66 && // f
                contentBytes[3] == 0x73 && // s
                contentBytes[4] == 0x3A && // :
                contentBytes[5] == 0x2F && // /
                contentBytes[6] == 0x2F) { // /
                return true;
            }
        }

        // 如果都不匹配，返回false
        return false;
    }

    // ============ 查询功能 ============

    /**
     * @dev 获取皮肤模板信息
     * @param templateId 模板ID
     * @return 皮肤模板信息
     */
    function getSkinTemplate(uint256 templateId)
        external view returns (SkinTemplate memory) {
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");
        return skinTemplates[templateId];
    }

    /**
     * @dev 获取NFT的皮肤信息
     * @param tokenId 代币ID
     * @return template 皮肤模板信息
     * @return skinInfo 皮肤NFT信息
     */
    function getSkinInfo(uint256 tokenId)
        external view returns (SkinTemplate memory template, SkinInfo memory skinInfo) {
        require(_ownerOf(tokenId) != address(0), "BubbleSkinNFT: token does not exist");

        skinInfo = skinInfos[tokenId];
        template = skinTemplates[skinInfo.templateId];

        return (template, skinInfo);
    }

    /**
     * @dev 获取用户拥有的所有皮肤代币ID
     * @param user 用户地址
     * @return 代币ID数组
     */
    function getUserSkins(address user) external view returns (uint256[] memory) {
        return userSkins[user];
    }

    /**
     * @dev 按稀有度获取可用的皮肤模板ID
     * @param rarity 稀有度等级
     * @return 模板ID数组
     */
    function getTemplatesByRarity(RarityLevel rarity)
        external view returns (uint256[] memory) {
        return templatesByRarity[rarity];
    }

    /**
     * @dev 获取活跃的皮肤模板ID（按稀有度）
     * @param rarity 稀有度等级
     * @return 活跃的模板ID数组
     */
    function getActiveTemplatesByRarity(RarityLevel rarity)
        external view returns (uint256[] memory) {
        uint256[] memory allTemplates = templatesByRarity[rarity];
        uint256 activeCount = 0;

        // 计算活跃模板数量
        for (uint256 i = 0; i < allTemplates.length; i++) {
            if (skinTemplates[allTemplates[i]].isActive) {
                activeCount++;
            }
        }

        // 创建活跃模板数组
        uint256[] memory activeTemplates = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allTemplates.length; i++) {
            if (skinTemplates[allTemplates[i]].isActive) {
                activeTemplates[index] = allTemplates[i];
                index++;
            }
        }

        return activeTemplates;
    }

    /**
     * @dev 获取当前模板总数
     * @return 模板总数
     */
    function getTotalTemplates() external view returns (uint256) {
        return _templateIdCounter - 1;
    }

    /**
     * @dev 获取当前NFT总数
     * @return NFT总数
     */
    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    // ============ 皮肤属性系统 ============

    /**
     * @dev 更新皮肤模板的颜色配置
     * @param templateId 模板ID
     * @param colorConfig 新的颜色配置
     */
    function updateTemplateColorConfig(uint256 templateId, ColorConfig memory colorConfig)
        external onlyRole(SKIN_MANAGER_ROLE) {
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");
        require(_isValidColorConfig(colorConfig), "BubbleSkinNFT: invalid color config");

        skinTemplates[templateId].colorConfig = colorConfig;
    }

    /**
     * @dev 更新皮肤模板的特效类型
     * @param templateId 模板ID
     * @param effectType 新的特效类型
     */
    function updateTemplateEffectType(uint256 templateId, EffectType effectType)
        external onlyRole(SKIN_MANAGER_ROLE) {
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");

        skinTemplates[templateId].effectType = effectType;
    }

    /**
     * @dev 更新皮肤模板的内容
     * @param templateId 模板ID
     * @param content 新的皮肤内容（SVG代码或URL地址）
     */
    function updateTemplateContent(uint256 templateId, string memory content)
        external onlyRole(SKIN_MANAGER_ROLE) {
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");
        require(bytes(content).length > 0, "BubbleSkinNFT: content cannot be empty");
        require(_isValidContent(content), "BubbleSkinNFT: invalid content format");

        skinTemplates[templateId].content = content;

        emit SkinTemplateContentUpdated(templateId, content, msg.sender);
    }

    // ============ NFT铸造功能 ============

    /**
     * @dev 铸造单个皮肤NFT
     * @param to 接收者地址
     * @param templateId 皮肤模板ID
     * @return tokenId 铸造的代币ID
     */
    function mintSkin(address to, uint256 templateId)
        external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        require(to != address(0), "BubbleSkinNFT: mint to zero address");
        require(templateExists[templateId], "BubbleSkinNFT: template does not exist");

        SkinTemplate storage template = skinTemplates[templateId];
        require(template.isActive, "BubbleSkinNFT: template is not active");

        // 检查供应量限制
        if (template.maxSupply > 0) {
            require(template.currentSupply < template.maxSupply, "BubbleSkinNFT: max supply reached");
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // 更新模板供应量
        template.currentSupply++;

        // 创建皮肤信息
        skinInfos[tokenId] = SkinInfo({
            templateId: templateId,
            mintedAt: block.timestamp,
            originalOwner: to,
            serialNumber: template.currentSupply
        });

        // 添加到用户皮肤列表
        userSkins[to].push(tokenId);

        // 铸造NFT
        _safeMint(to, tokenId);

        emit SkinMinted(to, tokenId, templateId, template.currentSupply);

        return tokenId;
    }

    /**
     * @dev 批量铸造皮肤NFT
     * @param to 接收者地址
     * @param templateIds 皮肤模板ID数组
     * @return tokenIds 铸造的代币ID数组
     */
    function mintSkinsBatch(address to, uint256[] memory templateIds)
        external onlyRole(MINTER_ROLE) nonReentrant returns (uint256[] memory) {
        require(to != address(0), "BubbleSkinNFT: mint to zero address");
        require(templateIds.length > 0, "BubbleSkinNFT: empty array");

        uint256[] memory tokenIds = new uint256[](templateIds.length);

        for (uint256 i = 0; i < templateIds.length; i++) {
            uint256 templateId = templateIds[i];
            require(templateExists[templateId], "BubbleSkinNFT: template does not exist");

            SkinTemplate storage template = skinTemplates[templateId];
            require(template.isActive, "BubbleSkinNFT: template is not active");

            // 检查供应量限制
            if (template.maxSupply > 0) {
                require(template.currentSupply < template.maxSupply, "BubbleSkinNFT: max supply reached");
            }

            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;

            // 更新模板供应量
            template.currentSupply++;

            // 创建皮肤信息
            skinInfos[tokenId] = SkinInfo({
                templateId: templateId,
                mintedAt: block.timestamp,
                originalOwner: to,
                serialNumber: template.currentSupply
            });

            // 添加到用户皮肤列表
            userSkins[to].push(tokenId);

            // 铸造NFT
            _safeMint(to, tokenId);

            tokenIds[i] = tokenId;

            emit SkinMinted(to, tokenId, templateId, template.currentSupply);
        }

        emit BatchSkinsMinted(to, tokenIds, templateIds, templateIds.length);

        return tokenIds;
    }

    /**
     * @dev 随机铸造指定稀有度的皮肤
     * @param to 接收者地址
     * @param rarity 稀有度等级
     * @return tokenId 铸造的代币ID
     */
    function mintRandomSkin(address to, RarityLevel rarity)
        external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        require(to != address(0), "BubbleSkinNFT: mint to zero address");

        uint256[] memory activeTemplates = this.getActiveTemplatesByRarity(rarity);
        require(activeTemplates.length > 0, "BubbleSkinNFT: no active templates for this rarity");

        // 简单的伪随机选择（生产环境应使用Chainlink VRF）
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            to
        ))) % activeTemplates.length;

        uint256 selectedTemplateId = activeTemplates[randomIndex];

        // 直接铸造，避免递归调用
        SkinTemplate storage template = skinTemplates[selectedTemplateId];
        require(template.isActive, "BubbleSkinNFT: template is not active");

        // 检查供应量限制
        if (template.maxSupply > 0) {
            require(template.currentSupply < template.maxSupply, "BubbleSkinNFT: max supply reached");
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // 更新模板供应量
        template.currentSupply++;

        // 创建皮肤信息
        skinInfos[tokenId] = SkinInfo({
            templateId: selectedTemplateId,
            mintedAt: block.timestamp,
            originalOwner: to,
            serialNumber: template.currentSupply
        });

        // 添加到用户皮肤列表
        userSkins[to].push(tokenId);

        // 铸造NFT
        _safeMint(to, tokenId);

        emit SkinMinted(to, tokenId, selectedTemplateId, template.currentSupply);

        return tokenId;
    }

    // ============ 元数据管理 ============

    /**
     * @dev 设置基础URI
     * @param newBaseURI 新的基础URI
     */
    function setBaseURI(string memory newBaseURI) external onlyRole(ADMIN_ROLE) {
        string memory oldBaseURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(oldBaseURI, newBaseURI);
    }

    /**
     * @dev 设置特定代币的URI
     * @param tokenId 代币ID
     * @param newTokenURI 代币URI
     */
    function setTokenURI(uint256 tokenId, string memory newTokenURI)
        external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "BubbleSkinNFT: token does not exist");
        _setTokenURI(tokenId, newTokenURI);
    }

    /**
     * @dev 获取基础URI
     * @return 基础URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev 重写tokenURI函数以支持动态元数据
     * @param tokenId 代币ID
     * @return 代币URI
     */
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // ============ 转移钩子 ============

    /**
     * @dev 重写转移函数以更新用户皮肤列表
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // 如果不是铸造操作，需要更新用户皮肤列表
        if (from != address(0) && from != to) {
            _removeFromUserSkins(from, tokenId);
        }

        // 如果不是销毁操作且不是铸造操作，需要添加到新用户的皮肤列表
        if (to != address(0) && from != address(0) && from != to) {
            userSkins[to].push(tokenId);
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev 从用户皮肤列表中移除代币
     * @param user 用户地址
     * @param tokenId 代币ID
     */
    function _removeFromUserSkins(address user, uint256 tokenId) internal {
        uint256[] storage skins = userSkins[user];
        for (uint256 i = 0; i < skins.length; i++) {
            if (skins[i] == tokenId) {
                skins[i] = skins[skins.length - 1];
                skins.pop();
                break;
            }
        }
    }

    // ============ 重写必要的函数 ============

    /**
     * @dev 重写supportsInterface函数
     */
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
