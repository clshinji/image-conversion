// 拡張ファイルハンドラー - 多形式画像対応
import { 
    SUPPORTED_FORMATS, 
    MIME_TYPES, 
    FILE_EXTENSIONS, 
    FILE_SIZE_LIMITS, 
    ERROR_TYPES,
    TIMEOUT_SETTINGS 
} from './constants.js';

class FileHandler {
    constructor(dataCleanupManager = null) {
        this.maxFileSize = FILE_SIZE_LIMITS.MAX_FILE_SIZE;
        this.maxFileSizeWarning = FILE_SIZE_LIMITS.WARNING_SIZE;
        this.maxComplexityScore = 1000; // SVG複雑度スコア制限
        this.dataCleanupManager = dataCleanupManager;
        
        // 多形式対応のサポート情報
        this.supportedFormats = Object.values(SUPPORTED_FORMATS);
        this.supportedExtensions = this.getAllSupportedExtensions();
        this.supportedMimeTypes = this.getAllSupportedMimeTypes();
        
        // マジックナンバー定義（ファイル形式検出用）
        this.magicNumbers = {
            [SUPPORTED_FORMATS.PNG]: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            [SUPPORTED_FORMATS.JPG]: [0xFF, 0xD8, 0xFF],
            [SUPPORTED_FORMATS.JPEG]: [0xFF, 0xD8, 0xFF],
            [SUPPORTED_FORMATS.WEBP]: [0x52, 0x49, 0x46, 0x46], // "RIFF"
            [SUPPORTED_FORMATS.GIF]: [0x47, 0x49, 0x46] // "GIF"
        };
    }

    // 全サポート拡張子を取得
    getAllSupportedExtensions() {
        const extensions = [];
        Object.values(FILE_EXTENSIONS).forEach(exts => {
            extensions.push(...exts);
        });
        return [...new Set(extensions)]; // 重複除去
    }

    // 全サポートMIMEタイプを取得
    getAllSupportedMimeTypes() {
        const mimeTypes = [];
        Object.values(MIME_TYPES).forEach(types => {
            mimeTypes.push(...types);
        });
        // SVG用の追加MIMEタイプ
        mimeTypes.push('text/xml', 'application/xml');
        return [...new Set(mimeTypes)]; // 重複除去
    }

    // ファイル形式を自動検出
    async detectImageFormat(file) {
        try {
            // 1. 拡張子による判定
            const extensionFormat = this.detectFormatByExtension(file.name);
            
            // 2. MIMEタイプによる判定
            const mimeFormat = this.detectFormatByMimeType(file.type);
            
            // 3. マジックナンバーによる判定（より確実）
            const magicFormat = await this.detectFormatByMagicNumber(file);
            
            // 4. SVGの場合はコンテンツ検証
            let contentFormat = null;
            if (extensionFormat === SUPPORTED_FORMATS.SVG || 
                mimeFormat === SUPPORTED_FORMATS.SVG || 
                magicFormat === SUPPORTED_FORMATS.SVG) {
                contentFormat = await this.detectSVGByContent(file);
            }

            // 検出結果の統合と優先順位付け
            const detectionResults = {
                extension: extensionFormat,
                mimeType: mimeFormat,
                magicNumber: magicFormat,
                content: contentFormat
            };

            // 最も信頼性の高い結果を選択
            const finalFormat = this.selectMostReliableFormat(detectionResults);
            
            return {
                format: finalFormat,
                confidence: this.calculateConfidence(detectionResults, finalFormat),
                detectionResults,
                isSupported: this.supportedFormats.includes(finalFormat)
            };

        } catch (error) {
            console.error('ファイル形式検出エラー:', error);
            throw new Error(`ファイル形式の検出に失敗しました: ${error.message}`);
        }
    }

    // 拡張子による形式検出
    detectFormatByExtension(filename) {
        if (!filename) return null;
        
        const extension = this.getFileExtension(filename).toLowerCase();
        
        for (const [format, extensions] of Object.entries(FILE_EXTENSIONS)) {
            if (extensions.includes(extension)) {
                return format;
            }
        }
        
        return null;
    }

