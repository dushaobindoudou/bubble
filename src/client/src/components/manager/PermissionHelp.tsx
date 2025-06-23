import React, { useState } from 'react'
import { Button } from '../ui/Button'

export const PermissionHelp: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false)

  const roleDescriptions = [
    {
      contract: 'BubbleToken',
      roles: [
        {
          name: 'DEFAULT_ADMIN_ROLE',
          icon: '👑',
          description: '超级管理员角色',
          permissions: [
            '管理所有其他角色',
            '授予和撤销任何权限',
            '执行所有管理操作',
            '紧急暂停和恢复合约'
          ]
        },
        {
          name: 'ADMIN_ROLE',
          icon: '🛡️',
          description: '管理员角色',
          permissions: [
            '释放各种代币池',
            '管理代币分发',
            '执行大部分管理操作',
            '监控合约状态'
          ]
        },
        {
          name: 'GAME_REWARD_ROLE',
          icon: '🎮',
          description: '游戏奖励角色',
          permissions: [
            '铸造游戏奖励代币',
            '分发游戏收益',
            '管理玩家奖励',
            '处理游戏内交易'
          ]
        },
        {
          name: 'MINTER_ROLE',
          icon: '🪙',
          description: '铸造者角色',
          permissions: [
            '铸造新代币',
            '增加代币供应量',
            '执行铸造操作',
            '管理代币发行'
          ]
        }
      ]
    },
    {
      contract: 'BubbleSkinNFT',
      roles: [
        {
          name: 'DEFAULT_ADMIN_ROLE',
          icon: '👑',
          description: '超级管理员角色',
          permissions: [
            '管理所有其他角色',
            '授予和撤销任何权限',
            '执行所有管理操作',
            '紧急暂停和恢复合约'
          ]
        },
        {
          name: 'ADMIN_ROLE',
          icon: '🛡️',
          description: '管理员角色',
          permissions: [
            '管理NFT合约设置',
            '控制铸造参数',
            '执行管理操作',
            '监控合约状态'
          ]
        },
        {
          name: 'SKIN_MANAGER_ROLE',
          icon: '🎨',
          description: '皮肤管理员角色',
          permissions: [
            '创建皮肤模板',
            '更新皮肤属性',
            '管理皮肤稀有度',
            '设置皮肤状态'
          ]
        },
        {
          name: 'MINTER_ROLE',
          icon: '🖼️',
          description: 'NFT铸造者角色',
          permissions: [
            '铸造皮肤NFT',
            '批量铸造操作',
            '分发NFT给用户',
            '管理NFT供应'
          ]
        }
      ]
    }
  ]

  const securityTips = [
    {
      icon: '🔐',
      title: '权限安全',
      tips: [
        '只授予必要的最小权限',
        '定期审查权限分配',
        '避免授予过多的管理员权限',
        '使用多重签名保护重要权限'
      ]
    },
    {
      icon: '⚠️',
      title: '操作注意事项',
      tips: [
        '确认目标地址正确无误',
        '了解每个角色的具体权限',
        '权限操作不可逆，请谨慎操作',
        '保持钱包有足够的Gas费用'
      ]
    },
    {
      icon: '🌐',
      title: '网络要求',
      tips: [
        '确保连接到Monad测试网',
        '验证合约地址正确',
        '检查网络连接稳定',
        '使用官方RPC端点'
      ]
    }
  ]

  if (!showHelp) {
    return (
      <Button
        onClick={() => setShowHelp(true)}
        variant="ghost"
        className="fixed bottom-6 right-6 p-3 rounded-full"
      >
        <div className="text-xl">❓</div>
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">📚 权限管理帮助</h2>
          <Button onClick={() => setShowHelp(false)} variant="ghost">
            ✕
          </Button>
        </div>

        <div className="space-y-8">
          {/* Role Descriptions */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">🎭 角色说明</h3>
            <div className="space-y-6">
              {roleDescriptions.map((contract) => (
                <div key={contract.contract} className="bg-white/5 rounded-2xl p-4">
                  <h4 className="text-lg font-medium text-white mb-3">
                    {contract.contract === 'BubbleToken' ? '🪙 代币合约角色' : '🎨 NFT合约角色'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.roles.map((role) => (
                      <div key={role.name} className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{role.icon}</span>
                          <span className="font-medium text-white">{role.name}</span>
                        </div>
                        <div className="text-white/70 text-sm mb-2">{role.description}</div>
                        <div className="space-y-1">
                          {role.permissions.map((permission, index) => (
                            <div key={index} className="text-white/60 text-xs flex items-center gap-1">
                              <span className="text-green-400">•</span>
                              {permission}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Tips */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">🛡️ 安全提示</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {securityTips.map((section) => (
                <div key={section.title} className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium text-white">{section.title}</span>
                  </div>
                  <div className="space-y-2">
                    {section.tips.map((tip, index) => (
                      <div key={index} className="text-white/70 text-sm flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guide */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">🚀 快速指南</h3>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3">授予权限步骤：</h4>
                  <div className="space-y-2 text-white/70 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                      选择合约类型（代币或NFT）
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                      输入目标地址
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                      选择要授予的角色
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                      确认交易并支付Gas费用
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-3">常见问题解决：</h4>
                  <div className="space-y-2 text-white/70 text-sm">
                    <div>
                      <span className="text-yellow-400">Q:</span> 无法授予权限？
                    </div>
                    <div className="ml-4">
                      <span className="text-green-400">A:</span> 检查您是否有管理员权限
                    </div>
                    <div>
                      <span className="text-yellow-400">Q:</span> 交易失败？
                    </div>
                    <div className="ml-4">
                      <span className="text-green-400">A:</span> 确认网络连接和Gas费用
                    </div>
                    <div>
                      <span className="text-yellow-400">Q:</span> 地址无效？
                    </div>
                    <div className="ml-4">
                      <span className="text-green-400">A:</span> 检查地址格式是否正确
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Addresses */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">📋 合约信息</h3>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-white mb-2">🪙 BubbleToken</div>
                  <div className="text-white/70 text-sm font-mono break-all">
                    0xd323f3339396Cf6C1E31b8Ede701B34360eC4730
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white mb-2">🎨 BubbleSkinNFT</div>
                  <div className="text-white/70 text-sm font-mono break-all">
                    0x6Cde3abE9ACC5028330bd301415e59877D0A5Bdd
                  </div>
                </div>
              </div>
              <div className="mt-4 text-white/60 text-sm">
                网络: Monad Testnet (Chain ID: 10143)
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => setShowHelp(false)} variant="primary">
            我知道了
          </Button>
        </div>
      </div>
    </div>
  )
}
