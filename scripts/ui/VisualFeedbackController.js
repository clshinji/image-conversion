/**
 * ビジュアルフィードバックとアニメーション効果を管理するクラス
 */
export class VisualFeedbackController {
    constructor() {
        this.activeAnimations = new Map();
        this.feedbackQueue = [];
        this.isProcessing = false;
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.createFeedbackContainer();
        this.setupGlobalAnimations();
    }
    
    /**
     * フィードバック表示用コンテナの作成
     */
    createFeedbackContainer() {
        if (!document.getElementById('feedbackContainer')) {
            const container = document.createElement('div');
            container.id = 'feedbackContainer';
            container.className = 'feedback-container';
            document.body.appendChild(container);
        }
    }
    
    /**
     * グローバルアニメーションの設定
     */
    setupGlobalAnimations() {
        // CSS変数でアニメーション設定を管理
        document.documentElement.style.setProperty('--animation-duration-fast', '0.2s');
        document.documentElement.style.setProperty('--animation-duration-normal', '0.3s');
        document.documentElement.style.setProperty('--animation-duration-slow', '0.5s');
        document.documentElement.style.setProperty('--animation-easing', 'cubic-bezier(0.4, 0, 0.2, 1)');
    }
    
    /**
     * 成功フィードバックを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     */
    showSuccess(message, options = {}) {
        const config = {
            type: 'success',
            message,
            icon: '✅',
            duration: 3000,
            position: 'top-right',
            animation: 'slideIn',
            ...options
        };
        
        this.showFeedback(config);
    }
    
    /**
     * エラーフィードバックを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     */
    showError(message, options = {}) {
        const config = {
            type: 'error',
            message,
            icon: '❌',
            duration: 5000,
            position: 'top-right',
            animation: 'slideIn',
            persistent: true,
            ...options
        };
        
        this.showFeedback(config);
    }
    
    /**
     * 警告フィードバックを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     */
    showWarning(message, options = {}) {
        const config = {
            type: 'warning',
            message,
            icon: '⚠️',
            duration: 4000,
            position: 'top-right',
            animation: 'slideIn',
            ...options
        };
        
        this.showFeedback(config);
    }
    
    /**
     * 情報フィードバックを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     */
    showInfo(message, options = {}) {
        const config = {
            type: 'info',
            message,
            icon: 'ℹ️',
            duration: 3000,
            position: 'top-right',
            animation: 'slideIn',
            ...options
        };
        
        this.showFeedback(config);
    }
    
    /**
     * 進行状況フィードバックを表示
     * @param {string} message - メッセージ
     * @param {number} progress - 進行率（0-100）
     * @param {Object} options - オプション
     */
    showProgress(message, progress = 0, options = {}) {
        const config = {
            type: 'progress',
            message,
            icon: '🔄',
            progress,
            duration: 0, // 手動で閉じるまで表示
            position: 'center',
            animation: 'fadeIn',
            persistent: true,
            ...options
        };
        
        return this.showFeedback(config);
    }
    
    /**
     * フィードバックを表示
     * @param {Object} config - フィードバック設定
     * @returns {string} フィードバックID
     */
    showFeedback(config) {
        const id = this.generateId();
        const feedbackElement = this.createFeedbackElement(id, config);
        
        // フィードバックをキューに追加
        this.feedbackQueue.push({ id, element: feedbackElement, config });
        
        // 処理開始
        if (!this.isProcessing) {
            this.processFeedbackQueue();
        }
        
        return id;
    }
    
    /**
     * フィードバック要素を作成
     * @param {string} id - フィードバックID
     * @param {Object} config - 設定
     * @returns {HTMLElement} フィードバック要素
     */
    createFeedbackElement(id, config) {
        const element = document.createElement('div');
        element.id = `feedback-${id}`;
        element.className = `feedback-item feedback-${config.type} feedback-${config.position}`;
        
        let content = `
            <div class="feedback-content">
                <div class="feedback-header">
                    <span class="feedback-icon">${config.icon}</span>
                    <span class="feedback-message">${config.message}</span>
                    ${!config.persistent ? '<button class="feedback-close" onclick="this.closest(\'.feedback-item\').remove()">×</button>' : ''}
                </div>
        `;
        
        // 進行状況バーを追加
        if (config.type === 'progress') {
            content += `
                <div class="feedback-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${config.progress}%"></div>
                    </div>
                    <div class="progress-text">${config.progress}%</div>
                </div>
            `;
        }
        
        // アクションボタンを追加
        if (config.actions) {
            content += '<div class="feedback-actions">';
            config.actions.forEach(action => {
                content += `<button class="feedback-action-btn" onclick="${action.handler}">${action.label}</button>`;
            });
            content += '</div>';
        }
        
        content += '</div>';
        element.innerHTML = content;
        
        return element;
    }
    
