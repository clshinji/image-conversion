/**
 * 直感的インターフェース統合コントローラー
 * ガイダンス、ビジュアルフィードバック、エラーハンドリングを統合管理
 */
import { GuidanceController } from './GuidanceController.js';
import { VisualFeedbackController } from './VisualFeedbackController.js';
import { ErrorHandler } from './ErrorHandler.js';
import { RealtimePreviewController } from './RealtimePreviewController.js';
import { DetailedInfoController } from './DetailedInfoController.js';

export class IntuitiveUIController {
    constructor() {
        this.guidanceController = null;
        this.visualFeedback = null;
        this.errorHandler = null;
        this.realtimePreview = null;
        this.detailedInfo = null;
        this.isInitialized = false;
        this.userPreferences = {
            showGuidance: true,
            autoAdvanceGuidance: true,
            enableAnimations: true,
            feedbackDuration: 'normal' // short, normal, long
        };
        
        this.init();
    }
    
    /**
     * 初期化
     */
    async init() {
        try {
            // ユーザー設定を読み込み
            this.loadUserPreferences();
            
            // ビジュアルフィードバックコントローラーを初期化
            this.visualFeedback = new VisualFeedbackController();
            
            // エラーハンドラーを初期化
            this.errorHandler = new ErrorHandler(this.visualFeedback);
            
            // グローバルに公開（エラーモーダルから呼び出すため）
            window.errorHandler = this.errorHandler;
            
            // ガイダンスコントローラーを初期化
            if (this.userPreferences.showGuidance) {
                this.guidanceController = new GuidanceController();
            }
            
            // リアルタイムプレビューコントローラーを初期化
            this.realtimePreview = new RealtimePreviewController(null, this.visualFeedback);
            window.realtimePreview = this.realtimePreview;
            
            // 詳細情報コントローラーを初期化
            this.detailedInfo = new DetailedInfoController(this.visualFeedback);
            window.detailedInfo = this.detailedInfo;
            
            // 既存のUIイベントと統合
            this.integrateWithExistingUI();
            
            // 初期化完了の通知
            this.showWelcomeMessage();
            
            this.isInitialized = true;
            console.log('直感的UIコントローラーが初期化されました');
            
        } catch (error) {
            console.error('直感的UIコントローラーの初期化に失敗:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * ユーザー設定を読み込み
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('intuitiveUI_preferences');
            if (saved) {
                this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('ユーザー設定の読み込みに失敗:', error);
        }
    }
    
    /**
     * ユーザー設定を保存
     */
    saveUserPreferences() {
        try {
            localStorage.setItem('intuitiveUI_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.warn('ユーザー設定の保存に失敗:', error);
        }
    }
    
    /**
     * 既存のUIとの統合
     */
    integrateWithExistingUI() {
        // ファイル選択イベントの監視
        this.monitorFileSelection();
        
        // 変換オプション変更の監視
        this.monitorConversionOptions();
        
        // 変換処理の監視
        this.monitorConversionProcess();
        
        // エラーイベントの監視
        this.monitorErrorEvents();
        
        // UI状態変化の監視
        this.monitorUIStateChanges();
        
        // キーボードショートカットの統合
        this.setupKeyboardShortcuts();
    }
    
    /**
     * ファイル選択の監視
     */
    monitorFileSelection() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        if (fileInput) {
            fileInput.addEventListener('change', (event) => {
                if (event.target.files.length > 0) {
                    this.handleFileSelected(event.target.files);
                }
            });
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('drop', (event) => {
                if (event.dataTransfer.files.length > 0) {
                    this.handleFileSelected(event.dataTransfer.files);
                }
            });
        }
    }
    
    /**
     * 変換オプション変更の監視
     */
    monitorConversionOptions() {
        const targetFormat = document.getElementById('targetFormat');
        const qualitySlider = document.getElementById('qualitySlider');
        const sizePreset = document.getElementById('sizePreset');
        
        if (targetFormat) {
            targetFormat.addEventListener('change', () => {
                this.handleFormatChanged();
                this.showFormatChangeHint(targetFormat.value);
            });
        }
        
        if (qualitySlider) {
            qualitySlider.addEventListener('input', () => {
                this.handleOptionsChanged();
                this.showQualityHint(qualitySlider.value);
            });
        }
        
        if (sizePreset) {
            sizePreset.addEventListener('change', () => {
                this.handleOptionsChanged();
                this.showSizeHint(sizePreset.value);
            });
        }
    }
    
    /**
     * 変換処理の監視
     */
    monitorConversionProcess() {
        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                this.handleConversionStarted();
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.handleDownloadReady();
            });
        }
        
