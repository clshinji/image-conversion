// 多形式画像変換アプリケーションの状態管理

import { ConversionOptions } from '../models/ConversionOptions.js';
import { ConversionJob } from '../models/ConversionJob.js';
import { SUPPORTED_FORMATS, DEFAULT_CONVERSION_OPTIONS } from '../constants.js';

/**
 * アプリケーション状態管理クラス（多形式対応版）
 */
export class AppState {
    constructor() {
        this.state = {
            // ファイル関連
            currentFile: null,
            currentFileContent: null,
            currentFileFormat: null,
            
            // 変換関連
            targetFormat: SUPPORTED_FORMATS.PNG,
            conversionOptions: new ConversionOptions(DEFAULT_CONVERSION_OPTIONS),
            isConverting: false,
            conversionResult: null,
            
            // バッチ処理関連
            batchMode: false,
            batchFiles: [],
            batchJobs: [],
            batchProgress: 0,
            
            // UI状態
            isLoading: false,
            error: null,
            lastOperation: null,
            
            // 履歴
            conversionHistory: [],
            
            // プレビュー関連
            showPreview: true,
            previewSize: 'medium'
        };
        
        this.listeners = [];
        this.uiController = null;
    }
    
    /**
     * UIControllerの参照を設定
     * @param {UIController} uiController - UIコントローラー
     */
    setUIController(uiController) {
        this.uiController = uiController;
    }
    
