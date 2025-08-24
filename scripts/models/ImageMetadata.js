// 画像メタデータのデータモデル

/**
 * 画像メタデータクラス
 * 画像の詳細情報を管理するためのデータモデル
 */
export class ImageMetadata {
    constructor(options = {}) {
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.format = options.format || '';
        this.fileSize = options.fileSize || 0;
        this.colorDepth = options.colorDepth || 0;
        this.hasTransparency = options.hasTransparency || false;
        this.colorProfile = options.colorProfile || null;
        this.dpi = options.dpi || null;
        this.aspectRatio = this.height > 0 ? this.width / this.height : 1;
        
        // SVG固有の情報
        this.hasViewBox = options.hasViewBox || false;
        this.viewBox = options.viewBox || null;
        this.elementCount = options.elementCount || 0;
        this.contentTypes = options.contentTypes || [];
        
        // 変換関連の情報
        this.originalFormat = options.originalFormat || null;
        this.conversionTime = options.conversionTime || null;
        this.compressionRatio = options.compressionRatio || null;
    }
    
    /**
     * アスペクト比を計算
     * @returns {number} アスペクト比
     */
    calculateAspectRatio() {
        if (this.height > 0) {
            this.aspectRatio = this.width / this.height;
        }
        return this.aspectRatio;
    }
    
    /**
     * 画像が正方形かどうかチェック
     * @returns {boolean} 正方形かどうか
     */
    isSquare() {
        return Math.abs(this.aspectRatio - 1) < 0.01;
    }
    
    /**
     * 画像が横長かどうかチェック
     * @returns {boolean} 横長かどうか
     */
    isLandscape() {
        return this.aspectRatio > 1;
    }
    
    /**
     * 画像が縦長かどうかチェック
     * @returns {boolean} 縦長かどうか
     */
    isPortrait() {
        return this.aspectRatio < 1;
    }
    
    /**
     * 画像サイズを人間が読みやすい形式で取得
     * @returns {string} フォーマットされたサイズ
     */
    getFormattedSize() {
        return `${this.width} × ${this.height}px`;
    }
    
