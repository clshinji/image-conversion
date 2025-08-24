// デバッグ支援機能

/**
 * デバッグ支援クラス
 */
export class DebugSupport {
    constructor() {
        this.debugData = {
            logs: [],
            errors: [],
            performance: [],
            userActions: [],
            systemInfo: this.collectSystemInfo()
        };
        
        this.isEnabled = true;
        this.maxLogEntries = 1000;
        
        // エラーハンドリングを設定
        this.setupErrorHandling();
        
        // パフォーマンス監視を設定
        this.setupPerformanceMonitoring();
    }
    
    /**
     * デバッグログを記録
     * @param {string} level - ログレベル
     * @param {string} message - メッセージ
     * @param {object} context - コンテキスト情報
     */
    log(level, message, context = {}) {
        if (!this.isEnabled) return;
        
        const logEntry = {
            timestamp: new Date(),
            level,
            message,
            context,
            stack: new Error().stack,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.debugData.logs.push(logEntry);
        
        // ログ数制限
        if (this.debugData.logs.length > this.maxLogEntries) {
            this.debugData.logs.shift();
        }
        
        // コンソール出力
        const consoleMethod = console[level] || console.log;
        consoleMethod(`[DEBUG] ${message}`, context);
    }
    
    /**
     * エラーを記録
     * @param {Error} error - エラーオブジェクト
     * @param {object} context - コンテキスト情報
     */
    recordError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date(),
            message: error.message,
            stack: error.stack,
            name: error.name,
            type: error.type || 'unknown',
            context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.debugData.errors.push(errorEntry);
        this.log('error', `Error recorded: ${error.message}`, context);
    }
    
