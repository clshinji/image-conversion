// ラスター画像間の変換を担当するクラス

import { SUPPORTED_FORMATS, ERROR_TYPES, TIMEOUT_SETTINGS } from '../constants.js';
import { createError, withTimeout } from '../utils/helpers.js';

/**
 * ラスター画像変換クラス
 * PNG、JPG、WebP、GIF間の相互変換を担当
 */
export class RasterConverter {
    constructor() {
        this.canvas = null;
        this.context = null;
    }
    
    /**
     * ラスター画像間の変換（パフォーマンス最適化版）
     * @param {HTMLImageElement|ImageData|Blob} imageData - 画像データ
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @param {object} options - 変換オプション
     * @returns {Promise<Blob>} 変換結果
     */
    async convertRasterToRaster(imageData, fromFormat, toFormat, options = {}) {
        try {
            console.log(`RasterConverter: ${fromFormat} -> ${toFormat} 変換開始`);
            
            // 大容量ファイルの場合はチャンク処理を検討
            const shouldUseChunkedProcessing = this.shouldUseChunkedProcessing(imageData, options);
            
            if (shouldUseChunkedProcessing) {
                return await this.convertWithChunkedProcessing(imageData, fromFormat, toFormat, options);
            }
            
            // 通常の変換処理（タイムアウト付き）
            const conversionPromise = this.performStandardConversion(imageData, fromFormat, toFormat, options);
            
            const blob = await withTimeout(
                conversionPromise,
                TIMEOUT_SETTINGS.CONVERSION,
                'ラスター画像変換がタイムアウトしました'
            );
            
            console.log(`RasterConverter: 変換完了 (${blob.size} bytes)`);
            return blob;
            
        } catch (error) {
            console.error('RasterConverter: 変換エラー:', error);
            throw createError(
                `ラスター画像の変換に失敗しました: ${error.message}`,
                ERROR_TYPES.CONVERSION_FAILED,
                '画像ファイルを確認してください',
                error
            );
        }
    }
    
    /**
     * チャンク処理が必要かどうか判定
     * @param {*} imageData - 画像データ
     * @param {object} options - オプション
     * @returns {boolean} チャンク処理が必要かどうか
     */
    shouldUseChunkedProcessing(imageData, options) {
        // ファイルサイズが大きい場合
        if (imageData instanceof Blob && imageData.size > 5 * 1024 * 1024) {
            return true;
        }
        
        // 出力サイズが大きい場合
        if (options.customWidth && options.customHeight) {
            const pixelCount = options.customWidth * options.customHeight;
            if (pixelCount > 4000000) { // 4MP以上
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 標準的な変換処理
     * @param {*} imageData - 画像データ
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @param {object} options - オプション
     * @returns {Promise<Blob>} 変換結果
     */
    async performStandardConversion(imageData, fromFormat, toFormat, options) {
        // Canvasの準備
        const canvas = this.getCanvas();
        const ctx = canvas.getContext('2d');
        
        // 画像をCanvasに描画
        await this.loadImageToCanvas(imageData, canvas, ctx, options);
        
        // 形式に応じた変換処理
        return await this.convertCanvasToFormat(canvas, toFormat, options);
    }
    
    /**
     * チャンク処理による変換
     * @param {*} imageData - 画像データ
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @param {object} options - オプション
     * @returns {Promise<Blob>} 変換結果
     */
    async convertWithChunkedProcessing(imageData, fromFormat, toFormat, options) {
        console.log('RasterConverter: チャンク処理による変換を開始');
        
        // 画像を小さなチャンクに分割して処理
        const img = await this.createImageElement(imageData);
        const chunkSize = 1024; // 1024x1024ピクセルのチャンク
        
        const chunks = this.createImageChunks(img, chunkSize);
        const processedChunks = [];
        
        // 各チャンクを順次処理（メモリ使用量を抑制）
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const processedChunk = await this.processImageChunk(chunk, toFormat, options);
            processedChunks.push(processedChunk);
            
            // 進行状況を報告
            const progress = Math.round(((i + 1) / chunks.length) * 100);
            console.log(`チャンク処理進行状況: ${progress}%`);
            
            // メモリクリーンアップ
            if (i % 5 === 0) { // 5チャンクごとにクリーンアップ
                this.performChunkCleanup();
            }
        }
        
        // チャンクを結合
        const finalResult = await this.combineProcessedChunks(processedChunks, img.width, img.height, toFormat);
        
        console.log('RasterConverter: チャンク処理による変換完了');
        return finalResult;
    }
    
    /**
     * 画像をチャンクに分割
     * @param {HTMLImageElement} img - 画像要素
     * @param {number} chunkSize - チャンクサイズ
     * @returns {Array} チャンクの配列
     */
    createImageChunks(img, chunkSize) {
        const chunks = [];
        const cols = Math.ceil(img.width / chunkSize);
        const rows = Math.ceil(img.height / chunkSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                chunks.push({
                    x: col * chunkSize,
                    y: row * chunkSize,
                    width: Math.min(chunkSize, img.width - col * chunkSize),
                    height: Math.min(chunkSize, img.height - row * chunkSize),
                    row,
                    col
                });
            }
        }
        
        return chunks;
    }
    
    /**
     * 画像チャンクを処理
     * @param {object} chunk - チャンク情報
     * @param {string} toFormat - 変換先形式
     * @param {object} options - オプション
     * @returns {Promise<object>} 処理されたチャンク
     */
    async processImageChunk(chunk, toFormat, options) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = chunk.width;
        canvas.height = chunk.height;
        
        // チャンクを描画
        ctx.drawImage(
            chunk.sourceImage,
            chunk.x, chunk.y, chunk.width, chunk.height,
            0, 0, chunk.width, chunk.height
        );
        
        // 変換処理
        const blob = await this.convertCanvasToFormat(canvas, toFormat, options);
        
        return {
            ...chunk,
            data: blob
        };
    }
    
