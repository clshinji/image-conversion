// SVG変換クラス（既存機能の拡張版）

import { ERROR_TYPES, TIMEOUT_SETTINGS } from '../constants.js';
import { createError, withTimeout } from '../utils/helpers.js';

/**
 * SVG変換クラス
 * SVGから他の形式への変換を担当
 */
export class SVGConverter {
    constructor() {
        this.canvas = null;
        this.context = null;
    }
    
    /**
     * SVGをPNGに変換
     * @param {string} svgContent - SVGコンテンツ
     * @param {number} quality - 品質（現在は未使用）
     * @param {boolean} transparentBackground - 透明背景
     * @param {object} sizeOptions - サイズオプション
     * @returns {Promise<object>} 変換結果
     */
    async convertSVGToPNG(svgContent, quality = 90, transparentBackground = true, sizeOptions = {}) {
        try {
            console.log('SVGConverter: SVG to PNG 変換開始');
            
            // タイムアウト付きで変換を実行
            const result = await withTimeout(
                this.performSVGToPNGConversion(svgContent, transparentBackground, sizeOptions),
                TIMEOUT_SETTINGS.CONVERSION,
                'SVG変換がタイムアウトしました'
            );
            
            console.log(`SVGConverter: 変換完了 (${result.pngData.size} bytes)`);
            return result;
            
        } catch (error) {
            console.error('SVGConverter: 変換エラー:', error);
            throw this.handleConversionError(error);
        }
    }
    
    /**
     * SVGからPNGへの変換を実行
     * @param {string} svgContent - SVGコンテンツ
     * @param {boolean} transparentBackground - 透明背景
     * @param {object} sizeOptions - サイズオプション
     * @returns {Promise<object>} 変換結果
     */
    async performSVGToPNGConversion(svgContent, transparentBackground, sizeOptions) {
        // SVGをDOMに解析
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (!svgElement) {
            throw createError(
                'SVG要素が見つかりません',
                ERROR_TYPES.INVALID_SVG,
                '有効なSVGファイルを選択してください'
            );
        }
        
        // SVGの寸法を取得
        const dimensions = this.getSVGDimensions(svgElement);
        
        // 出力サイズを計算
        const outputSize = this.calculateOutputSize(dimensions, sizeOptions);
        
        // Canvasを準備
        const canvas = this.getCanvas();
        const ctx = canvas.getContext('2d');
        
        canvas.width = outputSize.width;
        canvas.height = outputSize.height;
        
        // 背景をクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 透明でない場合は背景色を設定
        if (!transparentBackground && sizeOptions.backgroundColor) {
            ctx.fillStyle = sizeOptions.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // SVGを画像として読み込み、Canvasに描画
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        try {
            const img = await this.loadImage(svgUrl);
            
            // 画像をCanvasに描画
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // PNGデータを生成
            const pngData = await this.canvasToBlob(canvas);
            
            return {
                pngData,
                width: canvas.width,
                height: canvas.height,
                originalDimensions: dimensions,
                svgSize: svgBlob.size
            };
            
        } finally {
            // リソースをクリーンアップ
            URL.revokeObjectURL(svgUrl);
        }
    }
    
    /**
     * SVGの寸法を取得
     * @param {SVGSVGElement} svgElement - SVG要素
     * @returns {object} 寸法情報
     */
    getSVGDimensions(svgElement) {
        let width = 100;
        let height = 100;
        
        // viewBox属性から寸法を取得
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const values = viewBox.split(/\s+|,/).map(v => parseFloat(v));
            if (values.length >= 4) {
                width = values[2];
                height = values[3];
            }
        } else {
            // width/height属性から取得
            const widthAttr = svgElement.getAttribute('width');
            const heightAttr = svgElement.getAttribute('height');
            
            if (widthAttr) {
                width = parseFloat(widthAttr.replace(/[^\d.]/g, '')) || 100;
            }
            if (heightAttr) {
                height = parseFloat(heightAttr.replace(/[^\d.]/g, '')) || 100;
            }
        }
        
        return { width, height };
    }
    
    /**
     * 出力サイズを計算
     * @param {object} originalDimensions - 元の寸法
     * @param {object} sizeOptions - サイズオプション
     * @returns {object} 出力サイズ
     */
    calculateOutputSize(originalDimensions, sizeOptions) {
        const { width: originalWidth, height: originalHeight } = originalDimensions;
        
        // カスタムサイズが指定されている場合
        if (sizeOptions.customWidth || sizeOptions.customHeight) {
            if (sizeOptions.customWidth && sizeOptions.customHeight) {
                return {
                    width: sizeOptions.customWidth,
                    height: sizeOptions.customHeight
                };
            } else if (sizeOptions.customWidth) {
                const aspectRatio = originalWidth / originalHeight;
                return {
                    width: sizeOptions.customWidth,
                    height: Math.round(sizeOptions.customWidth / aspectRatio)
                };
            } else if (sizeOptions.customHeight) {
                const aspectRatio = originalWidth / originalHeight;
                return {
                    width: Math.round(sizeOptions.customHeight * aspectRatio),
                    height: sizeOptions.customHeight
                };
            }
        }
        
        // プリセットサイズの処理
        if (sizeOptions.outputSize && sizeOptions.outputSize !== 'original') {
            const presetMatch = sizeOptions.outputSize.match(/^(\d+)x(\d+)$/);
            if (presetMatch) {
                const presetWidth = parseInt(presetMatch[1]);
                const presetHeight = parseInt(presetMatch[2]);
                
                // アスペクト比を維持
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
            }
        }
        
        // デフォルトは元のサイズ
        return {
            width: Math.round(originalWidth),
            height: Math.round(originalHeight)
        };
    }
    
    /**
     * 画像を読み込み
     * @param {string} src - 画像URL
     * @returns {Promise<HTMLImageElement>} 読み込まれた画像
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('SVG画像の読み込みに失敗しました'));
            
            img.src = src;
        });
    }
    
    /**
     * CanvasをBlobに変換
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @returns {Promise<Blob>} Blobデータ
     */
    canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas to Blob変換に失敗しました'));
                }
            }, 'image/png');
        });
    }
    
    /**
     * Canvasを取得または作成
     * @returns {HTMLCanvasElement} Canvas要素
     */
    getCanvas() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        return this.canvas;
    }
    
    /**
     * 変換エラーを処理
     * @param {Error} error - 元のエラー
     * @returns {Error} 処理されたエラー
     */
    handleConversionError(error) {
        if (error.type) {
            // 既に処理されたエラー
            return error;
        }
        
        let errorType = ERROR_TYPES.CONVERSION_FAILED;
        let suggestion = '別のSVGファイルを試してください';
        
        if (error.message.includes('タイムアウト')) {
            errorType = ERROR_TYPES.TIMEOUT_ERROR;
            suggestion = 'より単純なSVGファイルを使用してください';
        } else if (error.message.includes('メモリ')) {
            errorType = ERROR_TYPES.MEMORY_ERROR;
            suggestion = 'ブラウザを再起動してください';
        } else if (error.message.includes('SVG')) {
            errorType = ERROR_TYPES.INVALID_SVG;
            suggestion = 'SVGファイルの内容を確認してください';
        }
        
        return createError(
            `SVG変換に失敗しました: ${error.message}`,
            errorType,
            suggestion,
            error
        );
    }
    
    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        if (this.canvas) {
            this.canvas.width = 1;
            this.canvas.height = 1;
            this.context = null;
        }
    }
}