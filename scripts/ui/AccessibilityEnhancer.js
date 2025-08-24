// アクセシビリティ強化機能

/**
 * アクセシビリティ強化クラス
 * WCAG 2.1ガイドラインに基づいたアクセシビリティ機能を提供
 */
export class AccessibilityEnhancer {
    constructor() {
        this.isInitialized = false;
        this.focusTracker = null;
        this.announcer = null;
        this.keyboardNavigation = null;
        this.preferences = {
            reducedMotion: false,
            highContrast: false,
            largeText: false,
            screenReader: false
        };
        
        this.init();
    }
    
    /**
     * アクセシビリティ機能を初期化
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('♿ アクセシビリティ機能を初期化中...');
        
        try {
            // ユーザー設定の検出
            this.detectUserPreferences();
            
            // スクリーンリーダー対応
            this.setupScreenReaderSupport();
            
            // キーボードナビゲーション強化
            this.enhanceKeyboardNavigation();
            
            // フォーカス管理
            this.setupFocusManagement();
            
            // ARIA属性の動的設定
            this.setupDynamicARIA();
            
            // 色・コントラスト対応
            this.setupColorAccessibility();
            
            // モーション設定対応
            this.setupMotionPreferences();
            
            // アクセシビリティショートカット
            this.setupAccessibilityShortcuts();
            
            this.isInitialized = true;
            console.log('♿ アクセシビリティ機能の初期化が完了しました');
            
        } catch (error) {
            console.error('♿ アクセシビリティ機能の初期化に失敗しました:', error);
        }
    }
    
    /**
     * ユーザー設定の検出
     */
    detectUserPreferences() {
        // prefers-reduced-motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.preferences.reducedMotion = true;
            document.body.classList.add('reduced-motion');
            console.log('♿ モーション軽減設定を検出しました');
        }
        
