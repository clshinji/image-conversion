// 多形式画像変換アプリケーションのメインエントリーポイント

import { AppState } from './state/AppState.js';
import { validateBrowserCompatibility } from './utils/validation.js';
import { SUPPORTED_FORMATS } from './constants.js';
import { IntuitiveUIController } from './ui/IntuitiveUIController.js';
import { PrivacyManager } from './security/PrivacyManager.js';
import { DataCleanupManager } from './security/DataCleanupManager.js';
import { SecureDataHandler } from './security/SecureDataHandler.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { ErrorHandler } from './ui/ErrorHandler.js';

// グローバル変数
let appState;
let fileHandler;
let imageConverter;
let uiController;
let batchProcessor;
let intuitiveUI;
let privacyManager;
let dataCleanupManager;
let secureDataHandler;
let performanceMonitor;
let errorHandler;

// DOM要素の取得
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    cameraInput: document.getElementById('cameraInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    originalPreview: document.getElementById('originalPreview'),
    originalPreviewTitle: document.getElementById('originalPreviewTitle'),
    originalPreviewContent: document.getElementById('originalPreviewContent'),
    convertedPreview: document.getElementById('convertedPreview'),
    convertedPreviewTitle: document.getElementById('convertedPreviewTitle'),
    convertedPreviewContent: document.getElementById('convertedPreviewContent'),
    convertBtn: document.getElementById('convertBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage'),
    conversionOptions: document.getElementById('conversionOptions'),
    targetFormat: document.getElementById('targetFormat'),
    qualityGroup: document.getElementById('qualityGroup'),
    qualitySlider: document.getElementById('qualitySlider'),
    qualityValue: document.getElementById('qualityValue'),
    transparentBgOption: document.getElementById('transparentBgOption'),
    backgroundGroup: document.getElementById('backgroundGroup'),
    backgroundColorGroup: document.getElementById('backgroundColorGroup'),
    backgroundColor: document.getElementById('backgroundColor'),
    sizePreset: document.getElementById('sizePreset'),
    customSizeInputs: document.getElementById('customSizeInputs'),
    customWidth: document.getElementById('customWidth'),
    customHeight: document.getElementById('customHeight'),
    sizeInfo: document.getElementById('sizeInfo')
};

/**
 * モバイルデバイスの検出
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
}

/**
 * タブレットデバイスの検出
 */
function isTabletDevice() {
    const userAgent = navigator.userAgent;
    const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(userAgent);
    const isTabletSize = window.innerWidth >= 768 && window.innerWidth <= 1023;
    const hasTouch = 'ontouchstart' in window;
    
    return isTabletUA || (isTabletSize && hasTouch);
}

/**
 * タッチデバイスの検出
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * アプリケーションの初期化
 */
async function initializeApp() {
    try {
        console.log('多形式画像変換アプリケーションを初期化中...');
        
        // ブラウザ互換性チェック
        const compatibility = validateBrowserCompatibility();
        if (!compatibility.isSupported) {
            showCriticalError(
                'ブラウザ非対応',
                `このブラウザでは一部の機能がサポートされていません: ${compatibility.missingFeatures.join(', ')}`,
                'より新しいブラウザをご利用ください'
            );
            return;
        }
        
        // 警告がある場合は表示
        if (compatibility.warnings.length > 0) {
            console.warn('ブラウザ互換性の警告:', compatibility.warnings);
        }
        
        // プライバシー管理の初期化（最優先）
        privacyManager = new PrivacyManager();
        await privacyManager.initialize();
        
        // データクリーンアップ管理の初期化
        dataCleanupManager = new DataCleanupManager();
        dataCleanupManager.initialize();
        
        // セキュアデータハンドラーの初期化
        secureDataHandler = new SecureDataHandler(dataCleanupManager);
        
        // パフォーマンス監視の初期化
        performanceMonitor = new PerformanceMonitor();
        
        // エラーハンドラーの初期化（ビジュアルフィードバック用のダミー）
        const visualFeedback = {
            showError: (message, options) => showError(message),
            showWarning: (message, options) => showWarning(message),
            showInfo: (message, options) => showInfo(message),
            showSuccess: (message, options) => showSuccess(message),
            removeFeedback: (id) => console.log(`Removing feedback: ${id}`),
            pulse: (selector, options) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.animation = 'pulse 0.5s ease-in-out';
                    setTimeout(() => element.style.animation = '', 500);
                }
            }
        };
        errorHandler = new ErrorHandler(visualFeedback);
        
        // パフォーマンス監視のイベントリスナー設定
        setupPerformanceEventListeners();
        
        // アプリケーション状態の初期化
        appState = new AppState();
        
        // モバイル対応の初期化
        initializeMobileSupport();
        
        // 基本的なイベントリスナーの設定
        setupBasicEventListeners();
        
        // UIの初期化
        initializeUI();
        
        // 動的インポートでコンポーネントを読み込み
        await loadComponents();
        
        // 直感的UIコントローラーの初期化
        await initializeIntuitiveUI();
        
        console.log('アプリケーションの初期化が完了しました');
        
    } catch (error) {
        console.error('アプリケーションの初期化に失敗しました:', error);
        showCriticalError(
            '初期化エラー',
            'アプリケーションの初期化中にエラーが発生しました',
            'ページを再読み込みしてください'
        );
    }
}

/**
 * レスポンシブ対応の初期化
 */
function initializeMobileSupport() {
    const isMobile = isMobileDevice();
    const isTablet = isTabletDevice();
    const isDesktop = isDesktopDevice();
    const isTouch = isTouchDevice();
    
    // body要素にクラスを追加
    document.body.classList.toggle('mobile-device', isMobile);
    document.body.classList.toggle('tablet-device', isTablet);
    document.body.classList.toggle('desktop-device', isDesktop);
    document.body.classList.toggle('touch-device', isTouch);
    
    // モバイルの場合、カメラボタンを追加
    if (isMobile && elements.uploadArea) {
        addCameraButton();
    }
    
    // タブレットの場合、タブレット最適化を適用
    if (isTablet) {
        optimizeForTablet();
    }
    
    // デスクトップの場合、デスクトップ最適化を適用
    if (isDesktop) {
        optimizeForDesktop();
    }
    
    // タッチデバイスの場合、タッチ最適化を適用
    if (isTouch) {
        optimizeForTouch();
    }
    
    // 画面回転の監視
    if (isMobile || isTablet) {
        setupOrientationHandling();
    }
    
    console.log(`デバイス検出: モバイル=${isMobile}, タブレット=${isTablet}, デスクトップ=${isDesktop}, タッチ=${isTouch}`);
}

