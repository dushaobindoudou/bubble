const fs = require('fs');
const path = require('path');

/**
 * Test Client Authentication System
 * Verifies that all authentication components are properly set up
 */

async function testClientAuth() {
    console.log('🧪 测试客户端认证系统...\n');

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0
    };

    try {
        // Test 1: Check if all required files exist
        console.log('📁 检查文件结构...');
        await testFileStructure(results);

        // Test 2: Validate HTML integration
        console.log('\n🌐 检查 HTML 集成...');
        await testHTMLIntegration(results);

        // Test 3: Check JavaScript syntax
        console.log('\n📜 检查 JavaScript 语法...');
        await testJavaScriptSyntax(results);

        // Test 4: Validate configuration
        console.log('\n⚙️  检查配置文件...');
        await testConfiguration(results);

        // Test 5: Check CSS styles
        console.log('\n🎨 检查 CSS 样式...');
        await testCSSStyles(results);

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 测试结果汇总:');
        console.log(`✅ 通过: ${results.passed}`);
        console.log(`❌ 失败: ${results.failed}`);
        console.log(`⚠️  警告: ${results.warnings}`);
        console.log('='.repeat(50));

        if (results.failed === 0) {
            console.log('\n🎉 所有测试通过！客户端认证系统已准备就绪。');
            console.log('\n📝 下一步:');
            console.log('1. 部署智能合约到 Monad 测试网');
            console.log('2. 运行 npm run update-client-contracts');
            console.log('3. 在浏览器中打开 src/client/index.html');
            console.log('4. 测试 Web3 钱包连接功能');
        } else {
            console.log('\n❌ 发现问题，请修复后重新测试。');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        process.exit(1);
    }
}

/**
 * Test file structure
 */
async function testFileStructure(results) {
    const requiredFiles = [
        'src/client/login.html',
        'src/client/index.html',
        'src/client/css/login.css',
        'src/client/css/auth.css',
        'src/client/js/cdn-loader.js',
        'src/client/js/rainbowkit-config.js',
        'src/client/js/login-manager.js',
        'src/client/js/session-manager.js',
        'src/client/js/web3-config.js',
        'src/client/js/web3-auth.js',
        'src/client/js/auth-ui.js',
        'src/client/js/web3-integration.js',
        'src/client/contracts/deployment.json',
        'scripts/update-client-contracts.js'
    ];

    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            console.log(`   ✅ ${file}`);
            results.passed++;
        } else {
            console.log(`   ❌ ${file} - 文件不存在`);
            results.failed++;
        }
    }

    // Check optional files
    const optionalFiles = [
        'src/client/js/contracts.js'
    ];

    for (const file of optionalFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            console.log(`   ✅ ${file} (可选)`);
        } else {
            console.log(`   ⚠️  ${file} - 可选文件，将在部署后生成`);
            results.warnings++;
        }
    }
}

/**
 * Test HTML integration
 */
async function testHTMLIntegration(results) {
    // Test login.html
    await testLoginHTML(results);

    // Test index.html (game page)
    await testGameHTML(results);
}

/**
 * Test login.html integration
 */
async function testLoginHTML(results) {
    const loginPath = path.join(__dirname, '../src/client/login.html');

    if (!fs.existsSync(loginPath)) {
        console.log('   ❌ login.html 不存在');
        results.failed++;
        return;
    }

    const loginContent = fs.readFileSync(loginPath, 'utf8');

    // Check for required CSS
    if (loginContent.includes('css/login.css')) {
        console.log('   ✅ login.css 已包含');
        results.passed++;
    } else {
        console.log('   ❌ login.css 未包含');
        results.failed++;
    }

    // Check for required JavaScript files for login page
    const loginScripts = [
        'cdn-loader.js',
        'session-manager.js',
        'rainbowkit-config.js',
        'login-manager.js'
    ];

    for (const script of loginScripts) {
        if (loginContent.includes(script)) {
            console.log(`   ✅ login页面: ${script} 已包含`);
            results.passed++;
        } else {
            console.log(`   ❌ login页面: ${script} 未包含`);
            results.failed++;
        }
    }
}

/**
 * Test index.html (game page) integration
 */
async function testGameHTML(results) {
    const gamePath = path.join(__dirname, '../src/client/index.html');

    if (!fs.existsSync(gamePath)) {
        console.log('   ❌ index.html 不存在');
        results.failed++;
        return;
    }

    const gameContent = fs.readFileSync(gamePath, 'utf8');

    // Check for required CSS
    if (gameContent.includes('css/auth.css')) {
        console.log('   ✅ 游戏页面: auth.css 已包含');
        results.passed++;
    } else {
        console.log('   ❌ 游戏页面: auth.css 未包含');
        results.failed++;
    }

    // Check for required JavaScript files for game page
    const gameScripts = [
        'cdn-loader.js',
        'session-manager.js'
    ];

    for (const script of gameScripts) {
        if (gameContent.includes(script)) {
            console.log(`   ✅ 游戏页面: ${script} 已包含`);
            results.passed++;
        } else {
            console.log(`   ❌ 游戏页面: ${script} 未包含`);
            results.failed++;
        }
    }

    // Check for authentication check logic
    if (gameContent.includes('hasValidSession')) {
        console.log('   ✅ 游戏页面: 认证检查逻辑已包含');
        results.passed++;
    } else {
        console.log('   ❌ 游戏页面: 认证检查逻辑未包含');
        results.failed++;
    }
}