    /**
     * 処理されたチャンクを結合
     * @param {Array} chunks - 処理されたチャンク
     * @param {number} totalWidth - 全体の幅
     * @param {number} totalHeight - 全体の高さ
     * @param {string} format - 形式
     * @returns {Promise<Blob>} 結合された結果
     */
    async combineProcessedChunks(chunks, totalWidth, totalHeight, format) {
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        
        finalCanvas.width = totalWidth;
        finalCanvas.height = totalHeight;
        
        // 各チャンクを最終Canvasに配置
        for (const chunk of chunks) {
            const chunkImg = await this.blobToImage(chunk.data);
            ctx.drawImage(chunkImg, chunk.x, chunk.y);
        }
        
        // 最終結果を生成
        return await this.convertCanvasToFormat(finalCanvas, format, {});
    }
    
    /**
     * BlobをImageに変換
     * @param {Blob} blob - Blobデータ
     * @returns {Promise<HTMLImageElement>} 画像要素
     */
    async blobToImage(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }
    
    /**
     * チャンク処理のクリーンアップ
     */
    performChunkCleanup() {
        // 一時的なCanvas要素をクリーンアップ
        const tempCanvases = document.querySelectorAll('canvas[data-temp]');
        tempCanvases.forEach(canvas => {
            canvas.width = 1;
            canvas.height = 1;
            canvas.remove();
        });
        
        // ガベージコレクションを促進
        if (window.gc) {
            window.gc();
        }
    }
    
    /**
     * ラスター画像をSVGに変換（埋め込み形式）
     * @param {HTMLImageElement|ImageData|Blob} imageData - 画像データ
     * @param {object} options - 変換オプション
     * @returns {Promise<Blob>} SVGデータ
     */
    async convertToSVG(imageData, options = {}) {
        try {
            console.log('RasterConverter: ラスター画像をSVGに変換開始');
            
            // 画像をBase64に変換
            const base64 = await this.convertToBase64(imageData);
            const img = await this.createImageElement(imageData);
            
            // SVGコンテンツを生成
            const svgContent = this.generateSVGWithEmbeddedImage(
                base64, 
                img.width, 
                img.height, 
                options
            );
            
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            console.log(`RasterConverter: SVG変換完了 (${blob.size} bytes)`);
            return blob;
            
        } catch (error) {
            console.error('RasterConverter: SVG変換エラー:', error);
            throw createError(
                `SVGへの変換に失敗しました: ${error.message}`,
                ERROR_TYPES.CONVERSION_FAILED,
                '画像ファイルを確認してください',
                error
            );
        }
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
     * 画像をCanvasに読み込み
     * @param {*} imageData - 画像データ
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {object} options - オプション
     * @returns {Promise<HTMLImageElement>} 読み込まれた画像
     */
    async loadImageToCanvas(imageData, canvas, ctx, options) {
        const img = await this.createImageElement(imageData);
        
        // 画像サイズの検証
        if (img.width === 0 || img.height === 0) {
            throw createError(
                '無効な画像サイズです',
                ERROR_TYPES.INVALID_OPTIONS,
                '有効な画像ファイルを選択してください'
            );
        }
        
        // 出力サイズの計算
        const outputSize = this.calculateOutputSize(img.width, img.height, options);
        
        // 最大サイズ制限のチェック
        const maxDimension = 4096; // 4K解像度まで
        if (outputSize.width > maxDimension || outputSize.height > maxDimension) {
            throw createError(
                `出力サイズが大きすぎます (${outputSize.width}x${outputSize.height})`,
                ERROR_TYPES.SIZE_ERROR,
                `最大サイズ: ${maxDimension}x${maxDimension}px`
            );
        }
        
        // Canvasサイズを設定
        canvas.width = outputSize.width;
        canvas.height = outputSize.height;
        
        // Canvas描画品質の設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 背景色の設定（透明でない場合）
        if (!options.transparentBackground && options.backgroundColor) {
            ctx.fillStyle = options.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        return img;
    }
    
    /**
     * 画像要素を作成
     * @param {*} imageData - 画像データ
     * @returns {Promise<HTMLImageElement>} 画像要素
     */
    async createImageElement(imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
            
            if (imageData instanceof Blob) {
                img.src = URL.createObjectURL(imageData);
            } else if (typeof imageData === 'string') {
                img.src = imageData;
            } else if (imageData instanceof HTMLImageElement) {
                resolve(imageData);
                return;
            } else {
                reject(new Error('サポートされていない画像データ形式です'));
                return;
            }
        });
    }
    
