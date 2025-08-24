// パフォーマンスプロファイラー

/**
 * パフォーマンスプロファイラークラス
 */
export class PerformanceProfiler {
    constructor() {
        this.profiles = new Map();
        this.activeProfiles = new Map();
        this.benchmarks = [];
        this.memorySnapshots = [];
        
        this.isEnabled = true;
        this.autoSnapshot = true;
        this.snapshotInterval = 5000; // 5秒間隔
        
        if (this.autoSnapshot) {
            this.startAutoSnapshot();
        }
    }
    
    /**
     * プロファイリングを開始
     * @param {string} name - プロファイル名
     * @param {object} metadata - メタデータ
     */
    startProfile(name, metadata = {}) {
        if (!this.isEnabled) return;
        
        const profile = {
            name,
            startTime: performance.now(),
            startMemory: this.getCurrentMemoryUsage(),
            metadata,
            markers: [],
            timestamp: new Date()
        };
        
        this.activeProfiles.set(name, profile);
        console.log(`🚀 Profile started: ${name}`);
    }
    
    /**
     * プロファイリングを終了
     * @param {string} name - プロファイル名
     * @returns {object} プロファイル結果
     */
    endProfile(name) {
        if (!this.isEnabled) return null;
        
        const profile = this.activeProfiles.get(name);
        if (!profile) {
            console.warn(`Profile not found: ${name}`);
            return null;
        }
        
        const endTime = performance.now();
        const endMemory = this.getCurrentMemoryUsage();
        
        const result = {
            ...profile,
            endTime,
            endMemory,
            duration: endTime - profile.startTime,
            memoryDelta: endMemory ? endMemory.used - profile.startMemory.used : 0,
            completed: true
        };
        
        this.profiles.set(name, result);
        this.activeProfiles.delete(name);
        
        console.log(`✅ Profile completed: ${name} (${result.duration.toFixed(2)}ms)`);
        return result;
    }
    
    /**
     * プロファイル中にマーカーを追加
     * @param {string} profileName - プロファイル名
     * @param {string} markerName - マーカー名
     * @param {object} data - データ
     */
    addMarker(profileName, markerName, data = {}) {
        if (!this.isEnabled) return;
        
        const profile = this.activeProfiles.get(profileName);
        if (!profile) return;
        
        const marker = {
            name: markerName,
            timestamp: performance.now(),
            relativeTime: performance.now() - profile.startTime,
            data,
            memory: this.getCurrentMemoryUsage()
        };
        
        profile.markers.push(marker);
        console.log(`📍 Marker added: ${profileName} -> ${markerName}`);
    }
    
    /**
     * ベンチマークを実行
     * @param {string} name - ベンチマーク名
     * @param {Function} fn - 実行する関数
     * @param {number} iterations - 実行回数
     * @returns {Promise<object>} ベンチマーク結果
     */
    async benchmark(name, fn, iterations = 100) {
        if (!this.isEnabled) return null;
        
        console.log(`🏃 Benchmark started: ${name} (${iterations} iterations)`);
        
        const results = [];
        const startMemory = this.getCurrentMemoryUsage();
        
        // ウォームアップ
        for (let i = 0; i < Math.min(10, iterations); i++) {
            await fn();
        }
        
        // 実際のベンチマーク
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            await fn();
            const endTime = performance.now();
            
            results.push(endTime - startTime);
        }
        
        const endMemory = this.getCurrentMemoryUsage();
        
