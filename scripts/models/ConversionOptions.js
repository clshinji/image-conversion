// 変換オプションのデータモデル

import { 
    QUALITY_SETTINGS, 
    SIZE_PRESETS, 
    DEFAULT_CONVERSION_OPTIONS 
} from '../constants.js';

/**
 * 変換オプションクラス
 * 画像変換時の設定を管理するためのデータモデル
 */
export class ConversionOptions {
    constructor(options = {}) {
        // デフォルト値を設定
        this.quality = options.quality || QUALITY_SETTINGS.DEFAULT;
        this.width = options.width || null;
        this.height = options.height || null;
        this.maintainAspectRatio = options.maintainAspectRatio !== undefined 
            ? options.maintainAspectRatio 
            : DEFAULT_CONVERSION_OPTIONS.maintainAspectRatio;
        this.backgroundColor = options.backgroundColor || DEFAULT_CONVERSION_OPTIONS.backgroundColor;
        this.transparentBackground = options.transparentBackground !== undefined 
            ? options.transparentBackground 
            : DEFAULT_CONVERSION_OPTIONS.transparentBackground;
        this.outputSize = options.outputSize || DEFAULT_CONVERSION_OPTIONS.outputSize;
        this.customWidth = options.customWidth || null;
        this.customHeight = options.customHeight || null;
        
        // 形式固有のオプション
        this.compressionLevel = options.compressionLevel || 6; // WebP用
        this.progressive = options.progressive || false; // JPEG用
        this.dithering = options.dithering !== undefined ? options.dithering : true; // GIF用
    }
    
    /**
     * 指定された形式用の品質を取得
     * @param {string} format - 画像形式
     * @returns {number} 品質値
     */
    getQualityForFormat(format) {
        if (typeof this.quality === 'object') {
            return this.quality[format] || QUALITY_SETTINGS.DEFAULT[format] || 90;
        }
        return this.quality || 90;
    }
    
    /**
     * 品質を設定
     * @param {number|object} quality - 品質値または形式別品質オブジェクト
     */
    setQuality(quality) {
        this.quality = quality;
    }
    
    /**
     * 出力サイズを設定
     * @param {string} sizePreset - サイズプリセット
     * @param {number} customWidth - カスタム幅
     * @param {number} customHeight - カスタム高さ
     */
    setOutputSize(sizePreset, customWidth = null, customHeight = null) {
        this.outputSize = sizePreset;
        this.customWidth = customWidth;
        this.customHeight = customHeight;
    }
    
    /**
     * 実際の出力サイズを計算
     * @param {number} originalWidth - 元の幅
     * @param {number} originalHeight - 元の高さ
     * @returns {object} 計算された出力サイズ
     */
    calculateOutputSize(originalWidth, originalHeight) {
        switch (this.outputSize) {
            case SIZE_PRESETS.ORIGINAL:
                return { width: originalWidth, height: originalHeight };
                
            case SIZE_PRESETS.CUSTOM:
                if (this.customWidth && this.customHeight) {
                    if (this.maintainAspectRatio) {
                        const aspectRatio = originalWidth / originalHeight;
                        const targetAspectRatio = this.customWidth / this.customHeight;
                        
                        if (aspectRatio > targetAspectRatio) {
                            // 幅に合わせる
                            return {
                                width: this.customWidth,
                                height: Math.round(this.customWidth / aspectRatio)
                            };
                        } else {
                            // 高さに合わせる
                            return {
                                width: Math.round(this.customHeight * aspectRatio),
                                height: this.customHeight
                            };
                        }
                    } else {
                        return { width: this.customWidth, height: this.customHeight };
                    }
                } else if (this.customWidth) {
                    const aspectRatio = originalWidth / originalHeight;
                    return {
                        width: this.customWidth,
                        height: Math.round(this.customWidth / aspectRatio)
                    };
                } else if (this.customHeight) {
                    const aspectRatio = originalWidth / originalHeight;
                    return {
                        width: Math.round(this.customHeight * aspectRatio),
                        height: this.customHeight
                    };
                }
                return { width: originalWidth, height: originalHeight };
                
            default:
                // プリセットサイズの場合
                const presetMatch = this.outputSize.match(/^(\d+)x(\d+)$/);
                if (presetMatch) {
                    const presetWidth = parseInt(presetMatch[1]);
                    const presetHeight = parseInt(presetMatch[2]);
                    
                    if (this.maintainAspectRatio) {
                        const aspectRatio = originalWidth / originalHeight;
                        const presetAspectRatio = presetWidth / presetHeight;
                        
                        if (aspectRatio > presetAspectRatio) {
                            return {
                                width: presetWidth,
                                height: Math.round(presetWidth / aspectRatio)
                            };
                        } else {
                            return {
                                width: Math.round(presetHeight * aspectRatio),
                                height: presetHeight
                            };
                        }
                    } else {
                        return { width: presetWidth, height: presetHeight };
                    }
                }
                return { width: originalWidth, height: originalHeight };
        }
    }
    
