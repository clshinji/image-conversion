/**
 * 包括的エラーハンドリングと解決方法提示システム
 * 全ての変換エンジンのエラー処理を統一し、ユーザーフレンドリーなエラー回復機能を提供
 */
export class ErrorHandler {
    constructor(visualFeedback) {
        this.visualFeedback = visualFeedback;
        this.errorHistory = [];
        this.errorPatterns = new Map();
        this.solutionDatabase = new Map();
        this.retryQueue = new Map();
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            byCategory: {},
            bySeverity: {}
        };
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.setupErrorPatterns();
        this.setupSolutionDatabase();
        this.setupGlobalErrorHandling();
    }
    
    /**
     * エラーパターンの設定
     */
    setupErrorPatterns() {
        // ファイル関連エラー
        this.errorPatterns.set('FILE_TOO_LARGE', {
            pattern: /file.*too.*large|size.*exceed|ファイル.*大きすぎ/i,
            category: 'file',
            severity: 'warning',
            userFriendly: true
        });
        
        this.errorPatterns.set('UNSUPPORTED_FORMAT', {
            pattern: /unsupported.*format|invalid.*file|対応していない.*形式/i,
            category: 'file',
            severity: 'error',
            userFriendly: true
        });
        
        this.errorPatterns.set('FILE_CORRUPTED', {
            pattern: /corrupted|damaged|破損|読み込めません/i,
            category: 'file',
            severity: 'error',
            userFriendly: true
        });
        
        // 変換関連エラー
        this.errorPatterns.set('CONVERSION_FAILED', {
            pattern: /conversion.*failed|変換.*失敗|変換.*エラー/i,
            category: 'conversion',
            severity: 'error',
            userFriendly: true
        });
        
        this.errorPatterns.set('MEMORY_ERROR', {
            pattern: /out.*of.*memory|memory.*error|メモリ.*不足/i,
            category: 'system',
            severity: 'error',
            userFriendly: true
        });
        
        this.errorPatterns.set('TIMEOUT_ERROR', {
            pattern: /timeout|time.*out|タイムアウト/i,
            category: 'system',
            severity: 'warning',
            userFriendly: true
        });
        
        // ブラウザ関連エラー
        this.errorPatterns.set('BROWSER_UNSUPPORTED', {
            pattern: /browser.*not.*supported|ブラウザ.*対応していません/i,
            category: 'browser',
            severity: 'error',
            userFriendly: true
        });
        
        this.errorPatterns.set('FEATURE_UNAVAILABLE', {
            pattern: /feature.*not.*available|機能.*利用できません/i,
            category: 'browser',
            severity: 'warning',
            userFriendly: true
        });
    }
    
    /**
     * 解決方法データベースの設定
     */
    setupSolutionDatabase() {
        // ファイル関連の解決方法
        this.solutionDatabase.set('FILE_TOO_LARGE', {
            title: 'ファイルサイズが大きすぎます',
            description: 'アップロードしようとしたファイルが10MBの制限を超えています。',
            solutions: [
                {
                    title: '画像を圧縮する',
                    description: '画像編集ソフトで画像を圧縮してからアップロードしてください。',
                    action: 'compress',
                    priority: 'high'
                },
                {
                    title: '画像サイズを縮小する',
                    description: '画像の解像度を下げてファイルサイズを小さくしてください。',
                    action: 'resize',
                    priority: 'high'
                },
                {
                    title: '別の形式で保存する',
                    description: 'JPEGやWebPなど、より圧縮効率の良い形式で保存してください。',
                    action: 'format_change',
                    priority: 'medium'
                }
            ],
            prevention: '今後は10MB以下のファイルをご利用ください。',
            relatedLinks: [
                { title: '画像圧縮ツールの使い方', url: '#help-compression' }
            ]
        });
        
        this.solutionDatabase.set('UNSUPPORTED_FORMAT', {
            title: 'サポートされていないファイル形式です',
            description: 'このファイル形式は現在サポートされていません。',
            solutions: [
                {
                    title: '対応形式に変換する',
                    description: 'SVG、PNG、JPG、WebP、GIFのいずれかの形式に変換してください。',
                    action: 'convert_format',
                    priority: 'high'
                },
                {
                    title: 'ファイル拡張子を確認する',
                    description: 'ファイル拡張子が正しいか確認してください。',
                    action: 'check_extension',
                    priority: 'medium'
                }
            ],
            prevention: '対応形式（SVG、PNG、JPG、WebP、GIF）のファイルをご利用ください。',
            supportedFormats: ['SVG', 'PNG', 'JPG', 'WebP', 'GIF']
        });
        
        this.solutionDatabase.set('FILE_CORRUPTED', {
            title: 'ファイルが破損している可能性があります',
            description: 'ファイルが正常に読み込めませんでした。',
            solutions: [
                {
                    title: '別のファイルを試す',
                    description: '他のファイルで正常に動作するか確認してください。',
                    action: 'try_different_file',
                    priority: 'high'
                },
                {
                    title: 'ファイルを再保存する',
                    description: '元のアプリケーションでファイルを再保存してください。',
                    action: 'resave_file',
                    priority: 'medium'
                },
                {
                    title: 'ファイルの整合性を確認する',
                    description: 'ファイルが完全にダウンロードされているか確認してください。',
                    action: 'verify_integrity',
                    priority: 'medium'
                }
            ],
            prevention: 'ファイルの保存時は完了まで待ち、転送エラーがないか確認してください。'
        });
        
        this.solutionDatabase.set('CONVERSION_FAILED', {
            title: '変換処理が失敗しました',
            description: '画像の変換中にエラーが発生しました。',
            solutions: [
                {
                    title: '再試行する',
                    description: '一時的なエラーの可能性があります。もう一度お試しください。',
                    action: 'retry',
                    priority: 'high'
                },
                {
                    title: '設定を変更する',
                    description: '品質設定やサイズ設定を変更してみてください。',
                    action: 'change_settings',
                    priority: 'medium'
                },
                {
                    title: 'ブラウザを再読み込みする',
                    description: 'ページを再読み込みしてから再度お試しください。',
                    action: 'reload_page',
                    priority: 'low'
                }
            ],
            prevention: '複雑な画像や大きなファイルの場合は、設定を調整してください。'
        });
        
        this.solutionDatabase.set('MEMORY_ERROR', {
            title: 'メモリ不足エラー',
            description: 'ブラウザのメモリが不足しています。',
            solutions: [
                {
                    title: '他のタブを閉じる',
                    description: '使用していないブラウザタブを閉じてメモリを解放してください。',
                    action: 'close_tabs',
                    priority: 'high'
                },
                {
                    title: 'ファイルサイズを小さくする',
                    description: 'より小さなファイルで試してください。',
                    action: 'reduce_file_size',
                    priority: 'high'
                },
                {
                    title: 'ブラウザを再起動する',
                    description: 'ブラウザを完全に閉じて再起動してください。',
                    action: 'restart_browser',
                    priority: 'medium'
                }
            ],
            prevention: '大きなファイルを扱う際は、他のアプリケーションを閉じてください。'
        });
        
        this.solutionDatabase.set('TIMEOUT_ERROR', {
            title: '処理がタイムアウトしました',
            description: '変換処理に時間がかかりすぎています。',
            solutions: [
                {
                    title: 'ファイルサイズを小さくする',
                    description: 'より小さなファイルで試してください。',
                    action: 'reduce_size',
                    priority: 'high'
                },
                {
                    title: '品質設定を下げる',
                    description: '出力品質を下げて処理時間を短縮してください。',
                    action: 'lower_quality',
                    priority: 'medium'
                },
                {
                    title: 'しばらく待ってから再試行',
                    description: 'システムの負荷が下がってから再度お試しください。',
                    action: 'wait_retry',
                    priority: 'low'
                }
            ],
            prevention: '大きなファイルや高品質設定では処理時間が長くなります。'
        });
        
        this.solutionDatabase.set('BROWSER_UNSUPPORTED', {
            title: 'ブラウザがサポートされていません',
            description: 'お使いのブラウザでは一部機能が利用できません。',
            solutions: [
                {
                    title: 'ブラウザを更新する',
                    description: '最新バージョンのブラウザに更新してください。',
                    action: 'update_browser',
                    priority: 'high'
                },
                {
                    title: '対応ブラウザを使用する',
                    description: 'Chrome、Firefox、Safari、Edgeの最新版をご利用ください。',
                    action: 'use_supported_browser',
                    priority: 'high'
                }
            ],
            prevention: '定期的にブラウザを最新版に更新してください。',
            supportedBrowsers: ['Chrome 80+', 'Firefox 75+', 'Safari 13+', 'Edge 80+']
        });
    }
    
    /**
     * グローバルエラーハンドリングの設定
     */
    setupGlobalErrorHandling() {
        // 未処理のエラーをキャッチ
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                context: 'global',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promise の未処理エラーをキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                context: 'promise',
                promise: event.promise
            });
        });
    }
    
    /**
     * エラーを処理（統一エラーハンドリング）
     * @param {Error|string} error - エラーオブジェクトまたはメッセージ
     * @param {Object} context - コンテキスト情報
     * @returns {Object} エラー情報
     */
    handleError(error, context = {}) {
        const errorInfo = this.analyzeError(error, context);
        this.updateErrorStats(errorInfo);
        this.logError(errorInfo);
        
        // 自動回復を試行
        const recoveryResult = this.attemptAutoRecovery(errorInfo);
        if (recoveryResult.recovered) {
            this.errorStats.recoveredErrors++;
            this.visualFeedback.showSuccess(
                `問題を自動的に解決しました: ${recoveryResult.message}`,
                { duration: 3000 }
            );
            return { ...errorInfo, recovered: true, recoveryResult };
        }
        
        // 自動回復できない場合はユーザーに表示
        this.displayError(errorInfo);
        
        return errorInfo;
    }
    
    /**
     * 変換エンジン用の統一エラーハンドラー
     * @param {Error} error - エラーオブジェクト
     * @param {string} engineName - エンジン名
     * @param {Object} operationContext - 操作コンテキスト
     * @returns {Object} 処理されたエラー情報
     */
    handleConversionError(error, engineName, operationContext = {}) {
        const context = {
            ...operationContext,
            engine: engineName,
            operation: 'conversion',
            timestamp: new Date()
        };
        
        return this.handleError(error, context);
    }
    
    /**
     * 自動回復を試行
     * @param {Object} errorInfo - エラー情報
     * @returns {Object} 回復結果
     */
    attemptAutoRecovery(errorInfo) {
        const recoveryStrategies = {
            [ERROR_TYPES.MEMORY_ERROR]: () => this.recoverFromMemoryError(),
            [ERROR_TYPES.TIMEOUT_ERROR]: () => this.recoverFromTimeout(errorInfo),
            [ERROR_TYPES.CANVAS_ERROR]: () => this.recoverFromCanvasError(),
            [ERROR_TYPES.SIZE_ERROR]: () => this.recoverFromSizeError(errorInfo)
        };
        
        const strategy = recoveryStrategies[errorInfo.pattern?.type];
        if (strategy) {
            try {
                return strategy();
            } catch (recoveryError) {
                console.warn('自動回復に失敗:', recoveryError);
            }
        }
        
        return { recovered: false };
    }
    
    /**
     * メモリエラーからの回復
     */
    recoverFromMemoryError() {
        // ガベージコレクションを促進
        if (window.gc) {
            window.gc();
        }
        
        // 不要なCanvasをクリーンアップ
        this.cleanupCanvasElements();
        
        return {
            recovered: true,
            message: 'メモリを解放しました'
        };
    }
    
    /**
     * タイムアウトエラーからの回復
     */
    recoverFromTimeout(errorInfo) {
        // より小さなサイズで再試行を提案
        if (errorInfo.context?.options) {
            const options = { ...errorInfo.context.options };
            if (options.customWidth && options.customWidth > 500) {
                options.customWidth = Math.floor(options.customWidth * 0.7);
                options.customHeight = options.customHeight ? Math.floor(options.customHeight * 0.7) : null;
                
                return {
                    recovered: true,
                    message: 'サイズを調整して再試行します',
                    suggestedOptions: options
                };
            }
        }
        
        return { recovered: false };
    }
    
    /**
     * Canvasエラーからの回復
     */
    recoverFromCanvasError() {
        // 新しいCanvasを作成
        this.cleanupCanvasElements();
        
        return {
            recovered: true,
            message: 'Canvas要素を再初期化しました'
        };
    }
    
    /**
     * サイズエラーからの回復
     */
    recoverFromSizeError(errorInfo) {
        if (errorInfo.context?.dimensions) {
            const { width, height } = errorInfo.context.dimensions;
            const maxDimension = 2048;
            
            if (width > maxDimension || height > maxDimension) {
                const scale = maxDimension / Math.max(width, height);
                return {
                    recovered: true,
                    message: 'サイズを自動調整しました',
                    suggestedDimensions: {
                        width: Math.floor(width * scale),
                        height: Math.floor(height * scale)
                    }
                };
            }
        }
        
        return { recovered: false };
    }
    
    /**
     * Canvas要素をクリーンアップ
     */
    cleanupCanvasElements() {
        // 既存のCanvas要素を検索してクリーンアップ
        const canvases = document.querySelectorAll('canvas:not([data-keep])');
        canvases.forEach(canvas => {
            if (canvas.parentNode && !canvas.closest('.preview-container')) {
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, 1, 1);
                }
            }
        });
    }
    
    /**
     * エラーを分析
     * @param {Error|string} error - エラー
     * @param {Object} context - コンテキスト
     * @returns {Object} エラー情報
     */
    analyzeError(error, context) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : null;
        
        // エラーパターンをマッチング
        const matchedPattern = this.matchErrorPattern(errorMessage);
        
        const errorInfo = {
            id: this.generateErrorId(),
            timestamp: new Date(),
            originalError: error,
            message: errorMessage,
            stack: errorStack,
            context,
            pattern: matchedPattern,
            severity: matchedPattern?.severity || 'error',
            category: matchedPattern?.category || 'unknown',
            userFriendly: matchedPattern?.userFriendly || false,
            solution: matchedPattern ? this.solutionDatabase.get(matchedPattern.type) : null
        };
        
        return errorInfo;
    }
    
    /**
     * エラーパターンをマッチング
     * @param {string} message - エラーメッセージ
     * @returns {Object|null} マッチしたパターン
     */
    matchErrorPattern(message) {
        for (const [type, pattern] of this.errorPatterns) {
            if (pattern.pattern.test(message)) {
                return { type, ...pattern };
            }
        }
        return null;
    }
    
    /**
     * エラーをログに記録
     * @param {Object} errorInfo - エラー情報
     */
    logError(errorInfo) {
        this.errorHistory.push(errorInfo);
        
        // 履歴の上限を設定（メモリ使用量を制限）
        if (this.errorHistory.length > 100) {
            this.errorHistory.shift();
        }
        
        // コンソールにログ出力
        const logLevel = errorInfo.severity === 'error' ? 'error' : 'warn';
        console[logLevel]('Error handled:', {
            id: errorInfo.id,
            message: errorInfo.message,
            category: errorInfo.category,
            context: errorInfo.context,
            solution: errorInfo.solution?.title
        });
    }
    
    /**
     * エラーを表示
     * @param {Object} errorInfo - エラー情報
     */
    displayError(errorInfo) {
        if (!errorInfo.userFriendly) {
            // 技術的なエラーは簡略化して表示
            this.displayTechnicalError(errorInfo);
            return;
        }
        
        const solution = errorInfo.solution;
        if (solution) {
            this.displayErrorWithSolution(errorInfo, solution);
        } else {
            this.displayBasicError(errorInfo);
        }
    }
    
    /**
     * 解決方法付きエラーを表示
     * @param {Object} errorInfo - エラー情報
     * @param {Object} solution - 解決方法
     */
    displayErrorWithSolution(errorInfo, solution) {
        const actions = solution.solutions.map(sol => ({
            label: sol.title,
            handler: `window.errorHandler.executeSolution('${errorInfo.id}', '${sol.action}')`
        }));
        
        // 「詳細を表示」アクションを追加
        actions.push({
            label: '詳細を表示',
            handler: `window.errorHandler.showErrorDetails('${errorInfo.id}')`
        });
        
        this.visualFeedback.showError(solution.title, {
            duration: 0, // 手動で閉じるまで表示
            actions,
            persistent: true,
            errorId: errorInfo.id
        });
    }
    
    /**
     * 基本的なエラーを表示
     * @param {Object} errorInfo - エラー情報
     */
    displayBasicError(errorInfo) {
        const message = this.createUserFriendlyMessage(errorInfo);
        
        const feedbackType = errorInfo.severity === 'warning' ? 'showWarning' : 'showError';
        this.visualFeedback[feedbackType](message, {
            duration: errorInfo.severity === 'error' ? 0 : 5000,
            actions: [{
                label: '詳細を表示',
                handler: `window.errorHandler.showErrorDetails('${errorInfo.id}')`
            }],
            errorId: errorInfo.id
        });
    }
    
    /**
     * 技術的なエラーを表示
     * @param {Object} errorInfo - エラー情報
     */
    displayTechnicalError(errorInfo) {
        const message = '予期しないエラーが発生しました。しばらく待ってから再度お試しください。';
        
        this.visualFeedback.showError(message, {
            duration: 0,
            actions: [
                {
                    label: 'ページを再読み込み',
                    handler: 'window.location.reload()'
                },
                {
                    label: '詳細を表示',
                    handler: `window.errorHandler.showErrorDetails('${errorInfo.id}')`
                }
            ],
            errorId: errorInfo.id
        });
    }
    
    /**
     * ユーザーフレンドリーなメッセージを作成
     * @param {Object} errorInfo - エラー情報
     * @returns {string} メッセージ
     */
    createUserFriendlyMessage(errorInfo) {
        const categoryMessages = {
            file: 'ファイルに関する問題が発生しました',
            conversion: '変換処理中に問題が発生しました',
            system: 'システムの問題が発生しました',
            browser: 'ブラウザの問題が発生しました',
            unknown: '問題が発生しました'
        };
        
        return categoryMessages[errorInfo.category] || categoryMessages.unknown;
    }
    
    /**
     * 解決方法を実行（拡張版）
     * @param {string} errorId - エラーID
     * @param {string} action - アクション
     */
    executeSolution(errorId, action) {
        const errorInfo = this.errorHistory.find(e => e.id === errorId);
        if (!errorInfo) return;
        
        // 実行前にローディング表示
        this.visualFeedback.showInfo('解決方法を実行中...', { duration: 1000 });
        
        try {
            switch (action) {
                case 'retry':
                    this.executeRetry(errorInfo);
                    break;
                case 'retry_with_options':
                    this.executeRetryWithOptions(errorInfo);
                    break;
                case 'reload_page':
                    this.confirmAndReload();
                    break;
                case 'close_tabs':
                    this.showTabClosingGuidance();
                    break;
                case 'compress':
                    this.showCompressionGuidance();
                    break;
                case 'resize':
                    this.showResizeGuidance();
                    break;
                case 'format_change':
                    this.showFormatChangeGuidance();
                    break;
                case 'change_settings':
                    this.showSettingsGuidance();
                    break;
                case 'lower_quality':
                    this.lowerQualitySettings();
                    break;
                case 'reduce_size':
                    this.showSizeReductionGuidance();
                    break;
                case 'clear_memory':
                    this.clearMemoryAndRetry(errorInfo);
                    break;
                case 'reset_canvas':
                    this.resetCanvasAndRetry(errorInfo);
                    break;
                case 'try_different_format':
                    this.suggestAlternativeFormat(errorInfo);
                    break;
                default:
                    console.log(`Solution action not implemented: ${action}`);
                    this.visualFeedback.showWarning('この解決方法はまだ実装されていません');
            }
            
            // 解決方法の実行を記録
            this.recordSolutionExecution(errorId, action);
            
        } catch (solutionError) {
            console.error('解決方法の実行中にエラーが発生:', solutionError);
            this.visualFeedback.showError('解決方法の実行に失敗しました');
        }
        
        // エラーフィードバックを閉じる
        this.visualFeedback.removeFeedback(errorId);
    }
    
    /**
     * 再試行を実行（改良版）
     * @param {Object} errorInfo - エラー情報
     */
    executeRetry(errorInfo) {
        if (!errorInfo.context?.retryFunction) {
            this.visualFeedback.showWarning('再試行できません。操作を最初からやり直してください。');
            return;
        }
        
        // 再試行回数をチェック
        const retryCount = this.getRetryCount(errorInfo.id);
        if (retryCount >= 3) {
            this.visualFeedback.showError('再試行回数の上限に達しました。別の解決方法を試してください。');
            return;
        }
        
        this.incrementRetryCount(errorInfo.id);
        this.visualFeedback.showInfo(`再試行中... (${retryCount + 1}/3)`, { duration: 2000 });
        
        try {
            errorInfo.context.retryFunction();
        } catch (retryError) {
            this.handleError(retryError, { ...errorInfo.context, isRetry: true });
        }
    }
    
    /**
     * オプション調整付き再試行
     * @param {Object} errorInfo - エラー情報
     */
    executeRetryWithOptions(errorInfo) {
        const adjustedOptions = this.getAdjustedOptions(errorInfo);
        if (!adjustedOptions) {
            this.executeRetry(errorInfo);
            return;
        }
        
        this.visualFeedback.showInfo('設定を調整して再試行中...', { duration: 2000 });
        
        // 調整されたオプションで再試行
        if (errorInfo.context?.retryFunction) {
            try {
                errorInfo.context.retryFunction(adjustedOptions);
            } catch (retryError) {
                this.handleError(retryError, { ...errorInfo.context, isRetry: true, adjustedOptions });
            }
        }
    }
    
    /**
     * 確認付きページ再読み込み
     */
    confirmAndReload() {
        const confirmed = confirm('ページを再読み込みしますか？未保存の作業は失われます。');
        if (confirmed) {
            window.location.reload();
        }
    }
    
    /**
     * メモリクリア後の再試行
     * @param {Object} errorInfo - エラー情報
     */
    clearMemoryAndRetry(errorInfo) {
        this.recoverFromMemoryError();
        setTimeout(() => {
            this.executeRetry(errorInfo);
        }, 1000);
    }
    
    /**
     * Canvas リセット後の再試行
     * @param {Object} errorInfo - エラー情報
     */
    resetCanvasAndRetry(errorInfo) {
        this.recoverFromCanvasError();
        setTimeout(() => {
            this.executeRetry(errorInfo);
        }, 500);
    }
    
    /**
     * 代替形式を提案
     * @param {Object} errorInfo - エラー情報
     */
    suggestAlternativeFormat(errorInfo) {
        const currentFormat = errorInfo.context?.targetFormat;
        const alternatives = this.getAlternativeFormats(currentFormat);
        
        if (alternatives.length > 0) {
            this.visualFeedback.showInfo(
                `代替形式を試してください: ${alternatives.join(', ')}`,
                { duration: 8000 }
            );
            
            // フォーマット選択UIをハイライト
            this.visualFeedback.pulse('#formatSelector', { color: '#667eea' });
        } else {
            this.visualFeedback.showWarning('代替形式が見つかりません');
        }
    }
    
    /**
     * 代替形式を取得
     * @param {string} currentFormat - 現在の形式
     * @returns {Array} 代替形式のリスト
     */
    getAlternativeFormats(currentFormat) {
        const formatAlternatives = {
            'webp': ['png', 'jpg'],
            'gif': ['png'],
            'jpg': ['png', 'webp'],
            'png': ['jpg', 'webp'],
            'svg': ['png']
        };
        
        return formatAlternatives[currentFormat] || [];
    }
    
    /**
     * 調整されたオプションを取得
     * @param {Object} errorInfo - エラー情報
     * @returns {Object|null} 調整されたオプション
     */
    getAdjustedOptions(errorInfo) {
        const options = errorInfo.context?.options;
        if (!options) return null;
        
        const adjusted = { ...options };
        
        // エラータイプに応じてオプションを調整
        switch (errorInfo.pattern?.type) {
            case ERROR_TYPES.MEMORY_ERROR:
            case ERROR_TYPES.SIZE_ERROR:
                // サイズを縮小
                if (adjusted.customWidth) adjusted.customWidth = Math.floor(adjusted.customWidth * 0.7);
                if (adjusted.customHeight) adjusted.customHeight = Math.floor(adjusted.customHeight * 0.7);
                break;
                
            case ERROR_TYPES.TIMEOUT_ERROR:
                // 品質を下げる
                if (adjusted.quality) adjusted.quality = Math.max(50, adjusted.quality - 20);
                break;
                
            case ERROR_TYPES.CONVERSION_FAILED:
                // 背景色を白に設定
                adjusted.backgroundColor = '#ffffff';
                adjusted.transparentBackground = false;
                break;
        }
        
        return adjusted;
    }
    
    /**
     * 再試行回数を取得
     * @param {string} errorId - エラーID
     * @returns {number} 再試行回数
     */
    getRetryCount(errorId) {
        return this.retryQueue.get(errorId) || 0;
    }
    
    /**
     * 再試行回数を増加
     * @param {string} errorId - エラーID
     */
    incrementRetryCount(errorId) {
        const current = this.getRetryCount(errorId);
        this.retryQueue.set(errorId, current + 1);
    }
    
    /**
     * 解決方法の実行を記録
     * @param {string} errorId - エラーID
     * @param {string} action - 実行されたアクション
     */
    recordSolutionExecution(errorId, action) {
        const errorInfo = this.errorHistory.find(e => e.id === errorId);
        if (errorInfo) {
            if (!errorInfo.solutionAttempts) {
                errorInfo.solutionAttempts = [];
            }
            errorInfo.solutionAttempts.push({
                action,
                timestamp: new Date()
            });
        }
    }
    
    /**
     * エラー詳細を表示
     * @param {string} errorId - エラーID
     */
    showErrorDetails(errorId) {
        const errorInfo = this.errorHistory.find(e => e.id === errorId);
        if (!errorInfo) return;
        
        const detailsModal = this.createErrorDetailsModal(errorInfo);
        document.body.appendChild(detailsModal);
    }
    
    /**
     * エラー詳細モーダルを作成
     * @param {Object} errorInfo - エラー情報
     * @returns {HTMLElement} モーダル要素
     */
    createErrorDetailsModal(errorInfo) {
        const modal = document.createElement('div');
        modal.className = 'error-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>エラー詳細</h3>
                    <button class="modal-close" onclick="this.closest('.error-details-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="error-summary">
                        <div class="error-info-row">
                            <strong>エラーID:</strong> ${errorInfo.id}
                        </div>
                        <div class="error-info-row">
                            <strong>発生時刻:</strong> ${errorInfo.timestamp.toLocaleString('ja-JP')}
                        </div>
                        <div class="error-info-row">
                            <strong>カテゴリ:</strong> ${errorInfo.category}
                        </div>
                        <div class="error-info-row">
                            <strong>重要度:</strong> ${errorInfo.severity}
                        </div>
                    </div>
                    
                    <div class="error-message">
                        <h4>エラーメッセージ</h4>
                        <pre>${errorInfo.message}</pre>
                    </div>
                    
                    ${errorInfo.solution ? this.createSolutionHTML(errorInfo.solution) : ''}
                    
                    ${errorInfo.stack ? `
                        <details class="error-stack">
                            <summary>技術的な詳細（開発者向け）</summary>
                            <pre>${errorInfo.stack}</pre>
                        </details>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.error-details-modal').remove()">
                        閉じる
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    /**
     * 解決方法のHTMLを作成
     * @param {Object} solution - 解決方法
     * @returns {string} HTML文字列
     */
    createSolutionHTML(solution) {
        let html = `
            <div class="solution-section">
                <h4>解決方法</h4>
                <p>${solution.description}</p>
                <div class="solutions-list">
        `;
        
        solution.solutions.forEach((sol, index) => {
            html += `
                <div class="solution-item priority-${sol.priority}">
                    <div class="solution-header">
                        <span class="solution-number">${index + 1}</span>
                        <strong>${sol.title}</strong>
                        <span class="priority-badge ${sol.priority}">${this.getPriorityLabel(sol.priority)}</span>
                    </div>
                    <p>${sol.description}</p>
                </div>
            `;
        });
        
        html += `
                </div>
                ${solution.prevention ? `
                    <div class="prevention-tip">
                        <strong>予防策:</strong> ${solution.prevention}
                    </div>
                ` : ''}
            </div>
        `;
        
        return html;
    }
    
    /**
     * 優先度ラベルを取得
     * @param {string} priority - 優先度
     * @returns {string} ラベル
     */
    getPriorityLabel(priority) {
        const labels = {
            high: '推奨',
            medium: '有効',
            low: '参考'
        };
        return labels[priority] || priority;
    }
    
    /**
     * 各種ガイダンス表示メソッド
     */
    executeRetry() {
        // 最後の操作を再実行
        this.visualFeedback.showInfo('再試行しています...', { duration: 2000 });
        // 実際の再試行ロジックは呼び出し元で実装
    }
    
    showTabClosingGuidance() {
        this.visualFeedback.showInfo(
            '他のブラウザタブを閉じてメモリを解放してください。Ctrl+W（Mac: Cmd+W）で現在のタブを閉じることができます。',
            { duration: 8000 }
        );
    }
    
    showCompressionGuidance() {
        this.visualFeedback.showInfo(
            '画像編集ソフトやオンライン圧縮ツールを使用してファイルサイズを小さくしてください。',
            { duration: 6000 }
        );
    }
    
    showResizeGuidance() {
        this.visualFeedback.showInfo(
            '画像の解像度を下げることでファイルサイズを小さくできます。推奨サイズ: 1920×1080以下',
            { duration: 6000 }
        );
    }
    
    showFormatChangeGuidance() {
        this.visualFeedback.showInfo(
            'JPEGやWebP形式で保存すると、ファイルサイズを大幅に削減できます。',
            { duration: 5000 }
        );
    }
    
    showSettingsGuidance() {
        this.visualFeedback.showInfo(
            '品質設定を下げる、または出力サイズを小さくしてみてください。',
            { duration: 5000 }
        );
        
        // 設定エリアをハイライト
        this.visualFeedback.pulse('#conversionOptions', { color: '#667eea' });
    }
    
    lowerQualitySettings() {
        const qualitySlider = document.getElementById('qualitySlider');
        if (qualitySlider) {
            const currentValue = parseInt(qualitySlider.value);
            const newValue = Math.max(50, currentValue - 20);
            qualitySlider.value = newValue;
            qualitySlider.dispatchEvent(new Event('input'));
            
            this.visualFeedback.showInfo(
                `品質設定を${newValue}%に下げました。`,
                { duration: 3000 }
            );
        }
    }
    
    showSizeReductionGuidance() {
        this.visualFeedback.showInfo(
            'より小さなファイルで試すか、出力サイズを小さく設定してください。',
            { duration: 5000 }
        );
    }
    
    /**
     * エラーIDを生成
     * @returns {string} エラーID
     */
    generateErrorId() {
        return 'err_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * エラー履歴を取得
     * @returns {Array} エラー履歴
     */
    getErrorHistory() {
        return [...this.errorHistory];
    }
    
    /**
     * エラー統計を更新
     * @param {Object} errorInfo - エラー情報
     */
    updateErrorStats(errorInfo) {
        this.errorStats.totalErrors++;
        
        const category = errorInfo.category || 'unknown';
        const severity = errorInfo.severity || 'error';
        
        this.errorStats.byCategory[category] = (this.errorStats.byCategory[category] || 0) + 1;
        this.errorStats.bySeverity[severity] = (this.errorStats.bySeverity[severity] || 0) + 1;
    }
    
    /**
     * エラー統計を取得（拡張版）
     * @returns {Object} 統計情報
     */
    getErrorStatistics() {
        const stats = {
            ...this.errorStats,
            recent: this.errorHistory.slice(-10),
            recoveryRate: this.errorStats.totalErrors > 0 ? 
                (this.errorStats.recoveredErrors / this.errorStats.totalErrors * 100).toFixed(1) : 0,
            mostCommonError: this.getMostCommonError(),
            errorTrends: this.getErrorTrends()
        };
        
        return stats;
    }
    
    /**
     * 最も多いエラーを取得
     * @returns {Object} 最も多いエラー情報
     */
    getMostCommonError() {
        const categoryCounts = this.errorStats.byCategory;
        const mostCommon = Object.keys(categoryCounts).reduce((a, b) => 
            categoryCounts[a] > categoryCounts[b] ? a : b, null);
        
        return mostCommon ? {
            category: mostCommon,
            count: categoryCounts[mostCommon],
            percentage: (categoryCounts[mostCommon] / this.errorStats.totalErrors * 100).toFixed(1)
        } : null;
    }
    
    /**
     * エラートレンドを取得
     * @returns {Array} エラートレンド
     */
    getErrorTrends() {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentErrors = this.errorHistory.filter(error => 
            error.timestamp > last24Hours);
        
        const hourlyCount = {};
        recentErrors.forEach(error => {
            const hour = error.timestamp.getHours();
            hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
        });
        
        return Object.keys(hourlyCount).map(hour => ({
            hour: parseInt(hour),
            count: hourlyCount[hour]
        })).sort((a, b) => a.hour - b.hour);
    }
    
    /**
     * エラーレポートを生成
     * @returns {string} エラーレポート
     */
    generateErrorReport() {
        const stats = this.getErrorStatistics();
        const report = [];
        
        report.push('=== エラーレポート ===');
        report.push(`総エラー数: ${stats.totalErrors}`);
        report.push(`回復率: ${stats.recoveryRate}%`);
        report.push('');
        
        report.push('カテゴリ別:');
        Object.entries(stats.byCategory).forEach(([category, count]) => {
            const percentage = (count / stats.totalErrors * 100).toFixed(1);
            report.push(`  ${category}: ${count} (${percentage}%)`);
        });
        report.push('');
        
        report.push('重要度別:');
        Object.entries(stats.bySeverity).forEach(([severity, count]) => {
            const percentage = (count / stats.totalErrors * 100).toFixed(1);
            report.push(`  ${severity}: ${count} (${percentage}%)`);
        });
        
        if (stats.mostCommonError) {
            report.push('');
            report.push(`最も多いエラー: ${stats.mostCommonError.category} (${stats.mostCommonError.count}回)`);
        }
        
        return report.join('\n');
    }
    
    /**
     * エラーハンドラーの健全性をチェック
     * @returns {Object} 健全性チェック結果
     */
    performHealthCheck() {
        const result = {
            healthy: true,
            issues: [],
            recommendations: []
        };
        
        // エラー履歴のサイズチェック
        if (this.errorHistory.length > 500) {
            result.issues.push('エラー履歴が大きすぎます');
            result.recommendations.push('古いエラー履歴をクリアしてください');
        }
        
        // 高いエラー率のチェック
        const stats = this.getErrorStatistics();
        if (stats.recoveryRate < 50 && stats.totalErrors > 10) {
            result.healthy = false;
            result.issues.push('エラー回復率が低すぎます');
            result.recommendations.push('エラー回復機能を改善してください');
        }
        
        // メモリ使用量のチェック
        const memoryUsage = this.estimateMemoryUsage();
        if (memoryUsage > 10 * 1024 * 1024) { // 10MB
            result.issues.push('メモリ使用量が多すぎます');
            result.recommendations.push('エラー履歴をクリアしてください');
        }
        
        return result;
    }
    
    /**
     * メモリ使用量を推定
     * @returns {number} 推定メモリ使用量（バイト）
     */
    estimateMemoryUsage() {
        // 簡易的な推定（実際の値ではない）
        return this.errorHistory.length * 1024 + // 各エラー約1KB
               this.retryQueue.size * 100; // 各再試行情報約100B
    }
    
    /**
     * エラー履歴をクリア
     * @param {boolean} keepRecent - 最近のエラーを保持するか
     */
    clearErrorHistory(keepRecent = true) {
        if (keepRecent) {
            this.errorHistory = this.errorHistory.slice(-50); // 最新50件を保持
        } else {
            this.errorHistory = [];
        }
        
        this.retryQueue.clear();
        
        // 統計をリセット
        this.errorStats = {
            totalErrors: this.errorHistory.length,
            recoveredErrors: 0,
            byCategory: {},
            bySeverity: {}
        };
        
        // 統計を再計算
        this.errorHistory.forEach(error => {
            this.updateErrorStats(error);
        });
        
        console.log('エラー履歴をクリアしました');
    }
}

// グローバルに公開（モーダルのボタンから呼び出すため）
window.errorHandler = null;