    /**
     * フィードバックキューを処理
     */
    async processFeedbackQueue() {
        this.isProcessing = true;
        
        while (this.feedbackQueue.length > 0) {
            const feedback = this.feedbackQueue.shift();
            await this.displayFeedback(feedback);
        }
        
        this.isProcessing = false;
    }
    
    /**
     * フィードバックを表示
     * @param {Object} feedback - フィードバックオブジェクト
     */
    async displayFeedback(feedback) {
        const container = document.getElementById('feedbackContainer');
        const { element, config } = feedback;
        
        // コンテナに追加
        container.appendChild(element);
        
        // アニメーション適用
        await this.applyAnimation(element, config.animation, 'in');
        
        // 自動削除の設定
        if (config.duration > 0) {
            setTimeout(async () => {
                await this.removeFeedback(feedback.id);
            }, config.duration);
        }
    }
    
    /**
     * フィードバックを削除
     * @param {string} id - フィードバックID
     */
    async removeFeedback(id) {
        const element = document.getElementById(`feedback-${id}`);
        if (element) {
            await this.applyAnimation(element, 'slideOut', 'out');
            element.remove();
        }
    }
    
    /**
     * 進行状況を更新
     * @param {string} id - フィードバックID
     * @param {number} progress - 進行率
     * @param {string} message - メッセージ（オプション）
     */
    updateProgress(id, progress, message = null) {
        const element = document.getElementById(`feedback-${id}`);
        if (element) {
            const progressFill = element.querySelector('.progress-fill');
            const progressText = element.querySelector('.progress-text');
            const messageElement = element.querySelector('.feedback-message');
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            if (progressText) {
                progressText.textContent = `${progress}%`;
            }
            if (message && messageElement) {
                messageElement.textContent = message;
            }
        }
    }
    
    /**
     * アニメーションを適用
     * @param {HTMLElement} element - 要素
     * @param {string} animationType - アニメーションタイプ
     * @param {string} direction - 方向（in/out）
     */
    async applyAnimation(element, animationType, direction) {
        return new Promise(resolve => {
            const animationClass = `animate-${animationType}-${direction}`;
            element.classList.add(animationClass);
            
            const handleAnimationEnd = () => {
                element.classList.remove(animationClass);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
            
            // フォールバック（アニメーションが実行されない場合）
            setTimeout(resolve, 500);
        });
    }
    
    /**
     * 要素にパルス効果を適用
     * @param {HTMLElement|string} element - 要素またはセレクタ
     * @param {Object} options - オプション
     */
    pulse(element, options = {}) {
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) return;
        
        const config = {
            duration: 1000,
            intensity: 'normal', // light, normal, strong
            color: null,
            ...options
        };
        
        targetElement.classList.add(`pulse-${config.intensity}`);
        
        if (config.color) {
            targetElement.style.setProperty('--pulse-color', config.color);
        }
        
        setTimeout(() => {
            targetElement.classList.remove(`pulse-${config.intensity}`);
            if (config.color) {
                targetElement.style.removeProperty('--pulse-color');
            }
        }, config.duration);
    }
    
    /**
     * 要素にシェイク効果を適用
     * @param {HTMLElement|string} element - 要素またはセレクタ
     * @param {Object} options - オプション
     */
    shake(element, options = {}) {
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) return;
        
        const config = {
            duration: 500,
            intensity: 'normal', // light, normal, strong
            ...options
        };
        
        targetElement.classList.add(`shake-${config.intensity}`);
        
