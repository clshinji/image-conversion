// アプリケーション状態管理
class AppState {
    constructor() {
        this.state = {
            currentFile: null,
            svgContent: null,
            pngData: null,
            isConverting: false,
            isLoading: false,
            error: null,
            lastOperation: null,
            conversionHistory: [],
            transparentBackground: true, // デフォルトで透明背景を有効
            outputSize: 'original', // 出力サイズ設定
            customWidth: null, // カスタム幅
            customHeight: null // カスタム高さ
        };
        this.listeners = [];
        this.uiController = null;
    }

    // UIControllerの参照を設定
    setUIController(uiController) {
        this.uiController = uiController;
    }

    // 状態変更リスナーを追加
    addListener(listener) {
        this.listeners.push(listener);
    }

    // 状態変更リスナーを削除
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // 状態変更を通知
    notifyListeners(changedProperties) {
        this.listeners.forEach(listener => {
            try {
                listener(this.state, changedProperties);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    // 状態を更新
    updateState(updates) {
        const changedProperties = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (this.state[key] !== value) {
                changedProperties[key] = {
                    oldValue: this.state[key],
                    newValue: value
                };
                this.state[key] = value;
            }
        }

        // 変更があった場合のみ通知
        if (Object.keys(changedProperties).length > 0) {
            this.notifyListeners(changedProperties);
            this.updateUI(changedProperties);
        }
    }

    // 状態変更時のUI更新ロジック
    updateUI(changedProperties) {
        if (!this.uiController) return;

        // ファイル読み込み状態の変更
        if ('currentFile' in changedProperties) {
            const file = changedProperties.currentFile.newValue;
            if (file) {
                console.log(`新しいファイルが読み込まれました: ${file.name}`);
            } else {
                console.log('ファイルがクリアされました');
            }
        }

        // 変換状態の変更
        if ('isConverting' in changedProperties) {
            const isConverting = changedProperties.isConverting.newValue;
            this.uiController.updateButtonStates({
                convertEnabled: !isConverting && this.state.svgContent !== null,
                downloadEnabled: !isConverting && this.state.pngData !== null
            });
        }

        // ローディング状態の変更
        if ('isLoading' in changedProperties) {
            const isLoading = changedProperties.isLoading.newValue;
            if (isLoading && this.state.lastOperation) {
                this.uiController.showLoadingState(this.state.lastOperation);
            } else {
                this.uiController.hideLoadingState();
            }
        }

        // エラー状態の変更
        if ('error' in changedProperties) {
            const error = changedProperties.error.newValue;
            if (error) {
                this.uiController.showError(error);
            }
        }

        // PNG データの変更
        if ('pngData' in changedProperties) {
            const pngData = changedProperties.pngData.newValue;
            this.uiController.updateButtonStates({
                downloadEnabled: pngData !== null && !this.state.isConverting
            });
        }
    }

    // 新しいファイル読み込み時の状態リセット機能
    resetForNewFile() {
        // 変換履歴に現在の状態を保存（必要に応じて）
        if (this.state.currentFile && this.state.pngData) {
            this.addToHistory({
                fileName: this.state.currentFile.name,
                timestamp: new Date(),
                success: true
            });
        }

        // 状態をリセット
        this.updateState({
            currentFile: null,
            svgContent: null,
            pngData: null,
            isConverting: false,
            isLoading: false,
            error: null,
            lastOperation: null
        });

        // UIをリセット
        if (this.uiController) {
            this.uiController.resetUIForNewFile();
        }
    }

    // 変換履歴に追加
    addToHistory(entry) {
        this.state.conversionHistory.unshift(entry);
        
        // 履歴の最大数を制限（最新10件まで）
        if (this.state.conversionHistory.length > 10) {
            this.state.conversionHistory = this.state.conversionHistory.slice(0, 10);
        }
    }

    // ファイル選択時の状態更新
    setFile(file, svgContent) {
        this.updateState({
            currentFile: file,
            svgContent: svgContent,
            pngData: null,
            error: null,
            lastOperation: null
        });
    }

    // 変換開始時の状態更新
    startConversion() {
        this.updateState({
            isConverting: true,
            isLoading: true,
            error: null,
            lastOperation: 'SVGをPNGに変換中...'
        });
    }

    // 変換完了時の状態更新
    completeConversion(pngData) {
        this.updateState({
            pngData: pngData,
            isConverting: false,
            isLoading: false,
            error: null,
            lastOperation: null
        });

        // 変換履歴に追加
        if (this.state.currentFile) {
            this.addToHistory({
                fileName: this.state.currentFile.name,
                timestamp: new Date(),
                success: true,
                fileSize: pngData.size
            });
        }
    }

    // 変換エラー時の状態更新
    failConversion(error) {
        this.updateState({
            isConverting: false,
            isLoading: false,
            error: error,
            lastOperation: null
        });

        // エラー履歴に追加
        if (this.state.currentFile) {
            this.addToHistory({
                fileName: this.state.currentFile.name,
                timestamp: new Date(),
                success: false,
                error: error
            });
        }
    }

    // ファイル読み込み開始時の状態更新
    startFileLoading() {
        this.updateState({
            isLoading: true,
            error: null,
            lastOperation: 'ファイルを読み込み中...'
        });
    }

    // ファイル読み込み完了時の状態更新
    completeFileLoading() {
        this.updateState({
            isLoading: false,
            lastOperation: null
        });
    }

    // ファイル読み込みエラー時の状態更新
    failFileLoading(error) {
        this.updateState({
            isLoading: false,
            error: error,
            lastOperation: null
        });
    }

    // ダウンロード開始時の状態更新
    startDownload() {
        this.updateState({
            lastOperation: 'ファイルをダウンロード中...'
        });
    }

    // ダウンロード完了時の状態更新
    completeDownload() {
        this.updateState({
            lastOperation: null
        });
    }

    // 透明背景オプションの更新
    setTransparentBackground(enabled) {
        this.updateState({
            transparentBackground: enabled
        });
    }

    // 出力サイズの更新
    setOutputSize(size) {
        this.updateState({
            outputSize: size
        });
    }

    // カスタム幅の更新
    setCustomWidth(width) {
        this.updateState({
            customWidth: width
        });
    }

    // カスタム高さの更新
    setCustomHeight(height) {
        this.updateState({
            customHeight: height
        });
    }

    // 現在の状態を取得
    getState() {
        return { ...this.state };
    }

    // 特定のプロパティの値を取得
    get(property) {
        return this.state[property];
    }

    // 状態の検証
    isValidForConversion() {
        return this.state.svgContent !== null && 
               !this.state.isConverting && 
               !this.state.isLoading;
    }

    isValidForDownload() {
        return this.state.pngData !== null && 
               !this.state.isConverting && 
               !this.state.isLoading;
    }

    // デバッグ用：状態をログ出力
    logState() {
        console.log('Current AppState:', {
            hasFile: !!this.state.currentFile,
            fileName: this.state.currentFile?.name,
            hasSvgContent: !!this.state.svgContent,
            hasPngData: !!this.state.pngData,
            isConverting: this.state.isConverting,
            isLoading: this.state.isLoading,
            error: this.state.error,
            lastOperation: this.state.lastOperation,
            historyCount: this.state.conversionHistory.length
        });
    }
}

// グローバルなアプリケーション状態インスタンス
const appState = new AppState();

// クラスインスタンスは後で初期化

// DOM要素の取得
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    svgPreview: document.getElementById('svgPreview'),
    svgPreviewContent: document.getElementById('svgPreviewContent'),
    pngPreview: document.getElementById('pngPreview'),
    pngPreviewContent: document.getElementById('pngPreviewContent'),
    convertBtn: document.getElementById('convertBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage'),
    conversionOptions: document.getElementById('conversionOptions'),
    transparentBgOption: document.getElementById('transparentBgOption'),
    sizePreset: document.getElementById('sizePreset'),
    customSizeInputs: document.getElementById('customSizeInputs'),
    customWidth: document.getElementById('customWidth'),
    customHeight: document.getElementById('customHeight'),
    sizeInfo: document.getElementById('sizeInfo')
};

// UIController クラス
class UIController {
    constructor() {
        this.fileHandler = null;
        this.svgConverter = null;
        this.isInitialized = false;
    }

    // 初期化
    initialize(fileHandler, svgConverter, appState) {
        this.fileHandler = fileHandler;
        this.svgConverter = svgConverter;
        this.appState = appState;
        
        // AppStateにUIControllerの参照を設定
        this.appState.setUIController(this);
        
        this.setupEventListeners();
        this.initializeUI();
        this.isInitialized = true;
        console.log('UIController initialized');
    }

    // 全体的なイベントリスナーの設定
    setupEventListeners() {
        // ファイル選択ボタンのクリックイベント
        elements.uploadBtn.addEventListener('click', () => {
            elements.fileInput.click();
        });
        
        // アップロードエリアのクリックイベント
        elements.uploadArea.addEventListener('click', (event) => {
            // ボタンクリック時の重複を避ける
            if (event.target !== elements.uploadBtn) {
                elements.fileInput.click();
            }
        });
        
        // ファイル入力の変更イベント
        elements.fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                await this.handleFileSelection(file);
            }
        });
        
        // 変換ボタンのクリックイベント
        elements.convertBtn.addEventListener('click', async () => {
            await this.handleConversion();
        });
        
        // ダウンロードボタンのクリックイベント
        elements.downloadBtn.addEventListener('click', () => {
            this.handleDownload();
        });

        // ドラッグ&ドロップイベントハンドラー
        this.setupDragAndDropHandlers();

        // キーボードイベント
        this.setupKeyboardHandlers();

        // ウィンドウイベント
        this.setupWindowHandlers();

