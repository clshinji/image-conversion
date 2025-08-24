// サイズ調整コントローラー

import { SIZE_PRESETS, PRESET_SIZES } from '../constants.js';
import { calculateOutputSize, formatFileSize } from '../utils/helpers.js';

/**
 * サイズ調整UIコントローラー
 * 出力サイズの設定とプレビューを管理
 */
export class SizeController {
    constructor() {
        this.elements = {
            sizePreset: document.getElementById('sizePreset'),
            sizePreview: document.getElementById('sizePreview'),
            currentSizeDisplay: document.getElementById('currentSizeDisplay'),
            outputSizeDisplay: document.getElementById('outputSizeDisplay'),
            aspectRatioDisplay: document.getElementById('aspectRatioDisplay'),
            customSizeInputs: document.getElementById('customSizeInputs'),
            maintainAspectRatio: document.getElementById('maintainAspectRatio'),
            customWidth: document.getElementById('customWidth'),
            customHeight: document.getElementById('customHeight'),
            widthFeedback: document.getElementById('widthFeedback'),
            heightFeedback: document.getElementById('heightFeedback'),
            swapDimensions: document.getElementById('swapDimensions'),
            resetToOriginal: document.getElementById('resetToOriginal'),
            sizeCalculation: document.getElementById('sizeCalculation')
        };
        
        this.originalDimensions = null;
        this.currentPreset = SIZE_PRESETS.ORIGINAL;
        this.customDimensions = { width: null, height: null };
        this.maintainAspectRatio = true;
        this.isUpdating = false;
        
        this.setupEventListeners();
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // サイズプリセット選択の変更
        this.elements.sizePreset.addEventListener('change', (event) => {
            this.handlePresetChange(event.target.value);
        });
        
        // アスペクト比維持の切り替え
        this.elements.maintainAspectRatio.addEventListener('change', (event) => {
            this.maintainAspectRatio = event.target.checked;
            this.updateSizeCalculation();
            this.dispatchSizeChangeEvent();
        });
        
        // カスタム幅の変更
        this.elements.customWidth.addEventListener('input', (event) => {
            this.handleCustomWidthChange(parseInt(event.target.value) || null);
        });
        
        // カスタム高さの変更
        this.elements.customHeight.addEventListener('input', (event) => {
            this.handleCustomHeightChange(parseInt(event.target.value) || null);
        });
        
        // 縦横入れ替えボタン
        this.elements.swapDimensions.addEventListener('click', () => {
            this.swapDimensions();
        });
        
        // 元のサイズに戻すボタン
        this.elements.resetToOriginal.addEventListener('click', () => {
            this.resetToOriginal();
        });
    }
    
    /**
     * 元画像の寸法を設定
     * @param {object} dimensions - 元画像の寸法 {width, height}
     */
    setOriginalDimensions(dimensions) {
        this.originalDimensions = dimensions;
        this.updateCurrentSizeDisplay();
        this.updateSizeCalculation();
        
        // 元のサイズボタンを有効化
        if (this.elements.resetToOriginal) {
            this.elements.resetToOriginal.disabled = false;
        }
    }
    
    /**
     * プリセット変更を処理
     * @param {string} preset - 選択されたプリセット
     */
    handlePresetChange(preset) {
        if (this.isUpdating) return;
        
        this.currentPreset = preset;
        
        // カスタムサイズ入力の表示/非表示
        const isCustom = preset === SIZE_PRESETS.CUSTOM;
        this.elements.customSizeInputs.style.display = isCustom ? 'block' : 'none';
        
        if (isCustom) {
            // カスタムモードの場合、現在の値を維持
            this.updateCustomInputs();
        } else {
            // プリセットモードの場合、カスタム値をクリア
            this.customDimensions = { width: null, height: null };
        }
        
        this.updateSizeCalculation();
        this.dispatchSizeChangeEvent();
    }
    
    /**
     * カスタム幅の変更を処理
     * @param {number|null} width - 新しい幅
     */
    handleCustomWidthChange(width) {
        if (this.isUpdating) return;
        
        this.customDimensions.width = width;
        
        // アスペクト比を維持する場合、高さを自動計算
        if (this.maintainAspectRatio && width && this.originalDimensions) {
            const aspectRatio = this.originalDimensions.width / this.originalDimensions.height;
            const calculatedHeight = Math.round(width / aspectRatio);
            
            this.customDimensions.height = calculatedHeight;
            this.isUpdating = true;
            this.elements.customHeight.value = calculatedHeight;
            this.isUpdating = false;
        }
        
        this.validateCustomInput('width', width);
        this.updateSizeCalculation();
        this.dispatchSizeChangeEvent();
    }
    
    /**
     * カスタム高さの変更を処理
     * @param {number|null} height - 新しい高さ
     */
    handleCustomHeightChange(height) {
        if (this.isUpdating) return;
        
        this.customDimensions.height = height;
        
        // アスペクト比を維持する場合、幅を自動計算
        if (this.maintainAspectRatio && height && this.originalDimensions) {
            const aspectRatio = this.originalDimensions.width / this.originalDimensions.height;
            const calculatedWidth = Math.round(height * aspectRatio);
            
            this.customDimensions.width = calculatedWidth;
            this.isUpdating = true;
            this.elements.customWidth.value = calculatedWidth;
            this.isUpdating = false;
        }
        
        this.validateCustomInput('height', height);
        this.updateSizeCalculation();
        this.dispatchSizeChangeEvent();
    }
    
