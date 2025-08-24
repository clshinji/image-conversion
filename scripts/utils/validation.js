// 多形式画像変換のための検証ユーティリティ

import { 
    SUPPORTED_FORMATS, 
    MIME_TYPES, 
    FILE_EXTENSIONS, 
    FILE_SIZE_LIMITS,
    ERROR_TYPES,
    QUALITY_SETTINGS 
} from '../constants.js';
import { 
    detectImageFormat, 
    validateFileSize, 
    isValidColor,
    createError 
} from './helpers.js';

/**
 * ファイルの包括的な検証
 * @param {File} file - 検証するファイル
 * @returns {object} 検証結果
 */
export function validateImageFile(file) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        info: {
            detectedFormat: null,
            fileSize: file.size,
            fileName: file.name
        }
    };
    
    // ファイルの基本チェック
    if (!file) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.VALIDATION_ERROR,
            message: 'ファイルが選択されていません',
            suggestion: 'ファイルを選択してください'
        });
        return result;
    }
    
    // ファイル形式の検証
    const detectedFormat = detectImageFormat(file);
    result.info.detectedFormat = detectedFormat;
    
    if (!detectedFormat) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.UNSUPPORTED_FORMAT,
            message: `サポートされていないファイル形式です: ${file.type || 'unknown'}`,
            suggestion: `サポートされている形式（${Object.values(SUPPORTED_FORMATS).join(', ')}）のファイルを選択してください`
        });
    }
    
    // ファイルサイズの検証
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.isValid) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.FILE_TOO_LARGE,
            message: sizeValidation.message,
            suggestion: sizeValidation.suggestion
        });
    } else if (sizeValidation.isWarning) {
        result.warnings.push({
            type: 'FILE_SIZE_WARNING',
            message: sizeValidation.message,
            suggestion: sizeValidation.suggestion
        });
    }
    
    // ファイル名の検証
    if (file.name.length > 255) {
        result.warnings.push({
            type: 'FILENAME_LENGTH_WARNING',
            message: 'ファイル名が長すぎます',
            suggestion: 'ファイル名を短くすることを推奨します'
        });
    }
    
    return result;
}

/**
 * SVGコンテンツの詳細検証
 * @param {string} svgContent - SVGコンテンツ
 * @returns {object} 検証結果
 */