        // 変換完了の監視（MutationObserverを使用）
        this.observeConversionCompletion();
    }
    
    /**
     * 変換完了の監視
     */
    observeConversionCompletion() {
        const downloadBtn = document.getElementById('downloadBtn');
        if (!downloadBtn) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                    if (!downloadBtn.disabled) {
                        this.handleConversionCompleted();
                    }
                }
            });
        });
        
        observer.observe(downloadBtn, { attributes: true });
    }
    
    /**
     * エラーイベントの監視
     */
    monitorErrorEvents() {
        // 既存のエラーメッセージ要素の監視
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        if (errorMessage.style.display !== 'none' && errorMessage.textContent.trim()) {
                            this.handleErrorDisplayed(errorMessage.textContent);
                        }
                    }
                });
            });
            
            observer.observe(errorMessage, { 
                childList: true, 
                subtree: true, 
                characterData: true 
            });
        }
    }
    
    /**
     * UI状態変化の監視
     */
    monitorUIStateChanges() {
        // プレビューエリアの表示状態監視
        const originalPreview = document.getElementById('originalPreview');
        const convertedPreview = document.getElementById('convertedPreview');
        
        if (originalPreview) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (originalPreview.style.display !== 'none') {
                            this.handlePreviewShown('original');
                        }
                    }
                });
            });
            
            observer.observe(originalPreview, { attributes: true });
        }
        
        if (convertedPreview) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (convertedPreview.style.display !== 'none') {
                            this.handlePreviewShown('converted');
                        }
                    }
                });
            });
            
            observer.observe(convertedPreview, { attributes: true });
        }
    }
    
    /**
     * キーボードショートカットの設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // F1: ヘルプ表示
            if (event.key === 'F1') {
                event.preventDefault();
                this.showHelp();
            }
            
            // Ctrl/Cmd + H: ガイダンス表示切り替え
            if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
                event.preventDefault();
                this.toggleGuidance();
            }
            
            // Ctrl/Cmd + Shift + R: ガイダンスリセット
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                this.resetGuidance();
            }
        });
    }
    
    /**
     * イベントハンドラー
     */
    handleFileSelected(files) {
        const fileCount = files.length;
        const fileName = files[0].name;
        
        // ガイダンス更新
        if (this.guidanceController) {
            this.guidanceController.handleAction('fileSelected');
        }
        
        // リアルタイムプレビューにファイルを設定
        if (this.realtimePreview && fileCount === 1) {
            this.realtimePreview.setFile(files[0]);
        }
        
        // 詳細情報にファイルを設定
        if (this.detailedInfo && fileCount === 1) {
            this.detailedInfo.setOriginalFile(files[0]);
        }
        
        // ビジュアルフィードバック
        if (fileCount === 1) {
            this.visualFeedback.showSuccess(`ファイル「${fileName}」が選択されました`, {
                duration: 2000
            });
        } else {
            this.visualFeedback.showSuccess(`${fileCount}個のファイルが選択されました`, {
                duration: 2000
            });
        }
        
        // アップロードエリアにアニメーション効果
        this.visualFeedback.bounce('#uploadArea', { height: 'small' });
    }
    
    handleFormatChanged() {
        if (this.guidanceController) {
            this.guidanceController.handleAction('formatChanged');
        }
    }
    
    handleOptionsChanged() {
        if (this.guidanceController) {
            this.guidanceController.handleAction('optionsChanged');
        }
    }
    
    handleConversionStarted() {
        if (this.guidanceController) {
            this.guidanceController.handleAction('conversionStarted');
        }
        
        // 変換開始のフィードバック
        this.visualFeedback.showInfo('変換を開始しています...', {
            duration: 2000
        });
        
        // 変換ボタンにアニメーション効果
        this.visualFeedback.pulse('#convertBtn', { color: '#667eea' });
    }
    
    handleConversionCompleted() {
        // 成功フィードバック
        this.visualFeedback.showSuccess('変換が完了しました！', {
            duration: 3000
        });
        
        // ダウンロードボタンにグロー効果
        this.visualFeedback.glow('#downloadBtn', { 
            color: '#28a745',
            duration: 5000
        });
        
        // 詳細情報に変換結果を設定（仮のデータ）
        if (this.detailedInfo) {
            const mockResult = {
                format: document.getElementById('targetFormat')?.value || 'png',
                fileSize: this.detailedInfo.originalFile?.size * 0.8 || 1024000, // 仮の値
                size: { width: 800, height: 600 } // 仮の値
            };
            this.detailedInfo.setConvertedResult(mockResult);
        }
        
        // 変換完了音（オプション）
        this.playNotificationSound('success');
    }
    
    handleDownloadReady() {
        if (this.guidanceController) {
            this.guidanceController.handleAction('downloadReady');
        }
        
        this.visualFeedback.showSuccess('ダウンロードが開始されました', {
            duration: 2000
        });
    }
    
    handleErrorDisplayed(errorText) {
        // 既存のエラーメッセージを非表示にして、改良版を表示
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        // エラーハンドラーで処理
        this.errorHandler.handleError(errorText, {
            context: 'ui_display',
            source: 'existing_error_system'
        });
    }
    
    handlePreviewShown(type) {
        if (type === 'original') {
            this.visualFeedback.showInfo('プレビューを表示しました', {
                duration: 1500
            });
        }
    }
    
    /**
     * ヒント表示メソッド
     */
    showFormatChangeHint(format) {
        const hints = {
            'png': 'PNG形式は透明度をサポートし、高品質な画像に適しています',
            'jpg': 'JPEG形式は写真に最適で、ファイルサイズが小さくなります',
            'webp': 'WebP形式は高い圧縮率と品質を両立する最新の形式です',
            'gif': 'GIF形式はアニメーションをサポートしますが、色数に制限があります',
            'svg': 'SVG形式はベクター画像で、拡大縮小しても品質が劣化しません'
        };
        
        const hint = hints[format];
        if (hint) {
            this.visualFeedback.showInfo(hint, { duration: 4000 });
        }
    }
    
    showQualityHint(quality) {
        const qualityNum = parseInt(quality);
        let hint = '';
        
        if (qualityNum >= 90) {
            hint = '高品質設定：最高の画質ですが、ファイルサイズが大きくなります';
        } else if (qualityNum >= 70) {
            hint = '標準品質設定：品質とファイルサイズのバランスが良好です';
        } else {
            hint = '低品質設定：ファイルサイズは小さくなりますが、画質が劣化します';
        }
        
        this.visualFeedback.showInfo(hint, { duration: 3000 });
    }
    
    showSizeHint(sizePreset) {
        const hints = {
            'original': '元のサイズを維持します',
            '100x100': 'アイコンサイズ：小さなアイコンに最適です',
            '200x200': '小サイズ：SNSのプロフィール画像などに適しています',
            '500x500': '中サイズ：ウェブサイトの画像に適しています',
            '1000x1000': '大サイズ：印刷用途にも使用できます',
            '1920x1080': 'フルHDサイズ：高解像度ディスプレイに最適です',
            'custom': 'カスタムサイズ：お好みのサイズを指定できます'
        };
        
        const hint = hints[sizePreset];
        if (hint) {
            this.visualFeedback.showInfo(hint, { duration: 3000 });
        }
    }
    
    /**
     * ウェルカムメッセージの表示
     */
    showWelcomeMessage() {
        if (this.isFirstVisit()) {
            setTimeout(() => {
                this.visualFeedback.showInfo(
                    '画像変換ツールへようこそ！右上のガイドで使い方を確認できます。',
                    { 
                        duration: 5000,
                        actions: [{
                            label: 'ガイドを表示',
                            handler: 'window.intuitiveUI.showGuidance()'
                        }]
                    }
                );
            }, 1000);
            
            this.markVisited();
        }
    }
    
    /**
     * 初回訪問かどうかを確認
     */
    isFirstVisit() {
        return !localStorage.getItem('imageConverter_visited');
    }
    
    /**
     * 訪問済みとしてマーク
     */
    markVisited() {
        localStorage.setItem('imageConverter_visited', 'true');
    }
    
    /**
     * ヘルプの表示
     */
    showHelp() {
        const helpContent = `
            <div class="help-content">
                <h3>🎯 画像変換ツール ヘルプ</h3>
                
                <div class="help-section">
                    <h4>📁 基本的な使い方</h4>
                    <ol>
                        <li>画像ファイルをアップロード</li>
                        <li>変換先の形式を選択</li>
                        <li>品質やサイズなどのオプションを設定</li>
                        <li>変換を実行</li>
                        <li>変換されたファイルをダウンロード</li>
                    </ol>
                </div>
                
                <div class="help-section">
                    <h4>🎨 対応形式</h4>
                    <ul>
                        <li><strong>入力:</strong> SVG, PNG, JPG, WebP, GIF</li>
                        <li><strong>出力:</strong> PNG, JPG, WebP, GIF, SVG</li>
                        <li><strong>最大サイズ:</strong> 10MB</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>⌨️ キーボードショートカット</h4>
                    <ul>
                        <li><kbd>Ctrl/Cmd + O</kbd> - ファイル選択</li>
                        <li><kbd>Ctrl/Cmd + Enter</kbd> - 変換実行</li>
                        <li><kbd>Ctrl/Cmd + S</kbd> - ダウンロード</li>
                        <li><kbd>Ctrl/Cmd + H</kbd> - ガイド表示切り替え</li>
                        <li><kbd>F1</kbd> - このヘルプを表示</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>🔒 プライバシー</h4>
                    <p>すべての変換処理はブラウザ内で実行され、ファイルが外部サーバーに送信されることはありません。</p>
                </div>
            </div>
        `;
        
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ヘルプ</h3>
                    <button class="modal-close" onclick="this.closest('.help-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${helpContent}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.help-modal').remove()">
                        閉じる
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
    }
    
    /**
     * ガイダンス表示切り替え
     */
    toggleGuidance() {
        if (this.guidanceController) {
            this.guidanceController.toggleVisibility();
        } else {
            // ガイダンスが無効な場合は有効化
            this.guidanceController = new GuidanceController();
            this.userPreferences.showGuidance = true;
            this.saveUserPreferences();
        }
    }
    
    /**
     * ガイダンス表示
     */
    showGuidance() {
        if (!this.guidanceController) {
            this.guidanceController = new GuidanceController();
        }
        this.guidanceController.show();
    }
    
    /**
     * ガイダンスリセット
     */
    resetGuidance() {
        if (this.guidanceController) {
            this.guidanceController.reset();
            this.visualFeedback.showInfo('ガイダンスをリセットしました', {
                duration: 2000
            });
        }
    }
    
    /**
     * 通知音の再生（オプション）
     */
    playNotificationSound(type) {
        if (!this.userPreferences.enableSounds) return;
        
        try {
            // Web Audio APIを使用した簡単な通知音
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 音の設定
            const frequencies = {
                success: [523.25, 659.25, 783.99], // C5, E5, G5
                error: [220, 196], // A3, G3
                warning: [440, 493.88] // A4, B4
            };
            
            const freq = frequencies[type] || frequencies.success;
            oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
            
            if (freq.length > 1) {
                oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + 0.1);
            }
            if (freq.length > 2) {
                oscillator.frequency.setValueAtTime(freq[2], audioContext.currentTime + 0.2);
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
        } catch (error) {
            // 音の再生に失敗しても処理を続行
            console.warn('通知音の再生に失敗:', error);
        }
    }
    
    /**
     * 設定の更新
     */
    updatePreferences(newPreferences) {
        this.userPreferences = { ...this.userPreferences, ...newPreferences };
        this.saveUserPreferences();
        
        // 設定変更の反映
        if ('showGuidance' in newPreferences) {
            if (newPreferences.showGuidance && !this.guidanceController) {
                this.guidanceController = new GuidanceController();
            } else if (!newPreferences.showGuidance && this.guidanceController) {
                this.guidanceController.hide();
            }
        }
        
        if ('autoAdvanceGuidance' in newPreferences && this.guidanceController) {
            this.guidanceController.autoAdvance = newPreferences.autoAdvanceGuidance;
        }
    }
    
    /**
     * 統計情報の取得
     */
    getStatistics() {
        return {
            isInitialized: this.isInitialized,
            hasGuidance: !!this.guidanceController,
            errorStats: this.errorHandler ? this.errorHandler.getErrorStatistics() : null,
            preferences: this.userPreferences
        };
    }
    
    /**
     * 初期化エラーの処理
     */
    handleInitializationError(error) {
        console.error('直感的UIの初期化エラー:', error);
        
        // 最小限のエラー表示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'initialization-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h4>⚠️ UI機能の初期化に失敗しました</h4>
                <p>基本的な機能は利用できますが、一部の便利機能が無効になっています。</p>
                <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // 5秒後に自動で閉じる
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// グローバルに公開
window.intuitiveUI = null;