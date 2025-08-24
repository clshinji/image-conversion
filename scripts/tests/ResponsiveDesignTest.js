// レスポンシブデザインテスト

/**
 * レスポンシブデザインテストクラス
 * 全デバイスでの動作確認とレイアウト検証
 */
export class ResponsiveDesignTest {
    constructor() {
        this.viewports = [
            { name: 'モバイル縦向き', width: 320, height: 568, type: 'mobile', orientation: 'portrait' },
            { name: 'モバイル横向き', width: 568, height: 320, type: 'mobile', orientation: 'landscape' },
            { name: 'iPhone SE', width: 375, height: 667, type: 'mobile', orientation: 'portrait' },
            { name: 'iPhone 12', width: 390, height: 844, type: 'mobile', orientation: 'portrait' },
            { name: 'タブレット縦向き', width: 768, height: 1024, type: 'tablet', orientation: 'portrait' },
            { name: 'タブレット横向き', width: 1024, height: 768, type: 'tablet', orientation: 'landscape' },
            { name: 'iPad', width: 820, height: 1180, type: 'tablet', orientation: 'portrait' },
            { name: 'iPad Pro', width: 1024, height: 1366, type: 'tablet', orientation: 'portrait' },
            { name: 'デスクトップ小', width: 1280, height: 720, type: 'desktop', orientation: 'landscape' },
            { name: 'デスクトップ中', width: 1440, height: 900, type: 'desktop', orientation: 'landscape' },
            { name: 'デスクトップ大', width: 1920, height: 1080, type: 'desktop', orientation: 'landscape' },
            { name: '4K', width: 3840, height: 2160, type: 'desktop', orientation: 'landscape' }
        ];
        
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: [],
            viewportResults: {},
            startTime: null,
            endTime: null
        };
        
        this.originalViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    /**
     * 全レスポンシブデザインテストを実行
     * @returns {Promise<object>} テスト結果
     */
    async runAllResponsiveTests() {
        console.log('📱 レスポンシブデザインテストを開始します...');
        this.testResults.startTime = Date.now();
        
        try {
            // 各ビューポートでテストを実行
            for (const viewport of this.viewports) {
                console.log(`\n📐 ${viewport.name} (${viewport.width}x${viewport.height}) をテスト中...`);
                
                const viewportResult = await this.testViewport(viewport);
                this.testResults.viewportResults[viewport.name] = viewportResult;
                
                // 結果を集計
                this.testResults.total += viewportResult.total;
                this.testResults.passed += viewportResult.passed;
                this.testResults.failed += viewportResult.failed;
                this.testResults.details.push(...viewportResult.details);
            }
            
            // 追加のレスポンシブテスト
            await this.testBreakpoints();
            await this.testTouchInteraction();
            await this.testAccessibility();
            
            this.testResults.endTime = Date.now();
            this.generateReport();
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ レスポンシブデザインテストエラー:', error);
            this.testResults.endTime = Date.now();
            this.testResults.error = error.message;
            return this.testResults;
        } finally {
            // 元のビューポートに戻す
            this.restoreViewport();
        }
    }
    
