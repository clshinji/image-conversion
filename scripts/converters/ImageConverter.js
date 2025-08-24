// 多形式画像変換の中核クラス

import { SUPPORTED_FORMATS, CONVERSION_MATRIX, ERROR_TYPES, TIMEOUT_SETTINGS } from '../constants.js';
import { createError, isConversionSupported, withTimeout } from '../utils/helpers.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

/**
 * 画像変換の中核クラス
 * 各形式間の変換を統括し、適切な変換エンジンに処理を委譲する
 */
export class ImageConverter {
    constructor() {
        this.supportedFormats = Object.values(SUPPORTED_FORMATS);
        this.conversionMatrix = CONVERSION_MATRIX;
        
        // 変換エンジンは後で初期化
        this.svgConverter = null;
        this.rasterConverter = null;
        this.formatConverter = null;
        
        // パフォーマンス監視
        this.performanceMonitor = new PerformanceMonitor();
        
        // エラーハンドラー（後で設定）
        this.errorHandler = null;
    }
    
    /**
     * 変換エンジンを初期化
     */
    async initialize() {
        try {
            // SVGConverterの読み込み（既存のものを使用）
            const { SVGConverter } = await import('./SVGConverter.js');
            this.svgConverter = new SVGConverter();
            
            // RasterConverterの読み込み（新規作成予定）
            const { RasterConverter } = await import('./RasterConverter.js');
            this.rasterConverter = new RasterConverter();
            
            // FormatConverterの読み込み（新規作成予定）
            const { FormatConverter } = await import('./FormatConverter.js');
            this.formatConverter = new FormatConverter();
            
            console.log('ImageConverter: 全ての変換エンジンが初期化されました');
            
        } catch (error) {
            console.error('ImageConverter: 変換エンジンの初期化に失敗しました:', error);
            throw createError(
                '変換エンジンの初期化に失敗しました',
                ERROR_TYPES.PROCESSING_ERROR,
                'ページを再読み込みしてください',
                error
            );
        }
    }
    
