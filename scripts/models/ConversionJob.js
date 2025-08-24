// 変換ジョブのデータモデル

import { generateUniqueId } from '../utils/helpers.js';

/**
 * 変換ジョブクラス
 * 個別の変換処理を管理するためのデータモデル
 */
export class ConversionJob {
    constructor(file, fromFormat, toFormat, options = {}) {
        this.id = generateUniqueId();
        this.file = file;
        this.fromFormat = fromFormat;
        this.toFormat = toFormat;
        this.options = { ...options };
        this.status = 'pending'; // pending, processing, completed, failed
        this.result = null;
        this.error = null;
        this.progress = 0;
        this.createdAt = new Date();
        this.startedAt = null;
        this.completedAt = null;
        this.processingTime = null;
    }
    
    /**
     * ジョブを開始状態に設定
     */
    start() {
        this.status = 'processing';
        this.startedAt = new Date();
        this.progress = 0;
    }
    
    /**
     * ジョブの進行状況を更新
     * @param {number} progress - 進行状況（0-100）
     */
    updateProgress(progress) {
        this.progress = Math.max(0, Math.min(100, progress));
    }
    
    /**
     * ジョブを完了状態に設定
     * @param {object} result - 変換結果
     */
    complete(result) {
        this.status = 'completed';
        this.result = result;
        this.completedAt = new Date();
        this.progress = 100;
        
        if (this.startedAt) {
            this.processingTime = this.completedAt - this.startedAt;
        }
    }
    
    /**
     * ジョブを失敗状態に設定
     * @param {Error} error - エラー情報
     */
    fail(error) {
        this.status = 'failed';
        this.error = error;
        this.completedAt = new Date();
        
        if (this.startedAt) {
            this.processingTime = this.completedAt - this.startedAt;
        }
    }
    
    /**
     * ジョブの実行時間を取得（ミリ秒）
     * @returns {number|null} 実行時間
     */
    getProcessingTime() {
        return this.processingTime;
    }
    
    /**
     * ジョブの実行時間を人間が読みやすい形式で取得
     * @returns {string} フォーマットされた実行時間
     */
    getFormattedProcessingTime() {
        if (!this.processingTime) return '未計測';
        
        const seconds = Math.floor(this.processingTime / 1000);
        const milliseconds = this.processingTime % 1000;
        
        if (seconds > 0) {
            return `${seconds}.${Math.floor(milliseconds / 100)}秒`;
        } else {
            return `${milliseconds}ms`;
        }
    }
    
    /**
     * ジョブが完了しているかチェック
     * @returns {boolean} 完了しているかどうか
     */
    isCompleted() {
        return this.status === 'completed';
    }
    
    /**
     * ジョブが失敗しているかチェック
     * @returns {boolean} 失敗しているかどうか
     */
    isFailed() {
        return this.status === 'failed';
    }
    
    /**
     * ジョブが処理中かチェック
     * @returns {boolean} 処理中かどうか
     */
    isProcessing() {
        return this.status === 'processing';
    }
    
    /**
     * ジョブが待機中かチェック
     * @returns {boolean} 待機中かどうか
     */
    isPending() {
        return this.status === 'pending';
    }
    
    /**
     * ジョブの概要情報を取得
     * @returns {object} 概要情報
     */
    getSummary() {
        return {
            id: this.id,
            fileName: this.file.name,
            fileSize: this.file.size,
            fromFormat: this.fromFormat,
            toFormat: this.toFormat,
            status: this.status,
            progress: this.progress,
            processingTime: this.getFormattedProcessingTime(),
            hasError: !!this.error
        };
    }
    
    /**
     * ジョブをJSON形式でシリアライズ（ファイルオブジェクトは除く）
     * @returns {object} シリアライズされたデータ
     */
    toJSON() {
        return {
            id: this.id,
            fileName: this.file.name,
            fileSize: this.file.size,
            fileType: this.file.type,
            fromFormat: this.fromFormat,
            toFormat: this.toFormat,
            options: this.options,
            status: this.status,
            progress: this.progress,
            error: this.error ? {
                message: this.error.message,
                type: this.error.type,
                suggestion: this.error.suggestion
            } : null,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            processingTime: this.processingTime
        };
    }
}