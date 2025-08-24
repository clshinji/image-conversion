// ユーザビリティ最適化テスト

/**
 * ユーザビリティ最適化テストクラス
 * UI/UXの最終調整とアクセシビリティ対応の確認
 */
export class UsabilityOptimizationTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: [],
            categories: {
                ui: { passed: 0, failed: 0, total: 0 },
                accessibility: { passed: 0, failed: 0, total: 0 },
                japanese: { passed: 0, failed: 0, total: 0 },
                feedback: { passed: 0, failed: 0, total: 0 }
            },
            startTime: null,
            endTime: null
        };
        
        this.optimizations = [];
        this.warnings = [];
    }
    
    /**
     * 全ユーザビリティテストを実行
     * @returns {Promise<object>} テスト結果
     */
    async runAllUsabilityTests() {
        console.log('🎨 ユーザビリティ最適化テストを開始します...');
        this.testResults.startTime = Date.now();
        
        try {
            // 1. UI/UX最終調整テスト
            await this.testUIUXOptimization();
            
            // 2. アクセシビリティ対応テスト
            await this.testAccessibilityCompliance();
            
            // 3. 多言語対応（日本語）テスト
            await this.testJapaneseLocalization();
            
            // 4. ユーザーフィードバック機能テスト
            await this.testUserFeedback();
            
            // 5. 最適化提案生成
            this.generateUsabilityOptimizations();
            
            this.testResults.endTime = Date.now();
            this.generateReport();
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ ユーザビリティテストエラー:', error);
            this.testResults.endTime = Date.now();
            this.testResults.error = error.message;
            return this.testResults;
        }
    }
    
    /**
     * UI/UX最終調整テスト
     */
    async testUIUXOptimization() {
        console.log('🎨 UI/UX最終調整テストを実行中...');
        
        const tests = [
            { name: 'ビジュアル階層の確認', test: () => this.testVisualHierarchy() },
            { name: 'カラーコントラストの確認', test: () => this.testColorContrast() },
            { name: 'タイポグラフィの確認', test: () => this.testTypography() },
            { name: 'レイアウト一貫性の確認', test: () => this.testLayoutConsistency() },
            { name: 'インタラクション要素の確認', test: () => this.testInteractionElements() },
            { name: 'ローディング状態の確認', test: () => this.testLoadingStates() },
            { name: 'エラー状態の確認', test: () => this.testErrorStates() },
            { name: 'アニメーション効果の確認', test: () => this.testAnimations() }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, 'ui');
        }
    }
    
    /**
     * アクセシビリティ対応テスト
     */
    async testAccessibilityCompliance() {
        console.log('♿ アクセシビリティ対応テストを実行中...');
        
        const tests = [
            { name: 'キーボードナビゲーション', test: () => this.testKeyboardNavigation() },
            { name: 'ARIA属性設定', test: () => this.testARIAAttributes() },
            { name: 'フォーカス管理', test: () => this.testFocusManagement() },
            { name: 'スクリーンリーダー対応', test: () => this.testScreenReaderSupport() },
            { name: 'セマンティックHTML', test: () => this.testSemanticHTML() },
            { name: 'カラーアクセシビリティ', test: () => this.testColorAccessibility() },
            { name: 'テキストサイズ調整', test: () => this.testTextScaling() },
            { name: 'モーション設定', test: () => this.testMotionPreferences() }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, 'accessibility');
        }
    }
    
    /**
     * 多言語対応（日本語）テスト
     */
    async testJapaneseLocalization() {
        console.log('🇯🇵 多言語対応（日本語）テストを実行中...');
        
        const tests = [
            { name: '日本語テキストの確認', test: () => this.testJapaneseText() },
            { name: '敬語使用の確認', test: () => this.testPoliteJapanese() },
            { name: '文字エンコーディング', test: () => this.testCharacterEncoding() },
            { name: 'フォント表示', test: () => this.testJapaneseFonts() },
            { name: '日付・時刻形式', test: () => this.testDateTimeFormat() },
            { name: 'エラーメッセージ', test: () => this.testJapaneseErrorMessages() }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, 'japanese');
        }
    }
    
    /**
     * ユーザーフィードバック機能テスト
     */
    async testUserFeedback() {
        console.log('💬 ユーザーフィードバック機能テストを実行中...');
        
        const tests = [
            { name: '成功メッセージ表示', test: () => this.testSuccessMessages() },
            { name: 'エラーメッセージ表示', test: () => this.testErrorMessages() },
            { name: '警告メッセージ表示', test: () => this.testWarningMessages() },
            { name: 'プログレス表示', test: () => this.testProgressIndicators() },
            { name: 'ツールチップ表示', test: () => this.testTooltips() },
            { name: 'ヘルプテキスト', test: () => this.testHelpText() }
        ];
        
        for (const testCase of tests) {
            await this.runSingleTest(testCase.name, testCase.test, 'feedback');
        }
    }
}    
    
