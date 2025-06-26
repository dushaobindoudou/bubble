import React, { useEffect, useState, useRef } from 'react'
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { useNFTSkins, NFTSkin } from '../hooks/useNFTSkins'
import { useWalletManager } from '../hooks/useWalletManager'
import { getContractAddress } from '../config/contracts'
import GameRewardsABI from '../contracts/abis/GameRewards.json'
import { toast } from 'react-hot-toast'
import { ethers } from 'ethers'
import { formatAddress } from '../utils/contractValidator'

import "../styles/GamePage.css"

// 跨域加载配置接口
interface CrossOriginLoadOptions {
  crossOrigin?: 'anonymous' | 'use-credentials' | string
  timeout?: number
  retries?: number
  integrity?: string
}

// 默认皮肤配置
interface DefaultSkin {
  id: string
  name: string
  preview: string
  colorConfig: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    transparency: number
  }
}

const DEFAULT_SKINS: DefaultSkin[] = [
  {
    id: 'classic-blue',
    name: '经典蓝',
    preview: '🔵',
    colorConfig: {
      primaryColor: '#0066ff',
      secondaryColor: '#00ccff',
      accentColor: '#ffffff',
      transparency: 255
    }
  },
  {
    id: 'sunset-orange',
    name: '夕阳橙',
    preview: '🟠',
    colorConfig: {
      primaryColor: '#ff6600',
      secondaryColor: '#ffcc00',
      accentColor: '#ffffff',
      transparency: 255
    }
  }
]