export function validateSVGContent(svgContent) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        info: {
            hasViewBox: false,
            hasDimensions: false,
            elementCount: 0,
            contentTypes: []
        }
    };
    
    if (!svgContent || typeof svgContent !== 'string') {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.INVALID_SVG,
            message: 'SVGコンテンツが空または無効です',
            suggestion: '有効なSVGファイルを選択してください'
        });
        return result;
    }
    
    try {
        // SVGをDOMとして解析
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (!svgElement) {
            result.isValid = false;
            result.errors.push({
                type: ERROR_TYPES.INVALID_SVG,
                message: 'SVG要素が見つかりません',
                suggestion: '有効なSVGファイルを選択してください'
            });
            return result;
        }
        
        // パースエラーのチェック
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            result.isValid = false;
            result.errors.push({
                type: ERROR_TYPES.INVALID_SVG,
                message: 'SVGの構文エラーが検出されました',
                suggestion: 'SVGファイルの構文を確認してください'
            });
            return result;
        }
        
        // ViewBoxの存在チェック
        const viewBox = svgElement.getAttribute('viewBox');
        result.info.hasViewBox = !!viewBox;
        
        // 寸法の存在チェック
        const width = svgElement.getAttribute('width');
        const height = svgElement.getAttribute('height');
        result.info.hasDimensions = !!(width && height);
        
        if (!result.info.hasViewBox && !result.info.hasDimensions) {
            result.warnings.push({
                type: 'SVG_DIMENSIONS_WARNING',
                message: 'SVGにviewBoxまたはwidth/height属性がありません',
                suggestion: '変換結果のサイズが予期しない場合があります'
            });
        }
        
        // 要素数のカウント
        const allElements = svgElement.querySelectorAll('*');
        result.info.elementCount = allElements.length;
        
        // コンテンツタイプの分析
        const contentTypes = new Set();
        allElements.forEach(element => {
            const tagName = element.tagName.toLowerCase();
            switch (tagName) {
                case 'path':
                case 'line':
                case 'polyline':
                case 'polygon':
                case 'circle':
                case 'ellipse':
                case 'rect':
                    contentTypes.add('図形');
                    break;
                case 'text':
                case 'tspan':
                    contentTypes.add('テキスト');
                    break;
                case 'image':
                    contentTypes.add('画像');
                    break;
                case 'g':
                    contentTypes.add('グループ');
                    break;
                case 'defs':
                case 'clipPath':
                case 'mask':
                case 'pattern':
                case 'linearGradient':
                case 'radialGradient':
                    contentTypes.add('定義');
                    break;
                case 'animate':
                case 'animateTransform':
                case 'animateMotion':
                    contentTypes.add('アニメーション');
                    break;
            }
        });
        result.info.contentTypes = Array.from(contentTypes);
        
        // 複雑さの警告
        if (result.info.elementCount > 1000) {
            result.warnings.push({
                type: 'SVG_COMPLEXITY_WARNING',
                message: `SVGが複雑です（${result.info.elementCount}個の要素）`,
                suggestion: '変換に時間がかかる場合があります'
            });
        }
        
        // アニメーションの警告
        if (contentTypes.has('アニメーション')) {
            result.warnings.push({
                type: 'SVG_ANIMATION_WARNING',
                message: 'SVGにアニメーションが含まれています',
                suggestion: '静的な画像として変換されます'
            });
        }
        
        // 外部リソースの警告
        const externalImages = svgElement.querySelectorAll('image[href], image[xlink\\:href]');
        if (externalImages.length > 0) {
            result.warnings.push({
                type: 'SVG_EXTERNAL_RESOURCES_WARNING',
                message: 'SVGに外部画像への参照が含まれています',
                suggestion: '外部画像は変換結果に含まれない場合があります'
            });
        }
        
    } catch (error) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.INVALID_SVG,
            message: `SVGの解析中にエラーが発生しました: ${error.message}`,
            suggestion: 'SVGファイルの内容を確認してください'
        });
    }
    
    return result;
}

/**
 * 変換オプションの検証
 * @param {object} options - 変換オプション
 * @param {string} targetFormat - 変換先形式
 * @returns {object} 検証結果
 */
export function validateConversionOptions(options, targetFormat) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedOptions: { ...options }
    };
    
    // 品質設定の検証
    if (options.quality !== undefined) {
        const quality = parseInt(options.quality);
        if (isNaN(quality) || quality < QUALITY_SETTINGS.MIN || quality > QUALITY_SETTINGS.MAX) {
            result.errors.push({
                type: ERROR_TYPES.INVALID_OPTIONS,
                message: `品質設定が無効です: ${options.quality}`,
                suggestion: `${QUALITY_SETTINGS.MIN}から${QUALITY_SETTINGS.MAX}の間の値を指定してください`
            });
            result.isValid = false;
        } else {
            result.sanitizedOptions.quality = quality;
        }
    }
    
    // サイズ設定の検証
    if (options.customWidth !== undefined && options.customWidth !== null) {
        const width = parseInt(options.customWidth);
        if (isNaN(width) || width <= 0 || width > 10000) {
            result.errors.push({
                type: ERROR_TYPES.INVALID_OPTIONS,
                message: `幅の設定が無効です: ${options.customWidth}`,
                suggestion: '1から10000の間の値を指定してください'
            });
            result.isValid = false;
        } else {
            result.sanitizedOptions.customWidth = width;
        }
    }
    
    if (options.customHeight !== undefined && options.customHeight !== null) {
        const height = parseInt(options.customHeight);
        if (isNaN(height) || height <= 0 || height > 10000) {
            result.errors.push({
                type: ERROR_TYPES.INVALID_OPTIONS,
                message: `高さの設定が無効です: ${options.customHeight}`,
                suggestion: '1から10000の間の値を指定してください'
            });
            result.isValid = false;
        } else {
            result.sanitizedOptions.customHeight = height;
        }
    }
    
    // 背景色の検証
    if (options.backgroundColor !== undefined) {
        if (!isValidColor(options.backgroundColor)) {
            result.errors.push({
                type: ERROR_TYPES.INVALID_OPTIONS,
                message: `背景色が無効です: ${options.backgroundColor}`,
                suggestion: '有効なカラーコード（例: #ffffff）を指定してください'
            });
            result.isValid = false;
        }
    }
    
    // 形式固有の検証
    switch (targetFormat) {
        case SUPPORTED_FORMATS.JPG:
        case SUPPORTED_FORMATS.JPEG:
            // JPEGは透明度をサポートしないため警告
            if (options.transparentBackground) {
                result.warnings.push({
                    type: 'FORMAT_TRANSPARENCY_WARNING',
                    message: 'JPEG形式は透明度をサポートしません',
                    suggestion: '背景色が適用されます'
                });
            }
            break;
            
        case SUPPORTED_FORMATS.GIF:
            // GIFの制限について警告
            result.warnings.push({
                type: 'FORMAT_LIMITATION_WARNING',
                message: 'GIF形式は色数が制限されます',
                suggestion: '画質が劣化する場合があります'
            });
            break;
    }
    
    return result;
}

