// 形式固有の変換処理を担当するクラス

import { SUPPORTED_FORMATS, ERROR_TYPES } from '../constants.js';
import { createError } from '../utils/helpers.js';

/**
 * 形式固有変換クラス
 * 各画像形式の特性に応じた最適化処理を担当
 */
export class FormatConverter {
    constructor() {
        this.canvas = null;
    }
    
    /**
     * WebP形式への変換
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {number} quality - 品質（0-100）
     * @returns {Promise<Blob>} WebPデータ
     */
    async toWebP(canvas, quality = 85) {
        try {
            console.log(`FormatConverter: WebP変換開始 (品質: ${quality}%)`);
            
            // WebPサポートチェック
            if (!this.isWebPSupported()) {
                console.warn('WebPがサポートされていません。PNGで代替します。');
                return await this.toPNG(canvas);
            }
            
            const qualityValue = Math.max(0, Math.min(100, quality)) / 100;
            
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log(`FormatConverter: WebP変換完了 (${blob.size} bytes)`);
                        resolve(blob);
                    } else {
                        reject(new Error('WebP変換に失敗しました'));
                    }
                }, 'image/webp', qualityValue);
            });
            
        } catch (error) {
            console.error('FormatConverter: WebP変換エラー:', error);
            throw createError(
                `WebP変換に失敗しました: ${error.message}`,
                ERROR_TYPES.CONVERSION_FAILED,
                'PNG形式を試してください',
                error
            );
        }
    }
    
    /**
     * JPEG形式への変換
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {number} quality - 品質（0-100）
     * @param {string} backgroundColor - 背景色
     * @returns {Promise<Blob>} JPEGデータ
     */
    async toJPEG(canvas, quality = 90, backgroundColor = '#ffffff') {
        try {
            console.log(`FormatConverter: JPEG変換開始 (品質: ${quality}%, 背景色: ${backgroundColor})`);
            
            // JPEGは透明度をサポートしないため、背景色を適用
            const processedCanvas = await this.applyBackgroundColor(canvas, backgroundColor);
            const qualityValue = Math.max(0, Math.min(100, quality)) / 100;
            
            return new Promise((resolve, reject) => {
                processedCanvas.toBlob((blob) => {
                    if (blob) {
                        console.log(`FormatConverter: JPEG変換完了 (${blob.size} bytes)`);
                        resolve(blob);
                    } else {
                        reject(new Error('JPEG変換に失敗しました'));
                    }
                }, 'image/jpeg', qualityValue);
            });
            
        } catch (error) {
            console.error('FormatConverter: JPEG変換エラー:', error);
            throw createError(
                `JPEG変換に失敗しました: ${error.message}`,
                ERROR_TYPES.CONVERSION_FAILED,
                'PNG形式を試してください',
                error
            );
        }
    }
    
    /**
     * PNG形式への変換
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {object} options - オプション
     * @returns {Promise<Blob>} PNGデータ
     */
    async toPNG(canvas, options = {}) {
        try {
            console.log('FormatConverter: PNG変換開始');
            
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log(`FormatConverter: PNG変換完了 (${blob.size} bytes)`);
                        resolve(blob);
                    } else {
                        reject(new Error('PNG変換に失敗しました'));
                    }
                }, 'image/png');
            });
            
        } catch (error) {
            console.error('FormatConverter: PNG変換エラー:', error);
            throw createError(
                `PNG変換に失敗しました: ${error.message}`,
                ERROR_TYPES.CONVERSION_FAILED,
                'ブラウザを再起動してください',
                error
            );
        }
    }
    
    /**
     * GIF形式への変換（制限付き）
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {object} options - オプション
     * @returns {Promise<Blob>} GIFデータ（実際はPNG）
     */
    async toGIF(canvas, options = {}) {
        try {
            console.log('FormatConverter: GIF変換開始');
            console.warn('GIF形式は制限があります。PNG形式で代替します。');
            
            // 現在の実装ではPNGで代替
            // 将来的にはGIFエンコーダーライブラリを使用する予定
            const blob = await this.toPNG(canvas, options);
            
            console.log(`FormatConverter: GIF変換完了 (PNG代替: ${blob.size} bytes)`);
            return blob;
            
        } catch (error) {
            console.error('FormatConverter: GIF変換エラー:', error);
            throw createError(
                `GIF変換に失敗しました: ${error.message}`,
                ERROR_TYPES.CONVERSION_FAILED,
                'PNG形式を試してください',
                error
            );
        }
    }
    
    /**
     * 背景色を適用
     * @param {HTMLCanvasElement} sourceCanvas - 元のCanvas
     * @param {string} backgroundColor - 背景色
     * @returns {Promise<HTMLCanvasElement>} 背景色適用後のCanvas
     */
    async applyBackgroundColor(sourceCanvas, backgroundColor) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        
        // 背景色を塗りつぶし
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 元の画像を合成
        ctx.drawImage(sourceCanvas, 0, 0);
        
        return canvas;
    }
    
    /**
     * WebPサポートをチェック
     * @returns {boolean} WebPがサポートされているか
     */
    isWebPSupported() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 形式固有の最適化を適用
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {string} format - 変換先形式
     * @param {object} options - オプション
     * @returns {Promise<HTMLCanvasElement>} 最適化後のCanvas
     */
    async optimizeForFormat(canvas, format, options = {}) {
        try {
            console.log(`FormatConverter: ${format}用の最適化を適用`);
            
            switch (format) {
                case SUPPORTED_FORMATS.JPG:
                case SUPPORTED_FORMATS.JPEG:
                    // JPEG用最適化: 背景色適用
                    if (!options.transparentBackground) {
                        return await this.applyBackgroundColor(canvas, options.backgroundColor || '#ffffff');
                    }
                    // プログレッシブJPEGの設定（将来実装）
                    break;
                    
                case SUPPORTED_FORMATS.GIF:
                    // GIF用最適化: 色数制限とディザリング
                    return await this.optimizeForGIF(canvas, options);
                    
                case SUPPORTED_FORMATS.WEBP:
                    // WebP用最適化: アルファチャンネルの最適化
                    return await this.optimizeForWebP(canvas, options);
                    
                case SUPPORTED_FORMATS.PNG:
                    // PNG用最適化: 色深度の最適化
                    return await this.optimizeForPNG(canvas, options);
            }
            
            return canvas;
            
        } catch (error) {
            console.error('FormatConverter: 最適化エラー:', error);
            // 最適化に失敗しても元のCanvasを返す
            return canvas;
        }
    }
    
    /**
     * GIF用最適化
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {object} options - オプション
     * @returns {Promise<HTMLCanvasElement>} 最適化後のCanvas
     */
    async optimizeForGIF(canvas, options) {
        // 現在は基本的な処理のみ
        // 将来的には色数制限やディザリングを実装
        console.log('GIF最適化: 基本処理のみ実行');
        return canvas;
    }
    
    /**
     * WebP用最適化
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {object} options - オプション
     * @returns {Promise<HTMLCanvasElement>} 最適化後のCanvas
     */
    async optimizeForWebP(canvas, options) {
        // WebPの透明度処理の最適化
        if (options.transparentBackground) {
            console.log('WebP最適化: 透明度保持');
        }
        return canvas;
    }
    
    /**
     * PNG用最適化
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {object} options - オプション
     * @returns {Promise<HTMLCanvasElement>} 最適化後のCanvas
     */
    async optimizeForPNG(canvas, options) {
        // PNG色深度の最適化（将来実装）
        console.log('PNG最適化: 基本処理のみ実行');
        return canvas;
    }
    
    /**
     * 形式の特性情報を取得
     * @param {string} format - 画像形式
     * @returns {object} 形式の特性
     */
    getFormatCharacteristics(format) {
        const characteristics = {
            supportsTransparency: false,
            supportsAnimation: false,
            lossy: false,
            maxQuality: 100,
            recommendedQuality: 90,
            colorDepth: 24,
            notes: [],
            mimeType: '',
            fileExtension: ''
        };
        
        switch (format) {
            case SUPPORTED_FORMATS.PNG:
                characteristics.supportsTransparency = true;
                characteristics.lossy = false;
                characteristics.colorDepth = 32;
                characteristics.mimeType = 'image/png';
                characteristics.fileExtension = '.png';
                characteristics.notes.push('可逆圧縮', '透明度サポート', '高品質');
                break;
                
            case SUPPORTED_FORMATS.JPG:
            case SUPPORTED_FORMATS.JPEG:
                characteristics.lossy = true;
                characteristics.recommendedQuality = 85;
                characteristics.mimeType = 'image/jpeg';
                characteristics.fileExtension = '.jpg';
                characteristics.notes.push('非可逆圧縮', '小さなファイルサイズ', 'Web最適化');
                break;
                
            case SUPPORTED_FORMATS.WEBP:
                characteristics.supportsTransparency = true;
                characteristics.lossy = true;
                characteristics.recommendedQuality = 80;
                characteristics.colorDepth = 32;
                characteristics.mimeType = 'image/webp';
                characteristics.fileExtension = '.webp';
                characteristics.notes.push('高効率圧縮', '透明度サポート', '次世代形式');
                break;
                
            case SUPPORTED_FORMATS.GIF:
                characteristics.supportsTransparency = true;
                characteristics.supportsAnimation = true;
                characteristics.lossy = false;
                characteristics.colorDepth = 8;
                characteristics.mimeType = 'image/gif';
                characteristics.fileExtension = '.gif';
                characteristics.notes.push('256色制限', 'アニメーション対応', 'レガシー形式');
                break;
                
            case SUPPORTED_FORMATS.SVG:
                characteristics.supportsTransparency = true;
                characteristics.lossy = false;
                characteristics.colorDepth = 32;
                characteristics.mimeType = 'image/svg+xml';
                characteristics.fileExtension = '.svg';
                characteristics.notes.push('ベクター形式', 'スケーラブル', 'XML形式');
                break;
        }
        
        return characteristics;
    }
    
    /**
     * 最適な品質設定を取得
     * @param {string} format - 画像形式
     * @param {string} usage - 使用目的 ('web', 'print', 'archive')
     * @returns {number} 推奨品質
     */
    getOptimalQuality(format, usage = 'web') {
        const characteristics = this.getFormatCharacteristics(format);
        
        if (!characteristics.lossy) {
            return 100; // 可逆圧縮形式は常に100%
        }
        
        const qualityMap = {
            web: {
                [SUPPORTED_FORMATS.JPG]: 85,
                [SUPPORTED_FORMATS.JPEG]: 85,
                [SUPPORTED_FORMATS.WEBP]: 80
            },
            print: {
                [SUPPORTED_FORMATS.JPG]: 95,
                [SUPPORTED_FORMATS.JPEG]: 95,
                [SUPPORTED_FORMATS.WEBP]: 90
            },
            archive: {
                [SUPPORTED_FORMATS.JPG]: 98,
                [SUPPORTED_FORMATS.JPEG]: 98,
                [SUPPORTED_FORMATS.WEBP]: 95
            }
        };
        
        return qualityMap[usage]?.[format] || characteristics.recommendedQuality;
    }
    
    /**
     * ファイルサイズを推定
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {string} format - 形式
     * @param {number} quality - 品質
     * @returns {number} 推定ファイルサイズ（バイト）
     */
    estimateFileSize(width, height, format, quality = 90) {
        const pixels = width * height;
        
        switch (format) {
            case SUPPORTED_FORMATS.PNG:
                // PNG: 約4-6バイト/ピクセル（圧縮率による）
                return Math.round(pixels * 5);
                
            case SUPPORTED_FORMATS.JPG:
            case SUPPORTED_FORMATS.JPEG:
                // JPEG: 品質に応じて0.5-3バイト/ピクセル
                const jpegRatio = (quality / 100) * 2.5 + 0.5;
                return Math.round(pixels * jpegRatio);
                
            case SUPPORTED_FORMATS.WEBP:
                // WebP: JPEGより約25-35%小さい
                const webpRatio = ((quality / 100) * 2.5 + 0.5) * 0.7;
                return Math.round(pixels * webpRatio);
                
            case SUPPORTED_FORMATS.GIF:
                // GIF: 約1バイト/ピクセル（256色制限）
                return Math.round(pixels * 1);
                
            default:
                return Math.round(pixels * 3); // デフォルト推定
        }
    }
    
    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        if (this.canvas) {
            this.canvas.width = 1;
            this.canvas.height = 1;
            this.canvas = null;
        }
    }
}