    /**
     * 状態変更リスナーを追加
     * @param {Function} listener - リスナー関数
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * 状態変更リスナーを削除
     * @param {Function} listener - リスナー関数
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    /**
     * 状態変更を通知
     * @param {object} changedProperties - 変更されたプロパティ
     */
    notifyListeners(changedProperties) {
        this.listeners.forEach(listener => {
            try {
                listener(this.state, changedProperties);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }
    
    /**
     * 状態を更新
     * @param {object} updates - 更新内容
     */
    updateState(updates) {
        const changedProperties = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (this.state[key] !== value) {
                changedProperties[key] = {
                    oldValue: this.state[key],
                    newValue: value
                };
                this.state[key] = value;
            }
        }
        
        // 変更があった場合のみ通知
        if (Object.keys(changedProperties).length > 0) {
            this.notifyListeners(changedProperties);
            this.updateUI(changedProperties);
        }
    }
    
    /**
     * 状態変更時のUI更新ロジック
     * @param {object} changedProperties - 変更されたプロパティ
     */
    updateUI(changedProperties) {
        if (!this.uiController) return;
        
        // ファイル読み込み状態の変更
        if ('currentFile' in changedProperties) {
            const file = changedProperties.currentFile.newValue;
            if (file) {
                console.log(`新しいファイルが読み込まれました: ${file.name}`);
            } else {
                console.log('ファイルがクリアされました');
            }
        }
        
        // 変換状態の変更
        if ('isConverting' in changedProperties) {
            const isConverting = changedProperties.isConverting.newValue;
            this.uiController.updateButtonStates({
                convertEnabled: !isConverting && this.isValidForConversion(),
                downloadEnabled: !isConverting && this.isValidForDownload()
            });
        }
        
        // ローディング状態の変更
        if ('isLoading' in changedProperties) {
            const isLoading = changedProperties.isLoading.newValue;
            if (isLoading && this.state.lastOperation) {
                this.uiController.showLoadingState(this.state.lastOperation);
            } else {
                this.uiController.hideLoadingState();
            }
        }
        
        // エラー状態の変更
        if ('error' in changedProperties) {
            const error = changedProperties.error.newValue;
            if (error) {
                this.uiController.showError(error);
            }
        }
        
        // 変換結果の変更
        if ('conversionResult' in changedProperties) {
            const result = changedProperties.conversionResult.newValue;
            this.uiController.updateButtonStates({
                downloadEnabled: result !== null && !this.state.isConverting
            });
        }
        
        // バッチモードの変更
        if ('batchMode' in changedProperties) {
            const batchMode = changedProperties.batchMode.newValue;
            this.uiController.updateBatchModeUI(batchMode);
        }
    }
    
    /**
     * 新しいファイル読み込み時の状態リセット
     */
    resetForNewFile() {
        // 変換履歴に現在の状態を保存（必要に応じて）
        if (this.state.currentFile && this.state.conversionResult) {
            this.addToHistory({
                fileName: this.state.currentFile.name,
                fromFormat: this.state.currentFileFormat,
                toFormat: this.state.targetFormat,
                timestamp: new Date(),
                success: true
            });
        }
        
        // 状態をリセット
        this.updateState({
            currentFile: null,
            currentFileContent: null,
            currentFileFormat: null,
            conversionResult: null,
            isConverting: false,
            isLoading: false,
            error: null,
            lastOperation: null
        });
        
        // UIをリセット
        if (this.uiController) {
            this.uiController.resetUIForNewFile();
        }
    }
    
    /**
     * ファイル選択時の状態更新
     * @param {File} file - ファイル
     * @param {string} content - ファイル内容
     * @param {string} format - ファイル形式
     */
    setFile(file, content, format) {
        this.updateState({
            currentFile: file,
            currentFileContent: content,
            currentFileFormat: format,
            conversionResult: null,
            error: null,
            lastOperation: null
        });
    }
    
    /**
     * 変換先形式を設定
     * @param {string} format - 変換先形式
     */
    setTargetFormat(format) {
        if (Object.values(SUPPORTED_FORMATS).includes(format)) {
            this.updateState({ targetFormat: format });
        }
    }
    
    /**
     * 変換オプションを更新
     * @param {object} options - 更新するオプション
     */
    updateConversionOptions(options) {
        const currentOptions = this.state.conversionOptions;
        const newOptions = new ConversionOptions({
            ...currentOptions.toJSON(),
            ...options
        });
        
        this.updateState({ conversionOptions: newOptions });
    }
    
    /**
     * 変換開始時の状態更新
     */
    startConversion() {
        this.updateState({
            isConverting: true,
            isLoading: true,
            error: null,
            lastOperation: `${this.state.currentFileFormat.toUpperCase()}を${this.state.targetFormat.toUpperCase()}に変換中...`
        });
    }
    
    /**
     * 変換完了時の状態更新
     * @param {object} result - 変換結果
     */
    completeConversion(result) {
        this.updateState({
            conversionResult: result,
            isConverting: false,
            isLoading: false,
            error: null,
            lastOperation: null
        });
        
        // 変換履歴に追加
        if (this.state.currentFile) {
            this.addToHistory({
                fileName: this.state.currentFile.name,
                fromFormat: this.state.currentFileFormat,
                toFormat: this.state.targetFormat,
                timestamp: new Date(),
                success: true,
                fileSize: result.data ? result.data.size : null
            });
        }
    }
    
    /**
     * 変換エラー時の状態更新
     * @param {Error} error - エラー情報
     */
    failConversion(error) {
        this.updateState({
            isConverting: false,
            isLoading: false,
            error: error,
            lastOperation: null
        });
        
        // エラー履歴に追加
        if (this.state.currentFile) {
            this.addToHistory({
                fileName: this.state.currentFile.name,
                fromFormat: this.state.currentFileFormat,
                toFormat: this.state.targetFormat,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * バッチモードの切り替え
     * @param {boolean} enabled - バッチモードを有効にするか
     */
    setBatchMode(enabled) {
        this.updateState({
            batchMode: enabled,
            batchFiles: enabled ? this.state.batchFiles : [],
            batchJobs: enabled ? this.state.batchJobs : []
        });
    }
    
    /**
     * バッチファイルを追加
     * @param {Array} files - ファイルリスト
     */
    addBatchFiles(files) {
        const currentFiles = [...this.state.batchFiles];
        const newFiles = Array.from(files).filter(file => 
            !currentFiles.some(existing => 
                existing.name === file.name && existing.size === file.size
            )
        );
        
        this.updateState({
            batchFiles: [...currentFiles, ...newFiles]
        });
    }
    
    /**
     * バッチファイルを削除
     * @param {number} index - 削除するファイルのインデックス
     */
    removeBatchFile(index) {
        const files = [...this.state.batchFiles];
        files.splice(index, 1);
        this.updateState({ batchFiles: files });
    }
    
    /**
     * バッチ変換を開始
     */
    startBatchConversion() {
        const jobs = this.state.batchFiles.map((file, index) => {
            const format = this.detectFileFormat(file);
            return new ConversionJob(file, format, this.state.targetFormat, this.state.conversionOptions.toJSON());
        });
        
        this.updateState({
            batchJobs: jobs,
            isConverting: true,
            batchProgress: 0
        });
    }
    
    /**
     * バッチ変換の進行状況を更新
     * @param {number} progress - 進行状況（0-100）
     */
    updateBatchProgress(progress) {
        this.updateState({ batchProgress: progress });
    }
    
    /**
     * バッチ変換を完了
     */
    completeBatchConversion() {
        this.updateState({
            isConverting: false,
            isLoading: false,
            batchProgress: 100
        });
    }
    
    /**
     * ファイル読み込み開始時の状態更新
     */
    startFileLoading() {
        this.updateState({
            isLoading: true,
            error: null,
            lastOperation: 'ファイルを読み込み中...'
        });
    }
    
    /**
     * ファイル読み込み完了時の状態更新
     */
    completeFileLoading() {
        this.updateState({
            isLoading: false,
            lastOperation: null
        });
    }
    
    /**
     * ファイル読み込みエラー時の状態更新
     * @param {Error} error - エラー情報
     */
    failFileLoading(error) {
        this.updateState({
            isLoading: false,
            error: error,
            lastOperation: null
        });
    }
    
    /**
     * 変換履歴に追加
     * @param {object} entry - 履歴エントリ
     */
    addToHistory(entry) {
        this.state.conversionHistory.unshift(entry);
        
        // 履歴の最大数を制限（最新20件まで）
        if (this.state.conversionHistory.length > 20) {
            this.state.conversionHistory = this.state.conversionHistory.slice(0, 20);
        }
    }
    
    /**
     * 変換履歴をクリア
     */
    clearHistory() {
        this.updateState({ conversionHistory: [] });
    }
    
    /**
     * ファイル形式を検出（簡易版）
     * @param {File} file - ファイル
     * @returns {string} 検出された形式
     */
    detectFileFormat(file) {
        const extension = file.name.toLowerCase().split('.').pop();
        switch (extension) {
            case 'svg': return SUPPORTED_FORMATS.SVG;
            case 'png': return SUPPORTED_FORMATS.PNG;
            case 'jpg':
            case 'jpeg': return SUPPORTED_FORMATS.JPG;
            case 'webp': return SUPPORTED_FORMATS.WEBP;
            case 'gif': return SUPPORTED_FORMATS.GIF;
            default: return SUPPORTED_FORMATS.PNG;
        }
    }
    
    /**
     * 現在の状態を取得
     * @returns {object} 現在の状態
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * 特定のプロパティの値を取得
     * @param {string} property - プロパティ名
     * @returns {*} プロパティの値
     */
    get(property) {
        return this.state[property];
    }
    
    /**
     * 変換可能な状態かチェック
     * @returns {boolean} 変換可能かどうか
     */
    isValidForConversion() {
        return this.state.currentFileContent !== null && 
               !this.state.isConverting && 
               !this.state.isLoading &&
               this.state.currentFileFormat !== this.state.targetFormat;
    }
    
    /**
     * ダウンロード可能な状態かチェック
     * @returns {boolean} ダウンロード可能かどうか
     */
    isValidForDownload() {
        return this.state.conversionResult !== null && 
               !this.state.isConverting && 
               !this.state.isLoading;
    }
    
    /**
     * バッチ変換可能な状態かチェック
     * @returns {boolean} バッチ変換可能かどうか
     */
    isValidForBatchConversion() {
        return this.state.batchMode &&
               this.state.batchFiles.length > 0 &&
               !this.state.isConverting &&
               !this.state.isLoading;
    }
    
    /**
     * デバッグ用：状態をログ出力
     */
    logState() {
        console.log('Current AppState:', {
            hasFile: !!this.state.currentFile,
            fileName: this.state.currentFile?.name,
            currentFormat: this.state.currentFileFormat,
            targetFormat: this.state.targetFormat,
            hasContent: !!this.state.currentFileContent,
            hasResult: !!this.state.conversionResult,
            isConverting: this.state.isConverting,
            isLoading: this.state.isLoading,
            batchMode: this.state.batchMode,
            batchFileCount: this.state.batchFiles.length,
            error: this.state.error,
            lastOperation: this.state.lastOperation,
            historyCount: this.state.conversionHistory.length
        });
    }
}