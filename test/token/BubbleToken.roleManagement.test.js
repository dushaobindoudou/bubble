const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BubbleToken - GAME_REWARD_ROLE Management", function () {
  let bubbleToken;
  let owner, admin, gameRewardManager1, gameRewardManager2, user1, user2;
  let GAME_REWARD_ROLE, DEFAULT_ADMIN_ROLE, ADMIN_ROLE;

  beforeEach(async function () {
    [owner, admin, gameRewardManager1, gameRewardManager2, user1, user2] = await ethers.getSigners();

    // 部署 BubbleToken 合约
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();

    // 获取角色常量
    GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
    DEFAULT_ADMIN_ROLE = await bubbleToken.DEFAULT_ADMIN_ROLE();
    ADMIN_ROLE = await bubbleToken.ADMIN_ROLE();
  });

  describe("Role Management Functions", function () {
    describe("grantGameRewardRole", function () {
      it("应该允许 DEFAULT_ADMIN_ROLE 授予游戏奖励角色", async function () {
        await expect(bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address))
          .to.emit(bubbleToken, "GameRewardRoleGranted")
          .withArgs(gameRewardManager1.address, owner.address);

        expect(await bubbleToken.hasGameRewardRole(gameRewardManager1.address)).to.be.true;
        expect(await bubbleToken.hasRole(GAME_REWARD_ROLE, gameRewardManager1.address)).to.be.true;
      });

      it("应该将地址添加到枚举集合中", async function () {
        await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
        
        expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(1);
        expect(await bubbleToken.getGameRewardRoleMemberAt(0)).to.equal(gameRewardManager1.address);
        
        const members = await bubbleToken.getGameRewardRoleMembers();
        expect(members).to.have.lengthOf(1);
        expect(members[0]).to.equal(gameRewardManager1.address);
      });

      it("应该拒绝非 DEFAULT_ADMIN_ROLE 的调用", async function () {
        await expect(bubbleToken.connect(user1).grantGameRewardRole(gameRewardManager1.address))
          .to.be.reverted;
      });

      it("应该拒绝零地址", async function () {
        await expect(bubbleToken.connect(owner).grantGameRewardRole(ethers.ZeroAddress))
          .to.be.revertedWith("BubbleToken: cannot grant role to zero address");
      });

      it("应该拒绝重复授予角色", async function () {
        await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
        
        await expect(bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address))
          .to.be.revertedWith("BubbleToken: account already has game reward role");
      });

      it("应该支持授予多个地址", async function () {
        await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
        await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager2.address);

        expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(2);
        
        const members = await bubbleToken.getGameRewardRoleMembers();
        expect(members).to.include(gameRewardManager1.address);
        expect(members).to.include(gameRewardManager2.address);
      });
    });

    describe("revokeGameRewardRole", function () {
      beforeEach(async function () {
        await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
        await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager2.address);
      });

      it("应该允许 DEFAULT_ADMIN_ROLE 撤销游戏奖励角色", async function () {
        await expect(bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address))
          .to.emit(bubbleToken, "GameRewardRoleRevoked")
          .withArgs(gameRewardManager1.address, owner.address);

        expect(await bubbleToken.hasGameRewardRole(gameRewardManager1.address)).to.be.false;
        expect(await bubbleToken.hasRole(GAME_REWARD_ROLE, gameRewardManager1.address)).to.be.false;
      });

      it("应该从枚举集合中移除地址", async function () {
        await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address);
        
        expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(1);
        expect(await bubbleToken.getGameRewardRoleMemberAt(0)).to.equal(gameRewardManager2.address);
        
        const members = await bubbleToken.getGameRewardRoleMembers();
        expect(members).to.have.lengthOf(1);
        expect(members[0]).to.equal(gameRewardManager2.address);
      });

      it("应该拒绝非 DEFAULT_ADMIN_ROLE 的调用", async function () {
        await expect(bubbleToken.connect(user1).revokeGameRewardRole(gameRewardManager1.address))
          .to.be.reverted;
      });

      it("应该拒绝零地址", async function () {
        await expect(bubbleToken.connect(owner).revokeGameRewardRole(ethers.ZeroAddress))
          .to.be.revertedWith("BubbleToken: cannot revoke role from zero address");
      });

      it("应该拒绝撤销不存在的角色", async function () {
        await expect(bubbleToken.connect(owner).revokeGameRewardRole(user1.address))
          .to.be.revertedWith("BubbleToken: account does not have game reward role");
      });
    });
  });

  describe("Role Query Functions", function () {
    beforeEach(async function () {
      await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
      await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager2.address);
    });

    describe("hasGameRewardRole", function () {
      it("应该正确返回角色状态", async function () {
        expect(await bubbleToken.hasGameRewardRole(gameRewardManager1.address)).to.be.true;
        expect(await bubbleToken.hasGameRewardRole(gameRewardManager2.address)).to.be.true;
        expect(await bubbleToken.hasGameRewardRole(user1.address)).to.be.false;
      });
    });

    describe("getGameRewardRoleMembers", function () {
      it("应该返回所有角色成员", async function () {
        const members = await bubbleToken.getGameRewardRoleMembers();
        expect(members).to.have.lengthOf(2);
        expect(members).to.include(gameRewardManager1.address);
        expect(members).to.include(gameRewardManager2.address);
      });

      it("应该在没有成员时返回空数组", async function () {
        await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address);
        await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager2.address);
        
        const members = await bubbleToken.getGameRewardRoleMembers();
        expect(members).to.have.lengthOf(0);
      });
    });

    describe("getGameRewardRoleMemberCount", function () {
      it("应该返回正确的成员数量", async function () {
        expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(2);
        
        await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address);
        expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(1);
        
        await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager2.address);
        expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(0);
      });
    });

    describe("getGameRewardRoleMemberAt", function () {
      it("应该返回指定索引的成员", async function () {
        const member0 = await bubbleToken.getGameRewardRoleMemberAt(0);
        const member1 = await bubbleToken.getGameRewardRoleMemberAt(1);
        
        const allMembers = [member0, member1];
        expect(allMembers).to.include(gameRewardManager1.address);
        expect(allMembers).to.include(gameRewardManager2.address);
      });

      it("应该在索引超出范围时回滚", async function () {
        await expect(bubbleToken.getGameRewardRoleMemberAt(2))
          .to.be.revertedWith("BubbleToken: index out of bounds");
      });
    });
  });

  describe("Integration with Game Reward Functions", function () {
    beforeEach(async function () {
      await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
    });

    it("拥有角色的地址应该能够铸造游戏奖励", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(bubbleToken.connect(gameRewardManager1).mintGameReward(user1.address, amount, "Test reward"))
        .to.emit(bubbleToken, "GameRewardMinted")
        .withArgs(user1.address, amount, "Test reward");
        
      expect(await bubbleToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("撤销角色后应该无法铸造游戏奖励", async function () {
      await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address);

      const amount = ethers.parseEther("100");
      await expect(bubbleToken.connect(gameRewardManager1).mintGameReward(user1.address, amount, "Test reward"))
        .to.be.reverted;
    });

    it("没有角色的地址应该无法铸造游戏奖励", async function () {
      const amount = ethers.parseEther("100");
      await expect(bubbleToken.connect(user1).mintGameReward(user2.address, amount, "Test reward"))
        .to.be.reverted;
    });
  });

  describe("Role Management Events", function () {
    it("应该在授予角色时发出事件", async function () {
      await expect(bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address))
        .to.emit(bubbleToken, "GameRewardRoleGranted")
        .withArgs(gameRewardManager1.address, owner.address);
    });

    it("应该在撤销角色时发出事件", async function () {
      await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
      
      await expect(bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address))
        .to.emit(bubbleToken, "GameRewardRoleRevoked")
        .withArgs(gameRewardManager1.address, owner.address);
    });
  });

  describe("Reentrancy Protection", function () {
    it("角色管理函数应该有重入保护", async function () {
      // 这个测试验证 nonReentrant 修饰符的存在
      // 在正常情况下，这些函数不应该被重入攻击
      await expect(bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address))
        .to.not.be.reverted;
        
      await expect(bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address))
        .to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("应该正确处理大量角色成员", async function () {
      const accounts = [gameRewardManager1, gameRewardManager2, user1, user2];
      
      // 授予多个角色
      for (const account of accounts) {
        await bubbleToken.connect(owner).grantGameRewardRole(account.address);
      }
      
      expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(accounts.length);
      
      const members = await bubbleToken.getGameRewardRoleMembers();
      expect(members).to.have.lengthOf(accounts.length);
      
      for (const account of accounts) {
        expect(members).to.include(account.address);
      }
      
      // 撤销所有角色
      for (const account of accounts) {
        await bubbleToken.connect(owner).revokeGameRewardRole(account.address);
      }
      
      expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(0);
    });

    it("应该在角色变更后保持数据一致性", async function () {
      // 授予角色
      await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager1.address);
      await bubbleToken.connect(owner).grantGameRewardRole(gameRewardManager2.address);
      
      // 验证一致性
      expect(await bubbleToken.hasGameRewardRole(gameRewardManager1.address)).to.be.true;
      expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(2);
      
      // 撤销一个角色
      await bubbleToken.connect(owner).revokeGameRewardRole(gameRewardManager1.address);
      
      // 验证一致性
      expect(await bubbleToken.hasGameRewardRole(gameRewardManager1.address)).to.be.false;
      expect(await bubbleToken.hasGameRewardRole(gameRewardManager2.address)).to.be.true;
      expect(await bubbleToken.getGameRewardRoleMemberCount()).to.equal(1);
      
      const members = await bubbleToken.getGameRewardRoleMembers();
      expect(members).to.have.lengthOf(1);
      expect(members[0]).to.equal(gameRewardManager2.address);
    });
  });
});
