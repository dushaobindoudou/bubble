const { ethers } = require("hardhat");

/**
 * Gas Price Management Utility
 * Handles dynamic gas price detection and fallback strategies
 */

class GasPriceManager {
  constructor(provider, networkName = "unknown") {
    this.provider = provider;
    this.networkName = networkName;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Get current network gas price with fallback strategies
   */
  async getOptimalGasPrice() {
    console.log(`🔍 检测 ${this.networkName} 网络的最优 Gas 价格...`);

    try {
      // Strategy 1: Get current network fee data
      const feeData = await this.provider.getFeeData();
      console.log("📊 网络费用数据:");
      
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 network
        console.log(`   Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} Gwei`);
        console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")} Gwei`);
        
        // Add 20% buffer for network congestion
        const bufferedMaxFee = feeData.maxFeePerGas * 120n / 100n;
        const bufferedPriorityFee = feeData.maxPriorityFeePerGas * 120n / 100n;
        
        return {
          type: "eip1559",
          maxFeePerGas: bufferedMaxFee,
          maxPriorityFeePerGas: bufferedPriorityFee,
          gasPrice: null
        };
      } else if (feeData.gasPrice) {
        // Legacy network
        console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} Gwei`);
        
        // Add 50% buffer for legacy networks
        const bufferedGasPrice = feeData.gasPrice * 150n / 100n;
        
        return {
          type: "legacy",
          gasPrice: bufferedGasPrice,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null
        };
      } else {
        throw new Error("无法获取网络费用数据");
      }
    } catch (error) {
      console.warn(`⚠️  网络费用检测失败: ${error.message}`);
      return this.getFallbackGasPrice();
    }
  }

  /**
   * Fallback gas price strategies
   */
  getFallbackGasPrice() {
    console.log("🔄 使用备用 Gas 价格策略...");
    
    // Network-specific fallback values (in Gwei)
    const fallbackPrices = {
      monadTestnet: {
        gasPrice: ethers.parseUnits("50", "gwei"), // Higher for testnet
        maxFeePerGas: ethers.parseUnits("100", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("10", "gwei")
      },
      sepolia: {
        gasPrice: ethers.parseUnits("20", "gwei"),
        maxFeePerGas: ethers.parseUnits("40", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
      },
      mainnet: {
        gasPrice: ethers.parseUnits("30", "gwei"),
        maxFeePerGas: ethers.parseUnits("60", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
      },
      default: {
        gasPrice: ethers.parseUnits("25", "gwei"),
        maxFeePerGas: ethers.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("5", "gwei")
      }
    };

    const networkPrices = fallbackPrices[this.networkName] || fallbackPrices.default;
    
    console.log(`💡 使用 ${this.networkName} 网络的备用价格:`);
    console.log(`   Gas Price: ${ethers.formatUnits(networkPrices.gasPrice, "gwei")} Gwei`);
    console.log(`   Max Fee: ${ethers.formatUnits(networkPrices.maxFeePerGas, "gwei")} Gwei`);
    console.log(`   Priority Fee: ${ethers.formatUnits(networkPrices.maxPriorityFeePerGas, "gwei")} Gwei`);

    return {
      type: "fallback",
      gasPrice: networkPrices.gasPrice,
      maxFeePerGas: networkPrices.maxFeePerGas,
      maxPriorityFeePerGas: networkPrices.maxPriorityFeePerGas
    };
  }

  /**
   * Execute transaction with gas price retry mechanism
   */
  async executeWithRetry(transactionFunction, description, customGasConfig = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`⚡ 尝试执行 ${description} (第 ${attempt}/${this.retryAttempts} 次)`);
        
        // Get gas configuration
        const gasConfig = customGasConfig || await this.getOptimalGasPrice();
        
        // Apply gas configuration to transaction
        const txOptions = this.buildTransactionOptions(gasConfig);
        console.log(`   使用 Gas 配置: ${JSON.stringify(this.formatGasConfig(gasConfig))}`);
        
        // Execute transaction
        const tx = await transactionFunction(txOptions);
        console.log(`✅ ${description} 交易已发送: ${tx.hash}`);
        
        return tx;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 第 ${attempt} 次尝试失败: ${error.message}`);
        
        if (this.isGasRelatedError(error)) {
          if (attempt < this.retryAttempts) {
            console.log(`🔄 Gas 相关错误，${this.retryDelay/1000}秒后重试...`);
            await this.sleep(this.retryDelay);
            // Increase gas price for next attempt
            this.retryDelay *= 1.5;
          }
        } else {
          // Non-gas related error, don't retry
          throw error;
        }
      }
    }
    
    throw new Error(`${description} 在 ${this.retryAttempts} 次尝试后仍然失败: ${lastError.message}`);
  }

  /**
   * Build transaction options from gas configuration
   */
  buildTransactionOptions(gasConfig) {
    const options = {};
    
    if (gasConfig.type === "eip1559" || gasConfig.type === "fallback") {
      if (gasConfig.maxFeePerGas) {
        options.maxFeePerGas = gasConfig.maxFeePerGas;
      }
      if (gasConfig.maxPriorityFeePerGas) {
        options.maxPriorityFeePerGas = gasConfig.maxPriorityFeePerGas;
      }
    }
    
    if (gasConfig.gasPrice) {
      options.gasPrice = gasConfig.gasPrice;
    }
    
    // Add gas limit if configured
    if (process.env.GAS_LIMIT) {
      options.gasLimit = parseInt(process.env.GAS_LIMIT);
    }
    
    return options;
  }

  /**
   * Format gas configuration for display
   */
  formatGasConfig(gasConfig) {
    const formatted = { type: gasConfig.type };
    
    if (gasConfig.gasPrice) {
      formatted.gasPrice = `${ethers.formatUnits(gasConfig.gasPrice, "gwei")} Gwei`;
    }
    if (gasConfig.maxFeePerGas) {
      formatted.maxFeePerGas = `${ethers.formatUnits(gasConfig.maxFeePerGas, "gwei")} Gwei`;
    }
    if (gasConfig.maxPriorityFeePerGas) {
      formatted.maxPriorityFeePerGas = `${ethers.formatUnits(gasConfig.maxPriorityFeePerGas, "gwei")} Gwei`;
    }
    
    return formatted;
  }

  /**
   * Check if error is gas-related
   */
  isGasRelatedError(error) {
    const gasErrorPatterns = [
      /maxFeePerGas too low/i,
      /gas price too low/i,
      /insufficient funds for gas/i,
      /underpriced/i,
      /replacement transaction underpriced/i,
      /gas required exceeds allowance/i
    ];
    
    return gasErrorPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get gas price estimation for display
   */
  async getGasPriceEstimation() {
    try {
      const gasConfig = await this.getOptimalGasPrice();
      return this.formatGasConfig(gasConfig);
    } catch (error) {
      console.warn(`Gas 价格估算失败: ${error.message}`);
      return { error: error.message };
    }
  }
}

module.exports = { GasPriceManager };
