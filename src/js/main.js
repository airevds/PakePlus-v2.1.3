/**
 * 主逻辑文件 - 系统初始化
 * 创建时间：2025年12月3日
 * 作用：系统初始化、标签页切换、全局功能
 * 作者：陶锵
 */

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('专家抽签系统初始化...');

    // 更新时间显示
    updateCurrentTime();

    // 初始化专家管理模块
    initExpertManagement();

    // 初始化抽签模块
    initDrawModule();

    // 绑定标签页切换事件
    bindTabEvents();

    // 启动时间更新定时器
    setInterval(updateCurrentTime, 1000);

    console.log('系统初始化完成');
});

// 更新当前时间显示
function updateCurrentTime() {
    const timeDisplay = document.getElementById('currentTime');
    if (timeDisplay) {
        timeDisplay.textContent = `北京时间：${formatDateTime(new Date())}`;
    }
}

// 绑定标签页切换事件
function bindTabEvents() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // 更新按钮状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');

                    // 如果切换到专家管理标签，刷新专家数据
                    if (tabId === 'expert-management') {
                        console.log('刷新专家管理模块');
                        currentPage = 1;
                        renderExpertsTable(document.getElementById('searchExpert')?.value || '');
                    }

                    // 如果切换到抽签模块，刷新专家选择列表
                    if (tabId === 'draw-module') {
                        console.log('刷新抽签模块');
                        loadTechnicalExpertsForSelection();
                    }
                }
            });
        });
    });
}