    /**
     * 画像を変換（パフォーマンス監視付き）
     * @param {string|HTMLImageElement|SVGElement} inputData - 入力データ
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @param {object} options - 変換オプション
     * @returns {Promise<object>} 変換結果
     */
    async convertImage(inputData, fromFormat, toFormat, options = {}) {
        const operationId = `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // パフォーマンス監視開始
        const operation = this.performanceMonitor.startOperation(operationId, {
            fromFormat,
            toFormat,
            fileSize: options.fileSize || 0,
            format: `${fromFormat}-to-${toFormat}`
        });
        
        // タイムアウト設定
        const timeoutId = this.performanceMonitor.createTimeout(
            TIMEOUT_SETTINGS.CONVERSION, 
            operationId
        );
        
        try {
            // 変換の妥当性をチェック
            this.validateConversion(fromFormat, toFormat);
            
            // ファイルサイズの最適化提案
            if (options.fileSize) {
                const optimization = this.performanceMonitor.suggestOptimization(options.fileSize, fromFormat);
                if (optimization.hasOptimizations) {
                    console.log('最適化提案:', optimization.suggestions);
                }
            }
            
            // 変換ルートを決定
            const conversionRoute = this.determineConversionRoute(fromFormat, toFormat);
            console.log(`変換ルート: ${conversionRoute.join(' -> ')}`);
            
            // タイムアウト付きで変換を実行
            const conversionPromise = this.executeConversionWithRoute(
                inputData, conversionRoute, options
            );
            
            const result = await withTimeout(
                conversionPromise,
                TIMEOUT_SETTINGS.CONVERSION,
                `変換がタイムアウトしました (${TIMEOUT_SETTINGS.CONVERSION / 1000}秒)`
            );
            
            // タイムアウトをクリア
            clearTimeout(timeoutId);
            
            // パフォーマンス監視終了
            const metrics = this.performanceMonitor.endOperation(operationId, {
                success: true,
                outputSize: result.data?.size || 0,
                conversionRoute
            });
            
            return {
                data: result.data,
                fromFormat,
                toFormat,
                conversionRoute,
                metadata: this.extractMetadata(result.data, toFormat),
                performance: {
                    duration: metrics.duration,
                    memoryDelta: metrics.memoryDelta
                }
            };
            
        } catch (error) {
            // タイムアウトをクリア
            clearTimeout(timeoutId);
            
            // パフォーマンス監視でエラーを記録
            this.performanceMonitor.failOperation(operationId, error);
            
            // エラーハンドラーがある場合は統一処理
            if (this.errorHandler) {
                const handledError = this.errorHandler.handleConversionError(error, 'ImageConverter', {
                    fromFormat,
                    toFormat,
                    options,
                    operationId,
                    retryFunction: () => this.convertImage(inputData, fromFormat, toFormat, options)
                });
                
                if (handledError.recovered) {
                    return handledError.recoveryResult;
                }
            }
            
            console.error('ImageConverter: 変換エラー:', error);
            throw error;
        }
    }
    
    /**
     * 変換ルートに沿って変換を実行
     * @param {*} inputData - 入力データ
     * @param {Array} conversionRoute - 変換ルート
     * @param {object} options - 変換オプション
     * @returns {Promise<object>} 変換結果
     */
    async executeConversionWithRoute(inputData, conversionRoute, options) {
        let result = inputData;
        let currentFormat = conversionRoute[0];
        
        for (let i = 1; i < conversionRoute.length; i++) {
            const targetFormat = conversionRoute[i];
            
            // 各ステップでメモリ使用量をチェック
            const memoryUsage = this.performanceMonitor.getCurrentMemoryUsage();
            if (memoryUsage > this.performanceMonitor.limits.maxMemoryUsage * 0.8) {
                console.warn('メモリ使用量が高いため、クリーンアップを実行します');
                this.performanceMonitor.performMemoryCleanup();
            }
            
            result = await this.executeConversionStep(result, currentFormat, targetFormat, options);
            currentFormat = targetFormat;
        }
        
        return { data: result };
    }
    
    /**
     * 変換の妥当性をチェック
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     */
    validateConversion(fromFormat, toFormat) {
        if (!fromFormat || !toFormat) {
            throw createError(
                '変換元または変換先の形式が指定されていません',
                ERROR_TYPES.INVALID_OPTIONS,
                '有効な画像形式を指定してください'
            );
        }
        
        if (!this.supportedFormats.includes(fromFormat)) {
            throw createError(
                `サポートされていない変換元形式です: ${fromFormat}`,
                ERROR_TYPES.UNSUPPORTED_FORMAT,
                `サポートされている形式: ${this.supportedFormats.join(', ')}`
            );
        }
        
        if (!this.supportedFormats.includes(toFormat)) {
            throw createError(
                `サポートされていない変換先形式です: ${toFormat}`,
                ERROR_TYPES.UNSUPPORTED_FORMAT,
                `サポートされている形式: ${this.supportedFormats.join(', ')}`
            );
        }
        
        if (fromFormat === toFormat) {
            throw createError(
                '変換元と変換先の形式が同じです',
                ERROR_TYPES.INVALID_OPTIONS,
                '異なる形式を選択してください'
            );
        }
        
        if (!isConversionSupported(fromFormat, toFormat)) {
            throw createError(
                `${fromFormat}から${toFormat}への変換はサポートされていません`,
                ERROR_TYPES.UNSUPPORTED_FORMAT,
                'サポートされている変換の組み合わせを確認してください'
            );
        }
    }
    
    /**
     * 変換ルートを決定
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @returns {Array} 変換ルート
     */
    determineConversionRoute(fromFormat, toFormat) {
        // 直接変換が可能な場合
        if (this.conversionMatrix[fromFormat]?.includes(toFormat)) {
            return [fromFormat, toFormat];
        }
        
        // 中間形式を経由する変換ルートを探索
        // PNG経由の変換ルート
        if (fromFormat !== SUPPORTED_FORMATS.PNG && toFormat !== SUPPORTED_FORMATS.PNG) {
            // 両方の形式がPNGに変換可能かチェック
            if (this.conversionMatrix[fromFormat]?.includes(SUPPORTED_FORMATS.PNG) &&
                this.conversionMatrix[SUPPORTED_FORMATS.PNG]?.includes(toFormat)) {
                return [fromFormat, SUPPORTED_FORMATS.PNG, toFormat];
            }
        }
        
        // SVG経由の変換ルート（ラスター画像からSVGへの変換がサポートされている場合）
        if (fromFormat !== SUPPORTED_FORMATS.SVG && toFormat !== SUPPORTED_FORMATS.SVG) {
            if (this.conversionMatrix[fromFormat]?.includes(SUPPORTED_FORMATS.SVG) &&
                this.conversionMatrix[SUPPORTED_FORMATS.SVG]?.includes(toFormat)) {
                return [fromFormat, SUPPORTED_FORMATS.SVG, toFormat];
            }
        }
        
        throw createError(
            `${fromFormat}から${toFormat}への変換ルートが見つかりません`,
            ERROR_TYPES.UNSUPPORTED_FORMAT,
            'サポートされている変換の組み合わせを確認してください'
        );
    }
    
    /**
     * 変換ステップを実行
     * @param {*} inputData - 入力データ
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @param {object} options - 変換オプション
     * @returns {Promise<*>} 変換結果
     */
    async executeConversionStep(inputData, fromFormat, toFormat, options) {
        console.log(`変換ステップ実行: ${fromFormat} -> ${toFormat}`);
        
        // SVGからの変換
        if (fromFormat === SUPPORTED_FORMATS.SVG) {
            if (!this.svgConverter) {
                throw createError('SVG変換エンジンが初期化されていません', ERROR_TYPES.PROCESSING_ERROR);
            }
            return await this.svgConverter.convertSVGToPNG(inputData, options.quality, options.transparentBackground, options);
        }
        
        // ラスター画像間の変換
        if (this.isRasterFormat(fromFormat) && this.isRasterFormat(toFormat)) {
            if (!this.rasterConverter) {
                throw createError('ラスター変換エンジンが初期化されていません', ERROR_TYPES.PROCESSING_ERROR);
            }
            return await this.rasterConverter.convertRasterToRaster(inputData, fromFormat, toFormat, options);
        }
        
        // ラスター画像からSVGへの変換
        if (this.isRasterFormat(fromFormat) && toFormat === SUPPORTED_FORMATS.SVG) {
            if (!this.rasterConverter) {
                throw createError('ラスター変換エンジンが初期化されていません', ERROR_TYPES.PROCESSING_ERROR);
            }
            return await this.rasterConverter.convertToSVG(inputData, options);
        }
        
        throw createError(
            `${fromFormat}から${toFormat}への変換はまだ実装されていません`,
            ERROR_TYPES.UNSUPPORTED_FORMAT,
            '他の形式の組み合わせを試してください'
        );
    }
    
    /**
     * ラスター形式かどうかチェック
     * @param {string} format - 画像形式
     * @returns {boolean} ラスター形式かどうか
     */
    isRasterFormat(format) {
        return [
            SUPPORTED_FORMATS.PNG,
            SUPPORTED_FORMATS.JPG,
            SUPPORTED_FORMATS.JPEG,
            SUPPORTED_FORMATS.WEBP,
            SUPPORTED_FORMATS.GIF
        ].includes(format);
    }
    
    /**
     * サポートされている変換先形式を取得
     * @param {string} fromFormat - 変換元形式
     * @returns {Array} サポートされている変換先形式
     */
    getSupportedConversions(fromFormat) {
        return this.conversionMatrix[fromFormat] || [];
    }
    
    /**
     * 全ての変換パターンを取得
     * @returns {object} 変換パターンのマトリックス
     */
    getAllConversionPatterns() {
        return { ...this.conversionMatrix };
    }
    
    /**
     * 変換の複雑さを評価
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @returns {object} 変換の複雑さ情報
     */
    getConversionComplexity(fromFormat, toFormat) {
        try {
            const route = this.determineConversionRoute(fromFormat, toFormat);
            return {
                steps: route.length - 1,
                route: route,
                isDirect: route.length === 2,
                complexity: route.length === 2 ? 'simple' : 'complex'
            };
        } catch (error) {
            return {
                steps: 0,
                route: [],
                isDirect: false,
                complexity: 'unsupported',
                error: error.message
            };
        }
    }
    
    /**
     * メタデータを抽出
     * @param {*} data - データ
     * @param {string} format - 形式
     * @returns {object} メタデータ
     */
    extractMetadata(data, format) {
        const metadata = {
            format,
            size: null,
            dimensions: null,
            timestamp: new Date()
        };
        
        try {
            if (data instanceof Blob) {
                metadata.size = data.size;
            }
            
            // 追加のメタデータ抽出ロジックをここに実装
            
        } catch (error) {
            console.warn('メタデータの抽出に失敗しました:', error);
        }
        
        return metadata;
    }
    
    /**
     * エラーハンドラーを設定
     * @param {ErrorHandler} errorHandler - エラーハンドラー
     */
    setErrorHandler(errorHandler) {
        this.errorHandler = errorHandler;
    }
    
    /**
     * パフォーマンス統計を取得
     * @returns {object} パフォーマンス統計
     */
    getPerformanceStats() {
        return this.performanceMonitor.getPerformanceStats();
    }
    
    /**
     * パフォーマンス設定を更新
     * @param {object} limits - 制限値
     * @param {object} optimizations - 最適化設定
     */
    updatePerformanceSettings(limits, optimizations) {
        this.performanceMonitor.updateSettings(limits, optimizations);
    }
    
    /**
     * 変換エンジンの状態を取得（拡張版）
     * @returns {object} エンジンの状態
     */
    getEngineStatus() {
        const performanceStats = this.getPerformanceStats();
        
        return {
            svgConverter: !!this.svgConverter,
            rasterConverter: !!this.rasterConverter,
            formatConverter: !!this.formatConverter,
            supportedFormats: this.supportedFormats,
            conversionMatrix: this.conversionMatrix,
            performance: performanceStats,
            memoryUsage: {
                current: this.performanceMonitor.getCurrentMemoryUsage(),
                limit: this.performanceMonitor.limits.maxMemoryUsage,
                utilization: Math.round(
                    (this.performanceMonitor.getCurrentMemoryUsage() / 
                     this.performanceMonitor.limits.maxMemoryUsage) * 100
                )
            },
            activeOperations: this.performanceMonitor.activeOperations.size
        };
    }
    
    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        if (this.performanceMonitor) {
            this.performanceMonitor.stop();
        }
        
        if (this.svgConverter && typeof this.svgConverter.cleanup === 'function') {
            this.svgConverter.cleanup();
        }
        
        if (this.rasterConverter && typeof this.rasterConverter.cleanup === 'function') {
            this.rasterConverter.cleanup();
        }
        
        if (this.formatConverter && typeof this.formatConverter.cleanup === 'function') {
            this.formatConverter.cleanup();
        }
    }
}