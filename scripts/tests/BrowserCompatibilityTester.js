// ブラウザ互換性テスター

import { SUPPORTED_FORMATS, REQUIRED_FEATURES } from '../constants.js';

/**
 * ブラウザ互換性テストクラス
 */
export class BrowserCompatibilityTester {
    constructor() {
        this.testResults = {
            browserInfo: this.getBrowserInfo(),
            apiSupport: {},
            featureSupport: {},
            performanceCapabilities: {},
            limitations: []
        };
    }
    
    /**
     * 全ての互換性テストを実行
     * @returns {Promise<object>} テスト結果
     */
    async runCompatibilityTests() {
        console.log('🌐 ブラウザ互換性テストを開始します...');
        
        // API サポートテスト
        this.testAPISupport();
        
        // 機能サポートテスト
        await this.testFeatureSupport();
        
        // パフォーマンステスト
        await this.testPerformanceCapabilities();
        
        // 制限事項の特定
        this.identifyLimitations();
        
        return this.testResults;
    }
    
    /**
     * API サポートをテスト
     */
    testAPISupport() {
        const apis = {
            'Canvas API': () => 'HTMLCanvasElement' in window,
            'File API': () => 'FileReader' in window,
            'Blob API': () => 'Blob' in window,
            'URL API': () => 'URL' in window && 'createObjectURL' in URL,
            'DOMParser': () => 'DOMParser' in window,
            'CustomEvent': () => 'CustomEvent' in window,
            'Promise': () => 'Promise' in window,
            'Fetch API': () => 'fetch' in window,
            'Web Workers': () => 'Worker' in window,
            'IndexedDB': () => 'indexedDB' in window
        };
        
        Object.entries(apis).forEach(([apiName, testFn]) => {
            try {
                this.testResults.apiSupport[apiName] = testFn();
            } catch (error) {
                this.testResults.apiSupport[apiName] = false;
            }
        });
    }
    
    /**
     * 機能サポートをテスト
     */
    async testFeatureSupport() {
        // Canvas 機能テスト
        this.testResults.featureSupport.canvas = this.testCanvasFeatures();
        
        // 画像形式サポートテスト
        this.testResults.featureSupport.imageFormats = await this.testImageFormatSupport();
        
        // ファイル処理機能テスト
        this.testResults.featureSupport.fileProcessing = this.testFileProcessingFeatures();
    }
    
    /**
     * Canvas機能をテスト
     */
    testCanvasFeatures() {
        const features = {};
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            features.basic = !!ctx;
            features.toBlob = typeof canvas.toBlob === 'function';
            features.toDataURL = typeof canvas.toDataURL === 'function';
            features.getImageData = typeof ctx.getImageData === 'function';
            features.putImageData = typeof ctx.putImageData === 'function';
            
        } catch (error) {
            features.error = error.message;
        }
        
        return features;
    }
    
    /**
     * 画像形式サポートをテスト
     */
    async testImageFormatSupport() {
        const formats = {};
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        // 各形式のサポートをテスト
        const formatTests = [
            { format: 'png', mimeType: 'image/png' },
            { format: 'jpeg', mimeType: 'image/jpeg' },
            { format: 'webp', mimeType: 'image/webp' },
            { format: 'gif', mimeType: 'image/gif' }
        ];
        
        for (const test of formatTests) {
            try {
                const dataURL = canvas.toDataURL(test.mimeType);
                formats[test.format] = dataURL.startsWith(`data:${test.mimeType}`);
            } catch (error) {
                formats[test.format] = false;
            }
        }
        
        return formats;
    }
    
    /**
     * ファイル処理機能をテスト
     */
    testFileProcessingFeatures() {
        const features = {};
        
        try {
            // FileReader テスト
            const reader = new FileReader();
            features.fileReader = {
                readAsText: typeof reader.readAsText === 'function',
                readAsArrayBuffer: typeof reader.readAsArrayBuffer === 'function',
                readAsDataURL: typeof reader.readAsDataURL === 'function'
            };
            
            // Blob テスト
            const blob = new Blob(['test']);
            features.blob = {
                constructor: true,
                size: typeof blob.size === 'number',
                type: typeof blob.type === 'string'
            };
            
            // URL テスト
            features.url = {
                createObjectURL: typeof URL.createObjectURL === 'function',
                revokeObjectURL: typeof URL.revokeObjectURL === 'function'
            };
            
        } catch (error) {
            features.error = error.message;
        }
        
        return features;
    }
    
    /**
     * パフォーマンス能力をテスト
     */
    async testPerformanceCapabilities() {
        const capabilities = {};
        
        // メモリ情報
        if (performance.memory) {
            capabilities.memory = {
                available: true,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize
            };
        } else {
            capabilities.memory = { available: false };
        }
        
        // CPU 情報
        capabilities.cpu = {
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown'
        };
        
        // Canvas パフォーマンステスト
        capabilities.canvasPerformance = await this.testCanvasPerformance();
        
        this.testResults.performanceCapabilities = capabilities;
    }
    
    /**
     * Canvas パフォーマンスをテスト
     */
    async testCanvasPerformance() {
        const results = {};
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 500;
            canvas.height = 500;
            
            // 描画パフォーマンステスト
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                ctx.fillStyle = `hsl(${i % 360}, 50%, 50%)`;
                ctx.fillRect(i % 500, Math.floor(i / 500) * 10, 10, 10);
            }
            
            const drawTime = performance.now() - startTime;
            results.drawingSpeed = drawTime;
            
            // toBlob パフォーマンステスト
            const blobStartTime = performance.now();
            await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            const blobTime = performance.now() - blobStartTime;
            results.blobConversionSpeed = blobTime;
            
        } catch (error) {
            results.error = error.message;
        }
        
        return results;
    }
    
    /**
     * 制限事項を特定
     */
    identifyLimitations() {
        const limitations = [];
        
        // API サポートの制限
        Object.entries(this.testResults.apiSupport).forEach(([api, supported]) => {
            if (!supported) {
                limitations.push(`${api} がサポートされていません`);
            }
        });
        
        // 画像形式の制限
        Object.entries(this.testResults.featureSupport.imageFormats || {}).forEach(([format, supported]) => {
            if (!supported) {
                limitations.push(`${format.toUpperCase()} 形式がサポートされていません`);
            }
        });
        
        // メモリ制限
        const memory = this.testResults.performanceCapabilities.memory;
        if (memory && memory.available) {
            const memoryLimitMB = memory.jsHeapSizeLimit / (1024 * 1024);
            if (memoryLimitMB < 100) {
                limitations.push(`メモリ制限が低い: ${memoryLimitMB.toFixed(0)}MB`);
            }
        }
        
        this.testResults.limitations = limitations;
    }
    
    /**
     * ブラウザ情報を取得
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        
        return {
            userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            vendor: navigator.vendor,
            product: navigator.product,
            appName: navigator.appName,
            appVersion: navigator.appVersion,
            timestamp: new Date()
        };
    }
}