    /**
     * 縦横を入れ替え
     */
    swapDimensions() {
        const currentWidth = this.customDimensions.width;
        const currentHeight = this.customDimensions.height;
        
        this.isUpdating = true;
        this.elements.customWidth.value = currentHeight || '';
        this.elements.customHeight.value = currentWidth || '';
        this.isUpdating = false;
        
        this.customDimensions.width = currentHeight;
        this.customDimensions.height = currentWidth;
        
        this.updateSizeCalculation();
        this.dispatchSizeChangeEvent();
    }
    
    /**
     * 元のサイズに戻す
     */
    resetToOriginal() {
        if (!this.originalDimensions) return;
        
        this.isUpdating = true;
        this.elements.customWidth.value = this.originalDimensions.width;
        this.elements.customHeight.value = this.originalDimensions.height;
        this.isUpdating = false;
        
        this.customDimensions.width = this.originalDimensions.width;
        this.customDimensions.height = this.originalDimensions.height;
        
        this.updateSizeCalculation();
        this.dispatchSizeChangeEvent();
    }
    
    /**
     * カスタム入力値を検証
     * @param {string} type - 'width' または 'height'
     * @param {number|null} value - 検証する値
     */
    validateCustomInput(type, value) {
        const feedbackElement = type === 'width' ? this.elements.widthFeedback : this.elements.heightFeedback;
        
        if (!feedbackElement) return;
        
        // フィードバックをクリア
        feedbackElement.textContent = '';
        feedbackElement.className = 'input-feedback';
        
        if (value === null || value === undefined) {
            return; // 空の場合は何もしない
        }
        
        if (value <= 0) {
            feedbackElement.textContent = '1以上の値を入力してください';
            feedbackElement.classList.add('error');
        } else if (value > 10000) {
            feedbackElement.textContent = '10000以下の値を推奨します';
            feedbackElement.classList.add('warning');
        } else if (value < 10) {
            feedbackElement.textContent = '10以上の値を推奨します';
            feedbackElement.classList.add('warning');
        } else {
            feedbackElement.textContent = '✓';
            feedbackElement.classList.add('success');
        }
    }
    
    /**
     * 現在のサイズ表示を更新
     */
    updateCurrentSizeDisplay() {
        if (!this.originalDimensions) {
            this.elements.currentSizeDisplay.textContent = '--';
            return;
        }
        
        const { width, height } = this.originalDimensions;
        this.elements.currentSizeDisplay.textContent = `${width} × ${height}px`;
    }
    
    /**
     * サイズ計算結果を更新
     */
    updateSizeCalculation() {
        if (!this.originalDimensions) {
            this.elements.outputSizeDisplay.textContent = '--';
            this.elements.aspectRatioDisplay.textContent = 'アスペクト比: --';
            this.elements.sizeCalculation.innerHTML = '<small>元画像が読み込まれていません</small>';
            return;
        }
        
        const outputSize = this.calculateOutputSize();
        
        // 出力サイズ表示を更新
        this.elements.outputSizeDisplay.textContent = `${outputSize.width} × ${outputSize.height}px`;
        
        // アスペクト比表示を更新
        const aspectRatio = (outputSize.width / outputSize.height).toFixed(2);
        this.elements.aspectRatioDisplay.textContent = `アスペクト比: ${aspectRatio}`;
        
        // 詳細計算結果を更新
        this.updateDetailedCalculation(outputSize);
    }
    
