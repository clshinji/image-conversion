/**
 * ステップバイステップガイダンス機能を提供するクラス
 */
export class GuidanceController {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                id: 'upload',
                title: '1. ファイルを選択',
                description: '変換したい画像ファイルをアップロードしてください',
                element: '#uploadArea',
                action: 'ファイルをドラッグ&ドロップするか、クリックして選択',
                completed: false
            },
            {
                id: 'format',
                title: '2. 変換形式を選択',
                description: '変換先の画像形式を選択してください',
                element: '#targetFormat',
                action: 'ドロップダウンから形式を選択',
                completed: false
            },
            {
                id: 'options',
                title: '3. オプションを設定',
                description: '品質やサイズなどのオプションを調整してください',
                element: '#conversionOptions',
                action: '必要に応じて設定を調整',
                completed: false
            },
            {
                id: 'convert',
                title: '4. 変換を実行',
                description: '設定が完了したら変換を実行してください',
                element: '#convertBtn',
                action: '変換実行ボタンをクリック',
                completed: false
            },
            {
                id: 'download',
                title: '5. ダウンロード',
                description: '変換が完了したらファイルをダウンロードできます',
                element: '#downloadBtn',
                action: 'ダウンロードボタンをクリック',
                completed: false
            }
        ];
        
        this.guidanceElement = null;
        this.isVisible = false;
        this.autoAdvance = true;
        
        this.init();
    }
    
    /**
     * ガイダンス機能の初期化
     */
    init() {
        this.createGuidanceUI();
        this.setupEventListeners();
        this.showInitialGuidance();
    }
    
    /**
     * ガイダンスUIの作成
     */
    createGuidanceUI() {
        // ガイダンスコンテナを作成
        this.guidanceElement = document.createElement('div');
        this.guidanceElement.className = 'step-guidance';
        this.guidanceElement.innerHTML = `
            <div class="guidance-header">
                <h3 class="guidance-title">
                    <span class="guidance-icon">🎯</span>
                    変換ガイド
                </h3>
                <div class="guidance-controls">
                    <button type="button" class="guidance-toggle-btn" id="guidanceToggle" title="ガイドの表示/非表示">
                        <span class="toggle-icon">👁️</span>
                    </button>
                    <button type="button" class="guidance-close-btn" id="guidanceClose" title="ガイドを閉じる">
                        <span class="close-icon">✕</span>
                    </button>
                </div>
            </div>
            <div class="guidance-content" id="guidanceContent">
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" id="guidanceProgress"></div>
                    </div>
                    <div class="progress-text">
                        <span id="currentStepNumber">1</span> / <span id="totalSteps">${this.steps.length}</span>
                    </div>
                </div>
                <div class="current-step" id="currentStepContent">
                    <!-- 現在のステップ内容がここに表示される -->
                </div>
                <div class="step-navigation">
                    <button type="button" class="nav-btn prev-btn" id="prevStepBtn" disabled>
                        <span class="nav-icon">←</span>
                        前のステップ
                    </button>
                    <button type="button" class="nav-btn next-btn" id="nextStepBtn">
                        次のステップ
                        <span class="nav-icon">→</span>
                    </button>
                </div>
                <div class="guidance-settings">
                    <label class="setting-toggle">
                        <input type="checkbox" id="autoAdvanceToggle" ${this.autoAdvance ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="setting-text">自動進行</span>
                    </label>
                </div>
            </div>
        `;
        
        // ガイダンスをページに追加
        document.body.appendChild(this.guidanceElement);
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ガイダンス表示/非表示切り替え
        const toggleBtn = document.getElementById('guidanceToggle');
        toggleBtn?.addEventListener('click', () => this.toggleVisibility());
        
        // ガイダンスを閉じる
        const closeBtn = document.getElementById('guidanceClose');
        closeBtn?.addEventListener('click', () => this.hide());
        
        // ステップナビゲーション
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        
        prevBtn?.addEventListener('click', () => this.previousStep());
        nextBtn?.addEventListener('click', () => this.nextStep());
        
        // 自動進行設定
        const autoAdvanceToggle = document.getElementById('autoAdvanceToggle');
        autoAdvanceToggle?.addEventListener('change', (e) => {
            this.autoAdvance = e.target.checked;
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.previousStep();
                } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.nextStep();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hide();
                }
            }
        });
    }
    
    /**
     * 初期ガイダンスの表示
     */
    showInitialGuidance() {
        this.show();
        this.updateStepContent();
        this.highlightCurrentElement();
    }
    
    /**
     * ガイダンスを表示
     */
    show() {
        this.isVisible = true;
        this.guidanceElement.classList.add('visible');
        this.guidanceElement.classList.remove('hidden');
    }
    
    /**
     * ガイダンスを非表示
     */
    hide() {
        this.isVisible = false;
        this.guidanceElement.classList.add('hidden');
        this.guidanceElement.classList.remove('visible');
        this.clearHighlight();
    }
    
    /**
     * ガイダンスの表示/非表示を切り替え
     */
    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * 次のステップに進む
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateStepContent();
            this.highlightCurrentElement();
            this.updateNavigation();
        }
    }
    
    /**
     * 前のステップに戻る
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepContent();
            this.highlightCurrentElement();
            this.updateNavigation();
        }
    }
    
    /**
     * 指定されたステップに移動
     * @param {number} stepIndex - ステップのインデックス
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.updateStepContent();
            this.highlightCurrentElement();
            this.updateNavigation();
        }
    }
    
    /**
     * ステップを完了としてマーク
     * @param {string} stepId - ステップのID
     */
    markStepCompleted(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step && !step.completed) {
            step.completed = true;
            this.updateStepContent();
            
            // 自動進行が有効で、現在のステップが完了した場合は次に進む
            if (this.autoAdvance && this.steps[this.currentStep].id === stepId) {
                setTimeout(() => {
                    if (this.currentStep < this.steps.length - 1) {
                        this.nextStep();
                    }
                }, 1500); // 1.5秒後に自動進行
            }
        }
    }
    
    /**
     * ステップ内容の更新
     */
    updateStepContent() {
        const currentStep = this.steps[this.currentStep];
        const contentElement = document.getElementById('currentStepContent');
        const progressElement = document.getElementById('guidanceProgress');
        const stepNumberElement = document.getElementById('currentStepNumber');
        
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="step-info">
                    <div class="step-header">
                        <h4 class="step-title ${currentStep.completed ? 'completed' : ''}">
                            ${currentStep.completed ? '✅' : '🔄'} ${currentStep.title}
                        </h4>
                        <div class="step-status">
                            ${currentStep.completed ? 
                                '<span class="status-badge completed">完了</span>' : 
                                '<span class="status-badge pending">進行中</span>'
                            }
                        </div>
                    </div>
                    <p class="step-description">${currentStep.description}</p>
                    <div class="step-action">
                        <strong>操作:</strong> ${currentStep.action}
                    </div>
                    ${this.getStepSpecificContent(currentStep)}
                </div>
            `;
        }
        
        // プログレスバーの更新
        if (progressElement) {
            const progress = ((this.currentStep + 1) / this.steps.length) * 100;
            progressElement.style.width = `${progress}%`;
        }
        
        // ステップ番号の更新
        if (stepNumberElement) {
            stepNumberElement.textContent = this.currentStep + 1;
        }
        
        this.updateNavigation();
    }
    
    /**
     * ステップ固有のコンテンツを取得
     * @param {Object} step - ステップオブジェクト
     * @returns {string} HTML文字列
     */
    getStepSpecificContent(step) {
        switch (step.id) {
            case 'upload':
                return `
                    <div class="step-tips">
                        <h5>💡 ヒント:</h5>
                        <ul>
                            <li>対応形式: SVG, PNG, JPG, WebP, GIF</li>
                            <li>最大ファイルサイズ: 10MB</li>
                            <li>複数ファイルの場合はバッチモードを使用</li>
                        </ul>
                    </div>
                `;
            case 'format':
                return `
                    <div class="step-tips">
                        <h5>📋 形式の特徴:</h5>
                        <ul>
                            <li><strong>PNG:</strong> 透明度対応、高品質</li>
                            <li><strong>JPG:</strong> 写真に最適、小サイズ</li>
                            <li><strong>WebP:</strong> 高圧縮、モダンブラウザ対応</li>
                            <li><strong>GIF:</strong> アニメーション対応</li>
                            <li><strong>SVG:</strong> ベクター形式、拡大縮小自在</li>
                        </ul>
                    </div>
                `;
            case 'options':
                return `
                    <div class="step-tips">
                        <h5>⚙️ 主要オプション:</h5>
                        <ul>
                            <li><strong>品質:</strong> JPG/WebPの圧縮品質</li>
                            <li><strong>サイズ:</strong> 出力画像のサイズ</li>
                            <li><strong>背景:</strong> 透明度と背景色の設定</li>
                        </ul>
                    </div>
                `;
            case 'convert':
                return `
                    <div class="step-tips">
                        <h5>🚀 変換について:</h5>
                        <ul>
                            <li>すべての処理はブラウザ内で実行</li>
                            <li>ファイルは外部に送信されません</li>
                            <li>大きなファイルは時間がかかる場合があります</li>
                        </ul>
                    </div>
                `;
            case 'download':
                return `
                    <div class="step-tips">
                        <h5>📥 ダウンロード:</h5>
                        <ul>
                            <li>変換されたファイルをダウンロード</li>
                            <li>バッチモードの場合はZIPファイル</li>
                            <li>元のファイルは保持されます</li>
                        </ul>
                    </div>
                `;
            default:
                return '';
        }
    }
    
    /**
     * ナビゲーションボタンの状態更新
     */
    updateNavigation() {
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
        }
        
        if (nextBtn) {
            if (this.currentStep === this.steps.length - 1) {
                nextBtn.textContent = '完了';
                nextBtn.onclick = () => this.hide();
            } else {
                nextBtn.innerHTML = '次のステップ <span class="nav-icon">→</span>';
                nextBtn.onclick = () => this.nextStep();
            }
        }
    }
    
    /**
     * 現在のステップの要素をハイライト
     */
    highlightCurrentElement() {
        // 既存のハイライトをクリア
        this.clearHighlight();
        
        const currentStep = this.steps[this.currentStep];
        const element = document.querySelector(currentStep.element);
        
        if (element) {
            element.classList.add('guidance-highlight');
            
            // スムーズスクロール
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // パルス効果
            element.classList.add('guidance-pulse');
            setTimeout(() => {
                element.classList.remove('guidance-pulse');
            }, 2000);
        }
    }
    
    /**
     * ハイライトをクリア
     */
    clearHighlight() {
        const highlightedElements = document.querySelectorAll('.guidance-highlight');
        highlightedElements.forEach(element => {
            element.classList.remove('guidance-highlight', 'guidance-pulse');
        });
    }
    
    /**
     * ガイダンスの状態をリセット
     */
    reset() {
        this.currentStep = 0;
        this.steps.forEach(step => step.completed = false);
        this.updateStepContent();
        this.highlightCurrentElement();
    }
    
    /**
     * 特定のアクションに基づいてステップを自動進行
     * @param {string} action - 実行されたアクション
     */
    handleAction(action) {
        switch (action) {
            case 'fileSelected':
                this.markStepCompleted('upload');
                break;
            case 'formatChanged':
                this.markStepCompleted('format');
                break;
            case 'optionsChanged':
                this.markStepCompleted('options');
                break;
            case 'conversionStarted':
                this.markStepCompleted('convert');
                break;
            case 'downloadReady':
                this.markStepCompleted('download');
                break;
        }
    }
}