/**
 * カメラボタンの追加
 */
function addCameraButton() {
    const uploadContent = elements.uploadArea.querySelector('.upload-content');
    if (!uploadContent) return;
    
    // カメラボタンを作成
    const cameraBtn = document.createElement('button');
    cameraBtn.type = 'button';
    cameraBtn.className = 'upload-btn camera-btn';
    cameraBtn.innerHTML = '📷 カメラで撮影';
    cameraBtn.id = 'cameraBtn';
    
    // カメラボタンのイベントリスナー
    cameraBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        elements.cameraInput?.click();
    });
    
    // カメラ入力のイベントリスナー
    elements.cameraInput?.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    // ボタンを追加
    uploadContent.appendChild(cameraBtn);
    
    // 既存のボタンテキストを更新
    if (elements.uploadBtn) {
        elements.uploadBtn.innerHTML = '📁 ファイルを選択';
    }
}

/**
 * タブレット向け最適化
 */
function optimizeForTablet() {
    // タブレット向けのマウス・タッチ両対応
    setupHybridInteraction();
    
    // タブレット向けレイアウト調整
    adjustTabletLayout();
    
    // タブレット向けキーボードショートカット（外付けキーボード対応）
    setupTabletKeyboardShortcuts();
}

/**
 * デスクトップデバイスの検出
 */
function isDesktopDevice() {
    return window.innerWidth >= 1024 && !isTouchDevice();
}

/**
 * デスクトップ向け最適化
 */
function optimizeForDesktop() {
    // デスクトップ向けレイアウト調整
    adjustDesktopLayout();
    
    // 高度なキーボードショートカット
    setupDesktopKeyboardShortcuts();
    
    // マウス操作の最適化
    optimizeMouseInteraction();
    
    // 高解像度ディスプレイ対応
    optimizeForHighDPI();
}

/**
 * デスクトップ向けレイアウト調整
 */
function adjustDesktopLayout() {
    // 3カラムレイアウトの動的調整
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.querySelector('.main-content')) {
        // 3カラムレイアウト構造を動的に作成
        createThreeColumnLayout();
    }
    
    // プレビューエリアの最適化
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        previewContainer.style.gridTemplateColumns = '1fr 1fr';
        previewContainer.style.gap = '24px';
    }
}

/**
 * 3カラムレイアウトの作成
 */
function createThreeColumnLayout() {
    const main = document.querySelector('main');
    if (!main) return;
    
    // 既存のコンテンツを取得
    const uploadSection = main.querySelector('.upload-section');
    const batchModeToggle = main.querySelector('.batch-mode-toggle');
    const fileInfo = main.querySelector('.file-info');
    const batchFileList = main.querySelector('.batch-file-list');
    const previewSection = main.querySelector('.preview-section');
    const conversionOptions = main.querySelector('.conversion-options');
    const controls = main.querySelector('.controls');
    const batchProgress = main.querySelector('.batch-progress');
    const messageArea = main.querySelector('.message-area');
    
    // 3カラム構造を作成
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    
    const leftColumn = document.createElement('div');
    leftColumn.className = 'left-column';
    
    const centerColumn = document.createElement('div');
    centerColumn.className = 'center-column';
    
    const rightColumn = document.createElement('div');
    rightColumn.className = 'right-column';
    
    // 左カラム: ファイル情報、バッチ設定
    if (fileInfo) leftColumn.appendChild(fileInfo);
    if (batchModeToggle) leftColumn.appendChild(batchModeToggle);
    if (batchFileList) leftColumn.appendChild(batchFileList);
    
    // 中央カラム: アップロード、プレビュー、コントロール
    if (uploadSection) centerColumn.appendChild(uploadSection);
    if (previewSection) centerColumn.appendChild(previewSection);
    if (controls) centerColumn.appendChild(controls);
    if (batchProgress) centerColumn.appendChild(batchProgress);
    if (messageArea) centerColumn.appendChild(messageArea);
    
    // 右カラム: 変換オプション
    if (conversionOptions) rightColumn.appendChild(conversionOptions);
    
    // カラムを追加
    mainContent.appendChild(leftColumn);
    mainContent.appendChild(centerColumn);
    mainContent.appendChild(rightColumn);
    
    // メインコンテンツを挿入
    main.insertBefore(mainContent, main.firstChild);
}

/**
 * デスクトップ向けキーボードショートカット
 */
function setupDesktopKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // 基本的なショートカット（タブレットと共通）
        
        // Ctrl/Cmd + O: ファイル選択
        if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
            event.preventDefault();
            elements.fileInput?.click();
        }
        
        // Ctrl/Cmd + Enter: 変換実行
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            const convertBtn = elements.convertBtn;
            if (convertBtn && !convertBtn.disabled) {
                convertBtn.click();
            }
        }
        
        // Ctrl/Cmd + S: ダウンロード
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            const downloadBtn = elements.downloadBtn;
            if (downloadBtn && !downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
        
        // デスクトップ専用ショートカット
        
        // Ctrl/Cmd + B: バッチモード切り替え
        if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
            event.preventDefault();
            const batchModeSwitch = document.getElementById('batchModeSwitch');
            if (batchModeSwitch) {
                batchModeSwitch.click();
            }
        }
        
        // Ctrl/Cmd + 1-5: 形式選択
        if ((event.ctrlKey || event.metaKey) && /^[1-5]$/.test(event.key)) {
            event.preventDefault();
            const formatSelect = elements.targetFormat;
            if (formatSelect) {
                const options = formatSelect.options;
                const index = parseInt(event.key) - 1;
                if (index < options.length) {
                    formatSelect.selectedIndex = index;
                    formatSelect.dispatchEvent(new Event('change'));
                }
            }
        }
        
        // F1: ヘルプ表示
        if (event.key === 'F1') {
            event.preventDefault();
            showKeyboardShortcutsHelp();
        }
        
        // Escape: エラーメッセージを閉じる
        if (event.key === 'Escape') {
            closeMessages();
        }
        
        // Delete: 選択されたファイルを削除（バッチモード）
        if (event.key === 'Delete' && appState?.get('batchMode')) {
            event.preventDefault();
            // バッチファイル削除処理（実装は後で）
        }
    });
}