    /**
     * パフォーマンス情報を記録
     * @param {string} operation - 操作名
     * @param {number} duration - 実行時間
     * @param {object} metadata - メタデータ
     */
    recordPerformance(operation, duration, metadata = {}) {
        const perfEntry = {
            timestamp: new Date(),
            operation,
            duration,
            metadata,
            memoryUsage: this.getCurrentMemoryUsage()
        };
        
        this.debugData.performance.push(perfEntry);
        this.log('info', `Performance: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    }
    
    /**
     * ユーザーアクションを記録
     * @param {string} action - アクション名
     * @param {object} details - 詳細情報
     */
    recordUserAction(action, details = {}) {
        const actionEntry = {
            timestamp: new Date(),
            action,
            details,
            url: window.location.href
        };
        
        this.debugData.userActions.push(actionEntry);
        this.log('info', `User action: ${action}`, details);
    }
    
    /**
     * システム情報を収集
     */
    collectSystemInfo() {
        return {
            browser: this.getBrowserInfo(),
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            timestamp: new Date()
        };
    }
    
    /**
     * ブラウザ情報を取得
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        // ブラウザ検出
        if (userAgent.includes('Chrome')) {
            browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browserName = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Edge')) {
            browserName = 'Edge';
            const match = userAgent.match(/Edge\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        }
        
        return {
            name: browserName,
            version: browserVersion,
            userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }
    
    /**
     * 現在のメモリ使用量を取得
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    /**
     * エラーハンドリングを設定
     */
    setupErrorHandling() {
        // グローバルエラーハンドラー
        window.addEventListener('error', (event) => {
            this.recordError(event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript'
            });
        });
        
        // Promise拒否ハンドラー
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError(new Error(event.reason), {
                type: 'promise_rejection',
                reason: event.reason
            });
        });
    }
    
    /**
     * パフォーマンス監視を設定
     */
    setupPerformanceMonitoring() {
        // ページロード時間を記録
        window.addEventListener('load', () => {
            if (performance.timing) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                this.recordPerformance('page_load', loadTime, {
                    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                    domComplete: performance.timing.domComplete - performance.timing.navigationStart
                });
            }
        });
        
        // リソース読み込み時間を監視
        if (performance.getEntriesByType) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        this.recordPerformance('resource_load', entry.duration, {
                            name: entry.name,
                            type: entry.initiatorType,
                            size: entry.transferSize
                        });
                    }
                });
            });
            
            try {
                observer.observe({ entryTypes: ['resource'] });
            } catch (error) {
                this.log('warn', 'PerformanceObserver not supported', { error: error.message });
            }
        }
    }
    
    /**
     * デバッグ情報をエクスポート
     * @returns {string} JSON形式のデバッグ情報
     */
    exportDebugData() {
        const exportData = {
            ...this.debugData,
            exportTimestamp: new Date(),
            summary: {
                totalLogs: this.debugData.logs.length,
                totalErrors: this.debugData.errors.length,
                totalPerformanceEntries: this.debugData.performance.length,
                totalUserActions: this.debugData.userActions.length
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * デバッグ情報をクリア
     */
    clearDebugData() {
        this.debugData.logs = [];
        this.debugData.errors = [];
        this.debugData.performance = [];
        this.debugData.userActions = [];
        this.log('info', 'Debug data cleared');
    }
    
    /**
     * デバッグパネルを表示
     */
    showDebugPanel() {
        const panelHTML = this.generateDebugPanelHTML();
        
        let panel = document.getElementById('debug-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'debug-panel';
            panel.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                width: 400px;
                max-height: 80vh;
                overflow-y: auto;
                background: #1e1e1e;
                color: #f8f8f2;
                border: 1px solid #444;
                border-radius: 8px;
                padding: 16px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                z-index: 10003;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            `;
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = panelHTML;
        
        // イベントリスナーを設定
        this.setupDebugPanelEvents(panel);
    }
    
    /**
     * デバッグパネルのHTMLを生成
     */
    generateDebugPanelHTML() {
        const recentErrors = this.debugData.errors.slice(-5);
        const recentLogs = this.debugData.logs.slice(-10);
        const recentPerformance = this.debugData.performance.slice(-5);
        
        return `
            <div class="debug-panel-header">
                <h3 style="margin: 0 0 10px 0; color: #61dafb;">🔍 デバッグパネル</h3>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">×</button>
            </div>
            
            <div class="debug-section">
                <h4 style="color: #f1c40f; margin: 10px 0 5px 0;">📊 統計</h4>
                <div style="font-size: 11px;">
                    <div>ログ: ${this.debugData.logs.length}</div>
                    <div>エラー: ${this.debugData.errors.length}</div>
                    <div>パフォーマンス: ${this.debugData.performance.length}</div>
                    <div>ユーザーアクション: ${this.debugData.userActions.length}</div>
                </div>
            </div>
            
            <div class="debug-section">
                <h4 style="color: #e74c3c; margin: 10px 0 5px 0;">❌ 最近のエラー</h4>
                <div style="max-height: 100px; overflow-y: auto; font-size: 10px;">
                    ${recentErrors.map(error => `
                        <div style="margin-bottom: 5px; padding: 3px; background: #2d1b1b; border-radius: 3px;">
                            <div style="color: #e74c3c;">${error.message}</div>
                            <div style="color: #666; font-size: 9px;">${error.timestamp.toLocaleTimeString()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="debug-section">
                <h4 style="color: #3498db; margin: 10px 0 5px 0;">📝 最近のログ</h4>
                <div style="max-height: 120px; overflow-y: auto; font-size: 10px;">
                    ${recentLogs.map(log => `
                        <div style="margin-bottom: 3px; color: ${this.getLogColor(log.level)};">
                            [${log.timestamp.toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="debug-section">
                <h4 style="color: #2ecc71; margin: 10px 0 5px 0;">⚡ パフォーマンス</h4>
                <div style="max-height: 80px; overflow-y: auto; font-size: 10px;">
                    ${recentPerformance.map(perf => `
                        <div style="margin-bottom: 3px;">
                            ${perf.operation}: ${perf.duration.toFixed(2)}ms
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="debug-actions" style="margin-top: 10px; text-align: center;">
                <button onclick="window.debugSupport.exportToClipboard()" style="margin: 2px; padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">
                    📋 エクスポート
                </button>
                <button onclick="window.debugSupport.clearDebugData(); window.debugSupport.showDebugPanel();" style="margin: 2px; padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">
                    🗑️ クリア
                </button>
                <button onclick="window.debugSupport.downloadDebugData()" style="margin: 2px; padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">
                    💾 ダウンロード
                </button>
            </div>
        `;
    }
    
    /**
     * ログレベルに応じた色を取得
     */
    getLogColor(level) {
        const colors = {
            error: '#e74c3c',
            warn: '#f1c40f',
            info: '#3498db',
            debug: '#95a5a6'
        };
        return colors[level] || '#f8f8f2';
    }
    
    /**
     * デバッグパネルのイベントを設定
     */
    setupDebugPanelEvents(panel) {
        // グローバルに公開
        window.debugSupport = this;
    }
    
    /**
     * クリップボードにエクスポート
     */
    async exportToClipboard() {
        try {
            const data = this.exportDebugData();
            await navigator.clipboard.writeText(data);
            alert('デバッグ情報がクリップボードにコピーされました');
        } catch (error) {
            console.error('クリップボードへのコピーに失敗:', error);
            this.downloadDebugData();
        }
    }
    
    /**
     * デバッグ情報をダウンロード
     */
    downloadDebugData() {
        const data = this.exportDebugData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * デバッグ機能を有効/無効にする
     * @param {boolean} enabled - 有効かどうか
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.log('info', `Debug support ${enabled ? 'enabled' : 'disabled'}`);
    }
}