    /**
     * 詳細計算結果を更新
     * @param {object} outputSize - 出力サイズ {width, height}
     */
    updateDetailedCalculation(outputSize) {
        const { width: origWidth, height: origHeight } = this.originalDimensions;
        const { width: outWidth, height: outHeight } = outputSize;
        
        // スケール比を計算
        const scaleX = outWidth / origWidth;
        const scaleY = outHeight / origHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // ファイルサイズの推定
        const estimatedPixels = outWidth * outHeight;
        const estimatedSize = estimatedPixels * 4; // RGBA = 4バイト/ピクセル
        
        // 変更の種類を判定
        let changeType = '';
        if (scale > 1) {
            changeType = `拡大 (${(scale * 100).toFixed(0)}%)`;
        } else if (scale < 1) {
            changeType = `縮小 (${(scale * 100).toFixed(0)}%)`;
        } else {
            changeType = '変更なし';
        }
        
        // 品質への影響を評価
        let qualityImpact = '';
        if (scale > 2) {
            qualityImpact = '<span style="color: #f39c12;">⚠️ 大幅な拡大により品質が低下する可能性があります</span>';
        } else if (scale > 1.5) {
            qualityImpact = '<span style="color: #f39c12;">注意: 拡大により品質が低下する場合があります</span>';
        } else if (scale < 0.5) {
            qualityImpact = '<span style="color: #17a2b8;">ℹ️ 大幅な縮小により詳細が失われる可能性があります</span>';
        }
        
        this.elements.sizeCalculation.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong>${changeType}</strong>
                ${qualityImpact ? `<br>${qualityImpact}` : ''}
            </div>
            <div style="font-size: 0.8rem; color: #6c757d;">
                推定メモリ使用量: ${formatFileSize(estimatedSize)}
            </div>
        `;
    }
    
    /**
     * カスタム入力値を更新
     */
    updateCustomInputs() {
        if (this.customDimensions.width) {
            this.elements.customWidth.value = this.customDimensions.width;
        }
        if (this.customDimensions.height) {
            this.elements.customHeight.value = this.customDimensions.height;
        }
    }
    
    /**
     * 出力サイズを計算
     * @returns {object} 計算された出力サイズ {width, height}
     */
    calculateOutputSize() {
        if (!this.originalDimensions) {
            return { width: 0, height: 0 };
        }
        
        const { width: origWidth, height: origHeight } = this.originalDimensions;
        
        switch (this.currentPreset) {
            case SIZE_PRESETS.ORIGINAL:
                return { width: origWidth, height: origHeight };
                
            case SIZE_PRESETS.CUSTOM:
                return calculateOutputSize(
                    origWidth,
                    origHeight,
                    this.customDimensions.width,
                    this.customDimensions.height,
                    this.maintainAspectRatio
                );
                
            default:
                // プリセットサイズの処理
                const presetSize = PRESET_SIZES[this.currentPreset];
                if (presetSize) {
                    return calculateOutputSize(
                        origWidth,
                        origHeight,
                        presetSize.width,
                        presetSize.height,
                        this.maintainAspectRatio
                    );
                }
                
                // プリセットが見つからない場合、文字列から解析
                const match = this.currentPreset.match(/^(\d+)x(\d+)$/);
                if (match) {
                    const presetWidth = parseInt(match[1]);
                    const presetHeight = parseInt(match[2]);
                    return calculateOutputSize(
                        origWidth,
                        origHeight,
                        presetWidth,
                        presetHeight,
                        this.maintainAspectRatio
                    );
                }
                
                return { width: origWidth, height: origHeight };
        }
    }
    
    /**
     * サイズ変更イベントを発火
     */
    dispatchSizeChangeEvent() {
        const outputSize = this.calculateOutputSize();
        
        const event = new CustomEvent('sizeChange', {
            detail: {
                preset: this.currentPreset,
                originalDimensions: this.originalDimensions,
                outputSize: outputSize,
                customDimensions: { ...this.customDimensions },
                maintainAspectRatio: this.maintainAspectRatio
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 現在の設定を取得
     * @returns {object} 現在のサイズ設定
     */
    getCurrentSettings() {
        return {
            preset: this.currentPreset,
            customDimensions: { ...this.customDimensions },
            maintainAspectRatio: this.maintainAspectRatio,
            outputSize: this.calculateOutputSize()
        };
    }
    
    /**
     * 設定を復元
     * @param {object} settings - 復元する設定
     */
    restoreSettings(settings) {
        if (!settings) return;
        
        this.isUpdating = true;
        
        // プリセットを設定
        if (settings.preset) {
            this.currentPreset = settings.preset;
            this.elements.sizePreset.value = settings.preset;
            this.handlePresetChange(settings.preset);
        }
        
        // カスタム寸法を設定
        if (settings.customDimensions) {
            this.customDimensions = { ...settings.customDimensions };
            this.updateCustomInputs();
        }
        
        // アスペクト比維持設定
        if (settings.maintainAspectRatio !== undefined) {
            this.maintainAspectRatio = settings.maintainAspectRatio;
            this.elements.maintainAspectRatio.checked = settings.maintainAspectRatio;
        }
        
        this.isUpdating = false;
        this.updateSizeCalculation();
    }
    
    /**
     * 設定をリセット
     */
    reset() {
        this.isUpdating = true;
        
        this.currentPreset = SIZE_PRESETS.ORIGINAL;
        this.customDimensions = { width: null, height: null };
        this.maintainAspectRatio = true;
        
        this.elements.sizePreset.value = SIZE_PRESETS.ORIGINAL;
        this.elements.maintainAspectRatio.checked = true;
        this.elements.customWidth.value = '';
        this.elements.customHeight.value = '';
        this.elements.customSizeInputs.style.display = 'none';
        
        // フィードバックをクリア
        this.elements.widthFeedback.textContent = '';
        this.elements.heightFeedback.textContent = '';
        this.elements.widthFeedback.className = 'input-feedback';
        this.elements.heightFeedback.className = 'input-feedback';
        
        this.isUpdating = false;
        this.updateSizeCalculation();
    }
    
    /**
     * 現在の状態を取得
     * @returns {object} 現在の状態
     */
    getState() {
        return {
            currentPreset: this.currentPreset,
            customDimensions: { ...this.customDimensions },
            maintainAspectRatio: this.maintainAspectRatio,
            originalDimensions: this.originalDimensions,
            outputSize: this.calculateOutputSize()
        };
    }
}