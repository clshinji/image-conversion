// 多形式画像変換のためのユーティリティ関数

import { 
    SUPPORTED_FORMATS, 
    MIME_TYPES, 
    FILE_EXTENSIONS, 
    FILE_SIZE_LIMITS,
    ERROR_TYPES 
} from '../constants.js';

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたファイルサイズ
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ファイル形式を検出
 * @param {File} file - ファイルオブジェクト
 * @returns {string|null} 検出された形式またはnull
 */
export function detectImageFormat(file) {
    // MIMEタイプによる検出
    for (const [format, mimeTypes] of Object.entries(MIME_TYPES)) {
        if (mimeTypes.includes(file.type)) {
            return format;
        }
    }
    
    // ファイル拡張子による検出
    const fileName = file.name.toLowerCase();
    for (const [format, extensions] of Object.entries(FILE_EXTENSIONS)) {
        if (extensions.some(ext => fileName.endsWith(ext))) {
            return format;
        }
    }
    
    return null;
}

/**
 * ファイル形式が画像かどうかチェック
 * @param {File} file - ファイルオブジェクト
 * @returns {boolean} 画像ファイルかどうか
 */
export function isImageFile(file) {
    return detectImageFormat(file) !== null;
}

/**
 * ファイルサイズが制限内かチェック
 * @param {File} file - ファイルオブジェクト
 * @returns {object} 検証結果
 */
export function validateFileSize(file) {
    const result = {
        isValid: true,
        isWarning: false,
        message: null,
        suggestion: null
    };
    
    if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
        result.isValid = false;
        result.message = `ファイルサイズが制限を超えています（${formatFileSize(file.size)} > ${formatFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}）`;
        result.suggestion = 'より小さなファイルを選択してください';
    } else if (file.size > FILE_SIZE_LIMITS.WARNING_SIZE) {
        result.isWarning = true;
        result.message = `大きなファイルです（${formatFileSize(file.size)}）。処理に時間がかかる場合があります`;
        result.suggestion = '処理完了まで少々お待ちください';
    }
    
    return result;
}

/**
 * 変換がサポートされているかチェック
 * @param {string} fromFormat - 変換元形式
 * @param {string} toFormat - 変換先形式
 * @returns {boolean} サポートされているかどうか
 */
export function isConversionSupported(fromFormat, toFormat) {
    if (!fromFormat || !toFormat) return false;
    if (fromFormat === toFormat) return false;
    
    const supportedFormats = Object.values(SUPPORTED_FORMATS);
    return supportedFormats.includes(fromFormat) && supportedFormats.includes(toFormat);
}

/**
 * 一意のIDを生成
 * @returns {string} 一意のID
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 画像のメタデータを取得
 * @param {HTMLImageElement|SVGElement} element - 画像要素
 * @returns {object} メタデータ
 */
export function getImageMetadata(element) {
    const metadata = {
        width: 0,
        height: 0,
        aspectRatio: 1,
        hasTransparency: false
    };
    
    if (element instanceof HTMLImageElement) {
        metadata.width = element.naturalWidth || element.width;
        metadata.height = element.naturalHeight || element.height;
    } else if (element instanceof SVGSVGElement) {
        const viewBox = element.viewBox.baseVal;
        if (viewBox.width && viewBox.height) {
            metadata.width = viewBox.width;
            metadata.height = viewBox.height;
        } else {
            // viewBoxがない場合はwidth/height属性を使用
            metadata.width = parseFloat(element.getAttribute('width')) || 100;
            metadata.height = parseFloat(element.getAttribute('height')) || 100;
        }
    }
    
    if (metadata.height > 0) {
        metadata.aspectRatio = metadata.width / metadata.height;
    }
    
    return metadata;
}

/**
 * アスペクト比を維持してサイズを計算
 * @param {number} originalWidth - 元の幅
 * @param {number} originalHeight - 元の高さ
 * @param {number} targetWidth - 目標幅
 * @param {number} targetHeight - 目標高さ
 * @param {boolean} maintainAspectRatio - アスペクト比を維持するか
 * @returns {object} 計算されたサイズ
 */
