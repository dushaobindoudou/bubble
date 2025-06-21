const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

/**
 * Simple HTTP server for testing the Bubble Brawl client
 * Serves static files with proper MIME types
 */

const PORT = 3000;
const CLIENT_DIR = path.join(__dirname, '../src/client');

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Serve static files
 */
function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

/**
 * Create HTTP server
 */
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Default to login.html (new entry point)
    if (pathname === '/') {
        pathname = '/login.html';
    }

    // Construct file path
    const filePath = path.join(CLIENT_DIR, pathname);

    // Security check - ensure file is within client directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(CLIENT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        serveStaticFile(res, filePath);
    });
});

/**
 * Start server
 */
server.listen(PORT, () => {
    console.log('🫧 Bubble Brawl 客户端测试服务器启动');
    console.log('='.repeat(50));
    console.log(`🌐 服务器地址: http://localhost:${PORT}`);
    console.log(`📁 服务目录: ${CLIENT_DIR}`);
    console.log('='.repeat(50));
    console.log('\n📝 使用说明:');
    console.log('1. 在浏览器中打开 http://localhost:3000');
    console.log('2. 确保已安装 MetaMask 或其他 Web3 钱包');
    console.log('3. 点击 "🔗 Web3 登录" 测试认证功能');
    console.log('4. 按 Ctrl+C 停止服务器');
    console.log('\n🔧 开发提示:');
    console.log('- 文件修改后刷新浏览器即可看到更新');
    console.log('- 查看浏览器控制台获取详细日志');
    console.log('- 确保已部署智能合约并更新地址');
    console.log('\n🚀 准备就绪！');
});

/**
 * Handle server errors
 */
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用`);
        console.log('💡 请尝试以下解决方案:');
        console.log(`   1. 关闭占用端口 ${PORT} 的其他程序`);
        console.log(`   2. 修改脚本中的 PORT 变量使用其他端口`);
        console.log(`   3. 使用命令: lsof -ti:${PORT} | xargs kill -9`);
    } else {
        console.error('❌ 服务器启动失败:', err);
    }
    process.exit(1);
});

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
    console.log('\n\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 收到终止信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
