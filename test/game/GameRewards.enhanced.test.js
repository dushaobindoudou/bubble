const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameRewards Enhanced Features", function () {
  let gameRewards;
  let bubbleToken;
  let bubbleSkinNFT;
  let owner;
  let admin;
  let player1;
  let player2;
  let gameServer;

  // 测试数据
  const sampleSession = {
    finalRank: 1,
    maxMass: 5000,
    survivalTime: 600, // 10分钟
    killCount: 5,
    sessionEndTime: 0, // 将在测试中设置
    sessionId: ethers.keccak256(ethers.toUtf8Bytes("test-session-1"))
  };

  beforeEach(async function () {
    [owner, admin, player1, player2, gameServer] = await ethers.getSigners();

    // 部署代币合约
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();

    // 部署NFT合约
    const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
    bubbleSkinNFT = await BubbleSkinNFT.deploy("Bubble Skin NFT", "BSKIN", "https://api.bubblebrawl.com/metadata/");
    await bubbleSkinNFT.waitForDeployment();

    // 创建一个示例皮肤模板用于NFT奖励测试
    const sampleColorConfig = {
      primaryColor: "#FFB6C1",
      secondaryColor: "#87CEEB",
      accentColor: "#98FB98",
      transparency: 200
    };
    const sampleContent = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FFB6C1"/></svg>';

    await bubbleSkinNFT.createSkinTemplate(
      "测试皮肤",
      "测试用皮肤",
      1, // RARE
      1, // GLOW
      sampleColorConfig,
      sampleContent,
      100
    );

    // 部署游戏奖励合约
    const GameRewards = await ethers.getContractFactory("GameRewards");
    gameRewards = await GameRewards.deploy(
      await bubbleToken.getAddress(),
      await bubbleSkinNFT.getAddress()
    );
    await gameRewards.waitForDeployment();

    // 设置权限
    const GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
    await bubbleToken.grantRole(GAME_REWARD_ROLE, await gameRewards.getAddress());

    const MINTER_ROLE = await bubbleSkinNFT.MINTER_ROLE();
    await bubbleSkinNFT.grantRole(MINTER_ROLE, await gameRewards.getAddress());

    const ADMIN_ROLE = await gameRewards.ADMIN_ROLE();
    await gameRewards.grantRole(ADMIN_ROLE, admin.address);

    // 设置会话结束时间为当前时间
    sampleSession.sessionEndTime = Math.floor(Date.now() / 1000);
  });

  describe("玩家提交游戏会话", function () {
    it("应该能够提交有效的游戏会话", async function () {
      await expect(gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      )).to.emit(gameRewards, "PlayerSessionSubmitted")
        .withArgs(
          sampleSession.sessionId,
          player1.address,
          sampleSession.finalRank,
          sampleSession.maxMass,
          sampleSession.survivalTime,
          sampleSession.killCount
        );

      // 验证会话数据
      const sessionDetails = await gameRewards.getSessionDetails(sampleSession.sessionId);
      expect(sessionDetails.player).to.equal(player1.address);
      expect(sessionDetails.verified).to.be.false;
      expect(sessionDetails.claimed).to.be.false;
    });

    it("应该拒绝重复提交相同的会话ID", async function () {
      // 第一次提交
      await gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      );

      // 第二次提交相同ID应该失败
      await expect(gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      )).to.be.revertedWith("GameRewards: session already submitted");
    });

    it("应该拒绝无效的会话数据", async function () {
      // 测试无效的排名
      await expect(gameRewards.connect(player1).submitPlayerSession(
        0, // 无效排名
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      )).to.be.revertedWith("GameRewards: invalid final rank");

      // 测试未来的结束时间
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后
      await expect(gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        futureTime,
        sampleSession.sessionId
      )).to.be.revertedWith("GameRewards: future session end time");
    });
  });

  describe("管理员审核机制", function () {
    beforeEach(async function () {
      // 提交一个会话用于测试
      await gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      );
    });

    it("管理员应该能够审核通过会话", async function () {
      await expect(gameRewards.connect(admin).verifyPlayerSession(sampleSession.sessionId, true))
        .to.emit(gameRewards, "SessionVerified")
        .withArgs(sampleSession.sessionId, admin.address, true);

      const sessionDetails = await gameRewards.getSessionDetails(sampleSession.sessionId);
      expect(sessionDetails.verified).to.be.true;
    });

    it("管理员应该能够拒绝会话", async function () {
      await expect(gameRewards.connect(admin).verifyPlayerSession(sampleSession.sessionId, false))
        .to.emit(gameRewards, "SessionVerified")
        .withArgs(sampleSession.sessionId, admin.address, false);

      const sessionDetails = await gameRewards.getSessionDetails(sampleSession.sessionId);
      expect(sessionDetails.verified).to.be.false;
    });

    it("非管理员不应该能够审核会话", async function () {
      await expect(gameRewards.connect(player1).verifyPlayerSession(sampleSession.sessionId, true))
        .to.be.reverted;
    });

    it("应该能够批量审核会话", async function () {
      // 提交第二个会话
      const sessionId2 = ethers.keccak256(ethers.toUtf8Bytes("test-session-2"));
      await gameRewards.connect(player2).submitPlayerSession(
        2, 3000, 400, 3, sampleSession.sessionEndTime, sessionId2
      );

      // 批量审核
      await gameRewards.connect(admin).verifyPlayerSessionsBatch(
        [sampleSession.sessionId, sessionId2],
        [true, false]
      );

      const session1 = await gameRewards.getSessionDetails(sampleSession.sessionId);
      const session2 = await gameRewards.getSessionDetails(sessionId2);
      
      expect(session1.verified).to.be.true;
      expect(session2.verified).to.be.false;
    });
  });

  describe("玩家自主领取奖励", function () {
    beforeEach(async function () {
      // 提交并审核通过一个会话
      await gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      );
      await gameRewards.connect(admin).verifyPlayerSession(sampleSession.sessionId, true);
    });

    it("玩家应该能够领取已审核通过的奖励", async function () {
      const initialBalance = await bubbleToken.balanceOf(player1.address);
      
      await expect(gameRewards.connect(player1).claimReward(sampleSession.sessionId))
        .to.emit(gameRewards, "RewardClaimed");

      const finalBalance = await bubbleToken.balanceOf(player1.address);
      expect(finalBalance).to.be.gt(initialBalance);

      // 验证会话已标记为已领取
      const sessionDetails = await gameRewards.getSessionDetails(sampleSession.sessionId);
      expect(sessionDetails.claimed).to.be.true;
    });

    it("应该拒绝重复领取奖励", async function () {
      // 第一次领取
      await gameRewards.connect(player1).claimReward(sampleSession.sessionId);

      // 第二次领取应该失败
      await expect(gameRewards.connect(player1).claimReward(sampleSession.sessionId))
        .to.be.revertedWith("GameRewards: reward already claimed");
    });

    it("应该拒绝非会话拥有者领取奖励", async function () {
      await expect(gameRewards.connect(player2).claimReward(sampleSession.sessionId))
        .to.be.revertedWith("GameRewards: not session owner");
    });

    it("应该拒绝领取未审核的会话奖励", async function () {
      // 提交一个新会话但不审核
      const sessionId2 = ethers.keccak256(ethers.toUtf8Bytes("test-session-2"));
      await gameRewards.connect(player1).submitPlayerSession(
        2, 3000, 400, 3, sampleSession.sessionEndTime, sessionId2
      );

      await expect(gameRewards.connect(player1).claimReward(sessionId2))
        .to.be.revertedWith("GameRewards: session not verified");
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      // 提交多个会话
      await gameRewards.connect(player1).submitPlayerSession(
        sampleSession.finalRank,
        sampleSession.maxMass,
        sampleSession.survivalTime,
        sampleSession.killCount,
        sampleSession.sessionEndTime,
        sampleSession.sessionId
      );

      const sessionId2 = ethers.keccak256(ethers.toUtf8Bytes("test-session-2"));
      await gameRewards.connect(player1).submitPlayerSession(
        2, 3000, 400, 3, sampleSession.sessionEndTime, sessionId2
      );

      // 审核第一个会话
      await gameRewards.connect(admin).verifyPlayerSession(sampleSession.sessionId, true);
    });

    it("应该能够获取玩家提交的会话列表", async function () {
      const submittedSessions = await gameRewards.getPlayerSubmittedSessions(player1.address);
      expect(submittedSessions.length).to.equal(2);
    });

    it("应该能够获取玩家可领取的会话", async function () {
      const claimableSessions = await gameRewards.getPlayerClaimableSessions(player1.address);
      expect(claimableSessions.length).to.equal(1);
      expect(claimableSessions[0]).to.equal(sampleSession.sessionId);
    });

    it("应该能够获取玩家会话统计信息", async function () {
      const [submitted, verified, claimed, claimable] = await gameRewards.getPlayerSessionStats(player1.address);
      expect(submitted).to.equal(2);
      expect(verified).to.equal(1);
      expect(claimed).to.equal(0);
      expect(claimable).to.equal(1);
    });

    it("管理员应该能够获取待审核会话列表", async function () {
      const pendingSessions = await gameRewards.connect(admin).getPendingVerificationSessions(0, 10);
      expect(pendingSessions.length).to.be.gte(1);
    });
  });
});
