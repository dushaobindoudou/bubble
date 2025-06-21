// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title IBubbleSkinNFT
 * @dev Bubble Skin NFT 合约接口
 */
interface IBubbleSkinNFT is IERC721 {
    // 枚举定义
    enum RarityLevel { COMMON, RARE, EPIC, LEGENDARY }
    enum EffectType { NONE, GLOW, SPARKLE, RAINBOW, LIGHTNING, BUBBLE, FLAME }

    // 结构体定义
    struct ColorConfig {
        string primaryColor;
        string secondaryColor;
        string accentColor;
        uint8 transparency;
    }

    struct SkinTemplate {
        uint256 templateId;
        string name;
        string description;
        RarityLevel rarity;
        EffectType effectType;
        ColorConfig colorConfig;
        string content;            // 皮肤内容（SVG代码或URL地址）
        bool isActive;
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 createdAt;
        address creator;
    }

    struct SkinInfo {
        uint256 templateId;
        uint256 mintedAt;
        address originalOwner;
        uint256 serialNumber;
    }

    // 事件
    event SkinTemplateCreated(uint256 indexed templateId, string name, RarityLevel rarity, uint256 maxSupply, address indexed creator);
    event SkinTemplateUpdated(uint256 indexed templateId, string name, string description, bool isActive);
    event SkinTemplateStatusChanged(uint256 indexed templateId, bool isActive, address indexed updater);
    event SkinTemplateContentUpdated(uint256 indexed templateId, string content, address indexed updater);
    event SkinMinted(address indexed to, uint256 indexed tokenId, uint256 indexed templateId, uint256 serialNumber);
    event BatchSkinsMinted(address indexed to, uint256[] tokenIds, uint256[] templateIds, uint256 totalCount);
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);

    // 皮肤模板管理功能
    function createSkinTemplate(string memory name, string memory description, RarityLevel rarity, EffectType effectType, ColorConfig memory colorConfig, string memory content, uint256 maxSupply) external returns (uint256);
    function createSkinTemplatesBatch(string[] memory names, string[] memory descriptions, RarityLevel[] memory rarities, EffectType[] memory effectTypes, ColorConfig[] memory colorConfigs, string[] memory contents, uint256[] memory maxSupplies) external returns (uint256[] memory);
    function updateSkinTemplate(uint256 templateId, string memory name, string memory description) external;
    function setTemplateActive(uint256 templateId, bool isActive) external;
    function setTemplatesActiveBatch(uint256[] memory templateIds, bool isActive) external;

    // 皮肤属性管理
    function updateTemplateColorConfig(uint256 templateId, ColorConfig memory colorConfig) external;
    function updateTemplateEffectType(uint256 templateId, EffectType effectType) external;
    function updateTemplateContent(uint256 templateId, string memory content) external;

    // NFT铸造功能
    function mintSkin(address to, uint256 templateId) external returns (uint256);
    function mintSkinsBatch(address to, uint256[] memory templateIds) external returns (uint256[] memory);
    function mintRandomSkin(address to, RarityLevel rarity) external returns (uint256);

    // 元数据管理
    function setBaseURI(string memory newBaseURI) external;
    function setTokenURI(uint256 tokenId, string memory newTokenURI) external;

    // 查询功能
    function getSkinTemplate(uint256 templateId) external view returns (SkinTemplate memory);
    function getSkinInfo(uint256 tokenId) external view returns (SkinTemplate memory template, SkinInfo memory skinInfo);
    function getUserSkins(address user) external view returns (uint256[] memory);
    function getTemplatesByRarity(RarityLevel rarity) external view returns (uint256[] memory);
    function getActiveTemplatesByRarity(RarityLevel rarity) external view returns (uint256[] memory);
    function getTotalTemplates() external view returns (uint256);
    function getTotalSupply() external view returns (uint256);
}
