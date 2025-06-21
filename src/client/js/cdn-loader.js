/**
 * CDN Loader for Bubble Brawl
 * Provides fallback CDN loading for critical libraries
 */

class CDNLoader {
    constructor() {
        this.loadedLibraries = new Set();
        this.loadingPromises = new Map();
    }

    /**
     * Load ethers.js with multiple CDN fallbacks
     */
    async loadEthers() {
        if (this.loadedLibraries.has('ethers')) {
            return Promise.resolve();
        }

        if (this.loadingPromises.has('ethers')) {
            return this.loadingPromises.get('ethers');
        }

        const ethersPromise = this.loadLibraryWithFallbacks('ethers', [
            {
                url: 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js',
                integrity: 'sha256-56N6X4CaGFAESFliQTdnSw0m2fYqQKBI4GZ+3+6Yw7E=',
                name: 'jsDelivr'
            },
            {
                url: 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js',
                name: 'unpkg'
            },
            {
                url: 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js',
                name: 'Cloudflare'
            }
        ]);

        this.loadingPromises.set('ethers', ethersPromise);
        return ethersPromise;
    }

    /**
     * Load library with multiple CDN fallbacks
     */
    async loadLibraryWithFallbacks(libraryName, cdnOptions) {
        console.log(`🔄 Loading ${libraryName}...`);

        for (let i = 0; i < cdnOptions.length; i++) {
            const option = cdnOptions[i];
            
            try {
                console.log(`   Trying ${option.name}: ${option.url}`);
                await this.loadScript(option.url, option.integrity);
                
                // Verify library is available
                if (this.verifyLibrary(libraryName)) {
                    console.log(`✅ ${libraryName} loaded successfully from ${option.name}`);
                    this.loadedLibraries.add(libraryName);
                    return;
                }
                
            } catch (error) {
                console.warn(`⚠️  Failed to load ${libraryName} from ${option.name}:`, error.message);
                
                // If this was the last option, throw error
                if (i === cdnOptions.length - 1) {
                    throw new Error(`Failed to load ${libraryName} from all CDN sources`);
                }
            }
        }
    }

    /**
     * Load a script with optional integrity check
     */
    loadScript(url, integrity = null) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.crossOrigin = 'anonymous';
            
            if (integrity) {
                script.integrity = integrity;
            }

            script.onload = () => {
                console.log(`   ✅ Script loaded: ${url}`);
                resolve();
            };

            script.onerror = () => {
                // Remove failed script
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error(`Failed to load script: ${url}`));
            };

            // Set timeout for loading
            const timeout = setTimeout(() => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error(`Timeout loading script: ${url}`));
            }, 10000); // 10 second timeout

            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Verify that a library is properly loaded
     */
    verifyLibrary(libraryName) {
        switch (libraryName) {
            case 'ethers':
                return typeof window.ethers !== 'undefined' && 
                       typeof window.ethers.providers !== 'undefined' &&
                       typeof window.ethers.Contract !== 'undefined';
            default:
                return false;
        }
    }

    /**
     * Get loading status
     */
    getLoadingStatus() {
        return {
            loaded: Array.from(this.loadedLibraries),
            loading: Array.from(this.loadingPromises.keys())
        };
    }
}

// Create global CDN loader instance
if (typeof window !== 'undefined') {
    window.CDNLoader = CDNLoader;
    window.cdnLoader = new CDNLoader();
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDNLoader;
}
