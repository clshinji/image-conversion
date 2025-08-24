// セキュアなデータ処理クラス
export class SecureDataHandler {
    constructor(dataCleanupManager = null) {
        this.dataCleanupManager = dataCleanupManager;
        this.activeDataSources = new Map();
        this.securityLevel = 'high'; // high, medium, low
    }

    /**
     * セキュアなファイル読み込み
     */
    async secureFileRead(file, options = {}) {
        const dataId = this.generateDataId();
        
        try {
            // ファイル読み込み前の検証
            this.validateFileForSecurity(file);
            
            // 読み込み処理
            const result = await this.performSecureRead(file, options);
            
            // データソースを登録
            this.registerDataSource(dataId, {
                type: 'file',
                source: file,
                data: result,
                timestamp: Date.now(),
                options
            });
            
            return { dataId, ...result };
            
        } catch (error) {
            console.error('セキュアファイル読み込みエラー:', error);
            this.cleanupDataSource(dataId);
            throw error;
        }
    }

    /**
     * セキュアなCanvas作成
     */
    createSecureCanvas(width, height, options = {}) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // セキュリティ属性を設定
        canvas.dataset.secure = 'true';
        canvas.dataset.temporary = 'true';
        canvas.dataset.createdAt = Date.now().toString();
        
        // データクリーンアップ管理に登録
        if (this.dataCleanupManager) {
            this.dataCleanupManager.registerCanvas(canvas, options.description || 'Secure canvas');
        }
        
        // セキュアなクリーンアップ関数を追加
        canvas.secureCleanup = () => {
            this.secureCanvasCleanup(canvas);
        };
        
