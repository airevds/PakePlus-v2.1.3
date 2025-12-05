/**
 * 工具函数模块
 * 创建时间：2025年12月3日
 * 作用：提供系统通用的工具函数
 * 作者：陶锵
 */

// 生成随机ID
function generateId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `EXP-${timestamp}-${randomStr}`.toUpperCase();
}

// 格式化日期时间
function formatDateTime(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 显示加载动画
function showLoading(message = '加载中...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = overlay.querySelector('p');

    if (messageEl) {
        messageEl.textContent = message;
    }

    overlay.style.display = 'flex';
}

// 隐藏加载动画
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 深拷贝对象
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 从数组随机选择元素
function getRandomElement(array) {
    if (!array || array.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

// 从数组中移除指定元素
function removeFromArray(array, element) {
    const index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

// 获取北京时间
function getBeijingTime() {
    const now = new Date();
    // 北京是UTC+8
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 8));
}

// 导出数据到CSV文件
function exportToExcel(data, filename = '专家数据') {
    showLoading('正在导出数据...');

    try {
        // 创建CSV内容，添加UTF-8 BOM以确保中文正确显示
        let csvContent = "data:text/csv;charset=utf-8,\ufeff";

        // 添加表头
        const headers = ["专家编号", "姓名", "联系号码", "科室", "类型"];
        csvContent += headers.join(",") + "\n";

        // 添加数据行
        data.forEach(item => {
            // 只导出有效的专家数据
            if (item && item.id && item.name && item.phone) {
                const row = [
                    item.id || '',
                    item.name || '',
                    item.phone || '',
                    item.department || '',
                    item.type || ''
                ];
                csvContent += row.join(",") + "\n";
            }
        });

        // 创建下载链接
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}_${formatDateTime().replace(/[: ]/g, '-')}.csv`);
        document.body.appendChild(link);

        // 触发下载
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            hideLoading();
            showNotification('success', '导出成功', '数据已成功导出为CSV文件');
        }, 500);
    } catch (error) {
        hideLoading();
        showNotification('error', '导出失败', '导出过程中出现错误：' + error.message);
    }
}

// 显示通知
function showNotification(type, title, message, duration = 5000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // 设置图标
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';

    // 设置背景色
    let bgColor = '#3498db';
    if (type === 'success') bgColor = '#2ecc71';
    if (type === 'warning') bgColor = '#f39c12';
    if (type === 'error') bgColor = '#e74c3c';

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 设置样式
    notification.style.backgroundColor = bgColor;
    notification.style.color = 'white';

    // 关闭按钮事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });

    // 自动关闭
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    return notification;
}
