import React, { useState } from 'react'
import { useAdminAccess, ROLES, AdminRole } from '../../hooks/useAdminAccess'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { toast } from 'react-hot-toast'

export const AccessControlManager: React.FC = () => {
  const { isAdmin, isLoading } = useAdminAccess()
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  
  const [grantForm, setGrantForm] = useState({
    address: '',
    role: 'GAME_ADMIN_ROLE' as AdminRole,
  })
  
  const [revokeForm, setRevokeForm] = useState({
    address: '',
    role: 'GAME_ADMIN_ROLE' as AdminRole,
  })

  const roleDescriptions = {
    DEFAULT_ADMIN_ROLE: {
      name: '超级管理员',
      description: '拥有所有权限，可以管理其他管理员角色',
      icon: '👑',
      color: 'from-yellow-500 to-orange-500',
      permissions: ['管理所有合约', '分配角色权限', '系统配置', '紧急操作']
    },
    GAME_ADMIN_ROLE: {
      name: '游戏管理员',
      description: '管理游戏奖励系统和游戏相关功能',
      icon: '🏆',
      color: 'from-green-500 to-teal-500',
      permissions: ['验证游戏会话', '设置奖励参数', '查看游戏统计', '管理排行榜']
    },
    TOKEN_ADMIN_ROLE: {
      name: '代币管理员',
      description: '管理 BUB 代币的铸造和分发',
      icon: '🪙',
      color: 'from-blue-500 to-cyan-500',
      permissions: ['铸造代币', '销毁代币', '批量分发', '查看代币统计']
    },
    NFT_ADMIN_ROLE: {
      name: 'NFT管理员',
      description: '管理皮肤 NFT 的创建和铸造',
      icon: '🎨',
      color: 'from-purple-500 to-pink-500',
      permissions: ['创建皮肤模板', '铸造 NFT', '管理皮肤属性', '设置稀有度']
    },
  }

  const handleGrantRole = async () => {
    try {
      // This would need to be implemented with actual contract write
      toast.success(`成功授予 ${roleDescriptions[grantForm.role].name} 权限`)
      setShowGrantModal(false)
      setGrantForm({ address: '', role: 'GAME_ADMIN_ROLE' })
    } catch (err) {
      toast.error('授权失败，请重试')
    }
  }

  const handleRevokeRole = async () => {
    try {
      // This would need to be implemented with actual contract write
      toast.success(`成功撤销 ${roleDescriptions[revokeForm.role].name} 权限`)
      setShowRevokeModal(false)
      setRevokeForm({ address: '', role: 'GAME_ADMIN_ROLE' })
    } catch (err) {
      toast.error('撤销失败，请重试')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <div className="text-white/70">您没有权限访问此功能</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🔐 权限管理</h2>
          <p className="text-white/70">管理用户角色和访问权限</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowGrantModal(true)} variant="primary">
            ➕ 授予权限
          </Button>
          <Button onClick={() => setShowRevokeModal(true)} variant="ghost">
            ➖ 撤销权限
          </Button>
        </div>
      </div>

      {/* Role Overview */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">👥 角色概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(roleDescriptions).map(([roleKey, role]) => (
            <div
              key={roleKey}
              className={`p-6 rounded-2xl bg-gradient-to-br ${role.color} bg-opacity-20 border border-white/20`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{role.icon}</div>
                <div>
                  <div className="text-white font-semibold text-lg">{role.name}</div>
                  <div className="text-white/70 text-sm">{role.description}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-white/80 text-sm font-medium">权限范围:</div>
                <div className="space-y-1">
                  {role.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 text-white/70 text-sm">
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">⚡ 快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => setShowGrantModal(true)}
            variant="primary"
            className="p-6 h-auto flex-col gap-2"
          >
            <div className="text-2xl">➕</div>
            <div className="font-semibold">授予权限</div>
            <div className="text-sm opacity-80">为用户分配管理员角色</div>
          </Button>
          
          <Button
            onClick={() => setShowRevokeModal(true)}
            variant="ghost"
            className="p-6 h-auto flex-col gap-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
          >
            <div className="text-2xl">➖</div>
            <div className="font-semibold">撤销权限</div>
            <div className="text-sm opacity-80">移除用户的管理员角色</div>
          </Button>
          
          <Button
            variant="ghost"
            className="p-6 h-auto flex-col gap-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            disabled
          >
            <div className="text-2xl">📊</div>
            <div className="font-semibold">权限审计</div>
            <div className="text-sm opacity-80">查看权限变更历史</div>
          </Button>
        </div>
      </div>

      {/* Security Guidelines */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🛡️ 安全指南</h3>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
            <div className="text-yellow-300 font-medium mb-2">⚠️ 重要提醒</div>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• 仅向可信任的用户授予管理员权限</li>
              <li>• 定期审查和更新权限分配</li>
              <li>• 超级管理员权限应该严格控制</li>
              <li>• 所有权限变更都会被记录在区块链上</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <div className="text-blue-300 font-medium mb-2">💡 最佳实践</div>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• 使用最小权限原则，只授予必要的权限</li>
              <li>• 为不同功能设置专门的管理员角色</li>
              <li>• 定期轮换管理员账户</li>
              <li>• 保持管理员账户的安全性</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grant Role Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">➕ 授予权限</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">用户地址</label>
                <input
                  type="text"
                  value={grantForm.address}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">角色类型</label>
                <select
                  value={grantForm.role}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, role: e.target.value as AdminRole }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                    <option key={roleKey} value={roleKey} className="bg-gray-800">
                      {role.icon} {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-white/80 text-sm font-medium mb-2">
                  将授予的权限:
                </div>
                <div className="space-y-1">
                  {roleDescriptions[grantForm.role].permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 text-white/70 text-sm">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowGrantModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleGrantRole}
                variant="primary"
                className="flex-1"
                disabled={!grantForm.address}
              >
                确认授予
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Role Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">➖ 撤销权限</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                <div className="text-red-300 text-sm">
                  ⚠️ 警告：撤销权限后，用户将无法访问相关管理功能。
                </div>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">用户地址</label>
                <input
                  type="text"
                  value={revokeForm.address}
                  onChange={(e) => setRevokeForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">角色类型</label>
                <select
                  value={revokeForm.role}
                  onChange={(e) => setRevokeForm(prev => ({ ...prev, role: e.target.value as AdminRole }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                    <option key={roleKey} value={roleKey} className="bg-gray-800">
                      {role.icon} {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowRevokeModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleRevokeRole}
                variant="ghost"
                className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                disabled={!revokeForm.address}
              >
                确认撤销
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