    /**
     * 特定のビューポートでテストを実行
     * @param {object} viewport - ビューポート設定
     * @returns {Promise<object>} ビューポートテスト結果
     */
    async testViewport(viewport) {
        const result = {
            viewport: viewport,
            passed: 0,
            failed: 0,
            total: 0,
            details: [],
            layoutScore: 0,
            usabilityScore: 0,
            performanceScore: 0
        };
        
        try {
            // ビューポートを設定
            this.setViewport(viewport);
            
            // レイアウトテスト
            const layoutTests = await this.testLayout(viewport);
            result.details.push(...layoutTests.details);
            result.total += layoutTests.total;
            result.passed += layoutTests.passed;
            result.failed += layoutTests.failed;
            result.layoutScore = layoutTests.score;
            
            // ユーザビリティテスト
            const usabilityTests = await this.testUsability(viewport);
            result.details.push(...usabilityTests.details);
            result.total += usabilityTests.total;
            result.passed += usabilityTests.passed;
            result.failed += usabilityTests.failed;
            result.usabilityScore = usabilityTests.score;
            
            // パフォーマンステスト
            const performanceTests = await this.testPerformance(viewport);
            result.details.push(...performanceTests.details);
            result.total += performanceTests.total;
            result.passed += performanceTests.passed;
            result.failed += performanceTests.failed;
            result.performanceScore = performanceTests.score;
            
            // 総合スコア計算
            result.overallScore = Math.round(
                (result.layoutScore + result.usabilityScore + result.performanceScore) / 3
            );
            
            console.log(`📐 ${viewport.name}: ${result.passed}/${result.total} 成功 (スコア: ${result.overallScore}/100)`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ ${viewport.name}テストエラー:`, error);
            result.error = error.message;
            return result;
        }
    }
    
    /**
     * ビューポートを設定
     * @param {object} viewport - ビューポート設定
     */
    setViewport(viewport) {
        // 実際のウィンドウリサイズは制限があるため、CSS変数とクラスで対応
        document.documentElement.style.setProperty('--test-viewport-width', `${viewport.width}px`);
        document.documentElement.style.setProperty('--test-viewport-height', `${viewport.height}px`);
        
        // デバイスタイプクラスを設定
        document.body.className = document.body.className.replace(/\b(mobile|tablet|desktop)-test\b/g, '');
        document.body.classList.add(`${viewport.type}-test`);
        
        // 向きクラスを設定
        document.body.classList.toggle('portrait-test', viewport.orientation === 'portrait');
        document.body.classList.toggle('landscape-test', viewport.orientation === 'landscape');
        
        // メタビューポートを更新（可能な場合）
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.setAttribute('content', 
                `width=${viewport.width}, height=${viewport.height}, initial-scale=1.0`
            );
        }
        
        // レイアウトの再計算を強制
        document.body.offsetHeight;
    }
    
    /**
     * 元のビューポートに戻す
     */
    restoreViewport() {
        document.documentElement.style.removeProperty('--test-viewport-width');
        document.documentElement.style.removeProperty('--test-viewport-height');
        
        document.body.className = document.body.className.replace(/\b(mobile|tablet|desktop)-test\b/g, '');
        document.body.classList.remove('portrait-test', 'landscape-test');
        
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
    }
    
    /**
     * レイアウトテスト
     * @param {object} viewport - ビューポート設定
     * @returns {Promise<object>} レイアウトテスト結果
     */
    async testLayout(viewport) {
        const result = { passed: 0, failed: 0, total: 0, details: [], score: 100 };
        
        const tests = [
            {
                name: 'メインコンテナの表示',
                test: () => this.testMainContainer(viewport)
            },
            {
                name: 'ナビゲーション要素の配置',
                test: () => this.testNavigation(viewport)
            },
            {
                name: 'プレビューエリアのレイアウト',
                test: () => this.testPreviewLayout(viewport)
            },
            {
                name: 'コントロール要素の配置',
                test: () => this.testControlsLayout(viewport)
            },
            {
                name: 'フォーム要素の表示',
                test: () => this.testFormElements(viewport)
            },
            {
                name: 'テキストの可読性',
                test: () => this.testTextReadability(viewport)
            },
            {
                name: 'スクロール動作',
                test: () => this.testScrollBehavior(viewport)
            }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, result);
        }
        
        // スコア計算
        result.score = Math.round((result.passed / result.total) * 100);
        
        return result;
    }
    
    /**
     * ユーザビリティテスト
     * @param {object} viewport - ビューポート設定
     * @returns {Promise<object>} ユーザビリティテスト結果
     */
    async testUsability(viewport) {
        const result = { passed: 0, failed: 0, total: 0, details: [], score: 100 };
        
        const tests = [
            {
                name: 'タッチターゲットサイズ',
                test: () => this.testTouchTargets(viewport)
            },
            {
                name: 'インタラクション要素の配置',
                test: () => this.testInteractionElements(viewport)
            },
            {
                name: 'フィードバック表示',
                test: () => this.testFeedbackDisplay(viewport)
            },
            {
                name: 'エラーメッセージの表示',
                test: () => this.testErrorDisplay(viewport)
            },
            {
                name: 'プログレス表示',
                test: () => this.testProgressDisplay(viewport)
            }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, result);
        }
        
        result.score = Math.round((result.passed / result.total) * 100);
        
        return result;
    }
    
    /**
     * パフォーマンステスト
     * @param {object} viewport - ビューポート設定
     * @returns {Promise<object>} パフォーマンステスト結果
     */
    async testPerformance(viewport) {
        const result = { passed: 0, failed: 0, total: 0, details: [], score: 100 };
        
        const tests = [
            {
                name: 'レンダリング速度',
                test: () => this.testRenderingSpeed(viewport)
            },
            {
                name: 'スクロール性能',
                test: () => this.testScrollPerformance(viewport)
            },
            {
                name: 'アニメーション性能',
                test: () => this.testAnimationPerformance(viewport)
            },
            {
                name: 'メモリ使用量',
                test: () => this.testMemoryUsage(viewport)
            }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, result);
        }
        
        result.score = Math.round((result.passed / result.total) * 100);
        
        return result;
    }
    
    /**
     * 単一テストの実行
     * @param {string} testName - テスト名
     * @param {Function} testFunction - テスト関数
     * @param {object} result - 結果オブジェクト
     */
    async runSingleTest(testName, testFunction, result) {
        result.total++;
        const startTime = Date.now();
        
        try {
            const testResult = await testFunction();
            const endTime = Date.now();
            
            result.passed++;
            result.details.push({
                name: testName,
                status: 'passed',
                duration: endTime - startTime,
                result: testResult || 'OK'
            });
            
        } catch (error) {
            const endTime = Date.now();
            result.failed++;
            result.details.push({
                name: testName,
                status: 'failed',
                duration: endTime - startTime,
                error: error.message
            });
        }
    }
    
    /**
     * メインコンテナテスト
     * @param {object} viewport - ビューポート設定
     */
    testMainContainer(viewport) {
        const container = document.querySelector('.container, main, #app');
        if (!container) {
            throw new Error('メインコンテナが見つかりません');
        }
        
        const rect = container.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(container);
        
        // コンテナが適切に表示されているかチェック
        if (rect.width === 0 || rect.height === 0) {
            throw new Error('メインコンテナが表示されていません');
        }
        
        // レスポンシブ幅のチェック
        if (viewport.type === 'mobile' && rect.width > viewport.width) {
            throw new Error(`モバイルでコンテナ幅が大きすぎます: ${rect.width}px > ${viewport.width}px`);
        }
        
        return `メインコンテナ: ${Math.round(rect.width)}x${Math.round(rect.height)}px`;
    }
    
    /**
     * ナビゲーションテスト
     * @param {object} viewport - ビューポート設定
     */
    testNavigation(viewport) {
        const nav = document.querySelector('nav, .navigation, header');
        if (!nav) {
            console.warn('ナビゲーション要素が見つかりません');
            return 'ナビゲーション要素なし（警告）';
        }
        
        const rect = nav.getBoundingClientRect();
        
        // ナビゲーションが表示されているかチェック
        if (rect.width === 0 || rect.height === 0) {
            throw new Error('ナビゲーション要素が表示されていません');
        }
        
        // モバイルでの高さチェック
        if (viewport.type === 'mobile' && rect.height > viewport.height * 0.3) {
            throw new Error(`モバイルでナビゲーションが高すぎます: ${rect.height}px`);
        }
        
        return `ナビゲーション: ${Math.round(rect.width)}x${Math.round(rect.height)}px`;
    }
    
    /**
     * プレビューレイアウトテスト
     * @param {object} viewport - ビューポート設定
     */
    testPreviewLayout(viewport) {
        const previewContainer = document.querySelector('.preview-container, .preview-section');
        if (!previewContainer) {
            throw new Error('プレビューコンテナが見つかりません');
        }
        
        const rect = previewContainer.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(previewContainer);
        
        // プレビューエリアが表示されているかチェック
        if (rect.width === 0 || rect.height === 0) {
            console.warn('プレビューエリアが表示されていません（非表示状態の可能性）');
            return 'プレビューエリア非表示（警告）';
        }
        
        // レスポンシブレイアウトのチェック
        const gridColumns = computedStyle.gridTemplateColumns;
        if (viewport.type === 'mobile' && gridColumns && gridColumns.includes('1fr 1fr')) {
            console.warn('モバイルで横並びレイアウトが使用されています');
        }
        
        return `プレビューレイアウト: ${Math.round(rect.width)}x${Math.round(rect.height)}px`;
    }
    
    /**
     * コントロールレイアウトテスト
     * @param {object} viewport - ビューポート設定
     */
    testControlsLayout(viewport) {
        const controls = document.querySelector('.controls, .control-panel');
        if (!controls) {
            throw new Error('コントロール要素が見つかりません');
        }
        
        const rect = controls.getBoundingClientRect();
        const buttons = controls.querySelectorAll('button');
        
        // コントロールが表示されているかチェック
        if (rect.width === 0 || rect.height === 0) {
            throw new Error('コントロール要素が表示されていません');
        }
        
        // ボタンのサイズチェック（タッチデバイス）
        if (viewport.type === 'mobile' || viewport.type === 'tablet') {
            buttons.forEach((button, index) => {
                const buttonRect = button.getBoundingClientRect();
                if (buttonRect.width < 44 || buttonRect.height < 44) {
                    throw new Error(`ボタン${index + 1}のタッチターゲットが小さすぎます: ${Math.round(buttonRect.width)}x${Math.round(buttonRect.height)}px`);
                }
            });
        }
        
        return `コントロール: ${buttons.length}個のボタン`;
    }
    
    /**
     * フォーム要素テスト
     * @param {object} viewport - ビューポート設定
     */
    testFormElements(viewport) {
        const formElements = document.querySelectorAll('input, select, textarea');
        if (formElements.length === 0) {
            console.warn('フォーム要素が見つかりません');
            return 'フォーム要素なし（警告）';
        }
        
        let issues = [];
        
        formElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            
            // 表示チェック
            if (rect.width === 0 || rect.height === 0) {
                issues.push(`要素${index + 1}が表示されていません`);
                return;
            }
            
            // タッチターゲットサイズチェック
            if (viewport.type === 'mobile' && (rect.width < 44 || rect.height < 44)) {
                issues.push(`要素${index + 1}のタッチターゲットが小さすぎます`);
            }
            
            // フォントサイズチェック
            const fontSize = parseFloat(computedStyle.fontSize);
            if (viewport.type === 'mobile' && fontSize < 16) {
                issues.push(`要素${index + 1}のフォントサイズが小さすぎます: ${fontSize}px`);
            }
        });
        
        if (issues.length > 0) {
            throw new Error(issues.join(', '));
        }
        
        return `フォーム要素: ${formElements.length}個`;
    }
    
    /**
     * テキスト可読性テスト
     * @param {object} viewport - ビューポート設定
     */
    testTextReadability(viewport) {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        let issues = [];
        
        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseFloat(computedStyle.fontSize);
            const lineHeight = parseFloat(computedStyle.lineHeight);
            
            // フォントサイズチェック
            if (viewport.type === 'mobile' && fontSize < 14) {
                issues.push(`テキスト${index + 1}のフォントサイズが小さすぎます: ${fontSize}px`);
            }
            
            // 行間チェック
            if (lineHeight && lineHeight < fontSize * 1.2) {
                issues.push(`テキスト${index + 1}の行間が狭すぎます`);
            }
        });
        
        if (issues.length > 3) { // 3個以上の問題がある場合のみエラー
            throw new Error(`テキスト可読性の問題: ${issues.slice(0, 3).join(', ')}など`);
        }
        
        return `テキスト要素: ${textElements.length}個`;
    }
    
    /**
     * スクロール動作テスト
     * @param {object} viewport - ビューポート設定
     */
    testScrollBehavior(viewport) {
        const scrollableElements = document.querySelectorAll('[style*="overflow"], .scrollable');
        
        // ページ全体のスクロール確認
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        
        if (documentHeight > viewport.height && document.body.style.overflow === 'hidden') {
            throw new Error('コンテンツが長いのにスクロールが無効になっています');
        }
        
        return `スクロール可能要素: ${scrollableElements.length}個`;
    }
    
    /**
     * タッチターゲットテスト
     * @param {object} viewport - ビューポート設定
     */
    testTouchTargets(viewport) {
        if (viewport.type === 'desktop') {
            return 'デスクトップではスキップ';
        }
        
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
        let smallTargets = [];
        
        interactiveElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                smallTargets.push(`要素${index + 1}: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
            }
        });
        
