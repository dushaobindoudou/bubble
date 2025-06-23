import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { getContractAddress } from '../config/contracts'
import BubbleSkinNFTABI from '../contracts/abis/BubbleSkinNFT.json'

// Create a public client for direct contract calls
const publicClient = createPublicClient({
  chain: {
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'MON',
      symbol: 'MON',
    },
    rpcUrls: {
      default: {
        http: ['https://testnet-rpc.monad.xyz'],
      },
      public: {
        http: ['https://testnet-rpc.monad.xyz'],
      },
    },
  },
  transport: http('https://testnet-rpc.monad.xyz'),
})

const BUBBLE_SKIN_NFT_ADDRESS = getContractAddress('BubbleSkinNFT')
const BUBBLE_SKIN_NFT_ABI = BubbleSkinNFTABI as const

export interface SkinTemplate {
  templateId: number
  name: string
  description: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  effectType: 'NONE' | 'GLOW' | 'SPARKLE' | 'RAINBOW' | 'LIGHTNING' | 'BUBBLE' | 'FLAME'
  colorConfig: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    transparency: number
  }
  content: string
  isActive: boolean
  maxSupply: number
  currentSupply: number
  createdAt: number
  creator: string
}

export interface CreateSkinTemplateParams {
  name: string
  description: string
  rarity: number // 0-3 for COMMON, RARE, EPIC, LEGENDARY
  effectType: number // 0-6 for effect types
  colorConfig: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    transparency: number
  }
  content: string
  maxSupply: number
}

export interface MintSkinParams {
  templateId: number
  to: string
  quantity: number
}

