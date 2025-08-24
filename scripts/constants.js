// 多形式画像変換のための定数定義

// サポートされる画像形式
export const SUPPORTED_FORMATS = {
    SVG: 'svg',
    PNG: 'png',
    JPG: 'jpg',
    JPEG: 'jpeg',
    WEBP: 'webp',
    GIF: 'gif'
};

// MIMEタイプマッピング
export const MIME_TYPES = {
    [SUPPORTED_FORMATS.SVG]: ['image/svg+xml'],
    [SUPPORTED_FORMATS.PNG]: ['image/png'],
    [SUPPORTED_FORMATS.JPG]: ['image/jpeg'],
    [SUPPORTED_FORMATS.JPEG]: ['image/jpeg'],
    [SUPPORTED_FORMATS.WEBP]: ['image/webp'],
    [SUPPORTED_FORMATS.GIF]: ['image/gif']
};

// ファイル拡張子マッピング
export const FILE_EXTENSIONS = {
    [SUPPORTED_FORMATS.SVG]: ['.svg'],
    [SUPPORTED_FORMATS.PNG]: ['.png'],
    [SUPPORTED_FORMATS.JPG]: ['.jpg', '.jpeg'],
    [SUPPORTED_FORMATS.JPEG]: ['.jpg', '.jpeg'],
    [SUPPORTED_FORMATS.WEBP]: ['.webp'],
    [SUPPORTED_FORMATS.GIF]: ['.gif']
};

// 変換品質設定
export const QUALITY_SETTINGS = {
    DEFAULT: {
        [SUPPORTED_FORMATS.JPG]: 90,
        [SUPPORTED_FORMATS.JPEG]: 90,
        [SUPPORTED_FORMATS.WEBP]: 85,
        [SUPPORTED_FORMATS.PNG]: 100,
        [SUPPORTED_FORMATS.GIF]: 100
    },
    MIN: 10,
    MAX: 100
};

// ファイルサイズ制限（バイト）
export const FILE_SIZE_LIMITS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_BATCH_SIZE: 50 * 1024 * 1024, // 50MB（バッチ処理用）
    WARNING_SIZE: 5 * 1024 * 1024 // 5MB（警告表示）
};

// 出力サイズプリセット
export const SIZE_PRESETS = {
    ORIGINAL: 'original',
    SMALL: '100x100',
    MEDIUM: '200x200',
    LARGE: '500x500',
    XLARGE: '1000x1000',
    CUSTOM: 'custom'
};

// サイズプリセット値
export const PRESET_SIZES = {
    [SIZE_PRESETS.SMALL]: { width: 100, height: 100 },
    [SIZE_PRESETS.MEDIUM]: { width: 200, height: 200 },
    [SIZE_PRESETS.LARGE]: { width: 500, height: 500 },
    [SIZE_PRESETS.XLARGE]: { width: 1000, height: 1000 }
};

// 変換オプションのデフォルト値
export const DEFAULT_CONVERSION_OPTIONS = {
    quality: QUALITY_SETTINGS.DEFAULT,
    maintainAspectRatio: true,
    transparentBackground: true,
    backgroundColor: '#ffffff',
    outputSize: SIZE_PRESETS.ORIGINAL,
    customWidth: null,
    customHeight: null
};

// エラータイプ定数
export const ERROR_TYPES = {
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    CONVERSION_FAILED: 'CONVERSION_FAILED',
    MEMORY_ERROR: 'MEMORY_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    INVALID_OPTIONS: 'INVALID_OPTIONS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    READ_ERROR: 'READ_ERROR',
    PROCESSING_ERROR: 'PROCESSING_ERROR',
    INVALID_SVG: 'INVALID_SVG',
    READ_TIMEOUT: 'READ_TIMEOUT',
    INVALID_STATE: 'INVALID_STATE',
    CANVAS_ERROR: 'CANVAS_ERROR',
    SIZE_ERROR: 'SIZE_ERROR',
    EMPTY_CONTENT_ERROR: 'EMPTY_CONTENT_ERROR'
};

// 変換タイムアウト設定（ミリ秒）
export const TIMEOUT_SETTINGS = {
    FILE_READ: 30000, // 30秒
    CONVERSION: 60000, // 60秒
    BATCH_CONVERSION: 300000 // 5分
};

// UI関連定数
export const UI_CONSTANTS = {
    ANIMATION_DURATION: 300,
    MESSAGE_AUTO_HIDE_DELAY: 5000,
    SUCCESS_MESSAGE_DELAY: 8000,
    LOADING_PROGRESS_INTERVAL: 200,
    MAX_PREVIEW_SIZE: 400
};

// ブラウザ互換性チェック用
export const REQUIRED_FEATURES = {
    CANVAS: 'HTMLCanvasElement',
    FILE_API: 'FileReader',
    BLOB: 'Blob',
    URL: 'URL'
};

// 変換可能な形式マッピング
export const CONVERSION_MATRIX = {
    [SUPPORTED_FORMATS.SVG]: [
        SUPPORTED_FORMATS.PNG,
        SUPPORTED_FORMATS.JPG,
        SUPPORTED_FORMATS.JPEG,
        SUPPORTED_FORMATS.WEBP,
        SUPPORTED_FORMATS.GIF
    ],
    [SUPPORTED_FORMATS.PNG]: [
        SUPPORTED_FORMATS.JPG,
        SUPPORTED_FORMATS.JPEG,
        SUPPORTED_FORMATS.WEBP,
        SUPPORTED_FORMATS.GIF,
        SUPPORTED_FORMATS.SVG
    ],
    [SUPPORTED_FORMATS.JPG]: [
        SUPPORTED_FORMATS.PNG,
        SUPPORTED_FORMATS.WEBP,
        SUPPORTED_FORMATS.GIF,
        SUPPORTED_FORMATS.SVG
    ],
    [SUPPORTED_FORMATS.JPEG]: [
        SUPPORTED_FORMATS.PNG,
        SUPPORTED_FORMATS.WEBP,
        SUPPORTED_FORMATS.GIF,
        SUPPORTED_FORMATS.SVG
    ],
    [SUPPORTED_FORMATS.WEBP]: [
        SUPPORTED_FORMATS.PNG,
        SUPPORTED_FORMATS.JPG,
        SUPPORTED_FORMATS.JPEG,
        SUPPORTED_FORMATS.GIF,
        SUPPORTED_FORMATS.SVG
    ],
    [SUPPORTED_FORMATS.GIF]: [
        SUPPORTED_FORMATS.PNG,
        SUPPORTED_FORMATS.JPG,
        SUPPORTED_FORMATS.JPEG,
        SUPPORTED_FORMATS.WEBP,
        SUPPORTED_FORMATS.SVG
    ]
};

// バッチ処理設定
export const BATCH_SETTINGS = {
    MAX_FILES: 20,
    CONCURRENT_CONVERSIONS: 3,
    PROGRESS_UPDATE_INTERVAL: 100
};