    /**
     * ファイルサイズを人間が読みやすい形式で取得
     * @returns {string} フォーマットされたファイルサイズ
     */
    getFormattedFileSize() {
        if (this.fileSize === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(this.fileSize) / Math.log(k));
        
        return parseFloat((this.fileSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 解像度カテゴリを取得
     * @returns {string} 解像度カテゴリ
     */
    getResolutionCategory() {
        const totalPixels = this.width * this.height;
        
        if (totalPixels < 100000) return '低解像度';
        if (totalPixels < 500000) return '標準解像度';
        if (totalPixels < 2000000) return '高解像度';
        if (totalPixels < 8000000) return '超高解像度';
        return '4K以上';
    }
    
    /**
     * 色深度の説明を取得
     * @returns {string} 色深度の説明
     */
    getColorDepthDescription() {
        switch (this.colorDepth) {
            case 1: return 'モノクロ';
            case 8: return '256色';
            case 16: return '65,536色';
            case 24: return '1,677万色';
            case 32: return '1,677万色 + 透明度';
            default: return `${this.colorDepth}bit`;
        }
    }
    
    /**
     * SVG固有の情報を設定
     * @param {object} svgInfo - SVG情報
     */
    setSVGInfo(svgInfo) {
        this.hasViewBox = svgInfo.hasViewBox || false;
        this.viewBox = svgInfo.viewBox || null;
        this.elementCount = svgInfo.elementCount || 0;
        this.contentTypes = svgInfo.contentTypes || [];
    }
    
    /**
     * 変換情報を設定
     * @param {object} conversionInfo - 変換情報
     */
    setConversionInfo(conversionInfo) {
        this.originalFormat = conversionInfo.originalFormat || null;
        this.conversionTime = conversionInfo.conversionTime || null;
        this.compressionRatio = conversionInfo.compressionRatio || null;
    }
    
    /**
     * 圧縮率を計算
     * @param {number} originalSize - 元のファイルサイズ
     */
    calculateCompressionRatio(originalSize) {
        if (originalSize > 0 && this.fileSize > 0) {
            this.compressionRatio = ((originalSize - this.fileSize) / originalSize) * 100;
        }
    }
    
    /**
     * 圧縮率を人間が読みやすい形式で取得
     * @returns {string} フォーマットされた圧縮率
     */
    getFormattedCompressionRatio() {
        if (this.compressionRatio === null) return '未計算';
        
        if (this.compressionRatio > 0) {
            return `${this.compressionRatio.toFixed(1)}% 削減`;
        } else if (this.compressionRatio < 0) {
            return `${Math.abs(this.compressionRatio).toFixed(1)}% 増加`;
        } else {
            return '変化なし';
        }
    }
    
    /**
     * メタデータの概要を取得
     * @returns {object} 概要情報
     */
    getSummary() {
        return {
            dimensions: this.getFormattedSize(),
            fileSize: this.getFormattedFileSize(),
            format: this.format.toUpperCase(),
            aspectRatio: this.aspectRatio.toFixed(2),
            resolution: this.getResolutionCategory(),
            hasTransparency: this.hasTransparency,
            colorDepth: this.getColorDepthDescription()
        };
    }
    
    /**
     * SVG固有の概要を取得
     * @returns {object|null} SVG概要情報
     */
    getSVGSummary() {
        if (this.format.toLowerCase() !== 'svg') return null;
        
        return {
            hasViewBox: this.hasViewBox,
            elementCount: this.elementCount,
            contentTypes: this.contentTypes,
            complexity: this.elementCount > 100 ? '複雑' : this.elementCount > 20 ? '中程度' : '単純'
        };
    }
    
    /**
     * 変換情報の概要を取得
     * @returns {object|null} 変換概要情報
     */
    getConversionSummary() {
        if (!this.originalFormat) return null;
        
        return {
            originalFormat: this.originalFormat.toUpperCase(),
            currentFormat: this.format.toUpperCase(),
            conversionTime: this.conversionTime ? `${this.conversionTime}ms` : '未計測',
            compressionRatio: this.getFormattedCompressionRatio()
        };
    }
    
    /**
     * メタデータをJSON形式で取得
     * @returns {object} JSON形式のメタデータ
     */
    toJSON() {
        return {
            width: this.width,
            height: this.height,
            format: this.format,
            fileSize: this.fileSize,
            colorDepth: this.colorDepth,
            hasTransparency: this.hasTransparency,
            colorProfile: this.colorProfile,
            dpi: this.dpi,
            aspectRatio: this.aspectRatio,
            hasViewBox: this.hasViewBox,
            viewBox: this.viewBox,
            elementCount: this.elementCount,
            contentTypes: this.contentTypes,
            originalFormat: this.originalFormat,
            conversionTime: this.conversionTime,
            compressionRatio: this.compressionRatio
        };
    }
    
    /**
     * JSONからメタデータを復元
     * @param {object} json - JSON形式のメタデータ
     * @returns {ImageMetadata} 復元されたメタデータ
     */
    static fromJSON(json) {
        return new ImageMetadata(json);
    }
    
    /**
     * HTMLImageElementからメタデータを作成
     * @param {HTMLImageElement} img - 画像要素
     * @param {string} format - 画像形式
     * @param {number} fileSize - ファイルサイズ
     * @returns {ImageMetadata} メタデータ
     */
    static fromImageElement(img, format, fileSize = 0) {
        return new ImageMetadata({
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            format: format,
            fileSize: fileSize,
            hasTransparency: format.toLowerCase() === 'png' || format.toLowerCase() === 'gif'
        });
    }
    
    /**
     * SVGElementからメタデータを作成
     * @param {SVGSVGElement} svg - SVG要素
     * @param {number} fileSize - ファイルサイズ
     * @param {object} svgInfo - SVG固有の情報
     * @returns {ImageMetadata} メタデータ
     */
    static fromSVGElement(svg, fileSize = 0, svgInfo = {}) {
        const viewBox = svg.viewBox.baseVal;
        let width, height;
        
        if (viewBox.width && viewBox.height) {
            width = viewBox.width;
            height = viewBox.height;
        } else {
            width = parseFloat(svg.getAttribute('width')) || 100;
            height = parseFloat(svg.getAttribute('height')) || 100;
        }
        
        const metadata = new ImageMetadata({
            width: width,
            height: height,
            format: 'svg',
            fileSize: fileSize,
            hasTransparency: true,
            colorDepth: 32
        });
        
        metadata.setSVGInfo(svgInfo);
        return metadata;
    }
}