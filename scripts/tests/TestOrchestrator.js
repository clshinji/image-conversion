// テストオーケストレーター - 全テストの統合実行

import { ConverterTests } from './ConverterTests.js';
import { FileHandlerTests } from './FileHandlerTests.js';
import { UITests } from './UITests.js';
import { IntegrationTests } from './IntegrationTests.js';
import { FinalIntegrationTest } from './FinalIntegrationTest.js';
import { PerformanceOptimizationTest } from './PerformanceOptimizationTest.js';

/**
 * テストオーケストレータークラス
 * 全てのテストスイートを統合して実行
 */
export class TestOrchestrator {
    constructor() {
        this.converterTests = new ConverterTests();
        this.fileHandlerTests = new FileHandlerTests();
        this.uiTests = new UITests();
        this.integrationTests = new IntegrationTests();
        this.finalIntegrationTest = new FinalIntegrationTest();
        this.performanceOptimizationTest = new PerformanceOptimizationTest();
        
        this.allResults = {
            converter: null,
            fileHandler: null,
            ui: null,
            integration: null,
            finalIntegration: null,
            performance: null,
            summary: null
        };
        
        this.isRunning = false;
        this.startTime = null;
        this.endTime = null;
    }
    
    /**
     * 全てのテストスイートを実行
     * @param {object} options - 実行オプション
     * @returns {Promise<object>} 統合テスト結果
     */
    async runAllTests(options = {}) {
        if (this.isRunning) {
            throw new Error('テストは既に実行中です');
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        console.log('🚀 全テストスイートの実行を開始します...');
        console.log('=' .repeat(60));
        
        try {
            // 各テストスイートを順次実行
            if (options.runConverter !== false) {
                console.log('\n📦 変換エンジンテストを実行中...');
                this.allResults.converter = await this.converterTests.runAllTests();
                this.displayIntermediateResults('変換エンジン', this.allResults.converter);
            }
            
            if (options.runFileHandler !== false) {
                console.log('\n📁 ファイルハンドラーテストを実行中...');
                this.allResults.fileHandler = await this.fileHandlerTests.runAllTests();
                this.displayIntermediateResults('ファイルハンドラー', this.allResults.fileHandler);
            }
            
            if (options.runUI !== false) {
                console.log('\n🖥️ UIテストを実行中...');
                this.allResults.ui = await this.uiTests.runAllTests();
                this.displayIntermediateResults('UI', this.allResults.ui);
            }
            
            if (options.runIntegration !== false) {
                console.log('\n🔗 統合テストを実行中...');
                this.allResults.integration = await this.integrationTests.runAllTests();
                this.displayIntermediateResults('統合', this.allResults.integration);
            }
            
            if (options.runFinalIntegration !== false) {
                console.log('\n🏁 最終統合テストを実行中...');
                this.allResults.finalIntegration = await this.finalIntegrationTest.runAllIntegrationTests();
                this.displayIntermediateResults('最終統合', this.allResults.finalIntegration);
            }
            
            if (options.runPerformance !== false) {
                console.log('\n⚡ パフォーマンス最適化テストを実行中...');
                this.allResults.performance = await this.performanceOptimizationTest.runPerformanceTests();
                this.displayIntermediateResults('パフォーマンス', this.allResults.performance);
            }
            
            // 統合結果を生成
            this.allResults.summary = this.generateSummary();
            
            this.endTime = Date.now();
            this.isRunning = false;
            
            // 最終結果を表示
            this.displayFinalResults();
            
            return this.allResults;
            
        } catch (error) {
            this.endTime = Date.now();
            this.isRunning = false;
            
            console.error('❌ テスト実行中にエラーが発生しました:', error);
            throw error;
        }
    }
    
    /**
     * 特定のテストスイートのみを実行
     * @param {string} suiteName - テストスイート名
     * @returns {Promise<object>} テスト結果
     */
    async runSpecificSuite(suiteName) {
        console.log(`🎯 ${suiteName}テストスイートを実行中...`);
        
        switch (suiteName.toLowerCase()) {
            case 'converter':
            case '変換エンジン':
                return await this.converterTests.runAllTests();
                
            case 'filehandler':
            case 'ファイルハンドラー':
                return await this.fileHandlerTests.runAllTests();
                
            case 'ui':
            case 'ユーザーインターフェース':
                return await this.uiTests.runAllTests();
                
            case 'integration':
            case '統合':
                return await this.integrationTests.runAllTests();
                
            default:
                throw new Error(`未知のテストスイート: ${suiteName}`);
        }
    }
    
    /**
     * 軽量テスト（重要なテストのみ）を実行
     * @returns {Promise<object>} テスト結果
     */
    async runLightweightTests() {
        console.log('⚡ 軽量テストを実行中...');
        
        const options = {
            runConverter: true,
            runFileHandler: true,
            runUI: false, // UI テストは重い場合があるのでスキップ
            runIntegration: false // 統合テストもスキップ
        };
        
        return await this.runAllTests(options);
    }
    
    /**
     * 煙テスト（基本機能のみ）を実行
     * @returns {Promise<object>} テスト結果
     */
    async runSmokeTests() {
        console.log('💨 煙テストを実行中...');
        
        // 基本的な初期化テストのみを実行
        const smokeTestResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: [],
            startTime: Date.now()
        };
        
        try {
            // 変換エンジンの基本初期化テスト
            console.log('🔧 変換エンジン初期化テスト...');
            const converterInitTest = await this.testConverterInitialization();
            smokeTestResults.total++;
            if (converterInitTest.success) {
                smokeTestResults.passed++;
            } else {
                smokeTestResults.failed++;
            }
            smokeTestResults.details.push(converterInitTest);
            
            // ファイルハンドラーの基本初期化テスト
            console.log('📁 ファイルハンドラー初期化テスト...');
            const fileHandlerInitTest = await this.testFileHandlerInitialization();
            smokeTestResults.total++;
            if (fileHandlerInitTest.success) {
                smokeTestResults.passed++;
            } else {
                smokeTestResults.failed++;
            }
            smokeTestResults.details.push(fileHandlerInitTest);
            
            // DOM要素の基本存在テスト
            console.log('🖥️ DOM要素存在テスト...');
            const domTest = this.testDOMElements();
            smokeTestResults.total++;
            if (domTest.success) {
                smokeTestResults.passed++;
            } else {
                smokeTestResults.failed++;
            }
            smokeTestResults.details.push(domTest);
            
            smokeTestResults.endTime = Date.now();
            smokeTestResults.duration = smokeTestResults.endTime - smokeTestResults.startTime;
            
            console.log(`💨 煙テスト完了: ${smokeTestResults.passed}/${smokeTestResults.total} 成功`);
            
            return smokeTestResults;
            
        } catch (error) {
            console.error('💨 煙テストエラー:', error);
            smokeTestResults.endTime = Date.now();
            smokeTestResults.duration = smokeTestResults.endTime - smokeTestResults.startTime;
            smokeTestResults.error = error.message;
            return smokeTestResults;
        }
    }
    
