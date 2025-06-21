const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BubbleSkinNFT", function () {
  let bubbleSkinNFT;
  let owner;
  let skinManager;
  let minter;
  let addr1;
  let addr2;

  // 测试数据
  const baseURI = "https://api.bubblebrawl.com/metadata/";
  const sampleColorConfig = {
    primaryColor: "#FFB6C1",
    secondaryColor: "#87CEEB",
    accentColor: "#98FB98",
    transparency: 200
  };
  const sampleSVGContent = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FFB6C1"/></svg>';
  const sampleURLContent = "https://example.com/skin.png";

  beforeEach(async function () {
    // 获取测试账户
    [owner, skinManager, minter, addr1, addr2] = await ethers.getSigners();

    // 部署合约
    const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
    bubbleSkinNFT = await BubbleSkinNFT.deploy("Bubble Skin NFT", "BSKIN", baseURI);
    await bubbleSkinNFT.waitForDeployment();

    // 设置角色权限
    const SKIN_MANAGER_ROLE = await bubbleSkinNFT.SKIN_MANAGER_ROLE();
    const MINTER_ROLE = await bubbleSkinNFT.MINTER_ROLE();

    await bubbleSkinNFT.grantRole(SKIN_MANAGER_ROLE, skinManager.address);
    await bubbleSkinNFT.grantRole(MINTER_ROLE, minter.address);
  });

  describe("部署", function () {
    it("应该设置正确的名称和符号", async function () {
      expect(await bubbleSkinNFT.name()).to.equal("Bubble Skin NFT");
      expect(await bubbleSkinNFT.symbol()).to.equal("BSKIN");
    });

    it("应该设置正确的管理员权限", async function () {
      const ADMIN_ROLE = await bubbleSkinNFT.ADMIN_ROLE();
      expect(await bubbleSkinNFT.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("皮肤模板管理", function () {
    it("应该能够创建皮肤模板", async function () {
      const templateId = await bubbleSkinNFT.connect(skinManager).createSkinTemplate.staticCall(
        "粉色泡泡",
        "可爱的粉色泡泡皮肤",
        0, // COMMON
        1, // GLOW
        sampleColorConfig,
        sampleSVGContent,
        1000
      );

      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "粉色泡泡",
        "可爱的粉色泡泡皮肤",
        0, // COMMON
        1, // GLOW
        sampleColorConfig,
        sampleSVGContent,
        1000
      );

      const template = await bubbleSkinNFT.getSkinTemplate(templateId);
      expect(template.name).to.equal("粉色泡泡");
      expect(template.rarity).to.equal(0);
      expect(template.content).to.equal(sampleSVGContent);
      expect(template.isActive).to.be.true;
    });

    it("应该能够更新皮肤模板", async function () {
      // 先创建模板
      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "测试皮肤",
        "测试描述",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        sampleURLContent,
        100
      );

      // 更新模板
      await bubbleSkinNFT.connect(skinManager).updateSkinTemplate(
        1,
        "更新的皮肤",
        "更新的描述"
      );

      const template = await bubbleSkinNFT.getSkinTemplate(1);
      expect(template.name).to.equal("更新的皮肤");
      expect(template.description).to.equal("更新的描述");
    });

    it("应该能够设置模板状态", async function () {
      // 创建模板
      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "测试皮肤",
        "测试描述",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        sampleURLContent,
        100
      );

      // 禁用模板
      await bubbleSkinNFT.connect(skinManager).setTemplateActive(1, false);

      const template = await bubbleSkinNFT.getSkinTemplate(1);
      expect(template.isActive).to.be.false;
    });

    it("应该能够更新皮肤内容", async function () {
      // 创建模板
      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "测试皮肤",
        "测试描述",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        sampleURLContent,
        100
      );

      // 更新内容
      const newContent = "https://newexample.com/newskin.png";
      await bubbleSkinNFT.connect(skinManager).updateTemplateContent(1, newContent);

      const template = await bubbleSkinNFT.getSkinTemplate(1);
      expect(template.content).to.equal(newContent);
    });
  });

  describe("NFT铸造", function () {
    beforeEach(async function () {
      // 创建测试模板
      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "测试皮肤",
        "测试描述",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        sampleSVGContent,
        100
      );
    });

    it("应该能够铸造皮肤NFT", async function () {
      const tokenId = await bubbleSkinNFT.connect(minter).mintSkin.staticCall(addr1.address, 1);

      await bubbleSkinNFT.connect(minter).mintSkin(addr1.address, 1);

      expect(await bubbleSkinNFT.ownerOf(tokenId)).to.equal(addr1.address);
      expect(await bubbleSkinNFT.balanceOf(addr1.address)).to.equal(1);

      const [template, skinInfo] = await bubbleSkinNFT.getSkinInfo(tokenId);
      expect(template.name).to.equal("测试皮肤");
      expect(skinInfo.templateId).to.equal(1);
      expect(skinInfo.originalOwner).to.equal(addr1.address);
    });

    it("应该能够批量铸造皮肤NFT", async function () {
      // 创建更多模板
      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "测试皮肤2",
        "测试描述2",
        1, // RARE
        1, // GLOW
        sampleColorConfig,
        sampleURLContent,
        50
      );

      const tokenIds = await bubbleSkinNFT.connect(minter).mintSkinsBatch.staticCall(
        addr1.address,
        [1, 2]
      );

      await bubbleSkinNFT.connect(minter).mintSkinsBatch(addr1.address, [1, 2]);

      expect(await bubbleSkinNFT.balanceOf(addr1.address)).to.equal(2);
      expect(await bubbleSkinNFT.ownerOf(tokenIds[0])).to.equal(addr1.address);
      expect(await bubbleSkinNFT.ownerOf(tokenIds[1])).to.equal(addr1.address);
    });

    it("应该在模板不活跃时拒绝铸造", async function () {
      // 禁用模板
      await bubbleSkinNFT.connect(skinManager).setTemplateActive(1, false);

      await expect(
        bubbleSkinNFT.connect(minter).mintSkin(addr1.address, 1)
      ).to.be.revertedWith("BubbleSkinNFT: template is not active");
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      // 创建测试模板
      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "普通皮肤",
        "普通描述",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        sampleSVGContent,
        100
      );

      await bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "稀有皮肤",
        "稀有描述",
        1, // RARE
        1, // GLOW
        sampleColorConfig,
        sampleURLContent,
        50
      );
    });

    it("应该能够按稀有度查询模板", async function () {
      const commonTemplates = await bubbleSkinNFT.getTemplatesByRarity(0); // COMMON
      const rareTemplates = await bubbleSkinNFT.getTemplatesByRarity(1); // RARE

      expect(commonTemplates.length).to.equal(1);
      expect(rareTemplates.length).to.equal(1);
      expect(commonTemplates[0]).to.equal(1);
      expect(rareTemplates[0]).to.equal(2);
    });

    it("应该能够获取用户皮肤", async function () {
      // 铸造一些NFT
      await bubbleSkinNFT.connect(minter).mintSkin(addr1.address, 1);
      await bubbleSkinNFT.connect(minter).mintSkin(addr1.address, 2);

      const userSkins = await bubbleSkinNFT.getUserSkins(addr1.address);
      expect(userSkins.length).to.equal(2);
    });

    it("应该能够获取总数统计", async function () {
      expect(await bubbleSkinNFT.getTotalTemplates()).to.equal(2);
      expect(await bubbleSkinNFT.getTotalSupply()).to.equal(0);

      // 铸造一个NFT
      await bubbleSkinNFT.connect(minter).mintSkin(addr1.address, 1);
      expect(await bubbleSkinNFT.getTotalSupply()).to.equal(1);
    });
  });

  describe("内容验证", function () {
    it("应该接受有效的SVG内容", async function () {
      const svgContent = '<svg width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';

      await expect(bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "SVG皮肤",
        "SVG格式皮肤",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        svgContent,
        100
      )).to.not.be.reverted;
    });

    it("应该接受有效的HTTP URL", async function () {
      const httpURL = "http://example.com/skin.png";

      await expect(bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "HTTP皮肤",
        "HTTP URL皮肤",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        httpURL,
        100
      )).to.not.be.reverted;
    });

    it("应该接受有效的HTTPS URL", async function () {
      const httpsURL = "https://example.com/skin.png";

      await expect(bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "HTTPS皮肤",
        "HTTPS URL皮肤",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        httpsURL,
        100
      )).to.not.be.reverted;
    });

    it("应该接受有效的IPFS URL", async function () {
      const ipfsURL = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

      await expect(bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "IPFS皮肤",
        "IPFS URL皮肤",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        ipfsURL,
        100
      )).to.not.be.reverted;
    });

    it("应该拒绝空内容", async function () {
      await expect(bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "空内容皮肤",
        "空内容测试",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        "",
        100
      )).to.be.revertedWith("BubbleSkinNFT: content cannot be empty");
    });

    it("应该拒绝无效格式的内容", async function () {
      const invalidContent = "invalid content format";

      await expect(bubbleSkinNFT.connect(skinManager).createSkinTemplate(
        "无效内容皮肤",
        "无效内容测试",
        0, // COMMON
        0, // NONE
        sampleColorConfig,
        invalidContent,
        100
      )).to.be.revertedWith("BubbleSkinNFT: invalid content format");
    });
  });
});