        // 変換オプションイベント
        this.setupConversionOptionsHandlers();
    }

    // ドラッグ&ドロップイベントハンドラーの設定
    setupDragAndDropHandlers() {
        // ドラッグオーバー
        elements.uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            elements.uploadArea.classList.add('dragover');
        });

        // ドラッグエンター
        elements.uploadArea.addEventListener('dragenter', (event) => {
            event.preventDefault();
            elements.uploadArea.classList.add('dragover');
        });

        // ドラッグリーブ
        elements.uploadArea.addEventListener('dragleave', (event) => {
            event.preventDefault();
            // 子要素からのleaveイベントを無視
            if (!elements.uploadArea.contains(event.relatedTarget)) {
                elements.uploadArea.classList.remove('dragover');
            }
        });

        // ドロップ
        elements.uploadArea.addEventListener('drop', async (event) => {
            event.preventDefault();
            elements.uploadArea.classList.remove('dragover');
            
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                // 複数ファイルの場合は最初のSVGファイルのみを処理
                const svgFile = Array.from(files).find(file => 
                    file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
                );
                
                if (svgFile) {
                    await this.handleFileSelection(svgFile);
                } else {
                    this.showError('SVGファイルが見つかりません。SVGファイルをドロップしてください。');
                }
            }
        });
    }

    // キーボードイベントハンドラーの設定
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (event) => {
            // Escキーでエラーメッセージを閉じる
            if (event.key === 'Escape') {
                this.hideMessages();
            }
            
            // Enterキーで変換実行（変換ボタンが有効な場合）
            if (event.key === 'Enter' && !elements.convertBtn.disabled) {
                event.preventDefault();
                this.handleConversion();
            }
        });
    }

    // ウィンドウイベントハンドラーの設定
    setupWindowHandlers() {
        // ページ離脱時の確認（変換中の場合）
        window.addEventListener('beforeunload', (event) => {
            if (appState.isConverting) {
                event.preventDefault();
                event.returnValue = '変換処理中です。ページを離れますか？';
                return event.returnValue;
            }
        });

        // ウィンドウリサイズ時のプレビュー調整
        window.addEventListener('resize', () => {
            this.adjustPreviewSizes();
        });
    }

    // 変換オプションイベントハンドラーの設定
    setupConversionOptionsHandlers() {
        // 透明背景オプションの変更イベント
        elements.transparentBgOption.addEventListener('change', (event) => {
            this.appState.setTransparentBackground(event.target.checked);
            console.log(`透明背景オプション: ${event.target.checked ? '有効' : '無効'}`);
            
            // 既にPNGプレビューが表示されている場合は更新
            this.updatePNGPreviewTransparency(event.target.checked);
        });

        // サイズプリセット選択の変更イベント
        elements.sizePreset.addEventListener('change', (event) => {
            const selectedSize = event.target.value;
            this.appState.setOutputSize(selectedSize);
            console.log(`出力サイズ選択: ${selectedSize}`);
            
            // カスタムサイズ入力の表示/非表示を切り替え
            this.toggleCustomSizeInputs(selectedSize === 'custom');
            
            // プレビューサイズ情報を更新
            this.updateSizePreview();
        });

        // カスタム幅入力の変更イベント
        elements.customWidth.addEventListener('input', (event) => {
            const width = parseInt(event.target.value) || null;
            this.appState.setCustomWidth(width);
            this.updateSizePreview();
        });

        // カスタム高さ入力の変更イベント
        elements.customHeight.addEventListener('input', (event) => {
            const height = parseInt(event.target.value) || null;
            this.appState.setCustomHeight(height);
            this.updateSizePreview();
        });
    }

    // UI初期化
    initializeUI() {
        // 初期状態の設定
        this.updateButtonStates({
            convertEnabled: false,
            downloadEnabled: false
        });
        
        // メッセージエリアを非表示
        this.hideMessages();
        
        // プレビューエリアを非表示
        elements.svgPreview.style.display = 'none';
        elements.pngPreview.style.display = 'none';
        elements.fileInfo.style.display = 'none';
        elements.conversionOptions.style.display = 'none';
        
        // 透明背景オプションの初期値を設定
        elements.transparentBgOption.checked = this.appState.get('transparentBackground');
        
        // サイズ選択の初期値を設定
        elements.sizePreset.value = this.appState.get('outputSize');
        this.toggleCustomSizeInputs(false); // 初期状態ではカスタムサイズを非表示
    }

    // 包括的なファイル選択処理
    async handleFileSelection(file) {
        try {
            // 新しいファイル用の状態リセット
            this.appState.resetForNewFile();
            
            // ファイル読み込み開始
            this.appState.startFileLoading();
            
            // 詳細なローディング表示
            this.showLoadingState('ファイルを読み込み中...', {
                details: `${file.name} (${formatFileSize(file.size)})`,
                spinnerType: 'pulse'
            });
            
            // ファイル処理
            const result = await this.fileHandler.readFile(file);
            
            // 警告がある場合は表示
            if (result.validation && result.validation.warnings && result.validation.warnings.length > 0) {
                this.showWarnings(result.validation.warnings);
            }
            
            // アプリケーション状態を更新
            this.appState.setFile(file, result.content);
            
            // プレビュー表示
            const previewSuccess = this.fileHandler.displayPreview(result.content, result.fileInfo, result.validation);
            
            if (previewSuccess) {
                this.appState.completeFileLoading();
                
                // 変換オプションを表示
                elements.conversionOptions.style.display = 'block';
                
                // サイズプレビューを更新
                this.updateSizePreview();
                
                // 詳細な成功メッセージ
                let successMessage = `ファイル "${result.fileInfo.name}" が正常に読み込まれました`;
                let details = '';
                let nextSteps = [];
                
                if (result.validation && result.validation.info) {
                    const info = result.validation.info;
                    if (info.content && info.content.contentTypes.length > 0) {
                        details = `コンテンツ: ${info.content.contentTypes.join(', ')}`;
                    }
                    if (info.content && info.content.elementCount > 0) {
                        details += details ? ` | 要素数: ${info.content.elementCount}個` : `要素数: ${info.content.elementCount}個`;
                    }
                }
                
                // 次のステップガイダンス
                nextSteps.push({
                    label: 'PNGに変換',
                    handler: () => {
                        this.hideMessages();
                        this.handleConversion();
                    }
                });
                
                nextSteps.push({
                    label: '別のファイルを選択',
                    handler: () => {
                        this.hideMessages();
                        elements.fileInput.click();
                    }
                });
                
                this.showSuccess(successMessage, {
                    icon: '📁',
                    title: 'ファイル読み込み完了',
                    details: details,
                    nextSteps: nextSteps,
                    autoHideDelay: 8000
                });
            } else {
                this.appState.failFileLoading('プレビューの表示に失敗しました');
            }
            
        } catch (error) {
            console.error('ファイル選択エラー:', error);
            
            // エラータイプに応じた詳細なメッセージ表示
            this.handleFileSelectionError(error);
            this.resetUIForError();
        }
    }

    // ファイル選択エラーの詳細処理
    handleFileSelectionError(error) {
        let errorMessage = error.message || '不明なエラーが発生しました';
        let suggestion = error.suggestion || 'ファイルを再選択してください';
        
        // エラータイプに応じた処理
        switch (error.type) {
            case 'VALIDATION_ERROR':
                if (error.errors && error.errors.length > 0) {
                    const primaryError = error.errors[0];
                    errorMessage = primaryError.message;
                    suggestion = primaryError.suggestion;
                    
                    // 複数のエラーがある場合は追加情報を表示
                    if (error.errors.length > 1) {
                        const additionalErrors = error.errors.slice(1).map(err => err.message).join('\n');
                        errorMessage += `\n\n追加の問題:\n${additionalErrors}`;
                    }
                }
                break;
                
            case 'READ_TIMEOUT':
                errorMessage = 'ファイル読み込みがタイムアウトしました';
                suggestion = 'より小さなファイルを選択するか、しばらく待ってから再試行してください';
                break;
                
            case 'INVALID_SVG':
                errorMessage = `無効なSVGファイルです: ${error.message}`;
                suggestion = error.suggestion || 'SVGエディタでファイルを確認し、修正してください';
                break;
                
            case 'PROCESSING_ERROR':
                errorMessage = 'ファイルの処理中にエラーが発生しました';
                suggestion = 'ファイルを再選択するか、別のSVGファイルを試してください';
                break;
                
            case 'READ_ERROR':
                errorMessage = error.message;
                suggestion = error.suggestion || 'ファイルを再選択してください';
                break;
                
            default:
                // 一般的なエラー処理
                if (error.message.includes('ファイルサイズ')) {
                    suggestion = 'より小さなSVGファイルを選択してください';
                } else if (error.message.includes('SVG')) {
                    suggestion = '有効なSVGファイルを選択してください';
                }
        }
        
        // エラー状態を更新
        this.appState.failFileLoading(errorMessage);
        
        // 詳細なエラーメッセージを表示
        this.showDetailedError(errorMessage, suggestion, error.type);
    }

    // 包括的な変換処理
    async handleConversion() {
        // 変換前の状態チェック
        if (!this.appState.isValidForConversion()) {
            const currentState = this.appState.getState();
            let errorMessage = '変換を実行できません';
            let suggestion = '';
            
            if (!currentState.svgContent) {
                errorMessage = 'SVGファイルが読み込まれていません';
                suggestion = 'まずSVGファイルを選択してください';
            } else if (currentState.isConverting) {
                errorMessage = '変換処理が既に実行中です';
                suggestion = '現在の変換が完了するまでお待ちください';
            } else if (currentState.isLoading) {
                errorMessage = '他の処理が実行中です';
                suggestion = '処理が完了するまでお待ちください';
            }
            
            this.showDetailedError(errorMessage, suggestion, 'INVALID_STATE');
            return;
        }

        try {
            // 変換開始
            this.appState.startConversion();
            
            // 詳細なローディング表示
            const currentFile = this.appState.get('currentFile');
            this.showLoadingState('SVGをPNGに変換中...', {
                details: currentFile ? `${currentFile.name} を処理中` : 'SVGファイルを処理中',
                spinnerType: 'dots',
                showProgress: true
            });
            
            // プログレス更新のシミュレーション
            this.simulateConversionProgress();
            
            // 変換前の準備チェック
            const svgContent = this.appState.get('svgContent');
            if (!svgContent || svgContent.trim().length === 0) {
                throw new Error('SVGコンテンツが空です');
            }
            
            // パフォーマンス最適化: 品質を自動調整
            const quality = this.calculateOptimalQuality(currentFile, svgContent);
            console.log(`最適化された品質設定: ${quality}`);
            
            // 透明背景オプションを取得
            const transparentBackground = this.appState.get('transparentBackground');
            
            // サイズオプションを取得
            const sizeOptions = {
                outputSize: this.appState.get('outputSize'),
                customWidth: this.appState.get('customWidth'),
                customHeight: this.appState.get('customHeight')
            };
            
            // 変換実行
            const result = await this.svgConverter.convertSVGToPNG(svgContent, quality, transparentBackground, sizeOptions);
            
            // 変換結果の検証
            if (!result || !result.pngData) {
                throw new Error('変換結果が無効です');
            }
            
            // 変換完了
            this.appState.completeConversion(result.pngData);
            
            // PNGプレビューを表示
            this.displayPNGPreview(result);
            
            // 変換完了のフィードバック
            this.showConversionSuccess(result);
            
            // 操作ガイダンスを表示
            this.showOperationGuidance('conversion_complete');
            
        } catch (error) {
            console.error('変換エラー:', error);
            this.handleConversionError(error);
        }
    }

    // 変換エラーの詳細処理
    handleConversionError(error) {
        let errorMessage = error.message || '変換中に不明なエラーが発生しました';
        let suggestion = '再度変換を試してください';
        let errorType = 'CONVERSION_ERROR';
        
        // エラータイプに応じた詳細な処理
        if (error.message.includes('Canvas')) {
            errorMessage = 'Canvas描画エラーが発生しました';
            suggestion = 'SVGファイルの内容を確認し、より単純なSVGファイルを試してください';
            errorType = 'CANVAS_ERROR';
        } else if (error.message.includes('メモリ')) {
            errorMessage = 'メモリ不足により変換に失敗しました';
            suggestion = 'より小さなSVGファイルを使用するか、ブラウザを再起動してください';
            errorType = 'MEMORY_ERROR';
        } else if (error.message.includes('タイムアウト')) {
            errorMessage = '変換処理がタイムアウトしました';
            suggestion = 'より単純なSVGファイルを使用するか、しばらく待ってから再試行してください';
            errorType = 'TIMEOUT_ERROR';
        } else if (error.message.includes('サイズ')) {
            errorMessage = 'SVGのサイズが大きすぎて変換できません';
            suggestion = 'SVGのサイズを小さくしてから再試行してください';
            errorType = 'SIZE_ERROR';
        } else if (error.message.includes('空')) {
            errorMessage = 'SVGコンテンツが空のため変換できません';
            suggestion = '有効なSVGファイルを選択してください';
            errorType = 'EMPTY_CONTENT_ERROR';
        }
        
        // エラー状態を更新
        this.appState.failConversion(errorMessage);
        
        // 詳細なエラーメッセージを表示
        this.showDetailedError(errorMessage, suggestion, errorType);
        
        // UI状態をリセット
        this.resetUIForConversionError();
    }

    // 変換成功時のフィードバック
    showConversionSuccess(result) {
        // ボタンのビジュアルフィードバック
        elements.convertBtn.classList.add('conversion-complete');
        setTimeout(() => {
            elements.convertBtn.classList.remove('conversion-complete');
        }, 2000);
        
        // 詳細な成功メッセージ
        let successMessage = 'PNG変換が完了しました';
        let details = '';
        
        if (result.width && result.height) {
            details += `サイズ: ${result.width}×${result.height}px`;
        }
        if (result.pngData && result.pngData.size) {
            details += details ? ` | ファイルサイズ: ${formatFileSize(result.pngData.size)}` : `ファイルサイズ: ${formatFileSize(result.pngData.size)}`;
        }
        
        // 次のステップガイダンス
        const nextSteps = [
            {
                label: 'PNGをダウンロード',
                handler: () => {
                    this.hideMessages();
                    this.handleDownload();
                }
            },
            {
                label: '別のSVGを変換',
                handler: () => {
                    this.hideMessages();
                    elements.fileInput.click();
                }
            }
        ];
        
        this.showSuccess(successMessage, {
            icon: '🎨',
            title: '変換完了',
            details: details,
            nextSteps: nextSteps,
            autoHideDelay: 10000
        });
    }

    // 変換プログレスのシミュレーション
    simulateConversionProgress() {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15 + 5; // 5-20%ずつ増加
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
            }
            
            this.updateProgress(progress);
            
            // プログレスに応じてメッセージを更新
            if (progress < 30) {
                this.updateLoadingMessage('SVGを解析中...');
            } else if (progress < 60) {
                this.updateLoadingMessage('Canvasに描画中...');
            } else if (progress < 90) {
                this.updateLoadingMessage('PNGデータを生成中...');
            } else {
                this.updateLoadingMessage('変換を完了中...');
            }
        }, 200);
        
        // 安全のため10秒後にクリア
        setTimeout(() => {
            clearInterval(progressInterval);
        }, 10000);
    }

    // 変換エラー時のUI状態リセット
    resetUIForConversionError() {
        // 変換ボタンを再度有効化（SVGが読み込まれている場合）
        if (this.appState.get('svgContent')) {
            elements.convertBtn.disabled = false;
        }
        
        // PNGプレビューをクリア
        elements.pngPreview.style.display = 'none';
        elements.pngPreviewContent.innerHTML = '';
    }

    // 操作ガイダンスの表示
    showOperationGuidance(context) {
        try {
            // ガイダンス要素を作成または取得
            let guidanceElement = document.getElementById('operationGuidance');
            if (!guidanceElement) {
                guidanceElement = document.createElement('div');
                guidanceElement.id = 'operationGuidance';
                guidanceElement.className = 'operation-guidance';
                elements.successMessage.parentNode.insertBefore(guidanceElement, elements.successMessage.nextSibling);
            }
            
            // コンテキストに応じたガイダンス内容
            const guidanceContent = this.getGuidanceContent(context);
            if (!guidanceContent) return;
            
            guidanceElement.innerHTML = '';
            
            // ガイダンスヘッダー
            const header = document.createElement('div');
            header.className = 'guidance-header';
            header.innerHTML = `
                <div class="guidance-icon">${guidanceContent.icon}</div>
                <div class="guidance-title">${guidanceContent.title}</div>
            `;
            guidanceElement.appendChild(header);
            
            // ガイダンス内容
            const content = document.createElement('div');
            content.className = 'guidance-content';
            
            guidanceContent.tips.forEach(tip => {
                const tipItem = document.createElement('div');
                tipItem.className = 'guidance-tip';
                tipItem.innerHTML = `
                    <div class="tip-icon">💡</div>
                    <div class="tip-text">${tip}</div>
                `;
                content.appendChild(tipItem);
            });
            
            guidanceElement.appendChild(content);
            
            // 閉じるボタン
            const closeBtn = document.createElement('button');
            closeBtn.className = 'guidance-close-btn';
            closeBtn.textContent = '理解しました';
            closeBtn.onclick = () => this.hideOperationGuidance();
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'guidance-actions';
            actionsDiv.appendChild(closeBtn);
            guidanceElement.appendChild(actionsDiv);
            
            // 表示
            guidanceElement.style.display = 'block';
            
            // 自動非表示（15秒後）
            setTimeout(() => {
                if (guidanceElement.style.display === 'block') {
                    this.hideOperationGuidance();
                }
            }, 15000);
            
        } catch (error) {
            console.error('操作ガイダンス表示エラー:', error);
        }
    }

    // コンテキストに応じたガイダンス内容を取得
    getGuidanceContent(context) {
        const guidanceMap = {
            'conversion_complete': {
                icon: '🎯',
                title: '変換のコツ',
                tips: [
                    'より高品質な変換のため、SVGファイルにwidth/height属性を設定することを推奨します',
                    '複雑なSVGファイルは変換に時間がかかる場合があります',
                    'アニメーション要素は最初のフレームのみが変換されます'
                ]
            },
            'download_complete': {
                icon: '📋',
                title: '便利な使い方',
                tips: [
                    'ダウンロードしたPNGファイルは元のSVGファイル名に基づいて命名されます',
                    '複数のSVGファイルを連続して変換することができます',
                    'ブラウザの設定でダウンロード先フォルダを指定できます'
                ]
            },
            'first_use': {
                icon: '🚀',
                title: '使い方ガイド',
                tips: [
                    'SVGファイルをドラッグ&ドロップするか、「ファイルを選択」ボタンをクリックしてください',
                    'ファイルが読み込まれたら「PNGに変換」ボタンをクリックします',
                    '変換が完了したら「PNGをダウンロード」ボタンでファイルを保存できます'
                ]
            }
        };
        
        return guidanceMap[context] || null;
    }

    // 操作ガイダンスを非表示
    hideOperationGuidance() {
        const guidanceElement = document.getElementById('operationGuidance');
        if (guidanceElement) {
            guidanceElement.style.display = 'none';
        }
    }

    // 最適な品質設定を計算
    calculateOptimalQuality(file, svgContent) {
        let quality = 0.95; // デフォルト品質
        
        try {
            // ファイルサイズに基づく調整
            if (file && file.size > 5 * 1024 * 1024) { // 5MB以上
                quality = 0.85;
            } else if (file && file.size > 2 * 1024 * 1024) { // 2MB以上
                quality = 0.90;
            }
            
            // SVGの複雑さに基づく調整
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            
            if (svgElement) {
                const elementCount = svgElement.querySelectorAll('*').length;
                const pathCount = svgElement.querySelectorAll('path').length;
                
                // 要素数が多い場合は品質を下げる
                if (elementCount > 500) {
                    quality = Math.min(quality, 0.80);
                } else if (elementCount > 200) {
                    quality = Math.min(quality, 0.85);
                }
                
                // パス要素が多い場合は品質を下げる
                if (pathCount > 100) {
                    quality = Math.min(quality, 0.80);
                } else if (pathCount > 50) {
                    quality = Math.min(quality, 0.85);
                }
            }
            
            // メモリ使用量に基づく調整
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (memoryUsage > 0.7) { // 70%以上
                    quality = Math.min(quality, 0.75);
                } else if (memoryUsage > 0.5) { // 50%以上
                    quality = Math.min(quality, 0.85);
                }
            }
            
            // 最小品質を保証
            quality = Math.max(quality, 0.5);
            
        } catch (error) {
            console.warn('品質計算でエラーが発生しました:', error);
            quality = 0.85; // 安全な品質設定
        }
        
        return quality;
    }

    // 包括的なダウンロード処理
    handleDownload() {
        // ダウンロード前の状態チェック
        if (!this.appState.isValidForDownload()) {
            const currentState = this.appState.getState();
            let errorMessage = 'ダウンロードを実行できません';
            let suggestion = '';
            
            if (!currentState.pngData) {
                errorMessage = 'PNGデータが生成されていません';
                suggestion = 'まずSVGファイルを変換してください';
            } else if (currentState.isConverting) {
                errorMessage = '変換処理が実行中です';
                suggestion = '変換が完了するまでお待ちください';
            } else if (currentState.isLoading) {
                errorMessage = '他の処理が実行中です';
                suggestion = '処理が完了するまでお待ちください';
            }
            
            this.showDetailedError(errorMessage, suggestion, 'INVALID_DOWNLOAD_STATE');
            return;
        }

        try {
            // ダウンロード開始
            this.appState.startDownload();
            
            // ダウンロード準備のローディング表示
            this.showLoadingState('ダウンロードを準備中...', {
                details: 'PNGファイルを生成中',
                spinnerType: 'pulse'
            });
            
            // 必要なデータの検証
            const pngData = this.appState.get('pngData');
            const currentFile = this.appState.get('currentFile');
            
            if (!pngData) {
                throw new Error('PNGデータが見つかりません');
            }
            
            if (!currentFile || !currentFile.name) {
                throw new Error('元のファイル名が見つかりません');
            }
            
            // ダウンロード実行
            const result = this.svgConverter.downloadPNG(pngData, currentFile.name);
            
            // ダウンロード完了
            this.appState.completeDownload();
            
            // ダウンロード成功のフィードバック
            this.showDownloadSuccess(result, pngData);
            
        } catch (error) {
            console.error('ダウンロードエラー:', error);
            this.handleDownloadError(error);
        }
    }

    // ダウンロードエラーの詳細処理
    handleDownloadError(error) {
        let errorMessage = error.message || 'ダウンロード中に不明なエラーが発生しました';
        let suggestion = '再度ダウンロードを試してください';
        let errorType = 'DOWNLOAD_ERROR';
        
        // エラータイプに応じた詳細な処理
        if (error.message.includes('Blob')) {
            errorMessage = 'ファイルデータの生成に失敗しました';
            suggestion = '変換からやり直してください';
            errorType = 'BLOB_ERROR';
        } else if (error.message.includes('URL')) {
            errorMessage = 'ダウンロードURLの生成に失敗しました';
            suggestion = 'ブラウザを再読み込みして再試行してください';
            errorType = 'URL_ERROR';
        } else if (error.message.includes('ファイル名')) {
            errorMessage = 'ファイル名の生成に失敗しました';
            suggestion = 'ファイルを再選択してから変換してください';
            errorType = 'FILENAME_ERROR';
        } else if (error.message.includes('見つかりません')) {
            errorMessage = '必要なデータが見つかりません';
            suggestion = 'SVGファイルを再選択して変換からやり直してください';
            errorType = 'DATA_MISSING_ERROR';
        }
        
        // エラーメッセージを表示
        this.showDetailedError(errorMessage, suggestion, errorType);
        
        // ダウンロード状態をリセット
        this.appState.completeDownload();
    }

    // ダウンロード成功時のフィードバック
    showDownloadSuccess(result, pngData) {
        // ボタンのビジュアルフィードバック
        elements.downloadBtn.classList.add('download-ready');
        setTimeout(() => {
            elements.downloadBtn.classList.remove('download-ready');
        }, 2000);
        
        // 詳細な成功メッセージ
        let successMessage = `ファイル "${result.fileName}" のダウンロードを開始しました`;
        let details = '';
        
        if (pngData && pngData.size) {
            details = `ファイルサイズ: ${formatFileSize(pngData.size)}`;
        }
        
        // 次のステップガイダンス
        const nextSteps = [
            {
                label: '別のSVGを変換',
                handler: () => {
                    this.hideMessages();
                    elements.fileInput.click();
                }
            },
            {
                label: '同じファイルを再変換',
                handler: () => {
                    this.hideMessages();
                    if (this.appState.get('svgContent')) {
                        this.handleConversion();
                    }
                }
            }
        ];
        
        this.showSuccess(successMessage, {
            icon: '⬇️',
            title: 'ダウンロード開始',
            details: details,
            nextSteps: nextSteps,
            autoHideDelay: 8000
        });
        
        // 操作ガイダンスを表示
        this.showOperationGuidance('download_complete');
    }

    // UI状態管理（ボタンの有効/無効化）
    updateButtonStates(states) {
        if (states.convertEnabled !== undefined) {
            elements.convertBtn.disabled = !states.convertEnabled;
        }
        
        if (states.downloadEnabled !== undefined) {
            elements.downloadBtn.disabled = !states.downloadEnabled;
        }
    }

    // 基本的なエラーメッセージ表示機能
    showError(message) {
        this.showDetailedError(message, null, 'GENERAL_ERROR');
    }

    // 詳細なエラーメッセージ表示機能
    showDetailedError(message, suggestion = null, errorType = 'GENERAL_ERROR') {
        try {
            // エラーメッセージ要素をクリア
            elements.errorMessage.innerHTML = '';
            
            // メインエラーメッセージ
            const errorContent = document.createElement('div');
            errorContent.className = 'error-content';
            
            const errorIcon = document.createElement('div');
            errorIcon.className = 'error-icon';
            errorIcon.textContent = this.getErrorIcon(errorType);
            
            const errorText = document.createElement('div');
            errorText.className = 'error-text';
            
            const errorTitle = document.createElement('div');
            errorTitle.className = 'error-title';
            errorTitle.textContent = this.getErrorTitle(errorType);
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message-text';
            errorMessage.textContent = message;
            
            errorText.appendChild(errorTitle);
            errorText.appendChild(errorMessage);
            
            errorContent.appendChild(errorIcon);
            errorContent.appendChild(errorText);
            
            elements.errorMessage.appendChild(errorContent);
            
            // 提案がある場合は追加
            if (suggestion) {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'error-suggestion';
                suggestionDiv.innerHTML = `<strong>解決方法:</strong> ${suggestion}`;
                elements.errorMessage.appendChild(suggestionDiv);
            }
            
            // 操作ガイダンスを追加
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'error-actions';
            
            const dismissBtn = document.createElement('button');
            dismissBtn.className = 'error-dismiss-btn';
            dismissBtn.textContent = '閉じる';
            dismissBtn.onclick = () => this.hideMessages();
            
            actionsDiv.appendChild(dismissBtn);
            
            // エラータイプに応じた追加アクション
            const additionalActions = this.getErrorActions(errorType);
            additionalActions.forEach(action => {
                const actionBtn = document.createElement('button');
                actionBtn.className = 'error-action-btn';
                actionBtn.textContent = action.label;
                actionBtn.onclick = action.handler;
                actionsDiv.appendChild(actionBtn);
            });
            
            elements.errorMessage.appendChild(actionsDiv);
            
            // 表示
            elements.errorMessage.style.display = 'block';
            elements.successMessage.style.display = 'none';
            this.hideWarnings();
            
            // エラーメッセージを上部にスクロール
            elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // 自動非表示（15秒後）
            setTimeout(() => {
                if (elements.errorMessage.style.display === 'block') {
                    this.hideMessages();
                }
            }, 15000);
            
        } catch (displayError) {
            console.error('エラーメッセージ表示中にエラー:', displayError);
            // フォールバック: シンプルなエラー表示
            elements.errorMessage.textContent = message;
            elements.errorMessage.style.display = 'block';
            elements.successMessage.style.display = 'none';
        }
    }

    // エラータイプに応じたアイコンを取得
    getErrorIcon(errorType) {
        const icons = {
            'VALIDATION_ERROR': '⚠️',
            'READ_ERROR': '📄',
            'INVALID_SVG': '🖼️',
            'CONVERSION_ERROR': '🔄',
            'CANVAS_ERROR': '🎨',
            'MEMORY_ERROR': '💾',
            'TIMEOUT_ERROR': '⏱️',
            'SIZE_ERROR': '📏',
            'DOWNLOAD_ERROR': '⬇️',
            'SECURITY_RISK': '🔒',
            'GENERAL_ERROR': '❌'
        };
        return icons[errorType] || '❌';
    }

    // エラータイプに応じたタイトルを取得
    getErrorTitle(errorType) {
        const titles = {
            'VALIDATION_ERROR': 'ファイル検証エラー',
            'READ_ERROR': 'ファイル読み込みエラー',
            'INVALID_SVG': 'SVG形式エラー',
            'CONVERSION_ERROR': '変換エラー',
            'CANVAS_ERROR': 'Canvas描画エラー',
            'MEMORY_ERROR': 'メモリエラー',
            'TIMEOUT_ERROR': 'タイムアウトエラー',
            'SIZE_ERROR': 'サイズエラー',
            'DOWNLOAD_ERROR': 'ダウンロードエラー',
            'SECURITY_RISK': 'セキュリティエラー',
            'GENERAL_ERROR': 'エラー'
        };
        return titles[errorType] || 'エラー';
    }

    // エラータイプに応じた追加アクションを取得
    getErrorActions(errorType) {
        const actions = [];
        
        switch (errorType) {
            case 'VALIDATION_ERROR':
            case 'INVALID_SVG':
                actions.push({
                    label: '別のファイルを選択',
                    handler: () => {
                        this.hideMessages();
                        elements.fileInput.click();
                    }
                });
                break;
                
            case 'CONVERSION_ERROR':
            case 'CANVAS_ERROR':
                if (this.appState.get('svgContent')) {
                    actions.push({
                        label: '再変換',
                        handler: () => {
                            this.hideMessages();
                            this.handleConversion();
                        }
                    });
                }
                break;
                
            case 'DOWNLOAD_ERROR':
                if (this.appState.get('pngData')) {
                    actions.push({
                        label: '再ダウンロード',
                        handler: () => {
                            this.hideMessages();
                            this.handleDownload();
                        }
                    });
                }
                break;
                
            case 'MEMORY_ERROR':
                actions.push({
                    label: 'ページを再読み込み',
                    handler: () => {
                        if (confirm('ページを再読み込みしますか？現在の作業内容は失われます。')) {
                            window.location.reload();
                        }
                    }
                });
                break;
        }
        
        return actions;
    }

    // 包括的な成功メッセージ表示機能
    showSuccess(message, options = {}) {
        try {
            // 成功メッセージ要素をクリア
            elements.successMessage.innerHTML = '';
            
            // 成功メッセージコンテンツを構築
            const successContent = document.createElement('div');
            successContent.className = 'success-content';
            
            // アイコン
            const successIcon = document.createElement('div');
            successIcon.className = 'success-icon';
            successIcon.textContent = options.icon || '✅';
            
            // メッセージテキスト
            const successText = document.createElement('div');
            successText.className = 'success-text';
            
            const successTitle = document.createElement('div');
            successTitle.className = 'success-title';
            successTitle.textContent = options.title || '成功';
            
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message-text';
            successMessage.textContent = message;
            
            successText.appendChild(successTitle);
            successText.appendChild(successMessage);
            
            successContent.appendChild(successIcon);
            successContent.appendChild(successText);
            
            elements.successMessage.appendChild(successContent);
            
            // 詳細情報（オプション）
            if (options.details) {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'success-details';
                detailsDiv.textContent = options.details;
                elements.successMessage.appendChild(detailsDiv);
            }
            
            // 次のステップガイダンス（オプション）
            if (options.nextSteps && options.nextSteps.length > 0) {
                const nextStepsDiv = document.createElement('div');
                nextStepsDiv.className = 'success-next-steps';
                
                const nextStepsTitle = document.createElement('div');
                nextStepsTitle.className = 'next-steps-title';
                nextStepsTitle.textContent = '次にできること:';
                nextStepsDiv.appendChild(nextStepsTitle);
                
                const nextStepsList = document.createElement('div');
                nextStepsList.className = 'next-steps-list';
                
                options.nextSteps.forEach(step => {
                    const stepItem = document.createElement('button');
                    stepItem.className = 'next-step-btn';
                    stepItem.textContent = step.label;
                    stepItem.onclick = step.handler;
                    nextStepsList.appendChild(stepItem);
                });
                
                nextStepsDiv.appendChild(nextStepsList);
                elements.successMessage.appendChild(nextStepsDiv);
            }
            
            // 表示
            elements.successMessage.style.display = 'block';
            elements.errorMessage.style.display = 'none';
            this.hideWarnings();
            this.hideLoadingState();
            
            // 自動非表示（オプションで制御）
            const autoHideDelay = options.autoHideDelay !== undefined ? options.autoHideDelay : 5000;
            if (autoHideDelay > 0) {
                setTimeout(() => {
                    if (elements.successMessage.style.display === 'block') {
                        this.hideMessages();
                    }
                }, autoHideDelay);
            }
            
        } catch (displayError) {
            console.error('成功メッセージ表示中にエラー:', displayError);
            // フォールバック: シンプルな成功メッセージ
            elements.successMessage.textContent = message;
            elements.successMessage.style.display = 'block';
            elements.errorMessage.style.display = 'none';
        }
    }

    // 警告メッセージ表示機能
    showWarnings(warnings) {
        if (!warnings || warnings.length === 0) return;
        
        try {
            // 警告メッセージ要素を作成または取得
            let warningElement = document.getElementById('warningMessage');
            if (!warningElement) {
                warningElement = document.createElement('div');
                warningElement.id = 'warningMessage';
                warningElement.className = 'warning-message';
                elements.errorMessage.parentNode.insertBefore(warningElement, elements.errorMessage);
            }
            
            // 警告内容をクリア
            warningElement.innerHTML = '';
            
            // 警告ヘッダー
            const warningHeader = document.createElement('div');
            warningHeader.className = 'warning-header';
            warningHeader.innerHTML = `
                <div class="warning-icon">⚠️</div>
                <div class="warning-title">注意事項 (${warnings.length}件)</div>
            `;
            warningElement.appendChild(warningHeader);
            
            // 警告リスト
            const warningList = document.createElement('div');
            warningList.className = 'warning-list';
            
            warnings.forEach((warning, index) => {
                const warningItem = document.createElement('div');
                warningItem.className = 'warning-item';
                
                const warningMessage = document.createElement('div');
                warningMessage.className = 'warning-message-text';
                warningMessage.textContent = warning.message;
                
                warningItem.appendChild(warningMessage);
                
                if (warning.suggestion) {
                    const warningSuggestion = document.createElement('div');
                    warningSuggestion.className = 'warning-suggestion';
                    warningSuggestion.textContent = warning.suggestion;
                    warningItem.appendChild(warningSuggestion);
                }
                
                warningList.appendChild(warningItem);
            });
            
            warningElement.appendChild(warningList);
            
            // 閉じるボタン
            const dismissBtn = document.createElement('button');
            dismissBtn.className = 'warning-dismiss-btn';
            dismissBtn.textContent = '理解しました';
            dismissBtn.onclick = () => this.hideWarnings();
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'warning-actions';
            actionsDiv.appendChild(dismissBtn);
            warningElement.appendChild(actionsDiv);
            
            // 表示
            warningElement.style.display = 'block';
            
            // 自動非表示（20秒後）
            setTimeout(() => {
                if (warningElement.style.display === 'block') {
                    this.hideWarnings();
                }
            }, 20000);
            
        } catch (displayError) {
            console.error('警告メッセージ表示中にエラー:', displayError);
        }
    }

    // 警告メッセージ非表示
    hideWarnings() {
        const warningElement = document.getElementById('warningMessage');
        if (warningElement) {
            warningElement.style.display = 'none';
        }
    }

    // メッセージ非表示
    hideMessages() {
        elements.errorMessage.style.display = 'none';
        elements.successMessage.style.display = 'none';
        this.hideWarnings();
        this.hideLoadingState();
    }

    // 包括的なローディング状態表示
    showLoadingState(message, options = {}) {
        try {
            // ローディング表示用の要素を作成または更新
            let loadingElement = document.getElementById('loadingMessage');
            if (!loadingElement) {
                loadingElement = document.createElement('div');
                loadingElement.id = 'loadingMessage';
                loadingElement.className = 'loading-message';
                elements.errorMessage.parentNode.insertBefore(loadingElement, elements.errorMessage);
            }
            
            // ローディングコンテンツを構築
            const loadingContent = document.createElement('div');
            loadingContent.className = 'loading-content';
            
            // スピナー
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            if (options.spinnerType === 'dots') {
                spinner.className += ' loading-dots';
                spinner.innerHTML = '<div></div><div></div><div></div>';
            } else if (options.spinnerType === 'pulse') {
                spinner.className += ' loading-pulse';
            }
            
            // メッセージ
            const messageSpan = document.createElement('span');
            messageSpan.className = 'loading-message-text';
            messageSpan.textContent = message;
            
            loadingContent.appendChild(spinner);
            loadingContent.appendChild(messageSpan);
            
            // プログレスバー（オプション）
            if (options.showProgress) {
                const progressContainer = document.createElement('div');
                progressContainer.className = 'loading-progress-container';
                
                const progressBar = document.createElement('div');
                progressBar.className = 'loading-progress-bar';
                progressBar.id = 'loadingProgressBar';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'loading-progress-fill';
                progressFill.style.width = '0%';
                
                progressBar.appendChild(progressFill);
                progressContainer.appendChild(progressBar);
                loadingContent.appendChild(progressContainer);
            }
            
            // 詳細情報（オプション）
            if (options.details) {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'loading-details';
                detailsDiv.textContent = options.details;
                loadingContent.appendChild(detailsDiv);
            }
            
            // キャンセルボタン（オプション）
            if (options.cancellable && options.onCancel) {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'loading-cancel-btn';
                cancelBtn.textContent = 'キャンセル';
                cancelBtn.onclick = options.onCancel;
                loadingContent.appendChild(cancelBtn);
            }
            
            loadingElement.innerHTML = '';
            loadingElement.appendChild(loadingContent);
            loadingElement.style.display = 'block';
            
            // 他のメッセージを非表示
            elements.errorMessage.style.display = 'none';
            elements.successMessage.style.display = 'none';
            this.hideWarnings();
            
        } catch (error) {
            console.error('ローディング状態表示エラー:', error);
            // フォールバック: シンプルなローディング表示
            this.showSimpleLoadingState(message);
        }
    }

    // シンプルなローディング状態表示（フォールバック）
    showSimpleLoadingState(message) {
        let loadingElement = document.getElementById('loadingMessage');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loadingMessage';
            loadingElement.className = 'loading-message';
            elements.errorMessage.parentNode.insertBefore(loadingElement, elements.errorMessage);
        }
        
        loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
        loadingElement.style.display = 'block';
    }

    // プログレスバーの更新
    updateProgress(percentage) {
        const progressFill = document.querySelector('#loadingProgressBar .loading-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    // ローディングメッセージの更新
    updateLoadingMessage(message) {
        const messageElement = document.querySelector('#loadingMessage .loading-message-text');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    // ローディング状態非表示
    hideLoadingState() {
        const loadingElement = document.getElementById('loadingMessage');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // 新しいファイル用のUI状態リセット
    resetUIForNewFile() {
        // プレビューをクリア
        elements.svgPreviewContent.innerHTML = '';
        elements.pngPreviewContent.innerHTML = '';
        elements.svgPreview.style.display = 'none';
        elements.pngPreview.style.display = 'none';
        elements.fileInfo.style.display = 'none';
        elements.conversionOptions.style.display = 'none';
        
        // ボタン状態をリセット
        this.updateButtonStates({
            convertEnabled: false,
            downloadEnabled: false
        });
        
        // メッセージをクリア
        this.hideMessages();
        
        // ファイル入力をクリア
        elements.fileInput.value = '';
    }

    // エラー時のUI状態リセット
    resetUIForError() {
        this.updateButtonStates({
            convertEnabled: false,
            downloadEnabled: false
        });
    }

    // PNGプレビュー表示
    displayPNGPreview(conversionResult) {
        try {
            // プレビューコンテナをクリア
            elements.pngPreviewContent.innerHTML = '';
            
            // PNG画像要素を作成
            const img = document.createElement('img');
            img.src = conversionResult.pngData.dataUrl;
            img.alt = 'Converted PNG';
            img.className = 'png-preview-image';
            
            // 透明背景が有効な場合はチェッカーボード背景を追加
            const transparentBackground = this.appState.get('transparentBackground');
            let imageContainer;
            
            if (transparentBackground) {
                imageContainer = document.createElement('div');
                imageContainer.className = 'transparency-background';
                imageContainer.appendChild(img);
            } else {
                imageContainer = img;
            }
            
            // PNG情報を作成
            const infoDiv = document.createElement('div');
            infoDiv.className = 'png-info';
            
            // サイズ情報を詳細に表示
            let sizeInfo = `${conversionResult.width} × ${conversionResult.height}px`;
            if (conversionResult.originalWidth && conversionResult.originalHeight) {
                const originalSize = `${Math.round(conversionResult.originalWidth)} × ${Math.round(conversionResult.originalHeight)}px`;
                if (originalSize !== sizeInfo) {
                    sizeInfo += ` <small>(元: ${originalSize})</small>`;
                }
            }
            
            infoDiv.innerHTML = `
                <div class="info-row">
                    <span class="info-label">出力サイズ:</span>
                    <span class="info-value">${sizeInfo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">ファイルサイズ:</span>
                    <span class="info-value">${formatFileSize(conversionResult.pngData.size)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">形式:</span>
                    <span class="info-value">PNG</span>
                </div>
                <div class="info-row">
                    <span class="info-label">透明背景:</span>
                    <span class="info-value">${transparentBackground ? '有効' : '無効'}</span>
                </div>
            `;
            
            // 検証情報がある場合は追加
            if (conversionResult.validation) {
                const validationDiv = document.createElement('div');
                validationDiv.className = 'validation-info';
                
                if (conversionResult.validation.actualWidth !== conversionResult.width ||
                    conversionResult.validation.actualHeight !== conversionResult.height) {
                    validationDiv.innerHTML += `
                        <div class="info-row warning">
                            <span class="info-label">実際のサイズ:</span>
                            <span class="info-value">${conversionResult.validation.actualWidth} × ${conversionResult.validation.actualHeight}px</span>
                        </div>
                    `;
                }
                
                if (validationDiv.innerHTML) {
                    infoDiv.appendChild(validationDiv);
                }
            }
            
            // ラッパーを作成
            const wrapper = document.createElement('div');
            wrapper.className = 'png-preview-wrapper';
            wrapper.appendChild(imageContainer);
            wrapper.appendChild(infoDiv);
            
            elements.pngPreviewContent.appendChild(wrapper);
            elements.pngPreview.style.display = 'block';
            
        } catch (error) {
            console.error('PNGプレビュー表示エラー:', error);
            this.displayPNGPreviewError(error.message);
        }
    }

    // PNGプレビューエラー表示
    displayPNGPreviewError(errorMessage) {
        elements.pngPreviewContent.innerHTML = `
            <div class="preview-error png-preview-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">
                    <h4>PNGプレビューエラー</h4>
                    <p>${errorMessage}</p>
                </div>
            </div>
        `;
        elements.pngPreview.style.display = 'block';
    }

    // PNGプレビューの透明背景表示を更新
    updatePNGPreviewTransparency(transparentBackground) {
        try {
            const pngPreviewWrapper = elements.pngPreviewContent.querySelector('.png-preview-wrapper');
            if (!pngPreviewWrapper) return;

            const img = pngPreviewWrapper.querySelector('.png-preview-image');
            if (!img) return;

            // 現在のコンテナを取得
            const currentContainer = img.parentElement;
            
            if (transparentBackground) {
                // 透明背景を有効にする場合
                if (!currentContainer.classList.contains('transparency-background')) {
                    const transparencyContainer = document.createElement('div');
                    transparencyContainer.className = 'transparency-background';
                    
                    // 画像を新しいコンテナに移動
                    currentContainer.removeChild(img);
                    transparencyContainer.appendChild(img);
                    pngPreviewWrapper.insertBefore(transparencyContainer, pngPreviewWrapper.firstChild);
                }
            } else {
                // 透明背景を無効にする場合
                if (currentContainer.classList.contains('transparency-background')) {
                    // 画像を直接ラッパーに移動
                    currentContainer.removeChild(img);
                    pngPreviewWrapper.removeChild(currentContainer);
                    pngPreviewWrapper.insertBefore(img, pngPreviewWrapper.firstChild);
                }
            }

            // PNG情報の透明背景表示を更新
            const transparencyInfo = pngPreviewWrapper.querySelector('.info-row:last-child .info-value');
            if (transparencyInfo && transparencyInfo.parentElement.querySelector('.info-label').textContent === '透明背景:') {
                transparencyInfo.textContent = transparentBackground ? '有効' : '無効';
            }

        } catch (error) {
            console.error('PNGプレビューの透明背景表示更新エラー:', error);
        }
    }

    // カスタムサイズ入力の表示/非表示を切り替え
    toggleCustomSizeInputs(show) {
        if (show) {
            elements.customSizeInputs.style.display = 'block';
            // 現在のSVGサイズを取得してプレースホルダーに設定
            const svgContent = this.appState.get('svgContent');
            if (svgContent) {
                const dimensions = this.extractSVGDimensions(svgContent);
                if (dimensions.width && dimensions.height) {
                    elements.customWidth.placeholder = `例: ${Math.round(dimensions.width)}`;
                    elements.customHeight.placeholder = `例: ${Math.round(dimensions.height)}`;
                }
            }
        } else {
            elements.customSizeInputs.style.display = 'none';
            // カスタムサイズの値をクリア
            elements.customWidth.value = '';
            elements.customHeight.value = '';
            this.appState.setCustomWidth(null);
            this.appState.setCustomHeight(null);
        }
    }

    // サイズプレビュー情報を更新
    updateSizePreview() {
        const outputSize = this.appState.get('outputSize');
        const customWidth = this.appState.get('customWidth');
        const customHeight = this.appState.get('customHeight');
        const svgContent = this.appState.get('svgContent');

        if (!svgContent) {
            elements.sizeInfo.textContent = 'アスペクト比を維持して調整されます';
            return;
        }

        const originalDimensions = this.extractSVGDimensions(svgContent);
        let targetDimensions = null;

        if (outputSize === 'original') {
            targetDimensions = originalDimensions;
        } else if (outputSize === 'custom') {
            if (customWidth || customHeight) {
                targetDimensions = this.calculateAspectRatioSize(
                    originalDimensions,
                    customWidth,
                    customHeight
                );
            }
        } else {
            // プリセットサイズの場合
            const [width, height] = outputSize.split('x').map(Number);
            targetDimensions = this.calculateAspectRatioSize(
                originalDimensions,
                width,
                height
            );
        }

        if (targetDimensions) {
            elements.sizeInfo.innerHTML = `
                <strong>出力サイズ:</strong> ${Math.round(targetDimensions.width)} × ${Math.round(targetDimensions.height)} px
                ${originalDimensions.width && originalDimensions.height ? 
                    `<br><small>元のサイズ: ${Math.round(originalDimensions.width)} × ${Math.round(originalDimensions.height)} px</small>` : 
                    ''
                }
            `;
        } else {
            elements.sizeInfo.textContent = 'アスペクト比を維持して調整されます';
        }
    }

    // SVGの寸法を抽出
    extractSVGDimensions(svgContent) {
        try {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');
            
            if (!svgElement) return { width: null, height: null };

            let width = null;
            let height = null;

            // width/height属性から取得
            if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
                width = parseFloat(svgElement.getAttribute('width'));
                height = parseFloat(svgElement.getAttribute('height'));
            }

            // viewBox属性から取得
            if ((!width || !height) && svgElement.hasAttribute('viewBox')) {
                const viewBox = svgElement.getAttribute('viewBox').split(' ');
                if (viewBox.length === 4) {
                    width = parseFloat(viewBox[2]);
                    height = parseFloat(viewBox[3]);
                }
            }

            return { width, height };
        } catch (error) {
            console.error('SVG寸法抽出エラー:', error);
            return { width: null, height: null };
        }
    }

    // アスペクト比を維持したサイズ計算
    calculateAspectRatioSize(originalDimensions, targetWidth, targetHeight) {
        const { width: origWidth, height: origHeight } = originalDimensions;
        
        if (!origWidth || !origHeight) {
            return { width: targetWidth || 500, height: targetHeight || 500 };
        }

        const aspectRatio = origWidth / origHeight;

        if (targetWidth && targetHeight) {
            // 両方指定されている場合、アスペクト比を維持して小さい方に合わせる
            const widthBasedHeight = targetWidth / aspectRatio;
            const heightBasedWidth = targetHeight * aspectRatio;

            if (widthBasedHeight <= targetHeight) {
                return { width: targetWidth, height: widthBasedHeight };
            } else {
                return { width: heightBasedWidth, height: targetHeight };
            }
        } else if (targetWidth) {
            // 幅のみ指定
            return { width: targetWidth, height: targetWidth / aspectRatio };
        } else if (targetHeight) {
            // 高さのみ指定
            return { width: targetHeight * aspectRatio, height: targetHeight };
        }

        return originalDimensions;
    }

    // プレビューサイズ調整
    adjustPreviewSizes() {
        // ウィンドウリサイズ時にプレビューサイズを調整
        const svgElements = elements.svgPreviewContent.querySelectorAll('svg');
        svgElements.forEach(svg => {
            if (this.fileHandler) {
                this.fileHandler.maintainAspectRatio(svg);
            }
        });
    }
}

// 統合テスト関数群
class IntegrationTester {
    constructor(appState, fileHandler, svgConverter, uiController) {
        this.appState = appState;
        this.fileHandler = fileHandler;
        this.svgConverter = svgConverter;
        this.uiController = uiController;
        this.testResults = [];
    }

    // 新機能の統合テスト実行
    async runNewFeatureIntegrationTests() {
        console.log('🧪 新機能統合テストを開始します...');
        this.testResults = [];

        try {
            // テスト1: 透明背景と出力サイズの組み合わせテスト
            await this.testTransparentBackgroundWithSizeOptions();
            
            // テスト2: 既存機能との互換性確認
            await this.testBackwardCompatibility();
            
            // テスト3: エラーハンドリングの更新確認
            await this.testUpdatedErrorHandling();
            
            // テスト4: UI状態管理の統合テスト
            await this.testUIStateIntegration();
            
            // テスト5: パフォーマンステスト
            await this.testPerformanceWithNewFeatures();

            // テスト結果の表示
            this.displayTestResults();
            
        } catch (error) {
            console.error('統合テストでエラーが発生しました:', error);
            this.addTestResult('統合テスト実行', false, `テスト実行エラー: ${error.message}`);
        }
    }

    // テスト1: 透明背景と出力サイズの組み合わせテスト
    async testTransparentBackgroundWithSizeOptions() {
        console.log('📋 テスト1: 透明背景と出力サイズの組み合わせテスト');
        
        try {
            // テスト用SVGコンテンツ（透明背景を含む）
            const testSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="rgba(255, 0, 0, 0.5)" stroke="blue" stroke-width="2"/>
                <text x="50" y="55" text-anchor="middle" fill="black" font-size="12">Test</text>
            </svg>`;

            // 各サイズオプションと透明背景の組み合わせをテスト
            const sizeOptions = ['original', '100x100', '200x200', '500x500', 'custom'];
            const transparentOptions = [true, false];

            for (const size of sizeOptions) {
                for (const transparent of transparentOptions) {
                    const testName = `サイズ:${size}, 透明背景:${transparent}`;
                    
                    try {
                        // 状態を設定
                        this.appState.setOutputSize(size);
                        this.appState.setTransparentBackground(transparent);
                        
                        if (size === 'custom') {
                            this.appState.setCustomWidth(150);
                            this.appState.setCustomHeight(150);
                        }

                        // 変換オプションを準備
                        const sizeOpts = {
                            outputSize: size,
                            customWidth: size === 'custom' ? 150 : null,
                            customHeight: size === 'custom' ? 150 : null
                        };

                        // 変換実行
                        const result = await this.svgConverter.convertSVGToPNG(testSVG, 1.0, transparent, sizeOpts);
                        
                        // 結果検証
                        if (result && result.pngData) {
                            this.addTestResult(testName, true, `変換成功 - サイズ: ${result.width}x${result.height}`);
                        } else {
                            this.addTestResult(testName, false, '変換結果が無効');
                        }

                    } catch (error) {
                        this.addTestResult(testName, false, `変換エラー: ${error.message}`);
                    }
                }
            }

        } catch (error) {
            this.addTestResult('透明背景とサイズ組み合わせテスト', false, `テストエラー: ${error.message}`);
        }
    }

    // テスト2: 既存機能との互換性確認
    async testBackwardCompatibility() {
        console.log('📋 テスト2: 既存機能との互換性確認');
        
        try {
            // 基本的なSVGコンテンツ
            const basicSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
                <rect x="10" y="10" width="30" height="30" fill="red"/>
            </svg>`;

            // 新機能を無効にした状態でのテスト（従来の動作）
            this.appState.setOutputSize('original');
            this.appState.setTransparentBackground(true);
            this.appState.setCustomWidth(null);
            this.appState.setCustomHeight(null);

            // ファイル処理のテスト
            const mockFile = new File([basicSVG], 'test.svg', { type: 'image/svg+xml' });
            
            try {
                const fileResult = await this.fileHandler.readFile(mockFile);
                this.addTestResult('ファイル読み込み互換性', true, 'ファイル読み込み正常');
                
                // プレビュー表示のテスト
                const previewResult = this.fileHandler.displayPreview(fileResult.content, fileResult.fileInfo, fileResult.validation);
                this.addTestResult('プレビュー表示互換性', previewResult, previewResult ? 'プレビュー表示正常' : 'プレビュー表示失敗');
                
                // 変換処理のテスト
                const convertResult = await this.svgConverter.convertSVGToPNG(basicSVG, 1.0, true, { outputSize: 'original' });
                this.addTestResult('変換処理互換性', !!convertResult, convertResult ? '変換処理正常' : '変換処理失敗');
                
            } catch (error) {
                this.addTestResult('既存機能互換性', false, `互換性エラー: ${error.message}`);
            }

        } catch (error) {
            this.addTestResult('既存機能互換性テスト', false, `テストエラー: ${error.message}`);
        }
    }

    // テスト3: エラーハンドリングの更新確認
    async testUpdatedErrorHandling() {
        console.log('📋 テスト3: エラーハンドリングの更新確認');
        
        try {
            // 無効なカスタムサイズでのテスト
            this.appState.setOutputSize('custom');
            this.appState.setCustomWidth(-100); // 無効な値
            this.appState.setCustomHeight(0); // 無効な値

            const testSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
                <rect x="10" y="10" width="30" height="30" fill="blue"/>
            </svg>`;

            try {
                const result = await this.svgConverter.convertSVGToPNG(testSVG, 1.0, true, {
                    outputSize: 'custom',
                    customWidth: -100,
                    customHeight: 0
                });
                
                // エラーが発生すべきなのに成功した場合
                this.addTestResult('無効サイズエラーハンドリング', false, '無効なサイズでも変換が成功してしまった');
                
            } catch (error) {
                // 期待されるエラー
                this.addTestResult('無効サイズエラーハンドリング', true, `適切にエラーを検出: ${error.message}`);
            }

            // 極端に大きなサイズでのテスト
            this.appState.setCustomWidth(10000);
            this.appState.setCustomHeight(10000);

            try {
                const result = await this.svgConverter.convertSVGToPNG(testSVG, 1.0, true, {
                    outputSize: 'custom',
                    customWidth: 10000,
                    customHeight: 10000
                });
                
                this.addTestResult('大サイズ処理', !!result, result ? '大サイズ処理成功' : '大サイズ処理失敗');
                
            } catch (error) {
                this.addTestResult('大サイズエラーハンドリング', true, `大サイズエラー検出: ${error.message}`);
            }

        } catch (error) {
            this.addTestResult('エラーハンドリングテスト', false, `テストエラー: ${error.message}`);
        }
    }

    // テスト4: UI状態管理の統合テスト
    async testUIStateIntegration() {
        console.log('📋 テスト4: UI状態管理の統合テスト');
        
        try {
            // 初期状態の確認
            const initialTransparent = this.appState.get('transparentBackground');
            const initialSize = this.appState.get('outputSize');
            
            this.addTestResult('初期状態確認', 
                initialTransparent === true && initialSize === 'original',
                `透明背景: ${initialTransparent}, サイズ: ${initialSize}`);

            // UI要素の状態同期テスト
            const transparentCheckbox = document.getElementById('transparentBgOption');
            const sizeSelect = document.getElementById('sizePreset');
            const customWidthInput = document.getElementById('customWidth');
            const customHeightInput = document.getElementById('customHeight');

            // チェックボックスの状態確認
            this.addTestResult('透明背景UI同期', 
                transparentCheckbox.checked === initialTransparent,
                `チェックボックス状態: ${transparentCheckbox.checked}`);

            // サイズ選択の状態確認
            this.addTestResult('サイズ選択UI同期', 
                sizeSelect.value === initialSize,
                `選択値: ${sizeSelect.value}`);

            // 状態変更のテスト
            this.appState.setTransparentBackground(false);
            this.appState.setOutputSize('200x200');

            // UI更新の確認（少し待機）
            await new Promise(resolve => setTimeout(resolve, 100));

            this.addTestResult('状態変更後UI更新', 
                this.appState.get('transparentBackground') === false && 
                this.appState.get('outputSize') === '200x200',
                '状態変更が正常に反映された');

            // カスタムサイズ入力のテスト
            this.appState.setOutputSize('custom');
            await new Promise(resolve => setTimeout(resolve, 100));

            const customInputsVisible = document.getElementById('customSizeInputs').style.display !== 'none';
            this.addTestResult('カスタムサイズUI表示', customInputsVisible, 
                `カスタム入力表示状態: ${customInputsVisible}`);

        } catch (error) {
            this.addTestResult('UI状態管理テスト', false, `テストエラー: ${error.message}`);
        }
    }

    // テスト5: パフォーマンステスト
    async testPerformanceWithNewFeatures() {
        console.log('📋 テスト5: パフォーマンステスト');
        
        try {
            // 複雑なSVGでのパフォーマンステスト
            const complexSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                ${Array.from({length: 50}, (_, i) => 
                    `<circle cx="${Math.random() * 200}" cy="${Math.random() * 200}" r="${Math.random() * 10 + 5}" 
                     fill="rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)"/>`
                ).join('')}
            </svg>`;

            // 各サイズでのパフォーマンス測定
            const sizes = ['original', '500x500', '1000x1000'];
            
            for (const size of sizes) {
                const startTime = performance.now();
                
                try {
                    const result = await this.svgConverter.convertSVGToPNG(complexSVG, 1.0, true, {
                        outputSize: size
                    });
                    
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    this.addTestResult(`パフォーマンス(${size})`, 
                        duration < 5000, // 5秒以内
                        `処理時間: ${duration.toFixed(2)}ms`);
                        
                } catch (error) {
                    this.addTestResult(`パフォーマンス(${size})`, false, `エラー: ${error.message}`);
                }
            }

            // メモリ使用量の概算チェック
            if (performance.memory) {
                const memoryInfo = performance.memory;
                this.addTestResult('メモリ使用量', 
                    memoryInfo.usedJSHeapSize < memoryInfo.jsHeapSizeLimit * 0.8,
                    `使用量: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
            }

        } catch (error) {
            this.addTestResult('パフォーマンステスト', false, `テストエラー: ${error.message}`);
        }
    }

    // テスト結果を記録
    addTestResult(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }

    // テスト結果の表示
    displayTestResults() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;

        console.log('\n📊 統合テスト結果サマリー:');
        console.log(`総テスト数: ${totalTests}`);
        console.log(`成功: ${passedTests}`);
        console.log(`失敗: ${failedTests}`);
        console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        // 失敗したテストの詳細表示
        if (failedTests > 0) {
            console.log('\n❌ 失敗したテスト:');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.name}: ${result.details}`);
            });
        }

        // UIにテスト結果を表示
        this.displayTestResultsInUI();
    }

    // UIにテスト結果を表示
    displayTestResultsInUI() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        
        const message = `統合テスト完了: ${passedTests}/${totalTests} 成功`;
        const isSuccess = passedTests === totalTests;
        
        if (isSuccess) {
            this.uiController.showSuccess(message, {
                icon: '🧪',
                title: '統合テスト結果',
                details: '全ての新機能が正常に動作しています',
                autoHideDelay: 5000
            });
        } else {
            this.uiController.showError(`${message} - 一部のテストが失敗しました`);
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('SVG to PNG Converter initialized');
    
    // クラスインスタンスを作成
    const fileHandler = new FileHandler();
    const svgConverter = new SVGConverter();
    const uiController = new UIController();
    
    // UIControllerを初期化
    uiController.initialize(fileHandler, svgConverter, appState);
    
    // 状態変更リスナーを追加（デバッグ用）
    appState.addListener((state, changedProperties) => {
        console.log('State changed:', changedProperties);
        if (Object.keys(changedProperties).length > 0) {
            appState.logState();
        }
    });
    
    // デバッグ用：初期状態をログ出力
    appState.logState();
    
    // 統合テスターを作成（開発時のみ）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        window.integrationTester = new IntegrationTester(appState, fileHandler, svgConverter, uiController);
        console.log('🧪 統合テスターが利用可能です。window.integrationTester.runNewFeatureIntegrationTests() を実行してテストを開始できます。');
        
        // ブラウザテスターも読み込み
        loadAutomatedBrowserTester();
    }
    
    // 初回利用時のガイダンス表示
    if (isFirstTimeUser()) {
        setTimeout(() => {
            uiController.showOperationGuidance('first_use');
        }, 1000);
    }

    // パフォーマンス監視の開始
    startPerformanceMonitoring();
});