    /**
     * 変換エンジン初期化テスト
     * @returns {Promise<object>} テスト結果
     */
    async testConverterInitialization() {
        try {
            // ImageConverterの動的インポートを試行
            const { ImageConverter } = await import('../converters/ImageConverter.js');
            const imageConverter = new ImageConverter();
            
            return {
                name: '変換エンジン初期化',
                success: true,
                message: 'ImageConverterが正常に初期化されました',
                details: {
                    supportedFormats: imageConverter.supportedFormats?.length || 0
                }
            };
        } catch (error) {
            return {
                name: '変換エンジン初期化',
                success: false,
                message: `ImageConverter初期化エラー: ${error.message}`,
                error: error.message
            };
        }
    }
    
    /**
     * ファイルハンドラー初期化テスト
     * @returns {Promise<object>} テスト結果
     */
    async testFileHandlerInitialization() {
        try {
            // FileHandlerの動的インポートを試行
            const { FileHandler } = await import('../FileHandler.js');
            const fileHandler = new FileHandler();
            
            return {
                name: 'ファイルハンドラー初期化',
                success: true,
                message: 'FileHandlerが正常に初期化されました',
                details: {
                    maxFileSize: fileHandler.maxFileSize,
                    supportedFormats: fileHandler.supportedFormats?.length || 0
                }
            };
        } catch (error) {
            return {
                name: 'ファイルハンドラー初期化',
                success: false,
                message: `FileHandler初期化エラー: ${error.message}`,
                error: error.message
            };
        }
    }
    
