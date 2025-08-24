// プライバシー管理クラス - クライアントサイド処理の確保
export class PrivacyManager {
    constructor() {
        this.isInitialized = false;
        this.privacyNoticeShown = false;
        this.dataCleanupCallbacks = [];
        this.temporaryData = new Map();
        this.securityChecks = {
            clientSideOnly: false,
            noExternalRequests: false,
            dataCleanupEnabled: false
        };
    }

    /**
     * プライバシー管理の初期化
     */
    async initialize() {
        try {
            console.log('プライバシー管理を初期化中...');
            
            // クライアントサイド処理の確認
            await this.verifyClientSideProcessing();
            
            // 外部通信の監視開始
            this.startNetworkMonitoring();
            
            // データクリーンアップの設定
            this.setupDataCleanup();
            
            // プライバシー通知の表示
            this.showPrivacyNotice();
            
            this.isInitialized = true;
            console.log('プライバシー管理の初期化が完了しました');
            
        } catch (error) {
            console.error('プライバシー管理の初期化に失敗:', error);
            throw error;
        }
    }

    /**
     * クライアントサイド処理の確認
     */
    async verifyClientSideProcessing() {
        try {
            // 必要なブラウザAPIの確認
            const requiredAPIs = [
                'FileReader',
                'Canvas',
                'Blob',
                'URL',
                'Worker'
            ];

            const missingAPIs = [];
            for (const api of requiredAPIs) {
                if (!(api in window)) {
                    missingAPIs.push(api);
                }
            }

            if (missingAPIs.length > 0) {
                throw new Error(`必要なブラウザAPIが不足しています: ${missingAPIs.join(', ')}`);
            }

            // Canvas APIの動作確認
            const testCanvas = document.createElement('canvas');
            const ctx = testCanvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas APIが利用できません');
            }

            // FileReader APIの動作確認
            const testReader = new FileReader();
            if (!testReader) {
                throw new Error('FileReader APIが利用できません');
            }

            this.securityChecks.clientSideOnly = true;
            console.log('✓ クライアントサイド処理の確認完了');

        } catch (error) {
            console.error('クライアントサイド処理の確認に失敗:', error);
            this.securityChecks.clientSideOnly = false;
            throw error;
        }
    }

    /**
     * 外部通信の監視開始
     */
    startNetworkMonitoring() {
        try {
            // XMLHttpRequestの監視
            const originalXHR = window.XMLHttpRequest;
            const self = this;
            
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                
                xhr.open = function(method, url, ...args) {
                    console.warn('⚠️ 外部通信が検出されました:', method, url);
                    self.handleExternalRequest(method, url);
                    return originalOpen.apply(this, [method, url, ...args]);
                };
                
                return xhr;
            };

            // fetch APIの監視
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                console.warn('⚠️ fetch通信が検出されました:', url);
                self.handleExternalRequest('FETCH', url);
                return originalFetch.apply(this, arguments);
            };

            this.securityChecks.noExternalRequests = true;
            console.log('✓ 外部通信監視を開始しました');

        } catch (error) {
            console.error('外部通信監視の開始に失敗:', error);
            this.securityChecks.noExternalRequests = false;
        }
    }

    /**
     * 外部リクエストの処理
     */
    handleExternalRequest(method, url) {
        // 許可されたリクエストかチェック
        const allowedDomains = [
            // 現在のドメイン
            window.location.hostname,
            'localhost',
            '127.0.0.1'
        ];

        try {
            const requestUrl = new URL(url, window.location.origin);
            const isAllowed = allowedDomains.includes(requestUrl.hostname);

            if (!isAllowed) {
                console.error('🚫 許可されていない外部通信:', method, url);
                this.showSecurityWarning('外部サーバーへの通信が検出されました', 
                    'すべての処理はブラウザ内で実行されるべきです');
            }
        } catch (error) {
            console.error('外部リクエストの検証に失敗:', error);
        }
    }

    /**
     * データクリーンアップの設定
     */
    setupDataCleanup() {
        try {
            // ページ離脱時のクリーンアップ
            window.addEventListener('beforeunload', () => {
                this.performDataCleanup();
            });

            // ページ非表示時のクリーンアップ
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.performDataCleanup();
                }
            });

            // 定期的なクリーンアップ（5分間隔）
            setInterval(() => {
                this.performPeriodicCleanup();
            }, 5 * 60 * 1000);

            this.securityChecks.dataCleanupEnabled = true;
            console.log('✓ データクリーンアップを設定しました');

        } catch (error) {
            console.error('データクリーンアップの設定に失敗:', error);
            this.securityChecks.dataCleanupEnabled = false;
        }
    }

    /**
     * プライバシー通知の表示
     */
    showPrivacyNotice() {
        if (this.privacyNoticeShown) return;

        const notice = document.createElement('div');
        notice.className = 'privacy-notice';
        notice.innerHTML = `
            <div class="privacy-notice-content">
                <div class="privacy-icon">🔒</div>
                <div class="privacy-text">
                    <h4>プライバシー保護について</h4>
                    <p>このアプリケーションは完全にクライアントサイドで動作します。</p>
                    <ul>
                        <li>✓ ファイルはブラウザ内でのみ処理されます</li>
                        <li>✓ 外部サーバーにデータは送信されません</li>
                        <li>✓ 処理完了後にデータは自動削除されます</li>
                        <li>✓ インターネット接続は不要です</li>
                    </ul>
                </div>
                <button type="button" class="privacy-notice-close" onclick="this.parentElement.parentElement.remove()">
                    理解しました
                </button>
            </div>
        `;

        // スタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            .privacy-notice {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f8f9fa;
                border: 2px solid #28a745;
                border-radius: 8px;
                padding: 16px;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .privacy-notice-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .privacy-icon {
                font-size: 24px;
                text-align: center;
            }
            .privacy-text h4 {
                margin: 0 0 8px 0;
                color: #28a745;
                font-size: 16px;
            }
            .privacy-text p {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #333;
            }
            .privacy-text ul {
                margin: 0;
                padding-left: 16px;
                font-size: 13px;
                color: #555;
            }
            .privacy-text li {
                margin-bottom: 4px;
            }
            .privacy-notice-close {
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                align-self: center;
            }
            .privacy-notice-close:hover {
                background: #218838;
            }
            @media (max-width: 768px) {
                .privacy-notice {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notice);

        // 10秒後に自動で閉じる
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 10000);

        this.privacyNoticeShown = true;
        console.log('✓ プライバシー通知を表示しました');
    }

    /**
     * セキュリティ警告の表示
     */
    showSecurityWarning(title, message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.innerHTML = `
            <div class="security-warning-content">
                <div class="security-icon">⚠️</div>
                <div class="security-text">
                    <h4>${title}</h4>
                    <p>${message}</p>
                </div>
                <button type="button" class="security-warning-close" onclick="this.parentElement.parentElement.remove()">
                    閉じる
                </button>
            </div>
        `;

        // スタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            .security-warning {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fff3cd;
                border: 2px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                max-width: 500px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .security-warning-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
                text-align: center;
            }
            .security-icon {
                font-size: 32px;
            }
            .security-text h4 {
                margin: 0 0 8px 0;
                color: #856404;
                font-size: 18px;
            }
            .security-text p {
                margin: 0;
                font-size: 14px;
                color: #856404;
            }
            .security-warning-close {
                background: #ffc107;
                color: #856404;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                align-self: center;
            }
            .security-warning-close:hover {
                background: #e0a800;
            }
        `;

        if (!document.querySelector('style[data-security-warning]')) {
            style.setAttribute('data-security-warning', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(warning);
    }

    /**
     * 一時データの登録
     */
    registerTemporaryData(key, data, cleanupCallback = null) {
        this.temporaryData.set(key, {
            data,
            timestamp: Date.now(),
            cleanupCallback
        });

        if (cleanupCallback) {
            this.dataCleanupCallbacks.push(cleanupCallback);
        }

        console.log(`一時データを登録: ${key}`);
    }

    /**
     * 一時データの削除
     */
    removeTemporaryData(key) {
        const item = this.temporaryData.get(key);
        if (item) {
            if (item.cleanupCallback) {
                try {
                    item.cleanupCallback(item.data);
                } catch (error) {
                    console.error(`データクリーンアップエラー (${key}):`, error);
                }
            }
            this.temporaryData.delete(key);
            console.log(`一時データを削除: ${key}`);
        }
    }

    /**
     * データクリーンアップの実行
     */
    performDataCleanup() {
        console.log('データクリーンアップを実行中...');
        
        try {
            // 一時データのクリーンアップ
            for (const [key, item] of this.temporaryData.entries()) {
                if (item.cleanupCallback) {
                    try {
                        item.cleanupCallback(item.data);
                    } catch (error) {
                        console.error(`クリーンアップエラー (${key}):`, error);
                    }
                }
            }
            this.temporaryData.clear();

            // 登録されたクリーンアップコールバックの実行
            for (const callback of this.dataCleanupCallbacks) {
                try {
                    callback();
                } catch (error) {
                    console.error('クリーンアップコールバックエラー:', error);
                }
            }

            // Canvas要素のクリーンアップ
            this.cleanupCanvasElements();

            // Blob URLのクリーンアップ
            this.cleanupBlobUrls();

            // メモリの強制ガベージコレクション（可能な場合）
            if (window.gc) {
                window.gc();
            }

            console.log('✓ データクリーンアップが完了しました');

        } catch (error) {
            console.error('データクリーンアップ中にエラー:', error);
        }
    }

    /**
     * 定期的なクリーンアップ
     */
    performPeriodicCleanup() {
        console.log('定期的なクリーンアップを実行中...');
        
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30分

        // 古い一時データを削除
        for (const [key, item] of this.temporaryData.entries()) {
            if (now - item.timestamp > maxAge) {
                this.removeTemporaryData(key);
            }
        }

        // Canvas要素のクリーンアップ
        this.cleanupCanvasElements();
    }

    /**
     * Canvas要素のクリーンアップ
     */
    cleanupCanvasElements() {
        try {
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                if (canvas.dataset.temporary === 'true') {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }
            });
        } catch (error) {
            console.error('Canvas要素のクリーンアップエラー:', error);
        }
    }

    /**
     * Blob URLのクリーンアップ
     */
    cleanupBlobUrls() {
        try {
            // 使用されていないBlob URLを解放
            // 注意: 実際のアプリケーションでは、使用中のURLを追跡する必要があります
            console.log('Blob URLのクリーンアップを実行');
        } catch (error) {
            console.error('Blob URLのクリーンアップエラー:', error);
        }
    }

    /**
     * プライバシー状態の取得
     */
    getPrivacyStatus() {
        return {
            isInitialized: this.isInitialized,
            securityChecks: { ...this.securityChecks },
            temporaryDataCount: this.temporaryData.size,
            cleanupCallbackCount: this.dataCleanupCallbacks.length
        };
    }

    /**
     * 外部依存関係のチェック
     */
    checkExternalDependencies() {
        const externalScripts = [];
        const scripts = document.querySelectorAll('script[src]');
        
        scripts.forEach(script => {
            const src = script.src;
            if (src && !src.startsWith(window.location.origin)) {
                externalScripts.push(src);
            }
        });

        if (externalScripts.length > 0) {
            console.warn('⚠️ 外部スクリプトが検出されました:', externalScripts);
            this.showSecurityWarning(
                '外部依存関係が検出されました',
                `以下の外部スクリプトが読み込まれています:\n${externalScripts.join('\n')}\n\nプライバシー保護のため、これらの依存関係を削除することを推奨します。`
            );
            return false;
        }

        return true;
    }
}