// 自動ブラウザテスターの読み込み
function loadAutomatedBrowserTester() {
    // 自動ブラウザテストスクリプトを動的に読み込み
    const script = document.createElement('script');
    script.src = 'automated-browser-test.js';
    script.onload = () => {
        console.log('🧪 自動ブラウザテスターが読み込まれました');
    };
    script.onerror = () => {
        console.warn('⚠️ 自動ブラウザテスターの読み込みに失敗しました');
    };
    document.head.appendChild(script);
}

// パフォーマンス監視を開始
function startPerformanceMonitoring() {
    // 定期的なメモリ使用量記録（30秒ごと）
    setInterval(() => {
        performanceMonitor.recordMemoryUsage();
    }, 30000);

    // 5分ごとにパフォーマンス統計をログ出力
    setInterval(() => {
        const stats = performanceMonitor.getStats();
        console.log('パフォーマンス統計:', stats);
    }, 300000);

    // ページ離脱時に統計を出力
    window.addEventListener('beforeunload', () => {
        const stats = performanceMonitor.getStats();
        console.log('最終パフォーマンス統計:', stats);
    });

    // メモリ不足の警告監視
    if (performance.memory) {
        setInterval(() => {
            const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            if (memoryUsage > 0.8) { // 80%以上
                console.warn('メモリ使用量が高くなっています:', {
                    usage: Math.round(memoryUsage * 100) + '%',
                    used: formatFileSize(performance.memory.usedJSHeapSize),
                    limit: formatFileSize(performance.memory.jsHeapSizeLimit)
                });
                
                // 自動クリーンアップを実行
                svgConverter.performMemoryCleanup();
            }
        }, 10000); // 10秒ごと
    }
}



