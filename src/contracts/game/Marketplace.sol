// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Marketplace
 * @dev NFT交易市场合约
 *
 * 功能特性：
 * - NFT买卖交易
 * - 支持多种支付代币
 * - 交易手续费机制
 * - 拍卖功能（基础版）
 * - 交易历史记录
 */
contract Marketplace is AccessControl, ReentrancyGuard {
    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // 交易状态枚举
    enum ListingStatus { ACTIVE, SOLD, CANCELLED }

    // 挂单结构体
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        address paymentToken;
        uint256 price;
        uint256 createdAt;
        uint256 expiresAt;
        ListingStatus status;
    }

    // 交易记录结构体
    struct Sale {
        uint256 saleId;
        uint256 listingId;
        address seller;
        address buyer;
        address nftContract;
        uint256 tokenId;
        address paymentToken;
        uint256 price;
        uint256 fee;
        uint256 timestamp;
    }

    // 状态变量
    uint256 private _listingIdCounter;
    uint256 private _saleIdCounter;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Sale) public sales;
    mapping(address => bool) public supportedPaymentTokens;
    mapping(address => bool) public supportedNFTContracts;

    // 手续费配置
    uint256 public feePercentage = 250; // 2.5% (basis points)
    address public feeRecipient;

    // 统计数据
    uint256 public totalListings;
    uint256 public totalSales;
    uint256 public totalVolume;

    // 事件
    event NFTListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    );

    event NFTSold(
        uint256 indexed saleId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 fee
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event PaymentTokenUpdated(address token, bool supported);

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Marketplace: invalid fee recipient");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        feeRecipient = _feeRecipient;
        _listingIdCounter = 1;
        _saleIdCounter = 1;
    }

    // ============ 交易功能 ============

    /**
     * @dev 挂单出售NFT
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(supportedNFTContracts[nftContract], "Marketplace: NFT contract not supported");
        require(supportedPaymentTokens[paymentToken], "Marketplace: payment token not supported");
        require(price > 0, "Marketplace: price must be greater than 0");
        require(duration > 0, "Marketplace: duration must be greater than 0");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Marketplace: not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this), "Marketplace: not approved");

        uint256 listingId = _listingIdCounter++;
        uint256 expiresAt = block.timestamp + duration;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            paymentToken: paymentToken,
            price: price,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: ListingStatus.ACTIVE
        });

        totalListings++;

        emit NFTListed(listingId, msg.sender, nftContract, tokenId, paymentToken, price);
        return listingId;
    }

    /**
     * @dev 购买NFT
     */
    function buyNFT(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Marketplace: listing not active");
        require(block.timestamp <= listing.expiresAt, "Marketplace: listing expired");
        require(msg.sender != listing.seller, "Marketplace: cannot buy own NFT");

        IERC721 nft = IERC721(listing.nftContract);
        require(nft.ownerOf(listing.tokenId) == listing.seller, "Marketplace: seller no longer owns NFT");

        IERC20 paymentToken = IERC20(listing.paymentToken);
        require(paymentToken.balanceOf(msg.sender) >= listing.price, "Marketplace: insufficient balance");

        // 计算手续费
        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerAmount = listing.price - fee;

        // 转移代币
        require(paymentToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Marketplace: payment failed");
        if (fee > 0) {
            require(paymentToken.transferFrom(msg.sender, feeRecipient, fee), "Marketplace: fee payment failed");
        }

        // 转移NFT
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // 更新挂单状态
        listing.status = ListingStatus.SOLD;

        // 记录交易
        uint256 saleId = _saleIdCounter++;
        sales[saleId] = Sale({
            saleId: saleId,
            listingId: listingId,
            seller: listing.seller,
            buyer: msg.sender,
            nftContract: listing.nftContract,
            tokenId: listing.tokenId,
            paymentToken: listing.paymentToken,
            price: listing.price,
            fee: fee,
            timestamp: block.timestamp
        });

        totalSales++;
        totalVolume += listing.price;

        emit NFTSold(saleId, listingId, msg.sender, listing.seller, listing.price, fee);
    }

    /**
     * @dev 取消挂单
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Marketplace: not seller");
        require(listing.status == ListingStatus.ACTIVE, "Marketplace: listing not active");

        listing.status = ListingStatus.CANCELLED;

        emit ListingCancelled(listingId, msg.sender);
    }

    // ============ 管理功能 ============

    /**
     * @dev 设置手续费比例
     */
    function setFeePercentage(uint256 _feePercentage) external onlyRole(ADMIN_ROLE) {
        require(_feePercentage <= 1000, "Marketplace: fee too high"); // 最大10%
        uint256 oldFee = feePercentage;
        feePercentage = _feePercentage;
        emit FeeUpdated(oldFee, _feePercentage);
    }

    /**
     * @dev 设置手续费接收地址
     */
    function setFeeRecipient(address _feeRecipient) external onlyRole(ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Marketplace: invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev 设置支持的支付代币
     */
    function setSupportedPaymentToken(address token, bool supported) external onlyRole(ADMIN_ROLE) {
        supportedPaymentTokens[token] = supported;
        emit PaymentTokenUpdated(token, supported);
    }

    /**
     * @dev 设置支持的NFT合约
     */
    function setSupportedNFTContract(address nftContract, bool supported) external onlyRole(ADMIN_ROLE) {
        supportedNFTContracts[nftContract] = supported;
    }

    /**
     * @dev 批量设置支持的代币
     */
    function setSupportedPaymentTokensBatch(address[] memory tokens, bool[] memory supported)
        external onlyRole(ADMIN_ROLE) {
        require(tokens.length == supported.length, "Marketplace: arrays length mismatch");

        for (uint256 i = 0; i < tokens.length; i++) {
            supportedPaymentTokens[tokens[i]] = supported[i];
            emit PaymentTokenUpdated(tokens[i], supported[i]);
        }
    }

    // ============ 查询功能 ============

    /**
     * @dev 获取活跃挂单列表
     */
    function getActiveListings(uint256 offset, uint256 limit)
        external view returns (Listing[] memory) {
        require(limit > 0 && limit <= 100, "Marketplace: invalid limit");

        uint256 activeCount = 0;
        // 先计算活跃挂单数量
        for (uint256 i = 1; i < _listingIdCounter; i++) {
            if (listings[i].status == ListingStatus.ACTIVE &&
                block.timestamp <= listings[i].expiresAt) {
                activeCount++;
            }
        }

        if (offset >= activeCount) {
            return new Listing[](0);
        }

        uint256 resultLength = activeCount - offset;
        if (resultLength > limit) {
            resultLength = limit;
        }

        Listing[] memory result = new Listing[](resultLength);
        uint256 resultIndex = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i < _listingIdCounter && resultIndex < resultLength; i++) {
            if (listings[i].status == ListingStatus.ACTIVE &&
                block.timestamp <= listings[i].expiresAt) {
                if (currentIndex >= offset) {
                    result[resultIndex] = listings[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }

        return result;
    }

    /**
     * @dev 获取用户的挂单
     */
    function getUserListings(address user) external view returns (Listing[] memory) {
        uint256 userListingCount = 0;

        // 计算用户挂单数量
        for (uint256 i = 1; i < _listingIdCounter; i++) {
            if (listings[i].seller == user) {
                userListingCount++;
            }
        }

        Listing[] memory userListings = new Listing[](userListingCount);
        uint256 index = 0;

        for (uint256 i = 1; i < _listingIdCounter; i++) {
            if (listings[i].seller == user) {
                userListings[index] = listings[i];
                index++;
            }
        }

        return userListings;
    }

    /**
     * @dev 获取用户的购买历史
     */
    function getUserPurchases(address user) external view returns (Sale[] memory) {
        uint256 purchaseCount = 0;

        // 计算购买数量
        for (uint256 i = 1; i < _saleIdCounter; i++) {
            if (sales[i].buyer == user) {
                purchaseCount++;
            }
        }

        Sale[] memory purchases = new Sale[](purchaseCount);
        uint256 index = 0;

        for (uint256 i = 1; i < _saleIdCounter; i++) {
            if (sales[i].buyer == user) {
                purchases[index] = sales[i];
                index++;
            }
        }

        return purchases;
    }

    /**
     * @dev 获取市场统计信息
     */
    function getMarketStats() external view returns (
        uint256 _totalListings,
        uint256 _totalSales,
        uint256 _totalVolume,
        uint256 _activeListings
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < _listingIdCounter; i++) {
            if (listings[i].status == ListingStatus.ACTIVE &&
                block.timestamp <= listings[i].expiresAt) {
                activeCount++;
            }
        }

        return (totalListings, totalSales, totalVolume, activeCount);
    }
}