/**
     * 単一テストの実行
     * @param {string} testName - テスト名
     * @param {Function} testFunction - テスト関数
     * @param {string} category - カテゴリ
     */
    async runSingleTest(testName, testFunction, category) {
        this.testResults.total++;
        this.testResults.categories[category].total++;
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const endTime = Date.now();
            
            this.testResults.passed++;
            this.testResults.categories[category].passed++;
            this.testResults.details.push({
                name: testName,
                category: category,
                status: 'passed',
                duration: endTime - startTime,
                result: result || 'OK'
            });
            
            console.log(`  ✅ ${testName} - 成功`);
            
        } catch (error) {
            const endTime = Date.now();
            this.testResults.failed++;
            this.testResults.categories[category].failed++;
            this.testResults.details.push({
                name: testName,
                category: category,
                status: 'failed',
                duration: endTime - startTime,
                error: error.message
            });
            
            console.log(`  ❌ ${testName} - 失敗: ${error.message}`);
        }
    }
    
    /**
     * ビジュアル階層テスト
     */
    testVisualHierarchy() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            throw new Error('見出し要素が見つかりません');
        }
        
        // 見出しの階層構造をチェック
        let previousLevel = 0;
        let hierarchyIssues = [];
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            if (index > 0 && level > previousLevel + 1) {
                hierarchyIssues.push(`見出し${index + 1}: H${previousLevel}からH${level}への飛び越し`);
            }
            previousLevel = level;
        });
        
        if (hierarchyIssues.length > 0) {
            this.warnings.push({
                type: 'visual-hierarchy',
                message: '見出し階層に問題があります',
                details: hierarchyIssues.slice(0, 3)
            });
        }
        
        return `見出し要素: ${headings.length}個`;
    }
    
    /**
     * カラーコントラストテスト
     */
    testColorContrast() {
        const textElements = document.querySelectorAll('p, span, div, button, a, label');
        let contrastIssues = [];
        
        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;
            
            // 基本的なコントラストチェック（簡易版）
            if (color === backgroundColor) {
                contrastIssues.push(`要素${index + 1}: 文字色と背景色が同じ`);
            }
            
            // 透明な背景色のチェック
            if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                // 親要素の背景色を確認する必要があるが、簡易版では警告のみ
                if (index < 5) { // 最初の5個のみチェック
                    console.warn(`要素${index + 1}: 透明な背景色が使用されています`);
                }
            }
        });
        
        if (contrastIssues.length > 0) {
            throw new Error(`コントラスト問題: ${contrastIssues.slice(0, 3).join(', ')}`);
        }
        
        return `テキスト要素: ${textElements.length}個をチェック`;
    }
    
    /**
     * タイポグラフィテスト
     */
    testTypography() {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        let typographyIssues = [];
        
        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseFloat(computedStyle.fontSize);
            const lineHeight = parseFloat(computedStyle.lineHeight);
            const fontFamily = computedStyle.fontFamily;
            
            // フォントサイズチェック
            if (fontSize < 12) {
                typographyIssues.push(`要素${index + 1}: フォントサイズが小さすぎます (${fontSize}px)`);
            }
            
            // 行間チェック
            if (lineHeight && lineHeight < fontSize * 1.2) {
                typographyIssues.push(`要素${index + 1}: 行間が狭すぎます`);
            }
            
            // フォントファミリーチェック
            if (!fontFamily || fontFamily === 'Times' || fontFamily === 'serif') {
                if (index < 3) { // 最初の3個のみチェック
                    console.warn(`要素${index + 1}: デフォルトフォントが使用されています`);
                }
            }
        });
        
        if (typographyIssues.length > 5) { // 5個以上の問題がある場合のみエラー
            throw new Error(`タイポグラフィ問題: ${typographyIssues.slice(0, 3).join(', ')}など`);
        }
        
        return `タイポグラフィ要素: ${textElements.length}個をチェック`;
    }
    
    /**
     * レイアウト一貫性テスト
     */
    testLayoutConsistency() {
        const containers = document.querySelectorAll('.container, .section, .card, .panel');
        let layoutIssues = [];
        
        // 余白の一貫性チェック
        const margins = [];
        const paddings = [];
        
        containers.forEach((container, index) => {
            const computedStyle = window.getComputedStyle(container);
            margins.push(parseFloat(computedStyle.marginTop));
            paddings.push(parseFloat(computedStyle.paddingTop));
        });
        
        // 余白の種類が多すぎる場合は警告
        const uniqueMargins = [...new Set(margins)];
        const uniquePaddings = [...new Set(paddings)];
        
        if (uniqueMargins.length > 5) {
            this.warnings.push({
                type: 'layout-consistency',
                message: `マージンの種類が多すぎます: ${uniqueMargins.length}種類`,
                suggestion: 'デザインシステムの導入を検討してください'
            });
        }
        
        if (uniquePaddings.length > 5) {
            this.warnings.push({
                type: 'layout-consistency',
                message: `パディングの種類が多すぎます: ${uniquePaddings.length}種類`,
                suggestion: 'デザインシステムの導入を検討してください'
            });
        }
        
        return `レイアウト要素: ${containers.length}個をチェック`;
    }
    
    /**
     * インタラクション要素テスト
     */
    testInteractionElements() {
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        const inputs = document.querySelectorAll('input, select, textarea');
        
        let interactionIssues = [];
        
        // ボタンのテスト
        buttons.forEach((button, index) => {
            const rect = button.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(button);
            
            // サイズチェック
            if (rect.width < 44 || rect.height < 44) {
                interactionIssues.push(`ボタン${index + 1}: タッチターゲットが小さすぎます`);
            }
            
            // 無効状態のスタイルチェック
            if (button.disabled && computedStyle.opacity === '1') {
                interactionIssues.push(`ボタン${index + 1}: 無効状態のスタイルが不明確です`);
            }
        });
        
        // リンクのテスト
        links.forEach((link, index) => {
            if (!link.href || link.href === '#') {
                interactionIssues.push(`リンク${index + 1}: 有効なhref属性がありません`);
            }
        });
        
        // 入力要素のテスト
        inputs.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            
            if (rect.width < 44 || rect.height < 44) {
                interactionIssues.push(`入力要素${index + 1}: タッチターゲットが小さすぎます`);
            }
        });
        
        if (interactionIssues.length > 3) {
            throw new Error(`インタラクション問題: ${interactionIssues.slice(0, 3).join(', ')}`);
        }
        
        return `インタラクション要素: ${buttons.length + links.length + inputs.length}個`;
    }
    
    /**
     * ローディング状態テスト
     */
    testLoadingStates() {
        const loadingElements = document.querySelectorAll('.loading, .spinner, [aria-busy="true"]');
        const progressElements = document.querySelectorAll('.progress, [role="progressbar"]');
        
        if (loadingElements.length === 0 && progressElements.length === 0) {
            this.warnings.push({
                type: 'loading-states',
                message: 'ローディング状態の表示要素が見つかりません',
                suggestion: 'ユーザーフィードバック用のローディング表示を追加してください'
            });
        }
        
        return `ローディング要素: ${loadingElements.length + progressElements.length}個`;
    }
    
    /**
     * エラー状態テスト
     */
    testErrorStates() {
        const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"]');
        
        if (errorElements.length === 0) {
            this.warnings.push({
                type: 'error-states',
                message: 'エラー状態の表示要素が見つかりません',
                suggestion: 'エラーハンドリング用のUI要素を追加してください'
            });
        }
        
        // エラーメッセージの内容チェック
        errorElements.forEach((element, index) => {
            const text = element.textContent.trim();
            if (!text || text.length < 5) {
                this.warnings.push({
                    type: 'error-states',
                    message: `エラー要素${index + 1}: メッセージが短すぎるか空です`,
                    suggestion: '具体的で分かりやすいエラーメッセージを設定してください'
                });
            }
        });
        
        return `エラー要素: ${errorElements.length}個`;
    }
    
    /**
     * アニメーション効果テスト
     */
    testAnimations() {
        const animatedElements = document.querySelectorAll('[style*="transition"], [style*="animation"]');
        const cssAnimations = document.querySelectorAll('.fade, .slide, .bounce, .rotate');
        
        let animationIssues = [];
        
        // アニメーション時間のチェック
        [...animatedElements, ...cssAnimations].forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const transitionDuration = computedStyle.transitionDuration;
            const animationDuration = computedStyle.animationDuration;
            
            // 長すぎるアニメーションのチェック
            if (transitionDuration && parseFloat(transitionDuration) > 1) {
                animationIssues.push(`要素${index + 1}: トランジション時間が長すぎます (${transitionDuration})`);
            }
            
            if (animationDuration && parseFloat(animationDuration) > 2) {
                animationIssues.push(`要素${index + 1}: アニメーション時間が長すぎます (${animationDuration})`);
            }
        });
        
        if (animationIssues.length > 0) {
            this.warnings.push({
                type: 'animations',
                message: 'アニメーション時間の問題があります',
                details: animationIssues.slice(0, 3)
            });
        }
        
        return `アニメーション要素: ${animatedElements.length + cssAnimations.length}個`;
    }
    
    /**
     * キーボードナビゲーションテスト
     */
    testKeyboardNavigation() {
        const focusableElements = document.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
            throw new Error('フォーカス可能な要素が見つかりません');
        }
        
        let navigationIssues = [];
        
        // タブインデックスの確認
        focusableElements.forEach((element, index) => {
            const tabIndex = element.getAttribute('tabindex');
            
            // 正の値のタブインデックスは推奨されない
            if (tabIndex && parseInt(tabIndex) > 0) {
                navigationIssues.push(`要素${index + 1}: 正の値のtabindexが使用されています (${tabIndex})`);
            }
            
            // 非表示要素がフォーカス可能になっていないかチェック
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                navigationIssues.push(`要素${index + 1}: 非表示要素がフォーカス可能です`);
            }
        });
        
        if (navigationIssues.length > 0) {
            throw new Error(`キーボードナビゲーション問題: ${navigationIssues.slice(0, 3).join(', ')}`);
        }
        
        return `フォーカス可能要素: ${focusableElements.length}個`;
    }
    
    /**
     * ARIA属性テスト
     */
    testARIAAttributes() {
        const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby], [role], [aria-hidden]');
        
        if (ariaElements.length === 0) {
            this.warnings.push({
                type: 'aria-attributes',
                message: 'ARIA属性が設定された要素が見つかりません',
                suggestion: 'アクセシビリティ向上のためARIA属性を追加してください'
            });
        }
        
        let ariaIssues = [];
        
        // ARIA属性の妥当性チェック
        ariaElements.forEach((element, index) => {
            const ariaLabel = element.getAttribute('aria-label');
            const ariaDescribedby = element.getAttribute('aria-describedby');
            const role = element.getAttribute('role');
            
            // 空のaria-labelチェック
            if (ariaLabel !== null && ariaLabel.trim() === '') {
                ariaIssues.push(`要素${index + 1}: aria-labelが空です`);
            }
            
            // 存在しないIDを参照するaria-describedbyチェック
            if (ariaDescribedby && !document.getElementById(ariaDescribedby)) {
                ariaIssues.push(`要素${index + 1}: aria-describedbyが存在しないIDを参照しています`);
            }
            
            // 無効なroleチェック（基本的なもののみ）
            const validRoles = ['button', 'link', 'textbox', 'alert', 'dialog', 'menu', 'menuitem', 'tab', 'tabpanel'];
            if (role && !validRoles.includes(role)) {
                console.warn(`要素${index + 1}: 一般的でないrole属性が使用されています: ${role}`);
            }
        });
        
        if (ariaIssues.length > 0) {
            throw new Error(`ARIA属性問題: ${ariaIssues.slice(0, 3).join(', ')}`);
        }
        
        return `ARIA要素: ${ariaElements.length}個`;
    }
    
    /**
     * フォーカス管理テスト
     */
    testFocusManagement() {
        const focusableElements = document.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        let focusIssues = [];
        
        // フォーカススタイルの確認
        focusableElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element, ':focus');
            
            // フォーカス時のアウトラインが削除されていないかチェック
            if (element.style.outline === 'none' || element.style.outline === '0') {
                // カスタムフォーカススタイルがあるかチェック
                const hasCustomFocus = element.style.boxShadow || 
                                     element.style.border || 
                                     element.classList.contains('focus-visible');
                
                if (!hasCustomFocus) {
                    focusIssues.push(`要素${index + 1}: フォーカススタイルが削除されています`);
                }
            }
        });
        
        if (focusIssues.length > 3) {
            throw new Error(`フォーカス管理問題: ${focusIssues.slice(0, 3).join(', ')}`);
        }
        
        return `フォーカス管理: ${focusableElements.length}個の要素をチェック`;
    }
    
    /**
     * スクリーンリーダー対応テスト
     */
    testScreenReaderSupport() {
        const images = document.querySelectorAll('img');
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        
        let screenReaderIssues = [];
        
        // 画像のalt属性チェック
        images.forEach((img, index) => {
            if (!img.hasAttribute('alt')) {
                screenReaderIssues.push(`画像${index + 1}: alt属性がありません`);
            } else if (img.getAttribute('alt') === '') {
                // 装飾的な画像の場合は空のaltが適切
                console.log(`画像${index + 1}: 装飾的な画像として設定されています`);
            }
        });
        
        // ボタンのテキストコンテンツチェック
        buttons.forEach((button, index) => {
            const text = button.textContent.trim();
            const ariaLabel = button.getAttribute('aria-label');
            
            if (!text && !ariaLabel) {
                screenReaderIssues.push(`ボタン${index + 1}: テキストまたはaria-labelがありません`);
            }
        });
        
        // リンクのテキストコンテンツチェック
        links.forEach((link, index) => {
            const text = link.textContent.trim();
            const ariaLabel = link.getAttribute('aria-label');
            
            if (!text && !ariaLabel) {
                screenReaderIssues.push(`リンク${index + 1}: テキストまたはaria-labelがありません`);
            }
        });
        
        if (screenReaderIssues.length > 0) {
            throw new Error(`スクリーンリーダー対応問題: ${screenReaderIssues.slice(0, 3).join(', ')}`);
        }
        
        return `スクリーンリーダー対応: 画像${images.length}個、ボタン${buttons.length}個、リンク${links.length}個をチェック`;
    }
    
    /**
     * セマンティックHTMLテスト
     */
    testSemanticHTML() {
        const semanticElements = document.querySelectorAll(
            'header, nav, main, section, article, aside, footer, h1, h2, h3, h4, h5, h6'
        );
        
        if (semanticElements.length === 0) {
            throw new Error('セマンティックHTML要素が見つかりません');
        }
        
        // 基本的なセマンティック構造のチェック
        const hasMain = document.querySelector('main');
        const hasHeader = document.querySelector('header');
        const hasHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        let semanticIssues = [];
        
        if (!hasMain) {
            semanticIssues.push('main要素がありません');
        }
        
        if (!hasHeader) {
            this.warnings.push({
                type: 'semantic-html',
                message: 'header要素が見つかりません',
                suggestion: 'ページ構造を明確にするためheader要素を追加してください'
            });
        }
        
        if (hasHeadings.length === 0) {
            semanticIssues.push('見出し要素がありません');
        }
        
        if (semanticIssues.length > 0) {
            throw new Error(`セマンティックHTML問題: ${semanticIssues.join(', ')}`);
        }
        
        return `セマンティック要素: ${semanticElements.length}個`;
    }
    
    /**
     * カラーアクセシビリティテスト
     */
    testColorAccessibility() {
        // 色のみに依存した情報伝達のチェック
        const colorOnlyElements = document.querySelectorAll('.red, .green, .blue, .yellow, .orange');
        
        if (colorOnlyElements.length > 0) {
            this.warnings.push({
                type: 'color-accessibility',
                message: '色のみで情報を伝達している可能性があります',
                suggestion: 'アイコンやテキストラベルを併用してください'
            });
        }
        
        // 必須フィールドの表示方法チェック
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach((field, index) => {
            const label = document.querySelector(`label[for="${field.id}"]`);
            const ariaRequired = field.getAttribute('aria-required');
            
            if (!label && !ariaRequired) {
                this.warnings.push({
                    type: 'color-accessibility',
                    message: `必須フィールド${index + 1}: 必須であることが明示されていません`,
                    suggestion: 'ラベルテキストまたはaria-required属性を追加してください'
                });
            }
        });
        
        return `カラーアクセシビリティ: ${colorOnlyElements.length + requiredFields.length}個の要素をチェック`;
    }
    
    /**
     * テキストサイズ調整テスト
     */
    testTextScaling() {
        const textElements = document.querySelectorAll('p, span, div, button, a, label, input');
        let scalingIssues = [];
        
        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const fontSize = computedStyle.fontSize;
            
            // px単位の固定サイズをチェック
            if (fontSize.endsWith('px')) {
                const pxValue = parseFloat(fontSize);
                if (pxValue < 16) {
                    scalingIssues.push(`要素${index + 1}: 固定フォントサイズが小さすぎます (${fontSize})`);
                }
            }
        });
        
        if (scalingIssues.length > 10) { // 10個以上の問題がある場合のみエラー
            this.warnings.push({
                type: 'text-scaling',
                message: '多くの要素で固定フォントサイズが使用されています',
                suggestion: 'rem単位やem単位の使用を検討してください'
            });
        }
        
        return `テキストサイズ調整: ${textElements.length}個の要素をチェック`;
    }
    
    /**
     * モーション設定テスト
     */
    testMotionPreferences() {
        // prefers-reduced-motionメディアクエリの対応チェック
        const hasReducedMotionCSS = Array.from(document.styleSheets).some(sheet => {
            try {
                return Array.from(sheet.cssRules).some(rule => 
                    rule.media && rule.media.mediaText.includes('prefers-reduced-motion')
                );
            } catch (e) {
                return false;
            }
        });
        
        if (!hasReducedMotionCSS) {
            this.warnings.push({
                type: 'motion-preferences',
                message: 'prefers-reduced-motionメディアクエリが見つかりません',
                suggestion: 'モーション感度の高いユーザー向けの配慮を追加してください'
            });
        }
        
        return `モーション設定: ${hasReducedMotionCSS ? '対応済み' : '未対応'}`;
    }
    
    /**
     * 日本語テキストテスト
     */
    testJapaneseText() {
        const textElements = document.querySelectorAll('*');
        let japaneseTextCount = 0;
        let nonJapaneseTextCount = 0;
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text && element.children.length === 0) { // テキストノードのみ
                if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
                    japaneseTextCount++;
                } else if (/[a-zA-Z]/.test(text)) {
                    nonJapaneseTextCount++;
                }
            }
        });
        
        if (japaneseTextCount === 0) {
            throw new Error('日本語テキストが見つかりません');
        }
        
        const japaneseRatio = japaneseTextCount / (japaneseTextCount + nonJapaneseTextCount);
        if (japaneseRatio < 0.7) {
            this.warnings.push({
                type: 'japanese-text',
                message: '日本語テキストの割合が低いです',
                suggestion: 'より多くのテキストを日本語化してください'
            });
        }
        
        return `日本語テキスト: ${japaneseTextCount}個 (${Math.round(japaneseRatio * 100)}%)`;
    }
    
    /**
     * 敬語使用テスト
     */
    testPoliteJapanese() {
        const textElements = document.querySelectorAll('p, span, div, button, label');
        let politeTextCount = 0;
        let casualTextCount = 0;
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
                // 敬語表現のチェック（簡易版）
                if (/です|ます|ください|いたします|させていただき/.test(text)) {
                    politeTextCount++;
                } else if (/だ|である|する$|した$/.test(text)) {
                    casualTextCount++;
                }
            }
        });
        
        if (politeTextCount === 0 && casualTextCount > 0) {
            this.warnings.push({
                type: 'polite-japanese',
                message: '敬語表現が使用されていません',
                suggestion: 'ユーザー向けテキストには丁寧語を使用してください'
            });
        }
        
        return `敬語使用: ${politeTextCount}個の丁寧語表現`;
    }
    
    /**
     * 文字エンコーディングテスト
     */
    testCharacterEncoding() {
        const metaCharset = document.querySelector('meta[charset]');
        
        if (!metaCharset) {
            throw new Error('文字エンコーディングが指定されていません');
        }
        
        const charset = metaCharset.getAttribute('charset').toLowerCase();
        if (charset !== 'utf-8') {
            throw new Error(`文字エンコーディングがUTF-8ではありません: ${charset}`);
        }
        
        return `文字エンコーディング: ${charset.toUpperCase()}`;
    }
    
    /**
     * 日本語フォントテスト
     */
    testJapaneseFonts() {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        let fontIssues = [];
        
        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const fontFamily = computedStyle.fontFamily.toLowerCase();
            
            // 日本語フォントの確認
            const hasJapaneseFont = /hiragino|noto|yu gothic|meiryo|ms gothic|ms mincho/.test(fontFamily);
            const text = element.textContent.trim();
            
            if (text && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text) && !hasJapaneseFont) {
                if (index < 5) { // 最初の5個のみチェック
                    fontIssues.push(`要素${index + 1}: 日本語フォントが指定されていません`);
                }
            }
        });
        
        if (fontIssues.length > 0) {
            this.warnings.push({
                type: 'japanese-fonts',
                message: '日本語フォントの指定が不十分です',
                details: fontIssues.slice(0, 3)
            });
        }
        
        return `日本語フォント: ${textElements.length}個の要素をチェック`;
    }
    
    /**
     * 日付・時刻形式テスト
     */
    testDateTimeFormat() {
        const dateElements = document.querySelectorAll('[datetime], .date, .time, .timestamp');
        
        if (dateElements.length === 0) {
            return '日付・時刻要素なし';
        }
        
        let formatIssues = [];
        
        dateElements.forEach((element, index) => {
            const text = element.textContent.trim();
            const datetime = element.getAttribute('datetime');
            
            // 日本語の日付形式チェック（簡易版）
            if (text && !/年|月|日|時|分|秒/.test(text) && /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text)) {
                formatIssues.push(`要素${index + 1}: 日本語の日付形式ではありません`);
            }
        });
        
        if (formatIssues.length > 0) {
            this.warnings.push({
                type: 'datetime-format',
                message: '日付・時刻形式が日本語化されていません',
                details: formatIssues
            });
        }
        
        return `日付・時刻要素: ${dateElements.length}個`;
    }
    
    /**
     * 日本語エラーメッセージテスト
     */
    testJapaneseErrorMessages() {
        const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"]');
        
        if (errorElements.length === 0) {
            return 'エラーメッセージ要素なし';
        }
        
        let errorMessageIssues = [];
        
        errorElements.forEach((element, index) => {
            const text = element.textContent.trim();
            
            if (text) {
                // 日本語エラーメッセージかチェック
                if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
                    errorMessageIssues.push(`エラー${index + 1}: 日本語化されていません`);
                }
                
                // 敬語使用チェック
                if (!/です|ます|ください/.test(text)) {
                    errorMessageIssues.push(`エラー${index + 1}: 敬語が使用されていません`);
                }
            }
        });
        
        if (errorMessageIssues.length > 0) {
            throw new Error(`日本語エラーメッセージ問題: ${errorMessageIssues.slice(0, 3).join(', ')}`);
        }
        
        return `日本語エラーメッセージ: ${errorElements.length}個`;
    }
    
    /**
     * 成功メッセージテスト
     */
    testSuccessMessages() {
        const successElements = document.querySelectorAll('.success, .success-message, [role="status"]');
        
        if (successElements.length === 0) {
            this.warnings.push({
                type: 'success-messages',
                message: '成功メッセージ要素が見つかりません',
                suggestion: 'ユーザーフィードバック用の成功メッセージを追加してください'
            });
        }
        
        return `成功メッセージ要素: ${successElements.length}個`;
    }
    
    /**
     * エラーメッセージテスト
     */
    testErrorMessages() {
        const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"]');
        
        if (errorElements.length === 0) {
            this.warnings.push({
                type: 'error-messages',
                message: 'エラーメッセージ要素が見つかりません',
                suggestion: 'エラーハンドリング用のメッセージ表示を追加してください'
            });
        }
        
        return `エラーメッセージ要素: ${errorElements.length}個`;
    }
    
    /**
     * 警告メッセージテスト
     */
    testWarningMessages() {
        const warningElements = document.querySelectorAll('.warning, .warning-message, [role="alert"]');
        
        if (warningElements.length === 0) {
            this.warnings.push({
                type: 'warning-messages',
                message: '警告メッセージ要素が見つかりません',
                suggestion: '警告表示用のUI要素を追加してください'
            });
        }
        
        return `警告メッセージ要素: ${warningElements.length}個`;
    }
    
    /**
     * プログレス表示テスト
     */
    testProgressIndicators() {
        const progressElements = document.querySelectorAll('.progress, [role="progressbar"], .loading');
        
        if (progressElements.length === 0) {
            this.warnings.push({
                type: 'progress-indicators',
                message: 'プログレス表示要素が見つかりません',
                suggestion: '処理状況を示すプログレス表示を追加してください'
            });
        }
        
        return `プログレス表示要素: ${progressElements.length}個`;
    }
    
    /**
     * ツールチップテスト
     */
    testTooltips() {
        const tooltipElements = document.querySelectorAll('[title], .tooltip, [role="tooltip"]');
        
        if (tooltipElements.length === 0) {
            this.warnings.push({
                type: 'tooltips',
                message: 'ツールチップ要素が見つかりません',
                suggestion: 'ヘルプ情報表示用のツールチップを追加してください'
            });
        }
        
        return `ツールチップ要素: ${tooltipElements.length}個`;
    }
    
    /**
     * ヘルプテキストテスト
     */
    testHelpText() {
        const helpElements = document.querySelectorAll('.help, .help-text, [role="note"]');
        
        if (helpElements.length === 0) {
            this.warnings.push({
                type: 'help-text',
                message: 'ヘルプテキスト要素が見つかりません',
                suggestion: 'ユーザーガイダンス用のヘルプテキストを追加してください'
            });
        }
        
        return `ヘルプテキスト要素: ${helpElements.length}個`;
    }
    
    /**
     * ユーザビリティ最適化提案生成
     */
    generateUsabilityOptimizations() {
        console.log('💡 ユーザビリティ最適化提案を生成中...');
        
        // カテゴリ別の成功率を計算
        Object.entries(this.testResults.categories).forEach(([category, results]) => {
            const successRate = results.total > 0 ? (results.passed / results.total) * 100 : 100;
            
            if (successRate < 80) {
                this.optimizations.push({
                    category: category,
                    priority: 'high',
                    message: `${category}カテゴリの改善が必要です (成功率: ${successRate.toFixed(1)}%)`,
                    suggestion: this.getCategorySuggestion(category)
                });
            } else if (successRate < 95) {
                this.optimizations.push({
                    category: category,
                    priority: 'medium',
                    message: `${category}カテゴリの微調整が推奨されます (成功率: ${successRate.toFixed(1)}%)`,
                    suggestion: this.getCategorySuggestion(category)
                });
            }
        });
        
        // 警告の数に基づく提案
        if (this.warnings.length > 10) {
            this.optimizations.push({
                category: 'general',
                priority: 'high',
                message: '多数の改善点が検出されました',
                suggestion: '段階的な改善計画を立て、優先度の高い項目から対応してください'
            });
        }
        
        console.log(`💡 ${this.optimizations.length}個の最適化提案を生成しました`);
    }
    
    /**
     * カテゴリ別の改善提案を取得
     * @param {string} category - カテゴリ名
     * @returns {string} 改善提案
     */
    getCategorySuggestion(category) {
        const suggestions = {
            ui: 'デザインシステムの導入、一貫性のあるスタイルガイドの作成、ユーザビリティテストの実施を検討してください',
            accessibility: 'WCAG 2.1ガイドラインの確認、スクリーンリーダーテストの実施、キーボードナビゲーションの改善を行ってください',
            japanese: '日本語ネイティブによるテキストレビュー、敬語表現の統一、日本語フォントの最適化を実施してください',
            feedback: 'ユーザーフィードバック機能の充実、エラーメッセージの改善、プログレス表示の追加を検討してください'
        };
        
        return suggestions[category] || '該当カテゴリの専門的なレビューを実施してください';
    }
    
    /**
     * レポート生成
     */
    generateReport() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const successRate = (this.testResults.passed / this.testResults.total) * 100;
        
        console.log('\n' + '='.repeat(60));
        console.log('🎨 ユーザビリティ最適化テスト結果');
        console.log('='.repeat(60));
        console.log(`📊 総合結果:`);
        console.log(`   ✅ 成功: ${this.testResults.passed}/${this.testResults.total}`);
        console.log(`   ❌ 失敗: ${this.testResults.failed}/${this.testResults.total}`);
        console.log(`   📈 成功率: ${successRate.toFixed(1)}%`);
        console.log(`   ⏱️ 実行時間: ${duration}ms`);
        
        // カテゴリ別結果
        console.log(`\n📋 カテゴリ別結果:`);
        Object.entries(this.testResults.categories).forEach(([category, results]) => {
            const categorySuccessRate = results.total > 0 ? (results.passed / results.total) * 100 : 100;
            const status = results.failed === 0 ? '✅' : '⚠️';
            const categoryName = {
                ui: 'UI/UX',
                accessibility: 'アクセシビリティ',
                japanese: '日本語対応',
                feedback: 'フィードバック'
            }[category] || category;
            
            console.log(`   ${status} ${categoryName}: ${results.passed}/${results.total} (${categorySuccessRate.toFixed(1)}%)`);
        });
        
        // 警告
        if (this.warnings.length > 0) {
            console.log(`\n⚠️ 警告 (${this.warnings.length}件):`);
            this.warnings.slice(0, 5).forEach(warning => {
                console.log(`   • ${warning.message}`);
                if (warning.suggestion) {
                    console.log(`     提案: ${warning.suggestion}`);
                }
            });
            
            if (this.warnings.length > 5) {
                console.log(`   ... 他${this.warnings.length - 5}件の警告があります`);
            }
        }
        
        // 最適化提案
        if (this.optimizations.length > 0) {
            console.log(`\n💡 最適化提案 (${this.optimizations.length}件):`);
            this.optimizations.forEach(optimization => {
                const priority = optimization.priority === 'high' ? '🔴' : '🟡';
                console.log(`   ${priority} ${optimization.message}`);
                console.log(`     提案: ${optimization.suggestion}`);
            });
        }
        
        // 総合評価
        let evaluation = '';
        if (successRate >= 95) {
            evaluation = '🎉 優秀 - ユーザビリティは非常に良好です';
        } else if (successRate >= 85) {
            evaluation = '✅ 良好 - 一部改善の余地があります';
        } else if (successRate >= 70) {
            evaluation = '⚠️ 要改善 - ユーザビリティの向上が必要です';
        } else {
            evaluation = '❌ 要緊急対応 - 重大なユーザビリティ問題があります';
        }
        
        console.log(`\n${evaluation}`);
        
        // HTMLレポートを生成
        this.generateHTMLReport();
    }
    
    /**
     * HTMLレポート生成
     */
    generateHTMLReport() {
        const successRate = (this.testResults.passed / this.testResults.total) * 100;
        const statusClass = successRate >= 95 ? 'excellent' : 
                           successRate >= 85 ? 'good' : 
                           successRate >= 70 ? 'warning' : 'critical';
        
        const html = `
            <div class="usability-report">
                <h2>🎨 ユーザビリティ最適化テスト結果</h2>
                
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
                
                <div class="categories-section">
                    <h3>📋 カテゴリ別結果</h3>
                    <div class="categories-grid">
                        ${Object.entries(this.testResults.categories).map(([category, results]) => {
                            const categorySuccessRate = results.total > 0 ? (results.passed / results.total) * 100 : 100;
                            const categoryName = {
                                ui: 'UI/UX',
                                accessibility: 'アクセシビリティ',
                                japanese: '日本語対応',
                                feedback: 'フィードバック'
                            }[category] || category;
                            
                            return `
                                <div class="category-card ${results.failed === 0 ? 'success' : 'warning'}">
                                    <h4>${results.failed === 0 ? '✅' : '⚠️'} ${categoryName}</h4>
                                    <div class="category-stats">
                                        <div>成功: ${results.passed}/${results.total}</div>
                                        <div>成功率: ${categorySuccessRate.toFixed(1)}%</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                ${this.warnings.length > 0 ? `
                    <div class="warnings-section">
                        <h3>⚠️ 警告 (${this.warnings.length}件)</h3>
                        <div class="warnings-list">
                            ${this.warnings.slice(0, 10).map(warning => `
                                <div class="warning-item">
                                    <div class="warning-message">${warning.message}</div>
                                    ${warning.suggestion ? `<div class="warning-suggestion">💡 ${warning.suggestion}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${this.optimizations.length > 0 ? `
                    <div class="optimizations-section">
                        <h3>💡 最適化提案 (${this.optimizations.length}件)</h3>
                        <div class="optimizations-list">
                            ${this.optimizations.map(optimization => `
                                <div class="optimization-item ${optimization.priority}">
                                    <div class="optimization-priority">${optimization.priority === 'high' ? '🔴' : '🟡'}</div>
                                    <div class="optimization-content">
                                        <div class="optimization-message">${optimization.message}</div>
                                        <div class="optimization-suggestion">🚀 ${optimization.suggestion}</div>
                                    </div>
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
        reportContainer.className = 'usability-report-container';
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
            z-index: 10006;
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
        if (document.getElementById('usability-report-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'usability-report-styles';
        style.textContent = `
            .usability-report h2 { 
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
            
            .categories-section, .warnings-section, .optimizations-section {
                margin-bottom: 24px;
            }
            
            .categories-section h3, .warnings-section h3, .optimizations-section h3 {
                color: #666;
                margin-bottom: 16px;
            }
            
            .categories-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .category-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 16px;
                background: white;
            }
            
            .category-card.success { border-left: 4px solid #4caf50; }
            .category-card.warning { border-left: 4px solid #ffc107; }
            
            .category-card h4 { margin-top: 0; margin-bottom: 12px; color: #333; }
            
            .category-stats { font-size: 14px; }
            .category-stats div { margin-bottom: 4px; }
            
            .warnings-list, .optimizations-list {
                max-height: 300px;
                overflow-y: auto;
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
            .optimization-item.high { border-left-color: #f44336; }
            
            .optimization-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            
            .optimization-priority {
                font-size: 20px;
                line-height: 1;
            }
            
            .optimization-content {
                flex: 1;
            }
            
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