export function calculateOutputSize(originalWidth, originalHeight, targetWidth, targetHeight, maintainAspectRatio = true) {
    if (!maintainAspectRatio) {
        return {
            width: targetWidth || originalWidth,
            height: targetHeight || originalHeight
        };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    // 幅のみ指定された場合
    if (targetWidth && !targetHeight) {
        return {
            width: targetWidth,
            height: Math.round(targetWidth / aspectRatio)
        };
    }
    
    // 高さのみ指定された場合
    if (targetHeight && !targetWidth) {
        return {
            width: Math.round(targetHeight * aspectRatio),
            height: targetHeight
        };
    }
    
    // 両方指定された場合、アスペクト比を維持して収まるサイズを計算
    if (targetWidth && targetHeight) {
        const widthRatio = targetWidth / originalWidth;
        const heightRatio = targetHeight / originalHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        
        return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
        };
    }
    
    // 何も指定されていない場合は元のサイズ
    return {
        width: originalWidth,
        height: originalHeight
    };
}

/**
 * カラーコードの妥当性をチェック
 * @param {string} color - カラーコード
 * @returns {boolean} 妥当かどうか
 */
export function isValidColor(color) {
    if (!color || typeof color !== 'string') return false;
    
    // HEXカラーコードのチェック
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(color)) return true;
    
    // CSS色名のチェック（基本的なもののみ）
    const cssColors = [
        'transparent', 'white', 'black', 'red', 'green', 'blue',
        'yellow', 'cyan', 'magenta', 'gray', 'grey'
    ];
    if (cssColors.includes(color.toLowerCase())) return true;
    
    return false;
}

/**
 * エラーオブジェクトを作成
 * @param {string} message - エラーメッセージ
 * @param {string} type - エラータイプ
 * @param {string} suggestion - 解決提案
 * @param {Error} originalError - 元のエラー
 * @returns {Error} 拡張されたエラーオブジェクト
 */
export function createError(message, type = ERROR_TYPES.PROCESSING_ERROR, suggestion = null, originalError = null) {
    const error = new Error(message);
    error.type = type;
    error.suggestion = suggestion;
    error.originalError = originalError;
    error.timestamp = new Date();
    return error;
}

/**
 * 非同期処理のタイムアウト処理
 * @param {Promise} promise - 処理するPromise
 * @param {number} timeout - タイムアウト時間（ミリ秒）
 * @param {string} timeoutMessage - タイムアウト時のメッセージ
 * @returns {Promise} タイムアウト付きのPromise
 */
export function withTimeout(promise, timeout, timeoutMessage = 'Operation timed out') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(createError(timeoutMessage, ERROR_TYPES.TIMEOUT_ERROR));
            }, timeout);
        })
    ]);
}

/**
 * ブラウザの機能サポートをチェック
 * @param {string} feature - チェックする機能名
 * @returns {boolean} サポートされているかどうか
 */
export function isFeatureSupported(feature) {
    switch (feature) {
        case 'canvas':
            return typeof HTMLCanvasElement !== 'undefined';
        case 'fileapi':
            return typeof FileReader !== 'undefined';
        case 'blob':
            return typeof Blob !== 'undefined';
        case 'url':
            return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
        case 'webp':
            // WebPサポートの検出
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        default:
            return false;
    }
}

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * スロットル関数
 * @param {Function} func - 実行する関数
 * @param {number} limit - 制限時間（ミリ秒）
 * @returns {Function} スロットルされた関数
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 深いオブジェクトのクローンを作成
 * @param {object} obj - クローンするオブジェクト
 * @returns {object} クローンされたオブジェクト
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 配列をチャンクに分割
 * @param {Array} array - 分割する配列
 * @param {number} size - チャンクサイズ
 * @returns {Array} チャンクの配列
 */
export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}