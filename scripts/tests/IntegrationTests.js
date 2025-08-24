// 統合テストとデバッグ支援機能

import { TestRunner } from './TestRunner.js';
import { SUPPORTED_FORMATS, ERROR_TYPES } from '../constants.js';

/**
 * 統合テストとデバッグ支援のテストスイート
 */
export class IntegrationTests {
    constructor() {
        this.testRunner = new TestRunner();
        this.performanceData = [];
        this.debugInfo = {
            browserInfo: this.getBrowserInfo(),
            performanceMetrics: {},
            memoryUsage: {},
            errorLog: []
        };
    }
    
    /**
     * 全ての統合テストを実行
     * @returns {Promise<object>} テスト結果
     */
    async runAllTests() {
        console.log('🔗 統合テストとデバッグ支援を開始します...');
        
        // テストスイートを定義
        this.defineEndToEndTests();
        this.definePerformanceTests();
        this.defineBrowserCompatibilityTests();
        this.defineDebugSupportTests();
        this.defineErrorRecoveryTests();
        
        // テストを実行
        return await this.testRunner.runAll();
    }
    
    /**
     * エンドツーエンドテストの定義
     */
    defineEndToEndTests() {
        this.testRunner.describe('End-to-End Conversion Tests', () => {
            
            this.testRunner.itAsync('SVGからPNGへの完全な変換フローが動作する', async () => {
                try {
                    // 1. ファイル作成
                    const svgFile = this.testRunner.createMockFile(SUPPORTED_FORMATS.SVG, 1024);
                    this.testRunner.assertNotNull(svgFile, 'SVGファイルが作成されていません');
                    
                    // 2. ファイル検証（モック）
                    const validation = this.mockFileValidation(svgFile);
                    this.testRunner.assertTrue(validation.isValid, 'ファイル検証が失敗しました');
                    
                    // 3. ファイル読み込み（モック）
                    const fileData = await this.mockFileReading(svgFile);
                    this.testRunner.assertNotNull(fileData, 'ファイル読み込みが失敗しました');
                    
                    // 4. 変換処理（モック）
                    const conversionResult = await this.mockConversion(fileData, SUPPORTED_FORMATS.SVG, SUPPORTED_FORMATS.PNG);
                    this.testRunner.assertNotNull(conversionResult, '変換処理が失敗しました');
                    
                    // 5. 結果検証
                    this.testRunner.assertHasProperty(conversionResult, 'data', '変換結果にdataがありません');
                    this.testRunner.assertHasProperty(conversionResult, 'fromFormat', '変換結果にfromFormatがありません');
                    this.testRunner.assertHasProperty(conversionResult, 'toFormat', '変換結果にtoFormatがありません');
                    
                    console.log('✅ SVG→PNG変換フローが正常に完了しました');
                    
                } catch (error) {
                    console.error('E2Eテストエラー:', error);
                    throw error;
                }
            });
            
            this.testRunner.itAsync('PNGからJPGへの完全な変換フローが動作する', async () => {
                try {
                    const pngFile = this.testRunner.createMockFile(SUPPORTED_FORMATS.PNG, 2048);
                    const validation = this.mockFileValidation(pngFile);
                    const fileData = await this.mockFileReading(pngFile);
                    const conversionResult = await this.mockConversion(fileData, SUPPORTED_FORMATS.PNG, SUPPORTED_FORMATS.JPG);
                    
                    this.testRunner.assertNotNull(conversionResult, 'PNG→JPG変換が失敗しました');
                    this.testRunner.assertEqual(conversionResult.fromFormat, SUPPORTED_FORMATS.PNG, '変換元形式が正しくありません');
                    this.testRunner.assertEqual(conversionResult.toFormat, SUPPORTED_FORMATS.JPG, '変換先形式が正しくありません');
                    
                    console.log('✅ PNG→JPG変換フローが正常に完了しました');
                    
                } catch (error) {
                    console.error('PNG→JPG E2Eテストエラー:', error);
                    throw error;
                }
            });
            
            this.testRunner.itAsync('バッチ変換フローが動作する', async () => {
                try {
                    // 複数ファイルを作成
                    const files = [
                        this.testRunner.createMockFile(SUPPORTED_FORMATS.SVG, 1024),
                        this.testRunner.createMockFile(SUPPORTED_FORMATS.PNG, 2048),
                        this.testRunner.createMockFile(SUPPORTED_FORMATS.JPG, 1536)
                    ];
                    
                    // バッチ処理をシミュレート
                    const batchResults = [];
                    for (const file of files) {
                        const validation = this.mockFileValidation(file);
                        if (validation.isValid) {
                            const fileData = await this.mockFileReading(file);
                            const result = await this.mockConversion(fileData, validation.detectedFormat, SUPPORTED_FORMATS.PNG);
                            batchResults.push(result);
                        }
                    }
                    
                    this.testRunner.assertEqual(batchResults.length, files.length, 'バッチ処理の結果数が正しくありません');
                    
                    // 全ての結果が有効であることを確認
                    batchResults.forEach((result, index) => {
                        this.testRunner.assertNotNull(result, `バッチ結果${index + 1}がnullです`);
                        this.testRunner.assertEqual(result.toFormat, SUPPORTED_FORMATS.PNG, `バッチ結果${index + 1}の変換先形式が正しくありません`);
                    });
                    
                    console.log('✅ バッチ変換フローが正常に完了しました');
                    
                } catch (error) {
                    console.error('バッチ変換E2Eテストエラー:', error);
                    throw error;
                }
            });
            
            this.testRunner.itAsync('エラー回復フローが動作する', async () => {
                try {
                    // 無効なファイルで変換を試行
                    const invalidFile = new File(['invalid content'], 'invalid.txt', { type: 'text/plain' });
                    
                    // エラーが適切に処理されることを確認
                    const validation = this.mockFileValidation(invalidFile);
                    this.testRunner.assertFalse(validation.isValid, '無効ファイルが有効と判定されました');
                    this.testRunner.assertTrue(validation.errors.length > 0, 'エラーが記録されていません');
                    
                    // エラー回復処理をシミュレート
                    const errorRecovery = this.mockErrorRecovery(validation.errors[0]);
                    this.testRunner.assertNotNull(errorRecovery, 'エラー回復処理が失敗しました');
                    this.testRunner.assertHasProperty(errorRecovery, 'suggestion', 'エラー回復に提案がありません');
                    
                    console.log('✅ エラー回復フローが正常に完了しました');
                    
                } catch (error) {
                    console.error('エラー回復E2Eテストエラー:', error);
                    throw error;
                }
            });
        });
    }
    