    /**
     * DOM要素存在テスト
     * @returns {object} テスト結果
     */
    testDOMElements() {
        const requiredElements = [
            'uploadArea',
            'fileInput',
            'convertBtn',
            'targetFormat'
        ];
        
        const existingElements = [];
        const missingElements = [];
        
        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                existingElements.push(elementId);
            } else {
                missingElements.push(elementId);
            }
        });
        
        const success = existingElements.length >= requiredElements.length / 2; // 半分以上存在すれば成功
        
        return {
            name: 'DOM要素存在',
            success,
            message: success ? 
                `必要なDOM要素が存在します (${existingElements.length}/${requiredElements.length})` :
                `重要なDOM要素が不足しています: ${missingElements.join(', ')}`,
            details: {
                existing: existingElements,
                missing: missingElements,
                total: requiredElements.length
            }
        };
    }
    
    /**
     * 中間結果を表示
     * @param {string} suiteName - テストスイート名
     * @param {object} results - テスト結果
     */
    displayIntermediateResults(suiteName, results) {
        const successRate = Math.round((results.passed / results.total) * 100);
        const status = results.failed === 0 ? '✅' : '⚠️';
        
        console.log(`\n${status} ${suiteName}テスト完了:`);
        console.log(`   成功: ${results.passed}/${results.total} (${successRate}%)`);
        console.log(`   実行時間: ${results.endTime - results.startTime}ms`);
        
        if (results.failed > 0) {
            console.log(`   失敗: ${results.failed}件`);
        }
    }
    
    /**
     * 統合結果サマリーを生成
     * @returns {object} 統合サマリー
     */
    generateSummary() {
        const summary = {
            totalPassed: 0,
            totalFailed: 0,
            totalTests: 0,
            totalDuration: this.endTime - this.startTime,
            suiteResults: {},
            overallSuccessRate: 0,
            status: 'unknown'
        };
        
        // 各テストスイートの結果を集計
        Object.entries(this.allResults).forEach(([suiteName, results]) => {
            if (results && suiteName !== 'summary') {
                summary.totalPassed += results.passed || 0;
                summary.totalFailed += results.failed || 0;
                summary.totalTests += results.total || 0;
                
                summary.suiteResults[suiteName] = {
                    passed: results.passed || 0,
                    failed: results.failed || 0,
                    total: results.total || 0,
                    successRate: results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0,
                    duration: results.endTime && results.startTime ? results.endTime - results.startTime : 0
                };
            }
        });
        
        // 全体の成功率を計算
        summary.overallSuccessRate = summary.totalTests > 0 ? 
            Math.round((summary.totalPassed / summary.totalTests) * 100) : 0;
        
        // 全体のステータスを決定
        if (summary.totalFailed === 0) {
            summary.status = 'success';
        } else if (summary.overallSuccessRate >= 80) {
            summary.status = 'warning';
        } else {
            summary.status = 'failure';
        }
        
        return summary;
    }
    
    /**
     * 最終結果を表示
     */
    displayFinalResults() {
        const summary = this.allResults.summary;
        
        console.log('\n' + '=' .repeat(60));
        console.log('🏁 全テストスイート実行完了');
        console.log('=' .repeat(60));
        
        // 全体統計
        console.log(`📊 全体統計:`);
        console.log(`   総テスト数: ${summary.totalTests}`);
        console.log(`   ✅ 成功: ${summary.totalPassed}`);
        console.log(`   ❌ 失敗: ${summary.totalFailed}`);
        console.log(`   📈 成功率: ${summary.overallSuccessRate}%`);
        console.log(`   ⏱️ 総実行時間: ${summary.totalDuration}ms`);
        
        // スイート別結果
        console.log(`\n📋 スイート別結果:`);
        Object.entries(summary.suiteResults).forEach(([suiteName, results]) => {
            const status = results.failed === 0 ? '✅' : '⚠️';
            console.log(`   ${status} ${suiteName}: ${results.passed}/${results.total} (${results.successRate}%) - ${results.duration}ms`);
        });
        
        // 全体ステータス
        console.log(`\n🎯 全体ステータス: ${this.getStatusEmoji(summary.status)} ${summary.status.toUpperCase()}`);
        
        if (summary.totalFailed > 0) {
            console.log(`\n⚠️ ${summary.totalFailed}件のテストが失敗しました。詳細は各テストスイートの結果を確認してください。`);
        } else {
            console.log(`\n🎉 全てのテストが成功しました！`);
        }
        
        // 結果をHTMLで表示
        this.displayResultsHTML();
    }
    
    /**
     * ステータス絵文字を取得
     * @param {string} status - ステータス
     * @returns {string} 絵文字
     */
    getStatusEmoji(status) {
        switch (status) {
            case 'success': return '🎉';
            case 'warning': return '⚠️';
            case 'failure': return '❌';
            default: return '❓';
        }
    }
    
    /**
     * 結果をHTMLで表示
     */
    displayResultsHTML() {
        const summary = this.allResults.summary;
        
        const html = `
            <div class="test-orchestrator-results">
                <h2>🏁 テスト実行結果</h2>
                
                <div class="overall-summary">
                    <div class="summary-card ${summary.status}">
                        <h3>${this.getStatusEmoji(summary.status)} 全体結果</h3>
                        <div class="stats">
                            <div class="stat">
                                <span class="label">総テスト数:</span>
                                <span class="value">${summary.totalTests}</span>
                            </div>
                            <div class="stat success">
                                <span class="label">成功:</span>
                                <span class="value">${summary.totalPassed}</span>
                            </div>
                            <div class="stat failed">
                                <span class="label">失敗:</span>
                                <span class="value">${summary.totalFailed}</span>
                            </div>
                            <div class="stat">
                                <span class="label">成功率:</span>
                                <span class="value">${summary.overallSuccessRate}%</span>
                            </div>
                            <div class="stat">
                                <span class="label">実行時間:</span>
                                <span class="value">${summary.totalDuration}ms</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="suite-results">
                    <h3>📋 スイート別結果</h3>
                    <div class="suite-grid">
                        ${Object.entries(summary.suiteResults).map(([suiteName, results]) => `
                            <div class="suite-card ${results.failed === 0 ? 'success' : 'warning'}">
                                <h4>${results.failed === 0 ? '✅' : '⚠️'} ${this.getSuiteDisplayName(suiteName)}</h4>
                                <div class="suite-stats">
                                    <div>成功: ${results.passed}/${results.total}</div>
                                    <div>成功率: ${results.successRate}%</div>
                                    <div>実行時間: ${results.duration}ms</div>
                                </div>
                                <button onclick="window.testOrchestrator.showSuiteDetails('${suiteName}')" class="details-btn">
                                    詳細を表示
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="actions">
                    <button onclick="window.testOrchestrator.exportResults()" class="export-btn">
                        📊 結果をエクスポート
                    </button>
                    <button onclick="window.testOrchestrator.runSmokeTests().then(r => console.log('煙テスト完了:', r))" class="smoke-test-btn">
                        💨 煙テスト実行
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">
                        ❌ 閉じる
                    </button>
                </div>
            </div>
        `;
        
        // 結果表示用の要素を作成
        let resultContainer = document.getElementById('test-orchestrator-results');
        if (!resultContainer) {
            resultContainer = document.createElement('div');
            resultContainer.id = 'test-orchestrator-results';
            resultContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                background: white;
                border: 3px solid #333;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                z-index: 10002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(resultContainer);
        }
        
        resultContainer.innerHTML = html;
        
        // スタイルを追加
        this.addResultsStyles();
        
        // グローバルに公開
        window.testOrchestrator = this;
    }
    
    /**
     * 結果表示用のスタイルを追加
     */
    addResultsStyles() {
        if (document.getElementById('test-orchestrator-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'test-orchestrator-styles';
        style.textContent = `
            .test-orchestrator-results h2 { 
                margin-top: 0; 
                color: #333; 
                text-align: center;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            
            .overall-summary { margin-bottom: 24px; }
            
            .summary-card {
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
            }
            
            .summary-card.success { background: #e8f5e8; border-left: 4px solid #4caf50; }
            .summary-card.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
            .summary-card.failure { background: #f8d7da; border-left: 4px solid #dc3545; }
            
            .summary-card h3 { margin-top: 0; margin-bottom: 12px; }
            
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
            
            .stat { display: flex; justify-content: space-between; padding: 4px 0; }
            .stat.success .value { color: #4caf50; font-weight: bold; }
            .stat.failed .value { color: #dc3545; font-weight: bold; }
            
            .suite-results h3 { color: #666; margin-bottom: 16px; }
            
            .suite-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 16px; 
                margin-bottom: 24px;
            }
            
            .suite-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 16px;
                background: white;
            }
            
            .suite-card.success { border-left: 4px solid #4caf50; }
            .suite-card.warning { border-left: 4px solid #ffc107; }
            
            .suite-card h4 { margin-top: 0; margin-bottom: 12px; color: #333; }
            
            .suite-stats { margin-bottom: 12px; font-size: 14px; }
            .suite-stats div { margin-bottom: 4px; }
            
            .details-btn, .export-btn, .smoke-test-btn, .close-btn {
                padding: 6px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                margin-right: 8px;
            }
            
            .details-btn:hover, .export-btn:hover, .smoke-test-btn:hover { background: #f0f0f0; }
            .close-btn { background: #dc3545; color: white; border-color: #dc3545; }
            .close-btn:hover { background: #c82333; }
            
            .actions { 
                text-align: center; 
                padding-top: 16px; 
                border-top: 1px solid #eee; 
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * スイート表示名を取得
     * @param {string} suiteName - スイート名
     * @returns {string} 表示名
     */
    getSuiteDisplayName(suiteName) {
        const displayNames = {
            converter: '変換エンジン',
            fileHandler: 'ファイルハンドラー',
            ui: 'ユーザーインターフェース',
            integration: '統合テスト'
        };
        
        return displayNames[suiteName] || suiteName;
    }
    
    /**
     * スイート詳細を表示
     * @param {string} suiteName - スイート名
     */
    showSuiteDetails(suiteName) {
        const results = this.allResults[suiteName];
        if (!results) {
            alert(`${suiteName}の結果が見つかりません`);
            return;
        }
        
        // 対応するテストクラスの結果表示メソッドを呼び出し
        switch (suiteName) {
            case 'converter':
                this.converterTests.displayResults(results);
                break;
            case 'fileHandler':
                this.fileHandlerTests.displayResults(results);
                break;
            case 'ui':
                this.uiTests.displayResults(results);
                break;
            case 'integration':
                this.integrationTests.displayResults(results);
                break;
            default:
                alert(`${suiteName}の詳細表示は実装されていません`);
        }
    }
    
    /**
     * 結果をエクスポート
     */
    exportResults() {
        const exportData = {
            summary: this.allResults.summary,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            results: this.allResults
        };
        
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // クリップボードにコピー
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsonData).then(() => {
                alert('📊 テスト結果がクリップボードにコピーされました');
            }).catch(() => {
                this.downloadAsFile(jsonData);
            });
        } else {
            this.downloadAsFile(jsonData);
        }
    }
    
    /**
     * ファイルとしてダウンロード
     * @param {string} data - データ
     */
    downloadAsFile(data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('📊 テスト結果がファイルとしてダウンロードされました');
    }
    
    /**
     * テスト実行状況を取得
     * @returns {object} 実行状況
     */
    getExecutionStatus() {
        return {
            isRunning: this.isRunning,
            startTime: this.startTime,
            currentTime: Date.now(),
            elapsedTime: this.startTime ? Date.now() - this.startTime : 0,
            completedSuites: Object.keys(this.allResults).filter(key => 
                key !== 'summary' && this.allResults[key] !== null
            ).length
        };
    }
    
    /**
     * 実行中のテストを中断
     */
    abortExecution() {
        if (!this.isRunning) {
            console.log('実行中のテストはありません');
            return;
        }
        
        console.log('⏹️ テスト実行を中断しています...');
        this.isRunning = false;
        this.endTime = Date.now();
        
        // 部分的な結果でサマリーを生成
        this.allResults.summary = this.generateSummary();
        this.allResults.summary.aborted = true;
        this.allResults.summary.abortTime = this.endTime;
        
        console.log('⏹️ テスト実行が中断されました');
    }
}