// Simple contract verification script using ethers.js
const ethers = require('ethers');

const CONTRACT_ADDRESS = "0x6Cde3abE9ACC5028330bd301415e59877D0A5Bdd";
const RPC_URL = "https://testnet-rpc.monad.xyz";

// Minimal ABI for testing
const MINIMAL_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function getTotalTemplates() view returns (uint256)",
    "function getTotalSupply() view returns (uint256)",
    "function getTemplateCount() view returns (uint256)" // This should NOT exist
];

async function verifyContract() {
    console.log('🔍 Verifying BubbleSkinNFT contract functions...');
    
    try {
        // Connect to provider
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MINIMAL_ABI, provider);
        
        console.log('✅ Connected to contract at:', CONTRACT_ADDRESS);
        
        // Test basic functions
        try {
            const name = await contract.name();
            console.log('✅ Name:', name);
        } catch (error) {
            console.log('❌ Name failed:', error.message);
        }
        
        try {
            const symbol = await contract.symbol();
            console.log('✅ Symbol:', symbol);
        } catch (error) {
            console.log('❌ Symbol failed:', error.message);
        }
        
        // Test the correct function
        try {
            const totalTemplates = await contract.getTotalTemplates();
            console.log('✅ getTotalTemplates:', totalTemplates.toString());
        } catch (error) {
            console.log('❌ getTotalTemplates failed:', error.message);
        }
        
        // Test the incorrect function (should fail)
        try {
            const templateCount = await contract.getTemplateCount();
            console.log('⚠️ getTemplateCount (should not exist):', templateCount.toString());
        } catch (error) {
            console.log('✅ getTemplateCount correctly failed (function does not exist):', error.message);
        }
        
        try {
            const totalSupply = await contract.getTotalSupply();
            console.log('✅ getTotalSupply:', totalSupply.toString());
        } catch (error) {
            console.log('❌ getTotalSupply failed:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
    }
}

verifyContract().catch(console.error);
