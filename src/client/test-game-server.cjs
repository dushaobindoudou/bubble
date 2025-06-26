/**
 * PopFi Test Game Server
 * 简单的Socket.IO测试服务器
 */

const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = createServer(app)

// 配置CORS - 支持任意域名
app.use(cors({
  origin: function(origin, callback) {
    // 允许所有域名，包括移动应用和本地开发
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}))

// 添加额外的CORS头部
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 创建Socket.IO服务器 - 支持任意域名
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // 允许所有域名连接
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true
})

// 游戏状态
const gameState = {
  players: new Map(),
  foods: [],
  viruses: [],
  leaderboard: []
}

// 生成随机食物
function generateFood() {
  return {
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * 2000,
    y: Math.random() * 2000,
    radius: 5 + Math.random() * 5,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`
  }
}

// 初始化食物
for (let i = 0; i < 100; i++) {
  gameState.foods.push(generateFood())
}

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`🎮 玩家连接: ${socket.id}`)
  
  // 获取连接参数
  const { type, playerName } = socket.handshake.query
  console.log(`📝 玩家信息: ${playerName} (${type})`)

  // 发送游戏设置
  socket.emit('gameSetup', {
    gameWidth: 2000,
    gameHeight: 2000
  })

  // 处理玩家重生
  socket.on('respawn', () => {
    console.log(`🔄 玩家重生: ${playerName}`)
    
    const player = {
      id: socket.id,
      name: playerName || 'Anonymous',
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      radius: 20,
      mass: 20,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      cells: [{
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        radius: 20,
        playerId: socket.id
      }]
    }
    
    gameState.players.set(socket.id, player)
    updateLeaderboard()
    
    // 发送初始游戏状态
    socket.emit('gameState', {
      players: Array.from(gameState.players.values()),
      foods: gameState.foods,
      viruses: gameState.viruses
    })
  })

  // 处理玩家移动
  socket.on('0', (target) => {
    const player = gameState.players.get(socket.id)
    if (player) {
      // 简单的移动逻辑
      player.x += target.x * 0.01
      player.y += target.y * 0.01
      
      // 边界检查
      player.x = Math.max(0, Math.min(2000, player.x))
      player.y = Math.max(0, Math.min(2000, player.y))
      
      // 更新细胞位置
      if (player.cells && player.cells.length > 0) {
        player.cells[0].x = player.x
        player.cells[0].y = player.y
      }
    }
  })

  // 处理玩家分裂
  socket.on('1', () => {
    console.log(`💥 玩家分裂: ${playerName}`)
    // 简单的分裂逻辑
    const player = gameState.players.get(socket.id)
    if (player && player.mass > 40) {
      player.mass -= 20
      // 这里可以添加分裂逻辑
    }
  })

  // 处理玩家喷射
  socket.on('2', () => {
    console.log(`🎯 玩家喷射: ${playerName}`)
    // 简单的喷射逻辑
    const player = gameState.players.get(socket.id)
    if (player && player.mass > 25) {
      player.mass -= 5
      // 生成新食物
      gameState.foods.push(generateFood())
    }
  })

  // 处理聊天消息
  socket.on('chat', (data) => {
    console.log(`💬 聊天消息: ${playerName}: ${data.message || data}`)
    
    // 广播聊天消息
    io.emit('chat', {
      playerName: playerName || 'Anonymous',
      message: data.message || data,
      timestamp: Date.now()
    })
  })

  // 处理断开连接
  socket.on('disconnect', () => {
    console.log(`👋 玩家断开: ${playerName}`)
    gameState.players.delete(socket.id)
    updateLeaderboard()
  })
})

// 更新排行榜
function updateLeaderboard() {
  const players = Array.from(gameState.players.values())
  gameState.leaderboard = players
    .sort((a, b) => b.mass - a.mass)
    .slice(0, 10)
    .map(player => ({
      name: player.name,
      mass: player.mass
    }))
  
  // 广播排行榜
  io.emit('leaderboard', gameState.leaderboard)
}

// 游戏循环
setInterval(() => {
  // 发送游戏状态更新
  if (gameState.players.size > 0) {
    io.emit('gameUpdate', {
      players: Array.from(gameState.players.values()),
      foods: gameState.foods.slice(0, 50), // 只发送部分食物以减少数据量
      timestamp: Date.now()
    })
  }
}, 100) // 10 FPS

// 启动服务器
const PORT = 3002
server.listen(PORT, () => {
  console.log(`🚀 PopFi 测试游戏服务器启动成功!`)
  console.log(`📍 服务器地址: http://localhost:${PORT}`)
  console.log(`🔌 Socket.IO 端点: http://localhost:${PORT}/socket.io/`)
  console.log(`🎮 等待玩家连接...`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...')
  server.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})