        return { canvas, context: ctx };
    }

    /**
     * セキュアなBlob URL作成
     */
    createSecureBlobUrl(data, mimeType, description = '') {
        try {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            // データクリーンアップ管理に登録
            if (this.dataCleanupManager) {
                this.dataCleanupManager.registerBlobUrl(url, description);
            }
            
            // 自動解放タイマーを設定（5分後）
            setTimeout(() => {
                this.secureUrlCleanup(url);
            }, 5 * 60 * 1000);
            
            return { url, blob };
            
        } catch (error) {
            console.error('セキュアBlob URL作成エラー:', error);
            throw error;
        }
    }

    /**
     * セキュアなデータ変換
     */
    async secureDataConversion(inputData, conversionFunction, options = {}) {
        const conversionId = this.generateDataId();
        
        try {
            // 変換前のデータ検証
            this.validateDataForConversion(inputData);
            
            // 変換処理の実行
            const result = await this.executeSecureConversion(
                inputData, 
                conversionFunction, 
                options
            );
            
            // 変換結果を登録
            this.registerDataSource(conversionId, {
                type: 'conversion',
                input: inputData,
                output: result,
                timestamp: Date.now(),
                options
            });
            
            return { conversionId, ...result };
            
        } catch (error) {
            console.error('セキュアデータ変換エラー:', error);
            this.cleanupDataSource(conversionId);
            throw error;
        }
    }

    /**
     * ファイルのセキュリティ検証
     */
    validateFileForSecurity(file) {
        // ファイルサイズチェック
        if (file.size > 100 * 1024 * 1024) { // 100MB制限
            throw new Error('ファイルサイズが制限を超えています');
        }
        
        // ファイル名の検証
        if (this.containsSuspiciousCharacters(file.name)) {
            throw new Error('ファイル名に不正な文字が含まれています');
        }
        
        // MIMEタイプの検証
        if (this.isSuspiciousMimeType(file.type)) {
            throw new Error('サポートされていないファイル形式です');
        }
    }

    /**
     * データの変換前検証
     */
    validateDataForConversion(data) {
        // データサイズチェック
        if (data instanceof ArrayBuffer && data.byteLength > 50 * 1024 * 1024) {
            throw new Error('データサイズが大きすぎます');
        }
        
        // 文字列データの検証
        if (typeof data === 'string' && data.length > 10 * 1024 * 1024) {
            throw new Error('文字列データが大きすぎます');
        }
    }

    /**
     * 疑わしい文字の検出
     */
    containsSuspiciousCharacters(filename) {
        const suspiciousPatterns = [
            /[<>:"|?*]/,  // Windows禁止文字
            /\.\./,       // ディレクトリトラバーサル
            /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows予約名
            /^\./,        // 隠しファイル
            /\x00/        // NULL文字
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(filename));
    }

    /**
     * 疑わしいMIMEタイプの検出
     */
    isSuspiciousMimeType(mimeType) {
        const allowedTypes = [
            'image/svg+xml',
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/gif',
            'text/xml',
            'application/xml'
        ];
        
        return mimeType && !allowedTypes.includes(mimeType);
    }

    /**
     * セキュアな読み込み処理
     */
    async performSecureRead(file, options) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const timeoutId = setTimeout(() => {
                reader.abort();
                reject(new Error('ファイル読み込みがタイムアウトしました'));
            }, options.timeout || 30000);
            
            reader.onload = (event) => {
                clearTimeout(timeoutId);
                
                try {
                    const result = event.target.result;
                    
                    // 読み込み結果の検証
                    this.validateReadResult(result, file);
                    
                    resolve({
                        data: result,
                        size: result.byteLength || result.length,
                        type: file.type,
                        name: file.name
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('ファイル読み込みエラー'));
            };
            
            reader.onabort = () => {
                clearTimeout(timeoutId);
                reject(new Error('ファイル読み込みが中断されました'));
            };
            
            // 読み込み方法を選択
            if (options.readAs === 'text') {
                reader.readAsText(file, 'UTF-8');
            } else if (options.readAs === 'dataUrl') {
                reader.readAsDataURL(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    /**
     * 読み込み結果の検証
     */
    validateReadResult(result, originalFile) {
        // サイズの整合性チェック
        const resultSize = result.byteLength || result.length;
        if (Math.abs(resultSize - originalFile.size) > 1024) { // 1KB以上の差異
            console.warn('読み込み結果のサイズが元ファイルと異なります');
        }
        
        // 空データのチェック
        if (resultSize === 0) {
            throw new Error('読み込み結果が空です');
        }
    }

    /**
     * セキュアな変換実行
     */
    async executeSecureConversion(inputData, conversionFunction, options) {
        // 変換前のメモリ使用量を記録
        const initialMemory = this.getMemoryUsage();
        
        try {
            // タイムアウト付きで変換実行
            const result = await this.withTimeout(
                conversionFunction(inputData, options),
                options.timeout || 60000
            );
            
            // 変換後のメモリ使用量をチェック
            const finalMemory = this.getMemoryUsage();
            if (finalMemory.used > initialMemory.used * 2) {
                console.warn('変換処理でメモリ使用量が大幅に増加しました');
            }
            
            return result;
            
        } catch (error) {
            // エラー時のクリーンアップ
            this.performEmergencyCleanup();
            throw error;
        }
    }

    /**
     * タイムアウト付き実行
     */
    withTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('処理がタイムアウトしました')), timeout)
            )
        ]);
    }

    /**
     * メモリ使用量の取得
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    /**
     * データソースの登録
     */
    registerDataSource(id, sourceInfo) {
        this.activeDataSources.set(id, sourceInfo);
        
        // データクリーンアップ管理にクリーンアップタスクを登録
        if (this.dataCleanupManager) {
            this.dataCleanupManager.registerCleanupTask(
                `data-source-${id}`,
                () => this.cleanupDataSource(id),
                'normal'
            );
        }
    }

    /**
     * データソースのクリーンアップ
     */
    cleanupDataSource(id) {
        const sourceInfo = this.activeDataSources.get(id);
        if (!sourceInfo) return;
        
        try {
            // データタイプに応じたクリーンアップ
            if (sourceInfo.type === 'file' && sourceInfo.data) {
                this.secureDataDeletion(sourceInfo.data.data);
            } else if (sourceInfo.type === 'conversion') {
                if (sourceInfo.output && sourceInfo.output.data) {
                    this.secureDataDeletion(sourceInfo.output.data);
                }
            }
            
            // ソース情報を削除
            this.activeDataSources.delete(id);
            
            console.log(`データソースをクリーンアップ: ${id}`);
            
        } catch (error) {
            console.error(`データソースクリーンアップエラー (${id}):`, error);
        }
    }

    /**
     * セキュアなCanvas要素のクリーンアップ
     */
    secureCanvasCleanup(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Canvas内容をクリア
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Canvas内容を黒で上書き（セキュリティ強化）
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // サイズをリセット
                canvas.width = 1;
                canvas.height = 1;
            }
            
            // セキュリティ属性を削除
            delete canvas.dataset.secure;
            delete canvas.dataset.temporary;
            delete canvas.dataset.createdAt;
            
            console.log('Canvas要素をセキュアにクリーンアップしました');
            
        } catch (error) {
            console.error('Canvasセキュアクリーンアップエラー:', error);
        }
    }

    /**
     * セキュアなURL解放
     */
    secureUrlCleanup(url) {
        try {
            URL.revokeObjectURL(url);
            console.log(`Blob URLを解放: ${url}`);
        } catch (error) {
            console.error('URL解放エラー:', error);
        }
    }

    /**
     * セキュアなデータ削除
     */
    secureDataDeletion(data) {
        try {
            if (typeof data === 'string') {
                // 文字列データの上書き
                data = '\0'.repeat(data.length);
            } else if (data instanceof ArrayBuffer) {
                // ArrayBufferの上書き
                const view = new Uint8Array(data);
                view.fill(0);
            } else if (data instanceof Uint8Array) {
                // Uint8Arrayの上書き
                data.fill(0);
            } else if (data && typeof data === 'object') {
                // オブジェクトのプロパティを削除
                Object.keys(data).forEach(key => {
                    delete data[key];
                });
            }
            
            console.log('データをセキュアに削除しました');
            
        } catch (error) {
            console.error('セキュアデータ削除エラー:', error);
        }
    }

    /**
     * 緊急クリーンアップ
     */
    performEmergencyCleanup() {
        console.log('🚨 緊急クリーンアップを実行中...');
        
        try {
            // すべてのアクティブなデータソースをクリーンアップ
            for (const [id, sourceInfo] of this.activeDataSources.entries()) {
                this.cleanupDataSource(id);
            }
            
            // データクリーンアップ管理の緊急クリーンアップを実行
            if (this.dataCleanupManager) {
                this.dataCleanupManager.performEmergencyCleanup();
            }
            
            console.log('✓ 緊急クリーンアップが完了しました');
            
        } catch (error) {
            console.error('緊急クリーンアップエラー:', error);
        }
    }

    /**
     * データIDの生成
     */
    generateDataId() {
        return `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * セキュリティレベルの設定
     */
    setSecurityLevel(level) {
        if (['high', 'medium', 'low'].includes(level)) {
            this.securityLevel = level;
            console.log(`セキュリティレベルを設定: ${level}`);
        } else {
            throw new Error('無効なセキュリティレベルです');
        }
    }

    /**
     * セキュリティ状態の取得
     */
    getSecurityStatus() {
        return {
            securityLevel: this.securityLevel,
            activeDataSources: this.activeDataSources.size,
            memoryUsage: this.getMemoryUsage(),
            hasDataCleanupManager: !!this.dataCleanupManager
        };
    }

    /**
     * 全データのクリーンアップ
     */
    cleanupAllData() {
        console.log('全データのクリーンアップを実行中...');
        
        // すべてのデータソースをクリーンアップ
        for (const id of this.activeDataSources.keys()) {
            this.cleanupDataSource(id);
        }
        
        console.log('✓ 全データのクリーンアップが完了しました');
    }

    /**
     * セキュアデータハンドラーの終了
     */
    destroy() {
        console.log('セキュアデータハンドラーを終了中...');
        
        // 全データをクリーンアップ
        this.cleanupAllData();
        
        // 参照をクリア
        this.dataCleanupManager = null;
        
        console.log('✓ セキュアデータハンドラーを終了しました');
    }
}