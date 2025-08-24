// バッチ処理機能の実装
import { SUPPORTED_FORMATS, ERROR_TYPES } from './constants.js';
import { LocalZipGenerator } from './utils/LocalZipGenerator.js';

/**
 * バッチ処理クラス - 複数ファイルの一括変換を管理
 */
export class BatchProcessor {
    constructor(appState, imageConverter) {
        this.appState = appState;
        this.imageConverter = imageConverter;
        this.files = [];
        this.isProcessing = false;
        this.currentJobIndex = 0;
        this.completedJobs = [];
        this.failedJobs = [];
        this.cancelRequested = false;
        
        // DOM要素の参照
        this.elements = {
            batchModeToggle: document.getElementById('batchModeToggle'),
            batchModeSwitch: document.getElementById('batchModeSwitch'),
            batchFileList: document.getElementById('batchFileList'),
            fileList: document.getElementById('fileList'),
            batchFileCount: document.getElementById('batchFileCount'),
            totalFileCount: document.getElementById('totalFileCount'),
            totalFileSize: document.getElementById('totalFileSize'),
            clearAllFiles: document.getElementById('clearAllFiles'),
            addMoreFiles: document.getElementById('addMoreFiles'),
            batchControls: document.getElementById('batchControls'),
            singleFileControls: document.getElementById('singleFileControls'),
            batchConvertBtn: document.getElementById('batchConvertBtn'),
            batchCancelBtn: document.getElementById('batchCancelBtn'),
            batchDownloadBtn: document.getElementById('batchDownloadBtn'),
            batchProgress: document.getElementById('batchProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progressPercentage: document.getElementById('progressPercentage'),
            currentFileName: document.getElementById('currentFileName'),
            fileInput: document.getElementById('fileInput')
        };
        
        this.setupEventListeners();
        this.initializeConverter();
    }
    
    /**
     * ImageConverterの初期化
     */
    async initializeConverter() {
        try {
            if (this.imageConverter && typeof this.imageConverter.initialize === 'function') {
                await this.imageConverter.initialize();
                console.log('BatchProcessor: ImageConverter initialized');
            }
        } catch (error) {
            console.error('BatchProcessor: ImageConverter initialization failed:', error);
        }
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // バッチモード切り替え
        this.elements.batchModeSwitch.addEventListener('change', (event) => {
            this.toggleBatchMode(event.target.checked);
        });
        
        // ファイル管理ボタン
        this.elements.clearAllFiles.addEventListener('click', () => {
            this.clearAllFiles();
        });
        
        this.elements.addMoreFiles.addEventListener('click', () => {
            this.elements.fileInput.click();
        });
        
        // バッチ変換ボタン
        this.elements.batchConvertBtn.addEventListener('click', () => {
            this.startBatchConversion();
        });
        
        // バッチキャンセルボタン
        this.elements.batchCancelBtn.addEventListener('click', () => {
            this.cancelBatchConversion();
        });
        
        // ZIP一括ダウンロードボタン
        this.elements.batchDownloadBtn.addEventListener('click', () => {
            this.downloadBatchResults();
        });
        
        // ファイル入力の変更（複数ファイル対応）
        this.elements.fileInput.addEventListener('change', (event) => {
            if (this.appState.get('batchMode')) {
                this.handleMultipleFileSelection(event.target.files);
            }
        });
    }
    
    /**
     * バッチモードの切り替え
     * @param {boolean} enabled - バッチモードを有効にするか
     */
    toggleBatchMode(enabled) {
        this.appState.setBatchMode(enabled);
        
        if (enabled) {
            // バッチモードUI表示
            this.elements.batchFileList.style.display = 'block';
            this.elements.batchControls.style.display = 'flex';
            this.elements.singleFileControls.style.display = 'none';
            
            // 現在のファイルがある場合はバッチリストに追加
            const currentFile = this.appState.get('currentFile');
            if (currentFile) {
                this.addFiles([currentFile]);
            }
        } else {
            // 単一ファイルモードUI表示
            this.elements.batchFileList.style.display = 'none';
            this.elements.batchControls.style.display = 'none';
            this.elements.singleFileControls.style.display = 'flex';
            this.elements.batchProgress.style.display = 'none';
            
            // バッチファイルをクリア
            this.clearAllFiles();
        }
        
        this.updateUI();
    }
    
    /**
     * 複数ファイル選択の処理
     * @param {FileList} fileList - 選択されたファイルリスト
     */
    async handleMultipleFileSelection(fileList) {
        try {
            const files = Array.from(fileList);
            await this.addFiles(files);
        } catch (error) {
            console.error('複数ファイル選択エラー:', error);
            this.showError('ファイルの追加中にエラーが発生しました: ' + error.message);
        }
    }
    
    /**
     * ファイルをバッチリストに追加
     * @param {Array} files - 追加するファイルリスト
     */
    async addFiles(files) {
        const validFiles = [];
        const errors = [];
        
        for (const file of files) {
            try {
                // ファイル形式チェック
                const format = this.detectFileFormat(file);
                if (!format) {
                    errors.push(`${file.name}: サポートされていない形式です`);
                    continue;
                }
                
                // 重複チェック
                const isDuplicate = this.files.some(existingFile => 
                    existingFile.name === file.name && existingFile.size === file.size
                );
                
                if (isDuplicate) {
                    errors.push(`${file.name}: 既に追加されています`);
                    continue;
                }
                
                // ファイルサイズチェック
                if (file.size > 10 * 1024 * 1024) { // 10MB制限
                    errors.push(`${file.name}: ファイルサイズが大きすぎます (${this.formatFileSize(file.size)})`);
                    continue;
                }
                
                validFiles.push({
                    file,
                    format,
                    id: this.generateFileId(),
                    status: 'pending'
                });
                
            } catch (error) {
                errors.push(`${file.name}: ${error.message}`);
            }
        }
        
        // 有効なファイルを追加
        this.files.push(...validFiles);
        this.appState.addBatchFiles(validFiles.map(item => item.file));
        
        // UIを更新
        this.updateFileList();
        this.updateSummary();
        this.updateButtonStates();
        
        // エラーがある場合は表示
        if (errors.length > 0) {
            this.showWarning('一部のファイルを追加できませんでした:\n' + errors.join('\n'));
        }
        
        // 成功メッセージ
        if (validFiles.length > 0) {
            this.showSuccess(`${validFiles.length}個のファイルを追加しました`);
        }
    }
    
    /**
     * ファイル形式を検出
     * @param {File} file - ファイル
     * @returns {string|null} 検出された形式
     */
    detectFileFormat(file) {
        const extension = file.name.toLowerCase().split('.').pop();
        const formatMap = {
            'svg': SUPPORTED_FORMATS.SVG,
            'png': SUPPORTED_FORMATS.PNG,
            'jpg': SUPPORTED_FORMATS.JPG,
            'jpeg': SUPPORTED_FORMATS.JPG,
            'webp': SUPPORTED_FORMATS.WEBP,
            'gif': SUPPORTED_FORMATS.GIF
        };
        
        return formatMap[extension] || null;
    }
    
    /**
     * ファイルリストUIの更新
     */
    updateFileList() {
        const fileListElement = this.elements.fileList;
        
        if (this.files.length === 0) {
            fileListElement.innerHTML = `
                <div class="file-list-empty">
                    <div class="file-list-empty-icon">📁</div>
                    <div class="file-list-empty-text">ファイルが選択されていません</div>
                    <div class="file-list-empty-hint">ファイルをドラッグ&ドロップするか、「ファイル追加」ボタンをクリックしてください</div>
                </div>
            `;
            return;
        }
        
        fileListElement.innerHTML = this.files.map((item, index) => {
            const { file, format, status } = item;
            const statusIcon = this.getStatusIcon(status);
            const formatIcon = this.getFormatIcon(format);
            
            return `
                <div class="file-item" data-index="${index}">
                    <div class="file-icon ${format}">${formatIcon}</div>
                    <div class="file-details">
                        <div class="file-name" title="${file.name}">${file.name}</div>
                        <div class="file-meta">
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                            <span class="file-format">${format.toUpperCase()}</span>
                            <span class="file-status">${statusIcon} ${this.getStatusText(status)}</span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button type="button" class="file-action-btn move-up" title="上に移動" ${index === 0 ? 'disabled' : ''}>
                            ↑
                        </button>
                        <button type="button" class="file-action-btn move-down" title="下に移動" ${index === this.files.length - 1 ? 'disabled' : ''}>
                            ↓
                        </button>
                        <button type="button" class="file-action-btn delete" title="削除">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // ファイルアクションのイベントリスナーを設定
        this.setupFileActionListeners();
    }
    
    /**
     * ファイルアクションのイベントリスナー設定
     */
    setupFileActionListeners() {
        const fileItems = this.elements.fileList.querySelectorAll('.file-item');
        
        fileItems.forEach((item, index) => {
            const moveUpBtn = item.querySelector('.move-up');
            const moveDownBtn = item.querySelector('.move-down');
            const deleteBtn = item.querySelector('.delete');
            
            if (moveUpBtn && !moveUpBtn.disabled) {
                moveUpBtn.addEventListener('click', () => this.moveFile(index, -1));
            }
            
            if (moveDownBtn && !moveDownBtn.disabled) {
                moveDownBtn.addEventListener('click', () => this.moveFile(index, 1));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.removeFile(index));
            }
        });
    }
    
    /**
     * ファイルの移動
     * @param {number} index - ファイルのインデックス
     * @param {number} direction - 移動方向 (-1: 上, 1: 下)
     */
    moveFile(index, direction) {
        const newIndex = index + direction;
        
        if (newIndex < 0 || newIndex >= this.files.length) {
            return;
        }
        
        // ファイルを入れ替え
        [this.files[index], this.files[newIndex]] = [this.files[newIndex], this.files[index]];
        
        // UIを更新
        this.updateFileList();
    }
    
    /**
     * ファイルの削除
     * @param {number} index - 削除するファイルのインデックス
     */
    removeFile(index) {
        if (index < 0 || index >= this.files.length) {
            return;
        }
        
        const removedFile = this.files[index];
        this.files.splice(index, 1);
        
        // AppStateからも削除
        this.appState.removeBatchFile(index);
        
        // UIを更新
        this.updateFileList();
        this.updateSummary();
        this.updateButtonStates();
        
        this.showSuccess(`${removedFile.file.name} を削除しました`);
    }
    
    /**
     * 全ファイルをクリア
     */
    clearAllFiles() {
        this.files = [];
        this.completedJobs = [];
        this.failedJobs = [];
        this.appState.updateState({ batchFiles: [] });
        
        this.updateFileList();
        this.updateSummary();
        this.updateButtonStates();
        
        // 進行状況を非表示
        this.elements.batchProgress.style.display = 'none';
    }
    
    /**
     * サマリー情報の更新
     */
    updateSummary() {
        const totalSize = this.files.reduce((sum, item) => sum + item.file.size, 0);
        
        this.elements.batchFileCount.textContent = this.files.length;
        this.elements.totalFileCount.textContent = this.files.length;
        this.elements.totalFileSize.textContent = this.formatFileSize(totalSize);
    }
    
    /**
     * ボタン状態の更新
     */
    updateButtonStates() {
        const hasFiles = this.files.length > 0;
        const isProcessing = this.isProcessing;
        const hasCompletedJobs = this.completedJobs.length > 0;
        
        this.elements.batchConvertBtn.disabled = !hasFiles || isProcessing;
        this.elements.batchCancelBtn.disabled = !isProcessing;
        this.elements.batchDownloadBtn.disabled = !hasCompletedJobs || isProcessing;
        
        // キャンセルボタンの表示/非表示
        this.elements.batchCancelBtn.style.display = isProcessing ? 'inline-flex' : 'none';
    }
    
    /**
     * バッチ変換の開始
     */
    async startBatchConversion() {
        if (this.files.length === 0 || this.isProcessing) {
            return;
        }
        
        try {
            this.isProcessing = true;
            this.cancelRequested = false;
            this.currentJobIndex = 0;
            this.completedJobs = [];
            this.failedJobs = [];
            this.batchStartTime = Date.now();
            
            // 進行状況UIを表示
            this.elements.batchProgress.style.display = 'block';
            this.updateProgress(0, 0, this.files.length);
            this.updateButtonStates();
            
            // 変換開始メッセージ
            this.showInfo(`${this.files.length}個のファイルの一括変換を開始します...`);
            
            // 各ファイルを順次変換
            for (let i = 0; i < this.files.length; i++) {
                if (this.cancelRequested) {
                    this.showWarning('変換がキャンセルされました');
                    break;
                }
                
                this.currentJobIndex = i;
                const fileItem = this.files[i];
                
                try {
                    // 現在のファイル情報を更新
                    this.elements.currentFileName.textContent = fileItem.file.name;
                    fileItem.status = 'processing';
                    this.updateFileList();
                    
                    // 変換前の検証
                    await this.validateFileForConversion(fileItem);
                    
                    // ファイルを変換
                    const result = await this.convertFileWithTimeout(fileItem, 30000); // 30秒タイムアウト
                    
                    // 成功
                    fileItem.status = 'completed';
                    fileItem.result = result;
                    this.completedJobs.push(fileItem);
                    
                    console.log(`変換完了: ${fileItem.file.name} (${i + 1}/${this.files.length})`);
                    
                } catch (error) {
                    // 失敗
                    console.error(`ファイル変換エラー (${fileItem.file.name}):`, error);
                    fileItem.status = 'failed';
                    fileItem.error = error;
                    this.failedJobs.push(fileItem);
                }
                
                // 進行状況を更新
                this.updateProgress(i + 1, this.completedJobs.length, this.files.length);
                this.updateFileList();
                
                // 少し待機（UIの更新とメモリ解放のため）
                await this.sleep(100);
            }
            
            // 変換完了
            this.completeBatchConversion();
            
        } catch (error) {
            console.error('バッチ変換エラー:', error);
            this.showError('バッチ変換中にエラーが発生しました: ' + error.message);
        } finally {
            this.isProcessing = false;
            this.updateButtonStates();
        }
    }
    
    /**
     * ファイルの変換前検証
     * @param {object} fileItem - ファイルアイテム
     */
    async validateFileForConversion(fileItem) {
        const { file, format } = fileItem;
        const targetFormat = this.appState.get('targetFormat');
        
        // 同じ形式への変換チェック
        if (format === targetFormat) {
            throw new Error('変換元と変換先の形式が同じです');
        }
        
        // ファイルサイズチェック
        if (file.size > 50 * 1024 * 1024) { // 50MB制限
            throw new Error('ファイルサイズが大きすぎます');
        }
        
        // ImageConverterの初期化チェック
        if (!this.imageConverter) {
            throw new Error('変換エンジンが初期化されていません');
        }
    }
    
    /**
     * タイムアウト付きファイル変換
     * @param {object} fileItem - ファイルアイテム
     * @param {number} timeout - タイムアウト時間（ミリ秒）
     * @returns {Promise<object>} 変換結果
     */
    async convertFileWithTimeout(fileItem, timeout = 30000) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('変換がタイムアウトしました'));
            }, timeout);
            
            try {
                const result = await this.convertFile(fileItem);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    
    /**
     * 待機関数
     * @param {number} ms - 待機時間（ミリ秒）
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 単一ファイルの変換
     * @param {object} fileItem - ファイルアイテム
     * @returns {Promise<object>} 変換結果
     */
    async convertFile(fileItem) {
        const { file, format } = fileItem;
        const targetFormat = this.appState.get('targetFormat');
        const conversionOptions = this.appState.get('conversionOptions');
        
        // 同じ形式への変換はスキップ
        if (format === targetFormat) {
            throw new Error('変換元と変換先の形式が同じです');
        }
        
        // ファイルを読み込んでデータを取得
        let inputData;
        if (format === SUPPORTED_FORMATS.SVG) {
            // SVGファイルはテキストとして読み込み
            inputData = await this.readFileAsText(file);
        } else {
            // ラスター画像はImageElementとして読み込み
            inputData = await this.readFileAsImage(file);
        }
        
        // ImageConverterを使用して変換
        const result = await this.imageConverter.convertImage(
            inputData,
            format,
            targetFormat,
            conversionOptions.toJSON()
        );
        
        return result;
    }
    
    /**
     * ファイルをテキストとして読み込み
     * @param {File} file - ファイル
     * @returns {Promise<string>} ファイル内容
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    /**
     * ファイルを画像として読み込み
     * @param {File} file - ファイル
     * @returns {Promise<HTMLImageElement>} 画像要素
     */
    readFileAsImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('画像の読み込みに失敗しました'));
            };
            
            img.src = url;
        });
    }
    
    /**
     * バッチ変換のキャンセル
     */
    cancelBatchConversion() {
        if (!this.isProcessing) {
            return;
        }
        
        this.cancelRequested = true;
        this.showWarning('変換をキャンセルしています...');
        
        // キャンセルボタンを無効化
        this.elements.batchCancelBtn.disabled = true;
        this.elements.batchCancelBtn.textContent = 'キャンセル中...';
        
        // 現在処理中のファイルがある場合は状態を更新
        if (this.currentJobIndex < this.files.length) {
            const currentFile = this.files[this.currentJobIndex];
            if (currentFile.status === 'processing') {
                currentFile.status = 'cancelled';
            }
        }
        
        // 残りの待機中ファイルをキャンセル状態に
        for (let i = this.currentJobIndex + 1; i < this.files.length; i++) {
            if (this.files[i].status === 'pending') {
                this.files[i].status = 'cancelled';
            }
        }
        
        this.updateFileList();
    }
    
    /**
     * バッチ変換の完了処理
     */
    completeBatchConversion() {
        const totalFiles = this.files.length;
        const completedCount = this.completedJobs.length;
        const failedCount = this.failedJobs.length;
        const cancelledCount = this.files.filter(f => f.status === 'cancelled').length;
        
        // 現在のファイル名をクリア
        this.elements.currentFileName.textContent = '-';
        
        // キャンセルボタンを元に戻す
        this.elements.batchCancelBtn.textContent = '変換中止';
        this.elements.batchCancelBtn.disabled = false;
        
        let message = '';
        let messageType = 'info';
        
        if (this.cancelRequested) {
            message = `バッチ変換がキャンセルされました。`;
            messageType = 'warning';
        } else {
            message = `バッチ変換が完了しました。`;
            messageType = completedCount > 0 ? 'success' : 'warning';
        }
        
        // 結果の詳細
        const results = [];
        if (completedCount > 0) results.push(`成功: ${completedCount}件`);
        if (failedCount > 0) results.push(`失敗: ${failedCount}件`);
        if (cancelledCount > 0) results.push(`キャンセル: ${cancelledCount}件`);
        
        if (results.length > 0) {
            message += `\n${results.join('、')}`;
        }
        
        // ダウンロード案内
        if (completedCount > 0) {
            message += `\n「ZIP一括ダウンロード」ボタンから変換済みファイルをダウンロードできます。`;
        }
        
        // メッセージ表示
        switch (messageType) {
            case 'success':
                this.showSuccess(message);
                break;
            case 'warning':
                this.showWarning(message);
                break;
            default:
                this.showInfo(message);
        }
        
        // 失敗したファイルの詳細を表示
        if (failedCount > 0) {
            const failedDetails = this.failedJobs.map(job => 
                `${job.file.name}: ${job.error?.message || '不明なエラー'}`
            ).join('\n');
            
            setTimeout(() => {
                this.showError(`変換に失敗したファイルの詳細:\n${failedDetails}`);
            }, 2000);
        }
        
        // 統計情報をログ出力
        console.log('バッチ変換完了統計:', {
            total: totalFiles,
            completed: completedCount,
            failed: failedCount,
            cancelled: cancelledCount,
            duration: Date.now() - this.batchStartTime
        });
    }
    
    /**
     * 進行状況の更新
     * @param {number} processed - 処理済みファイル数
     * @param {number} completed - 完了ファイル数
     * @param {number} total - 総ファイル数
     */
    updateProgress(processed, completed, total) {
        const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
        
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${completed} / ${total} 完了`;
        this.elements.progressPercentage.textContent = `${percentage}%`;
    }
    
    /**
     * ZIP一括ダウンロード
     */
    async downloadBatchResults() {
        if (this.completedJobs.length === 0) {
            this.showWarning('ダウンロード可能なファイルがありません');
            return;
        }
        
        try {
            // ダウンロードボタンを無効化
            this.elements.batchDownloadBtn.disabled = true;
            this.elements.batchDownloadBtn.innerHTML = '<span class="btn-icon">⏳</span>ZIP生成中...';
            
            // ローカルZIP生成器を使用（外部依存関係なし）
            const zip = new LocalZipGenerator();
            const targetFormat = this.appState.get('targetFormat');
            const existingNames = new Set(); // ファイル名の重複管理
            
            this.showInfo('ZIPファイルを準備中...');
            
            // 完了したファイルをZIPに追加
            for (let i = 0; i < this.completedJobs.length; i++) {
                const job = this.completedJobs[i];
                
                try {
                    // 安全なファイル名を生成
                    const safeFileName = this.generateSafeFileName(job.file.name, targetFormat);
                    
                    // 重複を解決
                    const uniqueFileName = this.resolveFileNameConflict(safeFileName, existingNames);
                    
                    // ZIPにファイルを追加
                    if (job.result && job.result.data) {
                        if (job.result.data instanceof Blob) {
                            await zip.addFileAsync(uniqueFileName, job.result.data);
                        } else {
                            zip.addFile(uniqueFileName, job.result.data);
                        }
                        console.log(`ZIP追加: ${uniqueFileName} (元: ${job.file.name})`);
                    } else {
                        console.warn(`変換結果が無効です: ${job.file.name}`);
                    }
                    
                } catch (error) {
                    console.error(`ZIPファイル追加エラー (${job.file.name}):`, error);
                }
            }
            
            // ZIPファイルを生成
            this.showInfo('ZIPファイルを生成中...');
            this.elements.batchDownloadBtn.innerHTML = `<span class="btn-icon">📦</span>ZIP生成中...`;
            
            const zipBlob = await zip.generateZip();
            
            // ダウンロード実行
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const zipFileName = `converted_images_${timestamp}.zip`;
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = zipFileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // URLを解放（少し遅延させてダウンロードを確実にする）
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            // 成功メッセージ
            const zipSizeMB = (zipBlob.size / (1024 * 1024)).toFixed(2);
            this.showSuccess(
                `${this.completedJobs.length}個のファイルをZIPでダウンロードしました\n` +
                `ファイル名: ${zipFileName}\n` +
                `サイズ: ${zipSizeMB} MB`
            );
            
            // 統計情報をログ出力
            console.log('ZIP一括ダウンロード完了:', {
                fileCount: this.completedJobs.length,
                zipSize: zipBlob.size,
                fileName: zipFileName
            });
            
        } catch (error) {
            console.error('ZIP一括ダウンロードエラー:', error);
            
            let errorMessage = 'ZIP一括ダウンロードに失敗しました';
            let suggestion = '個別ダウンロードを試してください';
            
            if (error.message.includes('quota')) {
                errorMessage = 'メモリ不足のためZIP生成に失敗しました';
                suggestion = 'ファイル数を減らすか、個別ダウンロードを使用してください';
            } else if (error.message.includes('network')) {
                errorMessage = 'ネットワークエラーによりダウンロードに失敗しました';
                suggestion = 'インターネット接続を確認して再試行してください';
            }
            
            this.showError(`${errorMessage}: ${error.message}\n${suggestion}`);
            
            // フォールバック: 個別ダウンロード
            setTimeout(() => {
                this.downloadIndividualFiles();
            }, 2000);
            
        } finally {
            // ダウンロードボタンを元に戻す
            this.elements.batchDownloadBtn.disabled = false;
            this.elements.batchDownloadBtn.innerHTML = '<span class="btn-icon">📦</span>ZIP一括ダウンロード';
        }
    }
    
    /**
     * 個別ファイルダウンロード（フォールバック）
     */
    async downloadIndividualFiles() {
        if (this.completedJobs.length === 0) {
            this.showWarning('ダウンロード可能なファイルがありません');
            return;
        }
        
        try {
            this.showInfo(`${this.completedJobs.length}個のファイルを個別にダウンロードします...`);
            
            const targetFormat = this.appState.get('targetFormat');
            const downloadPromises = [];
            
            // 各ファイルのダウンロードを準備
            this.completedJobs.forEach((job, index) => {
                const downloadPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        try {
                            const originalName = job.file.name;
                            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                            const fileName = `${baseName}.${targetFormat}`;
                            
                            if (job.result && job.result.data) {
                                const url = URL.createObjectURL(job.result.data);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = fileName;
                                a.style.display = 'none';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                
                                // URLを解放（少し遅延）
                                setTimeout(() => {
                                    URL.revokeObjectURL(url);
                                }, 1000);
                                
                                console.log(`個別ダウンロード完了: ${fileName}`);
                                resolve({ success: true, fileName });
                            } else {
                                console.error(`ダウンロードデータが無効: ${job.file.name}`);
                                resolve({ success: false, fileName: job.file.name, error: 'データが無効' });
                            }
                        } catch (error) {
                            console.error(`個別ダウンロードエラー (${job.file.name}):`, error);
                            resolve({ success: false, fileName: job.file.name, error: error.message });
                        }
                    }, index * 800); // 800ms間隔でダウンロード（ブラウザの制限を考慮）
                });
                
                downloadPromises.push(downloadPromise);
            });
            
            // 全てのダウンロードの完了を待機
            const results = await Promise.all(downloadPromises);
            
            // 結果の集計
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            if (successful.length > 0) {
                this.showSuccess(
                    `${successful.length}個のファイルを個別にダウンロードしました\n` +
                    `ダウンロードフォルダを確認してください`
                );
            }
            
            if (failed.length > 0) {
                const failedNames = failed.map(f => f.fileName).join(', ');
                this.showError(`ダウンロードに失敗したファイル: ${failedNames}`);
            }
            
            // 統計情報をログ出力
            console.log('個別ダウンロード完了:', {
                total: this.completedJobs.length,
                successful: successful.length,
                failed: failed.length
            });
            
        } catch (error) {
            console.error('個別ダウンロードエラー:', error);
            this.showError('個別ダウンロードに失敗しました: ' + error.message);
        }
    }
    
    /**
     * UIの更新
     */
    updateUI() {
        this.updateFileList();
        this.updateSummary();
        this.updateButtonStates();
    }
    
    /**
     * ユーティリティメソッド
     */
    
    generateFileId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 安全なファイル名を生成
     * @param {string} originalName - 元のファイル名
     * @param {string} newExtension - 新しい拡張子
     * @returns {string} 安全なファイル名
     */
    generateSafeFileName(originalName, newExtension) {
        // 拡張子を除いたベース名を取得
        const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        
        // 安全でない文字を置換
        const safeName = baseName
            .replace(/[<>:"/\\|?*]/g, '_') // Windows禁止文字
            .replace(/[\x00-\x1f\x80-\x9f]/g, '_') // 制御文字
            .replace(/^\.+/, '_') // 先頭のドット
            .replace(/\.+$/, '_') // 末尾のドット
            .replace(/\s+/g, '_') // 連続する空白
            .substring(0, 200); // 長さ制限
        
        return `${safeName}.${newExtension}`;
    }
    
    /**
     * ファイル名の重複を解決
     * @param {string} fileName - ファイル名
     * @param {Set} existingNames - 既存のファイル名セット
     * @returns {string} 重複のないファイル名
     */
    resolveFileNameConflict(fileName, existingNames) {
        if (!existingNames.has(fileName)) {
            existingNames.add(fileName);
            return fileName;
        }
        
        const lastDotIndex = fileName.lastIndexOf('.');
        const baseName = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
        
        let counter = 1;
        let newFileName;
        
        do {
            newFileName = `${baseName}_${counter}${extension}`;
            counter++;
        } while (existingNames.has(newFileName) && counter < 1000); // 無限ループ防止
        
        existingNames.add(newFileName);
        return newFileName;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getStatusIcon(status) {
        const icons = {
            pending: '⏳',
            processing: '🔄',
            completed: '✅',
            failed: '❌',
            cancelled: '⏹️'
        };
        return icons[status] || '❓';
    }
    
    getStatusText(status) {
        const texts = {
            pending: '待機中',
            processing: '変換中',
            completed: '完了',
            failed: '失敗',
            cancelled: 'キャンセル'
        };
        return texts[status] || '不明';
    }
    
    getFormatIcon(format) {
        const icons = {
            [SUPPORTED_FORMATS.SVG]: '🎨',
            [SUPPORTED_FORMATS.PNG]: '🖼️',
            [SUPPORTED_FORMATS.JPG]: '📷',
            [SUPPORTED_FORMATS.WEBP]: '🌐',
            [SUPPORTED_FORMATS.GIF]: '🎞️'
        };
        return icons[format] || '📄';
    }
    
    /**
     * メッセージ表示メソッド
     */
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showWarning(message) {
        this.showMessage(message, 'warning');
    }
    
    showInfo(message) {
        this.showMessage(message, 'info');
    }
    
    showMessage(message, type) {
        // UIControllerのメッセージ表示機能を使用
        if (this.appState.uiController) {
            switch (type) {
                case 'success':
                    this.appState.uiController.showSuccess(message);
                    break;
                case 'error':
                    this.appState.uiController.showError(message);
                    break;
                case 'warning':
                    this.appState.uiController.showWarning(message);
                    break;
                case 'info':
                    this.appState.uiController.showInfo(message);
                    break;
            }
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}