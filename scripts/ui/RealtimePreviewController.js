/**
 * リアルタイムプレビュー機能を提供するクラス
 */
export class RealtimePreviewController {
    constructor(imageConverter, visualFeedback) {
        this.imageConverter = imageConverter;
        this.visualFeedback = visualFeedback;
        this.currentFile = null;
        this.currentOptions = {};
        this.previewCache = new Map();
        this.isPreviewEnabled = true;
        this.previewDebounceTimer = null;
        this.previewDelay = 500; // ms
        this.comparisonMode = 'side-by-side'; // side-by-side, overlay, split
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.createPreviewUI();
        this.setupEventListeners();
        this.setupPreviewControls();
    }
    
    /**
     * プレビューUIの作成
     */
    createPreviewUI() {
        // 既存のプレビューセクションを拡張
        const previewSection = document.querySelector('.preview-section');
        if (!previewSection) return;
        
        // プレビューコントロールを追加
        const controlsHTML = `
            <div class="preview-controls" id="previewControls" style="display: none;">
                <div class="preview-toolbar">
                    <div class="preview-mode-controls">
                        <label class="control-label">表示モード:</label>
                        <div class="mode-buttons">
                            <button type="button" class="mode-btn active" data-mode="side-by-side" title="左右比較">
                                <span class="mode-icon">⚏</span>
                                <span class="mode-text">左右比較</span>
                            </button>
                            <button type="button" class="mode-btn" data-mode="overlay" title="重ね合わせ">
                                <span class="mode-icon">⧉</span>
                                <span class="mode-text">重ね合わせ</span>
                            </button>
                            <button type="button" class="mode-btn" data-mode="split" title="分割表示">
                                <span class="mode-icon">⫽</span>
                                <span class="mode-text">分割表示</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-zoom-controls">
                        <label class="control-label">ズーム:</label>
                        <div class="zoom-buttons">
                            <button type="button" class="zoom-btn" id="zoomOut" title="縮小">
                                <span class="zoom-icon">🔍-</span>
                            </button>
                            <span class="zoom-level" id="zoomLevel">100%</span>
                            <button type="button" class="zoom-btn" id="zoomIn" title="拡大">
                                <span class="zoom-icon">🔍+</span>
                            </button>
                            <button type="button" class="zoom-btn" id="zoomReset" title="リセット">
                                <span class="zoom-icon">⌂</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-options">
                        <label class="preview-toggle">
                            <input type="checkbox" id="realtimePreviewToggle" ${this.isPreviewEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            <span class="toggle-text">リアルタイム更新</span>
                        </label>
                        
                        <button type="button" class="preview-btn" id="manualPreviewBtn" title="手動更新">
                            <span class="preview-icon">🔄</span>
                            <span class="preview-text">更新</span>
                        </button>
                    </div>
                </div>
                
                <div class="preview-info-bar" id="previewInfoBar">
                    <div class="info-item">
                        <span class="info-label">元画像:</span>
                        <span class="info-value" id="originalInfo">-</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">変換後:</span>
                        <span class="info-value" id="convertedInfo">-</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">サイズ比:</span>
                        <span class="info-value" id="sizeRatio">-</span>
                    </div>
                </div>
            </div>
        `;
        
        previewSection.insertAdjacentHTML('afterbegin', controlsHTML);
        
        // プレビューコンテナを拡張
        this.enhancePreviewContainer();
    }
    