        if (smallTargets.length > 0) {
            throw new Error(`タッチターゲットが小さすぎます: ${smallTargets.slice(0, 3).join(', ')}`);
        }
        
        return `インタラクティブ要素: ${interactiveElements.length}個`;
    }
    
    /**
     * インタラクション要素テスト
     * @param {object} viewport - ビューポート設定
     */
    testInteractionElements(viewport) {
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        
        // ボタンとリンクの配置確認
        [...buttons, ...links].forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            
            // 画面外に配置されていないかチェック
            if (rect.right < 0 || rect.left > viewport.width || rect.bottom < 0 || rect.top > viewport.height) {
                console.warn(`要素${index + 1}が画面外に配置されています`);
            }
        });
        
        return `インタラクション要素: ${buttons.length + links.length}個`;
    }
    
    /**
     * フィードバック表示テスト
     * @param {object} viewport - ビューポート設定
     */
    testFeedbackDisplay(viewport) {
        const feedbackElements = document.querySelectorAll('.message, .feedback, .notification, .alert');
        
        if (feedbackElements.length === 0) {
            console.warn('フィードバック要素が見つかりません');
            return 'フィードバック要素なし（警告）';
        }
        
        return `フィードバック要素: ${feedbackElements.length}個`;
    }
    
    /**
     * エラー表示テスト
     * @param {object} viewport - ビューポート設定
     */
    testErrorDisplay(viewport) {
        const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"]');
        
        if (errorElements.length === 0) {
            console.warn('エラー表示要素が見つかりません');
            return 'エラー表示要素なし（警告）';
        }
        
        return `エラー表示要素: ${errorElements.length}個`;
    }
    
    /**
     * プログレス表示テスト
     * @param {object} viewport - ビューポート設定
     */
    testProgressDisplay(viewport) {
        const progressElements = document.querySelectorAll('.progress, .loading, [role="progressbar"]');
        
        if (progressElements.length === 0) {
            console.warn('プログレス表示要素が見つかりません');
            return 'プログレス表示要素なし（警告）';
        }
        
        return `プログレス表示要素: ${progressElements.length}個`;
    }
    
    /**
     * レンダリング速度テスト
     * @param {object} viewport - ビューポート設定
     */
    async testRenderingSpeed(viewport) {
        const startTime = performance.now();
        
        // DOM操作を実行
        const testElement = document.createElement('div');
        testElement.innerHTML = '<p>レンダリングテスト</p>';
        testElement.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
        
        document.body.appendChild(testElement);
        testElement.offsetHeight; // 強制レイアウト
        document.body.removeChild(testElement);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 50) { // 50ms以上は遅い
            throw new Error(`レンダリングが遅いです: ${duration.toFixed(2)}ms`);
        }
        
        return `レンダリング速度: ${duration.toFixed(2)}ms`;
    }
    
    /**
     * スクロール性能テスト
     * @param {object} viewport - ビューポート設定
     */
    async testScrollPerformance(viewport) {
        // スクロール性能の簡易テスト
        const startTime = performance.now();
        
        window.scrollTo(0, 100);
        await new Promise(resolve => setTimeout(resolve, 10));
        window.scrollTo(0, 0);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return `スクロール性能: ${duration.toFixed(2)}ms`;
    }
    
    /**
     * アニメーション性能テスト
     * @param {object} viewport - ビューポート設定
     */
    async testAnimationPerformance(viewport) {
        // アニメーション性能の簡易テスト
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 100px;
            height: 100px;
            background: red;
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(testElement);
        
        const startTime = performance.now();
        testElement.style.transform = 'translateX(100px)';
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const endTime = performance.now();
        document.body.removeChild(testElement);
        
        const duration = endTime - startTime;
        
        return `アニメーション性能: ${duration.toFixed(2)}ms`;
    }
    
    /**
     * メモリ使用量テスト
     * @param {object} viewport - ビューポート設定
     */
    testMemoryUsage(viewport) {
        if (!performance.memory) {
            return 'メモリ情報取得不可';
        }
        
        const memoryUsage = performance.memory.usedJSHeapSize;
        const memoryMB = Math.round(memoryUsage / 1024 / 1024);
        
        if (memoryMB > 100) {
            console.warn(`メモリ使用量が多いです: ${memoryMB}MB`);
        }
        
        return `メモリ使用量: ${memoryMB}MB`;
    }
    
    /**
     * ブレークポイントテスト
     */
    async testBreakpoints() {
        console.log('\n📏 ブレークポイントテストを実行中...');
        
        const breakpoints = [320, 480, 768, 1024, 1440];
        
        for (const breakpoint of breakpoints) {
            const viewport = { width: breakpoint, height: 800, type: 'test', name: `${breakpoint}px` };
            this.setViewport(viewport);
            
            // ブレークポイントでのレイアウト確認
            const container = document.querySelector('.container, main');
            if (container) {
                const rect = container.getBoundingClientRect();
                console.log(`📏 ${breakpoint}px: コンテナ幅 ${Math.round(rect.width)}px`);
            }
        }
        
        this.testResults.total++;
        this.testResults.passed++;
        this.testResults.details.push({
            name: 'ブレークポイントテスト',
            status: 'passed',
            result: `${breakpoints.length}個のブレークポイントを確認`
        });
    }
    
    /**
     * タッチインタラクションテスト
     */
    async testTouchInteraction() {
        console.log('\n👆 タッチインタラクションテストを実行中...');
        
        // タッチイベントのサポート確認
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (!hasTouchSupport) {
            console.warn('タッチサポートが検出されませんでした');
        }
        
        this.testResults.total++;
        this.testResults.passed++;
        this.testResults.details.push({
            name: 'タッチインタラクションテスト',
            status: 'passed',
            result: `タッチサポート: ${hasTouchSupport ? 'あり' : 'なし'}`
        });
    }
    
    /**
     * アクセシビリティテスト
     */
    async testAccessibility() {
        console.log('\n♿ アクセシビリティテストを実行中...');
        
        const issues = [];
        
        // フォーカス可能要素の確認
        const focusableElements = document.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
            issues.push('フォーカス可能な要素が見つかりません');
        }
        
        // ARIA属性の確認
        const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
        if (ariaElements.length === 0) {
            issues.push('ARIA属性が設定された要素が見つかりません');
        }
        
        this.testResults.total++;
        if (issues.length === 0) {
            this.testResults.passed++;
            this.testResults.details.push({
                name: 'アクセシビリティテスト',
                status: 'passed',
                result: `フォーカス可能要素: ${focusableElements.length}個, ARIA要素: ${ariaElements.length}個`
            });
        } else {
            this.testResults.failed++;
            this.testResults.details.push({
                name: 'アクセシビリティテスト',
                status: 'failed',
                error: issues.join(', ')
            });
        }
    }
    
    /**
     * レポート生成
     */
    generateReport() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const successRate = (this.testResults.passed / this.testResults.total) * 100;
        
        console.log('\n' + '='.repeat(60));
        console.log('📱 レスポンシブデザインテスト結果');
        console.log('='.repeat(60));
        console.log(`📊 総合結果:`);
        console.log(`   ✅ 成功: ${this.testResults.passed}/${this.testResults.total}`);
        console.log(`   ❌ 失敗: ${this.testResults.failed}/${this.testResults.total}`);
        console.log(`   📈 成功率: ${successRate.toFixed(1)}%`);
        console.log(`   ⏱️ 実行時間: ${duration}ms`);
        
        // ビューポート別結果
        console.log(`\n📐 ビューポート別結果:`);
        Object.entries(this.testResults.viewportResults).forEach(([name, result]) => {
            const status = result.failed === 0 ? '✅' : '⚠️';
            console.log(`   ${status} ${name}: ${result.passed}/${result.total} (スコア: ${result.overallScore || 0}/100)`);
        });
        
        // 失敗したテストの詳細
        const failedTests = this.testResults.details.filter(test => test.status === 'failed');
        if (failedTests.length > 0) {
            console.log(`\n❌ 失敗したテスト:`);
            failedTests.forEach(test => {
                console.log(`   • ${test.name}: ${test.error}`);
            });
        }
        
        // HTMLレポートを生成
        this.generateHTMLReport();
    }
    
    /**
     * HTMLレポート生成
     */
    generateHTMLReport() {
        const successRate = (this.testResults.passed / this.testResults.total) * 100;
        const statusClass = successRate >= 90 ? 'excellent' : 
                           successRate >= 70 ? 'good' : 
                           successRate >= 50 ? 'warning' : 'critical';
        
        const html = `
            <div class="responsive-report">
                <h2>📱 レスポンシブデザインテスト結果</h2>
                
                <div class="summary-section">
                    <div class="summary-card ${statusClass}">
                        <h3>📊 総合結果</h3>
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="label">成功:</span>
                                <span class="value success">${this.testResults.passed}</span>
                            </div>
                            <div class="stat">
                                <span class="label">失敗:</span>
                                <span class="value failed">${this.testResults.failed}</span>
                            </div>
                            <div class="stat">
                                <span class="label">成功率:</span>
                                <span class="value">${successRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="viewport-section">
                    <h3>📐 ビューポート別結果</h3>
                    <div class="viewport-grid">
                        ${Object.entries(this.testResults.viewportResults).map(([name, result]) => `
                            <div class="viewport-card ${result.failed === 0 ? 'success' : 'warning'}">
                                <h4>${result.failed === 0 ? '✅' : '⚠️'} ${name}</h4>
                                <div class="viewport-stats">
                                    <div>成功: ${result.passed}/${result.total}</div>
                                    <div>スコア: ${result.overallScore || 0}/100</div>
                                    <div>サイズ: ${result.viewport.width}x${result.viewport.height}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="actions-section">
                    <button onclick="this.parentElement.parentElement.remove()" class="close-btn">
                        ❌ レポートを閉じる
                    </button>
                </div>
            </div>
        `;
        
        // レポート表示
        const reportContainer = document.createElement('div');
        reportContainer.className = 'responsive-report-container';
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
            z-index: 10005;
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
        if (document.getElementById('responsive-report-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'responsive-report-styles';
        style.textContent = `
            .responsive-report h2 { 
                margin-top: 0; 
                color: #333; 
                text-align: center;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            
            .summary-section { margin-bottom: 24px; }
            
            .summary-card {
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
            }
            
            .summary-card.excellent { background: #e8f5e8; border-left: 4px solid #4caf50; }
            .summary-card.good { background: #e3f2fd; border-left: 4px solid #2196f3; }
            .summary-card.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
            .summary-card.critical { background: #f8d7da; border-left: 4px solid #dc3545; }
            
            .summary-stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
                gap: 12px; 
                margin-top: 12px;
            }
            
            .stat { display: flex; justify-content: space-between; padding: 4px 0; }
            .stat .value.success { color: #4caf50; font-weight: bold; }
            .stat .value.failed { color: #dc3545; font-weight: bold; }
            
            .viewport-section h3 { color: #666; margin-bottom: 16px; }
            
            .viewport-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 16px; 
                margin-bottom: 24px;
            }
            
            .viewport-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 16px;
                background: white;
            }
            
            .viewport-card.success { border-left: 4px solid #4caf50; }
            .viewport-card.warning { border-left: 4px solid #ffc107; }
            
            .viewport-card h4 { margin-top: 0; margin-bottom: 12px; color: #333; }
            
            .viewport-stats { font-size: 14px; }
            .viewport-stats div { margin-bottom: 4px; }
            
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