# 🫧 Bubble Brawl - 泡泡大作战

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6.1-blue.svg)](https://socket.io/)
[![Web3 Ready](https://img.shields.io/badge/Web3-Ready-purple.svg)](#web3-features)

一个基于 Socket.IO 和 HTML5 Canvas 构建的可爱泡泡主题多人在线竞技游戏。

*A cute bubble-themed multiplayer online battle game built with Socket.IO and HTML5 Canvas.*

![Game Screenshot](screenshot.png)

## ✨ 特色功能 | Features

### 🎮 核心游戏玩法
- **实时多人对战** - 支持多名玩家同时在线竞技
- **泡泡成长系统** - 吃掉能量点和其他玩家来让你的泡泡变大
- **技能系统** - 加速冲刺和喂食机制增加策略性
- **排行榜系统** - 实时显示玩家排名和成绩

### 🎨 可爱泡泡主题
- **精美泡泡渲染** - 径向渐变和高光效果
- **多种皮肤系统** - 基础色彩、主题皮肤和特效边框
- **泡泡主题UI** - 可爱的界面设计和动画效果
- **中文本地化** - 完整的中文界面和提示信息

### 📱 跨平台支持
- **PC端优化** - 鼠标控制和键盘快捷键
- **移动端适配** - 虚拟摇杆和触控按钮
- **响应式设计** - 适配各种屏幕尺寸

### 🌐 Web3 集成 (开发中)
- **钱包连接** - 支持 MetaMask、WalletConnect 等主流钱包
- **NFT 皮肤系统** - 独特的泡泡皮肤 NFT 收藏
- **代币经济** - $BUB 代币奖励和消费机制
- **Monad 网络** - 基于 Monad 区块链的游戏经济

---

## 🚀 快速开始 | Quick Start

### 环境要求 | Requirements
- Node.js >= 14.0.0
- NPM 或 Yarn
- 现代浏览器支持 HTML5 Canvas

### 安装依赖 | Installation
```bash
# 克隆项目
git clone https://github.com/liepin-labs/bubble-brawl.git
cd bubble-brawl

# 安装依赖
npm install
```

### 启动游戏 | Start Game
```bash
# 开发模式
npm run watch

# 生产模式
npm start
```

游戏将在 `http://localhost:3000` 启动

### Docker 部署 | Docker Deployment
```bash
# 构建镜像
docker build -t bubble-brawl .

# 运行容器
docker run -it -p 3000:3000 bubble-brawl
```

---

## 🎯 游戏玩法 | How to Play

### 基础操作 | Basic Controls
- **移动** - 移动鼠标控制泡泡方向
- **加速** - 按住鼠标右键或空格键使用加速技能
- **喂食** - 按 W 键或点击喂食按钮释放能量点
- **聊天** - 在聊天框输入消息与其他玩家交流

### 游戏规则 | Game Rules
- 🎈 **成长机制** - 吃掉能量点和小泡泡来增大体积
- ⚡ **加速技能** - 消耗体积获得短暂加速，冷却时间 10 秒
- 🍬 **喂食机制** - 释放能量点给其他玩家或战略布局
- 🏆 **胜利条件** - 成为最大的泡泡，登上排行榜榜首

### 移动端操作 | Mobile Controls
- **虚拟摇杆** - 拖动摇杆控制移动方向
- **技能按钮** - 点击加速和喂食按钮使用技能
- **触控优化** - 专为移动设备优化的界面布局

---

## 🛠️ 技术架构 | Technical Architecture

### 前端技术栈 | Frontend Stack
- **HTML5 Canvas** - 游戏渲染引擎
- **Socket.IO Client** - 实时通信
- **Webpack** - 模块打包
- **Babel** - JavaScript 转译

### 后端技术栈 | Backend Stack
- **Node.js** - 服务器运行时
- **Express** - Web 框架
- **Socket.IO** - WebSocket 通信
- **SQLite** - 数据存储

### Web3 技术栈 | Web3 Stack
- **Hardhat** - 智能合约开发框架
- **OpenZeppelin** - 安全合约库
- **Ethers.js** - 区块链交互
- **RainbowKit** - 钱包连接组件

---

## 📁 项目结构 | Project Structure

```
bubble-brawl/
├── src/
│   ├── client/          # 前端代码
│   │   ├── js/         # JavaScript 文件
│   │   ├── css/        # 样式文件
│   │   ├── img/        # 图片资源
│   │   └── index.html  # 主页面
│   ├── server/         # 后端代码
│   │   ├── server.js   # 主服务器
│   │   ├── lib/        # 工具库
│   │   └── repositories/ # 数据访问层
│   └── contracts/      # 智能合约
│       ├── game/       # 游戏合约
│       ├── token/      # 代币合约
│       └── nft/        # NFT 合约
├── test/               # 测试文件
├── scripts/            # 部署脚本
├── doc/                # 项目文档
└── resource/           # 游戏资源
```

---

## 🎨 游戏资源 | Game Assets

### 泡泡皮肤 | Bubble Skins
- **基础系列** - 粉色、蓝色、绿色等基础颜色
- **主题系列** - 小猫、宇航员、甜品等可爱主题
- **特效系列** - 彩虹、星光、花瓣等特效边框
- **NFT 系列** - 独特的区块链收藏品皮肤

### UI 图标 | UI Icons
- **游戏模式** - 自由对战、团队对战等模式图标
- **技能按钮** - 加速、喂食等功能按钮
- **装饰元素** - 泡泡、星星等装饰图标

---

## 🔧 开发指南 | Development Guide

### 本地开发 | Local Development
```bash
# 监听文件变化，自动重启
npm run watch

# 运行测试
npm test

# 代码检查
npm run lint
```

### 构建部署 | Build & Deploy
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 智能合约开发 | Smart Contract Development
```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到测试网
npx hardhat run scripts/deploy.js --network monad-testnet
```

---

## 🌟 路线图 | Roadmap

### ✅ 已完成 | Completed
- [x] 基础游戏功能
- [x] 泡泡主题界面
- [x] 移动端适配
- [x] 中文本地化

### 🚧 开发中 | In Progress
- [ ] Web3 钱包集成
- [ ] NFT 皮肤系统
- [ ] 代币经济模型
- [ ] 多种游戏模式

### 📋 计划中 | Planned
- [ ] 排位赛系统
- [ ] 公会功能
- [ ] 成就系统
- [ ] 移动端 App

---

## 🤝 贡献指南 | Contributing

我们欢迎各种形式的贡献！请查看 [开发任务清单](doc/development-tasks.md) 了解当前的开发计划。

### 贡献方式 | How to Contribute
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范 | Development Standards
- 遵循 ESLint 代码规范
- 编写单元测试
- 更新相关文档
- 保持代码简洁可读

---

## 🐛 问题反馈 | Bug Reports

如果您发现了 bug 或有功能建议，请在 [Issues](https://github.com/liepin-labs/bubble-brawl/issues) 页面提交。

### 问题模板 | Issue Template
- **环境信息** - 操作系统、浏览器版本等
- **重现步骤** - 详细的操作步骤
- **期望行为** - 您期望发生什么
- **实际行为** - 实际发生了什么
- **截图** - 如果可能，请提供截图

---

## 📄 许可证 | License

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢 | Acknowledgments

- 感谢原始 Agar.io 克隆项目的开发者们
- 感谢所有贡献者和测试用户
- 特别感谢开源社区的支持

---

## 📞 联系我们 | Contact

- **项目主页** - [GitHub Repository](https://github.com/liepin-labs/bubble-brawl)
- **开发团队** - Liepin Labs
- **邮箱** - dev@liepin-labs.com

---

<div align="center">

**🫧 让我们一起在泡泡的世界里畅游吧！**

*Let's have fun in the bubble world together!*

Made with ❤️ by Liepin Labs

</div>