    /**
     * プレビューコンテナの拡張
     */
    enhancePreviewContainer() {
        const previewContainer = document.querySelector('.preview-container');
        if (!previewContainer) return;
        
        // 比較モード用のコンテナを追加
        const comparisonHTML = `
            <div class="comparison-container" id="comparisonContainer" style="display: none;">
                <div class="comparison-viewport" id="comparisonViewport">
                    <div class="comparison-content" id="comparisonContent">
                        <div class="image-layer original-layer" id="originalLayer">
                            <div class="image-wrapper" id="originalWrapper"></div>
                            <div class="image-label">元画像</div>
                        </div>
                        <div class="image-layer converted-layer" id="convertedLayer">
                            <div class="image-wrapper" id="convertedWrapper"></div>
                            <div class="image-label">変換後</div>
                        </div>
                        <div class="split-divider" id="splitDivider" style="display: none;">
                            <div class="divider-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        previewContainer.insertAdjacentHTML('beforeend', comparisonHTML);
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 設定変更の監視
        this.monitorSettingsChanges();
        
        // プレビューコントロールのイベント
        this.setupPreviewControlEvents();
        
        // ズーム・パン操作
        this.setupZoomPanEvents();
        
        // 分割表示のドラッグ操作
        this.setupSplitDividerEvents();
    }
    
    /**
     * 設定変更の監視
     */
    monitorSettingsChanges() {
        // 品質設定の変更
        const qualitySlider = document.getElementById('qualitySlider');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', () => {
                this.schedulePreviewUpdate();
            });
        }
        
        // サイズ設定の変更
        const sizePreset = document.getElementById('sizePreset');
        if (sizePreset) {
            sizePreset.addEventListener('change', () => {
                this.schedulePreviewUpdate();
            });
        }
        
        const customWidth = document.getElementById('customWidth');
        const customHeight = document.getElementById('customHeight');
        
        if (customWidth) {
            customWidth.addEventListener('input', () => {
                this.schedulePreviewUpdate();
            });
        }
        
        if (customHeight) {
            customHeight.addEventListener('input', () => {
                this.schedulePreviewUpdate();
            });
        }
        
        // 背景色の変更
        const backgroundColor = document.getElementById('backgroundColor');
        if (backgroundColor) {
            backgroundColor.addEventListener('input', () => {
                this.schedulePreviewUpdate();
            });
        }
        
        // 透明背景オプションの変更
        const transparentBgOption = document.getElementById('transparentBgOption');
        if (transparentBgOption) {
            transparentBgOption.addEventListener('change', () => {
                this.schedulePreviewUpdate();
            });
        }
        
        // 形式変更
        const targetFormat = document.getElementById('targetFormat');
        if (targetFormat) {
            targetFormat.addEventListener('change', () => {
                this.schedulePreviewUpdate();
            });
        }
    }
    
    /**
     * プレビューコントロールのイベント設定
     */
    setupPreviewControlEvents() {
        // 表示モード切り替え
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.setComparisonMode(mode);
            });
        });
        
        // リアルタイム更新切り替え
        const realtimeToggle = document.getElementById('realtimePreviewToggle');
        if (realtimeToggle) {
            realtimeToggle.addEventListener('change', (e) => {
                this.isPreviewEnabled = e.target.checked;
                this.updatePreviewControls();
            });
        }
        
        // 手動更新ボタン
        const manualBtn = document.getElementById('manualPreviewBtn');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                this.updatePreview(true);
            });
        }
    }
    
    /**
     * ズーム・パン操作の設定
     */
    setupZoomPanEvents() {
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const zoomResetBtn = document.getElementById('zoomReset');
        const comparisonViewport = document.getElementById('comparisonViewport');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => this.resetZoom());
        }
        
        if (comparisonViewport) {
            // マウスホイールでズーム
            comparisonViewport.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.zoom(this.zoomLevel + delta, e.offsetX, e.offsetY);
            });
            
            // ドラッグでパン
            comparisonViewport.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // 左クリック
                    this.startPan(e);
                }
            });
            
            comparisonViewport.addEventListener('mousemove', (e) => {
                if (this.isDragging) {
                    this.updatePan(e);
                }
            });
            
            comparisonViewport.addEventListener('mouseup', () => {
                this.endPan();
            });
            
            comparisonViewport.addEventListener('mouseleave', () => {
                this.endPan();
            });
            
            // タッチ操作対応
            this.setupTouchEvents(comparisonViewport);
        }
    }
    
    /**
     * タッチ操作の設定
     */
    setupTouchEvents(element) {
        let lastTouchDistance = 0;
        let lastTouchCenter = { x: 0, y: 0 };
        
        element.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // 単一タッチでパン開始
                this.startPan({
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                });
            } else if (e.touches.length === 2) {
                // ピンチズーム開始
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                lastTouchCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                };
            }
        }, { passive: false });
        
        element.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.isDragging) {
                // パン操作
                this.updatePan({
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                });
            } else if (e.touches.length === 2) {
                // ピンチズーム
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                const currentCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                };
                
                if (lastTouchDistance > 0) {
                    const scale = currentDistance / lastTouchDistance;
                    const newZoom = this.zoomLevel * scale;
                    this.zoom(newZoom, currentCenter.x, currentCenter.y);
                }
                
                lastTouchDistance = currentDistance;
                lastTouchCenter = currentCenter;
            }
        }, { passive: false });
        
        element.addEventListener('touchend', () => {
            this.endPan();
            lastTouchDistance = 0;
        });
    }
    
    /**
     * 分割表示のドラッグ操作設定
     */
    setupSplitDividerEvents() {
        const splitDivider = document.getElementById('splitDivider');
        if (!splitDivider) return;
        
        let isDraggingSplit = false;
        
        splitDivider.addEventListener('mousedown', (e) => {
            isDraggingSplit = true;
            splitDivider.classList.add('dragging');
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDraggingSplit) return;
            
            const comparisonContent = document.getElementById('comparisonContent');
            if (!comparisonContent) return;
            
            const rect = comparisonContent.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            
            // 10%から90%の範囲に制限
            const clampedPercentage = Math.max(10, Math.min(90, percentage));
            
            this.updateSplitPosition(clampedPercentage);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDraggingSplit) {
                isDraggingSplit = false;
                splitDivider.classList.remove('dragging');
            }
        });
    }
    
    /**
     * プレビューコントロールの設定
     */
    setupPreviewControls() {
        this.updatePreviewControls();
    }
    
    /**
     * ファイルを設定
     * @param {File} file - 画像ファイル
     */
    setFile(file) {
        this.currentFile = file;
        this.previewCache.clear();
        this.showPreviewControls();
        this.loadOriginalImage();
    }
    
    /**
     * 元画像の読み込み
     */
    async loadOriginalImage() {
        if (!this.currentFile) return;
        
        try {
            const originalWrapper = document.getElementById('originalWrapper');
            if (!originalWrapper) return;
            
            // ファイルタイプに応じた読み込み
            let imageElement;
            
            if (this.currentFile.type === 'image/svg+xml') {
                const text = await this.currentFile.text();
                imageElement = document.createElement('div');
                imageElement.innerHTML = text;
                imageElement.className = 'svg-container';
            } else {
                imageElement = document.createElement('img');
                imageElement.src = URL.createObjectURL(this.currentFile);
                imageElement.onload = () => URL.revokeObjectURL(imageElement.src);
            }
            
            imageElement.className += ' original-image';
            originalWrapper.innerHTML = '';
            originalWrapper.appendChild(imageElement);
            
            // 画像情報を更新
            this.updateImageInfo('original', this.currentFile);
            
            // 初回プレビュー更新
            this.schedulePreviewUpdate();
            
        } catch (error) {
            console.error('元画像の読み込みに失敗:', error);
            this.visualFeedback?.showError('元画像の読み込みに失敗しました');
        }
    }
    
    /**
     * プレビュー更新のスケジュール
     */
    schedulePreviewUpdate() {
        if (!this.isPreviewEnabled) return;
        
        // デバウンス処理
        if (this.previewDebounceTimer) {
            clearTimeout(this.previewDebounceTimer);
        }
        
        this.previewDebounceTimer = setTimeout(() => {
            this.updatePreview();
        }, this.previewDelay);
    }
    
    /**
     * プレビューの更新
     * @param {boolean} force - 強制更新フラグ
     */
    async updatePreview(force = false) {
        if (!this.currentFile || (!this.isPreviewEnabled && !force)) return;
        
        try {
            // 現在の設定を取得
            const options = this.getCurrentOptions();
            const cacheKey = this.generateCacheKey(options);
            
            // キャッシュチェック
            if (!force && this.previewCache.has(cacheKey)) {
                const cachedResult = this.previewCache.get(cacheKey);
                this.displayConvertedPreview(cachedResult);
                return;
            }
            
            // 変換処理の表示
            this.showPreviewLoading();
            
            // 画像変換を実行
            const result = await this.performConversion(options);
            
            // キャッシュに保存
            this.previewCache.set(cacheKey, result);
            
            // プレビュー表示
            this.displayConvertedPreview(result);
            
            // 画像情報を更新
            this.updateImageInfo('converted', result);
            
            // サイズ比較を更新
            this.updateSizeComparison();
            
        } catch (error) {
            console.error('プレビュー更新に失敗:', error);
            this.showPreviewError(error);
        } finally {
            this.hidePreviewLoading();
        }
    }
    
    /**
     * 現在の変換オプションを取得
     */
    getCurrentOptions() {
        const targetFormat = document.getElementById('targetFormat')?.value || 'png';
        const quality = parseInt(document.getElementById('qualitySlider')?.value || '90');
        const sizePreset = document.getElementById('sizePreset')?.value || 'original';
        const customWidth = parseInt(document.getElementById('customWidth')?.value || '0');
        const customHeight = parseInt(document.getElementById('customHeight')?.value || '0');
        const transparentBg = document.getElementById('transparentBgOption')?.checked || true;
        const backgroundColor = document.getElementById('backgroundColor')?.value || '#ffffff';
        
        return {
            targetFormat,
            quality,
            sizePreset,
            customWidth,
            customHeight,
            transparentBackground: transparentBg,
            backgroundColor
        };
    }
    
    /**
     * キャッシュキーを生成
     */
    generateCacheKey(options) {
        return JSON.stringify({
            fileName: this.currentFile.name,
            fileSize: this.currentFile.size,
            lastModified: this.currentFile.lastModified,
            ...options
        });
    }
    
    /**
     * 画像変換を実行
     */
    async performConversion(options) {
        // 実際の変換処理はImageConverterに委譲
        if (!this.imageConverter) {
            throw new Error('ImageConverter が初期化されていません');
        }
        
        // ここでは簡易的な変換結果を返す（実際の実装では ImageConverter を使用）
        return {
            blob: await this.createPreviewBlob(options),
            format: options.targetFormat,
            size: { width: 800, height: 600 }, // 仮の値
            fileSize: 1024 * 100 // 仮の値
        };
    }
    
    /**
     * プレビュー用のBlobを作成（簡易実装）
     */
    async createPreviewBlob(options) {
        // 実際の実装では、ImageConverterを使用して変換
        // ここでは元ファイルをそのまま返す（デモ用）
        return this.currentFile;
    }
    
    /**
     * 変換後プレビューを表示
     */
    displayConvertedPreview(result) {
        const convertedWrapper = document.getElementById('convertedWrapper');
        if (!convertedWrapper) return;
        
        // 既存の内容をクリア
        convertedWrapper.innerHTML = '';
        
        // 新しい画像要素を作成
        const imageElement = document.createElement('img');
        imageElement.src = URL.createObjectURL(result.blob);
        imageElement.className = 'converted-image';
        imageElement.onload = () => URL.revokeObjectURL(imageElement.src);
        
        convertedWrapper.appendChild(imageElement);
        
        // 比較表示を更新
        this.updateComparisonDisplay();
    }
    
    /**
     * プレビューローディング表示
     */
    showPreviewLoading() {
        const convertedWrapper = document.getElementById('convertedWrapper');
        if (!convertedWrapper) return;
        
        convertedWrapper.innerHTML = `
            <div class="preview-loading">
                <div class="loading-spinner">
                    <div class="spinner-circle"></div>
                </div>
                <div class="loading-text">プレビューを生成中...</div>
            </div>
        `;
    }
    
    /**
     * プレビューローディング非表示
     */
    hidePreviewLoading() {
        // displayConvertedPreview で内容が置き換えられるため、特別な処理は不要
    }
    
    /**
     * プレビューエラー表示
     */
    showPreviewError(error) {
        const convertedWrapper = document.getElementById('convertedWrapper');
        if (!convertedWrapper) return;
        
        convertedWrapper.innerHTML = `
            <div class="preview-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">
                    <h4>プレビュー生成エラー</h4>
                    <p>プレビューの生成に失敗しました</p>
                    <button class="retry-btn" onclick="window.realtimePreview?.updatePreview(true)">
                        再試行
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 画像情報を更新
     */
    updateImageInfo(type, data) {
        const infoElement = document.getElementById(`${type}Info`);
        if (!infoElement) return;
        
        let info = '';
        
        if (type === 'original' && data instanceof File) {
            const sizeKB = Math.round(data.size / 1024);
            info = `${data.name} (${sizeKB} KB)`;
        } else if (type === 'converted' && data.size && data.fileSize) {
            const sizeKB = Math.round(data.fileSize / 1024);
            info = `${data.size.width}×${data.size.height} (${sizeKB} KB)`;
        }
        
        infoElement.textContent = info;
    }
    
    /**
     * サイズ比較を更新
     */
    updateSizeComparison() {
        const sizeRatioElement = document.getElementById('sizeRatio');
        if (!sizeRatioElement) return;
        
        // 実際の実装では、元ファイルと変換後ファイルのサイズを比較
        // ここでは仮の値を表示
        sizeRatioElement.textContent = '85%'; // 仮の値
    }
    
    /**
     * 比較表示モードを設定
     */
    setComparisonMode(mode) {
        this.comparisonMode = mode;
        
        // ボタンの状態を更新
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // 表示を更新
        this.updateComparisonDisplay();
    }
    
    /**
     * 比較表示を更新
     */
    updateComparisonDisplay() {
        const comparisonContainer = document.getElementById('comparisonContainer');
        const previewContainer = document.querySelector('.preview-container');
        const splitDivider = document.getElementById('splitDivider');
        
        if (!comparisonContainer || !previewContainer) return;
        
        // 表示モードに応じてクラスを設定
        comparisonContainer.className = `comparison-container mode-${this.comparisonMode}`;
        
        // 分割表示の場合のみディバイダーを表示
        if (splitDivider) {
            splitDivider.style.display = this.comparisonMode === 'split' ? 'block' : 'none';
        }
        
        // 比較コンテナを表示
        comparisonContainer.style.display = 'block';
        previewContainer.style.display = 'none';
        
        // ズーム・パンを適用
        this.applyZoomPan();
    }
    
    /**
     * プレビューコントロールを表示
     */
    showPreviewControls() {
        const previewControls = document.getElementById('previewControls');
        if (previewControls) {
            previewControls.style.display = 'block';
        }
    }
    
    /**
     * プレビューコントロールを更新
     */
    updatePreviewControls() {
        const manualBtn = document.getElementById('manualPreviewBtn');
        if (manualBtn) {
            manualBtn.style.display = this.isPreviewEnabled ? 'none' : 'inline-flex';
        }
    }
    
    /**
     * ズーム操作
     */
    zoomIn() {
        this.zoom(this.zoomLevel * 1.2);
    }
    
    zoomOut() {
        this.zoom(this.zoomLevel / 1.2);
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.applyZoomPan();
        this.updateZoomDisplay();
    }
    
    zoom(newZoom, centerX = null, centerY = null) {
        const minZoom = 0.1;
        const maxZoom = 5;
        
        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
        
        if (centerX !== null && centerY !== null) {
            // 指定点を中心にズーム
            const zoomRatio = newZoom / this.zoomLevel;
            this.panOffset.x = centerX - (centerX - this.panOffset.x) * zoomRatio;
            this.panOffset.y = centerY - (centerY - this.panOffset.y) * zoomRatio;
        }
        
        this.zoomLevel = newZoom;
        this.applyZoomPan();
        this.updateZoomDisplay();
    }
    
    /**
     * パン操作
     */
    startPan(event) {
        this.isDragging = true;
        this.lastMousePos = {
            x: event.clientX,
            y: event.clientY
        };
        
        const comparisonViewport = document.getElementById('comparisonViewport');
        if (comparisonViewport) {
            comparisonViewport.style.cursor = 'grabbing';
        }
    }
    
    updatePan(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.lastMousePos.x;
        const deltaY = event.clientY - this.lastMousePos.y;
        
        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;
        
        this.lastMousePos = {
            x: event.clientX,
            y: event.clientY
        };
        
        this.applyZoomPan();
    }
    
    endPan() {
        this.isDragging = false;
        
        const comparisonViewport = document.getElementById('comparisonViewport');
        if (comparisonViewport) {
            comparisonViewport.style.cursor = 'grab';
        }
    }
    
    /**
     * ズーム・パンを適用
     */
    applyZoomPan() {
        const comparisonContent = document.getElementById('comparisonContent');
        if (!comparisonContent) return;
        
        const transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoomLevel})`;
        comparisonContent.style.transform = transform;
    }
    
    /**
     * ズーム表示を更新
     */
    updateZoomDisplay() {
        const zoomLevelElement = document.getElementById('zoomLevel');
        if (zoomLevelElement) {
            zoomLevelElement.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }
    
    /**
     * 分割位置を更新
     */
    updateSplitPosition(percentage) {
        const splitDivider = document.getElementById('splitDivider');
        const convertedLayer = document.getElementById('convertedLayer');
        
        if (splitDivider && convertedLayer) {
            splitDivider.style.left = `${percentage}%`;
            convertedLayer.style.clipPath = `inset(0 0 0 ${percentage}%)`;
        }
    }
    
    /**
     * プレビュー機能を無効化
     */
    disable() {
        this.isPreviewEnabled = false;
        this.updatePreviewControls();
        
        const previewControls = document.getElementById('previewControls');
        if (previewControls) {
            previewControls.style.display = 'none';
        }
    }
    
    /**
     * プレビュー機能を有効化
     */
    enable() {
        this.isPreviewEnabled = true;
        this.updatePreviewControls();
        
        if (this.currentFile) {
            this.showPreviewControls();
            this.schedulePreviewUpdate();
        }
    }
    
    /**
     * リソースのクリーンアップ
     */
    cleanup() {
        // タイマーをクリア
        if (this.previewDebounceTimer) {
            clearTimeout(this.previewDebounceTimer);
        }
        
        // キャッシュをクリア
        this.previewCache.clear();
        
        // オブジェクトURLを解放
        const images = document.querySelectorAll('.original-image, .converted-image');
        images.forEach(img => {
            if (img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
    }
}

// グローバルに公開
window.realtimePreview = null;