/**
 * マウス操作の最適化
 */
function optimizeMouseInteraction() {
    // 右クリックコンテキストメニュー（将来の拡張用）
    document.addEventListener('contextmenu', (event) => {
        // 特定の要素での右クリックメニューを無効化
        if (event.target.closest('.preview-content, .upload-area')) {
            event.preventDefault();
        }
    });
    
    // マウスホイールでの品質調整
    const qualitySlider = elements.qualitySlider;
    if (qualitySlider) {
        qualitySlider.addEventListener('wheel', (event) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                const delta = event.deltaY > 0 ? -5 : 5;
                const currentValue = parseInt(qualitySlider.value);
                const newValue = Math.max(10, Math.min(100, currentValue + delta));
                qualitySlider.value = newValue;
                qualitySlider.dispatchEvent(new Event('input'));
            }
        });
    }
}

/**
 * 高解像度ディスプレイ対応
 */
function optimizeForHighDPI() {
    const pixelRatio = window.devicePixelRatio || 1;
    
    if (pixelRatio > 1) {
        // 高DPIディスプレイ用のクラスを追加
        document.body.classList.add('high-dpi');
        
        // Canvas要素の高解像度対応
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * pixelRatio;
            canvas.height = rect.height * pixelRatio;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            
            ctx.scale(pixelRatio, pixelRatio);
        });
    }
}

/**
 * キーボードショートカットヘルプの表示
 */
function showKeyboardShortcutsHelp() {
    const helpContent = `
        <div class="keyboard-shortcuts-help">
            <h3>キーボードショートカット</h3>
            <div class="shortcuts-list">
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd + O</kbd>
                    <span>ファイル選択</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd + Enter</kbd>
                    <span>変換実行</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd + S</kbd>
                    <span>ダウンロード</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd + B</kbd>
                    <span>バッチモード切り替え</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd + 1-5</kbd>
                    <span>形式選択</span>
                </div>
                <div class="shortcut-item">
                    <kbd>F1</kbd>
                    <span>このヘルプを表示</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Escape</kbd>
                    <span>メッセージを閉じる</span>
                </div>
            </div>
            <button type="button" class="help-close-btn" onclick="this.parentElement.parentElement.remove()">閉じる</button>
        </div>
    `;
    
    const helpModal = document.createElement('div');
    helpModal.className = 'help-modal';
    helpModal.innerHTML = helpContent;
    
    document.body.appendChild(helpModal);
    
    // 3秒後に自動で閉じる
    setTimeout(() => {
        if (helpModal.parentElement) {
            helpModal.remove();
        }
    }, 10000);
}

/**
 * メッセージを閉じる
 */
function closeMessages() {
    const errorMessage = elements.errorMessage;
    const successMessage = elements.successMessage;
    const warningMessages = document.querySelectorAll('.warning-message');
    
    if (errorMessage && errorMessage.style.display !== 'none') {
        errorMessage.style.display = 'none';
    }
    if (successMessage && successMessage.style.display !== 'none') {
        successMessage.style.display = 'none';
    }
    warningMessages.forEach(msg => {
        if (msg.style.display !== 'none') {
            msg.style.display = 'none';
        }
    });
}
}

/**
 * ハイブリッド操作（マウス・タッチ両対応）の設定
 */
function setupHybridInteraction() {
    // ホバー効果をタッチデバイスでも適切に動作させる
    const interactiveElements = document.querySelectorAll('.btn, .option-label, .upload-area, .preview-box');
    
    interactiveElements.forEach(element => {
        // マウスイベント
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        // タッチイベント
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    });
}

/**
 * タブレット向けレイアウト調整
 */
function adjustTabletLayout() {
    // プレビューエリアの最適化
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        // タブレットでは常に横並び表示
        previewContainer.style.gridTemplateColumns = '1fr 1fr';
    }
    
    // オプションエリアの最適化
    const optionsContent = document.querySelector('.options-content');
    if (optionsContent) {
        // タブレットでは適度な間隔で表示
        optionsContent.style.gap = '18px';
    }
}

/**
 * タブレット向けキーボードショートカット
 */
function setupTabletKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd + O: ファイル選択
        if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
            event.preventDefault();
            elements.fileInput?.click();
        }
        
        // Ctrl/Cmd + Enter: 変換実行
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            const convertBtn = elements.convertBtn;
            if (convertBtn && !convertBtn.disabled) {
                convertBtn.click();
            }
        }
        
        // Ctrl/Cmd + S: ダウンロード
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            const downloadBtn = elements.downloadBtn;
            if (downloadBtn && !downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
        
        // Escape: エラーメッセージを閉じる
        if (event.key === 'Escape') {
            const errorMessage = elements.errorMessage;
            const successMessage = elements.successMessage;
            if (errorMessage && errorMessage.style.display !== 'none') {
                errorMessage.style.display = 'none';
            }
            if (successMessage && successMessage.style.display !== 'none') {
                successMessage.style.display = 'none';
            }
        }
    });
}

/**
 * マウスエンター処理
 */
function handleMouseEnter(event) {
    if (!isTouchDevice()) {
        event.currentTarget.classList.add('mouse-hover');
    }
}

/**
 * マウスリーブ処理
 */
function handleMouseLeave(event) {
    event.currentTarget.classList.remove('mouse-hover');
}

/**
 * タッチ操作の最適化
 */
