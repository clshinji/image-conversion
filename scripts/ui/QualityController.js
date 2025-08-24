// 品質設定コントローラー

import { SUPPORTED_FORMATS, QUALITY_SETTINGS } from '../constants.js';
import { formatFileSize } from '../utils/helpers.js';

/**
 * 品質設定UIコントローラー
 * JPEG、WebP形式の品質設定とリアルタイムプレビューを管理
 */
export class QualityController {
    constructor() {
        this.elements = {
            qualityGroup: document.getElementById('qualityGroup'),
            qualitySlider: document.getElementById('qualitySlider'),
            qualityValue: document.getElementById('qualityValue'),
            qualityFill: document.getElementById('qualityFill'),
            estimatedSize: document.getElementById('estimatedSize'),
            presetButtons: document.querySelectorAll('.quality-preset-btn')
        };
        
        this.currentFormat = null;
        this.currentQuality = 90;
        this.originalImageData = null;
        this.previewUpdateTimeout = null;
        this.isUpdating = false;
        
        // 品質設定の保存/復元用
        this.savedQualities = this.loadSavedQualities();
        
        this.setupEventListeners();
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 品質スライダーの変更イベント
        this.elements.qualitySlider.addEventListener('input', (event) => {
            this.handleQualityChange(parseInt(event.target.value), true);
        });
        
        // 品質スライダーの変更完了イベント（プレビュー更新用）
        this.elements.qualitySlider.addEventListener('change', (event) => {
            this.handleQualityChange(parseInt(event.target.value), false);
        });
        
        // プリセットボタンのクリックイベント
        this.elements.presetButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const quality = parseInt(event.target.dataset.quality);
                this.setQuality(quality);
                this.handleQualityChange(quality, false);
            });
        });
    }
    
    /**
     * 品質設定を表示
     * @param {string} format - 画像形式
     * @param {object} imageData - 画像データ（サイズ推定用）
     */
    show(format, imageData = null) {
        if (!this.isQualityFormat(format)) {
            this.hide();
            return;
        }
        
        this.currentFormat = format;
        this.originalImageData = imageData;
        
        // 保存された品質設定を復元
        const savedQuality = this.savedQualities[format] || QUALITY_SETTINGS.DEFAULT[format] || 90;
        this.setQuality(savedQuality);
        
        // UI要素を表示
        this.elements.qualityGroup.style.display = 'block';
        
        // 説明文を形式に応じて更新
        this.updateDescription(format);
        
        // 初期のファイルサイズ推定
        this.updateEstimatedSize();
        
        console.log(`QualityController: ${format}用の品質設定を表示`);
    }
    
    /**
     * 品質設定を非表示
     */
    hide() {
        this.elements.qualityGroup.style.display = 'none';
        this.currentFormat = null;
        this.originalImageData = null;
    }
    
    /**
     * 品質値を設定
     * @param {number} quality - 品質値（10-100）
     */
    setQuality(quality) {
        const clampedQuality = Math.max(10, Math.min(100, quality));
        this.currentQuality = clampedQuality;
        
        // UI要素を更新
        this.elements.qualitySlider.value = clampedQuality;
        this.elements.qualityValue.textContent = `${clampedQuality}%`;
        
        // 品質バーを更新
        const percentage = (clampedQuality - 10) / 90 * 100;
        this.elements.qualityFill.style.width = `${percentage}%`;
        
        // プリセットボタンの状態を更新
        this.updatePresetButtons(clampedQuality);
        
        // 品質値の色を更新
        this.updateQualityValueColor(clampedQuality);
    }
    
    /**
     * 現在の品質値を取得
     * @returns {number} 品質値
     */
    getQuality() {
        return this.currentQuality;
    }
    
    /**
     * 品質変更を処理
     * @param {number} quality - 新しい品質値
     * @param {boolean} isRealtime - リアルタイム更新かどうか
     */
    handleQualityChange(quality, isRealtime) {
        if (this.isUpdating) return;
        
        this.setQuality(quality);
        
        // 品質設定を保存
        this.saveQuality(this.currentFormat, quality);
        
        // ファイルサイズ推定を更新
        this.updateEstimatedSize();
        
        // リアルタイムプレビュー更新
        if (isRealtime) {
            this.schedulePreviewUpdate();
        } else {
            this.updatePreview();
        }
        
        // カスタムイベントを発火
        this.dispatchQualityChangeEvent(quality, isRealtime);
    }
    
    /**
     * プレビュー更新をスケジュール（デバウンス処理）
     */
    schedulePreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        
        this.previewUpdateTimeout = setTimeout(() => {
            this.updatePreview();
        }, 300); // 300ms後に更新
    }
    
    /**
     * プレビューを更新
     */
    async updatePreview() {
        if (!this.currentFormat || this.isUpdating) return;
        
        try {
            this.isUpdating = true;
            
            // プレビュー更新イベントを発火
            const event = new CustomEvent('qualityPreviewUpdate', {
                detail: {
                    format: this.currentFormat,
                    quality: this.currentQuality
                }
            });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('QualityController: プレビュー更新エラー:', error);
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * 推定ファイルサイズを更新
     */
    updateEstimatedSize() {
        if (!this.originalImageData || !this.currentFormat) {
            this.elements.estimatedSize.textContent = '推定ファイルサイズ: 計算中...';
            return;
        }
        
        try {
            const estimatedSize = this.calculateEstimatedSize(
                this.originalImageData.width || 800,
                this.originalImageData.height || 600,
                this.currentFormat,
                this.currentQuality
            );
            
            const sizeText = formatFileSize(estimatedSize);
            const compressionRatio = this.calculateCompressionRatio(this.currentQuality);
            
            this.elements.estimatedSize.innerHTML = `
                推定ファイルサイズ: <strong>${sizeText}</strong>
                <small>(圧縮率: ${compressionRatio}%)</small>
            `;
            
        } catch (error) {
            console.error('QualityController: ファイルサイズ推定エラー:', error);
            this.elements.estimatedSize.textContent = '推定ファイルサイズ: 計算できません';
        }
    }
    
    /**
     * ファイルサイズを推定
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {string} format - 形式
     * @param {number} quality - 品質
     * @returns {number} 推定ファイルサイズ（バイト）
     */
    calculateEstimatedSize(width, height, format, quality) {
        const pixels = width * height;
        
        switch (format) {
            case SUPPORTED_FORMATS.JPG:
            case SUPPORTED_FORMATS.JPEG:
                // JPEG: 品質に応じて0.3-3バイト/ピクセル
                const jpegRatio = (quality / 100) * 2.7 + 0.3;
                return Math.round(pixels * jpegRatio);
                
            case SUPPORTED_FORMATS.WEBP:
                // WebP: JPEGより約25-35%小さい
                const webpRatio = ((quality / 100) * 2.7 + 0.3) * 0.7;
                return Math.round(pixels * webpRatio);
                
            default:
                return Math.round(pixels * 3); // デフォルト推定
        }
    }
    
    /**
     * 圧縮率を計算
     * @param {number} quality - 品質
     * @returns {number} 圧縮率
     */
    calculateCompressionRatio(quality) {
        // 品質から圧縮率を逆算（簡易計算）
        return Math.round(100 - (quality * 0.8));
    }
    
    /**
     * プリセットボタンの状態を更新
     * @param {number} quality - 現在の品質
     */
    updatePresetButtons(quality) {
        this.elements.presetButtons.forEach(button => {
            const presetQuality = parseInt(button.dataset.quality);
            if (Math.abs(presetQuality - quality) <= 2) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * 品質値の色を更新
     * @param {number} quality - 品質値
     */
    updateQualityValueColor(quality) {
        const element = this.elements.qualityValue;
        
        // 品質に応じて色を変更
        if (quality < 50) {
            element.style.borderColor = '#e74c3c';
            element.style.color = '#c0392b';
        } else if (quality < 80) {
            element.style.borderColor = '#f39c12';
            element.style.color = '#d68910';
        } else {
            element.style.borderColor = '#27ae60';
            element.style.color = '#229954';
        }
    }
    
    /**
     * 説明文を更新
     * @param {string} format - 画像形式
     */
    updateDescription(format) {
        const descriptionElement = this.elements.qualityGroup.querySelector('.option-description');
        
        let description = '';
        switch (format) {
            case SUPPORTED_FORMATS.JPG:
            case SUPPORTED_FORMATS.JPEG:
                description = 'JPEG形式の圧縮品質を設定します（品質が高いほどファイルサイズが大きくなります）';
                break;
            case SUPPORTED_FORMATS.WEBP:
                description = 'WebP形式の圧縮品質を設定します（JPEGより高効率な圧縮が可能です）';
                break;
            default:
                description = '圧縮品質を設定します（品質が高いほどファイルサイズが大きくなります）';
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }
    }
    
    /**
     * 品質変更イベントを発火
     * @param {number} quality - 品質値
     * @param {boolean} isRealtime - リアルタイム更新かどうか
     */
    dispatchQualityChangeEvent(quality, isRealtime) {
        const event = new CustomEvent('qualityChange', {
            detail: {
                format: this.currentFormat,
                quality: quality,
                isRealtime: isRealtime
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 品質設定を保存
     * @param {string} format - 形式
     * @param {number} quality - 品質
     */
    saveQuality(format, quality) {
        if (!format) return;
        
        this.savedQualities[format] = quality;
        
        try {
            localStorage.setItem('imageConverter_qualitySettings', JSON.stringify(this.savedQualities));
        } catch (error) {
            console.warn('QualityController: 品質設定の保存に失敗:', error);
        }
    }
    
    /**
     * 保存された品質設定を読み込み
     * @returns {object} 保存された品質設定
     */
    loadSavedQualities() {
        try {
            const saved = localStorage.getItem('imageConverter_qualitySettings');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('QualityController: 品質設定の読み込みに失敗:', error);
            return {};
        }
    }
    
    /**
     * 品質設定をリセット
     */
    resetQualities() {
        this.savedQualities = {};
        try {
            localStorage.removeItem('imageConverter_qualitySettings');
        } catch (error) {
            console.warn('QualityController: 品質設定のリセットに失敗:', error);
        }
    }
    
    /**
     * 形式が品質設定をサポートするかチェック
     * @param {string} format - 画像形式
     * @returns {boolean} サポートするかどうか
     */
    isQualityFormat(format) {
        return [
            SUPPORTED_FORMATS.JPG,
            SUPPORTED_FORMATS.JPEG,
            SUPPORTED_FORMATS.WEBP
        ].includes(format);
    }
    
    /**
     * 画像データを設定（サイズ推定用）
     * @param {object} imageData - 画像データ
     */
    setImageData(imageData) {
        this.originalImageData = imageData;
        this.updateEstimatedSize();
    }
    
    /**
     * 品質設定の状態を取得
     * @returns {object} 現在の状態
     */
    getState() {
        return {
            currentFormat: this.currentFormat,
            currentQuality: this.currentQuality,
            isVisible: this.elements.qualityGroup.style.display !== 'none',
            savedQualities: { ...this.savedQualities }
        };
    }
    
    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
            this.previewUpdateTimeout = null;
        }
        
        this.isUpdating = false;
        this.originalImageData = null;
    }
}