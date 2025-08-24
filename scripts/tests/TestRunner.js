// テストランナー - 単体テスト実行エンジン

import { SUPPORTED_FORMATS, ERROR_TYPES } from '../constants.js';

/**
 * 単体テストランナークラス
 * 各変換エンジンとファイル処理機能のテストを実行
 */
export class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            details: []
        };
        this.isRunning = false;
        this.currentSuite = null;
    }
    
    /**
     * テストスイートを追加
     * @param {string} suiteName - テストスイート名
     * @param {Function} suiteFunction - テスト関数
     */
    describe(suiteName, suiteFunction) {
        this.currentSuite = suiteName;
        console.log(`\n📋 テストスイート: ${suiteName}`);
        suiteFunction();
        this.currentSuite = null;
    }
    
    /**
     * 個別テストを追加
     * @param {string} testName - テスト名
     * @param {Function} testFunction - テスト関数
     */
    it(testName, testFunction) {
        this.tests.push({
            suite: this.currentSuite,
            name: testName,
            test: testFunction,
            timeout: 10000 // 10秒タイムアウト
        });
    }
    
    /**
     * 非同期テストを追加
     * @param {string} testName - テスト名
     * @param {Function} testFunction - 非同期テスト関数
     */
    itAsync(testName, testFunction) {
        this.tests.push({
            suite: this.currentSuite,
            name: testName,
            test: testFunction,
            isAsync: true,
            timeout: 30000 // 30秒タイムアウト
        });
    }
    
    /**
     * 全テストを実行
     * @returns {Promise<object>} テスト結果
     */
    async runAll() {
        if (this.isRunning) {
            throw new Error('テストは既に実行中です');
        }
        
        this.isRunning = true;
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: this.tests.length,
            details: [],
            startTime: Date.now(),
            endTime: null
        };
        
        console.log(`\n🚀 テスト実行開始 (${this.tests.length}件のテスト)`);
        console.log('=' .repeat(50));
        
        for (const testCase of this.tests) {
            await this.runSingleTest(testCase);
        }
        
        this.results.endTime = Date.now();
        this.isRunning = false;
        
        this.printSummary();
        return this.results;
    }
    
    /**
     * 単一テストを実行
     * @param {object} testCase - テストケース
     */
    async runSingleTest(testCase) {
        const startTime = Date.now();
        const testId = `${testCase.suite || 'Global'} > ${testCase.name}`;
        
        try {
            console.log(`\n🧪 ${testId}`);
            
            if (testCase.isAsync) {
                await this.runWithTimeout(testCase.test, testCase.timeout);
            } else {
                testCase.test();
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ PASS (${duration}ms)`);
            
            this.results.passed++;
            this.results.details.push({
                id: testId,
                status: 'PASS',
                duration,
                error: null
            });
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ FAIL (${duration}ms):`, error.message);
            
            this.results.failed++;
            this.results.details.push({
                id: testId,
                status: 'FAIL',
                duration,
                error: error.message,
                stack: error.stack
            });
        }
    }
    
    /**
     * タイムアウト付きでテストを実行
     * @param {Function} testFunction - テスト関数
     * @param {number} timeout - タイムアウト時間
     */
    async runWithTimeout(testFunction, timeout) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`テストがタイムアウトしました (${timeout}ms)`));
            }, timeout);
            
            try {
                await testFunction();
                clearTimeout(timeoutId);
                resolve();
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    
    /**
     * テスト結果のサマリーを表示
     */
    printSummary() {
        const duration = this.results.endTime - this.results.startTime;
        
        console.log('\n' + '=' .repeat(50));
        console.log('📊 テスト結果サマリー');
        console.log('=' .repeat(50));
        console.log(`総テスト数: ${this.results.total}`);
        console.log(`✅ 成功: ${this.results.passed}`);
        console.log(`❌ 失敗: ${this.results.failed}`);
        console.log(`⏭️ スキップ: ${this.results.skipped}`);
        console.log(`⏱️ 実行時間: ${duration}ms`);
        
        const successRate = Math.round((this.results.passed / this.results.total) * 100);
        console.log(`📈 成功率: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ 失敗したテスト:');
            this.results.details
                .filter(detail => detail.status === 'FAIL')
                .forEach(detail => {
                    console.log(`  - ${detail.id}: ${detail.error}`);
                });
        }
        
        console.log('\n' + (this.results.failed === 0 ? '🎉 全テスト成功!' : '⚠️ 一部テストが失敗しました'));
    }
    
    /**
     * アサーション: 等価性チェック
     * @param {*} actual - 実際の値
     * @param {*} expected - 期待値
     * @param {string} message - エラーメッセージ
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - 期待値: ${expected}, 実際の値: ${actual}`);
        }
    }
    
    /**
     * アサーション: 真偽値チェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message} - 期待値: true, 実際の値: ${value}`);
        }
    }
    
    /**
     * アサーション: 偽値チェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message} - 期待値: false, 実際の値: ${value}`);
        }
    }
    
    /**
     * アサーション: null/undefinedチェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertNotNull(value, message = '') {
        if (value == null) {
            throw new Error(`${message} - 値がnullまたはundefinedです`);
        }
    }
    
    /**
     * アサーション: 例外発生チェック
     * @param {Function} func - 実行する関数
     * @param {string} expectedError - 期待するエラータイプ
     * @param {string} message - エラーメッセージ
     */
    async assertThrows(func, expectedError = null, message = '') {
        try {
            if (typeof func === 'function') {
                const result = func();
                if (result instanceof Promise) {
                    await result;
                }
            } else {
                await func;
            }
            throw new Error(`${message} - 例外が発生しませんでした`);
        } catch (error) {
            if (expectedError && !error.message.includes(expectedError) && error.type !== expectedError) {
                throw new Error(`${message} - 期待するエラー: ${expectedError}, 実際のエラー: ${error.message}`);
            }
        }
    }
    
    /**
     * アサーション: 配列の長さチェック
     * @param {Array} array - チェックする配列
     * @param {number} expectedLength - 期待する長さ
     * @param {string} message - エラーメッセージ
     */
    assertArrayLength(array, expectedLength, message = '') {
        if (!Array.isArray(array)) {
            throw new Error(`${message} - 配列ではありません`);
        }
        if (array.length !== expectedLength) {
            throw new Error(`${message} - 期待する長さ: ${expectedLength}, 実際の長さ: ${array.length}`);
        }
    }
    
    /**
     * アサーション: オブジェクトのプロパティ存在チェック
     * @param {object} obj - チェックするオブジェクト
     * @param {string} property - プロパティ名
     * @param {string} message - エラーメッセージ
     */
    assertHasProperty(obj, property, message = '') {
        if (typeof obj !== 'object' || obj === null) {
            throw new Error(`${message} - オブジェクトではありません`);
        }
        if (!(property in obj)) {
            throw new Error(`${message} - プロパティ '${property}' が存在しません`);
        }
    }
    
    /**
     * アサーション: 型チェック
     * @param {*} value - チェックする値
     * @param {string} expectedType - 期待する型
     * @param {string} message - エラーメッセージ
     */
    assertType(value, expectedType, message = '') {
        const actualType = typeof value;
        if (actualType !== expectedType) {
            throw new Error(`${message} - 期待する型: ${expectedType}, 実際の型: ${actualType}`);
        }
    }
    
    /**
     * アサーション: インスタンスチェック
     * @param {*} value - チェックする値
     * @param {Function} expectedClass - 期待するクラス
     * @param {string} message - エラーメッセージ
     */
    assertInstanceOf(value, expectedClass, message = '') {
        if (!(value instanceof expectedClass)) {
            throw new Error(`${message} - 期待するクラス: ${expectedClass.name}, 実際の型: ${value.constructor.name}`);
        }
    }
    
    /**
     * テスト用のモックファイルを作成
     * @param {string} format - ファイル形式
     * @param {number} size - ファイルサイズ（バイト）
     * @returns {File} モックファイル
     */
    createMockFile(format, size = 1024) {
        const content = this.generateMockContent(format, size);
        const mimeType = this.getMimeTypeForFormat(format);
        const fileName = `test.${format}`;
        
        return new File([content], fileName, { type: mimeType });
    }
    
    /**
     * 形式に応じたモックコンテンツを生成
     * @param {string} format - ファイル形式
     * @param {number} size - ファイルサイズ
     * @returns {string|Uint8Array} モックコンテンツ
     */
    generateMockContent(format, size) {
        switch (format) {
            case SUPPORTED_FORMATS.SVG:
                return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                    <rect width="100" height="100" fill="red"/>
                </svg>`;
            
            case SUPPORTED_FORMATS.PNG:
                // 最小のPNGファイル（1x1ピクセル）
                return new Uint8Array([
                    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
                    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
                    0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
                    0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
                    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
                ]);
            
            default:
                // 他の形式は簡易的なバイナリデータ
                return new Uint8Array(Math.min(size, 1024)).fill(0x42);
        }
    }
    
    /**
     * 形式に対応するMIMEタイプを取得
     * @param {string} format - ファイル形式
     * @returns {string} MIMEタイプ
     */
    getMimeTypeForFormat(format) {
        const mimeMap = {
            [SUPPORTED_FORMATS.SVG]: 'image/svg+xml',
            [SUPPORTED_FORMATS.PNG]: 'image/png',
            [SUPPORTED_FORMATS.JPG]: 'image/jpeg',
            [SUPPORTED_FORMATS.JPEG]: 'image/jpeg',
            [SUPPORTED_FORMATS.WEBP]: 'image/webp',
            [SUPPORTED_FORMATS.GIF]: 'image/gif'
        };
        
        return mimeMap[format] || 'application/octet-stream';
    }
    
    /**
     * テスト用のCanvas要素を作成
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @returns {HTMLCanvasElement} Canvas要素
     */
    createTestCanvas(width = 100, height = 100) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, width, height);
        
        return canvas;
    }
    
    /**
     * テスト用のImage要素を作成
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @returns {Promise<HTMLImageElement>} Image要素
     */
    async createTestImage(width = 100, height = 100) {
        const canvas = this.createTestCanvas(width, height);
        
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Blob作成に失敗しました'));
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(img.src);
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(img.src);
                    reject(new Error('画像読み込みに失敗しました'));
                };
                img.src = URL.createObjectURL(blob);
            });
        });
    }
    
    /**
     * パフォーマンス測定
     * @param {Function} func - 測定する関数
     * @returns {Promise<object>} 実行時間とメモリ使用量
     */
    async measurePerformance(func) {
        const startTime = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        const result = await func();
        
        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        return {
            result,
            duration: endTime - startTime,
            memoryDelta: endMemory - startMemory
        };
    }
    
    /**
     * テスト結果をJSON形式で取得
     * @returns {string} JSON形式のテスト結果
     */
    getResultsAsJSON() {
        return JSON.stringify(this.results, null, 2);
    }
    
    /**
     * テスト結果をHTML形式で取得
     * @returns {string} HTML形式のテスト結果
     */
    getResultsAsHTML() {
        const successRate = Math.round((this.results.passed / this.results.total) * 100);
        const duration = this.results.endTime - this.results.startTime;
        
        let html = `
            <div class="test-results">
                <h2>テスト結果</h2>
                <div class="summary">
                    <div class="stat">総テスト数: ${this.results.total}</div>
                    <div class="stat success">成功: ${this.results.passed}</div>
                    <div class="stat failed">失敗: ${this.results.failed}</div>
                    <div class="stat">成功率: ${successRate}%</div>
                    <div class="stat">実行時間: ${duration}ms</div>
                </div>
                <div class="details">
        `;
        
        this.results.details.forEach(detail => {
            const statusClass = detail.status.toLowerCase();
            html += `
                <div class="test-detail ${statusClass}">
                    <div class="test-name">${detail.id}</div>
                    <div class="test-status">${detail.status} (${detail.duration}ms)</div>
                    ${detail.error ? `<div class="test-error">${detail.error}</div>` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
}