        setTimeout(() => {
            targetElement.classList.remove(`shake-${config.intensity}`);
        }, config.duration);
    }
    
    /**
     * 要素にバウンス効果を適用
     * @param {HTMLElement|string} element - 要素またはセレクタ
     * @param {Object} options - オプション
     */
    bounce(element, options = {}) {
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) return;
        
        const config = {
            duration: 600,
            height: 'normal', // small, normal, large
            ...options
        };
        
        targetElement.classList.add(`bounce-${config.height}`);
        
        setTimeout(() => {
            targetElement.classList.remove(`bounce-${config.height}`);
        }, config.duration);
    }
    
    /**
     * 要素にグロー効果を適用
     * @param {HTMLElement|string} element - 要素またはセレクタ
     * @param {Object} options - オプション
     */
    glow(element, options = {}) {
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) return;
        
        const config = {
            duration: 2000,
            color: '#667eea',
            intensity: 'normal', // light, normal, strong
            ...options
        };
        
        targetElement.style.setProperty('--glow-color', config.color);
        targetElement.classList.add(`glow-${config.intensity}`);
        
        if (config.duration > 0) {
            setTimeout(() => {
                targetElement.classList.remove(`glow-${config.intensity}`);
                targetElement.style.removeProperty('--glow-color');
            }, config.duration);
        }
        
        return () => {
            targetElement.classList.remove(`glow-${config.intensity}`);
            targetElement.style.removeProperty('--glow-color');
        };
    }
    
    /**
     * ローディングスピナーを表示
     * @param {HTMLElement|string} element - 要素またはセレクタ
     * @param {Object} options - オプション
     */
    showSpinner(element, options = {}) {
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) return;
        
        const config = {
            size: 'normal', // small, normal, large
            color: '#667eea',
            overlay: true,
            ...options
        };
        
        const spinnerId = this.generateId();
        const spinnerElement = document.createElement('div');
        spinnerElement.id = `spinner-${spinnerId}`;
        spinnerElement.className = `loading-spinner spinner-${config.size}`;
        
        if (config.overlay) {
            spinnerElement.classList.add('spinner-overlay');
        }
        
        spinnerElement.innerHTML = `
            <div class="spinner-circle" style="border-color: ${config.color}20; border-top-color: ${config.color};">
                <div class="spinner-inner"></div>
            </div>
        `;
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(spinnerElement);
        
        return () => this.hideSpinner(spinnerId);
    }
    
    /**
     * ローディングスピナーを非表示
     * @param {string} spinnerId - スピナーID
     */
    hideSpinner(spinnerId) {
        const spinner = document.getElementById(`spinner-${spinnerId}`);
        if (spinner) {
            spinner.remove();
        }
    }
    
    /**
     * 要素の状態変化をアニメーション
     * @param {HTMLElement|string} element - 要素またはセレクタ
     * @param {string} fromState - 開始状態のクラス
     * @param {string} toState - 終了状態のクラス
     * @param {Object} options - オプション
     */
    async animateStateChange(element, fromState, toState, options = {}) {
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) return;
        
        const config = {
            duration: 300,
            easing: 'ease-in-out',
            ...options
        };
        
        // 開始状態を設定
        if (fromState) {
            targetElement.classList.add(fromState);
        }
        
        // トランジション設定
        targetElement.style.transition = `all ${config.duration}ms ${config.easing}`;
        
        // 状態変更をアニメーション
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                if (fromState) {
                    targetElement.classList.remove(fromState);
                }
                if (toState) {
                    targetElement.classList.add(toState);
                }
                
                setTimeout(() => {
                    targetElement.style.transition = '';
                    resolve();
                }, config.duration);
            });
        });
    }
    
    /**
     * ユニークIDを生成
     * @returns {string} ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * すべてのフィードバックをクリア
     */
    clearAllFeedback() {
        const container = document.getElementById('feedbackContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.feedbackQueue = [];
    }
    
    /**
     * 特定タイプのフィードバックをクリア
     * @param {string} type - フィードバックタイプ
     */
    clearFeedbackByType(type) {
        const feedbacks = document.querySelectorAll(`.feedback-${type}`);
        feedbacks.forEach(feedback => feedback.remove());
    }
}