// FileHandler クラス
class FileHandler {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB制限
        this.maxFileSizeWarning = 5 * 1024 * 1024; // 5MB警告閾値
        this.maxComplexityScore = 1000; // SVG複雑度スコア制限
        this.supportedExtensions = ['.svg'];
        this.supportedMimeTypes = ['image/svg+xml', 'text/xml', 'application/xml'];
    }

    // 包括的なSVGファイル検証
    validateFile(file) {
        const errors = [];
        const warnings = [];

        try {
            // ファイルが存在するかチェック
            if (!file) {
                errors.push({
                    type: 'FILE_MISSING',
                    message: 'ファイルが選択されていません',
                    suggestion: 'SVGファイルを選択してください'
                });
                return { isValid: false, errors, warnings };
            }

            // ファイルサイズチェック
            if (file.size === 0) {
                errors.push({
                    type: 'FILE_EMPTY',
                    message: 'ファイルが空です',
                    suggestion: '有効なSVGファイルを選択してください'
                });
            } else if (file.size > this.maxFileSize) {
                errors.push({
                    type: 'FILE_TOO_LARGE',
                    message: `ファイルサイズが大きすぎます（${formatFileSize(file.size)} > ${formatFileSize(this.maxFileSize)}）`,
                    suggestion: 'より小さなSVGファイルを選択するか、ファイルを最適化してください'
                });
            } else if (file.size > this.maxFileSizeWarning) {
                warnings.push({
                    type: 'LARGE_FILE_WARNING',
                    message: `大きなファイルです（${formatFileSize(file.size)}）。処理に時間がかかる可能性があります`,
                    suggestion: 'より小さなファイルの使用を推奨します'
                });
            } else if (file.size < 50) {
                warnings.push({
                    type: 'FILE_VERY_SMALL',
                    message: 'ファイルサイズが非常に小さいです',
                    suggestion: 'ファイルが正しく選択されているか確認してください'
                });
            }

            // ファイル名の検証
            if (!file.name || file.name.trim() === '') {
                warnings.push({
                    type: 'FILENAME_EMPTY',
                    message: 'ファイル名が空です',
                    suggestion: 'ファイル名を確認してください'
                });
            }

            // 拡張子チェック
            const fileName = file.name.toLowerCase();
            const hasValidExtension = this.supportedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!hasValidExtension) {
                errors.push({
                    type: 'INVALID_EXTENSION',
                    message: `サポートされていないファイル形式です（${this.getFileExtension(file.name)}）`,
                    suggestion: `SVGファイル（${this.supportedExtensions.join(', ')}）を選択してください`
                });
            }

            // MIMEタイプチェック（より柔軟に）
            if (file.type && !this.supportedMimeTypes.includes(file.type)) {
                warnings.push({
                    type: 'MIME_TYPE_WARNING',
                    message: `MIMEタイプが一般的ではありません（${file.type}）`,
                    suggestion: 'ファイルが正しいSVG形式であることを確認してください'
                });
            }

            // 最終更新日時の確認（古いファイルの警告）
            if (file.lastModified) {
                const fileAge = Date.now() - file.lastModified;
                const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
                
                if (fileAge > oneYearInMs) {
                    warnings.push({
                        type: 'OLD_FILE',
                        message: 'ファイルが1年以上前に作成されています',
                        suggestion: '最新のSVG仕様に対応しているか確認してください'
                    });
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                fileInfo: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    extension: this.getFileExtension(file.name)
                }
            };

        } catch (error) {
            console.error('ファイル検証中にエラーが発生:', error);
            errors.push({
                type: 'VALIDATION_ERROR',
                message: 'ファイル検証中にエラーが発生しました',
                suggestion: 'ファイルを再選択してください',
                details: error.message
            });
            
            return { isValid: false, errors, warnings: [] };
        }
    }

    // ファイル拡張子を取得
    getFileExtension(filename) {
        if (!filename) return '';
        const lastDot = filename.lastIndexOf('.');
        return lastDot === -1 ? '' : filename.substring(lastDot);
    }

    // 包括的なファイル読み込み処理
    async readFile(file) {
        return new Promise((resolve, reject) => {
            try {
                // まずファイル検証
                const validation = this.validateFile(file);
                
                // エラーがある場合は詳細なエラー情報を返す
                if (!validation.isValid) {
                    const errorMessages = validation.errors.map(err => err.message);
                    const suggestions = validation.errors.map(err => err.suggestion).filter(Boolean);
                    
                    const error = new Error(errorMessages.join('\n'));
                    error.type = 'VALIDATION_ERROR';
                    error.errors = validation.errors;
                    error.suggestions = suggestions;
                    reject(error);
                    return;
                }

                // 警告がある場合はログに出力
                if (validation.warnings && validation.warnings.length > 0) {
                    console.warn('ファイル読み込み時の警告:', validation.warnings);
                }

                const reader = new FileReader();
                let readTimeout;

                // タイムアウト設定（大きなファイルの場合）
                const timeoutMs = Math.max(5000, file.size / 1000); // ファイルサイズに応じて調整
                readTimeout = setTimeout(() => {
                    reader.abort();
                    const error = new Error('ファイル読み込みがタイムアウトしました');
                    error.type = 'READ_TIMEOUT';
                    error.suggestion = 'より小さなファイルを選択するか、しばらく待ってから再試行してください';
                    reject(error);
                }, timeoutMs);

                reader.onload = (event) => {
                    clearTimeout(readTimeout);
                    
                    try {
                        const content = event.target.result;
                        
                        // 読み込み結果の基本チェック
                        if (!content || content.trim().length === 0) {
                            const error = new Error('ファイルの内容が空です');
                            error.type = 'EMPTY_CONTENT';
                            error.suggestion = '有効なSVGファイルを選択してください';
                            reject(error);
                            return;
                        }

                        // SVGコンテンツの詳細検証
                        let svgValidation;
                        try {
                            svgValidation = this.validateSVGStructure(content);
                        } catch (validationError) {
                            const error = new Error(`無効なSVGファイルです: ${validationError.message}`);
                            error.type = 'INVALID_SVG';
                            error.suggestion = validationError.suggestion || 'SVGエディタでファイルを確認し、修正してください';
                            error.originalError = validationError;
                            reject(error);
                            return;
                        }

                        // 成功時のレスポンス
                        resolve({
                            content,
                            fileInfo: {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                lastModified: file.lastModified,
                                extension: this.getFileExtension(file.name)
                            },
                            validation: {
                                ...validation,
                                svgValidation
                            }
                        });

                    } catch (error) {
                        clearTimeout(readTimeout);
                        console.error('ファイル処理中にエラー:', error);
                        
                        const processError = new Error(`ファイルの処理中にエラーが発生しました: ${error.message}`);
                        processError.type = 'PROCESSING_ERROR';
                        processError.suggestion = 'ファイルを再選択するか、別のSVGファイルを試してください';
                        processError.originalError = error;
                        reject(processError);
                    }
                };

                reader.onerror = (event) => {
                    clearTimeout(readTimeout);
                    console.error('FileReader エラー:', event);
                    
                    let errorMessage = 'ファイルの読み込みに失敗しました';
                    let suggestion = 'ファイルを再選択してください';
                    
                    // より具体的なエラーメッセージ
                    if (reader.error) {
                        switch (reader.error.name) {
                            case 'NotReadableError':
                                errorMessage = 'ファイルが読み取れません';
                                suggestion = 'ファイルが使用中でないか確認し、再試行してください';
                                break;
                            case 'SecurityError':
                                errorMessage = 'セキュリティエラーによりファイルを読み取れません';
                                suggestion = 'ブラウザの設定を確認するか、別の方法でファイルを選択してください';
                                break;
                            case 'AbortError':
                                errorMessage = 'ファイル読み込みが中断されました';
                                suggestion = '再度ファイルを選択してください';
                                break;
                            default:
                                errorMessage = `ファイル読み込みエラー: ${reader.error.name}`;
                        }
                    }
                    
                    const error = new Error(errorMessage);
                    error.type = 'READ_ERROR';
                    error.suggestion = suggestion;
                    error.originalError = reader.error;
                    reject(error);
                };

                reader.onabort = () => {
                    clearTimeout(readTimeout);
                    const error = new Error('ファイル読み込みが中断されました');
                    error.type = 'READ_ABORTED';
                    error.suggestion = '再度ファイルを選択してください';
                    reject(error);
                };

                // 読み込み開始
                try {
                    reader.readAsText(file, 'UTF-8');
                } catch (startError) {
                    clearTimeout(readTimeout);
                    console.error('FileReader 開始エラー:', startError);
                    
                    const error = new Error('ファイル読み込みを開始できませんでした');
                    error.type = 'READ_START_ERROR';
                    error.suggestion = 'ブラウザを再読み込みして再試行してください';
                    error.originalError = startError;
                    reject(error);
                }

            } catch (error) {
                console.error('readFile メソッドでの予期しないエラー:', error);
                
                const unexpectedError = new Error('予期しないエラーが発生しました');
                unexpectedError.type = 'UNEXPECTED_ERROR';
                unexpectedError.suggestion = 'ページを再読み込みして再試行してください';
                unexpectedError.originalError = error;
                reject(unexpectedError);
            }
        });
    }

    // SVGコンテンツの検証
    isValidSVGContent(content) {
        try {
            return this.validateSVGStructure(content);
        } catch (error) {
            return false;
        }
    }

    // 包括的なSVG構造検証
    validateSVGStructure(content) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            info: {}
        };

        try {
            // 空のコンテンツチェック
            if (!content || content.trim().length === 0) {
                const error = new Error('ファイルが空です');
                error.suggestion = '有効なSVGファイルを選択してください';
                throw error;
            }

            // 基本的なSVGタグの存在チェック
            if (!content.includes('<svg')) {
                const error = new Error('SVGタグが見つかりません');
                error.suggestion = 'SVG形式のファイルを選択してください';
                throw error;
            }

            // XMLとして解析可能かチェック
            let doc, svgElement;
            try {
                const parser = new DOMParser();
                doc = parser.parseFromString(content, 'image/svg+xml');
                
                // パースエラーがないかチェック
                const parserError = doc.querySelector('parsererror');
                if (parserError) {
                    const errorText = parserError.textContent || parserError.innerText || 'XMLパースエラー';
                    const error = new Error(`XMLの構文エラーがあります: ${errorText}`);
                    error.suggestion = 'SVGエディタでファイルの構文を確認してください';
                    throw error;
                }

                // SVG要素が存在するかチェック
                svgElement = doc.querySelector('svg');
                if (!svgElement) {
                    const error = new Error('有効なSVG要素が見つかりません');
                    error.suggestion = 'ルート要素がSVGタグであることを確認してください';
                    throw error;
                }

            } catch (parseError) {
                if (parseError.message.includes('XMLの構文エラー') || parseError.message.includes('有効なSVG要素')) {
                    throw parseError;
                }
                
                const error = new Error(`SVGの解析に失敗しました: ${parseError.message}`);
                error.suggestion = 'ファイルが破損していないか確認してください';
                error.originalError = parseError;
                throw error;
            }

            // SVG名前空間の確認
            const svgNamespace = 'http://www.w3.org/2000/svg';
            if (svgElement.namespaceURI !== svgNamespace && !svgElement.getAttribute('xmlns')) {
                validation.warnings.push({
                    type: 'MISSING_NAMESPACE',
                    message: 'SVG名前空間が設定されていません',
                    suggestion: 'xmlns="http://www.w3.org/2000/svg" 属性を追加することを推奨します'
                });
            }

            // 基本的なSVG属性の確認
            const attributeValidation = this.validateSVGAttributes(svgElement);
            validation.warnings.push(...attributeValidation.warnings);
            validation.info.attributes = attributeValidation.info;

            // SVGコンテンツの確認
            const contentValidation = this.validateSVGContent(svgElement);
            validation.warnings.push(...contentValidation.warnings);
            validation.info.content = contentValidation.info;

            // セキュリティチェック
            const securityValidation = this.validateSVGSecurity(content, svgElement);
            validation.warnings.push(...securityValidation.warnings);
            if (securityValidation.errors.length > 0) {
                validation.errors.push(...securityValidation.errors);
                validation.isValid = false;
            }

            // パフォーマンスチェック
            const performanceValidation = this.validateSVGPerformance(svgElement);
            validation.warnings.push(...performanceValidation.warnings);
            validation.info.performance = performanceValidation.info;

            return validation;

        } catch (error) {
            console.error('SVG構造検証エラー:', error);
            
            // エラーを再スローする前に、より詳細な情報を追加
            if (!error.suggestion) {
                error.suggestion = 'SVGファイルの形式を確認してください';
            }
            
            throw error;
        }
    }

    // 包括的なSVG属性検証
    validateSVGAttributes(svgElement) {
        const validation = {
            warnings: [],
            info: {}
        };

        try {
            const width = svgElement.getAttribute('width');
            const height = svgElement.getAttribute('height');
            const viewBox = svgElement.getAttribute('viewBox');

            // サイズ情報の検証
            let hasValidSize = false;
            
            if (width && height) {
                const widthNum = parseFloat(width);
                const heightNum = parseFloat(height);
                
                if (isNaN(widthNum) || isNaN(heightNum)) {
                    validation.warnings.push({
                        type: 'INVALID_SIZE_VALUES',
                        message: 'width または height の値が無効です',
                        suggestion: '数値または有効な単位付きの値を使用してください'
                    });
                } else if (widthNum <= 0 || heightNum <= 0) {
                    validation.warnings.push({
                        type: 'ZERO_OR_NEGATIVE_SIZE',
                        message: 'width または height が0以下です',
                        suggestion: '正の値を設定してください'
                    });
                } else {
                    hasValidSize = true;
                    validation.info.dimensions = { width: widthNum, height: heightNum };
                    
                    // 極端なサイズの警告
                    if (widthNum > 10000 || heightNum > 10000) {
                        validation.warnings.push({
                            type: 'VERY_LARGE_SIZE',
                            message: `SVGのサイズが非常に大きいです (${widthNum}×${heightNum})`,
                            suggestion: '変換時にパフォーマンスの問題が発生する可能性があります'
                        });
                    }
                }
            }

            // viewBoxの検証
            if (viewBox) {
                const viewBoxValues = viewBox.split(/\s+|,/).filter(v => v.trim() !== '');
                
                if (viewBoxValues.length !== 4) {
                    validation.warnings.push({
                        type: 'INVALID_VIEWBOX_COUNT',
                        message: `viewBox属性の値の数が正しくありません (${viewBoxValues.length}/4)`,
                        suggestion: 'viewBox="x y width height" の形式で指定してください'
                    });
                } else {
                    const [x, y, vbWidth, vbHeight] = viewBoxValues.map(v => parseFloat(v));
                    
                    if ([x, y, vbWidth, vbHeight].some(v => isNaN(v))) {
                        validation.warnings.push({
                            type: 'INVALID_VIEWBOX_VALUES',
                            message: 'viewBox属性に無効な値が含まれています',
                            suggestion: 'すべての値を数値で指定してください'
                        });
                    } else if (vbWidth <= 0 || vbHeight <= 0) {
                        validation.warnings.push({
                            type: 'INVALID_VIEWBOX_SIZE',
                            message: 'viewBoxの幅または高さが0以下です',
                            suggestion: 'viewBoxの幅と高さは正の値を指定してください'
                        });
                    } else {
                        hasValidSize = true;
                        validation.info.viewBox = { x, y, width: vbWidth, height: vbHeight };
                    }
                }
            }

            // サイズ情報がない場合の警告
            if (!hasValidSize) {
                validation.warnings.push({
                    type: 'NO_SIZE_INFO',
                    message: 'SVGにサイズ情報（width、height、viewBox）が設定されていません',
                    suggestion: 'width/height属性またはviewBox属性を設定することを推奨します'
                });
            }

            // その他の重要な属性の確認
            const version = svgElement.getAttribute('version');
            if (version && version !== '1.1' && version !== '2.0') {
                validation.warnings.push({
                    type: 'UNSUPPORTED_VERSION',
                    message: `サポートされていないSVGバージョンです: ${version}`,
                    suggestion: 'SVG 1.1 または 2.0 を使用することを推奨します'
                });
            }

            // preserveAspectRatio の確認
            const preserveAspectRatio = svgElement.getAttribute('preserveAspectRatio');
            if (preserveAspectRatio) {
                validation.info.preserveAspectRatio = preserveAspectRatio;
            }

            return validation;

        } catch (error) {
            console.error('SVG属性検証エラー:', error);
            validation.warnings.push({
                type: 'ATTRIBUTE_VALIDATION_ERROR',
                message: '属性の検証中にエラーが発生しました',
                suggestion: 'SVGの属性を確認してください'
            });
            return validation;
        }
    }

    // 包括的なSVGコンテンツ検証
    validateSVGContent(svgElement) {
        const validation = {
            warnings: [],
            info: {
                elementCount: 0,
                hasContent: false,
                contentTypes: []
            }
        };

        try {
            // 子要素の数をカウント
            const allElements = svgElement.querySelectorAll('*');
            validation.info.elementCount = allElements.length;

            // 描画コンテンツの存在チェック
            const drawingElements = svgElement.querySelectorAll('rect, circle, ellipse, line, polyline, polygon, path, text, image, use, g');
            const hasDrawingElements = drawingElements.length > 0;
            const hasTextContent = svgElement.textContent && svgElement.textContent.trim().length > 0;
            
            validation.info.hasContent = hasDrawingElements || hasTextContent;
            
            if (!validation.info.hasContent) {
                validation.warnings.push({
                    type: 'NO_VISIBLE_CONTENT',
                    message: 'SVGに描画コンテンツが含まれていません',
                    suggestion: '図形、パス、テキストなどの描画要素を追加してください'
                });
            }

            // コンテンツタイプの分析
            const contentTypes = [];
            if (svgElement.querySelectorAll('rect, circle, ellipse').length > 0) {
                contentTypes.push('基本図形');
            }
            if (svgElement.querySelectorAll('path').length > 0) {
                contentTypes.push('パス');
            }
            if (svgElement.querySelectorAll('text, tspan').length > 0) {
                contentTypes.push('テキスト');
            }
            if (svgElement.querySelectorAll('image').length > 0) {
                contentTypes.push('画像');
            }
            if (svgElement.querySelectorAll('g').length > 0) {
                contentTypes.push('グループ');
            }
            validation.info.contentTypes = contentTypes;

            // 一般的でない要素の検出
            const uncommonElements = svgElement.querySelectorAll('foreignObject, switch, metadata, desc, title');
            if (uncommonElements.length > 0) {
                const elementNames = Array.from(uncommonElements).map(el => el.tagName).join(', ');
                validation.warnings.push({
                    type: 'UNCOMMON_ELEMENTS',
                    message: `一部のSVG要素は正しく表示されない可能性があります: ${elementNames}`,
                    suggestion: '基本的なSVG要素の使用を推奨します'
                });
            }

            // 複雑さの評価
            if (validation.info.elementCount > 1000) {
                validation.warnings.push({
                    type: 'VERY_COMPLEX_SVG',
                    message: `SVGが非常に複雑です (${validation.info.elementCount}個の要素)`,
                    suggestion: '変換時にパフォーマンスの問題が発生する可能性があります'
                });
            } else if (validation.info.elementCount > 500) {
                validation.warnings.push({
                    type: 'COMPLEX_SVG',
                    message: `SVGが複雑です (${validation.info.elementCount}個の要素)`,
                    suggestion: '変換に時間がかかる場合があります'
                });
            }

            // アニメーション要素の検出
            const animationElements = svgElement.querySelectorAll('animate, animateTransform, animateMotion, set');
            if (animationElements.length > 0) {
                validation.warnings.push({
                    type: 'ANIMATION_ELEMENTS',
                    message: 'アニメーション要素が含まれています',
                    suggestion: 'PNG変換時はアニメーションの最初のフレームのみが保存されます'
                });
            }

            // スクリプト要素の検出
            const scriptElements = svgElement.querySelectorAll('script');
            if (scriptElements.length > 0) {
                validation.warnings.push({
                    type: 'SCRIPT_ELEMENTS',
                    message: 'スクリプト要素が含まれています',
                    suggestion: 'PNG変換時はスクリプトは実行されません'
                });
            }

            // 外部参照の検出
            const externalRefs = svgElement.querySelectorAll('[href^="http"], [xlink\\:href^="http"], image[href^="http"], image[xlink\\:href^="http"]');
            if (externalRefs.length > 0) {
                validation.warnings.push({
                    type: 'EXTERNAL_REFERENCES',
                    message: '外部リソースへの参照が含まれています',
                    suggestion: '変換時に外部リソースが読み込めない場合があります'
                });
            }

            return validation;

        } catch (error) {
            console.error('SVGコンテンツ検証エラー:', error);
            validation.warnings.push({
                type: 'CONTENT_VALIDATION_ERROR',
                message: 'コンテンツの検証中にエラーが発生しました',
                suggestion: 'SVGの構造を確認してください'
            });
            return validation;
        }
    }

    // SVGセキュリティ検証
    validateSVGSecurity(content, svgElement) {
        const validation = {
            errors: [],
            warnings: []
        };

        try {
            // 危険なスクリプトの検出
            if (content.includes('<script') || content.includes('javascript:') || content.includes('on[a-zA-Z]+=')) {
                validation.errors.push({
                    type: 'SECURITY_RISK',
                    message: '潜在的なセキュリティリスクが検出されました',
                    suggestion: 'スクリプトやイベントハンドラーを含まないSVGファイルを使用してください'
                });
            }

            // 外部DTDの検出
            if (content.includes('<!DOCTYPE') && content.includes('SYSTEM')) {
                validation.warnings.push({
                    type: 'EXTERNAL_DTD',
                    message: '外部DTDが参照されています',
                    suggestion: 'セキュリティ上の理由から外部DTDの使用は推奨されません'
                });
            }

            return validation;

        } catch (error) {
            console.error('SVGセキュリティ検証エラー:', error);
            validation.warnings.push({
                type: 'SECURITY_VALIDATION_ERROR',
                message: 'セキュリティ検証中にエラーが発生しました'
            });
            return validation;
        }
    }

    // SVGパフォーマンス検証
    validateSVGPerformance(svgElement) {
        const validation = {
            warnings: [],
            info: {
                elementCount: 0,
                pathCount: 0,
                textCount: 0,
                imageCount: 0,
                complexityScore: 0,
                estimatedProcessingTime: 0,
                memoryEstimate: 0,
                maxPathComplexity: 0,
                gradientCount: 0
            }
        };

        try {
            // 要素数をカウント
            const allElements = svgElement.querySelectorAll('*');
            validation.info.elementCount = allElements.length;

            // 特定要素のカウント
            validation.info.pathCount = svgElement.querySelectorAll('path').length;
            validation.info.textCount = svgElement.querySelectorAll('text, tspan').length;
            validation.info.imageCount = svgElement.querySelectorAll('image').length;

            // パス要素の複雑さチェック
            const pathElements = svgElement.querySelectorAll('path');
            let maxPathComplexity = 0;
            
            pathElements.forEach(path => {
                const d = path.getAttribute('d');
                if (d) {
                    const complexity = d.length;
                    maxPathComplexity = Math.max(maxPathComplexity, complexity);
                }
            });

            validation.info.maxPathComplexity = maxPathComplexity;

            // グラデーションの数をチェック
            const gradients = svgElement.querySelectorAll('linearGradient, radialGradient');
            validation.info.gradientCount = gradients.length;

            // 複雑度スコアの計算（改良版）
            let complexityScore = 0;
            complexityScore += validation.info.pathCount * 3; // パス要素の重み増加
            complexityScore += validation.info.textCount * 1.5; // テキスト要素
            complexityScore += validation.info.imageCount * 5; // 画像要素の重み増加
            
            // グラデーション、フィルター、アニメーション要素の追加
            const filters = svgElement.querySelectorAll('filter');
            const animations = svgElement.querySelectorAll('animate, animateTransform, animateMotion');
            
            complexityScore += validation.info.gradientCount * 2;
            complexityScore += filters.length * 4;
            complexityScore += animations.length * 1;
            
            // パスの複雑さを考慮
            complexityScore += Math.min(maxPathComplexity / 1000, 100);
            
            complexityScore += (validation.info.elementCount - validation.info.pathCount - validation.info.textCount - validation.info.imageCount) * 0.5;

            validation.info.complexityScore = Math.round(complexityScore);

            // メモリ使用量の推定（KB）
            const svgSize = new XMLSerializer().serializeToString(svgElement).length;
            validation.info.memoryEstimate = Math.round((svgSize + complexityScore * 100) / 1024);

            // 推定処理時間（ミリ秒）- より正確な計算
            validation.info.estimatedProcessingTime = Math.max(500, complexityScore * 15 + validation.info.memoryEstimate * 2);

            // 警告の生成（閾値を調整）
            if (validation.info.elementCount > 300) {
                validation.warnings.push({
                    type: 'HIGH_ELEMENT_COUNT',
                    message: `要素数が多いです（${validation.info.elementCount}個）`,
                    suggestion: 'SVGを簡素化することで処理速度が向上します'
                });
            }

            if (validation.info.pathCount > 50) {
                validation.warnings.push({
                    type: 'HIGH_PATH_COUNT',
                    message: `パス要素が多いです（${validation.info.pathCount}個）`,
                    suggestion: 'パスを統合することで処理速度が向上します'
                });
            }

            if (maxPathComplexity > 10000) {
                validation.warnings.push({
                    type: 'COMPLEX_PATHS',
                    message: '非常に複雑なパス要素が含まれています',
                    suggestion: 'パスを簡略化することで変換速度が向上します'
                });
            }

            if (validation.info.gradientCount > 50) {
                validation.warnings.push({
                    type: 'MANY_GRADIENTS',
                    message: `多数のグラデーションが定義されています (${validation.info.gradientCount}個)`,
                    suggestion: '不要なグラデーションを削除することを推奨します'
                });
            }

            if (validation.info.complexityScore > this.maxComplexityScore) {
                validation.warnings.push({
                    type: 'COMPLEXITY_LIMIT_EXCEEDED',
                    message: `SVGが複雑すぎます（複雑度スコア: ${validation.info.complexityScore} > ${this.maxComplexityScore}）`,
                    suggestion: 'SVGを簡素化してください。変換が失敗する可能性があります'
                });
            } else if (validation.info.complexityScore > 500) {
                validation.warnings.push({
                    type: 'HIGH_COMPLEXITY',
                    message: `SVGが複雑です（複雑度スコア: ${validation.info.complexityScore}）`,
                    suggestion: '変換に時間がかかる可能性があります'
                });
            }

            if (validation.info.memoryEstimate > 5000) { // 5MB以上
                validation.warnings.push({
                    type: 'HIGH_MEMORY_USAGE',
                    message: `メモリ使用量が多いと予想されます（推定: ${validation.info.memoryEstimate}KB）`,
                    suggestion: 'SVGを最適化することでメモリ使用量を削減できます'
                });
            }

            if (validation.info.estimatedProcessingTime > 10000) { // 10秒以上
                validation.warnings.push({
                    type: 'LONG_PROCESSING_TIME',
                    message: `処理時間が長くなる可能性があります（推定: ${Math.round(validation.info.estimatedProcessingTime/1000)}秒）`,
                    suggestion: 'SVGを簡素化することで処理時間を短縮できます'
                });
            }

            return validation;

        } catch (error) {
            console.error('SVGパフォーマンス検証エラー:', error);
            validation.warnings.push({
                type: 'PERFORMANCE_VALIDATION_ERROR',
                message: 'パフォーマンス検証中にエラーが発生しました'
            });
            return validation;
        }
    }

    // 包括的なプレビュー表示
    displayPreview(content, fileInfo, validation = null) {
        try {
            // ファイル情報を表示
            this.displayFileInfo(fileInfo, validation);

            // SVGプレビューを安全に表示
            this.displaySVGPreview(content, validation);

            // 変換ボタンを有効化
            elements.convertBtn.disabled = false;

            return true;
        } catch (error) {
            console.error('プレビュー表示エラー:', error);
            
            // プレビューエラーを表示
            this.displayPreviewError(error);
            
            // ファイル情報は表示したままにする
            return false;
        }
    }

    // プレビューエラー表示
    displayPreviewError(error) {
        try {
            elements.svgPreviewContent.innerHTML = `
                <div class="preview-error svg-preview-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">
                        <h4>プレビューエラー</h4>
                        <p>${error.message || 'プレビューの表示に失敗しました'}</p>
                        ${error.suggestion ? `<div class="error-suggestion">${error.suggestion}</div>` : ''}
                    </div>
                </div>
            `;
            elements.svgPreview.style.display = 'block';
        } catch (displayError) {
            console.error('プレビューエラー表示中にエラー:', displayError);
        }
    }

    // 包括的なファイル情報表示
    displayFileInfo(fileInfo, validation = null) {
        try {
            elements.fileName.textContent = fileInfo.name;
            elements.fileSize.textContent = formatFileSize(fileInfo.size);
            
            const infoContent = elements.fileInfo.querySelector('.info-content');
            
            // 既存の追加情報を削除
            const existingAdditional = infoContent.querySelectorAll('.additional-info');
            existingAdditional.forEach(el => el.remove());
            
            // 追加のファイル情報を表示
            const additionalInfo = document.createElement('div');
            additionalInfo.className = 'additional-info';
            
            // 最終更新日時
            if (fileInfo.lastModified) {
                const lastModified = new Date(fileInfo.lastModified);
                const modifiedP = document.createElement('p');
                modifiedP.innerHTML = `<strong>最終更新:</strong> ${lastModified.toLocaleString('ja-JP')}`;
                additionalInfo.appendChild(modifiedP);
            }
            
            // ファイル形式
            if (fileInfo.type) {
                const typeP = document.createElement('p');
                typeP.innerHTML = `<strong>形式:</strong> ${fileInfo.type}`;
                additionalInfo.appendChild(typeP);
            }
            
            // 検証情報がある場合は追加
            if (validation && validation.info) {
                this.displayValidationInfo(additionalInfo, validation.info);
            }
            
            infoContent.appendChild(additionalInfo);
            elements.fileInfo.style.display = 'block';
            
        } catch (error) {
            console.error('ファイル情報表示エラー:', error);
            // 基本情報だけでも表示
            elements.fileName.textContent = fileInfo.name || '不明';
            elements.fileSize.textContent = formatFileSize(fileInfo.size || 0);
            elements.fileInfo.style.display = 'block';
        }
    }

    // 検証情報の表示
    displayValidationInfo(container, validationInfo) {
        try {
            // SVG属性情報
            if (validationInfo.attributes) {
                const attr = validationInfo.attributes;
                if (attr.dimensions) {
                    const dimensionsP = document.createElement('p');
                    dimensionsP.innerHTML = `<strong>SVGサイズ:</strong> ${attr.dimensions.width}×${attr.dimensions.height}`;
                    container.appendChild(dimensionsP);
                }
                if (attr.viewBox) {
                    const viewBoxP = document.createElement('p');
                    viewBoxP.innerHTML = `<strong>ViewBox:</strong> ${attr.viewBox.width}×${attr.viewBox.height}`;
                    container.appendChild(viewBoxP);
                }
            }
            
            // コンテンツ情報
            if (validationInfo.content) {
                const content = validationInfo.content;
                if (content.elementCount > 0) {
                    const elementsP = document.createElement('p');
                    elementsP.innerHTML = `<strong>要素数:</strong> ${content.elementCount}個`;
                    container.appendChild(elementsP);
                }
                if (content.contentTypes && content.contentTypes.length > 0) {
                    const typesP = document.createElement('p');
                    typesP.innerHTML = `<strong>コンテンツ:</strong> ${content.contentTypes.join(', ')}`;
                    container.appendChild(typesP);
                }
            }
            
        } catch (error) {
            console.error('検証情報表示エラー:', error);
        }
    }

    // SVGプレビューを安全に表示
    displaySVGPreview(content) {
        try {
            // SVGコンテンツをサニタイズして安全に挿入
            const sanitizedSVG = this.sanitizeSVGContent(content);
            
            // プレビューコンテナをクリア
            elements.svgPreviewContent.innerHTML = '';
            
            // SVG要素を作成してアスペクト比を維持
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'svg-wrapper';
            svgWrapper.innerHTML = sanitizedSVG;
            
            // SVG要素を取得してアスペクト比を設定
            const svgElement = svgWrapper.querySelector('svg');
            if (svgElement) {
                this.maintainAspectRatio(svgElement);
                
                // SVG読み込みエラーハンドリング
                this.setupSVGErrorHandling(svgElement);
            } else {
                throw new Error('SVG要素が見つかりません');
            }
            
            elements.svgPreviewContent.appendChild(svgWrapper);
            elements.svgPreview.style.display = 'block';
            
        } catch (error) {
            this.displayPreviewError(error.message);
            throw error;
        }
    }

    // SVGエラーハンドリングの設定
    setupSVGErrorHandling(svgElement) {
        // SVG読み込みエラーを監視
        svgElement.addEventListener('error', (event) => {
            this.displayPreviewError('SVGの描画中にエラーが発生しました');
        });

        // SVG内の画像要素のエラーハンドリング
        const images = svgElement.querySelectorAll('image');
        images.forEach(img => {
            img.addEventListener('error', (event) => {
                console.warn('SVG内の画像の読み込みに失敗しました:', img.getAttribute('href') || img.getAttribute('xlink:href'));
                // 画像要素を非表示にする
                img.style.display = 'none';
            });
        });
    }

    // プレビューエラー表示
    displayPreviewError(errorMessage) {
        // プレビューコンテナをクリア
        elements.svgPreviewContent.innerHTML = '';
        
        // エラー表示要素を作成
        const errorDiv = document.createElement('div');
        errorDiv.className = 'preview-error';
        errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-text">
                <h4>プレビューエラー</h4>
                <p>${errorMessage}</p>
                <p class="error-suggestion">ファイルが有効なSVG形式であることを確認してください。</p>
            </div>
        `;
        
        elements.svgPreviewContent.appendChild(errorDiv);
        elements.svgPreview.style.display = 'block';
        
        // 変換ボタンを無効化
        elements.convertBtn.disabled = true;
    }

    // SVGコンテンツのサニタイゼーション
    sanitizeSVGContent(content) {
        try {
            // DOMParserを使用してSVGを解析
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'image/svg+xml');
            
            // パースエラーをチェック
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('SVGの解析に失敗しました');
            }
            
            const svgElement = doc.querySelector('svg');
            if (!svgElement) {
                throw new Error('有効なSVG要素が見つかりません');
            }
            
            // 危険な要素や属性を削除
            this.removeDangerousElements(svgElement);
            
            // サニタイズされたSVGを文字列として返す
            return new XMLSerializer().serializeToString(svgElement);
            
        } catch (error) {
            throw new Error('SVGのサニタイゼーションに失敗しました: ' + error.message);
        }
    }

    // 危険な要素や属性を削除
    removeDangerousElements(svgElement) {
        // 削除すべき危険な要素
        const dangerousElements = ['script', 'object', 'embed', 'iframe', 'link'];
        
        dangerousElements.forEach(tagName => {
            const elements = svgElement.querySelectorAll(tagName);
            elements.forEach(element => element.remove());
        });
        
        // 危険な属性を削除
        const dangerousAttributes = ['onload', 'onerror', 'onclick', 'onmouseover'];
        const allElements = svgElement.querySelectorAll('*');
        
        allElements.forEach(element => {
            dangerousAttributes.forEach(attr => {
                if (element.hasAttribute(attr)) {
                    element.removeAttribute(attr);
                }
            });
        });
    }

    // アスペクト比を維持
    maintainAspectRatio(svgElement) {
        // viewBox属性から元のアスペクト比を取得
        const viewBox = svgElement.getAttribute('viewBox');
        let aspectRatio = 1; // デフォルトのアスペクト比
        
        if (viewBox) {
            const values = viewBox.split(/\s+|,/);
            if (values.length >= 4) {
                const width = parseFloat(values[2]);
                const height = parseFloat(values[3]);
                if (width > 0 && height > 0) {
                    aspectRatio = width / height;
                }
            }
        } else {
            // viewBoxがない場合はwidth/height属性から計算
            const width = svgElement.getAttribute('width');
            const height = svgElement.getAttribute('height');
            
            if (width && height) {
                const w = parseFloat(width);
                const h = parseFloat(height);
                if (w > 0 && h > 0) {
                    aspectRatio = w / h;
                }
            }
        }
        
        // SVG要素のスタイルを設定してアスペクト比を維持
        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '300px';
        
        // アスペクト比が極端に横長または縦長の場合の調整
        if (aspectRatio > 3) {
            // 横長の場合
            svgElement.style.maxHeight = '200px';
        } else if (aspectRatio < 0.33) {
            // 縦長の場合
            svgElement.style.maxWidth = '200px';
        }
    }
}

// SVGConverter クラス
class SVGConverter {
    constructor() {
        this.defaultWidth = 800;
        this.defaultHeight = 600;
        this.maxCanvasSize = 4096; // Canvas最大サイズ制限
        this.conversionTimeout = 30000; // 30秒のタイムアウト
        this.memoryCleanupInterval = 5000; // 5秒ごとにメモリクリーンアップ
        this.activeConversions = new Set(); // アクティブな変換を追跡
        this.memoryUsageThreshold = 100 * 1024 * 1024; // 100MB メモリ使用量閾値
    }

    // Canvas要素の動的生成
    createCanvas(width, height, transparentBackground = true) {
        try {
            // サイズ制限チェック
            if (width > this.maxCanvasSize || height > this.maxCanvasSize) {
                throw new Error(`Canvas サイズが制限を超えています（最大: ${this.maxCanvasSize}px）`);
            }

            if (width <= 0 || height <= 0) {
                throw new Error('Canvas サイズが無効です');
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas 2D コンテキストの取得に失敗しました');
            }

            // 透明背景が無効の場合のみ白い背景を設定
            if (!transparentBackground) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
            }
            // 透明背景が有効の場合は何もしない（デフォルトで透明）

            return { canvas, ctx };
        } catch (error) {
            throw new Error(`Canvas の作成に失敗しました: ${error.message}`);
        }
    }

    // SVGからサイズ情報を抽出
    extractSVGDimensions(svgContent) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');

            if (!svgElement) {
                throw new Error('SVG要素が見つかりません');
            }

            let width = this.defaultWidth;
            let height = this.defaultHeight;

            // viewBox属性から寸法を取得
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const values = viewBox.split(/\s+|,/).map(v => parseFloat(v));
                if (values.length >= 4 && values[2] > 0 && values[3] > 0) {
                    width = values[2];
                    height = values[3];
                }
            } else {
                // width/height属性から寸法を取得
                const widthAttr = svgElement.getAttribute('width');
                const heightAttr = svgElement.getAttribute('height');

                if (widthAttr && heightAttr) {
                    const parsedWidth = this.parseSize(widthAttr);
                    const parsedHeight = this.parseSize(heightAttr);
                    
                    if (parsedWidth > 0 && parsedHeight > 0) {
                        width = parsedWidth;
                        height = parsedHeight;
                    }
                }
            }

            // サイズ制限の適用
            if (width > this.maxCanvasSize || height > this.maxCanvasSize) {
                const scale = Math.min(this.maxCanvasSize / width, this.maxCanvasSize / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }

            return { width, height };
        } catch (error) {
            throw new Error(`SVG寸法の抽出に失敗しました: ${error.message}`);
        }
    }

    // サイズ文字列をピクセル値に変換
    parseSize(sizeStr) {
        if (!sizeStr) return 0;
        
        // 数値のみの場合
        const numValue = parseFloat(sizeStr);
        if (!isNaN(numValue)) {
            return numValue;
        }

        // 単位付きの場合（px, pt, em, etc.）
        const match = sizeStr.match(/^([\d.]+)(px|pt|em|rem|%)?$/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2]?.toLowerCase();

            switch (unit) {
                case 'pt':
                    return value * 1.33; // pt to px conversion
                case 'em':
                case 'rem':
                    return value * 16; // 仮定: 1em = 16px
                case '%':
                    return value; // %の場合はそのまま返す（後で処理）
                default:
                    return value; // px または単位なし
            }
        }

        return 0;
    }

    // 出力サイズを計算
    calculateOutputDimensions(originalDimensions, sizeOptions) {
        if (!sizeOptions) {
            return originalDimensions;
        }

        const { outputSize, customWidth, customHeight } = sizeOptions;

        if (outputSize === 'original') {
            return originalDimensions;
        }

        if (outputSize === 'custom') {
            if (customWidth || customHeight) {
                return this.calculateAspectRatioSize(
                    originalDimensions,
                    customWidth,
                    customHeight
                );
            }
            return originalDimensions;
        }

        // プリセットサイズの場合
        const [width, height] = outputSize.split('x').map(Number);
        return this.calculateAspectRatioSize(
            originalDimensions,
            width,
            height
        );
    }

    // アスペクト比を維持したサイズ計算
    calculateAspectRatioSize(originalDimensions, targetWidth, targetHeight) {
        const { width: origWidth, height: origHeight } = originalDimensions;
        
        if (!origWidth || !origHeight) {
            return { width: targetWidth || 500, height: targetHeight || 500 };
        }

        const aspectRatio = origWidth / origHeight;

        if (targetWidth && targetHeight) {
            // 両方指定されている場合、アスペクト比を維持して小さい方に合わせる
            const widthBasedHeight = targetWidth / aspectRatio;
            const heightBasedWidth = targetHeight * aspectRatio;

            if (widthBasedHeight <= targetHeight) {
                return { width: targetWidth, height: widthBasedHeight };
            } else {
                return { width: heightBasedWidth, height: targetHeight };
            }
        } else if (targetWidth) {
            // 幅のみ指定
            return { width: targetWidth, height: targetWidth / aspectRatio };
        } else if (targetHeight) {
            // 高さのみ指定
            return { width: targetHeight * aspectRatio, height: targetHeight };
        }

        return originalDimensions;
    }

    // 高品質スケーリングの設定
    setupHighQualityScaling(ctx) {
        // 高品質な画像スケーリングを有効にする
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 可能であれば、より高品質なスケーリングアルゴリズムを使用
        if (ctx.imageSmoothingQuality) {
            ctx.imageSmoothingQuality = 'high';
        }
    }

    // SVGをCanvasに描画
    async convertToCanvas(svgContent, transparentBackground = true, sizeOptions = null) {
        try {
            // SVGの元の寸法を取得
            const originalDimensions = this.extractSVGDimensions(svgContent);
            
            // 出力サイズを計算
            const outputDimensions = this.calculateOutputDimensions(originalDimensions, sizeOptions);
            
            // Canvasを作成
            const { canvas, ctx } = this.createCanvas(outputDimensions.width, outputDimensions.height, transparentBackground);

            // 高品質スケーリングの設定
            this.setupHighQualityScaling(ctx);

            // SVGをImage要素として読み込み
            const svgImage = await this.createSVGImage(svgContent, originalDimensions);

            // ImageをCanvasに高品質で描画
            ctx.drawImage(svgImage, 0, 0, outputDimensions.width, outputDimensions.height);

            return {
                canvas,
                width: outputDimensions.width,
                height: outputDimensions.height,
                originalWidth: originalDimensions.width,
                originalHeight: originalDimensions.height
            };
        } catch (error) {
            throw new Error(`SVGからCanvasへの変換に失敗しました: ${error.message}`);
        }
    }

    // SVGコンテンツからImage要素を作成
    createSVGImage(svgContent, dimensions) {
        return new Promise((resolve, reject) => {
            let url = null;
            let timeoutId = null;
            
            try {
                // SVGコンテンツを準備
                const processedSVG = this.prepareSVGForCanvas(svgContent, dimensions);
                
                // Blob URLを作成
                const blob = new Blob([processedSVG], { type: 'image/svg+xml' });
                url = URL.createObjectURL(blob);

                const img = new Image();
                
                // タイムアウト設定
                timeoutId = setTimeout(() => {
                    if (url) URL.revokeObjectURL(url);
                    reject(new Error('SVG画像の読み込みがタイムアウトしました'));
                }, 10000); // 10秒タイムアウト
                
                img.onload = () => {
                    clearTimeout(timeoutId);
                    if (url) URL.revokeObjectURL(url); // メモリリークを防ぐ
                    resolve(img);
                };

                img.onerror = (error) => {
                    clearTimeout(timeoutId);
                    if (url) URL.revokeObjectURL(url);
                    reject(new Error('SVG画像の読み込みに失敗しました'));
                };

                // CORS対応
                img.crossOrigin = 'anonymous';
                img.src = url;

            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId);
                if (url) URL.revokeObjectURL(url);
                reject(new Error(`SVG画像の作成に失敗しました: ${error.message}`));
            }
        });
    }

    // SVGの背景色を検出
    detectSVGBackgroundColor(svgContent) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');

            if (!svgElement) {
                return null;
            }

            // SVG要素のstyle属性から背景色を取得
            const style = svgElement.getAttribute('style');
            if (style) {
                const backgroundMatch = style.match(/background-color\s*:\s*([^;]+)/i);
                if (backgroundMatch) {
                    return backgroundMatch[1].trim();
                }
            }

            // SVG要素の背景色属性を確認
            const backgroundColor = svgElement.getAttribute('background-color') || 
                                  svgElement.getAttribute('bgcolor');
            if (backgroundColor) {
                return backgroundColor;
            }

            // 最初のrect要素が全体を覆っている場合、それを背景として扱う
            const firstRect = svgElement.querySelector('rect');
            if (firstRect) {
                const x = parseFloat(firstRect.getAttribute('x') || '0');
                const y = parseFloat(firstRect.getAttribute('y') || '0');
                const width = parseFloat(firstRect.getAttribute('width') || '0');
                const height = parseFloat(firstRect.getAttribute('height') || '0');
                
                // SVGの寸法を取得
                const svgDimensions = this.extractSVGDimensions(svgContent);
                
                // rectが全体を覆っている場合
                if (x === 0 && y === 0 && 
                    width >= svgDimensions.width * 0.95 && 
                    height >= svgDimensions.height * 0.95) {
                    const fill = firstRect.getAttribute('fill');
                    if (fill && fill !== 'none' && fill !== 'transparent') {
                        return fill;
                    }
                }
            }

            return null; // 背景色が検出されない場合
        } catch (error) {
            console.warn('SVG背景色の検出に失敗しました:', error);
            return null;
        }
    }

    // Canvas描画用にSVGを準備
    prepareSVGForCanvas(svgContent, dimensions) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');

            if (!svgElement) {
                throw new Error('SVG要素が見つかりません');
            }

            // 必要な属性を設定
            svgElement.setAttribute('width', dimensions.width);
            svgElement.setAttribute('height', dimensions.height);
            
            // viewBoxが設定されていない場合は追加
            if (!svgElement.getAttribute('viewBox')) {
                svgElement.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);
            }

            // XML名前空間を確実に設定
            if (!svgElement.getAttribute('xmlns')) {
                svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }

            // 外部リソースの問題を回避するための処理
            this.processExternalReferences(svgElement);

            return new XMLSerializer().serializeToString(svgElement);
        } catch (error) {
            throw new Error(`SVGの前処理に失敗しました: ${error.message}`);
        }
    }

    // 外部参照の処理
    processExternalReferences(svgElement) {
        // 外部画像参照を警告
        const images = svgElement.querySelectorAll('image');
        images.forEach(img => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href');
            if (href && (href.startsWith('http') || href.startsWith('//'))) {
                console.warn('外部画像参照が検出されました。変換結果に影響する可能性があります:', href);
            }
        });

        // 外部フォント参照を警告
        const texts = svgElement.querySelectorAll('text, tspan');
        texts.forEach(text => {
            const fontFamily = text.getAttribute('font-family') || 
                             getComputedStyle(text).fontFamily;
            if (fontFamily && !this.isSystemFont(fontFamily)) {
                console.warn('カスタムフォントが使用されています。システムフォントに置き換えられる可能性があります:', fontFamily);
            }
        });
    }

    // システムフォントかどうかを判定
    isSystemFont(fontFamily) {
        const systemFonts = [
            'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
            'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia'
        ];
        
        return systemFonts.some(font => 
            fontFamily.toLowerCase().includes(font.toLowerCase())
        );
    }

    // 基本的な変換ロジック（SVGからPNGへの完全な変換）
    async convertSVGToPNG(svgContent, quality = 0.95, transparentBackground = true, sizeOptions = null) {
        const conversionId = Date.now() + Math.random();
        this.activeConversions.add(conversionId);
        
        try {
            // 変換開始をログ出力
            console.log('SVGからPNGへの変換を開始します...', { conversionId, sizeOptions });

            // メモリ使用量チェック
            await this.checkMemoryUsage();

            // タイムアウト付きで変換を実行
            const result = await Promise.race([
                this.performConversion(svgContent, quality, conversionId, transparentBackground, sizeOptions),
                this.createTimeoutPromise(this.conversionTimeout)
            ]);

            console.log('SVGからPNGへの変換が完了しました', {
                conversionId,
                originalSize: `${result.width}x${result.height}`,
                actualSize: `${result.validation.actualWidth}x${result.validation.actualHeight}`,
                fileSize: formatFileSize(result.validation.fileSize)
            });

            return result;
        } catch (error) {
            console.error('SVGからPNGへの変換エラー:', error);
            // エラーハンドリングを使用
            throw this.handleConversionError(error, 'SVG to PNG変換');
        } finally {
            // クリーンアップ
            this.activeConversions.delete(conversionId);
            this.scheduleMemoryCleanup();
        }
    }

    // 実際の変換処理
    async performConversion(svgContent, quality, conversionId, transparentBackground = true, sizeOptions = null) {
        const startTime = performance.now();
        
        try {
            // SVGをCanvasに変換
            const canvasResult = await this.convertToCanvas(svgContent, transparentBackground, sizeOptions);
            
            // メモリ使用量を再チェック
            await this.checkMemoryUsage();
            
            // CanvasからPNGデータを生成
            const pngData = await this.canvasToPNG(canvasResult.canvas, quality);

            // PNG出力の検証
            const validation = await this.validatePNGOutput(
                pngData, 
                canvasResult.width, 
                canvasResult.height
            );

            if (!validation.isValid) {
                throw new Error('生成されたPNGの検証に失敗しました');
            }

            // 成功メトリクスを記録
            const duration = performance.now() - startTime;
            performanceMonitor.recordConversion(duration, pngData.size, true);
            performanceMonitor.recordMemoryUsage();

            return {
                pngData,
                width: canvasResult.width,
                height: canvasResult.height,
                canvas: canvasResult.canvas,
                validation
            };
        } catch (error) {
            // エラーメトリクスを記録
            const duration = performance.now() - startTime;
            performanceMonitor.recordConversion(duration, 0, false, error.type || 'UNKNOWN_ERROR');
            performanceMonitor.recordError(error.type || 'CONVERSION_ERROR', error.message, 'performConversion');
            throw error;
        }
    }

    // タイムアウトPromiseを作成
    createTimeoutPromise(timeoutMs) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`変換処理がタイムアウトしました（${timeoutMs/1000}秒）`));
            }, timeoutMs);
        });
    }

    // メモリ使用量チェック
    async checkMemoryUsage() {
        try {
            // performance.memory が利用可能な場合のみチェック
            if (performance.memory) {
                const memoryInfo = performance.memory;
                const usedMemory = memoryInfo.usedJSHeapSize;
                const totalMemory = memoryInfo.totalJSHeapSize;
                const memoryLimit = memoryInfo.jsHeapSizeLimit;

                console.log('メモリ使用状況:', {
                    used: formatFileSize(usedMemory),
                    total: formatFileSize(totalMemory),
                    limit: formatFileSize(memoryLimit),
                    usage: `${Math.round((usedMemory / memoryLimit) * 100)}%`
                });

                // メモリ使用量が閾値を超えている場合
                if (usedMemory > this.memoryUsageThreshold) {
                    // ガベージコレクションを促す
                    await this.forceGarbageCollection();
                    
                    // 再チェック
                    const newUsedMemory = performance.memory.usedJSHeapSize;
                    if (newUsedMemory > this.memoryUsageThreshold) {
                        throw new Error(`メモリ使用量が制限を超えています（${formatFileSize(newUsedMemory)}）`);
                    }
                }
            }
        } catch (error) {
            if (error.message.includes('メモリ使用量が制限を超えています')) {
                throw error;
            }
            // メモリチェックのエラーは警告として扱う
            console.warn('メモリ使用量チェックでエラーが発生しました:', error);
        }
    }

    // ガベージコレクションを促す
    async forceGarbageCollection() {
        // 明示的なガベージコレクションはできないが、
        // 不要な参照を削除してGCを促す
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        // 少し待機してGCの時間を与える
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // メモリクリーンアップをスケジュール
    scheduleMemoryCleanup() {
        setTimeout(() => {
            this.performMemoryCleanup();
        }, this.memoryCleanupInterval);
    }

    // メモリクリーンアップを実行
    performMemoryCleanup() {
        try {
            // 不要なCanvas要素を削除
            const canvases = document.querySelectorAll('canvas:not([data-keep])');
            canvases.forEach(canvas => {
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            });

            // 不要なBlob URLを削除
            // （実際のBlob URLは適切に管理されているはずだが、念のため）
            
            console.log('メモリクリーンアップを実行しました');
        } catch (error) {
            console.warn('メモリクリーンアップでエラーが発生しました:', error);
        }
    }

    // Canvas to PNG変換機能の実装
    async canvasToPNG(canvas, quality = 1.0) {
        const startTime = performance.now();
        
        try {
            // 入力検証
            if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
                throw new Error('有効なCanvas要素が提供されていません');
            }

            if (quality < 0.1 || quality > 1.0) {
                throw new Error('画像品質は0.1から1.0の間で指定してください');
            }

            // Canvas サイズチェック
            const canvasSize = canvas.width * canvas.height * 4; // RGBA
            if (canvasSize > 50 * 1024 * 1024) { // 50MB以上
                console.warn(`大きなCanvas（${formatFileSize(canvasSize)}）を処理しています`);
            }

            // CanvasからPNGデータを生成
            return new Promise((resolve, reject) => {
                let timeoutId = null;
                
                try {
                    // タイムアウト設定
                    timeoutId = setTimeout(() => {
                        reject(new Error('PNG生成がタイムアウトしました'));
                    }, 15000); // 15秒タイムアウト
                    
                    // toBlob メソッドを使用してPNGデータを生成
                    canvas.toBlob(
                        (blob) => {
                            clearTimeout(timeoutId);
                            
                            if (!blob) {
                                reject(new Error('PNGデータの生成に失敗しました'));
                                return;
                            }

                            // Blobを検証
                            if (blob.size === 0) {
                                reject(new Error('生成されたPNGデータが空です'));
                                return;
                            }

                            // パフォーマンス情報をログ出力
                            const endTime = performance.now();
                            const processingTime = endTime - startTime;
                            console.log(`PNG生成完了: ${processingTime.toFixed(2)}ms, サイズ: ${formatFileSize(blob.size)}`);

                            // BlobからData URLを生成
                            const reader = new FileReader();
                            reader.onload = () => {
                                const dataUrl = reader.result;
                                resolve({
                                    blob: blob,
                                    dataUrl: dataUrl,
                                    size: blob.size,
                                    type: blob.type
                                });
                            };

                            reader.onerror = () => {
                                reject(new Error('PNGデータの読み込みに失敗しました'));
                            };

                            reader.readAsDataURL(blob);
                        },
                        'image/png',
                        quality
                    );
                } catch (error) {
                    reject(new Error(`PNG生成処理でエラーが発生しました: ${error.message}`));
                }
            });
        } catch (error) {
            throw new Error(`Canvas to PNG変換に失敗しました: ${error.message}`);
        }
    }

    // 画像品質と寸法の維持を確認
    validatePNGOutput(pngData, originalWidth, originalHeight) {
        try {
            // データサイズの確認
            if (!pngData.blob || pngData.blob.size === 0) {
                throw new Error('生成されたPNGデータが無効です');
            }

            // MIMEタイプの確認
            if (pngData.type !== 'image/png') {
                throw new Error(`期待されるMIMEタイプ(image/png)と異なります: ${pngData.type}`);
            }

            // データURLの形式確認
            if (!pngData.dataUrl || !pngData.dataUrl.startsWith('data:image/png;base64,')) {
                throw new Error('生成されたData URLの形式が正しくありません');
            }

            // 寸法確認のためのImage要素を作成
            return new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // 寸法の確認
                        if (img.width !== originalWidth || img.height !== originalHeight) {
                            console.warn(`寸法が変更されました: ${originalWidth}x${originalHeight} → ${img.width}x${img.height}`);
                        }

                        // 品質の基本的な確認（ファイルサイズベース）
                        const expectedMinSize = (originalWidth * originalHeight) / 10; // 大まかな最小サイズ
                        if (pngData.size < expectedMinSize) {
                            console.warn('生成されたPNGのファイルサイズが予想より小さいです');
                        }

                        resolve({
                            isValid: true,
                            actualWidth: img.width,
                            actualHeight: img.height,
                            fileSize: pngData.size
                        });
                    } catch (error) {
                        reject(new Error(`PNG検証中にエラーが発生しました: ${error.message}`));
                    }
                };

                img.onerror = () => {
                    reject(new Error('生成されたPNG画像の読み込みに失敗しました'));
                };

                img.src = pngData.dataUrl;
            });
        } catch (error) {
            throw new Error(`PNG出力の検証に失敗しました: ${error.message}`);
        }
    }

    // PNGダウンロード機能（SVGConverterクラス内のメソッド）
    async downloadPNG(pngData, filename) {
        try {
            // 入力検証
            if (!pngData || !pngData.blob) {
                throw new Error('有効なPNGデータが提供されていません');
            }

            if (!filename) {
                throw new Error('ファイル名が指定されていません');
            }

            // ファイル名に.png拡張子を付ける処理
            const pngFileName = filename.endsWith('.png') ? filename : filename.replace(/\.[^/.]+$/, '') + '.png';

            // Blob URLを使用したダウンロード
            const url = URL.createObjectURL(pngData.blob);

            try {
                // ダウンロード用のリンク要素を作成
                const link = document.createElement('a');
                link.href = url;
                link.download = pngFileName;
                link.style.display = 'none';

                // リンクをDOMに追加してクリック
                document.body.appendChild(link);
                link.click();

                // リンクをDOMから削除
                document.body.removeChild(link);

                console.log(`PNGファイル "${pngFileName}" のダウンロードを開始しました`);
                return { success: true, fileName: pngFileName };

            } finally {
                // Blob URLを解放
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error('PNGダウンロードエラー:', error);
            throw new Error(`PNGダウンロードに失敗しました: ${error.message}`);
        }
    }

    // 変換キャンセル機能
    cancelConversion(conversionId) {
        if (this.activeConversions.has(conversionId)) {
            this.activeConversions.delete(conversionId);
            console.log(`変換をキャンセルしました: ${conversionId}`);
            return true;
        }
        return false;
    }

    // 全ての変換をキャンセル
    cancelAllConversions() {
        const canceledCount = this.activeConversions.size;
        this.activeConversions.clear();
        console.log(`${canceledCount}個の変換をキャンセルしました`);
        return canceledCount;
    }

    // アクティブな変換数を取得
    getActiveConversionsCount() {
        return this.activeConversions.size;
    }

    // 変換エラーハンドリング
    handleConversionError(error, context = '') {
        let errorMessage = '変換処理中にエラーが発生しました';
        let errorType = 'CONVERSION_ERROR';
        
        if (error.message.includes('タイムアウト')) {
            errorMessage = '変換処理がタイムアウトしました。SVGが複雑すぎる可能性があります。';
            errorType = 'TIMEOUT_ERROR';
        } else if (error.message.includes('Canvas')) {
            errorMessage = 'Canvas処理でエラーが発生しました。SVGが複雑すぎる可能性があります。';
            errorType = 'CANVAS_ERROR';
        } else if (error.message.includes('メモリ')) {
            errorMessage = 'メモリ不足です。より小さなSVGファイルを使用してください。';
            errorType = 'MEMORY_ERROR';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'セキュリティ制限により変換できませんでした。';
            errorType = 'SECURITY_ERROR';
        } else if (error.message.includes('サイズ')) {
            errorMessage = 'SVGのサイズが大きすぎます。';
            errorType = 'SIZE_ERROR';
        } else if (error.message.includes('PNG生成')) {
            errorMessage = 'PNG生成でエラーが発生しました。';
            errorType = 'PNG_GENERATION_ERROR';
        } else {
            errorMessage = `${errorMessage}: ${error.message}`;
        }

        if (context) {
            errorMessage = `[${context}] ${errorMessage}`;
        }

        console.error('変換エラーの詳細:', {
            type: errorType,
            message: errorMessage,
            originalError: error,
            context: context,
            activeConversions: this.activeConversions.size
        });

        const enhancedError = new Error(errorMessage);
        enhancedError.type = errorType;
        enhancedError.originalError = error;
        return enhancedError;
    }
}

// クラスインスタンスの作成
const fileHandler = new FileHandler();
const svgConverter = new SVGConverter();

// ユーティリティ関数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// パフォーマンス監視ユーティリティ
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            conversions: [],
            memoryUsage: [],
            errors: []
        };
        this.maxMetricsHistory = 50; // 最大50件の履歴を保持
    }

    // 変換メトリクスを記録
    recordConversion(duration, fileSize, success, errorType = null) {
        const metric = {
            timestamp: Date.now(),
            duration,
            fileSize,
            success,
            errorType
        };
        
        this.metrics.conversions.unshift(metric);
        if (this.metrics.conversions.length > this.maxMetricsHistory) {
            this.metrics.conversions = this.metrics.conversions.slice(0, this.maxMetricsHistory);
        }
    }

    // メモリ使用量を記録
    recordMemoryUsage() {
        if (performance.memory) {
            const metric = {
                timestamp: Date.now(),
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            
            this.metrics.memoryUsage.unshift(metric);
            if (this.metrics.memoryUsage.length > this.maxMetricsHistory) {
                this.metrics.memoryUsage = this.metrics.memoryUsage.slice(0, this.maxMetricsHistory);
            }
        }
    }

    // エラーを記録
    recordError(errorType, message, context = null) {
        const metric = {
            timestamp: Date.now(),
            errorType,
            message,
            context
        };
        
        this.metrics.errors.unshift(metric);
        if (this.metrics.errors.length > this.maxMetricsHistory) {
            this.metrics.errors = this.metrics.errors.slice(0, this.maxMetricsHistory);
        }
    }

    // パフォーマンス統計を取得
    getStats() {
        const conversions = this.metrics.conversions;
        const successful = conversions.filter(c => c.success);
        const failed = conversions.filter(c => !c.success);
        
        return {
            totalConversions: conversions.length,
            successfulConversions: successful.length,
            failedConversions: failed.length,
            successRate: conversions.length > 0 ? (successful.length / conversions.length * 100).toFixed(1) + '%' : '0%',
            averageDuration: successful.length > 0 ? (successful.reduce((sum, c) => sum + c.duration, 0) / successful.length).toFixed(0) + 'ms' : 'N/A',
            totalErrors: this.metrics.errors.length,
            currentMemoryUsage: this.getCurrentMemoryUsage()
        };
    }

    // 現在のメモリ使用量を取得
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return {
                used: formatFileSize(performance.memory.usedJSHeapSize),
                total: formatFileSize(performance.memory.totalJSHeapSize),
                limit: formatFileSize(performance.memory.jsHeapSizeLimit),
                usage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100) + '%'
            };
        }
        return null;
    }

    // メトリクスをリセット
    reset() {
        this.metrics = {
            conversions: [],
            memoryUsage: [],
            errors: []
        };
    }
}

// グローバルパフォーマンスモニター
const performanceMonitor = new PerformanceMonitor();

// 初回利用者かどうかを判定
function isFirstTimeUser() {
    try {
        const hasVisited = localStorage.getItem('svg-to-png-converter-visited');
        if (!hasVisited) {
            localStorage.setItem('svg-to-png-converter-visited', 'true');
            return true;
        }
        return false;
    } catch (error) {
        // localStorage が使用できない場合は初回として扱う
        console.warn('localStorage not available:', error);
        return true;
    }
}