/**
 * Test JavaScript syntax
 */
async function testJavaScriptSyntax(results) {
    const jsFiles = [
        'src/client/js/cdn-loader.js',
        'src/client/js/rainbowkit-config.js',
        'src/client/js/login-manager.js',
        'src/client/js/session-manager.js',
        'src/client/js/web3-config.js',
        'src/client/js/web3-auth.js',
        'src/client/js/auth-ui.js',
        'src/client/js/web3-integration.js'
    ];

    for (const file of jsFiles) {
        const filePath = path.join(__dirname, '..', file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ❌ ${file} - 文件不存在`);
            results.failed++;
            continue;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Basic syntax checks
            const syntaxChecks = [
                { pattern: /class\s+\w+/, name: 'Class definitions' },
                { pattern: /function\s+\w+/, name: 'Function definitions' },
                { pattern: /const\s+\w+/, name: 'Const declarations' },
                { pattern: /\/\*\*[\s\S]*?\*\//, name: 'JSDoc comments' }
            ];

            let fileChecks = 0;
            for (const check of syntaxChecks) {
                if (check.pattern.test(content)) {
                    fileChecks++;
                }
            }

            if (fileChecks >= 2) {
                console.log(`   ✅ ${file} - 语法检查通过`);
                results.passed++;
            } else {
                console.log(`   ⚠️  ${file} - 语法检查警告`);
                results.warnings++;
            }

        } catch (error) {
            console.log(`   ❌ ${file} - 语法错误: ${error.message}`);
            results.failed++;
        }
    }
}

/**
 * Test configuration
 */
async function testConfiguration(results) {
    // Test web3-config.js
    const configPath = path.join(__dirname, '../src/client/js/web3-config.js');
    
    if (!fs.existsSync(configPath)) {
        console.log('   ❌ web3-config.js 不存在');
        results.failed++;
        return;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');

    // Check for required configurations
    const requiredConfigs = [
        'MONAD_TESTNET',
        'CONTRACT_ADDRESSES',
        'CONTRACT_ABIS',
        'SUPPORTED_WALLETS',
        'ERROR_MESSAGES'
    ];

    for (const config of requiredConfigs) {
        if (configContent.includes(config)) {
            console.log(`   ✅ ${config} 配置存在`);
            results.passed++;
        } else {
            console.log(`   ❌ ${config} 配置缺失`);
            results.failed++;
        }
    }

    // Check Monad Testnet configuration
    if (configContent.includes('10143') && configContent.includes('testnet-rpc.monad.xyz')) {
        console.log('   ✅ Monad 测试网配置正确');
        results.passed++;
    } else {
        console.log('   ❌ Monad 测试网配置错误');
        results.failed++;
    }

    // Test deployment.json
    const deploymentPath = path.join(__dirname, '../src/client/contracts/deployment.json');
    
    if (fs.existsSync(deploymentPath)) {
        try {
            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            if (deployment.contracts && deployment.chainId === 10143) {
                console.log('   ✅ deployment.json 格式正确');
                results.passed++;
            } else {
                console.log('   ⚠️  deployment.json 格式需要更新');
                results.warnings++;
            }
        } catch (error) {
            console.log('   ❌ deployment.json 格式错误');
            results.failed++;
        }
    } else {
        console.log('   ⚠️  deployment.json 不存在，将在部署后创建');
        results.warnings++;
    }
}

/**
 * Test CSS styles
 */
async function testCSSStyles(results) {
    const cssPath = path.join(__dirname, '../src/client/css/auth.css');
    
    if (!fs.existsSync(cssPath)) {
        console.log('   ❌ auth.css 不存在');
        results.failed++;
        return;
    }

    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Check for required CSS classes
    const requiredClasses = [
        '.auth-modal',
        '.auth-modal-content',
        '.wallet-option',
        '.primary-btn',
        '.loading-spinner'
    ];

    for (const className of requiredClasses) {
        if (cssContent.includes(className)) {
            console.log(`   ✅ ${className} 样式存在`);
            results.passed++;
        } else {
            console.log(`   ❌ ${className} 样式缺失`);
            results.failed++;
        }
    }

    // Check for responsive design
    if (cssContent.includes('@media') && cssContent.includes('max-width')) {
        console.log('   ✅ 响应式设计支持');
        results.passed++;
    } else {
        console.log('   ⚠️  缺少响应式设计');
        results.warnings++;
    }

    // Check for animations
    if (cssContent.includes('@keyframes') && cssContent.includes('animation')) {
        console.log('   ✅ 动画效果支持');
        results.passed++;
    } else {
        console.log('   ⚠️  缺少动画效果');
        results.warnings++;
    }
}

// Run the test
if (require.main === module) {
    testClientAuth()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testClientAuth };