export const useSkinAdmin = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<SkinTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [contractConnected, setContractConnected] = useState(true)

  const NFT_ROLES = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
    SKIN_MANAGER_ROLE: '0x15a28d26fa1bf736cf7edc9922607171ccb09c3c73b808e7772a3013e068a522',
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
  }

  // Helper function to convert rarity number to string
  const getRarityString = (rarity: number): 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' => {
    const rarityMap = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const
    return rarityMap[rarity] || 'COMMON'
  }

  // Helper function to convert effect number to string
  const getEffectString = (effect: number): 'NONE' | 'GLOW' | 'SPARKLE' | 'RAINBOW' | 'LIGHTNING' | 'BUBBLE' | 'FLAME' => {
    const effectMap = ['NONE', 'GLOW', 'SPARKLE', 'RAINBOW', 'LIGHTNING', 'BUBBLE', 'FLAME'] as const
    return effectMap[effect] || 'NONE'
  }

  // Check user permissions - 权限很少变化，缓存更久
  const { data: hasSkinManagerRole } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'hasRole',
    args: [NFT_ROLES.SKIN_MANAGER_ROLE, address], // SKIN_MANAGER_ROLE
    enabled: !!address,
    cacheTime: 600_000, // 缓存10分钟
    staleTime: 600_000,
  })

  const { data: hasAdminRole } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'hasRole',
    args: [NFT_ROLES.ADMIN_ROLE, address], // ADMIN_ROLE
    enabled: !!address,
    cacheTime: 600_000,
    staleTime: 600_000,
  })

  const { data: hasMinterRole } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'hasRole',
    args: [NFT_ROLES.MINTER_ROLE, address], // MINTER_ROLE
    enabled: !!address,
    cacheTime: 600_000,
    staleTime: 600_000,
  })

  // Get total number of templates with error handling - 模板数量变化较少
  const { data: templateCount, isLoading: isLoadingCount, refetch: refetchCount, error: templateCountError } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'getTotalTemplates',
    cacheTime: 120_000, // 缓存2分钟
    staleTime: 60_000,
    onError: (error) => {
      console.error('Error fetching template count:', error)
      console.error('Contract address:', BUBBLE_SKIN_NFT_ADDRESS)
      console.error('Function name:', 'getTotalTemplates')
      console.error('ABI contains getTotalTemplates:', BUBBLE_SKIN_NFT_ABI.some((item: any) => item.name === 'getTotalTemplates'))
      setError(`Failed to fetch template count: ${error.message}`)
    },
  })

  // Direct contract write functions
  const { write: createTemplate, isLoading: isCreatingTemplate } = useContractWrite({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'createSkinTemplate',
  })

  const { write: mintSkin, isLoading: isMintingSkin } = useContractWrite({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'mintSkin',
  })

  const { write: updateTemplateStatus, isLoading: isUpdatingTemplate } = useContractWrite({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'setTemplateActive',
  })

  useEffect(() => {
    const loading = isLoadingCount
    setIsLoading(loading)

    // Handle template count error
    if (templateCountError) {
      console.error('Template count error:', templateCountError)
      setError('Failed to load template count. Contract may not be properly deployed.')
    }
  }, [isLoadingCount, templateCountError])

  const createSkinTemplate = async (params: CreateSkinTemplateParams) => {
    try {
      if (!hasSkinManagerRole && !hasAdminRole) {
        throw new Error('You do not have permission to create skin templates. Need SKIN_MANAGER_ROLE or ADMIN_ROLE.')
      }

      if (!createTemplate) {
        throw new Error('Create template function not available')
      }

      createTemplate({
        args: [
          params.name,
          params.description,
          params.rarity,
          params.effectType,
          {
            primaryColor: params.colorConfig.primaryColor,
            secondaryColor: params.colorConfig.secondaryColor,
            accentColor: params.colorConfig.accentColor,
            transparency: params.colorConfig.transparency,
          },
          params.content,
          BigInt(params.maxSupply)
        ]
      })

      // Refresh template count after creation
      setTimeout(() => {
        refetchCount()
        loadTemplates()
      }, 2000)

    } catch (err) {
      console.error('Failed to create skin template:', err)
      setError('Failed to create skin template')
      throw err
    }
  }

  const mintSkinToAddress = async (params: MintSkinParams) => {
    try {
      if (!hasMinterRole && !hasAdminRole) {
        throw new Error('You do not have permission to mint skins. Need MINTER_ROLE or ADMIN_ROLE.')
      }

      if (!mintSkin) {
        throw new Error('Mint skin function not available')
      }

      // For multiple quantity, we need to call mintSkin multiple times
      for (let i = 0; i < params.quantity; i++) {
        mintSkin({
          args: [
            params.to as `0x${string}`,
            BigInt(params.templateId)
          ]
        })

        // Add delay between mints to avoid nonce issues
        if (i < params.quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Refresh data after minting
      setTimeout(() => {
        loadTemplates()
      }, 2000)

    } catch (err) {
      console.error('Failed to mint skin:', err)
      setError('Failed to mint skin')
      throw err
    }
  }

  const toggleTemplateStatus = async (templateId: number, isActive: boolean) => {
    try {
      if (!hasSkinManagerRole && !hasAdminRole) {
        throw new Error('You do not have permission to update templates. Need SKIN_MANAGER_ROLE or ADMIN_ROLE.')
      }

      if (!updateTemplateStatus) {
        throw new Error('Update template function not available')
      }

      updateTemplateStatus({
        args: [BigInt(templateId), isActive]
      })

      // Refresh templates after update
      setTimeout(() => {
        loadTemplates()
      }, 2000)

    } catch (err) {
      console.error('Failed to update template status:', err)
      setError('Failed to update template status')
      throw err
    }
  }

  const loadTemplates = async () => {
    try {
      if (!templateCount) {
        console.log('No template count available, skipping template loading')
        return
      }

      setLoadingTemplates(true)
      setError(null) // Clear any previous errors

      const count = Number(templateCount as bigint)
      console.log(`Loading ${count} templates from contract...`)

      // Load real template data from contract with parallel requests for better performance
      const templatePromises: Promise<SkinTemplate | null>[] = []

      for (let i = 1; i <= count; i++) {
        templatePromises.push(fetchSingleTemplate(i))
      }

      // Wait for all template fetches to complete
      const templateResults = await Promise.allSettled(templatePromises)

      // Process results and filter out failed/null templates
      const loadedTemplates: SkinTemplate[] = []
      let failedCount = 0

      templateResults.forEach((result, index) => {
        const templateId = index + 1

        if (result.status === 'fulfilled' && result.value) {
          loadedTemplates.push(result.value)
        } else {
          failedCount++
          console.warn(`Failed to load template ${templateId}:`,
            result.status === 'rejected' ? result.reason : 'Template returned null')
        }
      })

      console.log(`Successfully loaded ${loadedTemplates.length} templates, ${failedCount} failed`)
      console.log('Loaded templates:', loadedTemplates)

      setTemplates(loadedTemplates)

      // Show warning if some templates failed to load
      if (failedCount > 0) {
        setError(`Warning: ${failedCount} templates could not be loaded from the contract`)
      }

      setLoadingTemplates(false)

    } catch (err) {
      console.error('Failed to load templates:', err)
      setError(`Failed to load skin templates: ${(err as Error).message}`)
      setLoadingTemplates(false)
    }
  }

  // Function to fetch a single template from the contract using real contract calls with retry
  const fetchSingleTemplate = async (templateId: number, retryCount = 0): Promise<SkinTemplate | null> => {
    const maxRetries = 2

    try {
      console.log(`Fetching template ${templateId} from contract... (attempt ${retryCount + 1})`)

      // Make direct contract call using viem
      const result = await publicClient.readContract({
        address: BUBBLE_SKIN_NFT_ADDRESS as `0x${string}`,
        abi: BUBBLE_SKIN_NFT_ABI,
        functionName: 'getSkinTemplate',
        args: [BigInt(templateId)],
      })

      // Reset contract connection status on successful call
      setContractConnected(true)

      // Parse the contract response according to the ABI structure
      if (!result) {
        console.log(`Template ${templateId} not found`)
        return null
      }

      // Type-safe parsing of the contract response
      // The result is a tuple/struct with the following fields according to BubbleSkinNFT ABI:
      // struct SkinTemplate { templateId, name, description, rarity, effectType, colorConfig, content, isActive, maxSupply, currentSupply, createdAt, creator }

      let parsedTemplate: SkinTemplate

      try {
        // Handle both array and object response formats
        if (Array.isArray(result)) {
          const [
            contractTemplateId,
            name,
            description,
            rarity,
            effectType,
            colorConfig,
            content,
            isActive,
            maxSupply,
            currentSupply,
            createdAt,
            creator
          ] = result

          parsedTemplate = {
            templateId: Number(contractTemplateId),
            name: String(name || `Template ${templateId}`),
            description: String(description || `Skin template ${templateId}`),
            rarity: getRarityString(Number(rarity)),
            effectType: getEffectString(Number(effectType)),
            colorConfig: {
              primaryColor: String(colorConfig?.primaryColor || '#0066ff'),
              secondaryColor: String(colorConfig?.secondaryColor || '#00ccff'),
              accentColor: String(colorConfig?.accentColor || '#ffffff'),
              transparency: Number(colorConfig?.transparency || 255),
            },
            content: String(content || `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#0066ff"/></svg>`),
            isActive: Boolean(isActive),
            maxSupply: Number(maxSupply || 0),
            currentSupply: Number(currentSupply || 0),
            createdAt: Number(createdAt || 0) * 1000, // Convert to milliseconds
            creator: String(creator || '0x0000000000000000000000000000000000000000'),
          }
        } else {
          // Handle object response format
          const templateData = result as any
          parsedTemplate = {
            templateId: Number(templateData.templateId || templateId),
            name: String(templateData.name || `Template ${templateId}`),
            description: String(templateData.description || `Skin template ${templateId}`),
            rarity: getRarityString(Number(templateData.rarity || 0)),
            effectType: getEffectString(Number(templateData.effectType || 0)),
            colorConfig: {
              primaryColor: String(templateData.colorConfig?.primaryColor || '#0066ff'),
              secondaryColor: String(templateData.colorConfig?.secondaryColor || '#00ccff'),
              accentColor: String(templateData.colorConfig?.accentColor || '#ffffff'),
              transparency: Number(templateData.colorConfig?.transparency || 255),
            },
            content: String(templateData.content || `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#0066ff"/></svg>`),
            isActive: Boolean(templateData.isActive),
            maxSupply: Number(templateData.maxSupply || 0),
            currentSupply: Number(templateData.currentSupply || 0),
            createdAt: Number(templateData.createdAt || 0) * 1000,
            creator: String(templateData.creator || '0x0000000000000000000000000000000000000000'),
          }
        }
      } catch (parseError) {
        console.error(`Error parsing template ${templateId} data:`, parseError)
        throw new Error(`Failed to parse template data: ${parseError}`)
      }

      console.log(`Successfully fetched template ${templateId}:`, parsedTemplate)
      return parsedTemplate

    } catch (err) {
      console.error(`Error fetching template ${templateId} from contract (attempt ${retryCount + 1}):`, err)

      // Handle specific error types
      if (err instanceof Error) {
        // Template doesn't exist - this is expected for some template IDs
        if (err.message.includes('execution reverted') || err.message.includes('Template does not exist')) {
          console.log(`Template ${templateId} does not exist on contract`)
          return null
        }

        // Network or connection errors - try retry
        if ((err.message.includes('network') || err.message.includes('timeout') || err.message.includes('connection')) && retryCount < maxRetries) {
          console.log(`Network error for template ${templateId}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
          return fetchSingleTemplate(templateId, retryCount + 1)
        }
      }

      // Mark contract as potentially disconnected
      setContractConnected(false)

      // For other errors or max retries reached, use fallback
      console.log(`Contract call failed for template ${templateId} after ${retryCount + 1} attempts, using fallback`)
      return createFallbackTemplate(templateId)
    }
  }

  // Create fallback template when contract calls fail
  const createFallbackTemplate = (id: number): SkinTemplate => {
    console.log(`Creating fallback template for ID ${id}`)

    return {
      templateId: id,
      name: `Template ${id} (Offline)`,
      description: `Skin template ${id} - Contract data unavailable`,
      rarity: 'COMMON',
      effectType: 'NONE',
      colorConfig: {
        primaryColor: '#6b7280',
        secondaryColor: '#9ca3af',
        accentColor: '#d1d5db',
        transparency: 200,
      },
      content: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#6b7280" opacity="0.5"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="12">Offline</text></svg>`,
      isActive: false,
      maxSupply: 0,
      currentSupply: 0,
      createdAt: Date.now(),
      creator: '0x0000000000000000000000000000000000000000',
    }
  }



  const batchMintSkins = async (operations: MintSkinParams[]) => {
    try {
      for (const operation of operations) {
        await mintSkinToAddress(operation)
        // Add delay between operations
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error('Failed to batch mint skins:', err)
      setError('Failed to complete batch mint operation')
      throw err
    }
  }

  const refreshData = async () => {
    try {
      setError(null)
      await refetchCount()
      await loadTemplates()
    } catch (err) {
      console.error('Failed to refresh skin data:', err)
      setError('Failed to refresh data')
    }
  }

  // Test contract connectivity
  const testContractConnection = async (): Promise<boolean> => {
    try {
      console.log('Testing contract connection...')
      const result = await publicClient.readContract({
        address: BUBBLE_SKIN_NFT_ADDRESS as `0x${string}`,
        abi: BUBBLE_SKIN_NFT_ABI,
        functionName: 'getTotalTemplates',
        args: [],
      })

      setContractConnected(true)
      console.log('Contract connection successful, total templates:', Number(result))
      return true
    } catch (err) {
      console.error('Contract connection test failed:', err)
      setContractConnected(false)
      return false
    }
  }

  // Load templates when component mounts or template count changes
  useEffect(() => {
    if (templateCount) {
      loadTemplates()
    }
  }, [templateCount])

  // Predefined rarity and effect options
  const rarityOptions = [
    { value: 0, label: 'Common', color: '#9ca3af' },
    { value: 1, label: 'Rare', color: '#3b82f6' },
    { value: 2, label: 'Epic', color: '#8b5cf6' },
    { value: 3, label: 'Legendary', color: '#f59e0b' },
  ]

  const effectOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'Glow' },
    { value: 2, label: 'Sparkle' },
    { value: 3, label: 'Rainbow' },
    { value: 4, label: 'Lightning' },
    { value: 5, label: 'Bubble' },
    { value: 6, label: 'Flame' },
  ]

  return {
    // Data
    templates,
    templateCount: templateCount ? Number(templateCount as bigint) : 0,
    rarityOptions,
    effectOptions,

    // Permissions
    hasSkinManagerRole: !!hasSkinManagerRole,
    hasAdminRole: !!hasAdminRole,
    hasMinterRole: !!hasMinterRole,
    canCreateTemplate: !!(hasSkinManagerRole || hasAdminRole),
    canMintSkin: !!(hasMinterRole || hasAdminRole),
    canUpdateTemplate: !!(hasSkinManagerRole || hasAdminRole),

    // Loading states
    isLoading,
    isLoadingTemplates: loadingTemplates,
    isCreatingTemplate,
    isMintingSkin,
    isUpdatingTemplate,

    // Connection state
    contractConnected,

    // Error state
    error,

    // Actions
    createSkinTemplate,
    mintSkinToAddress,
    toggleTemplateStatus,
    batchMintSkins,
    refreshData,
    testContractConnection,

    // Utils
    setError,
  }
}