    // MIMEタイプによる形式検出
    detectFormatByMimeType(mimeType) {
        if (!mimeType) return null;
        
        for (const [format, mimeTypes] of Object.entries(MIME_TYPES)) {
            if (mimeTypes.includes(mimeType)) {
                return format;
            }
        }
        
        // SVG用の特別処理
        if (mimeType === 'text/xml' || mimeType === 'application/xml') {
            return SUPPORTED_FORMATS.SVG;
        }
        
        return null;
    }

    // マジックナンバーによる形式検出
    async detectFormatByMagicNumber(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    const bytes = new Uint8Array(arrayBuffer);
                    
                    // 各形式のマジックナンバーをチェック
                    for (const [format, magicBytes] of Object.entries(this.magicNumbers)) {
                        if (this.matchesMagicNumber(bytes, magicBytes)) {
                            resolve(format);
                            return;
                        }
                    }
                    
                    // WebPの特別処理（RIFFヘッダー + WEBP識別子）
                    if (this.isWebPFormat(bytes)) {
                        resolve(SUPPORTED_FORMATS.WEBP);
                        return;
                    }
                    
                    resolve(null);
                } catch (error) {
                    console.error('マジックナンバー検出エラー:', error);
                    resolve(null);
                }
            };
            
            reader.onerror = () => resolve(null);
            
            // 最初の16バイトのみ読み込み（マジックナンバー検出に十分）
            const blob = file.slice(0, 16);
            reader.readAsArrayBuffer(blob);
        });
    }

    // マジックナンバーの一致チェック
    matchesMagicNumber(fileBytes, magicBytes) {
        if (fileBytes.length < magicBytes.length) return false;
        
        for (let i = 0; i < magicBytes.length; i++) {
            if (fileBytes[i] !== magicBytes[i]) {
                return false;
            }
        }
        
        return true;
    }

    // WebP形式の特別検出
    isWebPFormat(bytes) {
        // RIFF (0x52494646) + 4バイトスキップ + WEBP (0x57454250)
        if (bytes.length < 12) return false;
        
        const riffSignature = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
        const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
        
        // RIFFヘッダーチェック
        if (!this.matchesMagicNumber(bytes, riffSignature)) return false;
        
        // WEBPシグネチャーチェック（8バイト目から）
        const webpBytes = bytes.slice(8, 12);
        return this.matchesMagicNumber(webpBytes, webpSignature);
    }

    // SVGコンテンツによる検出
    async detectSVGByContent(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    
                    // SVGタグの存在チェック
                    if (content.includes('<svg') && content.includes('</svg>')) {
                        resolve(SUPPORTED_FORMATS.SVG);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('SVGコンテンツ検出エラー:', error);
                    resolve(null);
                }
            };
            
            reader.onerror = () => resolve(null);
            
            // テキストとして最初の1KBを読み込み
            const blob = file.slice(0, 1024);
            reader.readAsText(blob, 'UTF-8');
        });
    }

    // 最も信頼性の高い形式を選択
    selectMostReliableFormat(detectionResults) {
        const { extension, mimeType, magicNumber, content } = detectionResults;
        
        // 優先順位: マジックナンバー > コンテンツ > MIMEタイプ > 拡張子
        if (magicNumber && this.supportedFormats.includes(magicNumber)) {
            return magicNumber;
        }
        
        if (content && this.supportedFormats.includes(content)) {
            return content;
        }
        
        if (mimeType && this.supportedFormats.includes(mimeType)) {
            return mimeType;
        }
        
        if (extension && this.supportedFormats.includes(extension)) {
            return extension;
        }
        
        return null;
    }

    // 検出信頼度を計算
    calculateConfidence(detectionResults, finalFormat) {
        if (!finalFormat) return 0;
        
        let confidence = 0;
        let matches = 0;
        
        Object.values(detectionResults).forEach(result => {
            if (result === finalFormat) {
                matches++;
            }
        });
        
        // マジックナンバーが一致する場合は高い信頼度
        if (detectionResults.magicNumber === finalFormat) {
            confidence += 40;
        }
        
        // コンテンツが一致する場合（SVG用）
        if (detectionResults.content === finalFormat) {
            confidence += 30;
        }
        
        // MIMEタイプが一致する場合
        if (detectionResults.mimeType === finalFormat) {
            confidence += 20;
        }
        
        // 拡張子が一致する場合
        if (detectionResults.extension === finalFormat) {
            confidence += 10;
        }
        
        return Math.min(confidence, 100);
    }

    // 多形式ファイル検証
    validateImageFile(file, expectedFormat = null) {
        const errors = [];
        const warnings = [];

        try {
            // 基本的なファイル検証
            if (!file) {
                errors.push({
                    type: ERROR_TYPES.VALIDATION_ERROR,
                    message: 'ファイルが選択されていません',
                    suggestion: '画像ファイルを選択してください'
                });
                return { isValid: false, errors, warnings };
            }

            // ファイルサイズチェック
            if (file.size === 0) {
                errors.push({
                    type: ERROR_TYPES.VALIDATION_ERROR,
                    message: 'ファイルが空です',
                    suggestion: '有効な画像ファイルを選択してください'
                });
            } else if (file.size > this.maxFileSize) {
                errors.push({
                    type: ERROR_TYPES.FILE_TOO_LARGE,
                    message: `ファイルサイズが大きすぎます（${this.formatFileSize(file.size)} > ${this.formatFileSize(this.maxFileSize)}）`,
                    suggestion: 'より小さな画像ファイルを選択するか、ファイルを圧縮してください'
                });
            } else if (file.size > this.maxFileSizeWarning) {
                warnings.push({
                    type: 'LARGE_FILE_WARNING',
                    message: `大きなファイルです（${this.formatFileSize(file.size)}）。処理に時間がかかる可能性があります`,
                    suggestion: 'より小さなファイルの使用を推奨します'
                });
            }

            // ファイル名検証
            if (!file.name || file.name.trim() === '') {
                warnings.push({
                    type: 'FILENAME_EMPTY',
                    message: 'ファイル名が空です',
                    suggestion: 'ファイル名を確認してください'
                });
            }

            // 拡張子チェック
            const fileName = file.name.toLowerCase();
            const hasValidExtension = this.supportedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!hasValidExtension) {
                errors.push({
                    type: ERROR_TYPES.UNSUPPORTED_FORMAT,
                    message: `サポートされていないファイル形式です（${this.getFileExtension(file.name)}）`,
                    suggestion: `サポートされている形式（${this.supportedExtensions.join(', ')}）を選択してください`
                });
            }

            // MIMEタイプチェック
            if (file.type && !this.supportedMimeTypes.includes(file.type)) {
                warnings.push({
                    type: 'MIME_TYPE_WARNING',
                    message: `MIMEタイプが一般的ではありません（${file.type}）`,
                    suggestion: 'ファイルが正しい画像形式であることを確認してください'
                });
            }

            // 期待される形式との一致チェック
            if (expectedFormat) {
                const detectedExtension = this.detectFormatByExtension(file.name);
                const detectedMimeType = this.detectFormatByMimeType(file.type);
                
                if (detectedExtension && detectedExtension !== expectedFormat) {
                    warnings.push({
                        type: 'FORMAT_MISMATCH',
                        message: `期待される形式（${expectedFormat}）と拡張子（${detectedExtension}）が一致しません`,
                        suggestion: 'ファイル形式を確認してください'
                    });
                }
                
                if (detectedMimeType && detectedMimeType !== expectedFormat) {
                    warnings.push({
                        type: 'MIME_FORMAT_MISMATCH',
                        message: `期待される形式（${expectedFormat}）とMIMEタイプ（${detectedMimeType}）が一致しません`,
                        suggestion: 'ファイル形式を確認してください'
                    });
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                fileInfo: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    extension: this.getFileExtension(file.name)
                }
            };

        } catch (error) {
            console.error('ファイル検証中にエラーが発生:', error);
            errors.push({
                type: ERROR_TYPES.VALIDATION_ERROR,
                message: 'ファイル検証中にエラーが発生しました',
                suggestion: 'ファイルを再選択してください',
                details: error.message
            });
            
            return { isValid: false, errors, warnings: [] };
        }
    }

    // ファイル拡張子を取得
    getFileExtension(filename) {
        if (!filename) return '';
        const lastDot = filename.lastIndexOf('.');
        return lastDot === -1 ? '' : filename.substring(lastDot);
    }

    // ファイルサイズをフォーマット
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // サポートされている形式かチェック
    isSupportedFormat(format) {
        return this.supportedFormats.includes(format);
    }

    // 形式間の変換が可能かチェック
    canConvert(fromFormat, toFormat) {
        // 同じ形式への変換は不要
        if (fromFormat === toFormat) return false;
        
        // 両方の形式がサポートされているかチェック
        return this.isSupportedFormat(fromFormat) && this.isSupportedFormat(toFormat);
    }

    // サポートされている全形式を取得
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    // 特定の形式でサポートされている拡張子を取得
    getExtensionsForFormat(format) {
        return FILE_EXTENSIONS[format] || [];
    }

    // 特定の形式でサポートされているMIMEタイプを取得
    getMimeTypesForFormat(format) {
        return MIME_TYPES[format] || [];
    }

    // 多形式ファイル読み込み処理
    async readImageFile(file) {
        return new Promise(async (resolve, reject) => {
            try {
                // ファイル形式を自動検出
                const formatDetection = await this.detectImageFormat(file);
                
                if (!formatDetection.isSupported) {
                    const error = new Error(`サポートされていない画像形式です: ${formatDetection.format || '不明'}`);
                    error.type = ERROR_TYPES.UNSUPPORTED_FORMAT;
                    error.suggestion = `サポートされている形式（${this.supportedFormats.join(', ')}）を選択してください`;
                    reject(error);
                    return;
                }

                // ファイル検証
                const validation = this.validateImageFile(file, formatDetection.format);
                
                if (!validation.isValid) {
                    const errorMessages = validation.errors.map(err => err.message);
                    const suggestions = validation.errors.map(err => err.suggestion).filter(Boolean);
                    
                    const error = new Error(errorMessages.join('\n'));
                    error.type = ERROR_TYPES.VALIDATION_ERROR;
                    error.errors = validation.errors;
                    error.suggestions = suggestions;
                    reject(error);
                    return;
                }

                // 警告がある場合はログに出力
                if (validation.warnings && validation.warnings.length > 0) {
                    console.warn('ファイル読み込み時の警告:', validation.warnings);
                }

                // 形式に応じた読み込み処理
                const readResult = await this.readFileByFormat(file, formatDetection.format);
                
                // 成功時のレスポンス
                resolve({
                    content: readResult.content,
                    imageData: readResult.imageData,
                    format: formatDetection.format,
                    confidence: formatDetection.confidence,
                    fileInfo: {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                        extension: this.getFileExtension(file.name),
                        detectedFormat: formatDetection.format
                    },
                    validation: {
                        ...validation,
                        formatDetection
                    },
                    metadata: readResult.metadata
                });

            } catch (error) {
                console.error('ファイル読み込みエラー:', error);
                
                if (error.type) {
                    reject(error);
                } else {
                    const readError = new Error(`ファイルの読み込みに失敗しました: ${error.message}`);
                    readError.type = ERROR_TYPES.READ_ERROR;
                    readError.suggestion = 'ファイルを再選択してください';
                    readError.originalError = error;
                    reject(readError);
                }
            }
        });
    }

    // 形式に応じたファイル読み込み
    async readFileByFormat(file, format) {
        switch (format) {
            case SUPPORTED_FORMATS.SVG:
                return await this.readSVGFile(file);
            
            case SUPPORTED_FORMATS.PNG:
            case SUPPORTED_FORMATS.JPG:
            case SUPPORTED_FORMATS.JPEG:
            case SUPPORTED_FORMATS.WEBP:
            case SUPPORTED_FORMATS.GIF:
                return await this.readRasterFile(file, format);
            
            default:
                throw new Error(`サポートされていない形式です: ${format}`);
        }
    }

    // SVGファイル読み込み（既存機能を活用）
    async readSVGFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            let readTimeout;

            // タイムアウト設定
            const timeoutMs = TIMEOUT_SETTINGS.FILE_READ;
            readTimeout = setTimeout(() => {
                reader.abort();
                const error = new Error('SVGファイル読み込みがタイムアウトしました');
                error.type = ERROR_TYPES.READ_TIMEOUT;
                error.suggestion = 'より小さなファイルを選択するか、しばらく待ってから再試行してください';
                reject(error);
            }, timeoutMs);

            reader.onload = async (event) => {
                clearTimeout(readTimeout);
                
                try {
                    const content = event.target.result;
                    
                    if (!content || content.trim().length === 0) {
                        const error = new Error('SVGファイルの内容が空です');
                        error.type = ERROR_TYPES.EMPTY_CONTENT_ERROR;
                        error.suggestion = '有効なSVGファイルを選択してください';
                        reject(error);
                        return;
                    }

                    // SVG構造検証
                    const svgValidation = await this.validateSVGStructure(content);
                    
                    // SVGメタデータ抽出
                    const metadata = this.extractSVGMetadata(content);

                    resolve({
                        content,
                        imageData: null, // SVGはテキストデータ
                        metadata: {
                            ...metadata,
                            validation: svgValidation
                        }
                    });

                } catch (error) {
                    clearTimeout(readTimeout);
                    console.error('SVGファイル処理中にエラー:', error);
                    
                    const processError = new Error(`SVGファイルの処理中にエラーが発生しました: ${error.message}`);
                    processError.type = ERROR_TYPES.PROCESSING_ERROR;
                    processError.suggestion = 'ファイルを再選択するか、別のSVGファイルを試してください';
                    processError.originalError = error;
                    reject(processError);
                }
            };

            reader.onerror = (event) => {
                clearTimeout(readTimeout);
                this.handleFileReaderError(reader, reject);
            };

            reader.onabort = () => {
                clearTimeout(readTimeout);
                const error = new Error('SVGファイル読み込みが中断されました');
                error.type = ERROR_TYPES.READ_ERROR;
                error.suggestion = '再度ファイルを選択してください';
                reject(error);
            };

            try {
                reader.readAsText(file, 'UTF-8');
            } catch (startError) {
                clearTimeout(readTimeout);
                this.handleFileReaderStartError(startError, reject);
            }
        });
    }

    // ラスター画像ファイル読み込み
    async readRasterFile(file, format) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            let readTimeout;

            // タイムアウト設定
            const timeoutMs = TIMEOUT_SETTINGS.FILE_READ;
            readTimeout = setTimeout(() => {
                reader.abort();
                const error = new Error(`${format.toUpperCase()}ファイル読み込みがタイムアウトしました`);
                error.type = ERROR_TYPES.READ_TIMEOUT;
                error.suggestion = 'より小さなファイルを選択するか、しばらく待ってから再試行してください';
                reject(error);
            }, timeoutMs);

            reader.onload = async (event) => {
                clearTimeout(readTimeout);
                
                try {
                    const arrayBuffer = event.target.result;
                    
                    // Canvas APIを使用して画像データを読み込み
                    const imageData = await this.loadImageFromArrayBuffer(arrayBuffer, format);
                    
                    // 画像メタデータ抽出
                    const metadata = await this.extractRasterMetadata(imageData, format, file);

                    resolve({
                        content: arrayBuffer, // バイナリデータ
                        imageData,
                        metadata
                    });

                } catch (error) {
                    clearTimeout(readTimeout);
                    console.error(`${format}ファイル処理中にエラー:`, error);
                    
                    const processError = new Error(`${format.toUpperCase()}ファイルの処理中にエラーが発生しました: ${error.message}`);
                    processError.type = ERROR_TYPES.PROCESSING_ERROR;
                    processError.suggestion = 'ファイルを再選択するか、別の画像ファイルを試してください';
                    processError.originalError = error;
                    reject(processError);
                }
            };

            reader.onerror = (event) => {
                clearTimeout(readTimeout);
                this.handleFileReaderError(reader, reject);
            };

            reader.onabort = () => {
                clearTimeout(readTimeout);
                const error = new Error(`${format.toUpperCase()}ファイル読み込みが中断されました`);
                error.type = ERROR_TYPES.READ_ERROR;
                error.suggestion = '再度ファイルを選択してください';
                reject(error);
            };

            try {
                reader.readAsArrayBuffer(file);
            } catch (startError) {
                clearTimeout(readTimeout);
                this.handleFileReaderStartError(startError, reject);
            }
        });
    }

    // ArrayBufferから画像データを読み込み
    async loadImageFromArrayBuffer(arrayBuffer, format) {
        return new Promise((resolve, reject) => {
            try {
                // Blobを作成
                const blob = new Blob([arrayBuffer], { type: this.getMimeTypesForFormat(format)[0] });
                const url = URL.createObjectURL(blob);

                // データクリーンアップ管理に登録
                if (this.dataCleanupManager) {
                    this.dataCleanupManager.registerBlobUrl(url, `Image loading for ${format}`);
                }

                // Image要素を作成して読み込み
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Canvasに描画してImageDataを取得
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        
                        ctx.drawImage(img, 0, 0);
                        
                        const imageData = {
                            canvas,
                            context: ctx,
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                            data: ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
                        };

                        // Canvas要素をデータクリーンアップ管理に登録
                        if (this.dataCleanupManager) {
                            this.dataCleanupManager.registerCanvas(canvas, `Image processing for ${format}`);
                        }

                        // URLを解放
                        URL.revokeObjectURL(url);
                        
                        resolve(imageData);
                    } catch (canvasError) {
                        URL.revokeObjectURL(url);
                        reject(new Error(`Canvas処理エラー: ${canvasError.message}`));
                    }
                };

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error(`画像の読み込みに失敗しました: ${format}`));
                };

                img.src = url;

            } catch (error) {
                reject(new Error(`画像データの処理に失敗しました: ${error.message}`));
            }
        });
    }

    // SVGメタデータ抽出
    extractSVGMetadata(content) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');

            if (!svgElement) {
                return { error: 'SVG要素が見つかりません' };
            }

            const metadata = {
                width: svgElement.getAttribute('width'),
                height: svgElement.getAttribute('height'),
                viewBox: svgElement.getAttribute('viewBox'),
                hasTransparency: true, // SVGは基本的に透明度をサポート
                colorProfile: null,
                elementCount: svgElement.querySelectorAll('*').length
            };

            // viewBoxから実際のサイズを計算
            if (metadata.viewBox && (!metadata.width || !metadata.height)) {
                const viewBoxValues = metadata.viewBox.split(/\s+|,/).filter(v => v.trim() !== '');
                if (viewBoxValues.length === 4) {
                    metadata.calculatedWidth = parseFloat(viewBoxValues[2]);
                    metadata.calculatedHeight = parseFloat(viewBoxValues[3]);
                }
            }

            return metadata;
        } catch (error) {
            console.error('SVGメタデータ抽出エラー:', error);
            return { error: error.message };
        }
    }

    // ラスター画像メタデータ抽出
    async extractRasterMetadata(imageData, format, file) {
        try {
            const metadata = {
                width: imageData.width,
                height: imageData.height,
                format: format,
                fileSize: file.size,
                hasTransparency: await this.checkImageTransparency(imageData),
                colorDepth: 8, // 一般的な値（詳細な検出は複雑）
                aspectRatio: imageData.width / imageData.height
            };

            // 形式固有の情報
            switch (format) {
                case SUPPORTED_FORMATS.PNG:
                    metadata.supportsTransparency = true;
                    break;
                case SUPPORTED_FORMATS.JPG:
                case SUPPORTED_FORMATS.JPEG:
                    metadata.supportsTransparency = false;
                    break;
                case SUPPORTED_FORMATS.WEBP:
                    metadata.supportsTransparency = true;
                    metadata.supportsAnimation = true; // WebPはアニメーション対応
                    break;
                case SUPPORTED_FORMATS.GIF:
                    metadata.supportsTransparency = true;
                    metadata.supportsAnimation = true;
                    break;
            }

            return metadata;
        } catch (error) {
            console.error('ラスター画像メタデータ抽出エラー:', error);
            return { error: error.message };
        }
    }

    // 画像の透明度チェック
    async checkImageTransparency(imageData) {
        try {
            const data = imageData.data.data;
            
            // アルファチャンネルをチェック（RGBA形式）
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) {
                    return true; // 透明または半透明のピクセルが見つかった
                }
            }
            
            return false; // 完全に不透明
        } catch (error) {
            console.error('透明度チェックエラー:', error);
            return false;
        }
    }

    // FileReaderエラーハンドリング
    handleFileReaderError(reader, reject) {
        console.error('FileReader エラー:', reader.error);
        
        let errorMessage = 'ファイルの読み込みに失敗しました';
        let suggestion = 'ファイルを再選択してください';
        
        if (reader.error) {
            switch (reader.error.name) {
                case 'NotReadableError':
                    errorMessage = 'ファイルが読み取れません';
                    suggestion = 'ファイルが使用中でないか確認し、再試行してください';
                    break;
                case 'SecurityError':
                    errorMessage = 'セキュリティエラーによりファイルを読み取れません';
                    suggestion = 'ブラウザの設定を確認するか、別の方法でファイルを選択してください';
                    break;
                case 'AbortError':
                    errorMessage = 'ファイル読み込みが中断されました';
                    suggestion = '再度ファイルを選択してください';
                    break;
                default:
                    errorMessage = `ファイル読み込みエラー: ${reader.error.name}`;
            }
        }
        
        const error = new Error(errorMessage);
        error.type = ERROR_TYPES.READ_ERROR;
        error.suggestion = suggestion;
        error.originalError = reader.error;
        reject(error);
    }

    // FileReader開始エラーハンドリング
    handleFileReaderStartError(startError, reject) {
        console.error('FileReader 開始エラー:', startError);
        
        const error = new Error('ファイル読み込みを開始できませんでした');
        error.type = ERROR_TYPES.READ_ERROR;
        error.suggestion = 'ブラウザを再読み込みして再試行してください';
        error.originalError = startError;
        reject(error);
    }

    // SVG構造検証（簡略版 - 既存のvalidateSVGStructureメソッドを参照）
    async validateSVGStructure(content) {
        // 既存のSVG検証ロジックを使用
        // ここでは簡略化した検証を実装
        try {
            if (!content.includes('<svg')) {
                throw new Error('SVGタグが見つかりません');
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'image/svg+xml');
            
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XMLの構文エラーがあります');
            }

            const svgElement = doc.querySelector('svg');
            if (!svgElement) {
                throw new Error('有効なSVG要素が見つかりません');
            }

            return {
                isValid: true,
                warnings: [],
                info: {
                    hasValidStructure: true,
                    elementCount: svgElement.querySelectorAll('*').length
                }
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [{ message: error.message }],
                warnings: []
            };
        }
    }
}

export default FileHandler;