        // prefers-contrast
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            this.preferences.highContrast = true;
            document.body.classList.add('high-contrast');
            console.log('♿ 高コントラスト設定を検出しました');
        }
        
        // スクリーンリーダーの検出（簡易版）
        if (navigator.userAgent.includes('NVDA') || 
            navigator.userAgent.includes('JAWS') || 
            navigator.userAgent.includes('VoiceOver')) {
            this.preferences.screenReader = true;
            document.body.classList.add('screen-reader');
            console.log('♿ スクリーンリーダーを検出しました');
        }
        
        // 設定変更の監視
        this.watchPreferenceChanges();
    }
    
    /**
     * 設定変更の監視
     */
    watchPreferenceChanges() {
        // モーション設定の変更監視
        if (window.matchMedia) {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            motionQuery.addEventListener('change', (e) => {
                this.preferences.reducedMotion = e.matches;
                document.body.classList.toggle('reduced-motion', e.matches);
                this.announceToScreenReader(
                    e.matches ? 'モーション軽減が有効になりました' : 'モーション軽減が無効になりました'
                );
            });
            
            // コントラスト設定の変更監視
            const contrastQuery = window.matchMedia('(prefers-contrast: high)');
            contrastQuery.addEventListener('change', (e) => {
                this.preferences.highContrast = e.matches;
                document.body.classList.toggle('high-contrast', e.matches);
                this.announceToScreenReader(
                    e.matches ? '高コントラストが有効になりました' : '高コントラストが無効になりました'
                );
            });
        }
    }
    
    /**
     * スクリーンリーダー対応の設定
     */
    setupScreenReaderSupport() {
        // ライブリージョンの作成
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only';
        this.announcer.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        document.body.appendChild(this.announcer);
        
        // 緊急アナウンス用のライブリージョン
        this.urgentAnnouncer = document.createElement('div');
        this.urgentAnnouncer.setAttribute('aria-live', 'assertive');
        this.urgentAnnouncer.setAttribute('aria-atomic', 'true');
        this.urgentAnnouncer.className = 'sr-only';
        this.urgentAnnouncer.style.cssText = this.announcer.style.cssText;
        document.body.appendChild(this.urgentAnnouncer);
        
        // 既存要素のARIA属性を強化
        this.enhanceExistingElements();
    }
    
    /**
     * 既存要素のARIA属性強化
     */
    enhanceExistingElements() {
        // ボタンの強化
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-describedby])');
        buttons.forEach((button, index) => {
            const text = button.textContent.trim();
            if (!text) {
                button.setAttribute('aria-label', `ボタン ${index + 1}`);
            }
        });
        
        // 入力要素の強化
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-describedby])');
        inputs.forEach((input, index) => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (!label && !input.getAttribute('aria-label')) {
                const type = input.type || 'text';
                input.setAttribute('aria-label', `${type}入力フィールド ${index + 1}`);
            }
        });
        
        // 画像の強化
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach((img, index) => {
            img.setAttribute('alt', `画像 ${index + 1}`);
        });
        
        // リンクの強化
        const links = document.querySelectorAll('a:not([aria-label])');
        links.forEach((link, index) => {
            const text = link.textContent.trim();
            if (!text) {
                link.setAttribute('aria-label', `リンク ${index + 1}`);
            } else if (text.length < 3) {
                link.setAttribute('aria-label', `${text} リンク`);
            }
        });
    }
    
    /**
     * キーボードナビゲーションの強化
     */
    enhanceKeyboardNavigation() {
        // フォーカス可能要素の管理
        this.keyboardNavigation = {
            focusableElements: [],
            currentIndex: -1,
            trapFocus: false,
            trapContainer: null
        };
        
        // キーボードイベントリスナー
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardNavigation(event);
        });
        
        // フォーカス可能要素の更新
        this.updateFocusableElements();
        
        // DOM変更の監視
        const observer = new MutationObserver(() => {
            this.updateFocusableElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['tabindex', 'disabled', 'aria-hidden']
        });
    }
    
    /**
     * フォーカス可能要素の更新
     */
    updateFocusableElements() {
        const selector = `
            button:not([disabled]):not([aria-hidden="true"]),
            input:not([disabled]):not([aria-hidden="true"]),
            select:not([disabled]):not([aria-hidden="true"]),
            textarea:not([disabled]):not([aria-hidden="true"]),
            a[href]:not([aria-hidden="true"]),
            [tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])
        `;
        
        this.keyboardNavigation.focusableElements = Array.from(
            document.querySelectorAll(selector)
        ).filter(element => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && 
                   style.visibility !== 'hidden' && 
                   style.display !== 'none';
        });
    }
    
    /**
     * キーボードナビゲーションの処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyboardNavigation(event) {
        // Escキー: フォーカストラップの解除
        if (event.key === 'Escape') {
            if (this.keyboardNavigation.trapFocus) {
                this.releaseFocusTrap();
                event.preventDefault();
            }
        }
        
        // F6キー: メインコンテンツへのスキップ
        if (event.key === 'F6') {
            this.skipToMainContent();
            event.preventDefault();
        }
        
        // Alt + 1-9: ランドマークナビゲーション
        if (event.altKey && /^[1-9]$/.test(event.key)) {
            this.navigateToLandmark(parseInt(event.key));
            event.preventDefault();
        }
        
        // Ctrl + /: ヘルプの表示
        if (event.ctrlKey && event.key === '/') {
            this.showAccessibilityHelp();
            event.preventDefault();
        }
    }
    
    /**
     * フォーカス管理の設定
     */
    setupFocusManagement() {
        this.focusTracker = {
            lastFocusedElement: null,
            focusHistory: [],
            skipLinks: []
        };
        
        // フォーカスの追跡
        document.addEventListener('focusin', (event) => {
            this.focusTracker.lastFocusedElement = event.target;
            this.focusTracker.focusHistory.push(event.target);
            
            // 履歴の制限
            if (this.focusTracker.focusHistory.length > 10) {
                this.focusTracker.focusHistory.shift();
            }
            
            // フォーカス表示の強化
            this.enhanceFocusVisibility(event.target);
        });
        
        // スキップリンクの作成
        this.createSkipLinks();
    }
    
    /**
     * スキップリンクの作成
     */
    createSkipLinks() {
        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.setAttribute('aria-label', 'スキップリンク');
        
        const skipLinks = [
            { text: 'メインコンテンツへスキップ', target: 'main, [role="main"], #main' },
            { text: 'ナビゲーションへスキップ', target: 'nav, [role="navigation"]' },
            { text: 'フッターへスキップ', target: 'footer, [role="contentinfo"]' }
        ];
        
        skipLinks.forEach((linkInfo, index) => {
            const target = document.querySelector(linkInfo.target);
            if (target) {
                const skipLink = document.createElement('a');
                skipLink.href = '#';
                skipLink.textContent = linkInfo.text;
                skipLink.className = 'skip-link';
                skipLink.setAttribute('aria-describedby', `skip-desc-${index}`);
                
                // 説明要素
                const description = document.createElement('span');
                description.id = `skip-desc-${index}`;
                description.className = 'sr-only';
                description.textContent = `${linkInfo.text}のショートカット`;
                
                skipLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    target.focus();
                    if (!target.hasAttribute('tabindex')) {
                        target.setAttribute('tabindex', '-1');
                    }
                    this.announceToScreenReader(`${linkInfo.text}しました`);
                });
                
                skipLinksContainer.appendChild(skipLink);
                skipLinksContainer.appendChild(description);
                this.focusTracker.skipLinks.push(skipLink);
            }
        });
        
        // スキップリンクのスタイル
        const style = document.createElement('style');
        style.textContent = `
            .skip-links {
                position: absolute;
                top: -40px;
                left: 6px;
                z-index: 10000;
            }
            
            .skip-link {
                position: absolute;
                left: -10000px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
                background: #000;
                color: #fff;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .skip-link:focus {
                position: static;
                width: auto;
                height: auto;
                left: auto;
                top: auto;
            }
        `;
        
        document.head.appendChild(style);
        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    }
    
    /**
     * フォーカス表示の強化
     * @param {Element} element - フォーカスされた要素
     */
    enhanceFocusVisibility(element) {
        // カスタムフォーカススタイルの適用
        element.classList.add('enhanced-focus');
        
        // フォーカス解除時にクラスを削除
        const removeFocus = () => {
            element.classList.remove('enhanced-focus');
            element.removeEventListener('blur', removeFocus);
        };
        
        element.addEventListener('blur', removeFocus);
    }
    
    /**
     * 動的ARIA属性の設定
     */
    setupDynamicARIA() {
        // 状態変更の監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    this.updateARIAForElement(mutation.target);
                } else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.updateARIAForElement(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'hidden', 'aria-expanded', 'aria-selected']
        });
        
        // 初期設定
        this.updateARIAForAllElements();
    }
    
    /**
     * 全要素のARIA属性更新
     */
    updateARIAForAllElements() {
        // ボタンの状態
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => this.updateARIAForElement(button));
        
        // 入力要素の状態
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => this.updateARIAForElement(input));
        
        // リンクの状態
        const links = document.querySelectorAll('a');
        links.forEach(link => this.updateARIAForElement(link));
    }
    
    /**
     * 要素のARIA属性更新
     * @param {Element} element - 更新する要素
     */
    updateARIAForElement(element) {
        // 無効状態の更新
        if (element.disabled) {
            element.setAttribute('aria-disabled', 'true');
        } else {
            element.removeAttribute('aria-disabled');
        }
        
        // 非表示状態の更新
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            element.setAttribute('aria-hidden', 'true');
        } else {
            element.removeAttribute('aria-hidden');
        }
        
        // 展開状態の更新（ドロップダウンなど）
        if (element.classList.contains('expanded') || element.classList.contains('open')) {
            element.setAttribute('aria-expanded', 'true');
        } else if (element.classList.contains('collapsed') || element.classList.contains('closed')) {
            element.setAttribute('aria-expanded', 'false');
        }
    }
    
    /**
     * 色・コントラスト対応の設定
     */
    setupColorAccessibility() {
        // 高コントラストモードの切り替え
        const toggleHighContrast = () => {
            this.preferences.highContrast = !this.preferences.highContrast;
            document.body.classList.toggle('high-contrast', this.preferences.highContrast);
            
            const message = this.preferences.highContrast ? 
                '高コントラストモードを有効にしました' : 
                '高コントラストモードを無効にしました';
            this.announceToScreenReader(message);
        };
        
        // 大きなテキストモードの切り替え
        const toggleLargeText = () => {
            this.preferences.largeText = !this.preferences.largeText;
            document.body.classList.toggle('large-text', this.preferences.largeText);
            
            const message = this.preferences.largeText ? 
                '大きなテキストモードを有効にしました' : 
                '大きなテキストモードを無効にしました';
            this.announceToScreenReader(message);
        };
        
        // ショートカットキーの設定
        document.addEventListener('keydown', (event) => {
            // Ctrl + Alt + C: 高コントラスト切り替え
            if (event.ctrlKey && event.altKey && event.key === 'c') {
                toggleHighContrast();
                event.preventDefault();
            }
            
            // Ctrl + Alt + T: 大きなテキスト切り替え
            if (event.ctrlKey && event.altKey && event.key === 't') {
                toggleLargeText();
                event.preventDefault();
            }
        });
        
        // CSSカスタムプロパティの設定
        this.setupAccessibilityCSS();
    }
    
    /**
     * アクセシビリティ用CSSの設定
     */
    setupAccessibilityCSS() {
        const style = document.createElement('style');
        style.id = 'accessibility-enhancements';
        style.textContent = `
            /* 高コントラストモード */
            .high-contrast {
                --bg-color: #000000;
                --text-color: #ffffff;
                --link-color: #ffff00;
                --button-bg: #ffffff;
                --button-text: #000000;
                --border-color: #ffffff;
            }
            
            .high-contrast * {
                background-color: var(--bg-color) !important;
                color: var(--text-color) !important;
                border-color: var(--border-color) !important;
            }
            
            .high-contrast a {
                color: var(--link-color) !important;
            }
            
            .high-contrast button {
                background-color: var(--button-bg) !important;
                color: var(--button-text) !important;
            }
            
            /* 大きなテキストモード */
            .large-text {
                font-size: 120% !important;
            }
            
            .large-text * {
                font-size: inherit !important;
            }
            
            /* モーション軽減 */
            .reduced-motion *,
            .reduced-motion *::before,
            .reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
            
            /* フォーカス強化 */
            .enhanced-focus {
                outline: 3px solid #005fcc !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 5px rgba(0, 95, 204, 0.3) !important;
            }
            
            /* スクリーンリーダー専用 */
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * モーション設定対応の設定
     */
    setupMotionPreferences() {
        // アニメーション要素の監視
        const animatedElements = document.querySelectorAll('[style*="animation"], [style*="transition"]');
        
        if (this.preferences.reducedMotion) {
            this.disableAnimations();
        }
        
        // 動的に追加される要素の監視
        const observer = new MutationObserver((mutations) => {
            if (this.preferences.reducedMotion) {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.disableAnimationsForElement(node);
                        }
                    });
                });
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * アニメーションの無効化
     */
    disableAnimations() {
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            this.disableAnimationsForElement(element);
        });
    }
    
    /**
     * 要素のアニメーション無効化
     * @param {Element} element - 対象要素
     */
    disableAnimationsForElement(element) {
        const style = element.style;
        if (style.animation || style.transition) {
            style.animationDuration = '0.01ms';
            style.animationIterationCount = '1';
            style.transitionDuration = '0.01ms';
        }
    }
    
    /**
     * アクセシビリティショートカットの設定
     */
    setupAccessibilityShortcuts() {
        const shortcuts = {
            'Alt+1': () => this.navigateToLandmark(1),
            'Alt+2': () => this.navigateToLandmark(2),
            'Alt+3': () => this.navigateToLandmark(3),
            'F6': () => this.skipToMainContent(),
            'Ctrl+Alt+H': () => this.showAccessibilityHelp(),
            'Ctrl+Alt+C': () => this.toggleHighContrast(),
            'Ctrl+Alt+T': () => this.toggleLargeText()
        };
        
        // ショートカットヘルプの表示
        this.createShortcutHelp(shortcuts);
    }
    
    /**
     * ショートカットヘルプの作成
     * @param {Object} shortcuts - ショートカット一覧
     */
    createShortcutHelp(shortcuts) {
        const helpButton = document.createElement('button');
        helpButton.textContent = '♿ アクセシビリティヘルプ';
        helpButton.className = 'accessibility-help-button';
        helpButton.setAttribute('aria-label', 'アクセシビリティ機能のヘルプを表示');
        helpButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #005fcc;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        `;
        
        helpButton.addEventListener('click', () => {
            this.showAccessibilityHelp();
        });
        
        document.body.appendChild(helpButton);
    }
    
    /**
     * ランドマークナビゲーション
     * @param {number} landmarkNumber - ランドマーク番号
     */
    navigateToLandmark(landmarkNumber) {
        const landmarks = [
            'header, [role="banner"]',
            'nav, [role="navigation"]',
            'main, [role="main"]',
            'aside, [role="complementary"]',
            'footer, [role="contentinfo"]'
        ];
        
        if (landmarkNumber > 0 && landmarkNumber <= landmarks.length) {
            const landmark = document.querySelector(landmarks[landmarkNumber - 1]);
            if (landmark) {
                landmark.focus();
                if (!landmark.hasAttribute('tabindex')) {
                    landmark.setAttribute('tabindex', '-1');
                }
                
                const landmarkNames = ['ヘッダー', 'ナビゲーション', 'メインコンテンツ', 'サイドバー', 'フッター'];
                this.announceToScreenReader(`${landmarkNames[landmarkNumber - 1]}に移動しました`);
            }
        }
    }
    
    /**
     * メインコンテンツへのスキップ
     */
    skipToMainContent() {
        const main = document.querySelector('main, [role="main"], #main');
        if (main) {
            main.focus();
            if (!main.hasAttribute('tabindex')) {
                main.setAttribute('tabindex', '-1');
            }
            this.announceToScreenReader('メインコンテンツに移動しました');
        }
    }
    
    /**
     * アクセシビリティヘルプの表示
     */
    showAccessibilityHelp() {
        const helpContent = `
            <div class="accessibility-help-modal">
                <div class="help-content">
                    <h2>♿ アクセシビリティ機能</h2>
                    
                    <section>
                        <h3>🎹 キーボードショートカット</h3>
                        <ul>
                            <li><kbd>F6</kbd> - メインコンテンツへスキップ</li>
                            <li><kbd>Alt + 1-5</kbd> - ランドマークナビゲーション</li>
                            <li><kbd>Ctrl + Alt + C</kbd> - 高コントラスト切り替え</li>
                            <li><kbd>Ctrl + Alt + T</kbd> - 大きなテキスト切り替え</li>
                            <li><kbd>Ctrl + Alt + H</kbd> - このヘルプを表示</li>
                            <li><kbd>Escape</kbd> - モーダルを閉じる</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h3>🎯 ランドマーク</h3>
                        <ul>
                            <li><kbd>Alt + 1</kbd> - ヘッダー</li>
                            <li><kbd>Alt + 2</kbd> - ナビゲーション</li>
                            <li><kbd>Alt + 3</kbd> - メインコンテンツ</li>
                            <li><kbd>Alt + 4</kbd> - サイドバー</li>
                            <li><kbd>Alt + 5</kbd> - フッター</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h3>⚙️ 現在の設定</h3>
                        <ul>
                            <li>モーション軽減: ${this.preferences.reducedMotion ? '有効' : '無効'}</li>
                            <li>高コントラスト: ${this.preferences.highContrast ? '有効' : '無効'}</li>
                            <li>大きなテキスト: ${this.preferences.largeText ? '有効' : '無効'}</li>
                            <li>スクリーンリーダー: ${this.preferences.screenReader ? '検出済み' : '未検出'}</li>
                        </ul>
                    </section>
                    
                    <button class="help-close-btn" onclick="this.parentElement.parentElement.remove()">
                        閉じる
                    </button>
                </div>
            </div>
        `;
        
        const helpModal = document.createElement('div');
        helpModal.innerHTML = helpContent;
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const helpContentEl = helpModal.querySelector('.help-content');
        helpContentEl.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            color: black;
        `;
        
        // Escapeキーで閉じる
        const closeHandler = (event) => {
            if (event.key === 'Escape') {
                helpModal.remove();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        
        document.addEventListener('keydown', closeHandler);
        document.body.appendChild(helpModal);
        
        // フォーカスを移動
        const closeButton = helpModal.querySelector('.help-close-btn');
        closeButton.focus();
        
        this.announceToScreenReader('アクセシビリティヘルプを表示しました');
    }
    
    /**
     * スクリーンリーダーへのアナウンス
     * @param {string} message - アナウンスメッセージ
     * @param {boolean} urgent - 緊急度（true: assertive, false: polite）
     */
    announceToScreenReader(message, urgent = false) {
        const announcer = urgent ? this.urgentAnnouncer : this.announcer;
        if (announcer) {
            announcer.textContent = message;
            
            // 少し遅延してクリア（重複アナウンス防止）
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * フォーカストラップの設定
     * @param {Element} container - トラップするコンテナ
     */
    setFocusTrap(container) {
        this.keyboardNavigation.trapFocus = true;
        this.keyboardNavigation.trapContainer = container;
        
        const focusableElements = container.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
        
        this.announceToScreenReader('フォーカストラップが有効になりました');
    }
    
    /**
     * フォーカストラップの解除
     */
    releaseFocusTrap() {
        this.keyboardNavigation.trapFocus = false;
        this.keyboardNavigation.trapContainer = null;
        
        // 前のフォーカス位置に戻る
        if (this.focusTracker.lastFocusedElement) {
            this.focusTracker.lastFocusedElement.focus();
        }
        
        this.announceToScreenReader('フォーカストラップが解除されました');
    }
    
    /**
     * アクセシビリティ機能の状態取得
     * @returns {Object} 現在の設定状態
     */
    getAccessibilityStatus() {
        return {
            preferences: { ...this.preferences },
            isInitialized: this.isInitialized,
            focusableElementsCount: this.keyboardNavigation.focusableElements.length,
            skipLinksCount: this.focusTracker.skipLinks.length
        };
    }
}