    /**
     * Canvasを指定形式に変換
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {string} format - 変換先形式
     * @param {object} options - オプション
     * @returns {Promise<Blob>} 変換結果
     */
    async convertCanvasToFormat(canvas, format, options) {
        return new Promise((resolve, reject) => {
            let mimeType;
            let quality = options.quality || 90;
            
            switch (format) {
                case SUPPORTED_FORMATS.PNG:
                    mimeType = 'image/png';
                    break;
                case SUPPORTED_FORMATS.JPG:
                case SUPPORTED_FORMATS.JPEG:
                    mimeType = 'image/jpeg';
                    quality = quality / 100; // 0-1の範囲に変換
                    break;
                case SUPPORTED_FORMATS.WEBP:
                    mimeType = 'image/webp';
                    quality = quality / 100; // 0-1の範囲に変換
                    break;
                case SUPPORTED_FORMATS.GIF:
                    // GIFは直接サポートされていないため、PNGで代替
                    mimeType = 'image/png';
                    console.warn('GIF形式はPNGで代替されます');
                    break;
                default:
                    reject(new Error(`サポートされていない形式です: ${format}`));
                    return;
            }
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas変換に失敗しました'));
                }
            }, mimeType, quality);
        });
    }
    
    /**
     * 出力サイズを計算
     * @param {number} originalWidth - 元の幅
     * @param {number} originalHeight - 元の高さ
     * @param {object} options - オプション
     * @returns {object} 計算されたサイズ
     */
    calculateOutputSize(originalWidth, originalHeight, options) {
        // ConversionOptionsクラスのロジックを使用する予定
        // 現在は簡易実装
        if (options.customWidth && options.customHeight) {
            return {
                width: options.customWidth,
                height: options.customHeight
            };
        } else if (options.customWidth) {
            const aspectRatio = originalWidth / originalHeight;
            return {
                width: options.customWidth,
                height: Math.round(options.customWidth / aspectRatio)
            };
        } else if (options.customHeight) {
            const aspectRatio = originalWidth / originalHeight;
            return {
                width: Math.round(options.customHeight * aspectRatio),
                height: options.customHeight
            };
        }
        
        return {
            width: originalWidth,
            height: originalHeight
        };
    }
    
    /**
     * 画像をBase64に変換
     * @param {*} imageData - 画像データ
     * @returns {Promise<string>} Base64データ
     */
    async convertToBase64(imageData) {
        if (imageData instanceof Blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Base64変換に失敗しました'));
                reader.readAsDataURL(imageData);
            });
        }
        
        // 他の形式の場合は実装予定
        throw new Error('Base64変換: サポートされていないデータ形式です');
    }
    
    /**
     * 埋め込み画像付きSVGを生成
     * @param {string} base64 - Base64画像データ
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {object} options - オプション
     * @returns {string} SVGコンテンツ
     */
    generateSVGWithEmbeddedImage(base64, width, height, options) {
        const outputSize = this.calculateOutputSize(width, height, options);
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${outputSize.width}" 
     height="${outputSize.height}" 
     viewBox="0 0 ${outputSize.width} ${outputSize.height}">
  <image x="0" y="0" 
         width="${outputSize.width}" 
         height="${outputSize.height}" 
         xlink:href="${base64}"/>
</svg>`;
    }
    
    /**
     * 画像の最適化処理
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {string} targetFormat - 変換先形式
     * @param {object} options - オプション
     * @returns {HTMLCanvasElement} 最適化されたCanvas
     */
    optimizeImage(canvas, targetFormat, options) {
        const ctx = canvas.getContext('2d');
        
        // JPEG用の最適化
        if (targetFormat === SUPPORTED_FORMATS.JPG || targetFormat === SUPPORTED_FORMATS.JPEG) {
            // 透明度を削除し、背景色を適用
            if (!options.backgroundColor) {
                options.backgroundColor = '#ffffff';
            }
        }
        
        // WebP用の最適化
        if (targetFormat === SUPPORTED_FORMATS.WEBP) {
            // WebPの場合、品質設定を調整
            if (!options.quality) {
                options.quality = 85; // WebPのデフォルト品質
            }
        }
        
        return canvas;
    }
    
    /**
     * メモリ使用量を推定
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @returns {number} 推定メモリ使用量（バイト）
     */
    estimateMemoryUsage(width, height) {
        // RGBA = 4バイト/ピクセル
        return width * height * 4;
    }
    
    /**
     * 変換の実行可能性をチェック
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @returns {object} チェック結果
     */
    checkConversionFeasibility(width, height) {
        const memoryUsage = this.estimateMemoryUsage(width, height);
        const maxMemory = 100 * 1024 * 1024; // 100MB制限
        
        return {
            feasible: memoryUsage <= maxMemory,
            memoryUsage,
            maxMemory,
            recommendation: memoryUsage > maxMemory ? 
                '画像サイズを小さくしてください' : 
                '変換可能です'
        };
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