// 背景色・透明度設定コントローラー

import { SUPPORTED_FORMATS } from '../constants.js';
import { isValidColor } from '../utils/helpers.js';

/**
 * 背景色・透明度設定UIコントローラー
 * 透明背景の設定と背景色の選択を管理
 */
export class BackgroundController {
    constructor() {
        this.elements = {
            backgroundGroup: document.getElementById('backgroundGroup'),
            transparentBgOption: document.getElementById('transparentBgOption'),
            transparencyInfo: document.getElementById('transparencyInfo'),
            backgroundColorGroup: document.getElementById('backgroundColorGroup'),
            backgroundColor: document.getElementById('backgroundColor'),
            colorSwatch: document.getElementById('colorSwatch'),
            colorValue: document.getElementById('colorValue'),
            colorFormatInfo: document.getElementById('colorFormatInfo'),
            backgroundPreview: document.getElementById('backgroundPreview'),
            previewSample: document.getElementById('previewSample'),
            backgroundDescription: document.getElementById('backgroundDescription'),
            presetButtons: document.querySelectorAll('.color-preset-btn')
        };
        
        this.currentFormat = null;
        this.transparentBackground = true;
        this.backgroundColor = '#ffffff';
        this.isUpdating = false;
        
        // 背景色設定の保存/復元用
        this.savedBackgroundColors = this.loadSavedBackgroundColors();
        
        this.setupEventListeners();
        this.updateColorDisplay();
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 透明背景オプションの変更
        this.elements.transparentBgOption.addEventListener('change', (event) => {
            this.handleTransparencyChange(event.target.checked);
        });
        
        // 背景色の変更
        this.elements.backgroundColor.addEventListener('input', (event) => {
            this.handleBackgroundColorChange(event.target.value, true);
        });
        
        this.elements.backgroundColor.addEventListener('change', (event) => {
            this.handleBackgroundColorChange(event.target.value, false);
        });
        
        // プリセット色ボタンのクリック
        this.elements.presetButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const color = event.currentTarget.dataset.color;
                this.setBackgroundColor(color);
                this.handleBackgroundColorChange(color, false);
            });
        });
    }
    
    /**
     * 形式に応じてUIを更新
     * @param {string} format - 画像形式
     */
    updateForFormat(format) {
        this.currentFormat = format;
        
        const supportsTransparency = this.formatSupportsTransparency(format);
        
        // 透明度サポート情報を更新
        this.updateTransparencyInfo(format, supportsTransparency);
        
        // 背景色グループの表示/非表示
        this.updateBackgroundColorVisibility(supportsTransparency);
        
        // 形式固有の情報を更新
        this.updateFormatInfo(format, supportsTransparency);
        
        // 説明文を更新
        this.updateDescription(format, supportsTransparency);
        
        // 保存された背景色を復元
        this.restoreBackgroundColorForFormat(format);
    }
    
    /**
     * 透明度変更を処理
     * @param {boolean} transparent - 透明背景を有効にするか
     */
    handleTransparencyChange(transparent) {
        if (this.isUpdating) return;
        
        this.transparentBackground = transparent;
        
        // 背景色グループの表示/非表示を更新
        const supportsTransparency = this.formatSupportsTransparency(this.currentFormat);
        this.updateBackgroundColorVisibility(supportsTransparency);
        
        // プレビューを更新
        this.updatePreview();
        
        // カスタムイベントを発火
        this.dispatchBackgroundChangeEvent();
    }
    
    /**
     * 背景色変更を処理
     * @param {string} color - 新しい背景色
     * @param {boolean} isRealtime - リアルタイム更新かどうか
     */
    handleBackgroundColorChange(color, isRealtime) {
        if (this.isUpdating || !isValidColor(color)) return;
        
        this.backgroundColor = color;
        
        // 色表示を更新
        this.updateColorDisplay();
        
        // プリセットボタンの状態を更新
        this.updatePresetButtons(color);
        
        // プレビューを更新
        this.updatePreview();
        
        // 背景色を保存
        if (!isRealtime && this.currentFormat) {
            this.saveBackgroundColor(this.currentFormat, color);
        }
        
        // カスタムイベントを発火
        this.dispatchBackgroundChangeEvent(isRealtime);
    }
    
    /**
     * 背景色を設定
     * @param {string} color - 背景色
     */
    setBackgroundColor(color) {
        if (!isValidColor(color)) return;
        
        this.isUpdating = true;
        this.backgroundColor = color;
        this.elements.backgroundColor.value = color;
        this.updateColorDisplay();
        this.updatePresetButtons(color);
        this.updatePreview();
        this.isUpdating = false;
    }
    
    /**
     * 透明度情報を更新
     * @param {string} format - 画像形式
     * @param {boolean} supportsTransparency - 透明度をサポートするか
     */
    updateTransparencyInfo(format, supportsTransparency) {
        const info = this.elements.transparencyInfo.querySelector('small');
        
        if (supportsTransparency) {
            info.textContent = `${format.toUpperCase()}形式では透明度が保持されます`;
            info.style.color = '#28a745';
        } else {
            info.textContent = `${format.toUpperCase()}形式では透明度がサポートされません`;
            info.style.color = '#f39c12';
        }
    }
    
    /**
     * 背景色グループの表示を更新
     * @param {boolean} supportsTransparency - 透明度をサポートするか
     */
    updateBackgroundColorVisibility(supportsTransparency) {
        const shouldShow = !supportsTransparency || !this.transparentBackground;
        this.elements.backgroundColorGroup.style.display = shouldShow ? 'block' : 'none';
        
        // 透明背景オプションの有効/無効
        this.elements.transparentBgOption.disabled = !supportsTransparency;
        
        if (!supportsTransparency) {
            // 透明度をサポートしない形式では強制的に背景色を使用
            this.isUpdating = true;
            this.elements.transparentBgOption.checked = false;
            this.transparentBackground = false;
            this.isUpdating = false;
        }
    }
    
    /**
     * 形式固有の情報を更新
     * @param {string} format - 画像形式
     * @param {boolean} supportsTransparency - 透明度をサポートするか
     */
    updateFormatInfo(format, supportsTransparency) {
        const info = this.elements.colorFormatInfo;
        
        if (!supportsTransparency) {
            info.textContent = `${format.toUpperCase()}形式では背景色が必要です`;
            info.style.display = 'block';
        } else {
            info.style.display = 'none';
        }
    }
    
    /**
     * 説明文を更新
     * @param {string} format - 画像形式
     * @param {boolean} supportsTransparency - 透明度をサポートするか
     */
    updateDescription(format, supportsTransparency) {
        let description = '';
        
        if (supportsTransparency) {
            description = `${format.toUpperCase()}形式では透明背景を維持できます。背景色を設定すると透明部分が置き換えられます。`;
        } else {
            description = `${format.toUpperCase()}形式では透明度がサポートされないため、背景色が適用されます。`;
        }
        
        this.elements.backgroundDescription.textContent = description;
    }
    
    /**
     * 色表示を更新
     */
    updateColorDisplay() {
        const color = this.backgroundColor;
        
        // カラースウォッチを更新
        this.elements.colorSwatch.style.backgroundColor = color;
        
        // カラー値を更新
        this.elements.colorValue.textContent = color.toUpperCase();
        
        // カラーピッカーの値を更新
        if (this.elements.backgroundColor.value !== color) {
            this.elements.backgroundColor.value = color;
        }
    }
    
    /**
     * プリセットボタンの状態を更新
     * @param {string} color - 現在の色
     */
    updatePresetButtons(color) {
        this.elements.presetButtons.forEach(button => {
            const presetColor = button.dataset.color;
            if (presetColor.toLowerCase() === color.toLowerCase()) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * プレビューを更新
     */
    updatePreview() {
        const sample = this.elements.previewSample;
        
        if (this.transparentBackground && this.formatSupportsTransparency(this.currentFormat)) {
            // 透明背景の場合、チェッカーボードパターンを表示
            sample.style.backgroundColor = 'transparent';
            sample.style.backgroundImage = `
                linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
            `;
            sample.style.backgroundSize = '20px 20px';
            sample.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
        } else {
            // 背景色を適用
            sample.style.backgroundColor = this.backgroundColor;
            sample.style.backgroundImage = 'none';
        }
        
        // テキストの色を背景色に応じて調整
        this.updateSampleTextColor();
    }
    
    /**
     * サンプルテキストの色を更新
     */
    updateSampleTextColor() {
        const sample = this.elements.previewSample.querySelector('.sample-content');
        
        if (this.transparentBackground && this.formatSupportsTransparency(this.currentFormat)) {
            sample.style.color = '#495057';
            sample.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.8)';
        } else {
            // 背景色の明度に基づいてテキスト色を決定
            const brightness = this.getColorBrightness(this.backgroundColor);
            if (brightness > 128) {
                sample.style.color = '#212529';
                sample.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.8)';
            } else {
                sample.style.color = '#ffffff';
                sample.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.8)';
            }
        }
    }
    
    /**
     * 色の明度を取得
     * @param {string} color - HEXカラーコード
     * @returns {number} 明度（0-255）
     */
    getColorBrightness(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 明度計算（ITU-R BT.709）
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    /**
     * 形式が透明度をサポートするかチェック
     * @param {string} format - 画像形式
     * @returns {boolean} サポートするかどうか
     */
    formatSupportsTransparency(format) {
        if (!format) return true;
        
        const transparencyFormats = [
            SUPPORTED_FORMATS.PNG,
            SUPPORTED_FORMATS.WEBP,
            SUPPORTED_FORMATS.GIF,
            SUPPORTED_FORMATS.SVG
        ];
        
        return transparencyFormats.includes(format);
    }
    
    /**
     * 背景変更イベントを発火
     * @param {boolean} isRealtime - リアルタイム更新かどうか
     */
    dispatchBackgroundChangeEvent(isRealtime = false) {
        const event = new CustomEvent('backgroundChange', {
            detail: {
                format: this.currentFormat,
                transparentBackground: this.transparentBackground,
                backgroundColor: this.backgroundColor,
                isRealtime: isRealtime
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 背景色を保存
     * @param {string} format - 形式
     * @param {string} color - 背景色
     */
    saveBackgroundColor(format, color) {
        if (!format) return;
        
        this.savedBackgroundColors[format] = color;
        
        try {
            localStorage.setItem('imageConverter_backgroundColors', JSON.stringify(this.savedBackgroundColors));
        } catch (error) {
            console.warn('BackgroundController: 背景色設定の保存に失敗:', error);
        }
    }
    
    /**
     * 保存された背景色を読み込み
     * @returns {object} 保存された背景色設定
     */
    loadSavedBackgroundColors() {
        try {
            const saved = localStorage.getItem('imageConverter_backgroundColors');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('BackgroundController: 背景色設定の読み込みに失敗:', error);
            return {};
        }
    }
    
    /**
     * 形式用の背景色を復元
     * @param {string} format - 画像形式
     */
    restoreBackgroundColorForFormat(format) {
        const savedColor = this.savedBackgroundColors[format];
        if (savedColor && isValidColor(savedColor)) {
            this.setBackgroundColor(savedColor);
        }
    }
    
    /**
     * 現在の設定を取得
     * @returns {object} 現在の背景設定
     */
    getCurrentSettings() {
        return {
            transparentBackground: this.transparentBackground,
            backgroundColor: this.backgroundColor,
            format: this.currentFormat
        };
    }
    
    /**
     * 設定を復元
     * @param {object} settings - 復元する設定
     */
    restoreSettings(settings) {
        if (!settings) return;
        
        this.isUpdating = true;
        
        if (settings.transparentBackground !== undefined) {
            this.transparentBackground = settings.transparentBackground;
            this.elements.transparentBgOption.checked = settings.transparentBackground;
        }
        
        if (settings.backgroundColor && isValidColor(settings.backgroundColor)) {
            this.setBackgroundColor(settings.backgroundColor);
        }
        
        this.isUpdating = false;
        this.updatePreview();
    }
    
    /**
     * 設定をリセット
     */
    reset() {
        this.isUpdating = true;
        
        this.transparentBackground = true;
        this.backgroundColor = '#ffffff';
        
        this.elements.transparentBgOption.checked = true;
        this.setBackgroundColor('#ffffff');
        
        this.isUpdating = false;
        this.updatePreview();
    }
    
    /**
     * 現在の状態を取得
     * @returns {object} 現在の状態
     */
    getState() {
        return {
            currentFormat: this.currentFormat,
            transparentBackground: this.transparentBackground,
            backgroundColor: this.backgroundColor,
            savedBackgroundColors: { ...this.savedBackgroundColors }
        };
    }
}