function optimizeForTouch() {
    // タッチイベントの追加
    if (elements.uploadArea) {
        elements.uploadArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        elements.uploadArea.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    // スライダーのタッチ最適化
    if (elements.qualitySlider) {
        elements.qualitySlider.addEventListener('touchstart', () => {
            elements.qualitySlider.classList.add('touching');
        }, { passive: true });
        
        elements.qualitySlider.addEventListener('touchend', () => {
            elements.qualitySlider.classList.remove('touching');
        }, { passive: true });
    }
}

/**
 * タッチ開始の処理
 */
function handleTouchStart(event) {
    event.currentTarget.classList.add('touch-active');
}

/**
 * タッチ終了の処理
 */
function handleTouchEnd(event) {
    event.currentTarget.classList.remove('touch-active');
}

/**
 * 画面回転の処理
 */
function setupOrientationHandling() {
    // 画面回転の監視
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    // 初期レイアウト調整
    setTimeout(handleOrientationChange, 100);
}

/**
 * 画面回転時の処理
 */
function handleOrientationChange() {
    // 少し遅延してレイアウトを調整（回転アニメーション完了後）
    setTimeout(() => {
        adjustLayoutForOrientation();
        
        // プレビューエリアの再調整
        if (elements.originalPreview && elements.originalPreview.style.display !== 'none') {
            adjustPreviewLayout();
        }
    }, 300);
}

/**
 * リサイズ時の処理
 */
function handleResize() {
    // デバウンス処理
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        adjustLayoutForOrientation();
    }, 250);
}

/**
 * 画面向きに応じたレイアウト調整
 */
function adjustLayoutForOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth <= 767;
    const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1023;
    
    // デバイス・向きクラスの更新
    document.body.classList.toggle('landscape-mobile', isMobile && isLandscape);
    document.body.classList.toggle('portrait-mobile', isMobile && !isLandscape);
    document.body.classList.toggle('landscape-tablet', isTablet && isLandscape);
    document.body.classList.toggle('portrait-tablet', isTablet && !isLandscape);
    
    // プレビューコンテナのレイアウト調整
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        if (isMobile) {
            if (isLandscape) {
                previewContainer.style.gridTemplateColumns = '1fr 1fr';
            } else {
                previewContainer.style.gridTemplateColumns = '1fr';
            }
        } else if (isTablet) {
            // タブレットでは常に横並び
            previewContainer.style.gridTemplateColumns = '1fr 1fr';
        }
    }
    
    // タブレット向け追加調整
    if (isTablet) {
        adjustTabletSpecificLayout(isLandscape);
    }
}

/**
 * タブレット固有のレイアウト調整
 */
function adjustTabletSpecificLayout(isLandscape) {
    const optionsContent = document.querySelector('.options-content');
    const controls = document.querySelector('.controls');
    
    if (isLandscape) {
        // 横向きタブレット: よりコンパクトなレイアウト
        if (optionsContent) {
            optionsContent.style.gap = '16px';
        }
        if (controls) {
            controls.style.gap = '16px';
        }
    } else {
        // 縦向きタブレット: より余裕のあるレイアウト
        if (optionsContent) {
            optionsContent.style.gap = '20px';
        }
        if (controls) {
            controls.style.gap = '20px';
        }
    }
}

/**
 * プレビューレイアウトの調整
 */
function adjustPreviewLayout() {
    const previewContents = document.querySelectorAll('.preview-content');
    previewContents.forEach(content => {
        const img = content.querySelector('img, svg');
        if (img) {
            // 画像サイズを再計算
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        }
    });
}

/**
 * コンポーネントの動的読み込み
 */
async function loadComponents() {
    try {
        // FileHandlerの読み込み（既存のものを拡張）
        const { FileHandler } = await import('./file-handler.js');
        fileHandler = new FileHandler();
        
        // ImageConverterの読み込み（新規作成予定）
        const { ImageConverter } = await import('./converters/ImageConverter.js');
        imageConverter = new ImageConverter();
        
        // エラーハンドラーをImageConverterに設定
        imageConverter.setErrorHandler(errorHandler);
        
        // UIControllerの読み込み（既存のものを拡張）
        const { UIController } = await import('./ui-controller.js');
        uiController = new UIController();
        
        // BatchProcessorの読み込み
        const { BatchProcessor } = await import('./BatchProcessor.js');
        batchProcessor = new BatchProcessor(appState, imageConverter);
        
        // コンポーネント間の依存関係を設定
        uiController.initialize(fileHandler, imageConverter, appState);
        
        // セキュリティ機能をコンポーネントに統合
        integrateSecurityFeatures();
        
        // バッチモード切り替えUIを表示
        const batchModeToggle = document.getElementById('batchModeToggle');
        if (batchModeToggle) {
            batchModeToggle.style.display = 'block';
        }
        
        console.log('全てのコンポーネントが読み込まれました');
        
    } catch (error) {
        console.error('コンポーネントの読み込みに失敗しました:', error);
        
        // フォールバック: 既存のスクリプトを使用
        console.log('フォールバック: 既存のスクリプトを使用します');
        await loadLegacyScript();
    }
}

/**
 * 既存スクリプトのフォールバック読み込み
 */
async function loadLegacyScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'script.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 直感的UIコントローラーの初期化
 */
async function initializeIntuitiveUI() {
    try {
        console.log('直感的UIコントローラーを初期化中...');
        
        // 直感的UIコントローラーを初期化
        intuitiveUI = new IntuitiveUIController();
        
        // グローバルに公開
        window.intuitiveUI = intuitiveUI;
        
        console.log('直感的UIコントローラーの初期化が完了しました');
        
    } catch (error) {
        console.error('直感的UIコントローラーの初期化に失敗しました:', error);
        
        // エラーが発生しても基本機能は動作するように続行
        console.log('基本機能のみで続行します');
    }
}

/**
 * 基本的なイベントリスナーの設定
 */
