/**
 * パフォーマンス監視と最適化システム
 * 大容量ファイル処理の最適化、メモリ使用量監視、タイムアウト処理を提供
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            conversions: [],
            memoryUsage: [],
            processingTimes: [],
            errors: []
        };
        
        this.limits = {
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            maxProcessingTime: 60000, // 60秒
            maxFileSize: 10 * 1024 * 1024, // 10MB
            warningMemoryUsage: 50 * 1024 * 1024, // 50MB
            warningProcessingTime: 30000 // 30秒
        };
        
        this.optimizations = {
            enableChunkedProcessing: true,
            enableMemoryCleanup: true,
            enableProgressiveLoading: true,
            maxConcurrentOperations: 3
        };
        
        this.activeOperations = new Map();
        this.memoryMonitorInterval = null;
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.startMemoryMonitoring();
        this.setupPerformanceObserver();
        this.detectDeviceCapabilities();
    }
    
    /**
     * メモリ監視を開始
     */
    startMemoryMonitoring() {
        this.memoryMonitorInterval = setInterval(() => {
            this.recordMemoryUsage();
        }, 5000); // 5秒間隔
    }
    
    /**
     * パフォーマンスオブザーバーを設定
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name.includes('image-conversion')) {
                            this.recordPerformanceEntry(entry);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (error) {
                console.warn('PerformanceObserver setup failed:', error);
            }
        }
    }
    
    /**
     * デバイス性能を検出
     */
    detectDeviceCapabilities() {
        const capabilities = {
            cores: navigator.hardwareConcurrency || 4,
            memory: navigator.deviceMemory || 4, // GB
            connection: this.getConnectionInfo(),
            isMobile: /Mobi|Android/i.test(navigator.userAgent)
        };
        
        // デバイス性能に基づいて制限を調整
        this.adjustLimitsBasedOnCapabilities(capabilities);
        
        console.log('Device capabilities detected:', capabilities);
    }
    
    /**
     * 接続情報を取得
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return { effectiveType: 'unknown' };
    }
    
    /**
     * デバイス性能に基づいて制限を調整
     */
    adjustLimitsBasedOnCapabilities(capabilities) {
        // メモリ制限の調整
        if (capabilities.memory < 4) {
            this.limits.maxMemoryUsage = 50 * 1024 * 1024; // 50MB
            this.limits.warningMemoryUsage = 25 * 1024 * 1024; // 25MB
        }
        
        // モバイルデバイスの場合
        if (capabilities.isMobile) {
            this.limits.maxFileSize = 5 * 1024 * 1024; // 5MB
            this.optimizations.maxConcurrentOperations = 1;
        }
        
        // 低速接続の場合
        if (capabilities.connection.effectiveType === 'slow-2g' || 
            capabilities.connection.effectiveType === '2g') {
            this.limits.maxProcessingTime = 120000; // 2分
        }
    }
    
    /**
     * 変換操作を開始
     * @param {string} operationId - 操作ID
     * @param {Object} context - コンテキスト情報
     * @returns {Object} 操作情報
     */
    startOperation(operationId, context = {}) {
        const operation = {
            id: operationId,
            startTime: performance.now(),
            startMemory: this.getCurrentMemoryUsage(),
            context,
            status: 'running'
        };
        
        this.activeOperations.set(operationId, operation);
        
        // 同時実行数の制限チェック
        if (this.activeOperations.size > this.optimizations.maxConcurrentOperations) {
            console.warn(`同時実行数の制限を超えています: ${this.activeOperations.size}`);
        }
        
        // パフォーマンス測定開始
        performance.mark(`${operationId}-start`);
        
        return operation;
    }
    
    /**
     * 変換操作を終了
     * @param {string} operationId - 操作ID
     * @param {Object} result - 結果情報
     */
    endOperation(operationId, result = {}) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;
        
        const endTime = performance.now();
        const duration = endTime - operation.startTime;
        const endMemory = this.getCurrentMemoryUsage();
        const memoryDelta = endMemory - operation.startMemory;
        
        // パフォーマンス測定終了
        performance.mark(`${operationId}-end`);
        performance.measure(`image-conversion-${operationId}`, 
                          `${operationId}-start`, 
                          `${operationId}-end`);
        
        // メトリクスを記録
        const metrics = {
            operationId,
            duration,
            memoryDelta,
            startMemory: operation.startMemory,
            endMemory,
            context: operation.context,
            result,
            timestamp: new Date()
        };
        
        this.recordConversionMetrics(metrics);
        
        // 操作を完了
        operation.status = 'completed';
        operation.endTime = endTime;
        operation.duration = duration;
        
        this.activeOperations.delete(operationId);
        
        // パフォーマンス警告のチェック
        this.checkPerformanceWarnings(metrics);
        
        return metrics;
    }
    
    /**
     * 操作を失敗として記録
     * @param {string} operationId - 操作ID
     * @param {Error} error - エラー情報
     */
    failOperation(operationId, error) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;
        
        const endTime = performance.now();
        const duration = endTime - operation.startTime;
        
        const errorMetrics = {
            operationId,
            duration,
            error: error.message,
            context: operation.context,
            timestamp: new Date()
        };
        
        this.metrics.errors.push(errorMetrics);
        this.activeOperations.delete(operationId);
        
        console.error(`Operation ${operationId} failed after ${duration}ms:`, error);
    }
    
    /**
     * 現在のメモリ使用量を取得
     * @returns {number} メモリ使用量（バイト）
     */
    getCurrentMemoryUsage() {
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize;
        }
        
        // フォールバック: 推定値
        return this.estimateMemoryUsage();
    }
    
    /**
     * メモリ使用量を推定
     * @returns {number} 推定メモリ使用量
     */
    estimateMemoryUsage() {
        // Canvas要素のメモリ使用量を推定
        const canvases = document.querySelectorAll('canvas');
        let estimatedUsage = 0;
        
        canvases.forEach(canvas => {
            estimatedUsage += canvas.width * canvas.height * 4; // RGBA
        });
        
        return estimatedUsage;
    }
    
    /**
     * メモリ使用量を記録
     */
    recordMemoryUsage() {
        const usage = this.getCurrentMemoryUsage();
        const timestamp = new Date();
        
        this.metrics.memoryUsage.push({ usage, timestamp });
        
        // 古いデータを削除（最新100件を保持）
        if (this.metrics.memoryUsage.length > 100) {
            this.metrics.memoryUsage.shift();
        }
        
        // メモリ警告のチェック
        if (usage > this.limits.warningMemoryUsage) {
            this.handleMemoryWarning(usage);
        }
        
        if (usage > this.limits.maxMemoryUsage) {
            this.handleMemoryLimit(usage);
        }
    }
    
    /**
     * 変換メトリクスを記録
     * @param {Object} metrics - メトリクス情報
     */
    recordConversionMetrics(metrics) {
        this.metrics.conversions.push(metrics);
        this.metrics.processingTimes.push({
            duration: metrics.duration,
            fileSize: metrics.context.fileSize,
            format: metrics.context.format,
            timestamp: metrics.timestamp
        });
        
        // 古いデータを削除（最新200件を保持）
        if (this.metrics.conversions.length > 200) {
            this.metrics.conversions.shift();
        }
        
        if (this.metrics.processingTimes.length > 200) {
            this.metrics.processingTimes.shift();
        }
    }
    
    /**
     * パフォーマンスエントリを記録
     * @param {PerformanceEntry} entry - パフォーマンスエントリ
     */
    recordPerformanceEntry(entry) {
        console.log('Performance entry:', entry.name, entry.duration + 'ms');
    }
    
    /**
     * パフォーマンス警告をチェック
     * @param {Object} metrics - メトリクス情報
     */
    checkPerformanceWarnings(metrics) {
        // 処理時間の警告
        if (metrics.duration > this.limits.warningProcessingTime) {
            console.warn(`処理時間が長すぎます: ${metrics.duration}ms`);
            this.dispatchEvent('performance-warning', {
                type: 'processing-time',
                value: metrics.duration,
                limit: this.limits.warningProcessingTime
            });
        }
        
        // メモリ使用量の警告
        if (metrics.memoryDelta > this.limits.warningMemoryUsage / 2) {
            console.warn(`メモリ使用量の増加が大きすぎます: ${metrics.memoryDelta} bytes`);
            this.dispatchEvent('performance-warning', {
                type: 'memory-delta',
                value: metrics.memoryDelta,
                limit: this.limits.warningMemoryUsage / 2
            });
        }
    }
    
    /**
     * メモリ警告を処理
     * @param {number} usage - 現在のメモリ使用量
     */
    handleMemoryWarning(usage) {
        console.warn(`メモリ使用量警告: ${(usage / 1024 / 1024).toFixed(1)}MB`);
        
        this.dispatchEvent('memory-warning', {
            usage,
            limit: this.limits.warningMemoryUsage,
            percentage: (usage / this.limits.maxMemoryUsage * 100).toFixed(1)
        });
        
        // 自動クリーンアップを実行
        if (this.optimizations.enableMemoryCleanup) {
            this.performMemoryCleanup();
        }
    }
    
    /**
     * メモリ制限を処理
     * @param {number} usage - 現在のメモリ使用量
     */
    handleMemoryLimit(usage) {
        console.error(`メモリ制限に達しました: ${(usage / 1024 / 1024).toFixed(1)}MB`);
        
        this.dispatchEvent('memory-limit', {
            usage,
            limit: this.limits.maxMemoryUsage
        });
        
        // 強制的なメモリクリーンアップ
        this.performAggressiveMemoryCleanup();
    }
    
    /**
     * メモリクリーンアップを実行
     */
    performMemoryCleanup() {
        // 未使用のCanvas要素をクリーンアップ
        const canvases = document.querySelectorAll('canvas:not([data-keep])');
        canvases.forEach(canvas => {
            if (!canvas.closest('.preview-container')) {
                canvas.width = 1;
                canvas.height = 1;
            }
        });
        
        // ガベージコレクションを促進
        if (window.gc) {
            window.gc();
        }
        
        console.log('メモリクリーンアップを実行しました');
    }
    
    /**
     * 積極的なメモリクリーンアップを実行
     */
    performAggressiveMemoryCleanup() {
        // 全ての非必須Canvas要素をクリーンアップ
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            if (!canvas.hasAttribute('data-essential')) {
                canvas.width = 1;
                canvas.height = 1;
            }
        });
        
        // 古いメトリクスデータを削除
        this.metrics.conversions = this.metrics.conversions.slice(-50);
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50);
        this.metrics.processingTimes = this.metrics.processingTimes.slice(-50);
        
        // 強制ガベージコレクション
        if (window.gc) {
            window.gc();
        }
        
        console.log('積極的なメモリクリーンアップを実行しました');
    }
    
    /**
     * ファイルサイズの最適化を提案
     * @param {number} fileSize - ファイルサイズ
     * @param {string} format - ファイル形式
     * @returns {Object} 最適化提案
     */
    suggestOptimization(fileSize, format) {
        const suggestions = [];
        
        if (fileSize > this.limits.maxFileSize) {
            suggestions.push({
                type: 'file-size',
                message: 'ファイルサイズが大きすぎます',
                suggestion: 'より小さなファイルを使用してください',
                priority: 'high'
            });
        }
        
        if (fileSize > this.limits.maxFileSize / 2) {
            suggestions.push({
                type: 'processing-time',
                message: '処理に時間がかかる可能性があります',
                suggestion: 'チャンク処理を有効にすることを推奨します',
                priority: 'medium'
            });
        }
        
        // 形式固有の提案
        if (format === 'gif' && fileSize > 1024 * 1024) {
            suggestions.push({
                type: 'format-optimization',
                message: 'GIFファイルが大きすぎます',
                suggestion: 'PNG形式への変換を推奨します',
                priority: 'medium'
            });
        }
        
        return {
            hasOptimizations: suggestions.length > 0,
            suggestions
        };
    }
    
    /**
     * タイムアウト処理を作成
     * @param {number} timeout - タイムアウト時間（ミリ秒）
     * @param {string} operationId - 操作ID
     * @returns {number} タイマーID
     */
    createTimeout(timeout, operationId) {
        return setTimeout(() => {
            const operation = this.activeOperations.get(operationId);
            if (operation) {
                this.failOperation(operationId, new Error('Operation timed out'));
                this.dispatchEvent('operation-timeout', {
                    operationId,
                    timeout,
                    duration: performance.now() - operation.startTime
                });
            }
        }, timeout);
    }
    
    /**
     * パフォーマンス統計を取得
     * @returns {Object} 統計情報
     */
    getPerformanceStats() {
        const conversions = this.metrics.conversions;
        const processingTimes = this.metrics.processingTimes;
        
        if (conversions.length === 0) {
            return {
                totalConversions: 0,
                averageProcessingTime: 0,
                averageMemoryUsage: 0,
                successRate: 100
            };
        }
        
        const totalTime = processingTimes.reduce((sum, p) => sum + p.duration, 0);
        const totalMemory = conversions.reduce((sum, c) => sum + Math.abs(c.memoryDelta), 0);
        const successfulConversions = conversions.filter(c => !c.error).length;
        
        return {
            totalConversions: conversions.length,
            averageProcessingTime: Math.round(totalTime / processingTimes.length),
            averageMemoryUsage: Math.round(totalMemory / conversions.length),
            successRate: Math.round((successfulConversions / conversions.length) * 100),
            currentMemoryUsage: this.getCurrentMemoryUsage(),
            activeOperations: this.activeOperations.size,
            memoryUtilization: Math.round((this.getCurrentMemoryUsage() / this.limits.maxMemoryUsage) * 100)
        };
    }
    
    /**
     * イベントを発行
     * @param {string} eventType - イベントタイプ
     * @param {Object} detail - イベント詳細
     */
    dispatchEvent(eventType, detail) {
        const event = new CustomEvent(`performance-${eventType}`, { detail });
        window.dispatchEvent(event);
    }
    
    /**
     * 監視を停止
     */
    stop() {
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
        }
        
        // 全ての進行中の操作をキャンセル
        this.activeOperations.forEach((operation, operationId) => {
            this.failOperation(operationId, new Error('Monitor stopped'));
        });
        
        console.log('Performance monitoring stopped');
    }
    
    /**
     * 設定を更新
     * @param {Object} newLimits - 新しい制限値
     * @param {Object} newOptimizations - 新しい最適化設定
     */
    updateSettings(newLimits = {}, newOptimizations = {}) {
        this.limits = { ...this.limits, ...newLimits };
        this.optimizations = { ...this.optimizations, ...newOptimizations };
        
        console.log('Performance settings updated:', {
            limits: this.limits,
            optimizations: this.optimizations
        });
    }
}