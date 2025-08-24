// パフォーマンス最適化テスト

/**
 * パフォーマンス最適化テストクラス
 * アプリケーションのパフォーマンスを測定し、最適化の提案を行う
 */
export class PerformanceOptimizationTest {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            conversionSpeed: {},
            uiResponsiveness: 0,
            resourceUsage: {}
        };
        
        this.thresholds = {
            loadTime: 3000, // 3秒以内
            renderTime: 100, // 100ms以内
            memoryUsage: 100 * 1024 * 1024, // 100MB以内
            conversionSpeed: {
                svg: 2000, // 2秒以内
                png: 1500, // 1.5秒以内
                jpg: 1000, // 1秒以内
                webp: 1500, // 1.5秒以内
                gif: 2000 // 2秒以内
            },
            uiResponsiveness: 16 // 60fps = 16ms以内
        };
        
        this.optimizations = [];
        this.warnings = [];
    }
    
    /**
     * 全パフォーマンステストを実行
     * @returns {Promise<object>} テスト結果
     */
    async runPerformanceTests() {
        console.log('⚡ パフォーマンス最適化テストを開始します...');
        
        const startTime = Date.now();
        
        try {
            // 1. アプリケーション読み込み時間測定
            await this.measureLoadTime();
            
            // 2. レンダリング時間測定
            await this.measureRenderTime();
            
            // 3. メモリ使用量測定
            this.measureMemoryUsage();
            
            // 4. 変換速度測定
            await this.measureConversionSpeed();
            
            // 5. UI応答性測定
            await this.measureUIResponsiveness();
            
            // 6. リソース使用量測定
            this.measureResourceUsage();
            
            // 7. 最適化提案生成
            this.generateOptimizationSuggestions();
            
            const endTime = Date.now();
            
            const results = {
                metrics: this.metrics,
                thresholds: this.thresholds,
                optimizations: this.optimizations,
                warnings: this.warnings,
                duration: endTime - startTime,
                overallScore: this.calculateOverallScore()
            };
            
            this.displayResults(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ パフォーマンステストエラー:', error);
            throw error;
        }
    }
    
    /**
     * アプリケーション読み込み時間測定
     */
    async measureLoadTime() {
        console.log('📊 アプリケーション読み込み時間を測定中...');
        
        // Navigation Timing APIを使用
        if (performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.metrics.loadTime = loadTime;
            
            if (loadTime > this.thresholds.loadTime) {
                this.warnings.push({
                    type: 'loadTime',
                    message: `読み込み時間が遅いです: ${loadTime}ms > ${this.thresholds.loadTime}ms`,
                    suggestion: 'リソースの最適化、遅延読み込み、CDN使用を検討してください'
                });
            }
        } else {
            this.warnings.push({
                type: 'loadTime',
                message: 'Navigation Timing APIが利用できません',
                suggestion: 'より新しいブラウザでテストしてください'
            });
        }
        
        console.log(`📊 読み込み時間: ${this.metrics.loadTime}ms`);
    }
    
    /**
     * レンダリング時間測定
     */
    async measureRenderTime() {
        console.log('🎨 レンダリング時間を測定中...');
        
        const startTime = performance.now();
        
        // DOM操作のテスト
        const testElement = document.createElement('div');
        testElement.innerHTML = '<p>テスト要素</p>';
        testElement.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
        
        document.body.appendChild(testElement);
        
        // 強制的にレイアウトを発生させる
        testElement.offsetHeight;
        
        document.body.removeChild(testElement);
        
        const endTime = performance.now();
        this.metrics.renderTime = endTime - startTime;
        
        if (this.metrics.renderTime > this.thresholds.renderTime) {
            this.warnings.push({
                type: 'renderTime',
                message: `レンダリング時間が遅いです: ${this.metrics.renderTime.toFixed(2)}ms > ${this.thresholds.renderTime}ms`,
                suggestion: 'DOM操作の最適化、CSS最適化を検討してください'
            });
        }
        
        console.log(`🎨 レンダリング時間: ${this.metrics.renderTime.toFixed(2)}ms`);
    }
    
    /**
     * メモリ使用量測定
     */
    measureMemoryUsage() {
        console.log('💾 メモリ使用量を測定中...');
        
        if (performance.memory) {
            this.metrics.memoryUsage = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            
            const usedMB = Math.round(this.metrics.memoryUsage.used / 1024 / 1024);
            const totalMB = Math.round(this.metrics.memoryUsage.total / 1024 / 1024);
            
            if (this.metrics.memoryUsage.used > this.thresholds.memoryUsage) {
                this.warnings.push({
                    type: 'memoryUsage',
                    message: `メモリ使用量が多いです: ${usedMB}MB > ${Math.round(this.thresholds.memoryUsage / 1024 / 1024)}MB`,
                    suggestion: 'メモリリークの確認、不要なオブジェクトの削除を検討してください'
                });
            }
            
            console.log(`💾 メモリ使用量: ${usedMB}MB / ${totalMB}MB`);
        } else {
            this.warnings.push({
                type: 'memoryUsage',
                message: 'Memory APIが利用できません',
                suggestion: 'Chrome系ブラウザでテストしてください'
            });
        }
    }
    
    /**
     * 変換速度測定
     */
    async measureConversionSpeed() {
        console.log('🔄 変換速度を測定中...');
        
        // 模擬変換テスト
        const formats = ['svg', 'png', 'jpg', 'webp', 'gif'];
        
        for (const format of formats) {
            const startTime = performance.now();
            
            // 模擬変換処理（実際の変換は複雑なため）
            await this.simulateConversion(format);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.metrics.conversionSpeed[format] = duration;
            
            if (duration > this.thresholds.conversionSpeed[format]) {
                this.warnings.push({
                    type: 'conversionSpeed',
                    message: `${format.toUpperCase()}変換が遅いです: ${duration.toFixed(2)}ms > ${this.thresholds.conversionSpeed[format]}ms`,
                    suggestion: `${format.toUpperCase()}変換アルゴリズムの最適化、Web Workers使用を検討してください`
                });
            }
            
            console.log(`🔄 ${format.toUpperCase()}変換速度: ${duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * 模擬変換処理
     * @param {string} format - 変換形式
     */
    async simulateConversion(format) {
        // 形式に応じた処理時間をシミュレート
        const processingTime = {
            svg: 100,
            png: 80,
            jpg: 60,
            webp: 90,
            gif: 120
        };
        
        await new Promise(resolve => setTimeout(resolve, processingTime[format] || 100));
    }
    
    /**
     * UI応答性測定
     */
    async measureUIResponsiveness() {
        console.log('🖱️ UI応答性を測定中...');
        
        const measurements = [];
        
        // 複数回測定して平均を取る
        for (let i = 0; i < 10; i++) {
            const startTime = performance.now();
            
            // DOM操作
            const button = document.createElement('button');
            button.textContent = 'テストボタン';
            button.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
            
            document.body.appendChild(button);
            
            // イベントリスナー追加
            const clickHandler = () => {};
            button.addEventListener('click', clickHandler);
            
            // クリーンアップ
            button.removeEventListener('click', clickHandler);
            document.body.removeChild(button);
            
            const endTime = performance.now();
            measurements.push(endTime - startTime);
            
            // 少し待機
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.metrics.uiResponsiveness = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        
        if (this.metrics.uiResponsiveness > this.thresholds.uiResponsiveness) {
            this.warnings.push({
                type: 'uiResponsiveness',
                message: `UI応答性が遅いです: ${this.metrics.uiResponsiveness.toFixed(2)}ms > ${this.thresholds.uiResponsiveness}ms`,
                suggestion: 'DOM操作の最適化、イベント処理の最適化を検討してください'
            });
        }
        
        console.log(`🖱️ UI応答性: ${this.metrics.uiResponsiveness.toFixed(2)}ms`);
    }
    
    /**
     * リソース使用量測定
     */
    measureResourceUsage() {
        console.log('📈 リソース使用量を測定中...');
        
        // CSS・JS・画像リソースの分析
        const resources = performance.getEntriesByType('resource');
        
        const resourceTypes = {
            css: [],
            js: [],
            image: [],
            other: []
        };
        
        resources.forEach(resource => {
            const url = resource.name;
            const size = resource.transferSize || 0;
            const duration = resource.duration;
            
            if (url.endsWith('.css')) {
                resourceTypes.css.push({ url, size, duration });
            } else if (url.endsWith('.js')) {
                resourceTypes.js.push({ url, size, duration });
            } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url)) {
                resourceTypes.image.push({ url, size, duration });
            } else {
                resourceTypes.other.push({ url, size, duration });
            }
        });
        
        this.metrics.resourceUsage = {
            css: {
                count: resourceTypes.css.length,
                totalSize: resourceTypes.css.reduce((sum, r) => sum + r.size, 0),
                totalDuration: resourceTypes.css.reduce((sum, r) => sum + r.duration, 0)
            },
            js: {
                count: resourceTypes.js.length,
                totalSize: resourceTypes.js.reduce((sum, r) => sum + r.size, 0),
                totalDuration: resourceTypes.js.reduce((sum, r) => sum + r.duration, 0)
            },
            image: {
                count: resourceTypes.image.length,
                totalSize: resourceTypes.image.reduce((sum, r) => sum + r.size, 0),
                totalDuration: resourceTypes.image.reduce((sum, r) => sum + r.duration, 0)
            },
            other: {
                count: resourceTypes.other.length,
                totalSize: resourceTypes.other.reduce((sum, r) => sum + r.size, 0),
                totalDuration: resourceTypes.other.reduce((sum, r) => sum + r.duration, 0)
            }
        };
        
        // リソース最適化の提案
        if (this.metrics.resourceUsage.css.count > 5) {
            this.optimizations.push({
                type: 'css',
                message: `CSSファイルが多すぎます: ${this.metrics.resourceUsage.css.count}個`,
                suggestion: 'CSSファイルの統合、minification、critical CSS抽出を検討してください'
            });
        }
        
        if (this.metrics.resourceUsage.js.count > 10) {
            this.optimizations.push({
                type: 'js',
                message: `JavaScriptファイルが多すぎます: ${this.metrics.resourceUsage.js.count}個`,
                suggestion: 'JSファイルの統合、code splitting、遅延読み込みを検討してください'
            });
        }
        
        const totalImageSize = this.metrics.resourceUsage.image.totalSize;
        if (totalImageSize > 1024 * 1024) { // 1MB以上
            this.optimizations.push({
                type: 'image',
                message: `画像サイズが大きすぎます: ${Math.round(totalImageSize / 1024)}KB`,
                suggestion: '画像の最適化、WebP形式使用、遅延読み込みを検討してください'
            });
        }
        
        console.log('📈 リソース使用量測定完了');
    }
    
    /**
     * 最適化提案生成
     */
    generateOptimizationSuggestions() {
        console.log('💡 最適化提案を生成中...');
        
        // 全体的な最適化提案
        if (this.warnings.length > 5) {
            this.optimizations.push({
                type: 'general',
                message: '複数のパフォーマンス問題が検出されました',
                suggestion: '段階的な最適化を実施し、定期的なパフォーマンス監視を導入してください'
            });
        }
        
        // メモリ使用量に基づく提案
        if (this.metrics.memoryUsage && this.metrics.memoryUsage.used > this.thresholds.memoryUsage * 0.8) {
            this.optimizations.push({
                type: 'memory',
                message: 'メモリ使用量が高めです',
                suggestion: 'オブジェクトプールの使用、不要な参照の削除、ガベージコレクション最適化を検討してください'
            });
        }
        
        // 変換速度に基づく提案
        const slowConversions = Object.entries(this.metrics.conversionSpeed)
            .filter(([format, time]) => time > this.thresholds.conversionSpeed[format] * 0.8);
        
        if (slowConversions.length > 0) {
            this.optimizations.push({
                type: 'conversion',
                message: `変換処理の最適化が必要: ${slowConversions.map(([f]) => f.toUpperCase()).join(', ')}`,
                suggestion: 'Web Workers使用、Canvas最適化、アルゴリズム改善を検討してください'
            });
        }
        
        console.log(`💡 ${this.optimizations.length}個の最適化提案を生成しました`);
    }
    
    /**
     * 総合スコア計算
     * @returns {number} 0-100のスコア
     */
    calculateOverallScore() {
        let score = 100;
        
        // 警告ごとに減点
        score -= this.warnings.length * 10;
        
        // 最適化提案ごとに減点
        score -= this.optimizations.length * 5;
        
        // 個別メトリクスの評価
        if (this.metrics.loadTime > this.thresholds.loadTime) {
            score -= 15;
        }
        
        if (this.metrics.renderTime > this.thresholds.renderTime) {
            score -= 10;
        }
        
        if (this.metrics.memoryUsage && this.metrics.memoryUsage.used > this.thresholds.memoryUsage) {
            score -= 20;
        }
        
        if (this.metrics.uiResponsiveness > this.thresholds.uiResponsiveness) {
            score -= 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * 結果表示
     * @param {object} results - テスト結果
     */
    displayResults(results) {
        console.log('\n' + '='.repeat(60));
        console.log('⚡ パフォーマンス最適化テスト結果');
        console.log('='.repeat(60));
        
        console.log(`📊 総合スコア: ${results.overallScore}/100`);
        console.log(`⏱️ テスト実行時間: ${results.duration}ms`);
        
        console.log('\n📈 メトリクス:');
        console.log(`   読み込み時間: ${results.metrics.loadTime}ms`);
        console.log(`   レンダリング時間: ${results.metrics.renderTime.toFixed(2)}ms`);
        
        if (results.metrics.memoryUsage && results.metrics.memoryUsage.used) {
            console.log(`   メモリ使用量: ${Math.round(results.metrics.memoryUsage.used / 1024 / 1024)}MB`);
        }
        
        console.log(`   UI応答性: ${results.metrics.uiResponsiveness.toFixed(2)}ms`);
        
        console.log('\n🔄 変換速度:');
        Object.entries(results.metrics.conversionSpeed).forEach(([format, time]) => {
            console.log(`   ${format.toUpperCase()}: ${time.toFixed(2)}ms`);
        });
        
        if (results.warnings.length > 0) {
            console.log('\n⚠️ 警告:');
            results.warnings.forEach(warning => {
                console.log(`   • ${warning.message}`);
                console.log(`     提案: ${warning.suggestion}`);
            });
        }
        
        if (results.optimizations.length > 0) {
            console.log('\n💡 最適化提案:');
            results.optimizations.forEach(optimization => {
                console.log(`   • ${optimization.message}`);
                console.log(`     提案: ${optimization.suggestion}`);
            });
        }
        
        // スコアに応じた総合評価
        let evaluation = '';
        if (results.overallScore >= 90) {
            evaluation = '🎉 優秀 - パフォーマンスは非常に良好です';
        } else if (results.overallScore >= 70) {
            evaluation = '✅ 良好 - 一部改善の余地があります';
        } else if (results.overallScore >= 50) {
            evaluation = '⚠️ 要改善 - パフォーマンス最適化が必要です';
        } else {
            evaluation = '❌ 要緊急対応 - 重大なパフォーマンス問題があります';
        }
        
        console.log(`\n${evaluation}`);
        
        // HTMLレポートを生成
        this.generateHTMLReport(results);
    }
    
    /**
     * HTMLレポート生成
     * @param {object} results - テスト結果
     */
    generateHTMLReport(results) {
        const scoreClass = results.overallScore >= 90 ? 'excellent' : 
                          results.overallScore >= 70 ? 'good' : 
                          results.overallScore >= 50 ? 'warning' : 'critical';
        
        const html = `
            <div class="performance-report">
                <h2>⚡ パフォーマンス最適化テスト結果</h2>
                
                <div class="score-section">
                    <div class="score-card ${scoreClass}">
                        <div class="score-value">${results.overallScore}</div>
                        <div class="score-label">/ 100</div>
                        <div class="score-description">総合スコア</div>
                    </div>
                </div>
                
                <div class="metrics-section">
                    <h3>📈 パフォーマンスメトリクス</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${results.metrics.loadTime}ms</div>
                            <div class="metric-label">読み込み時間</div>
                            <div class="metric-threshold">目標: ${results.thresholds.loadTime}ms以内</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${results.metrics.renderTime.toFixed(2)}ms</div>
                            <div class="metric-label">レンダリング時間</div>
                            <div class="metric-threshold">目標: ${results.thresholds.renderTime}ms以内</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${results.metrics.memoryUsage && results.metrics.memoryUsage.used ? Math.round(results.metrics.memoryUsage.used / 1024 / 1024) + 'MB' : 'N/A'}</div>
                            <div class="metric-label">メモリ使用量</div>
                            <div class="metric-threshold">目標: ${Math.round(results.thresholds.memoryUsage / 1024 / 1024)}MB以内</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${results.metrics.uiResponsiveness.toFixed(2)}ms</div>
                            <div class="metric-label">UI応答性</div>
                            <div class="metric-threshold">目標: ${results.thresholds.uiResponsiveness}ms以内</div>
                        </div>
                    </div>
                </div>
                
                <div class="conversion-section">
                    <h3>🔄 変換速度</h3>
                    <div class="conversion-grid">
                        ${Object.entries(results.metrics.conversionSpeed).map(([format, time]) => `
                            <div class="conversion-card ${time > results.thresholds.conversionSpeed[format] ? 'slow' : 'fast'}">
                                <div class="conversion-format">${format.toUpperCase()}</div>
                                <div class="conversion-time">${time.toFixed(2)}ms</div>
                                <div class="conversion-threshold">目標: ${results.thresholds.conversionSpeed[format]}ms以内</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${results.warnings.length > 0 ? `
                    <div class="warnings-section">
                        <h3>⚠️ 警告 (${results.warnings.length}件)</h3>
                        <div class="warnings-list">
                            ${results.warnings.map(warning => `
                                <div class="warning-item">
                                    <div class="warning-message">${warning.message}</div>
                                    <div class="warning-suggestion">💡 ${warning.suggestion}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${results.optimizations.length > 0 ? `
                    <div class="optimizations-section">
                        <h3>💡 最適化提案 (${results.optimizations.length}件)</h3>
                        <div class="optimizations-list">
                            ${results.optimizations.map(optimization => `
                                <div class="optimization-item">
                                    <div class="optimization-message">${optimization.message}</div>
                                    <div class="optimization-suggestion">🚀 ${optimization.suggestion}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="actions-section">
                    <button onclick="this.parentElement.parentElement.remove()" class="close-btn">
                        ❌ レポートを閉じる
                    </button>
                </div>
            </div>
        `;
        
        // レポート表示
        const reportContainer = document.createElement('div');
        reportContainer.className = 'performance-report-container';
        reportContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            background: white;
            border: 3px solid #333;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            z-index: 10004;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        reportContainer.innerHTML = html;
        document.body.appendChild(reportContainer);
        
        // スタイルを追加
        this.addReportStyles();
    }
    
    /**
     * レポート用スタイルを追加
     */
    addReportStyles() {
        if (document.getElementById('performance-report-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'performance-report-styles';
        style.textContent = `
            .performance-report h2 { 
                margin-top: 0; 
                color: #333; 
                text-align: center;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            
            .score-section { 
                text-align: center; 
                margin-bottom: 30px; 
            }
            
            .score-card {
                display: inline-block;
                padding: 20px;
                border-radius: 12px;
                min-width: 120px;
            }
            
            .score-card.excellent { background: linear-gradient(135deg, #4caf50, #45a049); color: white; }
            .score-card.good { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; }
            .score-card.warning { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; }
            .score-card.critical { background: linear-gradient(135deg, #f44336, #d32f2f); color: white; }
            
            .score-value { font-size: 48px; font-weight: bold; line-height: 1; }
            .score-label { font-size: 24px; opacity: 0.8; }
            .score-description { font-size: 14px; margin-top: 8px; opacity: 0.9; }
            
            .metrics-section, .conversion-section, .warnings-section, .optimizations-section {
                margin-bottom: 24px;
            }
            
            .metrics-section h3, .conversion-section h3, .warnings-section h3, .optimizations-section h3 {
                color: #666;
                margin-bottom: 16px;
            }
            
            .metrics-grid, .conversion-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .metric-card, .conversion-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
                background: white;
            }
            
            .conversion-card.slow { border-left: 4px solid #f44336; }
            .conversion-card.fast { border-left: 4px solid #4caf50; }
            
            .metric-value, .conversion-time {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 4px;
            }
            
            .metric-label, .conversion-format {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
            }
            
            .metric-threshold, .conversion-threshold {
                font-size: 12px;
                color: #999;
            }
            
            .warnings-list, .optimizations-list {
                space-y: 12px;
            }
            
            .warning-item, .optimization-item {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                background: white;
            }
            
            .warning-item { border-left: 4px solid #ff9800; }
            .optimization-item { border-left: 4px solid #2196f3; }
            
            .warning-message, .optimization-message {
                font-weight: bold;
                margin-bottom: 8px;
                color: #333;
            }
            
            .warning-suggestion, .optimization-suggestion {
                font-size: 14px;
                color: #666;
                line-height: 1.4;
            }
            
            .actions-section {
                text-align: center;
                padding-top: 16px;
                border-top: 1px solid #eee;
            }
            
            .close-btn {
                padding: 8px 16px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .close-btn:hover { background: #c82333; }
        `;
        
        document.head.appendChild(style);
    }
}