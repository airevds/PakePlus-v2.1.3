/**
 * 模态框组件模块
 * 创建时间：2025年12月3日
 * 作用：提供模态框、确认对话框等UI组件
 * 作者：陶锵
 */

// 模态框类
class Modal {
    constructor(options = {}) {
        this.id = `modal-${Date.now()}`;
        this.title = options.title || '标题';
        this.content = options.content || '';
        this.size = options.size || 'medium'; // small, medium, large
        this.buttons = options.buttons || [];
        this.onClose = options.onClose || null;
        this.onOpen = options.onOpen || null;
        this.onButtonClick = options.onButtonClick || null;

        this.init();
    }

    // 初始化模态框
    init() {
        // 创建模态框元素
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal';
        this.modalElement.id = this.id;

        // 确定模态框尺寸类
        let sizeClass = '';
        if (this.size === 'small') sizeClass = 'modal-sm';
        if (this.size === 'large') sizeClass = 'modal-lg';

        // 模态框内容
        this.modalElement.innerHTML = `
            <div class="modal-content ${sizeClass}">
                <div class="modal-header">
                    <h2>${this.title}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">${this.content}</div>
                ${this.buttons.length > 0 ? `
                <div class="modal-footer">
                    ${this.buttons.map(btn => `
                        <button class="btn ${btn.class || 'btn-secondary'}" data-action="${btn.action || 'close'}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;

        // 添加到页面
        document.getElementById('modalContainer').appendChild(this.modalElement);

        // 绑定事件
        this.bindEvents();

        // 触发打开回调
        if (this.onOpen) {
            this.onOpen();
        }
    }

    // 绑定事件
    bindEvents() {
        // 关闭按钮
        const closeBtn = this.modalElement.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.close());

        // 模态框外部点击关闭
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // 按钮事件
        const footerButtons = this.modalElement.querySelectorAll('.modal-footer .btn');
        footerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'close') {
                    this.close();
                } else if (this.onButtonClick) {
                    this.onButtonClick(action, this);
                }
            });
        });
    }

    // 打开模态框
    open() {
        this.modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    close() {
        this.modalElement.classList.remove('active');
        document.body.style.overflow = '';

        // 触发关闭回调
        if (this.onClose) {
            this.onClose();
        }

        // 延迟移除元素
        setTimeout(() => {
            if (this.modalElement.parentNode) {
                this.modalElement.parentNode.removeChild(this.modalElement);
            }
        }, 300);
    }

    // 设置内容
    setContent(content) {
        const body = this.modalElement.querySelector('.modal-body');
        if (body) {
            body.innerHTML = content;
        }
    }

    // 设置标题
    setTitle(title) {
        const header = this.modalElement.querySelector('.modal-header h2');
        if (header) {
            header.textContent = title;
        }
    }
}

// 确认对话框
function confirmDialog(options) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || '确认操作',
            size: 'small',
            content: `
                <div class="confirm-body">
                    <div class="confirm-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>${options.message || '确定要执行此操作吗？'}</h3>
                    <p>${options.detail || '此操作可能无法撤销。'}</p>
                </div>
            `,
            buttons: [
                {
                    text: '取消',
                    class: 'btn-secondary',
                    action: 'cancel'
                },
                {
                    text: '确定',
                    class: 'btn-danger',
                    action: 'confirm'
                }
            ],
            onButtonClick: (action, modalInstance) => {
                modalInstance.close();
                resolve(action === 'confirm');
            }
        });

        modal.open();
    });
}

// 提示对话框
function alertDialog(options) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || '提示',
            size: 'small',
            content: `
                <div class="confirm-body">
                    <div class="confirm-icon" style="color: #3498db;">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <h3>${options.message || ''}</h3>
                    ${options.detail ? `<p>${options.detail}</p>` : ''}
                </div>
            `,
            buttons: [
                {
                    text: '确定',
                    class: 'btn-primary',
                    action: 'ok'
                }
            ],
            onButtonClick: (action, modalInstance) => {
                modalInstance.close();
                resolve(true);
            }
        });

        modal.open();
    });
}

// 表单对话框
function formDialog(options) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || '表单',
            size: options.size || 'medium',
            content: options.content || '',
            buttons: [
                {
                    text: '取消',
                    class: 'btn-secondary',
                    action: 'cancel'
                },
                {
                    text: '提交',
                    class: 'btn-primary',
                    action: 'submit'
                }
            ],
            onButtonClick: (action, modalInstance) => {
                if (action === 'submit' && options.validate) {
                    // 收集表单数据
                    const formData = {};
                    const form = modalInstance.modalElement.querySelector('form');
                    if (form) {
                        const inputs = form.querySelectorAll('input, select, textarea');
                        inputs.forEach(input => {
                            if (input.name) {
                                formData[input.name] = input.value;
                            }
                        });

                        // 验证表单
                        const validationResult = options.validate(formData);
                        if (!validationResult.valid) {
                            showNotification('error', '验证失败', validationResult.message);
                            return;
                        }

                        modalInstance.close();
                        resolve(formData);
                    }
                } else {
                    modalInstance.close();
                    resolve(null);
                }
            }
        });

        modal.open();
    });
}