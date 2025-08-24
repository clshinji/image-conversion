/**
 * 詳細情報表示機能を提供するクラス
 * ファイルメタデータ、変換前後の比較、品質分析などを表示
 */
export class DetailedInfoController {
    constructor(visualFeedback) {
        this.visualFeedback = visualFeedback;
        this.originalFile = null;
        this.convertedResult = null;
        this.analysisData = {};
        this.isVisible = false;
        this.updateInterval = null;
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.createDetailedInfoUI();
        this.setupEventListeners();
    }
    
    /**
     * 詳細情報UIの作成
     */
    createDetailedInfoUI() {
        // 詳細情報パネルを作成
        const detailedInfoHTML = `
            <div class="detailed-info-panel" id="detailedInfoPanel" style="display: none;">
                <div class="info-panel-header">
                    <h3 class="panel-title">
                        <span class="panel-icon">📊</span>
                        詳細情報
                    </h3>
                    <div class="panel-controls">
                        <button type="button" class="panel-toggle-btn" id="infoPanelToggle" title="パネルの展開/折りたたみ">
                            <span class="toggle-icon">📋</span>
                        </button>
                        <button type="button" class="panel-close-btn" id="infoPanelClose" title="パネルを閉じる">
                            <span class="close-icon">✕</span>
                        </button>
                    </div>
                </div>
                
                <div class="info-panel-content" id="infoPanelContent">
                    <!-- ファイル情報セクション -->
                    <div class="info-section" id="fileInfoSection">
                        <div class="section-header">
                            <h4 class="section-title">📁 ファイル情報</h4>
                            <button type="button" class="section-toggle" data-section="fileInfo">
                                <span class="toggle-arrow">▼</span>
                            </button>
                        </div>
                        <div class="section-content" id="fileInfoContent">
                            <div class="info-grid">
                                <div class="info-card original-info">
                                    <div class="card-header">
                                        <h5 class="card-title">元ファイル</h5>
                                        <span class="card-badge original">Original</span>
                                    </div>
                                    <div class="card-content" id="originalFileInfo">
                                        <div class="info-row">
                                            <span class="info-label">ファイル名:</span>
                                            <span class="info-value" id="originalFileName">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">ファイルサイズ:</span>
                                            <span class="info-value" id="originalFileSize">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">形式:</span>
                                            <span class="info-value" id="originalFormat">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">解像度:</span>
                                            <span class="info-value" id="originalResolution">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">色深度:</span>
                                            <span class="info-value" id="originalColorDepth">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">最終更新:</span>
                                            <span class="info-value" id="originalLastModified">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="info-card converted-info">
                                    <div class="card-header">
                                        <h5 class="card-title">変換後</h5>
                                        <span class="card-badge converted">Converted</span>
                                    </div>
                                    <div class="card-content" id="convertedFileInfo">
                                        <div class="info-row">
                                            <span class="info-label">ファイル名:</span>
                                            <span class="info-value" id="convertedFileName">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">ファイルサイズ:</span>
                                            <span class="info-value" id="convertedFileSize">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">形式:</span>
                                            <span class="info-value" id="convertedFormat">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">解像度:</span>
                                            <span class="info-value" id="convertedResolution">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">圧縮率:</span>
                                            <span class="info-value" id="compressionRatio">-</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">品質設定:</span>
                                            <span class="info-value" id="qualitySetting">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 比較分析セクション -->
                    <div class="info-section" id="comparisonSection">
                        <div class="section-header">
                            <h4 class="section-title">📈 比較分析</h4>
                            <button type="button" class="section-toggle" data-section="comparison">
                                <span class="toggle-arrow">▼</span>
                            </button>
                        </div>
                        <div class="section-content" id="comparisonContent">
                            <div class="comparison-charts">
                                <div class="chart-container">
                                    <div class="chart-header">
                                        <h5 class="chart-title">ファイルサイズ比較</h5>
                                    </div>
                                    <div class="size-comparison-chart" id="sizeComparisonChart">
                                        <div class="chart-bars">
                                            <div class="bar-group">
                                                <div class="bar original-bar" id="originalSizeBar">
                                                    <div class="bar-fill"></div>
                                                    <div class="bar-label">元ファイル</div>
                                                    <div class="bar-value" id="originalSizeValue">-</div>
                                                </div>
                                                <div class="bar converted-bar" id="convertedSizeBar">
                                                    <div class="bar-fill"></div>
                                                    <div class="bar-label">変換後</div>
                                                    <div class="bar-value" id="convertedSizeValue">-</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="chart-summary">
                                            <div class="summary-item">
                                                <span class="summary-label">サイズ変化:</span>
                                                <span class="summary-value" id="sizeChangeValue">-</span>
                                            </div>
                                            <div class="summary-item">
                                                <span class="summary-label">圧縮効率:</span>
                                                <span class="summary-value" id="compressionEfficiency">-</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="chart-container">
                                    <div class="chart-header">
                                        <h5 class="chart-title">品質分析</h5>
                                    </div>
                                    <div class="quality-analysis" id="qualityAnalysis">
                                        <div class="quality-metrics">
                                            <div class="metric-item">
                                                <div class="metric-label">推定品質スコア</div>
                                                <div class="metric-value">
                                                    <div class="quality-score" id="qualityScore">-</div>
                                                    <div class="quality-bar">
                                                        <div class="quality-fill" id="qualityFill"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="metric-item">
                                                <div class="metric-label">色再現性</div>
                                                <div class="metric-value">
                                                    <div class="color-accuracy" id="colorAccuracy">-</div>
                                                </div>
                                            </div>
                                            <div class="metric-item">
                                                <div class="metric-label">シャープネス</div>
                                                <div class="metric-value">
                                                    <div class="sharpness-level" id="sharpnessLevel">-</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 技術的詳細セクション -->
                    <div class="info-section" id="technicalSection">
                        <div class="section-header">
                            <h4 class="section-title">🔧 技術的詳細</h4>
                            <button type="button" class="section-toggle" data-section="technical">
                                <span class="toggle-arrow">▼</span>
                            </button>
                        </div>
                        <div class="section-content" id="technicalContent">
                            <div class="technical-details">
                                <div class="detail-group">
                                    <h6 class="detail-title">変換設定</h6>
                                    <div class="detail-list" id="conversionSettings">
                                        <!-- 動的に生成される -->
                                    </div>
                                </div>
                                
                                <div class="detail-group">
                                    <h6 class="detail-title">メタデータ</h6>
                                    <div class="detail-list" id="metadataDetails">
                                        <!-- 動的に生成される -->
                                    </div>
                                </div>
                                
                                <div class="detail-group">
                                    <h6 class="detail-title">処理統計</h6>
                                    <div class="detail-list" id="processingStats">
                                        <!-- 動的に生成される -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- エクスポート機能 -->
                    <div class="info-section" id="exportSection">
                        <div class="section-header">
                            <h4 class="section-title">💾 エクスポート</h4>
                        </div>
                        <div class="section-content">
                            <div class="export-options">
                                <button type="button" class="export-btn" id="exportJsonBtn">
                                    <span class="export-icon">📄</span>
                                    <span class="export-text">JSON形式でエクスポート</span>
                                </button>
                                <button type="button" class="export-btn" id="exportCsvBtn">
                                    <span class="export-icon">📊</span>
                                    <span class="export-text">CSV形式でエクスポート</span>
                                </button>
                                <button type="button" class="export-btn" id="copyToClipboardBtn">
                                    <span class="export-icon">📋</span>
                                    <span class="export-text">クリップボードにコピー</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // メインコンテナに追加
        const container = document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('beforeend', detailedInfoHTML);
        }
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // パネル制御
        const toggleBtn = document.getElementById('infoPanelToggle');
        const closeBtn = document.getElementById('infoPanelClose');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePanel());
        }
        
        // セクション展開/折りたたみ
        const sectionToggles = document.querySelectorAll('.section-toggle');
        sectionToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.toggleSection(section);
            });
        });
        
        // エクスポート機能
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
        
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.exportAsJson());
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportAsCsv());
        }
        
        if (copyToClipboardBtn) {
            copyToClipboardBtn.addEventListener('click', () => this.copyToClipboard());
        }
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + I: 詳細情報パネル切り替え
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.togglePanel();
            }
        });
    }
    
    /**
     * 元ファイルを設定
     * @param {File} file - 元ファイル
     */
    setOriginalFile(file) {
        this.originalFile = file;
        this.updateOriginalFileInfo();
        this.showPanel();
    }
    
    /**
     * 変換結果を設定
     * @param {Object} result - 変換結果
     */
    setConvertedResult(result) {
        this.convertedResult = result;
        this.updateConvertedFileInfo();
        this.updateComparison();
        this.updateTechnicalDetails();
    }
    
    /**
     * 元ファイル情報を更新
     */
    updateOriginalFileInfo() {
        if (!this.originalFile) return;
        
        const elements = {
            fileName: document.getElementById('originalFileName'),
            fileSize: document.getElementById('originalFileSize'),
            format: document.getElementById('originalFormat'),
            resolution: document.getElementById('originalResolution'),
            colorDepth: document.getElementById('originalColorDepth'),
            lastModified: document.getElementById('originalLastModified')
        };
        
        // ファイル名
        if (elements.fileName) {
            elements.fileName.textContent = this.originalFile.name;
        }
        
        // ファイルサイズ
        if (elements.fileSize) {
            elements.fileSize.textContent = this.formatFileSize(this.originalFile.size);
        }
        
        // 形式
        if (elements.format) {
            const format = this.getFileFormat(this.originalFile);
            elements.format.textContent = format.toUpperCase();
        }
        
        // 最終更新日時
        if (elements.lastModified) {
            const date = new Date(this.originalFile.lastModified);
            elements.lastModified.textContent = date.toLocaleString('ja-JP');
        }
        
        // 画像の解像度と色深度を取得（非同期）
        this.analyzeImageProperties(this.originalFile).then(properties => {
            if (elements.resolution && properties.width && properties.height) {
                elements.resolution.textContent = `${properties.width} × ${properties.height}`;
            }
            
            if (elements.colorDepth && properties.colorDepth) {
                elements.colorDepth.textContent = `${properties.colorDepth} bit`;
            }
        });
    }
    
    /**
     * 変換後ファイル情報を更新
     */
    updateConvertedFileInfo() {
        if (!this.convertedResult) return;
        
        const elements = {
            fileName: document.getElementById('convertedFileName'),
            fileSize: document.getElementById('convertedFileSize'),
            format: document.getElementById('convertedFormat'),
            resolution: document.getElementById('convertedResolution'),
            compressionRatio: document.getElementById('compressionRatio'),
            qualitySetting: document.getElementById('qualitySetting')
        };
        
        // ファイル名（推定）
        if (elements.fileName && this.originalFile) {
            const baseName = this.originalFile.name.replace(/\.[^/.]+$/, '');
            const extension = this.getFileExtension(this.convertedResult.format);
            elements.fileName.textContent = `${baseName}.${extension}`;
        }
        
        // ファイルサイズ
        if (elements.fileSize && this.convertedResult.fileSize) {
            elements.fileSize.textContent = this.formatFileSize(this.convertedResult.fileSize);
        }
        
        // 形式
        if (elements.format && this.convertedResult.format) {
            elements.format.textContent = this.convertedResult.format.toUpperCase();
        }
        
        // 解像度
        if (elements.resolution && this.convertedResult.size) {
            elements.resolution.textContent = `${this.convertedResult.size.width} × ${this.convertedResult.size.height}`;
        }
        
        // 圧縮率
        if (elements.compressionRatio && this.originalFile && this.convertedResult.fileSize) {
            const ratio = (this.convertedResult.fileSize / this.originalFile.size) * 100;
            elements.compressionRatio.textContent = `${ratio.toFixed(1)}%`;
        }
        
        // 品質設定
        if (elements.qualitySetting) {
            const qualitySlider = document.getElementById('qualitySlider');
            if (qualitySlider) {
                elements.qualitySetting.textContent = `${qualitySlider.value}%`;
            }
        }
    }
    
    /**
     * 比較分析を更新
     */
    updateComparison() {
        if (!this.originalFile || !this.convertedResult) return;
        
        this.updateSizeComparison();
        this.updateQualityAnalysis();
    }
    
    /**
     * サイズ比較を更新
     */
    updateSizeComparison() {
        const originalSize = this.originalFile.size;
        const convertedSize = this.convertedResult.fileSize || originalSize;
        
        // バーチャートの更新
        const originalBar = document.getElementById('originalSizeBar');
        const convertedBar = document.getElementById('convertedSizeBar');
        const originalSizeValue = document.getElementById('originalSizeValue');
        const convertedSizeValue = document.getElementById('convertedSizeValue');
        
        const maxSize = Math.max(originalSize, convertedSize);
        
        if (originalBar) {
            const originalPercent = (originalSize / maxSize) * 100;
            const fillElement = originalBar.querySelector('.bar-fill');
            if (fillElement) {
                fillElement.style.width = `${originalPercent}%`;
            }
        }
        
        if (convertedBar) {
            const convertedPercent = (convertedSize / maxSize) * 100;
            const fillElement = convertedBar.querySelector('.bar-fill');
            if (fillElement) {
                fillElement.style.width = `${convertedPercent}%`;
            }
        }
        
        if (originalSizeValue) {
            originalSizeValue.textContent = this.formatFileSize(originalSize);
        }
        
        if (convertedSizeValue) {
            convertedSizeValue.textContent = this.formatFileSize(convertedSize);
        }
        
        // サマリーの更新
        const sizeChangeValue = document.getElementById('sizeChangeValue');
        const compressionEfficiency = document.getElementById('compressionEfficiency');
        
        if (sizeChangeValue) {
            const change = convertedSize - originalSize;
            const changePercent = ((change / originalSize) * 100).toFixed(1);
            const changeText = change >= 0 ? `+${this.formatFileSize(change)}` : `-${this.formatFileSize(Math.abs(change))}`;
            sizeChangeValue.textContent = `${changeText} (${changePercent}%)`;
            sizeChangeValue.className = `summary-value ${change >= 0 ? 'increase' : 'decrease'}`;
        }
        
        if (compressionEfficiency) {
            const efficiency = ((originalSize - convertedSize) / originalSize * 100).toFixed(1);
            compressionEfficiency.textContent = `${efficiency}%`;
            compressionEfficiency.className = `summary-value ${efficiency >= 0 ? 'good' : 'poor'}`;
        }
    }
    
    /**
     * 品質分析を更新
     */
    updateQualityAnalysis() {
        // 品質スコアの計算（簡易版）
        const qualityScore = this.calculateQualityScore();
        
        const qualityScoreElement = document.getElementById('qualityScore');
        const qualityFillElement = document.getElementById('qualityFill');
        const colorAccuracyElement = document.getElementById('colorAccuracy');
        const sharpnessLevelElement = document.getElementById('sharpnessLevel');
        
        if (qualityScoreElement) {
            qualityScoreElement.textContent = `${qualityScore}/100`;
        }
        
        if (qualityFillElement) {
            qualityFillElement.style.width = `${qualityScore}%`;
            qualityFillElement.className = `quality-fill ${this.getQualityClass(qualityScore)}`;
        }
        
        if (colorAccuracyElement) {
            const colorAccuracy = this.calculateColorAccuracy();
            colorAccuracyElement.textContent = colorAccuracy;
        }
        
        if (sharpnessLevelElement) {
            const sharpness = this.calculateSharpness();
            sharpnessLevelElement.textContent = sharpness;
        }
    }
    
    /**
     * 技術的詳細を更新
     */
    updateTechnicalDetails() {
        this.updateConversionSettings();
        this.updateMetadataDetails();
        this.updateProcessingStats();
    }
    
    /**
     * 変換設定を更新
     */
    updateConversionSettings() {
        const container = document.getElementById('conversionSettings');
        if (!container) return;
        
        const settings = this.getCurrentConversionSettings();
        
        container.innerHTML = settings.map(setting => `
            <div class="detail-item">
                <span class="detail-label">${setting.label}:</span>
                <span class="detail-value">${setting.value}</span>
            </div>
        `).join('');
    }
    
    /**
     * メタデータ詳細を更新
     */
    updateMetadataDetails() {
        const container = document.getElementById('metadataDetails');
        if (!container) return;
        
        const metadata = this.extractMetadata();
        
        container.innerHTML = metadata.map(item => `
            <div class="detail-item">
                <span class="detail-label">${item.label}:</span>
                <span class="detail-value">${item.value}</span>
            </div>
        `).join('');
    }
    
    /**
     * 処理統計を更新
     */
    updateProcessingStats() {
        const container = document.getElementById('processingStats');
        if (!container) return;
        
        const stats = this.getProcessingStats();
        
        container.innerHTML = stats.map(stat => `
            <div class="detail-item">
                <span class="detail-label">${stat.label}:</span>
                <span class="detail-value">${stat.value}</span>
            </div>
        `).join('');
    }
    
    /**
     * パネルの表示/非表示を切り替え
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    /**
     * パネルを表示
     */
    showPanel() {
        const panel = document.getElementById('detailedInfoPanel');
        if (panel) {
            panel.style.display = 'block';
            this.isVisible = true;
            
            // アニメーション効果
            setTimeout(() => {
                panel.classList.add('visible');
            }, 10);
        }
    }
    
    /**
     * パネルを非表示
     */
    hidePanel() {
        const panel = document.getElementById('detailedInfoPanel');
        if (panel) {
            panel.classList.remove('visible');
            
            setTimeout(() => {
                panel.style.display = 'none';
                this.isVisible = false;
            }, 300);
        }
    }
    
    /**
     * セクションの展開/折りたたみ
     */
    toggleSection(sectionName) {
        const content = document.getElementById(`${sectionName}Content`);
        const toggle = document.querySelector(`[data-section="${sectionName}"] .toggle-arrow`);
        
        if (content && toggle) {
            const isExpanded = content.style.display !== 'none';
            
            content.style.display = isExpanded ? 'none' : 'block';
            toggle.textContent = isExpanded ? '▶' : '▼';
        }
    }
    
    /**
     * ユーティリティメソッド
     */
    
    /**
     * ファイルサイズをフォーマット
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * ファイル形式を取得
     */
    getFileFormat(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type;
        
        if (mimeType.includes('svg')) return 'svg';
        if (mimeType.includes('png')) return 'png';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
        if (mimeType.includes('webp')) return 'webp';
        if (mimeType.includes('gif')) return 'gif';
        
        return extension;
    }
    
    /**
     * ファイル拡張子を取得
     */
    getFileExtension(format) {
        const extensions = {
            'png': 'png',
            'jpg': 'jpg',
            'jpeg': 'jpg',
            'webp': 'webp',
            'gif': 'gif',
            'svg': 'svg'
        };
        
        return extensions[format.toLowerCase()] || format.toLowerCase();
    }
    
    /**
     * 画像プロパティを分析
     */
    async analyzeImageProperties(file) {
        return new Promise((resolve) => {
            if (file.type.includes('svg')) {
                // SVGの場合
                const reader = new FileReader();
                reader.onload = (e) => {
                    const svgContent = e.target.result;
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
                    const svgElement = svgDoc.querySelector('svg');
                    
                    let width = 'auto';
                    let height = 'auto';
                    
                    if (svgElement) {
                        width = svgElement.getAttribute('width') || 'auto';
                        height = svgElement.getAttribute('height') || 'auto';
                    }
                    
                    resolve({
                        width,
                        height,
                        colorDepth: 'vector'
                    });
                };
                reader.readAsText(file);
            } else {
                // ラスター画像の場合
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        colorDepth: 24 // 仮の値
                    });
                    URL.revokeObjectURL(img.src);
                };
                img.onerror = () => {
                    resolve({
                        width: 'unknown',
                        height: 'unknown',
                        colorDepth: 'unknown'
                    });
                };
                img.src = URL.createObjectURL(file);
            }
        });
    }
    
    /**
     * 品質スコアを計算
     */
    calculateQualityScore() {
        if (!this.convertedResult) return 0;
        
        // 簡易的な品質スコア計算
        const qualitySlider = document.getElementById('qualitySlider');
        const baseQuality = qualitySlider ? parseInt(qualitySlider.value) : 90;
        
        // ファイルサイズ比による調整
        if (this.originalFile && this.convertedResult.fileSize) {
            const sizeRatio = this.convertedResult.fileSize / this.originalFile.size;
            const sizeAdjustment = Math.min(10, sizeRatio * 10);
            return Math.min(100, Math.max(0, baseQuality + sizeAdjustment));
        }
        
        return baseQuality;
    }
    
    /**
     * 品質クラスを取得
     */
    getQualityClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
    }
    
    /**
     * 色再現性を計算
     */
    calculateColorAccuracy() {
        // 簡易的な色再現性評価
        const format = this.convertedResult?.format;
        
        switch (format) {
            case 'png':
                return '優秀';
            case 'webp':
                return '良好';
            case 'jpg':
            case 'jpeg':
                return '標準';
            case 'gif':
                return '制限あり';
            default:
                return '不明';
        }
    }
    
    /**
     * シャープネスを計算
     */
    calculateSharpness() {
        // 簡易的なシャープネス評価
        const qualitySlider = document.getElementById('qualitySlider');
        const quality = qualitySlider ? parseInt(qualitySlider.value) : 90;
        
        if (quality >= 90) return '非常に高い';
        if (quality >= 75) return '高い';
        if (quality >= 60) return '標準';
        return '低い';
    }
    
    /**
     * 現在の変換設定を取得
     */
    getCurrentConversionSettings() {
        const settings = [];
        
        const targetFormat = document.getElementById('targetFormat');
        if (targetFormat) {
            settings.push({
                label: '出力形式',
                value: targetFormat.value.toUpperCase()
            });
        }
        
        const qualitySlider = document.getElementById('qualitySlider');
        if (qualitySlider && (targetFormat?.value === 'jpg' || targetFormat?.value === 'webp')) {
            settings.push({
                label: '品質設定',
                value: `${qualitySlider.value}%`
            });
        }
        
        const sizePreset = document.getElementById('sizePreset');
        if (sizePreset) {
            settings.push({
                label: 'サイズ設定',
                value: sizePreset.options[sizePreset.selectedIndex].text
            });
        }
        
        const transparentBg = document.getElementById('transparentBgOption');
        if (transparentBg) {
            settings.push({
                label: '透明背景',
                value: transparentBg.checked ? '有効' : '無効'
            });
        }
        
        const backgroundColor = document.getElementById('backgroundColor');
        if (backgroundColor && !transparentBg?.checked) {
            settings.push({
                label: '背景色',
                value: backgroundColor.value
            });
        }
        
        return settings;
    }
    
    /**
     * メタデータを抽出
     */
    extractMetadata() {
        const metadata = [];
        
        if (this.originalFile) {
            metadata.push({
                label: 'MIME Type',
                value: this.originalFile.type
            });
            
            metadata.push({
                label: 'ファイル作成日時',
                value: new Date(this.originalFile.lastModified).toLocaleString('ja-JP')
            });
        }
        
        metadata.push({
            label: '変換日時',
            value: new Date().toLocaleString('ja-JP')
        });
        
        metadata.push({
            label: 'ブラウザ',
            value: navigator.userAgent.split(' ').pop()
        });
        
        return metadata;
    }
    
    /**
     * 処理統計を取得
     */
    getProcessingStats() {
        const stats = [];
        
        // 仮の統計データ
        stats.push({
            label: '変換時間',
            value: '0.5秒' // 実際の実装では実測値を使用
        });
        
        stats.push({
            label: 'メモリ使用量',
            value: this.formatFileSize(this.originalFile?.size * 2 || 0)
        });
        
        stats.push({
            label: 'CPU使用率',
            value: '15%' // 仮の値
        });
        
        return stats;
    }
    
    /**
     * エクスポート機能
     */
    
    /**
     * JSON形式でエクスポート
     */
    exportAsJson() {
        const data = this.collectAllData();
        const jsonString = JSON.stringify(data, null, 2);
        
        this.downloadFile(jsonString, 'image-conversion-info.json', 'application/json');
        
        this.visualFeedback?.showSuccess('JSON形式でエクスポートしました', {
            duration: 2000
        });
    }
    
    /**
     * CSV形式でエクスポート
     */
    exportAsCsv() {
        const data = this.collectAllData();
        const csvString = this.convertToCSV(data);
        
        this.downloadFile(csvString, 'image-conversion-info.csv', 'text/csv');
        
        this.visualFeedback?.showSuccess('CSV形式でエクスポートしました', {
            duration: 2000
        });
    }
    
    /**
     * クリップボードにコピー
     */
    async copyToClipboard() {
        try {
            const data = this.collectAllData();
            const textString = this.convertToText(data);
            
            await navigator.clipboard.writeText(textString);
            
            this.visualFeedback?.showSuccess('クリップボードにコピーしました', {
                duration: 2000
            });
        } catch (error) {
            console.error('クリップボードへのコピーに失敗:', error);
            this.visualFeedback?.showError('クリップボードへのコピーに失敗しました');
        }
    }
    
    /**
     * 全データを収集
     */
    collectAllData() {
        return {
            timestamp: new Date().toISOString(),
            originalFile: this.originalFile ? {
                name: this.originalFile.name,
                size: this.originalFile.size,
                type: this.originalFile.type,
                lastModified: this.originalFile.lastModified
            } : null,
            convertedResult: this.convertedResult,
            conversionSettings: this.getCurrentConversionSettings(),
            metadata: this.extractMetadata(),
            processingStats: this.getProcessingStats(),
            qualityAnalysis: {
                score: this.calculateQualityScore(),
                colorAccuracy: this.calculateColorAccuracy(),
                sharpness: this.calculateSharpness()
            }
        };
    }
    
    /**
     * CSVに変換
     */
    convertToCSV(data) {
        const rows = [];
        
        // ヘッダー
        rows.push(['項目', '値']);
        
        // データを平坦化してCSVに変換
        const flattenData = (obj, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    flattenData(value, fullKey);
                } else {
                    rows.push([fullKey, String(value)]);
                }
            });
        };
        
        flattenData(data);
        
        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    /**
     * テキストに変換
     */
    convertToText(data) {
        let text = '画像変換詳細情報\n';
        text += '='.repeat(30) + '\n\n';
        
        text += `変換日時: ${new Date(data.timestamp).toLocaleString('ja-JP')}\n\n`;
        
        if (data.originalFile) {
            text += '元ファイル情報:\n';
            text += `  ファイル名: ${data.originalFile.name}\n`;
            text += `  ファイルサイズ: ${this.formatFileSize(data.originalFile.size)}\n`;
            text += `  形式: ${data.originalFile.type}\n\n`;
        }
        
        if (data.convertedResult) {
            text += '変換後情報:\n';
            text += `  形式: ${data.convertedResult.format}\n`;
            text += `  ファイルサイズ: ${this.formatFileSize(data.convertedResult.fileSize)}\n\n`;
        }
        
        text += '変換設定:\n';
        data.conversionSettings.forEach(setting => {
            text += `  ${setting.label}: ${setting.value}\n`;
        });
        
        return text;
    }
    
    /**
     * ファイルをダウンロード
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * リソースのクリーンアップ
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.originalFile = null;
        this.convertedResult = null;
        this.analysisData = {};
    }
}

// グローバルに公開
window.detailedInfo = null;