    /**
     * 背景色を設定
     * @param {string} color - 背景色
     */
    setBackgroundColor(color) {
        this.backgroundColor = color;
    }
    
    /**
     * 透明背景の有効/無効を設定
     * @param {boolean} enabled - 透明背景を有効にするか
     */
    setTransparentBackground(enabled) {
        this.transparentBackground = enabled;
    }
    
    /**
     * アスペクト比維持の有効/無効を設定
     * @param {boolean} enabled - アスペクト比維持を有効にするか
     */
    setMaintainAspectRatio(enabled) {
        this.maintainAspectRatio = enabled;
    }
    
    /**
     * 形式固有のオプションを設定
     * @param {string} format - 画像形式
     * @param {object} formatOptions - 形式固有のオプション
     */
    setFormatSpecificOptions(format, formatOptions) {
        switch (format.toLowerCase()) {
            case 'webp':
                if (formatOptions.compressionLevel !== undefined) {
                    this.compressionLevel = formatOptions.compressionLevel;
                }
                break;
                
            case 'jpg':
            case 'jpeg':
                if (formatOptions.progressive !== undefined) {
                    this.progressive = formatOptions.progressive;
                }
                break;
                
            case 'gif':
                if (formatOptions.dithering !== undefined) {
                    this.dithering = formatOptions.dithering;
                }
                break;
        }
    }
    
    /**
     * オプションを検証
     * @returns {object} 検証結果
     */
    validate() {
        const errors = [];
        const warnings = [];
        
        // 品質の検証
        if (typeof this.quality === 'number') {
            if (this.quality < QUALITY_SETTINGS.MIN || this.quality > QUALITY_SETTINGS.MAX) {
                errors.push(`品質は${QUALITY_SETTINGS.MIN}から${QUALITY_SETTINGS.MAX}の間で指定してください`);
            }
        }
        
        // カスタムサイズの検証
        if (this.outputSize === SIZE_PRESETS.CUSTOM) {
            if (!this.customWidth && !this.customHeight) {
                errors.push('カスタムサイズが選択されていますが、幅または高さが指定されていません');
            }
            
            if (this.customWidth && (this.customWidth <= 0 || this.customWidth > 10000)) {
                errors.push('幅は1から10000の間で指定してください');
            }
            
            if (this.customHeight && (this.customHeight <= 0 || this.customHeight > 10000)) {
                errors.push('高さは1から10000の間で指定してください');
            }
        }
        
        // 背景色の検証
        if (this.backgroundColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(this.backgroundColor)) {
            errors.push('背景色は有効なHEXカラーコードで指定してください');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * オプションをクローン
     * @returns {ConversionOptions} クローンされたオプション
     */
    clone() {
        return new ConversionOptions({
            quality: this.quality,
            width: this.width,
            height: this.height,
            maintainAspectRatio: this.maintainAspectRatio,
            backgroundColor: this.backgroundColor,
            transparentBackground: this.transparentBackground,
            outputSize: this.outputSize,
            customWidth: this.customWidth,
            customHeight: this.customHeight,
            compressionLevel: this.compressionLevel,
            progressive: this.progressive,
            dithering: this.dithering
        });
    }
    
    /**
     * オプションをJSON形式で取得
     * @returns {object} JSON形式のオプション
     */
    toJSON() {
        return {
            quality: this.quality,
            width: this.width,
            height: this.height,
            maintainAspectRatio: this.maintainAspectRatio,
            backgroundColor: this.backgroundColor,
            transparentBackground: this.transparentBackground,
            outputSize: this.outputSize,
            customWidth: this.customWidth,
            customHeight: this.customHeight,
            compressionLevel: this.compressionLevel,
            progressive: this.progressive,
            dithering: this.dithering
        };
    }
    
    /**
     * JSONからオプションを復元
     * @param {object} json - JSON形式のオプション
     * @returns {ConversionOptions} 復元されたオプション
     */
    static fromJSON(json) {
        return new ConversionOptions(json);
    }
}