// データクリーンアップ管理クラス
export class DataCleanupManager {
    constructor() {
        this.cleanupTasks = new Map();
        this.blobUrls = new Set();
        this.canvasElements = new Set();
        this.temporaryFiles = new Map();
        this.isCleanupActive = false;
        this.cleanupInterval = null;
    }

    /**
     * データクリーンアップ管理の初期化
     */
    initialize() {
        try {
            console.log('データクリーンアップ管理を初期化中...');
            
            // 自動クリーンアップの設定
            this.setupAutomaticCleanup();
            
            // ブラウザイベントの監視
            this.setupBrowserEventListeners();
            
            // メモリ監視の開始
            this.startMemoryMonitoring();
            
            console.log('✓ データクリーンアップ管理の初期化が完了しました');
            
        } catch (error) {
            console.error('データクリーンアップ管理の初期化に失敗:', error);
            throw error;
        }
    }

    /**
     * 自動クリーンアップの設定
     */
    setupAutomaticCleanup() {
        // 定期的なクリーンアップ（2分間隔）
        this.cleanupInterval = setInterval(() => {
            this.performPeriodicCleanup();
        }, 2 * 60 * 1000);

        console.log('✓ 自動クリーンアップを設定しました');
    }

    /**
     * ブラウザイベントの監視
     */
    setupBrowserEventListeners() {
        // ページ離脱時の完全クリーンアップ
        window.addEventListener('beforeunload', () => {
            this.performCompleteCleanup();
        });

        // ページ非表示時のクリーンアップ
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performPartialCleanup();
            }
        });

        // メモリ不足時のクリーンアップ
        if ('memory' in performance) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, 30 * 1000); // 30秒間隔
        }

        console.log('✓ ブラウザイベントリスナーを設定しました');
    }

    /**
     * メモリ監視の開始
     */
    startMemoryMonitoring() {
        if ('memory' in performance) {
            console.log('✓ メモリ監視を開始しました');
        } else {
            console.log('⚠️ メモリ監視はこのブラウザでサポートされていません');
        }
    }

    /**
     * Blob URLの登録
     */
    registerBlobUrl(url, description = '') {
        this.blobUrls.add({
            url,
            description,
            timestamp: Date.now()
        });
        console.log(`Blob URL登録: ${description || url}`);
    }

    /**
     * Canvas要素の登録
     */
    registerCanvas(canvas, description = '') {
        this.canvasElements.add({
            canvas,
            description,
            timestamp: Date.now()
        });
        console.log(`Canvas要素登録: ${description}`);
    }

    /**
     * 一時ファイルデータの登録
     */
    registerTemporaryFile(key, fileData, metadata = {}) {
        this.temporaryFiles.set(key, {
            data: fileData,
            metadata,
            timestamp: Date.now()
        });
        console.log(`一時ファイル登録: ${key}`);
    }

    /**
     * クリーンアップタスクの登録
     */
    registerCleanupTask(key, cleanupFunction, priority = 'normal') {
        this.cleanupTasks.set(key, {
            cleanup: cleanupFunction,
            priority,
            timestamp: Date.now()
        });
        console.log(`クリーンアップタスク登録: ${key} (優先度: ${priority})`);
    }

    /**
     * Blob URLのクリーンアップ
     */
    cleanupBlobUrls() {
        let cleanedCount = 0;
        
        for (const blobInfo of this.blobUrls) {
            try {
                URL.revokeObjectURL(blobInfo.url);
                cleanedCount++;
                console.log(`Blob URL解放: ${blobInfo.description || blobInfo.url}`);
            } catch (error) {
                console.error(`Blob URL解放エラー: ${blobInfo.url}`, error);
            }
        }
        
        this.blobUrls.clear();
        console.log(`✓ ${cleanedCount}個のBlob URLを解放しました`);
    }

    /**
     * Canvas要素のクリーンアップ
     */
    cleanupCanvasElements() {
        let cleanedCount = 0;
        
        for (const canvasInfo of this.canvasElements) {
            try {
                const { canvas } = canvasInfo;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    // Canvas内容をクリア
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Canvas サイズをリセット
                    canvas.width = 1;
                    canvas.height = 1;
                    
                    cleanedCount++;
                    console.log(`Canvas要素クリア: ${canvasInfo.description}`);
                }
            } catch (error) {
                console.error(`Canvas要素クリアエラー:`, error);
            }
        }
        
        this.canvasElements.clear();
        console.log(`✓ ${cleanedCount}個のCanvas要素をクリアしました`);
    }

    /**
     * 一時ファイルデータのクリーンアップ
     */
    cleanupTemporaryFiles() {
        let cleanedCount = 0;
        
        for (const [key, fileInfo] of this.temporaryFiles.entries()) {
            try {
                // ファイルデータを削除
                if (fileInfo.data) {
                    if (typeof fileInfo.data === 'object') {
                        // オブジェクトのプロパティを削除
                        Object.keys(fileInfo.data).forEach(prop => {
                            delete fileInfo.data[prop];
                        });
                    }
                    fileInfo.data = null;
                }
                
                cleanedCount++;
                console.log(`一時ファイルデータ削除: ${key}`);
            } catch (error) {
                console.error(`一時ファイルデータ削除エラー (${key}):`, error);
            }
        }
        
        this.temporaryFiles.clear();
        console.log(`✓ ${cleanedCount}個の一時ファイルデータを削除しました`);
    }

    /**
     * 登録されたクリーンアップタスクの実行
     */
    executeCleanupTasks(priorityFilter = null) {
        let executedCount = 0;
        
        // 優先度順にソート
        const sortedTasks = Array.from(this.cleanupTasks.entries()).sort((a, b) => {
            const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
            return priorityOrder[b[1].priority] - priorityOrder[a[1].priority];
        });
        
        for (const [key, taskInfo] of sortedTasks) {
            if (priorityFilter && taskInfo.priority !== priorityFilter) {
                continue;
            }
            
            try {
                taskInfo.cleanup();
                executedCount++;
                console.log(`クリーンアップタスク実行: ${key}`);
            } catch (error) {
                console.error(`クリーンアップタスクエラー (${key}):`, error);
            }
        }
        
        // 実行したタスクを削除
        if (!priorityFilter) {
            this.cleanupTasks.clear();
        } else {
            for (const [key, taskInfo] of this.cleanupTasks.entries()) {
                if (taskInfo.priority === priorityFilter) {
                    this.cleanupTasks.delete(key);
                }
            }
        }
        
        console.log(`✓ ${executedCount}個のクリーンアップタスクを実行しました`);
    }

    /**
     * 定期的なクリーンアップ
     */
    performPeriodicCleanup() {
        if (this.isCleanupActive) {
            console.log('クリーンアップが既に実行中です');
            return;
        }
        
        this.isCleanupActive = true;
        console.log('定期的なクリーンアップを実行中...');
        
        try {
            // 古いデータのクリーンアップ（5分以上前のデータ）
            const maxAge = 5 * 60 * 1000;
            const now = Date.now();
            
            // 古いBlob URLを削除
            const oldBlobUrls = Array.from(this.blobUrls).filter(
                blobInfo => now - blobInfo.timestamp > maxAge
            );
            for (const blobInfo of oldBlobUrls) {
                try {
                    URL.revokeObjectURL(blobInfo.url);
                    this.blobUrls.delete(blobInfo);
                } catch (error) {
                    console.error('古いBlob URL削除エラー:', error);
                }
            }
            
            // 古い一時ファイルを削除
            for (const [key, fileInfo] of this.temporaryFiles.entries()) {
                if (now - fileInfo.timestamp > maxAge) {
                    this.temporaryFiles.delete(key);
                }
            }
            
            // 低優先度のクリーンアップタスクを実行
            this.executeCleanupTasks('low');
            
            console.log('✓ 定期的なクリーンアップが完了しました');
            
        } catch (error) {
            console.error('定期的なクリーンアップエラー:', error);
        } finally {
            this.isCleanupActive = false;
        }
    }

    /**
     * 部分的なクリーンアップ（ページ非表示時）
     */
    performPartialCleanup() {
        console.log('部分的なクリーンアップを実行中...');
        
        try {
            // 高優先度のクリーンアップタスクのみ実行
            this.executeCleanupTasks('high');
            
            // 使用されていないCanvas要素をクリア
            this.cleanupUnusedCanvasElements();
            
            console.log('✓ 部分的なクリーンアップが完了しました');
            
        } catch (error) {
            console.error('部分的なクリーンアップエラー:', error);
        }
    }

    /**
     * 完全なクリーンアップ（ページ離脱時）
     */
    performCompleteCleanup() {
        console.log('完全なクリーンアップを実行中...');
        
        try {
            // すべてのBlob URLを解放
            this.cleanupBlobUrls();
            
            // すべてのCanvas要素をクリア
            this.cleanupCanvasElements();
            
            // すべての一時ファイルデータを削除
            this.cleanupTemporaryFiles();
            
            // すべてのクリーンアップタスクを実行
            this.executeCleanupTasks();
            
            // 定期クリーンアップを停止
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
            
            console.log('✓ 完全なクリーンアップが完了しました');
            
        } catch (error) {
            console.error('完全なクリーンアップエラー:', error);
        }
    }

    /**
     * 使用されていないCanvas要素のクリーンアップ
     */
    cleanupUnusedCanvasElements() {
        for (const canvasInfo of this.canvasElements) {
            const { canvas } = canvasInfo;
            
            // DOMに存在しないCanvas要素をクリーンアップ
            if (!document.contains(canvas)) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                this.canvasElements.delete(canvasInfo);
                console.log(`未使用Canvas要素を削除: ${canvasInfo.description}`);
            }
        }
    }

    /**
     * メモリ使用量のチェック
     */
    checkMemoryUsage() {
        if (!('memory' in performance)) return;
        
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const usagePercent = (usedMB / limitMB) * 100;
        
        console.log(`メモリ使用量: ${usedMB}MB / ${limitMB}MB (${usagePercent.toFixed(1)}%)`);
        
        // メモリ使用量が80%を超えた場合、緊急クリーンアップ
        if (usagePercent > 80) {
            console.warn('⚠️ メモリ使用量が高いため、緊急クリーンアップを実行します');
            this.performEmergencyCleanup();
        }
    }

    /**
     * 緊急クリーンアップ
     */
    performEmergencyCleanup() {
        console.log('🚨 緊急クリーンアップを実行中...');
        
        try {
            // すべてのクリーンアップを強制実行
            this.cleanupBlobUrls();
            this.cleanupCanvasElements();
            this.cleanupTemporaryFiles();
            this.executeCleanupTasks();
            
            // ガベージコレクションを促す
            if (window.gc) {
                window.gc();
            }
            
            console.log('✓ 緊急クリーンアップが完了しました');
            
        } catch (error) {
            console.error('緊急クリーンアップエラー:', error);
        }
    }

    /**
     * セキュアなデータ削除
     */
    secureDataDeletion(data) {
        try {
            if (typeof data === 'string') {
                // 文字列データの上書き
                data = '0'.repeat(data.length);
            } else if (data instanceof ArrayBuffer) {
                // ArrayBufferの上書き
                const view = new Uint8Array(data);
                view.fill(0);
            } else if (data instanceof Uint8Array) {
                // Uint8Arrayの上書き
                data.fill(0);
            } else if (typeof data === 'object' && data !== null) {
                // オブジェクトのプロパティを削除
                Object.keys(data).forEach(key => {
                    delete data[key];
                });
            }
            
            console.log('✓ セキュアなデータ削除を実行しました');
            
        } catch (error) {
            console.error('セキュアなデータ削除エラー:', error);
        }
    }

    /**
     * クリーンアップ状態の取得
     */
    getCleanupStatus() {
        return {
            blobUrlCount: this.blobUrls.size,
            canvasElementCount: this.canvasElements.size,
            temporaryFileCount: this.temporaryFiles.size,
            cleanupTaskCount: this.cleanupTasks.size,
            isCleanupActive: this.isCleanupActive,
            hasCleanupInterval: this.cleanupInterval !== null
        };
    }

    /**
     * 手動クリーンアップの実行
     */
    manualCleanup() {
        console.log('手動クリーンアップを実行中...');
        this.performPartialCleanup();
    }

    /**
     * クリーンアップ管理の終了
     */
    destroy() {
        console.log('データクリーンアップ管理を終了中...');
        
        // 完全なクリーンアップを実行
        this.performCompleteCleanup();
        
        console.log('✓ データクリーンアップ管理を終了しました');
    }
}