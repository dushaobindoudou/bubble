const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BubbleToken", function () {
  let bubbleToken;
  let owner;
  let gameRewardManager;
  let addr1;
  let addr2;
  let addrs;

  // 常量
  const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1B BUB
  const GAME_REWARDS_POOL = ethers.parseEther("400000000"); // 400M BUB
  const PUBLIC_SALE = ethers.parseEther("50000000"); // 50M BUB

  beforeEach(async function () {
    // 获取测试账户
    [owner, gameRewardManager, addr1, addr2, ...addrs] = await ethers.getSigners();

    // 部署合约
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();

    // 设置游戏奖励管理员角色
    const GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
    await bubbleToken.grantRole(GAME_REWARD_ROLE, gameRewardManager.address);
  });

  describe("部署", function () {
    it("应该设置正确的代币名称和符号", async function () {
      expect(await bubbleToken.name()).to.equal("BubbleToken");
      expect(await bubbleToken.symbol()).to.equal("BUB");
    });

    it("应该设置正确的小数位数", async function () {
      expect(await bubbleToken.decimals()).to.equal(18);
    });

    it("应该将初始供应量分配给部署者", async function () {
      const ownerBalance = await bubbleToken.balanceOf(owner.address);
      expect(await bubbleToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("交易", function () {
    it("应该能够在账户之间转移代币", async function () {
      // 转移 50 个代币给 addr1
      await bubbleToken.transfer(addr1.address, ethers.parseEther("50"));
      const addr1Balance = await bubbleToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.parseEther("50"));

      // 从 addr1 转移 50 个代币给 addr2
      await bubbleToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
      const addr2Balance = await bubbleToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("应该在余额不足时失败", async function () {
      const initialOwnerBalance = await bubbleToken.balanceOf(owner.address);

      // 尝试转移超过余额的代币
      await expect(
        bubbleToken.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;

      // 所有者余额应该保持不变
      expect(await bubbleToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("应该更新转移后的余额", async function () {
      const initialOwnerBalance = await bubbleToken.balanceOf(owner.address);

      // 转移 100 个代币给 addr1
      await bubbleToken.transfer(addr1.address, ethers.parseEther("100"));

      // 转移 50 个代币给 addr2
      await bubbleToken.transfer(addr2.address, ethers.parseEther("50"));

      // 检查余额
      const finalOwnerBalance = await bubbleToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - ethers.parseEther("150"));

      const addr1Balance = await bubbleToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.parseEther("100"));

      const addr2Balance = await bubbleToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });
  });

  describe("授权", function () {
    it("应该能够批准代币支出", async function () {
      await bubbleToken.approve(addr1.address, ethers.parseEther("100"));
      expect(await bubbleToken.allowance(owner.address, addr1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("应该能够使用 transferFrom 转移代币", async function () {
      const amount = ethers.parseEther("100");

      // 批准 addr1 花费代币
      await bubbleToken.approve(addr1.address, amount);

      // addr1 代表 owner 转移代币给 addr2
      await bubbleToken.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      expect(await bubbleToken.balanceOf(addr2.address)).to.equal(amount);
    });
  });
});