function setupBasicEventListeners() {
    // ファイル選択ボタン
    elements.uploadBtn?.addEventListener('click', () => {
        elements.fileInput?.click();
    });
    
    // アップロードエリアのクリック
    elements.uploadArea?.addEventListener('click', (event) => {
        if (event.target !== elements.uploadBtn) {
            elements.fileInput?.click();
        }
    });
    
    // ファイル入力の変更
    elements.fileInput?.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            // バッチモードかどうかで処理を分岐
            if (appState?.get('batchMode') && batchProcessor) {
                batchProcessor.handleMultipleFileSelection(files);
            } else {
                handleFileSelection(files[0]);
            }
        }
    });
    
    // 変換先形式の変更
    elements.targetFormat?.addEventListener('change', (event) => {
        const format = event.target.value;
        appState?.setTargetFormat(format);
        updateFormatSpecificOptions(format);
    });
    
    // 品質スライダーの変更
    elements.qualitySlider?.addEventListener('input', (event) => {
        const quality = parseInt(event.target.value);
        elements.qualityValue.textContent = `${quality}%`;
        appState?.updateConversionOptions({ quality });
    });
    
    // 透明背景オプションの変更
    elements.transparentBgOption?.addEventListener('change', (event) => {
        const transparent = event.target.checked;
        appState?.updateConversionOptions({ transparentBackground: transparent });
        updateBackgroundColorVisibility(transparent);
    });
    
    // 背景色の変更
    elements.backgroundColor?.addEventListener('change', (event) => {
        const color = event.target.value;
        appState?.updateConversionOptions({ backgroundColor: color });
    });
    
    // 変換ボタンのイベントリスナー
    elements.convertBtn?.addEventListener('click', async () => {
        await handleConversion();
    });
    
    // ダウンロードボタンのイベントリスナー
    elements.downloadBtn?.addEventListener('click', () => {
        handleDownload();
    });
    
    // ドラッグ&ドロップの基本設定
    setupDragAndDrop();
}

/**
 * ドラッグ&ドロップの設定
 */
function setupDragAndDrop() {
    if (!elements.uploadArea) return;
    
    // ドラッグオーバー
    elements.uploadArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });
    
    // ドラッグリーブ
    elements.uploadArea.addEventListener('dragleave', (event) => {
        event.preventDefault();
        if (!elements.uploadArea.contains(event.relatedTarget)) {
            elements.uploadArea.classList.remove('dragover');
        }
    });
    
    // ドロップ
    elements.uploadArea.addEventListener('drop', (event) => {
        event.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            // バッチモードかどうかで処理を分岐
            if (appState?.get('batchMode') && batchProcessor) {
                batchProcessor.handleMultipleFileSelection(files);
            } else {
                handleFileSelection(files[0]);
            }
        }
    });
}

/**
 * 形式固有のオプション表示を更新
 * @param {string} format - 選択された形式
 */
function updateFormatSpecificOptions(format) {
    // 品質設定の表示/非表示
    const showQuality = format === SUPPORTED_FORMATS.JPG || 
                       format === SUPPORTED_FORMATS.JPEG || 
                       format === SUPPORTED_FORMATS.WEBP;
    
    if (elements.qualityGroup) {
        elements.qualityGroup.style.display = showQuality ? 'block' : 'none';
    }
    
    // 透明背景オプションの更新
    updateTransparencyOptions(format);
}

/**
 * 透明度オプションの更新
 * @param {string} format - 選択された形式
 */
function updateTransparencyOptions(format) {
    const supportsTransparency = format === SUPPORTED_FORMATS.PNG || 
                                format === SUPPORTED_FORMATS.WEBP || 
                                format === SUPPORTED_FORMATS.GIF ||
                                format === SUPPORTED_FORMATS.SVG;
    
    if (elements.transparentBgOption) {
        elements.transparentBgOption.disabled = !supportsTransparency;
        
        if (!supportsTransparency) {
            elements.transparentBgOption.checked = false;
            updateBackgroundColorVisibility(false);
        }
    }
}

/**
 * 背景色設定の表示/非表示を更新
 * @param {boolean} transparent - 透明背景が有効かどうか
 */
function updateBackgroundColorVisibility(transparent) {
    if (elements.backgroundColorGroup) {
        elements.backgroundColorGroup.style.display = transparent ? 'none' : 'block';
    }
}

/**
 * UIの初期化
 */
function initializeUI() {
    // ボタンの初期状態
    if (elements.convertBtn) elements.convertBtn.disabled = true;
    if (elements.downloadBtn) elements.downloadBtn.disabled = true;
    
    // プレビューエリアを非表示
    if (elements.originalPreview) elements.originalPreview.style.display = 'none';
    if (elements.convertedPreview) elements.convertedPreview.style.display = 'none';
    if (elements.fileInfo) elements.fileInfo.style.display = 'none';
    if (elements.conversionOptions) elements.conversionOptions.style.display = 'none';
    
    // 初期形式固有オプションの設定
    const initialFormat = elements.targetFormat?.value || SUPPORTED_FORMATS.PNG;
    updateFormatSpecificOptions(initialFormat);
    
    // 品質スライダーの初期値表示
    if (elements.qualityValue && elements.qualitySlider) {
        elements.qualityValue.textContent = `${elements.qualitySlider.value}%`;
    }
}

/**
 * ファイル選択の処理（基本版）
 * @param {File} file - 選択されたファイル
 */
async function handleFileSelection(file) {
    try {
        console.log('ファイルが選択されました:', file.name);
        
        // UIControllerが利用可能な場合はそちらに委譲
        if (uiController && typeof uiController.handleFileSelection === 'function') {
            await uiController.handleFileSelection(file);
            return;
        }
        
        // フォールバック処理
        showMessage('ファイルを読み込み中...', 'info');
        
        // 基本的な検証
        if (!file.type.startsWith('image/')) {
            throw new Error('画像ファイルを選択してください');
        }
        
        // ファイルサイズチェック（10MB制限）
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('ファイルサイズが大きすぎます（10MB以下にしてください）');
        }
        
        // ファイル情報の表示
        if (elements.fileName) elements.fileName.textContent = file.name;
        if (elements.fileSize) elements.fileSize.textContent = formatFileSize(file.size);
        if (elements.fileInfo) elements.fileInfo.style.display = 'block';
        if (elements.conversionOptions) elements.conversionOptions.style.display = 'block';
        
        // 現在のファイルを保存
        currentFile = file;
        
        // プレビューの表示
        await displayFilePreview(file);
        
        // 変換ボタンを有効化
        if (elements.convertBtn) {
            elements.convertBtn.disabled = false;
        }
        
        showMessage('ファイルが読み込まれました', 'success');
        
    } catch (error) {
        console.error('ファイル選択エラー:', error);
        showMessage(error.message, 'error');
    }
}