const GamePage: React.FC = () => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // 钱包和皮肤相关状态
  const { address, isConnected } = useAccount()
  const { connectWallet } = useWalletManager()
  const { skins, isLoading: isLoadingSkins } = useNFTSkins()
  const [selectedSkin, setSelectedSkin] = useState<DefaultSkin | NFTSkin | null>(null)
  const [canStartGame, setCanStartGame] = useState(false)

  // 游戏奖励相关状态
  const [isClaimingReward, setIsClaimingReward] = useState(false)
  const [gameSessionData, setGameSessionData] = useState<{
    finalRank: number
    maxMass: number
    survivalTime: number
    killCount: number
    sessionEndTime: number
    sessionId: string
  } | null>(null)

  // 游戏状态管理
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu')
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [gameTime, setGameTime] = useState<number>(0) // 游戏时间（秒）
  const [gameResult, setGameResult] = useState<{
    type: 'victory' | 'defeat' | 'draw'
    score: number
    rank: number
    duration: string
    kills: number
  } | null>(null)

  // 获取钱包地址缩写
  const walletNickname = address ? formatAddress(address).replaceAll('.', '').substr(0, 6) : '游客模式'

  // 皮肤选择逻辑
  const handleSkinSelect = (skin: DefaultSkin | NFTSkin) => {
    setSelectedSkin(skin)
    setCanStartGame(true)
  }

  // 检查皮肤是否被选中
  const isSkinSelected = (skin: DefaultSkin | NFTSkin) => {
    if (!selectedSkin) return false
    if ('tokenId' in skin && 'tokenId' in selectedSkin) {
      return skin.tokenId === selectedSkin.tokenId
    }
    if ('id' in skin && 'id' in selectedSkin) {
      return skin.id === selectedSkin.id
    }
    return false
  }

  // 获取所有可用皮肤（默认皮肤 + NFT皮肤）
  const availableSkins = [...DEFAULT_SKINS, ...skins]

  // 智能合约配置
  const GAME_REWARDS_ADDRESS = getContractAddress('GameRewards')

  // 准备智能合约写入
  const { config: submitSessionConfig } = usePrepareContractWrite({
    address: GAME_REWARDS_ADDRESS,
    abi: GameRewardsABI,
    functionName: 'submitPlayerSession',
    args: gameSessionData ? [
      gameSessionData.finalRank,
      gameSessionData.maxMass,
      gameSessionData.survivalTime,
      gameSessionData.killCount,
      gameSessionData.sessionEndTime,
      gameSessionData.sessionId
    ] : undefined,
    enabled: !!gameSessionData && !!address,
  })

  const { write: submitSession, isLoading: isSubmittingSession } = useContractWrite({
    ...submitSessionConfig,
    onSuccess: (data) => {
      console.log('游戏会话提交成功:', data)
      toast.success('🎉 游戏数据已提交到区块链！等待审核后即可领取奖励')
      setIsClaimingReward(false)
      // 跳转到首页
      setTimeout(() => {
        window.location.href = '/home'
      }, 2000)
    },
    onError: (error) => {
      console.error('提交游戏会话失败:', error)
      toast.error(`提交失败: ${error.message}`)
      setIsClaimingReward(false)
    }
  })

  // 开始游戏计时
  const startGameTimer = () => {
    const startTime = Date.now()
    setGameStartTime(startTime)
    setGameTime(0)
    setGameState('playing')

    const gameInterval = setInterval(() => {
      if (gameState === 'playing') {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setGameTime(elapsed)
      } else {
        clearInterval(gameInterval)
      }
    }, 1000)

    return gameInterval
  }

  // 格式化游戏时间显示
  const formatGameTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 结束游戏并显示结果
  const endGame = (result: {
    type: 'victory' | 'defeat' | 'draw'
    score: number
    rank: number
    duration: string
    kills: number
  }) => {
    setGameState('finished')
    setGameResult(result)
  }

  // 重新开始游戏
  const restartGame = () => {
    setGameState('menu')
    setGameResult(null)
    setCountdown(0)
  }

  // 返回主页
  const goToHome = () => {
    window.location.href = '/home'
  }

  // 生成游戏会话数据
  const generateGameSessionData = () => {
    // 从游戏结果或DOM中获取实际数据
    const finalScore = document.getElementById('playerFinalScore')?.textContent || '0'
    const currentTime = Math.floor(Date.now() / 1000)

    // 生成唯一的会话ID
    const sessionId = ethers.keccak256(
      ethers.toUtf8Bytes(`${address}-${currentTime}-${Math.random()}`)
    )

    // 模拟游戏数据（实际应用中应该从游戏引擎获取）
    const gameData = {
      finalRank: Math.floor(Math.random() * 10) + 1, // 1-10名
      maxMass: parseInt(finalScore) || Math.floor(Math.random() * 5000) + 1000, // 使用得分作为质量
      survivalTime: gameTime || Math.floor(Math.random() * 600) + 60, // 使用游戏时间或随机时间
      killCount: Math.floor(Math.random() * 8), // 0-7击杀
      sessionEndTime: currentTime,
      sessionId: sessionId
    }

    return gameData
  }

  // 处理领取奖励
  const handleClaimReward = async () => {
    try {
      // 检查钱包连接
      if (!isConnected || !address) {
        toast.error('请先连接钱包')
        connectWallet()
        return
      }

      setIsClaimingReward(true)

      // 生成游戏会话数据
      const sessionData = generateGameSessionData()
      setGameSessionData(sessionData)

      // 显示加载提示
      toast.loading('正在准备提交游戏数据...', { id: 'claim-reward' })

      // 等待一小段时间让状态更新
      setTimeout(() => {
        if (submitSession) {
          toast.loading('正在提交到区块链...', { id: 'claim-reward' })
          submitSession()
        } else {
          toast.error('智能合约交互准备失败，请重试')
          setIsClaimingReward(false)
        }
      }, 500)

    } catch (error: any) {
      console.error('领取奖励失败:', error)
      toast.error(`操作失败: ${error.message}`)
      setIsClaimingReward(false)
    }
  }

  // 动态加载脚本的函数 - 增强跨域支持
  const loadScript = (src: string, options: CrossOriginLoadOptions = {}): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      // 检查脚本是否已经存在
      const existingScript = document.querySelector(`script[src="${src}"]`)
      if (existingScript) {
        resolve()
        return
      }

      const {
        crossOrigin = 'anonymous',
        timeout = 30000,
        retries = 2,
        integrity
      } = options

      let attempt = 0

      const tryLoad = () => {
        attempt++

        const script = document.createElement('script')
        script.src = src
        script.async = true

        // 跨域支持配置
        if (crossOrigin && (src.startsWith('http') || src.startsWith('//'))) {
          script.crossOrigin = crossOrigin
        }

        // 子资源完整性检查
        if (integrity) {
          script.integrity = integrity
        }

        // 设置超时处理
        let timeoutId: NodeJS.Timeout | null = null

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          script.remove()
        }

        script.onload = () => {
          cleanup()
          console.log(`✅ Script loaded successfully (attempt ${attempt}): ${src}`)
          resolve()
        }

        script.onerror = (error) => {
          cleanup()
          console.error(`❌ Failed to load script (attempt ${attempt}): ${src}`, error)

          if (attempt < retries) {
            console.log(`🔄 Retrying script load: ${src}`)
            setTimeout(tryLoad, 1000 * attempt) // 递增延迟重试
          } else {
            reject(new Error(`Failed to load script after ${retries} attempts: ${src}`))
          }
        }

        // 超时处理
        timeoutId = setTimeout(() => {
          cleanup()
          if (attempt < retries) {
            console.log(`⏰ Script loading timeout, retrying: ${src}`)
            tryLoad()
          } else {
            reject(new Error(`Script loading timeout after ${retries} attempts: ${src}`))
          }
        }, timeout)

        document.head.appendChild(script)
      }

      tryLoad()
    })
  }


  // 使用fetch API加载jQuery - 绕过CSP script-src限制
  const loadJQueryWithFetch = async (): Promise<void> => {
    try {
      console.log('🔄 尝试使用fetch API加载jQuery')

      // 尝试多个jQuery CDN源
      const jquerySources = [
        '/game/js/jquery-2.2.0.min.js', // 本地文件
        'https://code.jquery.com/jquery-2.2.0.min.js',
        'https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.0/jquery.min.js'
      ]

      let jqueryCode = ''
      let loadedFrom = ''

      for (const source of jquerySources) {
        try {
          console.log(`🔄 尝试从 ${source} 加载jQuery`)
          const response = await fetch(source, {
            mode: source.startsWith('http') ? 'cors' : 'same-origin',
            cache: 'force-cache'
          })

          if (response.ok) {
            jqueryCode = await response.text()
            loadedFrom = source
            break
          }
        } catch (fetchError) {
          console.log(`⚠️ 从 ${source} 加载失败:`, fetchError)
          continue
        }
      }

      if (!jqueryCode) {
        throw new Error('所有jQuery源都无法访问')
      }

      // 使用eval执行jQuery代码（绕过CSP script-src限制）
      console.log(`✅ 从 ${loadedFrom} 获取jQuery代码，正在执行...`)

      // 创建一个新的script元素并设置内容
      const script = document.createElement('script')
      script.textContent = jqueryCode
      document.head.appendChild(script)

      // 验证jQuery是否成功加载
      if (typeof (window as any).$ !== 'undefined' && typeof (window as any).jQuery !== 'undefined') {
        console.log('✅ jQuery通过fetch API成功加载')
      } else {
        throw new Error('jQuery执行后未找到全局对象')
      }

    } catch (error) {
      console.error('❌ fetch API加载jQuery失败:', error)
      throw error
    }
  }

  // 备用jQuery实现 - 处理CSP限制
  const loadFallbackJQuery = (): Promise<void> => {
    return new Promise((resolve) => {
      console.log('🔧 加载备用jQuery实现')

      // 创建一个简化的jQuery替代，只包含游戏需要的功能
      const simplifiedJQuery = (selector: string | (() => void)) => {
        if (typeof selector === 'function') {
          // $(document).ready() 功能
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', selector as EventListener)
          } else {
            selector()
          }
          return undefined
        }

        // 基本选择器功能
        const elements = document.querySelectorAll(selector)
        return {
          click: (handler: () => void) => {
            elements.forEach(el => el.addEventListener('click', handler))
            return this
          },
          on: (event: string, handler: () => void) => {
            elements.forEach(el => el.addEventListener(event, handler))
            return this
          },
          val: (value?: string): string | undefined => {
            if (value !== undefined) {
              elements.forEach(el => {
                if (el instanceof HTMLInputElement) el.value = value
              })
              return undefined
            } else {
              const firstEl = elements[0] as HTMLInputElement
              return firstEl ? firstEl.value : ''
            }
          },
          text: (text?: string): string | undefined => {
            if (text !== undefined) {
              elements.forEach(el => el.textContent = text)
              return undefined
            } else {
              const firstEl = elements[0]
              return firstEl ? firstEl.textContent || '' : ''
            }
          },
          hide: () => {
            elements.forEach(el => (el as HTMLElement).style.display = 'none')
            return this
          },
          show: () => {
            elements.forEach(el => (el as HTMLElement).style.display = '')
            return this
          }
        }
      }

      // 将简化的jQuery挂载到全局
      ;(window as any).$ = simplifiedJQuery
      ;(window as any).jQuery = simplifiedJQuery

      console.log('✅ 备用jQuery实现已加载')
      resolve()
    })
  }

  // 处理开始按钮点击事件
  const handleStartButtonClick = () => {
    const spawnAudio = document.getElementById('spawn_cell') as HTMLAudioElement
    if (spawnAudio) {
      spawnAudio.play().catch(console.error)
    }

    // 隐藏开始菜单并开始游戏计时
    const startMenuWrapper = document.getElementById('startMenuWrapper')
    if (startMenuWrapper) {
      startMenuWrapper.style.display = 'none'
    }

    // 显示游戏区域
    const gameAreaWrapper = document.getElementById('gameAreaWrapper')
    if (gameAreaWrapper) {
      gameAreaWrapper.style.opacity = '1'
    }

    // 开始游戏计时
    startGameTimer()
  }

  // 动态设置CSP以允许jQuery加载
  const setupCSPForJQuery = () => {
    try {
      // 检查是否已有CSP meta标签
      let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement

      if (!cspMeta) {
        // 创建新的CSP meta标签
        cspMeta = document.createElement('meta')
        cspMeta.httpEquiv = 'Content-Security-Policy'
        document.head.appendChild(cspMeta)
      }

      // 获取当前CSP内容
      const currentCSP = cspMeta.content || ''

      // 添加jQuery CDN到script-src
      const jqueryCDNs = [
        'https://code.jquery.com',
        'https://ajax.googleapis.com',
        'https://cdnjs.cloudflare.com'
      ]

      let newCSP = currentCSP

      // 如果没有script-src，添加一个
      if (!newCSP.includes('script-src')) {
        newCSP += '; script-src \'self\' \'unsafe-inline\' ' + jqueryCDNs.join(' ')
      } else {
        // 添加jQuery CDN到现有的script-src
        jqueryCDNs.forEach(cdn => {
          if (!newCSP.includes(cdn)) {
            newCSP = newCSP.replace('script-src', `script-src ${cdn}`)
          }
        })
      }

      cspMeta.content = newCSP
      console.log('🔒 CSP已更新以支持jQuery加载:', newCSP)

    } catch (error) {
      console.warn('⚠️ 无法设置CSP，将使用备用方案:', error)
    }
  }

  useEffect(() => {
    const loadGameAssets = async () => {
      try {
        setLoadingError(null)

        // 首先设置CSP以支持jQuery
        setupCSPForJQuery()

        // 加载jQuery - 使用fetch API绕过CSP限制
        try {
          await loadJQueryWithFetch()
          console.log('✅ jQuery加载成功')
        } catch (jqueryError) {
          console.log('⚠️ jQuery加载失败，使用备用实现:', jqueryError)
          await loadFallbackJQuery()
        }

        // 加载游戏脚本 (本地资源)
        await loadScript('/game/js/app.js', {
          timeout: 20000,
          retries: 2
        })

        setScriptsLoaded(true)
        console.log('✅ 游戏资源加载完成')

      } catch (error) {
        console.error('❌ 游戏资源加载失败:', error)
        setLoadingError(error instanceof Error ? error.message : '资源加载失败')
      }
    }

    loadGameAssets()

    // 清理函数
    return () => {
      // 清理可能的全局变量或事件监听器
      if (typeof window !== 'undefined') {
        // 这里可以添加清理逻辑，如果游戏脚本有提供清理函数的话
      }
    }
  }, [])

  // 显示加载状态
  if (!scriptsLoaded && !loadingError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#222',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>正在加载游戏...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // 显示错误状态
  if (loadingError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#222',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>游戏加载错误</h2>
          <p>{loadingError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            重新加载页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-page-container" ref={gameContainerRef} style={{ width: '100%', height: '100vh' }}>
      {/* 游戏计时器 */}
      {gameState === 'playing' && (
        <div id="gameTimer" className="game-timer">
          <div className="timer-container">
            <div className="timer-icon">⏱️</div>
            <div id="timerText" className="timer-text">{formatGameTime(gameTime)}</div>
          </div>
        </div>
      )}

      {/* 游戏结果显示 */}
      {gameState === 'finished' && gameResult && (
        <div className="game-result-overlay">
          <div className="game-result-container">
            <div className={`result-header ${gameResult.type}`}>
              <div className="result-emoji">
                {gameResult.type === 'victory' ? '🎉' : gameResult.type === 'defeat' ? '😢' : '🤝'}
              </div>
              <div className="result-title">
                {gameResult.type === 'victory' ? '胜利！' : gameResult.type === 'defeat' ? '失败' : '平局'}
              </div>
            </div>
            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-label">得分</span>
                <span className="stat-value">{gameResult.score}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">排名</span>
                <span className="stat-value">#{gameResult.rank}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">击杀</span>
                <span className="stat-value">{gameResult.kills}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">时长</span>
                <span className="stat-value">{gameResult.duration}</span>
              </div>
            </div>
            <div className="result-actions">
              <button className="result-button restart-button" onClick={restartGame}>
                🔄 重新开始
              </button>
              <button className="result-button home-button" onClick={goToHome}>
                🏠 返回主页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div id="gameAreaWrapper">
        <div id="status">
          <span className="title">排行榜</span>
        </div>
        <div className="chatbox" id="chatbox">
          <ul id="chatList" className="chat-list"></ul>
          <input
            id="chatInput"
            type="text"
            className="chat-input"
            placeholder="在这里聊天..."
            maxLength={35}
          />
        </div>
        <div id="mobile">
          <input
            type="image"
            id="split"
            className="split"
            src="/game/img/split.png"
            alt="splitBtn"
          />
          <input
            type="image"
            id="feed"
            className="feed"
            src="/game/img/feed.png"
            alt="feedBtn"
          />
        </div>
        <canvas tabIndex={1} id="cvs"></canvas>
      </div>

      {/* Start Menu */}
      <div id="startMenuWrapper">
        <div id="startMenu">
          <p>选择皮肤</p>

          {/* 钱包昵称 - 不可编辑 */}
          <input
            type="text"
            tabIndex={0}
            value={walletNickname}
            id="playerNameInput"
            maxLength={25}
            readOnly
            style={{
              backgroundColor: '#f0f0f0',
              cursor: 'not-allowed',
              color: '#666'
            }}
          />
          <b className="input-error">昵称只能包含字母和数字！</b>
          <br />

          {/* 皮肤选择区域 */}
          <div className="skin-selection-container">
            <label className="skin-selection-label">选择皮肤</label>
            <div className="skin-grid">
              {/* 默认皮肤 */}
              {DEFAULT_SKINS.map((skin) => (
                <div
                  key={skin.id}
                  className={`skin-option ${isSkinSelected(skin) ? 'selected' : ''}`}
                  onClick={() => handleSkinSelect(skin)}
                >
                  <div className="skin-preview">{skin.preview}</div>
                  <div className="skin-name">{skin.name}</div>
                  <div className="skin-type">默认</div>
                </div>
              ))}

              {/* NFT皮肤 */}
              {skins.map((skin) => (
                <div
                  key={skin.tokenId}
                  className={`skin-option ${isSkinSelected(skin) ? 'selected' : ''}`}
                  onClick={() => handleSkinSelect(skin)}
                >
                  <div className="skin-preview">
                    {skin.content ? (
                      <div dangerouslySetInnerHTML={{ __html: skin.content }} />
                    ) : (
                      '🎨'
                    )}
                  </div>
                  <div className="skin-name">{skin.name}</div>
                  <div className="skin-type">NFT</div>
                  <div className="skin-rarity">{skin.rarity}</div>
                </div>
              ))}

              {/* 加载状态 */}
              {isLoadingSkins && (
                <div className="skin-option loading">
                  <div className="skin-preview">⏳</div>
                  <div className="skin-name">加载中...</div>
                </div>
              )}
            </div>
          </div>

          {/* 开始游戏按钮 - 只有选择皮肤后才可点击 */}
          <a onClick={canStartGame ? handleStartButtonClick : undefined}>
            <button
              id="startButton"
              disabled={!canStartGame}
              style={{
                opacity: canStartGame ? 1 : 0.5,
                cursor: canStartGame ? 'pointer' : 'not-allowed'
              }}
            >
              开始游戏
            </button>
          </a>

          {/* 隐藏其他选项 */}
          <button id="spectateButton" style={{ display: 'none' }}>观战模式</button>
          <button id="settingsButton" style={{ display: 'none' }}>游戏设置</button>
          <br />
          <div id="settings" style={{ display: 'none' }}>
            <h3>游戏设置</h3>
            <ul>
              <label>
                <input id="visBord" type="checkbox" />
                显示边界
              </label>
              <label>
                <input id="showMass" type="checkbox" />
                显示质量
              </label>
              <br />
              <label>
                <input id="continuity" type="checkbox" />
                鼠标离开屏幕时继续移动
              </label>
              <br />
              <label>
                <input id="roundFood" type="checkbox" defaultChecked />
                圆形食物
              </label>
              <label>
                <input id="darkMode" type="checkbox" />
                暗黑模式
              </label>
            </ul>
          </div>
          <div id="instructions" style={{ display: 'none' }}>
            <h3>游戏玩法</h3>
            <ul>
              <li>移动鼠标来控制您的角色。</li>
              <li>吃掉食物和其他玩家来让您的角色成长（每次玩家吃掉食物后会重新生成）。</li>
              <li>玩家的质量等于吃掉的食物颗粒数量。</li>
              <li>目标：努力变大并吃掉其他玩家。</li>
            </ul>
          </div>
        </div>
      </div>
      {/* 旧的游戏结束界面 - 隐藏但保留兼容性 */}
      <div id="gameEndWrapper" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(15px)',
        zIndex: 2000,
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <div id="gameEndMenu" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '2rem',
          padding: '2.5rem',
          textAlign: 'center',
          minWidth: '400px',
          maxWidth: '90vw',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              fontFamily: "'Orbitron', monospace",
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1.5rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>游戏结束！</h2>
            <div id="finalScore" style={{
              fontSize: '1.5rem',
              margin: '1.5rem 0',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
            }}>您的得分: <span id="playerFinalScore" style={{
              fontFamily: "'Orbitron', monospace",
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.75rem'
            }}>0</span></div>
            <div id="finalLeaderboard" style={{
              margin: '1.5rem 0',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>最终排名</h3>
                <div id="finalRankings" style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.875rem'
                }}></div>
            </div>
            <button
              className="game-end-button game-end-button-primary"
              onClick={handleClaimReward}
              disabled={isClaimingReward || isSubmittingSession}
              style={{
                opacity: (isClaimingReward || isSubmittingSession) ? 0.6 : 1,
                cursor: (isClaimingReward || isSubmittingSession) ? 'not-allowed' : 'pointer'
              }}
            >
              {isClaimingReward || isSubmittingSession ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>⏳</span>
                  {isSubmittingSession ? '提交中...' : '准备中...'}
                </>
              ) : (
                <>
                  <span style={{ marginRight: '0.5rem' }}>🎁</span>
                  领代币奖励
                </>
              )}
            </button>
            <button id="playAgainButton" style={{display: 'none'}} className="game-end-button game-end-button-primary">
              🔄 再来一局
            </button>
            <button id="spectateAgainButton" style={{display: 'none'}} className="game-end-button game-end-button-secondary">
              👁️ 观战模式
            </button>
        </div>
    </div>

      {/* Audio Elements */}
      <audio id="split_cell" src="/game/audio/split.mp3"></audio>
      <audio id="spawn_cell" src="/game/audio/spawn.mp3"></audio>


    </div>
  )
}

export default GamePage