/**
 * バッチ処理用ファイルリストの検証
 * @param {FileList|Array} files - ファイルリスト
 * @returns {object} 検証結果
 */
export function validateBatchFiles(files) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        validFiles: [],
        invalidFiles: [],
        totalSize: 0
    };
    
    if (!files || files.length === 0) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.VALIDATION_ERROR,
            message: 'ファイルが選択されていません',
            suggestion: 'ファイルを選択してください'
        });
        return result;
    }
    
    // 各ファイルの検証
    Array.from(files).forEach((file, index) => {
        const fileValidation = validateImageFile(file);
        result.totalSize += file.size;
        
        if (fileValidation.isValid) {
            result.validFiles.push({
                file,
                index,
                format: fileValidation.info.detectedFormat,
                warnings: fileValidation.warnings
            });
        } else {
            result.invalidFiles.push({
                file,
                index,
                errors: fileValidation.errors
            });
        }
    });
    
    // バッチサイズの検証
    if (result.totalSize > FILE_SIZE_LIMITS.MAX_BATCH_SIZE) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.FILE_TOO_LARGE,
            message: `バッチファイルの合計サイズが制限を超えています`,
            suggestion: 'ファイル数を減らすか、より小さなファイルを選択してください'
        });
    }
    
    // 有効なファイルがない場合
    if (result.validFiles.length === 0) {
        result.isValid = false;
        result.errors.push({
            type: ERROR_TYPES.VALIDATION_ERROR,
            message: '有効なファイルがありません',
            suggestion: 'サポートされている画像ファイルを選択してください'
        });
    }
    
    return result;
}

/**
 * ブラウザ互換性の検証
 * @returns {object} 検証結果
 */
export function validateBrowserCompatibility() {
    const result = {
        isSupported: true,
        missingFeatures: [],
        warnings: []
    };
    
    // 必須機能のチェック
    const requiredFeatures = [
        { name: 'Canvas API', check: () => typeof HTMLCanvasElement !== 'undefined' },
        { name: 'File API', check: () => typeof FileReader !== 'undefined' },
        { name: 'Blob API', check: () => typeof Blob !== 'undefined' },
        { name: 'URL API', check: () => typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' }
    ];
    
    requiredFeatures.forEach(feature => {
        if (!feature.check()) {
            result.isSupported = false;
            result.missingFeatures.push(feature.name);
        }
    });
    
    // WebPサポートのチェック（警告のみ）
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        if (!webpSupported) {
            result.warnings.push({
                type: 'WEBP_NOT_SUPPORTED',
                message: 'WebP形式がサポートされていません',
                suggestion: 'WebP変換はPNG形式で代替されます'
            });
        }
    } catch (error) {
        result.warnings.push({
            type: 'WEBP_CHECK_FAILED',
            message: 'WebPサポートの確認に失敗しました',
            suggestion: 'WebP変換で問題が発生する可能性があります'
        });
    }
    
    return result;
}