/**
 * メッセージ表示（基本版）
 * @param {string} message - メッセージ
 * @param {string} type - メッセージタイプ
 */
function showMessage(message, type = 'info') {
    const messageElement = type === 'error' ? elements.errorMessage : elements.successMessage;
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // 自動非表示
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

/**
 * 重大なエラーの表示
 * @param {string} title - エラータイトル
 * @param {string} message - エラーメッセージ
 * @param {string} suggestion - 解決提案
 */
function showCriticalError(title, message, suggestion) {
    const errorHtml = `
        <div style="background: #fee; border: 1px solid #fcc; padding: 20px; margin: 20px; border-radius: 8px;">
            <h3 style="color: #c00; margin: 0 0 10px 0;">${title}</h3>
            <p style="margin: 0 0 10px 0;">${message}</p>
            <p style="margin: 0; font-style: italic; color: #666;">${suggestion}</p>
        </div>
    `;
    
    const container = document.querySelector('.container main');
    if (container) {
        container.innerHTML = errorHtml;
    }
}

/**
 * ファイルサイズのフォーマット（基本版）
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたサイズ
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ファイルプレビューの表示
 * @param {File} file - プレビューするファイル
 */
async function displayFilePreview(file) {
    try {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                const result = e.target.result;
                
                // プレビュー要素を取得
                const originalPreview = elements.originalPreview;
                const originalPreviewContent = elements.originalPreviewContent;
                
                if (!originalPreview || !originalPreviewContent) {
                    resolve();
                    return;
                }
                
                // プレビュー内容をクリア
                originalPreviewContent.innerHTML = '';
                
                if (file.type.startsWith('image/svg')) {
                    // SVGファイルの場合
                    const svgContainer = document.createElement('div');
                    svgContainer.innerHTML = result;
                    svgContainer.style.cssText = `
                        max-width: 100%;
                        max-height: 300px;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        background: #f9f9f9;
                    `;
                    
                    const svgElement = svgContainer.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.cssText = `
                            max-width: 100%;
                            max-height: 100%;
                            width: auto;
                            height: auto;
                        `;
                    }
                    
                    originalPreviewContent.appendChild(svgContainer);
                } else {
                    // その他の画像ファイルの場合
                    const img = document.createElement('img');
                    img.src = result;
                    img.style.cssText = `
                        max-width: 100%;
                        max-height: 300px;
                        width: auto;
                        height: auto;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    `;
                    
                    img.onerror = () => {
                        originalPreviewContent.innerHTML = `
                            <div style="padding: 20px; text-align: center; color: #666; border: 1px solid #ddd; border-radius: 4px;">
                                プレビューを表示できません
                            </div>
                        `;
                    };
                    
                    originalPreviewContent.appendChild(img);
                }
                
                // プレビューエリアを表示
                originalPreview.style.display = 'block';
                
                resolve();
            };
            
            reader.onerror = () => {
                console.error('ファイル読み込みエラー');
                reject(new Error('ファイルを読み込めませんでした'));
            };
            
            // ファイルタイプに応じて読み込み方法を変更
            if (file.type.startsWith('image/svg')) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
        
    } catch (error) {
        console.error('プレビュー表示エラー:', error);
        // エラーが発生してもプレビューなしで続行
    }
}

// グローバル変数として現在のファイルと変換結果を保持
let currentFile = null;
let convertedBlob = null;

/**
 * セキュリティ機能の統合
 */
function integrateSecurityFeatures() {
    try {
        console.log('セキュリティ機能を統合中...');
        
        // FileHandlerにデータクリーンアップ管理を設定
        if (fileHandler && dataCleanupManager) {
            fileHandler.dataCleanupManager = dataCleanupManager;
        }
        
        // 変換完了時のクリーンアップを設定
        if (appState) {
            appState.addEventListener('conversionComplete', (event) => {
                // 変換完了後にクリーンアップを実行
                setTimeout(() => {
                    if (dataCleanupManager) {
                        dataCleanupManager.performPartialCleanup();
                    }
                }, 1000);
            });
        }
        
        // ファイル変更時のクリーンアップを設定
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', () => {
                // 新しいファイル選択時に前のデータをクリーンアップ
                if (dataCleanupManager) {
                    dataCleanupManager.performPartialCleanup();
                }
            });
        }
        
        // グローバルエラーハンドラーでクリーンアップを実行
        window.addEventListener('error', (event) => {
            console.error('グローバルエラー:', event.error);
            if (dataCleanupManager) {
                dataCleanupManager.performEmergencyCleanup();
            }
        });
        
        // 未処理のPromise拒否でクリーンアップを実行
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未処理のPromise拒否:', event.reason);
            if (dataCleanupManager) {
                dataCleanupManager.performEmergencyCleanup();
            }
        });
        
        console.log('✓ セキュリティ機能の統合が完了しました');
        
    } catch (error) {
        console.error('セキュリティ機能の統合に失敗:', error);
    }
}

/**
 * アプリケーション終了時のクリーンアップ
 */
function performApplicationCleanup() {
    console.log('アプリケーション終了時のクリーンアップを実行中...');
    
    try {
        // データクリーンアップ管理の終了
        if (dataCleanupManager) {
            dataCleanupManager.destroy();
        }
        
        // セキュアデータハンドラーの終了
        if (secureDataHandler) {
            secureDataHandler.destroy();
        }
        
        // プライバシー管理の終了
        if (privacyManager) {
            privacyManager.performDataCleanup();
        }
        
        console.log('✓ アプリケーション終了時のクリーンアップが完了しました');
        
    } catch (error) {
        console.error('アプリケーション終了時のクリーンアップエラー:', error);
    }
}

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', performApplicationCleanup);

// DOMContentLoadedイベントでアプリケーションを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// エクスポート（デバッグ用）
window.multiFormatConverter = {
    appState,
    fileHandler,
    imageConverter,
    uiController,
    batchProcessor,
    privacyManager,
    dataCleanupManager,
    secureDataHandler,
    elements
};
/**
 
* パフォーマンス監視のイベントリスナー設定
 */