        // 統計計算
        const sorted = results.sort((a, b) => a - b);
        const benchmark = {
            name,
            iterations,
            results,
            statistics: {
                min: Math.min(...results),
                max: Math.max(...results),
                mean: results.reduce((a, b) => a + b, 0) / results.length,
                median: sorted[Math.floor(sorted.length / 2)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)]
            },
            memoryDelta: endMemory ? endMemory.used - startMemory.used : 0,
            timestamp: new Date()
        };
        
        this.benchmarks.push(benchmark);
        
        console.log(`🏁 Benchmark completed: ${name}`);
        console.log(`   Mean: ${benchmark.statistics.mean.toFixed(2)}ms`);
        console.log(`   Median: ${benchmark.statistics.median.toFixed(2)}ms`);
        console.log(`   P95: ${benchmark.statistics.p95.toFixed(2)}ms`);
        
        return benchmark;
    }
    
    /**
     * メモリスナップショットを取得
     * @param {string} label - ラベル
     */
    takeMemorySnapshot(label = '') {
        if (!this.isEnabled) return;
        
        const snapshot = {
            label,
            timestamp: new Date(),
            memory: this.getCurrentMemoryUsage(),
            performance: {
                now: performance.now(),
                timing: performance.timing ? {
                    navigationStart: performance.timing.navigationStart,
                    loadEventEnd: performance.timing.loadEventEnd
                } : null
            }
        };
        
        this.memorySnapshots.push(snapshot);
        
        if (this.memorySnapshots.length > 100) {
            this.memorySnapshots.shift(); // 古いスナップショットを削除
        }
        
        console.log(`📸 Memory snapshot: ${label}`, snapshot.memory);
    }
    
    /**
     * 自動スナップショットを開始
     */
    startAutoSnapshot() {
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
        }
        
        this.snapshotTimer = setInterval(() => {
            this.takeMemorySnapshot('auto');
        }, this.snapshotInterval);
    }
    
    /**
     * 自動スナップショットを停止
     */
    stopAutoSnapshot() {
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
            this.snapshotTimer = null;
        }
    }
    
    /**
     * 現在のメモリ使用量を取得
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    /**
     * プロファイル結果を取得
     * @param {string} name - プロファイル名
     * @returns {object} プロファイル結果
     */
    getProfile(name) {
        return this.profiles.get(name);
    }
    
    /**
     * 全プロファイル結果を取得
     * @returns {Array} プロファイル結果の配列
     */
    getAllProfiles() {
        return Array.from(this.profiles.values());
    }
    
    /**
     * ベンチマーク結果を取得
     * @returns {Array} ベンチマーク結果の配列
     */
    getBenchmarks() {
        return [...this.benchmarks];
    }
    
    /**
     * メモリスナップショットを取得
     * @returns {Array} スナップショットの配列
     */
    getMemorySnapshots() {
        return [...this.memorySnapshots];
    }
    
    /**
     * パフォーマンス統計を生成
     * @returns {object} 統計情報
     */
    generateStatistics() {
        const profiles = this.getAllProfiles();
        const benchmarks = this.getBenchmarks();
        const snapshots = this.getMemorySnapshots();
        
        const stats = {
            profiles: {
                total: profiles.length,
                completed: profiles.filter(p => p.completed).length,
                averageDuration: profiles.length > 0 ? 
                    profiles.reduce((sum, p) => sum + p.duration, 0) / profiles.length : 0
            },
            benchmarks: {
                total: benchmarks.length,
                averageIterations: benchmarks.length > 0 ?
                    benchmarks.reduce((sum, b) => sum + b.iterations, 0) / benchmarks.length : 0
            },
            memory: {
                snapshots: snapshots.length,
                current: this.getCurrentMemoryUsage(),
                trend: this.calculateMemoryTrend()
            },
            timestamp: new Date()
        };
        
        return stats;
    }
    
    /**
     * メモリ使用量のトレンドを計算
     */
    calculateMemoryTrend() {
        const snapshots = this.getMemorySnapshots();
        if (snapshots.length < 2) return null;
        
        const recent = snapshots.slice(-10); // 最新10個
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        if (!first.memory || !last.memory) return null;
        
        const delta = last.memory.used - first.memory.used;
        const timeSpan = last.timestamp - first.timestamp;
        
        return {
            delta,
            rate: timeSpan > 0 ? delta / timeSpan : 0,
            direction: delta > 0 ? 'increasing' : delta < 0 ? 'decreasing' : 'stable'
        };
    }
    
    /**
     * パフォーマンスレポートを生成
     * @returns {string} HTMLレポート
     */
    generateReport() {
        const stats = this.generateStatistics();
        const profiles = this.getAllProfiles();
        const benchmarks = this.getBenchmarks();
        
        return `
            <div class="performance-report">
                <h2>📊 パフォーマンスレポート</h2>
                
                <div class="stats-summary">
                    <h3>📈 統計サマリー</h3>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <label>プロファイル数:</label>
                            <value>${stats.profiles.total}</value>
                        </div>
                        <div class="stat-item">
                            <label>平均実行時間:</label>
                            <value>${stats.profiles.averageDuration.toFixed(2)}ms</value>
                        </div>
                        <div class="stat-item">
                            <label>ベンチマーク数:</label>
                            <value>${stats.benchmarks.total}</value>
                        </div>
                        <div class="stat-item">
                            <label>メモリスナップショット:</label>
                            <value>${stats.memory.snapshots}</value>
                        </div>
                    </div>
                </div>
                
                <div class="profiles-section">
                    <h3>🚀 プロファイル結果</h3>
                    ${profiles.map(profile => `
                        <div class="profile-item">
                            <h4>${profile.name}</h4>
                            <div>実行時間: ${profile.duration.toFixed(2)}ms</div>
                            <div>メモリ変化: ${profile.memoryDelta || 0} bytes</div>
                            <div>マーカー数: ${profile.markers.length}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="benchmarks-section">
                    <h3>🏃 ベンチマーク結果</h3>
                    ${benchmarks.map(benchmark => `
                        <div class="benchmark-item">
                            <h4>${benchmark.name}</h4>
                            <div>平均: ${benchmark.statistics.mean.toFixed(2)}ms</div>
                            <div>中央値: ${benchmark.statistics.median.toFixed(2)}ms</div>
                            <div>P95: ${benchmark.statistics.p95.toFixed(2)}ms</div>
                            <div>実行回数: ${benchmark.iterations}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * レポートを表示
     */
    showReport() {
        const reportHTML = this.generateReport();
        
        let reportPanel = document.getElementById('performance-report-panel');
        if (!reportPanel) {
            reportPanel = document.createElement('div');
            reportPanel.id = 'performance-report-panel';
            reportPanel.style.cssText = `
                position: fixed;
                top: 50px;
                left: 50px;
                width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                background: white;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10004;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(reportPanel);
        }
        
        reportPanel.innerHTML = reportHTML + `
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    閉じる
                </button>
            </div>
        `;
        
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
            .performance-report h2 { margin-top: 0; color: #333; }
            .performance-report h3 { color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
            .stat-item { display: flex; justify-content: space-between; padding: 5px; background: #f8f9fa; border-radius: 4px; }
            .profile-item, .benchmark-item { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
            .profile-item h4, .benchmark-item h4 { margin: 0 0 5px 0; color: #007bff; }
            .profile-item div, .benchmark-item div { font-size: 14px; margin-bottom: 2px; }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * データをクリア
     */
    clear() {
        this.profiles.clear();
        this.activeProfiles.clear();
        this.benchmarks = [];
        this.memorySnapshots = [];
        console.log('🗑️ Performance profiler data cleared');
    }
    
    /**
     * プロファイラーを無効にする
     */
    disable() {
        this.isEnabled = false;
        this.stopAutoSnapshot();
        console.log('⏸️ Performance profiler disabled');
    }
    
    /**
     * プロファイラーを有効にする
     */
    enable() {
        this.isEnabled = true;
        if (this.autoSnapshot) {
            this.startAutoSnapshot();
        }
        console.log('▶️ Performance profiler enabled');
    }
}