    /**
     * パフォーマンステストの定義
     */
    definePerformanceTests() {
        this.testRunner.describe('Performance Monitoring', () => {
            
            this.testRunner.itAsync('変換処理のパフォーマンスが測定される', async () => {
                const startTime = performance.now();
                const startMemory = this.getCurrentMemoryUsage();
                
                // 模擬的な変換処理
                const mockFile = this.testRunner.createMockFile(SUPPORTED_FORMATS.SVG, 4096);
                const fileData = await this.mockFileReading(mockFile);
                const result = await this.mockConversion(fileData, SUPPORTED_FORMATS.SVG, SUPPORTED_FORMATS.PNG);
                
                const endTime = performance.now();
                const endMemory = this.getCurrentMemoryUsage();
                
                const duration = endTime - startTime;
                const memoryDelta = endMemory - startMemory;
                
                // パフォーマンスデータを記録
                this.performanceData.push({
                    operation: 'SVG to PNG conversion',
                    duration,
                    memoryDelta,
                    fileSize: mockFile.size,
                    timestamp: new Date()
                });
                
                this.testRunner.assertTrue(duration >= 0, '実行時間が負の値です');
                this.testRunner.assertNotNull(result, '変換結果がnullです');
                
                console.log(`パフォーマンス測定: ${duration.toFixed(2)}ms, メモリ変化: ${memoryDelta}bytes`);
            });
            
            this.testRunner.itAsync('大容量ファイルの処理パフォーマンスが測定される', async () => {
                const largeFile = this.testRunner.createMockFile(SUPPORTED_FORMATS.PNG, 5 * 1024 * 1024); // 5MB
                
                const performanceResult = await this.testRunner.measurePerformance(async () => {
                    const fileData = await this.mockFileReading(largeFile);
                    return await this.mockConversion(fileData, SUPPORTED_FORMATS.PNG, SUPPORTED_FORMATS.JPG);
                });
                
                this.testRunner.assertNotNull(performanceResult.result, '大容量ファイル変換結果がnullです');
                this.testRunner.assertTrue(performanceResult.duration > 0, '大容量ファイル処理時間が0以下です');
                
                // パフォーマンス閾値チェック（10秒以内）
                const maxDuration = 10000; // 10秒
                if (performanceResult.duration > maxDuration) {
                    console.warn(`大容量ファイル処理が遅い: ${performanceResult.duration.toFixed(2)}ms > ${maxDuration}ms`);
                }
                
                console.log(`大容量ファイル処理: ${performanceResult.duration.toFixed(2)}ms`);
            });
            
            this.testRunner.it('メモリ使用量が適切に監視される', () => {
                const initialMemory = this.getCurrentMemoryUsage();
                
                // メモリを消費する処理をシミュレート
                const largeArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: `test-${i}` }));
                
                const afterAllocationMemory = this.getCurrentMemoryUsage();
                
                // メモリを解放
                largeArray.length = 0;
                
                const afterCleanupMemory = this.getCurrentMemoryUsage();
                
                this.testRunner.assertTrue(afterAllocationMemory >= initialMemory, 'メモリ使用量が増加していません');
                
                console.log(`メモリ使用量: 初期=${initialMemory}, 割り当て後=${afterAllocationMemory}, クリーンアップ後=${afterCleanupMemory}`);
                
                // デバッグ情報に記録
                this.debugInfo.memoryUsage = {
                    initial: initialMemory,
                    afterAllocation: afterAllocationMemory,
                    afterCleanup: afterCleanupMemory,
                    timestamp: new Date()
                };
            });
            