function setupPerformanceEventListeners() {
    // メモリ警告の処理
    window.addEventListener('performance-memory-warning', (event) => {
        const { usage, limit, percentage } = event.detail;
        showWarning(
            `メモリ使用量が高くなっています (${percentage}%)。処理速度が低下する可能性があります。`,
            8000
        );
        console.warn('Memory warning:', event.detail);
    });
    
    // メモリ制限の処理
    window.addEventListener('performance-memory-limit', (event) => {
        const { usage, limit } = event.detail;
        showError(
            'メモリ制限に達しました。他のタブを閉じるか、より小さなファイルを使用してください。',
            0 // 手動で閉じるまで表示
        );
        console.error('Memory limit reached:', event.detail);
        
        // 自動的にメモリクリーンアップを実行
        performanceMonitor.performAggressiveMemoryCleanup();
    });
    
    // パフォーマンス警告の処理
    window.addEventListener('performance-performance-warning', (event) => {
        const { type, value, limit } = event.detail;
        
        switch (type) {
            case 'processing-time':
                showWarning(
                    `処理時間が長くなっています (${Math.round(value/1000)}秒)。しばらくお待ちください。`,
                    5000
                );
                break;
            case 'memory-delta':
                showWarning(
                    'メモリ使用量が急激に増加しています。処理を続行しますが、注意してください。',
                    5000
                );
                break;
        }
    });
    
    // 操作タイムアウトの処理
    window.addEventListener('performance-operation-timeout', (event) => {
        const { operationId, timeout, duration } = event.detail;
        showError(
            `操作がタイムアウトしました (${Math.round(timeout/1000)}秒)。より小さなファイルを試すか、設定を調整してください。`,
            0
        );
        console.error('Operation timeout:', event.detail);
    });
}

/**
 * エラーメッセージを表示
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間（0で手動まで）
 */
function showError(message, duration = 5000) {
    const errorElement = elements.errorMessage;
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, duration);
    }
}

/**
 * 警告メッセージを表示
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
function showWarning(message, duration = 5000) {
    // 警告用の要素がない場合は作成
    let warningElement = document.getElementById('warningMessage');
    if (!warningElement) {
        warningElement = document.createElement('div');
        warningElement.id = 'warningMessage';
        warningElement.className = 'message warning-message';
        warningElement.style.cssText = `
            display: none;
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
            position: relative;
        `;
        
        // エラーメッセージの後に挿入
        const errorElement = elements.errorMessage;
        if (errorElement && errorElement.parentNode) {
            errorElement.parentNode.insertBefore(warningElement, errorElement.nextSibling);
        } else {
            document.body.appendChild(warningElement);
        }
    }
    
    warningElement.textContent = message;
    warningElement.style.display = 'block';
    
    setTimeout(() => {
        warningElement.style.display = 'none';
    }, duration);
}

/**
 * 情報メッセージを表示
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
function showInfo(message, duration = 3000) {
    // 情報用の要素がない場合は作成
    let infoElement = document.getElementById('infoMessage');
    if (!infoElement) {
        infoElement = document.createElement('div');
        infoElement.id = 'infoMessage';
        infoElement.className = 'message info-message';
        infoElement.style.cssText = `
            display: none;
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
            position: relative;
        `;
        
        // エラーメッセージの後に挿入
        const errorElement = elements.errorMessage;
        if (errorElement && errorElement.parentNode) {
            errorElement.parentNode.insertBefore(infoElement, errorElement.nextSibling);
        } else {
            document.body.appendChild(infoElement);
        }
    }
    
    infoElement.textContent = message;
    infoElement.style.display = 'block';
    
    setTimeout(() => {
        infoElement.style.display = 'none';
    }, duration);
}

/**
 * 成功メッセージを表示
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
function showSuccess(message, duration = 3000) {
    const successElement = elements.successMessage;
    if (!successElement) return;
    
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    setTimeout(() => {
        successElement.style.display = 'none';
    }, duration);
}

/**
 * パフォーマンス統計を表示（デバッグ用）
 */
function showPerformanceStats() {
    if (!performanceMonitor) return;
    
    const stats = performanceMonitor.getPerformanceStats();
    console.log('Performance Statistics:', stats);
    
    // 開発者向けの統計表示
    if (window.location.search.includes('debug=true')) {
        const statsElement = document.getElementById('performanceStats') || createPerformanceStatsElement();
        statsElement.innerHTML = `
            <h4>パフォーマンス統計</h4>
            <div>総変換数: ${stats.totalConversions}</div>
            <div>平均処理時間: ${stats.averageProcessingTime}ms</div>
            <div>平均メモリ使用量: ${(stats.averageMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
            <div>成功率: ${stats.successRate}%</div>
            <div>現在のメモリ使用量: ${(stats.currentMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
            <div>メモリ使用率: ${stats.memoryUtilization}%</div>
            <div>実行中の操作: ${stats.activeOperations}</div>
        `;
        statsElement.style.display = 'block';
    }
}

/**
 * パフォーマンス統計表示要素を作成
 */
function createPerformanceStatsElement() {
    const element = document.createElement('div');
    element.id = 'performanceStats';
    element.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
        display: none;
    `;
    document.body.appendChild(element);
    return element;
}

/**
 * アプリケーション終了時のクリーンアップ
 */
function cleanup() {
    // パフォーマンス監視を停止
    if (performanceMonitor) {
        performanceMonitor.stop();
    }
    
    // ImageConverterのクリーンアップ
    if (imageConverter && typeof imageConverter.cleanup === 'function') {
        imageConverter.cleanup();
    }
    
    // データクリーンアップ
    if (dataCleanupManager) {
        dataCleanupManager.performFinalCleanup();
    }
    
    console.log('Application cleanup completed');
}

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

// デバッグ用のグローバル関数
if (window.location.search.includes('debug=true')) {
    window.showPerformanceStats = showPerformanceStats;
    window.performanceMonitor = performanceMonitor;
    window.errorHandler = errorHandler;
    
    // 5秒ごとに統計を更新
    setInterval(showPerformanceStats, 5000);
}/**

 * 変換処理の実行
 */
async function handleConversion() {
    try {
        if (!currentFile) {
            throw new Error('変換するファイルが選択されていません');
        }
        
        showMessage('変換中...', 'info');
        
        // 変換ボタンを無効化
        if (elements.convertBtn) {
            elements.convertBtn.disabled = true;
        }
        
        // 変換先形式を取得
        const targetFormat = elements.targetFormat?.value || 'png';
        
        // 基本的な変換処理
        convertedBlob = await convertImage(currentFile, targetFormat);
        
        // 変換後プレビューの表示
        await displayConvertedPreview(convertedBlob, targetFormat);
        
        // ダウンロードボタンを有効化
        if (elements.downloadBtn) {
            elements.downloadBtn.disabled = false;
        }
        
        showMessage('変換が完了しました', 'success');
        
    } catch (error) {
        console.error('変換エラー:', error);
        showMessage(error.message, 'error');
    } finally {
        // 変換ボタンを再有効化
        if (elements.convertBtn) {
            elements.convertBtn.disabled = false;
        }
    }
}

/**
 * 基本的な画像変換
 * @param {File} file - 変換するファイル
 * @param {string} targetFormat - 変換先形式
 * @returns {Promise<Blob>} 変換されたBlob
 */
async function convertImage(file, targetFormat) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (file.type.startsWith('image/svg')) {
            // SVGの変換
            const reader = new FileReader();
            reader.onload = (e) => {
                const svgData = e.target.result;
                const img = new Image();
                
                img.onload = () => {
                    canvas.width = img.width || 300;
                    canvas.height = img.height || 300;
                    
                    // 背景色の設定（JPGの場合）
                    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                        const bgColor = elements.backgroundColor?.value || '#ffffff';
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const mimeType = getMimeType(targetFormat);
                    const quality = targetFormat === 'jpg' || targetFormat === 'webp' ? 
                        (parseInt(elements.qualitySlider?.value || '90') / 100) : undefined;
                    
                    canvas.toBlob(resolve, mimeType, quality);
                };
                
                img.onerror = () => reject(new Error('SVG画像の読み込みに失敗しました'));
                
                // SVGをData URLとして設定
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svgBlob);
                img.src = url;
            };
            
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
            
        } else {
            // その他の画像形式の変換
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // 背景色の設定（JPGの場合）
                    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                        const bgColor = elements.backgroundColor?.value || '#ffffff';
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const mimeType = getMimeType(targetFormat);
                    const quality = targetFormat === 'jpg' || targetFormat === 'webp' ? 
                        (parseInt(elements.qualitySlider?.value || '90') / 100) : undefined;
                    
                    canvas.toBlob(resolve, mimeType, quality);
                };
                
                img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsDataURL(file);
        }
    });
}

/**
 * MIMEタイプの取得
 * @param {string} format - 形式
 * @returns {string} MIMEタイプ
 */
function getMimeType(format) {
    const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'gif': 'image/gif'
    };
    return mimeTypes[format] || 'image/png';
}

/**
 * 変換後プレビューの表示
 * @param {Blob} blob - 変換されたBlob
 * @param {string} format - 形式
 */
async function displayConvertedPreview(blob, format) {
    const convertedPreview = elements.convertedPreview;
    const convertedPreviewContent = elements.convertedPreviewContent;
    
    if (!convertedPreview || !convertedPreviewContent) return;
    
    // プレビュー内容をクリア
    convertedPreviewContent.innerHTML = '';
    
    // 画像要素を作成
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    img.style.cssText = `
        max-width: 100%;
        max-height: 300px;
        width: auto;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
    `;
    
    convertedPreviewContent.appendChild(img);
    
    // プレビューエリアを表示
    convertedPreview.style.display = 'block';
    
    // ファイル情報を表示
    const fileInfo = document.createElement('div');
    fileInfo.style.cssText = 'margin-top: 10px; font-size: 14px; color: #666;';
    fileInfo.innerHTML = `
        <div>形式: ${format.toUpperCase()}</div>
        <div>サイズ: ${formatFileSize(blob.size)}</div>
    `;
    convertedPreviewContent.appendChild(fileInfo);
}

/**
 * ダウンロード処理
 */
function handleDownload() {
    if (!convertedBlob || !currentFile) {
        showMessage('ダウンロードするファイルがありません', 'error');
        return;
    }
    
    try {
        const targetFormat = elements.targetFormat?.value || 'png';
        const originalName = currentFile.name.split('.')[0];
        const fileName = `${originalName}.${targetFormat}`;
        
        // ダウンロードリンクを作成
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // URLを解放
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        showMessage('ダウンロードを開始しました', 'success');
        
    } catch (error) {
        console.error('ダウンロードエラー:', error);
        showMessage('ダウンロードに失敗しました', 'error');
    }
}/*
*
 * 形式固有のオプション表示を更新
 * @param {string} format - 選択された形式
 */
function updateFormatSpecificOptions(format) {
    const qualityGroup = elements.qualityGroup;
    const backgroundColorGroup = elements.backgroundColorGroup;
    
    // 品質設定の表示/非表示
    if (qualityGroup) {
        if (format === 'jpg' || format === 'jpeg' || format === 'webp') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }
    }
    
    // 背景色設定の表示/非表示
    if (backgroundColorGroup) {
        if (format === 'jpg' || format === 'jpeg') {
            backgroundColorGroup.style.display = 'block';
            // 透明背景オプションを無効化
            if (elements.transparentBgOption) {
                elements.transparentBgOption.checked = false;
                elements.transparentBgOption.disabled = true;
            }
        } else {
            backgroundColorGroup.style.display = 'none';
            // 透明背景オプションを有効化
            if (elements.transparentBgOption) {
                elements.transparentBgOption.disabled = false;
                elements.transparentBgOption.checked = true;
            }
        }
    }
}

/**
 * 背景色表示の更新
 * @param {boolean} transparent - 透明背景かどうか
 */
function updateBackgroundColorVisibility(transparent) {
    const backgroundColorGroup = elements.backgroundColorGroup;
    const targetFormat = elements.targetFormat?.value || 'png';
    
    if (backgroundColorGroup) {
        // JPEGの場合は常に背景色を表示
        if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            backgroundColorGroup.style.display = 'block';
        } else {
            // その他の形式では透明背景でない場合のみ表示
            backgroundColorGroup.style.display = transparent ? 'none' : 'block';
        }
    }
}