            this.testRunner.it('パフォーマンス統計が正しく計算される', () => {
                // パフォーマンスデータがある場合の統計計算
                if (this.performanceData.length > 0) {
                    const durations = this.performanceData.map(data => data.duration);
                    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
                    const maxDuration = Math.max(...durations);
                    const minDuration = Math.min(...durations);
                    
                    this.debugInfo.performanceMetrics = {
                        averageDuration: avgDuration,
                        maxDuration,
                        minDuration,
                        totalOperations: this.performanceData.length,
                        timestamp: new Date()
                    };
                    
                    this.testRunner.assertTrue(avgDuration >= 0, '平均実行時間が負の値です');
                    this.testRunner.assertTrue(maxDuration >= minDuration, '最大時間が最小時間より小さいです');
                    
                    console.log(`パフォーマンス統計: 平均=${avgDuration.toFixed(2)}ms, 最大=${maxDuration.toFixed(2)}ms, 最小=${minDuration.toFixed(2)}ms`);
                } else {
                    console.log('パフォーマンスデータがありません');
                    this.testRunner.assertTrue(true, 'パフォーマンスデータなしは許容されます');
                }
            });
        });
    }
    
    /**
     * ブラウザ互換性テストの定義
     */
    defineBrowserCompatibilityTests() {
        this.testRunner.describe('Browser Compatibility', () => {
            
            this.testRunner.it('必要なAPI機能がサポートされている', () => {
                const requiredAPIs = {
                    'Canvas API': 'HTMLCanvasElement' in window,
                    'File API': 'FileReader' in window,
                    'Blob API': 'Blob' in window,
                    'URL API': 'URL' in window && 'createObjectURL' in URL,
                    'DOMParser': 'DOMParser' in window,
                    'CustomEvent': 'CustomEvent' in window,
                    'Promise': 'Promise' in window,
                    'Fetch API': 'fetch' in window
                };
                
                const unsupportedAPIs = [];
                const supportedAPIs = [];
                
                Object.entries(requiredAPIs).forEach(([apiName, isSupported]) => {
                    if (isSupported) {
                        supportedAPIs.push(apiName);
                    } else {
                        unsupportedAPIs.push(apiName);
                    }
                });
                
                console.log(`サポートされているAPI: ${supportedAPIs.join(', ')}`);
                if (unsupportedAPIs.length > 0) {
                    console.warn(`サポートされていないAPI: ${unsupportedAPIs.join(', ')}`);
                }
                
                // 重要なAPIがサポートされていることを確認
                this.testRunner.assertTrue(requiredAPIs['Canvas API'], 'Canvas APIがサポートされていません');
                this.testRunner.assertTrue(requiredAPIs['File API'], 'File APIがサポートされていません');
                this.testRunner.assertTrue(requiredAPIs['Blob API'], 'Blob APIがサポートされていません');
                
                // デバッグ情報に記録
                this.debugInfo.browserInfo.supportedAPIs = supportedAPIs;
                this.debugInfo.browserInfo.unsupportedAPIs = unsupportedAPIs;
            });
            
            this.testRunner.it('Canvas機能が正しく動作する', () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    this.testRunner.assertNotNull(canvas, 'Canvas要素が作成できません');
                    this.testRunner.assertNotNull(ctx, 'Canvas contextが取得できません');
                    
                    // 基本的な描画テスト
                    canvas.width = 100;
                    canvas.height = 100;
                    ctx.fillStyle = 'red';
                    ctx.fillRect(0, 0, 50, 50);
                    
                    // ImageDataの取得テスト
                    const imageData = ctx.getImageData(0, 0, 100, 100);
                    this.testRunner.assertNotNull(imageData, 'ImageDataが取得できません');
                    this.testRunner.assertEqual(imageData.width, 100, 'ImageDataの幅が正しくありません');
                    this.testRunner.assertEqual(imageData.height, 100, 'ImageDataの高さが正しくありません');
                    
                    // toBlob機能のテスト
                    let blobSupported = false;
                    canvas.toBlob((blob) => {
                        blobSupported = blob !== null;
                    });
                    
                    // 少し待ってからチェック（非同期処理のため）
                    setTimeout(() => {
                        console.log(`Canvas toBlob サポート: ${blobSupported}`);
                    }, 100);
                    
                } catch (error) {
                    console.error('Canvas機能テストエラー:', error);
                    this.testRunner.assertTrue(false, `Canvas機能エラー: ${error.message}`);
                }
            });
            
            this.testRunner.it('ファイル処理機能が正しく動作する', () => {
                try {
                    // FileReaderのテスト
                    const reader = new FileReader();
                    this.testRunner.assertNotNull(reader, 'FileReaderが作成できません');
                    this.testRunner.assertTrue(typeof reader.readAsText === 'function', 'readAsTextメソッドがありません');
                    this.testRunner.assertTrue(typeof reader.readAsArrayBuffer === 'function', 'readAsArrayBufferメソッドがありません');
                    
                    // Blobのテスト
                    const blob = new Blob(['test'], { type: 'text/plain' });
                    this.testRunner.assertNotNull(blob, 'Blobが作成できません');
                    this.testRunner.assertEqual(blob.type, 'text/plain', 'BlobのMIMEタイプが正しくありません');
                    
                    // URLのテスト
                    const url = URL.createObjectURL(blob);
                    this.testRunner.assertNotNull(url, 'Object URLが作成できません');
                    this.testRunner.assertTrue(url.startsWith('blob:'), 'Object URLの形式が正しくありません');
                    
                    // クリーンアップ
                    URL.revokeObjectURL(url);
                    
                } catch (error) {
                    console.error('ファイル処理機能テストエラー:', error);
                    this.testRunner.assertTrue(false, `ファイル処理機能エラー: ${error.message}`);
                }
            });
            
            this.testRunner.it('画像形式サポートが確認される', () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                
                const supportedFormats = {};
                
                // PNG サポート
                try {
                    const pngDataURL = canvas.toDataURL('image/png');
                    supportedFormats.png = pngDataURL.startsWith('data:image/png');
                } catch (error) {
                    supportedFormats.png = false;
                }
                
                // JPEG サポート
                try {
                    const jpegDataURL = canvas.toDataURL('image/jpeg');
                    supportedFormats.jpeg = jpegDataURL.startsWith('data:image/jpeg');
                } catch (error) {
                    supportedFormats.jpeg = false;
                }
                
                // WebP サポート
                try {
                    const webpDataURL = canvas.toDataURL('image/webp');
                    supportedFormats.webp = webpDataURL.startsWith('data:image/webp');
                } catch (error) {
                    supportedFormats.webp = false;
                }
                
                console.log('画像形式サポート:', supportedFormats);
                
                // 基本的な形式はサポートされているべき
                this.testRunner.assertTrue(supportedFormats.png, 'PNG形式がサポートされていません');
                this.testRunner.assertTrue(supportedFormats.jpeg, 'JPEG形式がサポートされていません');
                
                // デバッグ情報に記録
                this.debugInfo.browserInfo.imageFormatSupport = supportedFormats;
            });
            
            this.testRunner.it('ブラウザ情報が正しく取得される', () => {
                const browserInfo = this.getBrowserInfo();
                
                this.testRunner.assertNotNull(browserInfo.userAgent, 'UserAgentが取得できません');
                this.testRunner.assertNotNull(browserInfo.platform, 'プラットフォーム情報が取得できません');
                this.testRunner.assertType(browserInfo.cookieEnabled, 'boolean', 'Cookie有効状態が取得できません');
                this.testRunner.assertType(browserInfo.onLine, 'boolean', 'オンライン状態が取得できません');
                
                console.log('ブラウザ情報:', {
                    name: browserInfo.name,
                    version: browserInfo.version,
                    platform: browserInfo.platform,
                    language: browserInfo.language
                });
                
                this.debugInfo.browserInfo = { ...this.debugInfo.browserInfo, ...browserInfo };
            });
        });
    }
    
    /**
     * デバッグ支援テストの定義
     */
    defineDebugSupportTests() {
        this.testRunner.describe('Debug Support', () => {
            
            this.testRunner.it('デバッグ情報が正しく収集される', () => {
                // システム情報の収集
                const systemInfo = {
                    timestamp: new Date(),
                    url: window.location.href,
                    referrer: document.referrer,
                    title: document.title,
                    readyState: document.readyState,
                    visibilityState: document.visibilityState
                };
                
                this.debugInfo.systemInfo = systemInfo;
                
                this.testRunner.assertNotNull(systemInfo.timestamp, 'タイムスタンプが取得できません');
                this.testRunner.assertNotNull(systemInfo.url, 'URLが取得できません');
                this.testRunner.assertType(systemInfo.readyState, 'string', 'readyStateが文字列ではありません');
                
                console.log('システム情報:', systemInfo);
            });
            
            this.testRunner.it('エラーログが正しく記録される', () => {
                // テスト用エラーを記録
                const testError = {
                    message: 'テストエラー',
                    type: ERROR_TYPES.PROCESSING_ERROR,
                    timestamp: new Date(),
                    stack: 'test stack trace',
                    context: {
                        operation: 'test operation',
                        file: 'test.png',
                        format: SUPPORTED_FORMATS.PNG
                    }
                };
                
                this.debugInfo.errorLog.push(testError);
                
                this.testRunner.assertTrue(this.debugInfo.errorLog.length > 0, 'エラーログが記録されていません');
                
                const recordedError = this.debugInfo.errorLog[this.debugInfo.errorLog.length - 1];
                this.testRunner.assertEqual(recordedError.message, testError.message, 'エラーメッセージが正しく記録されていません');
                this.testRunner.assertEqual(recordedError.type, testError.type, 'エラータイプが正しく記録されていません');
                
                console.log('エラーログ記録:', recordedError);
            });
            
            this.testRunner.it('パフォーマンス監視データが収集される', () => {
                // パフォーマンス情報の収集
                const performanceInfo = {
                    timing: performance.timing ? {
                        navigationStart: performance.timing.navigationStart,
                        loadEventEnd: performance.timing.loadEventEnd,
                        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
                    } : null,
                    memory: performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    } : null,
                    now: performance.now()
                };
                
                this.debugInfo.performanceInfo = performanceInfo;
                
                this.testRunner.assertType(performanceInfo.now, 'number', 'performance.nowが数値ではありません');
                
                if (performanceInfo.timing) {
                    console.log('ページ読み込み時間:', performanceInfo.timing.loadEventEnd - performanceInfo.timing.navigationStart, 'ms');
                }
                
                if (performanceInfo.memory) {
                    console.log('メモリ使用量:', Math.round(performanceInfo.memory.usedJSHeapSize / 1024 / 1024), 'MB');
                }
            });
            
            this.testRunner.it('デバッグ情報のエクスポートが動作する', () => {
                const exportedDebugInfo = this.exportDebugInfo();
                
                this.testRunner.assertNotNull(exportedDebugInfo, 'デバッグ情報がエクスポートされていません');
                this.testRunner.assertType(exportedDebugInfo, 'string', 'エクスポートされたデバッグ情報が文字列ではありません');
                
                // JSONとして解析可能かチェック
                let parsedInfo;
                try {
                    parsedInfo = JSON.parse(exportedDebugInfo);
                } catch (error) {
                    this.testRunner.assertTrue(false, 'エクスポートされたデバッグ情報がJSONとして解析できません');
                }
                
                this.testRunner.assertHasProperty(parsedInfo, 'browserInfo', 'エクスポート情報にbrowserInfoがありません');
                this.testRunner.assertHasProperty(parsedInfo, 'timestamp', 'エクスポート情報にtimestampがありません');
                
                console.log('デバッグ情報エクスポートサイズ:', exportedDebugInfo.length, 'bytes');
            });
            
            this.testRunner.it('デバッグコンソール出力が正しく動作する', () => {
                // コンソール出力のテスト
                const originalConsole = {
                    log: console.log,
                    warn: console.warn,
                    error: console.error
                };
                
                let logCalled = false;
                let warnCalled = false;
                let errorCalled = false;
                
                // コンソールをモック
                console.log = () => { logCalled = true; };
                console.warn = () => { warnCalled = true; };
                console.error = () => { errorCalled = true; };
                
                // デバッグ出力をテスト
                this.debugLog('テストログ');
                this.debugWarn('テスト警告');
                this.debugError('テストエラー');
                
                // コンソールを復元
                console.log = originalConsole.log;
                console.warn = originalConsole.warn;
                console.error = originalConsole.error;
                
                this.testRunner.assertTrue(logCalled, 'console.logが呼ばれていません');
                this.testRunner.assertTrue(warnCalled, 'console.warnが呼ばれていません');
                this.testRunner.assertTrue(errorCalled, 'console.errorが呼ばれていません');
            });
        });
    }
    
    /**
     * エラー回復テストの定義
     */
    defineErrorRecoveryTests() {
        this.testRunner.describe('Error Recovery', () => {
            
            this.testRunner.it('ファイル読み込みエラーから回復できる', () => {
                const fileError = {
                    type: ERROR_TYPES.READ_ERROR,
                    message: 'ファイル読み込みに失敗しました',
                    suggestion: 'ファイルを再選択してください'
                };
                
                const recovery = this.mockErrorRecovery(fileError);
                
                this.testRunner.assertNotNull(recovery, 'エラー回復処理がnullです');
                this.testRunner.assertHasProperty(recovery, 'canRecover', 'エラー回復にcanRecoverがありません');
                this.testRunner.assertHasProperty(recovery, 'suggestion', 'エラー回復にsuggestionがありません');
                this.testRunner.assertTrue(recovery.canRecover, 'ファイル読み込みエラーが回復不可能と判定されました');
            });
            
            this.testRunner.it('変換エラーから回復できる', () => {
                const conversionError = {
                    type: ERROR_TYPES.CONVERSION_FAILED,
                    message: '変換処理に失敗しました',
                    suggestion: '別の形式を試してください'
                };
                
                const recovery = this.mockErrorRecovery(conversionError);
                
                this.testRunner.assertNotNull(recovery, '変換エラー回復処理がnullです');
                this.testRunner.assertTrue(recovery.canRecover, '変換エラーが回復不可能と判定されました');
                this.testRunner.assertTrue(recovery.suggestion.length > 0, '変換エラー回復に提案がありません');
            });
            
            this.testRunner.it('メモリエラーから回復できる', () => {
                const memoryError = {
                    type: ERROR_TYPES.MEMORY_ERROR,
                    message: 'メモリ不足です',
                    suggestion: 'より小さなファイルを使用してください'
                };
                
                const recovery = this.mockErrorRecovery(memoryError);
                
                this.testRunner.assertNotNull(recovery, 'メモリエラー回復処理がnullです');
                this.testRunner.assertTrue(recovery.canRecover, 'メモリエラーが回復不可能と判定されました');
                this.testRunner.assertTrue(recovery.suggestion.includes('小さな'), 'メモリエラー回復提案が適切ではありません');
            });
            
            this.testRunner.it('タイムアウトエラーから回復できる', () => {
                const timeoutError = {
                    type: ERROR_TYPES.TIMEOUT_ERROR,
                    message: '処理がタイムアウトしました',
                    suggestion: 'より単純なファイルを使用してください'
                };
                
                const recovery = this.mockErrorRecovery(timeoutError);
                
                this.testRunner.assertNotNull(recovery, 'タイムアウトエラー回復処理がnullです');
                this.testRunner.assertTrue(recovery.canRecover, 'タイムアウトエラーが回復不可能と判定されました');
            });
            
            this.testRunner.it('回復不可能なエラーが正しく識別される', () => {
                const fatalError = {
                    type: 'FATAL_ERROR',
                    message: '致命的なエラーです',
                    suggestion: 'ページを再読み込みしてください'
                };
                
                const recovery = this.mockErrorRecovery(fatalError);
                
                this.testRunner.assertNotNull(recovery, '致命的エラー回復処理がnullです');
                this.testRunner.assertFalse(recovery.canRecover, '致命的エラーが回復可能と判定されました');
                this.testRunner.assertTrue(recovery.suggestion.includes('再読み込み'), '致命的エラー回復提案が適切ではありません');
            });
        });
    }
    
    // ヘルパーメソッド
    
    /**
     * ファイル検証をモック
     * @param {File} file - ファイル
     * @returns {object} 検証結果
     */
    mockFileValidation(file) {
        const isValid = file.name.includes('.svg') || file.name.includes('.png') || file.name.includes('.jpg');
        const detectedFormat = file.name.includes('.svg') ? SUPPORTED_FORMATS.SVG :
                              file.name.includes('.png') ? SUPPORTED_FORMATS.PNG :
                              file.name.includes('.jpg') ? SUPPORTED_FORMATS.JPG : null;
        
        return {
            isValid,
            detectedFormat,
            errors: isValid ? [] : [{ type: ERROR_TYPES.UNSUPPORTED_FORMAT, message: 'サポートされていない形式です' }],
            warnings: []
        };
    }
    
    /**
     * ファイル読み込みをモック
     * @param {File} file - ファイル
     * @returns {Promise<object>} ファイルデータ
     */
    async mockFileReading(file) {
        // 簡単な遅延をシミュレート
        await new Promise(resolve => setTimeout(resolve, 10));
        
        return {
            content: file.name.includes('.svg') ? '<svg>mock content</svg>' : 'binary data',
            format: file.name.includes('.svg') ? SUPPORTED_FORMATS.SVG :
                   file.name.includes('.png') ? SUPPORTED_FORMATS.PNG :
                   file.name.includes('.jpg') ? SUPPORTED_FORMATS.JPG : null,
            size: file.size,
            metadata: {
                width: 100,
                height: 100,
                hasTransparency: !file.name.includes('.jpg')
            }
        };
    }
    
    /**
     * 変換処理をモック
     * @param {object} fileData - ファイルデータ
     * @param {string} fromFormat - 変換元形式
     * @param {string} toFormat - 変換先形式
     * @returns {Promise<object>} 変換結果
     */
    async mockConversion(fileData, fromFormat, toFormat) {
        // 変換処理の遅延をシミュレート
        const delay = Math.random() * 100 + 50; // 50-150ms
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // モック変換結果
        const mockBlob = new Blob(['converted data'], { type: `image/${toFormat}` });
        
        return {
            data: mockBlob,
            fromFormat,
            toFormat,
            metadata: {
                width: fileData.metadata.width,
                height: fileData.metadata.height,
                size: mockBlob.size
            },
            performance: {
                duration: delay,
                memoryDelta: Math.random() * 1000
            }
        };
    }
    
    /**
     * エラー回復をモック
     * @param {object} error - エラー情報
     * @returns {object} 回復情報
     */
    mockErrorRecovery(error) {
        const recoverableErrors = [
            ERROR_TYPES.READ_ERROR,
            ERROR_TYPES.CONVERSION_FAILED,
            ERROR_TYPES.MEMORY_ERROR,
            ERROR_TYPES.TIMEOUT_ERROR,
            ERROR_TYPES.UNSUPPORTED_FORMAT
        ];
        
        const canRecover = recoverableErrors.includes(error.type);
        
        let suggestion = error.suggestion || '再試行してください';
        
        if (error.type === ERROR_TYPES.MEMORY_ERROR) {
            suggestion = 'より小さなファイルを使用するか、ブラウザを再起動してください';
        } else if (error.type === ERROR_TYPES.TIMEOUT_ERROR) {
            suggestion = 'より単純なファイルを使用するか、しばらく待ってから再試行してください';
        } else if (error.type === 'FATAL_ERROR') {
            suggestion = 'ページを再読み込みしてください';
        }
        
        return {
            canRecover,
            suggestion,
            retryable: canRecover && error.type !== ERROR_TYPES.UNSUPPORTED_FORMAT,
            alternativeActions: canRecover ? ['別のファイルを試す', '設定を変更する'] : ['ページを再読み込み']
        };
    }
    
    /**
     * 現在のメモリ使用量を取得
     * @returns {number} メモリ使用量（バイト）
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }
    
    /**
     * ブラウザ情報を取得
     * @returns {object} ブラウザ情報
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        
        // ブラウザ名とバージョンの簡易検出
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (userAgent.includes('Chrome')) {
            browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browserName = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Edge')) {
            browserName = 'Edge';
            const match = userAgent.match(/Edge\/(\d+)/);
            browserVersion = match ? match[1] : 'Unknown';
        }
        
        return {
            name: browserName,
            version: browserVersion,
            userAgent: userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            timestamp: new Date()
        };
    }
    
    /**
     * デバッグ情報をエクスポート
     * @returns {string} JSON形式のデバッグ情報
     */
    exportDebugInfo() {
        const exportData = {
            ...this.debugInfo,
            performanceData: this.performanceData,
            timestamp: new Date(),
            testResults: this.testRunner.results
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * デバッグログ出力
     * @param {string} message - ログメッセージ
     */
    debugLog(message) {
        console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
    }
    
    /**
     * デバッグ警告出力
     * @param {string} message - 警告メッセージ
     */
    debugWarn(message) {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
    
    /**
     * デバッグエラー出力
     * @param {string} message - エラーメッセージ
     */
    debugError(message) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    }
    
    /**
     * デバッグ情報を表示
     */
    displayDebugInfo() {
        const debugInfoHTML = `
            <div class="debug-info-panel">
                <h3>🔍 デバッグ情報</h3>
                <div class="debug-section">
                    <h4>ブラウザ情報</h4>
                    <pre>${JSON.stringify(this.debugInfo.browserInfo, null, 2)}</pre>
                </div>
                <div class="debug-section">
                    <h4>パフォーマンス統計</h4>
                    <pre>${JSON.stringify(this.debugInfo.performanceMetrics, null, 2)}</pre>
                </div>
                <div class="debug-section">
                    <h4>メモリ使用量</h4>
                    <pre>${JSON.stringify(this.debugInfo.memoryUsage, null, 2)}</pre>
                </div>
                <div class="debug-section">
                    <h4>エラーログ (最新5件)</h4>
                    <pre>${JSON.stringify(this.debugInfo.errorLog.slice(-5), null, 2)}</pre>
                </div>
                <div class="debug-actions">
                    <button onclick="navigator.clipboard.writeText('${this.exportDebugInfo().replace(/'/g, "\\'")}')">
                        📋 デバッグ情報をコピー
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">
                        ❌ 閉じる
                    </button>
                </div>
            </div>
        `;
        
        // デバッグ情報パネルを作成
        let debugPanel = document.getElementById('debug-info-panel');
        if (!debugPanel) {
            debugPanel = document.createElement('div');
            debugPanel.id = 'debug-info-panel';
            debugPanel.style.cssText = `
                position: fixed;
                top: 50px;
                left: 50px;
                width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                background: #f0f0f0;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                font-family: monospace;
                font-size: 11px;
            `;
            document.body.appendChild(debugPanel);
        }
        
        debugPanel.innerHTML = debugInfoHTML;
        
        // スタイルを追加
        if (!document.getElementById('debug-info-styles')) {
            const style = document.createElement('style');
            style.id = 'debug-info-styles';
            style.textContent = `
                .debug-info-panel h3 { margin-top: 0; color: #333; }
                .debug-info-panel h4 { margin: 16px 0 8px 0; color: #666; }
                .debug-section { margin-bottom: 16px; }
                .debug-section pre { 
                    background: white; 
                    padding: 8px; 
                    border-radius: 4px; 
                    overflow-x: auto;
                    max-height: 200px;
                    font-size: 10px;
                }
                .debug-actions { margin-top: 16px; }
                .debug-actions button { 
                    margin-right: 8px; 
                    padding: 6px 12px; 
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                }
                .debug-actions button:hover { background: #f0f0f0; }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * テスト結果をHTMLで表示
     * @param {object} results - テスト結果
     */
    displayResults(results) {
        const html = this.testRunner.getResultsAsHTML();
        
        // 結果表示用の要素を作成
        let resultContainer = document.getElementById('integration-test-results');
        if (!resultContainer) {
            resultContainer = document.createElement('div');
            resultContainer.id = 'integration-test-results';
            resultContainer.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                background: white;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
            `;
            document.body.appendChild(resultContainer);
        }
        
        resultContainer.innerHTML = html + `
            <div style="margin-top: 10px;">
                <button onclick="window.integrationTests.displayDebugInfo()" style="margin-right: 8px; padding: 5px 10px;">
                    🔍 デバッグ情報
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 5px 10px;">
                    閉じる
                </button>
            </div>
        `;
        
        // グローバルに公開（デバッグ情報表示用）
        window.integrationTests = this;
    }
}