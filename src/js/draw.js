/**
 * 抽签模块
 * 创建时间：2025年12月8日
 * 作用：抽签逻辑、专家抽取、结果确认等功能
 * 作者：陶锵
 */

// 抽签状态
let drawState = {
    projectName: '',
    drawTime: null,
    specifiedExpert: null,
    priorityGroup: '', // '内科医疗组' 或 '外科医疗组' 或 '不优先'
    technicalNeeded: 0,
    supervisorNeeded: 0,
    currentStep: 0, // 0: 设置, 1: 确认
    results: {
        technical: [],
        supervisor: []
    },
    history: {
        technical: [], // 保存无法参加的专家历史
        supervisor: []
    },
    availableExperts: {
        technical: [],
        supervisor: []
    }
};

// 初始化抽签模块
function initDrawModule() {
    const container = document.getElementById('draw-module');

    container.innerHTML = `
        <div class="card" id="setupCard">
            <h2 class="card-title">抽签设置</h2>
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label for="projectName">项目名称 *</label>
                        <input type="text" id="projectName" placeholder="请输入本次抽签的项目名称">
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label for="technicalNeeded">技术组专家数量 *</label>
                        <input type="number" id="technicalNeeded" min="1" max="20" value="5">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label for="supervisorNeeded">监督组专家数量 *</label>
                        <input type="number" id="supervisorNeeded" min="1" max="10" value="2">
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>优先抽取组别 *</label>
                <div style="display: flex; gap: 20px; margin-top: 10px;">
                    <label class="radio-label">
                        <input type="radio" name="priorityGroup" value="内科医疗组" checked>
                        <span style="width:250px">优先内科医疗组</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="priorityGroup" value="外科医疗组">
                        <span style="width:250px">优先外科医疗组</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="priorityGroup" value="不优先">
                        <span style="width:290px">不优先（随机抽取）</span>
                    </label>
                </div>
                <small style="color: #7f8c8d; display: block; margin-top: 5px;">
                    注：选择"不优先"时，技术组专家将从所有技术组子类型中随机抽取
                </small>
            </div>
            
            <div class="form-group">
                <label for="specifiedExpertSelect">指定专家（可选）</label>
                <div class="searchable-select">
                    <input type="text" id="expertSearchInput" placeholder="输入姓名、科室或类型搜索..." 
                           style="width: 100%; padding: 10px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 5px;">
                    <select id="specifiedExpertSelect" style="width: 100%;" size="5">
                        <!--<option value="">&#45;&#45; 不指定专家 &#45;&#45;</option>-->
                        <!-- 技术组专家选项将通过JS动态加载 -->
                    </select>
                </div>
                <small style="color: #7f8c8d; display: block; margin-top: 5px;">
                    注：指定专家将占用一个技术组专家名额，且自动确认为参加
                </small>
            </div>
            
            <div class="form-actions">
                <button id="startDrawBtn" class="btn btn-primary">开始抽签</button>
            </div>
        </div>
        
        <div class="card" id="confirmCard" style="display: none;">
            <h2 class="card-title">确认专家参与</h2>
            <div id="drawResults">
                <!-- 抽签结果将通过JS动态加载 -->
            </div>
            
            <div class="form-actions">
                <button id="backToSetupBtn" class="btn btn-secondary">重新抽签</button>
                <button id="completeDrawBtn" class="btn btn-success" disabled>完成抽签</button>
            </div>
        </div>
        
        <div class="card" id="completeCard" style="display: none;">
            <h2 class="card-title">抽签完成</h2>
            <div id="finalResults">
                <!-- 最终结果将通过JS动态加载 -->
            </div>
            
            <div class="form-actions">
                <button id="restartDrawBtn" class="btn btn-primary">重新开始抽签</button>
                <button id="exportResultsBtn" class="btn btn-warning">导出抽签结果</button>
                <button id="exportPDFBtn" class="btn btn-danger"><i class="fas fa-file-pdf"></i> 导出为PDF</button>
            </div>
        </div>
    `;

    // 加载技术组专家到选择框
    loadTechnicalExpertsForSelection();

    // 绑定事件
    bindDrawEvents();
}

// 加载技术组专家到选择框（支持模糊搜索）
function loadTechnicalExpertsForSelection() {
    const select = document.getElementById('specifiedExpertSelect');
    const searchInput = document.getElementById('expertSearchInput');

    if (!select || !searchInput) return;

    // 获取技术组专家
    const technicalExperts = getTechnicalExperts();

    // 存储所有专家数据（用于搜索）
    window.allTechnicalExperts = technicalExperts;

    // 渲染专家列表
    function renderExpertList(filter = '') {
        // 清空现有选项（保留第一个选项）
/*        while (select.options.length > 1) {
            select.remove(1);
        }*/
        // 清空所有选项
        select.innerHTML = '';

        // 过滤专家
        const filteredExperts = filter ?
            technicalExperts.filter(expert => {
                const searchText = filter.toLowerCase();
/*                return expert.name.toLowerCase().includes(searchText) ||
                       expert.id.toLowerCase().includes(searchText) ||
                       expert.department.toLowerCase().includes(searchText) ||
                       expert.type.toLowerCase().includes(searchText) ||
                       expert.phone.includes(searchText);*/
                return expert.name.toLowerCase().includes(searchText) ||
                       expert.department.toLowerCase().includes(searchText) ||
                       expert.type.toLowerCase().includes(searchText);
            }) :
            technicalExperts;

        // 添加专家选项
        filteredExperts.forEach(expert => {
            const option = document.createElement('option');
            option.value = expert.id;
            option.textContent = `${expert.name} - ${expert.department} - ${expert.type}`;
            option.setAttribute('data-name', expert.name);
            option.setAttribute('data-department', expert.department);
            option.setAttribute('data-type', expert.type);
            option.setAttribute('data-phone', expert.phone);
            select.appendChild(option);
        });
    }

    // 初始渲染
    renderExpertList();

    // 搜索框输入事件
    searchInput.addEventListener('input', debounce((e) => {
        renderExpertList(e.target.value);
    }, 300));

    // 选择框点击事件
    select.addEventListener('click', (e) => {
        if (select.value) {
            searchInput.value = select.options[select.selectedIndex].textContent;
            // 选择后隐藏下拉框
            setTimeout(() => {
                select.style.display = 'none';
            }, 100);
        }
    });

    // 搜索框获得焦点时显示下拉框
    searchInput.addEventListener('focus', () => {
        select.style.display = 'block';
    });

    // 点击其他地方时隐藏下拉框
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !select.contains(e.target)) {
            select.style.display = 'none';
        }
    });
}

// 绑定抽签模块事件
function bindDrawEvents() {
    // 开始抽签按钮
    document.getElementById('startDrawBtn')?.addEventListener('click', startDrawProcess);

    // 返回设置按钮
    document.getElementById('backToSetupBtn')?.addEventListener('click', goToSetup);

    // 完成抽签按钮
    document.getElementById('completeDrawBtn')?.addEventListener('click', completeDraw);

    // 重新开始按钮
    document.getElementById('restartDrawBtn')?.addEventListener('click', restartDraw);

    // 导出结果按钮
    document.getElementById('exportResultsBtn')?.addEventListener('click', exportDrawResults);

    // PDF导出按钮
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportDrawResultsToPDF);
}

// 开始抽签过程
function startDrawProcess() {
    // 验证设置
    const projectName = document.getElementById('projectName').value.trim();
    const technicalNeeded = parseInt(document.getElementById('technicalNeeded').value);
    const supervisorNeeded = parseInt(document.getElementById('supervisorNeeded').value);
    const priorityGroup = document.querySelector('input[name="priorityGroup"]:checked')?.value;
    const specifiedExpertId = document.getElementById('specifiedExpertSelect')?.value;

    if (!projectName) {
        showNotification('error', '验证失败', '请输入项目名称');
        return;
    }

    if (isNaN(technicalNeeded) || technicalNeeded < 1) {
        showNotification('error', '验证失败', '技术组专家数量必须至少为1');
        return;
    }

    if (isNaN(supervisorNeeded) || supervisorNeeded < 1) {
        showNotification('error', '验证失败', '监督组专家数量必须至少为1');
        return;
    }

    if (!priorityGroup) {
        showNotification('error', '验证失败', '请选择优先抽取组别');
        return;
    }

    // 检查专家库是否有足够的专家
    const technicalExperts = getTechnicalExperts();
    const supervisorExperts = getSupervisorExperts();

    // 如果有指定专家，需要检查是否存在
    let specifiedExpert = null;
    if (specifiedExpertId) {
        const allExperts = getAllExperts();
        specifiedExpert = allExperts.find(e => e.id === specifiedExpertId);

        if (!specifiedExpert) {
            showNotification('error', '指定专家不存在', '您选择的指定专家不存在');
            return;
        }
    }

    if (technicalExperts.length < technicalNeeded) {
        showNotification('error', '专家数量不足', `技术组专家数量不足，需要 ${technicalNeeded} 位，但专家库中只有 ${technicalExperts.length} 位`);
        return;
    }

    if (supervisorExperts.length < supervisorNeeded) {
        showNotification('error', '专家数量不足', `监督组专家数量不足，需要 ${supervisorNeeded} 位，但专家库中只有 ${supervisorExperts.length} 位`);
        return;
    }

    // 保存设置
    drawState.projectName = projectName;
    drawState.drawTime = new Date(); // 记录抽签时间
    drawState.technicalNeeded = technicalNeeded;
    drawState.supervisorNeeded = supervisorNeeded;
    drawState.priorityGroup = priorityGroup;
    drawState.specifiedExpert = specifiedExpert;

    // 清空历史记录
    drawState.history = {
        technical: [],
        supervisor: []
    };

    // 显示加载动画并执行抽签
    showLoading('正在抽取专家...');

    setTimeout(() => {
        // 执行抽签
        performDraw();

        // 转到确认步骤
        goToConfirmStep();

        hideLoading();
    }, 1500);
}

// 执行抽签
function performDraw() {
    // 初始化可用专家池
    initExpertPool();

    // 初始化抽签结果
    drawState.results = {
        technical: [],
        supervisor: []
    };

    // 如果有指定专家，先添加到结果中（自动确认）
    if (drawState.specifiedExpert) {
        const expertCopy = {
            ...drawState.specifiedExpert,
            status: 'confirmed', // 指定专家自动确认
            isSpecified: true // 标记为指定专家
        };
        drawState.results.technical.push(expertCopy);

        // 从可用专家池中移除指定专家
        removeExpertFromPool(drawState.specifiedExpert);
    }

    // 抽取剩余的技术组专家
    const technicalNeeded = drawState.technicalNeeded - (drawState.specifiedExpert ? 1 : 0);
    drawTechnicalExperts(technicalNeeded);

    // 抽取监督组专家
    drawSupervisorExperts(drawState.supervisorNeeded);
}

// 初始化专家池
function initExpertPool() {
    const allExperts = getAllExperts();

    // 排除已经在历史记录中的专家
    const availableExperts = allExperts.filter(expert => {
        // 排除指定专家
        if (drawState.specifiedExpert && expert.id === drawState.specifiedExpert.id) {
            return false;
        }

        // 排除历史记录中的专家
        const inTechnicalHistory = drawState.history.technical.some(h => h.id === expert.id);
        const inSupervisorHistory = drawState.history.supervisor.some(h => h.id === expert.id);

        return !inTechnicalHistory && !inSupervisorHistory;
    });

    // 按类型分组
    const internalExperts = availableExperts.filter(e => e.type === '技术组-内科医疗组');
    const surgicalExperts = availableExperts.filter(e => e.type === '技术组-外科医疗组');
    const nonMedicalExperts = availableExperts.filter(e => e.type === '技术组-非医疗组');
    const supervisorExperts = availableExperts.filter(e => e.type === '监督组');

    // 根据优先组别设置抽取顺序
    let technicalOrder;
    if (drawState.priorityGroup === '内科医疗组') {
        technicalOrder = [internalExperts, surgicalExperts, nonMedicalExperts];
    } else if (drawState.priorityGroup === '外科医疗组') {
        technicalOrder = [surgicalExperts, internalExperts, nonMedicalExperts];
    } else {
        // "不优先"模式 - 将所有技术组专家合并为一个数组
        technicalOrder = [[...internalExperts, ...surgicalExperts, ...nonMedicalExperts]];
    }

    drawState.availableExperts = {
        technical: technicalOrder,
        supervisor: [...supervisorExperts]
    };
}

// 从专家池中移除专家
function removeExpertFromPool(expert) {
    // 移除技术组专家
    for (const group of drawState.availableExperts.technical) {
        const index = group.findIndex(e => e.id === expert.id);
        if (index !== -1) {
            group.splice(index, 1);
            return;
        }
    }

    // 移除监督组专家
    const supervisorIndex = drawState.availableExperts.supervisor.findIndex(e => e.id === expert.id);
    if (supervisorIndex !== -1) {
        drawState.availableExperts.supervisor.splice(supervisorIndex, 1);
    }
}

// 抽取技术组专家
function drawTechnicalExperts(count) {
    for (let i = 0; i < count; i++) {
        const expert = getNextTechnicalExpert();
        if (expert) {
            drawState.results.technical.push({
                ...expert,
                status: 'pending'
            });
        } else {
            // 如果专家不足，停止抽取
            showNotification('warning', '专家不足', '技术组专家数量不足，无法完成抽取');
            break;
        }
    }
}

// 获取下一个技术组专家
function getNextTechnicalExpert() {
    // 按照优先级顺序查找可用的专家
    for (const expertGroup of drawState.availableExperts.technical) {
        if (expertGroup.length > 0) {
            const randomIndex = Math.floor(Math.random() * expertGroup.length);
            const expert = expertGroup[randomIndex];

            // 从数组中移除
            expertGroup.splice(randomIndex, 1);

            return expert;
        }
    }

    return null;
}

// 抽取监督组专家
function drawSupervisorExperts(count) {
    for (let i = 0; i < count; i++) {
        const expert = getNextSupervisorExpert();
        if (expert) {
            drawState.results.supervisor.push({
                ...expert,
                status: 'pending'
            });
        } else {
            // 如果专家不足，停止抽取
            showNotification('warning', '专家不足', '监督组专家数量不足，无法完成抽取');
            break;
        }
    }
}

// 获取下一个监督组专家
function getNextSupervisorExpert() {
    const availableSupervisors = drawState.availableExperts.supervisor;

    if (availableSupervisors.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * availableSupervisors.length);
    const expert = availableSupervisors[randomIndex];

    // 从数组中移除
    availableSupervisors.splice(randomIndex, 1);

    return expert;
}

// 转到设置步骤
function goToSetup() {
    // 隐藏确认卡片，显示设置卡片
    document.getElementById('confirmCard').style.display = 'none';
    document.getElementById('setupCard').style.display = 'block';

    // 重新加载专家列表
    loadTechnicalExpertsForSelection();
}

// 转到确认步骤
function goToConfirmStep() {
    // 隐藏设置卡片，显示确认卡片
    document.getElementById('setupCard').style.display = 'none';
    document.getElementById('confirmCard').style.display = 'block';

    // 显示抽签结果
    renderDrawResults();

    // 检查是否所有专家都已确认
    checkAllExpertsConfirmed();
}

// 渲染抽签结果
function renderDrawResults() {
    const resultsDiv = document.getElementById('drawResults');
    if (!resultsDiv) return;

    let html = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            请逐一确认每位专家是否能够参加。如果专家无法参加，请点击"无法参加"按钮重新抽取替代专家。<br>
            <small>注意：无法参加的专家将保留在抽签记录中，系统会抽取新的替代专家。</small>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">抽签信息</h4>
            <p style="margin: 5px 0;"><strong>项目名称：</strong> ${drawState.projectName}</p>
            <p style="margin: 5px 0;"><strong>抽签时间：</strong> ${formatDateTime(drawState.drawTime)}</p>
            <p style="margin: 5px 0;"><strong>技术组专家：</strong> ${drawState.results.technical.length} 位</p>
            <p style="margin: 5px 0;"><strong>监督组专家：</strong> ${drawState.results.supervisor.length} 位</p>
            <p style="margin: 5px 0;"><strong>抽取模式：</strong> ${drawState.priorityGroup}</p>
        </div>
        
        <h3 style="margin-bottom: 15px; color: #2c3e50;">技术组专家 (${drawState.results.technical.length}位)</h3>
    `;

    if (drawState.specifiedExpert) {
        html += `
            <div class="alert alert-warning">
                <i class="fas fa-star"></i>
                注：指定专家已自动确认为参加。
            </div>
        `;
    }

    html += '<div class="draw-results">';

    // 显示技术组专家
    drawState.results.technical.forEach((expert, index) => {
        const isSpecified = drawState.specifiedExpert && expert.id === drawState.specifiedExpert.id;

        html += `
            <div class="expert-card technical ${isSpecified ? 'specified' : ''}">
                <div class="expert-card-header">
                    <div class="expert-name">${expert.name} ${isSpecified ? '<span style="color: #f39c12;">(指定)</span>' : ''}</div>
                    <div class="expert-id">${expert.id}</div>
                </div>
                <div class="expert-details">
                    <div class="expert-detail">
                        <span class="detail-label">科室:</span>
                        <span class="detail-value">${expert.department}</span>
                    </div>
                    <div class="expert-detail">
                        <span class="detail-label">类型:</span>
                        <span class="detail-value">${expert.type}</span>
                    </div>
                    <div class="expert-detail">
                        <span class="detail-label">电话:</span>
                        <span class="detail-value">${expert.phone}</span>
                    </div>
                </div>
                <div class="expert-status status-${expert.status}">
                    ${expert.status === 'pending' ? '待确认' : 
                      expert.status === 'confirmed' ? '确认参加' : '无法参加'}
                </div>
                ${expert.status === 'pending' ? `
                <div class="status-actions">
                    <button class="btn btn-success btn-sm confirm-expert-btn" data-group="technical" data-index="${index}">
                        <i class="fas fa-check"></i> 确认参加
                    </button>
                    <button class="btn btn-danger btn-sm reject-expert-btn" data-group="technical" data-index="${index}">
                        <i class="fas fa-times"></i> 无法参加
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';

    // 显示技术组无法参加的专家历史
    if (drawState.history.technical.length > 0) {
        html += `
            <div style="margin: 20px 0; padding: 15px; background: #fdedec; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #c0392b;">
                    <i class="fas fa-history"></i> 技术组无法参加专家 (${drawState.history.technical.length}位)
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${drawState.history.technical.map(expert => `
                        <span style="background: #fdedec; color: #c0392b; padding: 5px 10px; border-radius: 15px; font-size: 14px; border: 1px solid #f5b7b1;">
                            ${expert.name} (${expert.department})
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `<h3 style="margin: 30px 0 15px; color: #2c3e50;">监督组专家 (${drawState.results.supervisor.length}位)</h3>`;
    html += '<div class="draw-results">';

    // 显示监督组专家
    drawState.results.supervisor.forEach((expert, index) => {
        html += `
            <div class="expert-card supervisor">
                <div class="expert-card-header">
                    <div class="expert-name">${expert.name}</div>
                    <div class="expert-id">${expert.id}</div>
                </div>
                <div class="expert-details">
                    <div class="expert-detail">
                        <span class="detail-label">科室:</span>
                        <span class="detail-value">${expert.department}</span>
                    </div>
                    <div class="expert-detail">
                        <span class="detail-label">类型:</span>
                        <span class="detail-value">${expert.type}</span>
                    </div>
                    <div class="expert-detail">
                        <span class="detail-label">电话:</span>
                        <span class="detail-value">${expert.phone}</span>
                    </div>
                </div>
                <div class="expert-status status-${expert.status}">
                    ${expert.status === 'pending' ? '待确认' : 
                      expert.status === 'confirmed' ? '确认参加' : '无法参加'}
                </div>
                ${expert.status === 'pending' ? `
                <div class="status-actions">
                    <button class="btn btn-success btn-sm confirm-expert-btn" data-group="supervisor" data-index="${index}">
                        <i class="fas fa-check"></i> 确认参加
                    </button>
                    <button class="btn btn-danger btn-sm reject-expert-btn" data-group="supervisor" data-index="${index}">
                        <i class="fas fa-times"></i> 无法参加
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';

    // 显示监督组无法参加的专家历史
    if (drawState.history.supervisor.length > 0) {
        html += `
            <div style="margin: 20px 0; padding: 15px; background: #fdedec; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #c0392b;">
                    <i class="fas fa-history"></i> 监督组无法参加专家 (${drawState.history.supervisor.length}位)
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${drawState.history.supervisor.map(expert => `
                        <span style="background: #fdedec; color: #c0392b; padding: 5px 10px; border-radius: 15px; font-size: 14px; border: 1px solid #f5b7b1;">
                            ${expert.name} (${expert.department})
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    resultsDiv.innerHTML = html;

    // 绑定确认/拒绝按钮事件
    bindExpertConfirmationEvents();
}

// 绑定专家确认事件
function bindExpertConfirmationEvents() {
    // 确认参加按钮
    document.querySelectorAll('.confirm-expert-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = e.target.getAttribute('data-group');
            const index = parseInt(e.target.getAttribute('data-index'));

            confirmExpertParticipation(group, index);
        });
    });

    // 无法参加按钮
    document.querySelectorAll('.reject-expert-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const group = e.target.getAttribute('data-group');
            const index = parseInt(e.target.getAttribute('data-index'));

            const expert = group === 'technical' ? drawState.results.technical[index] : drawState.results.supervisor[index];

            const confirmed = await confirmDialog({
                title: '确认无法参加',
                message: `确定专家 "${expert.name}" 无法参加吗？`,
                detail: '该专家将被记录为无法参加，系统将重新抽取一位替代专家。'
            });

            if (confirmed) {
                rejectExpertParticipation(group, index);
            }
        });
    });
}

// 确认专家参加
function confirmExpertParticipation(group, index) {
    if (group === 'technical') {
        drawState.results.technical[index].status = 'confirmed';
    } else {
        drawState.results.supervisor[index].status = 'confirmed';
    }

    // 重新渲染，移除操作按钮
    renderDrawResults();
    checkAllExpertsConfirmed();
}

// 拒绝专家参加并重新抽取
function rejectExpertParticipation(group, index) {
    showLoading('重新抽取专家...');

    setTimeout(() => {
        // 保存无法参加的专家到历史记录
        const rejectedExpert = group === 'technical' ?
            drawState.results.technical[index] :
            drawState.results.supervisor[index];

        // 标记为拒绝状态
        if (group === 'technical') {
            drawState.results.technical[index].status = 'rejected';
            // 保存到历史记录
            drawState.history.technical.push({
                ...rejectedExpert,
                status: 'rejected',
                rejectedTime: new Date()
            });
        } else {
            drawState.results.supervisor[index].status = 'rejected';
            // 保存到历史记录
            drawState.history.supervisor.push({
                ...rejectedExpert,
                status: 'rejected',
                rejectedTime: new Date()
            });
        }

        // 获取替代专家
        let replacementExpert = null;

        if (group === 'technical') {
            // 获取替代的技术组专家
            replacementExpert = getNextTechnicalExpert();

            if (replacementExpert) {
                // 添加新的专家记录（而不是替换原来的）
                drawState.results.technical.push({
                    ...replacementExpert,
                    status: 'pending'
                });
            } else {
                showNotification('error', '抽取失败', '没有可用的替代专家');
            }
        } else {
            // 获取替代的监督组专家
            replacementExpert = getNextSupervisorExpert();

            if (replacementExpert) {
                // 添加新的专家记录
                drawState.results.supervisor.push({
                    ...replacementExpert,
                    status: 'pending'
                });
            } else {
                showNotification('error', '抽取失败', '没有可用的替代专家');
            }
        }

        hideLoading();
        renderDrawResults();
        checkAllExpertsConfirmed();
    }, 1000);
}

// 检查是否所有专家都已确认
function checkAllExpertsConfirmed() {
    // 检查是否有待确认的专家
    const pendingTechnical = drawState.results.technical.filter(e => e.status === 'pending');
    const pendingSupervisor = drawState.results.supervisor.filter(e => e.status === 'pending');
    const allConfirmed = pendingTechnical.length === 0 && pendingSupervisor.length === 0;

    const completeBtn = document.getElementById('completeDrawBtn');
    if (completeBtn) {
        completeBtn.disabled = !allConfirmed;

        if (allConfirmed) {
            completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> 完成抽签';
        } else {
            const pendingCount = pendingTechnical.length + pendingSupervisor.length;
            completeBtn.innerHTML = `<i class="fas fa-clock"></i> 完成抽签 (还需确认 ${pendingCount} 位专家)`;
        }
    }
}

// 完成抽签
function completeDraw() {
    // 隐藏确认卡片，显示完成卡片
    document.getElementById('confirmCard').style.display = 'none';
    document.getElementById('completeCard').style.display = 'block';

    // 显示最终结果
    renderFinalResults();

    showNotification('success', '抽签完成', '本次专家抽签已全部完成，可以导出结果');
}

// 渲染最终结果
function renderFinalResults() {
    const finalResultsDiv = document.getElementById('finalResults');
    if (!finalResultsDiv) return;

    const confirmedTechnical = drawState.results.technical.filter(e => e.status === 'confirmed');
    const confirmedSupervisor = drawState.results.supervisor.filter(e => e.status === 'confirmed');
    const rejectedTechnical = drawState.results.technical.filter(e => e.status === 'rejected');
    const rejectedSupervisor = drawState.results.supervisor.filter(e => e.status === 'rejected');

    let html = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            <div>
                <h4>抽签完成！</h4>
                <p><strong>项目名称：</strong> ${drawState.projectName}</p>
                <p><strong>抽签时间：</strong> ${formatDateTime(drawState.drawTime)}</p>
                <p><strong>抽取模式：</strong> ${drawState.priorityGroup}</p>
                <p><strong>技术组专家：</strong> ${confirmedTechnical.length} 位确认参加，${rejectedTechnical.length} 位无法参加</p>
                <p><strong>监督组专家：</strong> ${confirmedSupervisor.length} 位确认参加，${rejectedSupervisor.length} 位无法参加</p>
                <p><strong>抽签结果已确定，可以导出。</strong></p>
            </div>
        </div>
        
        <h3 style="margin-bottom: 15px; color: #2c3e50;">最终抽签结果</h3>
        <div class="draw-results">
    `;

    // 显示所有确认的专家
    [...confirmedTechnical, ...confirmedSupervisor].forEach(expert => {
        const isTechnical = expert.type.includes('技术组');
        const isSpecified = drawState.specifiedExpert && expert.id === drawState.specifiedExpert.id;

        html += `
            <div class="expert-card ${isTechnical ? 'technical' : 'supervisor'}">
                <div class="expert-card-header">
                    <div class="expert-name">${expert.name} ${isSpecified ? '<span style="color: #f39c12;">(指定)</span>' : ''}</div>
                    <div class="expert-id">${expert.id}</div>
                </div>
                <div class="expert-details">
                    <div class="expert-detail">
                        <span class="detail-label">科室:</span>
                        <span class="detail-value">${expert.department}</span>
                    </div>
                    <div class="expert-detail">
                        <span class="detail-label">类型:</span>
                        <span class="detail-value">${expert.type}</span>
                    </div>
                    <div class="expert-detail">
                        <span class="detail-label">电话:</span>
                        <span class="detail-value">${expert.phone}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    // 显示无法参加的专家
    if (rejectedTechnical.length > 0 || rejectedSupervisor.length > 0) {
        html += `
            <h3 style="margin: 30px 0 15px; color: #e74c3c;">
                <i class="fas fa-times-circle"></i> 无法参加的专家
            </h3>
            <div class="draw-results">
        `;

        [...rejectedTechnical, ...rejectedSupervisor].forEach(expert => {
            const isTechnical = expert.type.includes('技术组');

            html += `
                <div class="expert-card ${isTechnical ? 'technical' : 'supervisor'}">
                    <div class="expert-card-header">
                        <div class="expert-name">${expert.name}</div>
                        <div class="expert-id">${expert.id}</div>
                    </div>
                    <div class="expert-details">
                        <div class="expert-detail">
                            <span class="detail-label">科室:</span>
                            <span class="detail-value">${expert.department}</span>
                        </div>
                        <div class="expert-detail">
                            <span class="detail-label">类型:</span>
                            <span class="detail-value">${expert.type}</span>
                        </div>
                        <div class="expert-detail">
                            <span class="detail-label">电话:</span>
                            <span class="detail-value">${expert.phone}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    finalResultsDiv.innerHTML = html;
}

// 重新开始抽签
function restartDraw() {
    // 重置抽签状态
    drawState = {
        projectName: '',
        drawTime: null,
        specifiedExpert: null,
        priorityGroup: '',
        technicalNeeded: 0,
        supervisorNeeded: 0,
        currentStep: 0,
        results: {
            technical: [],
            supervisor: []
        },
        history: {
            technical: [],
            supervisor: []
        },
        availableExperts: {
            technical: [],
            supervisor: []
        }
    };

    // 重置表单
    document.getElementById('projectName').value = '';
    document.getElementById('technicalNeeded').value = '5';
    document.getElementById('supervisorNeeded').value = '2';
    document.querySelector('input[name="priorityGroup"][value="内科医疗组"]').checked = true;
    document.getElementById('specifiedExpertSelect').value = '';
    document.getElementById('expertSearchInput').value = '';

    // 回到第一步
    document.getElementById('completeCard').style.display = 'none';
    document.getElementById('setupCard').style.display = 'block';

    // 重新加载专家列表
    loadTechnicalExpertsForSelection();

    showNotification('info', '重新开始', '抽签流程已重置，可以开始新的抽签');
}

// 导出抽签结果
function exportDrawResults() {
    showLoading('正在导出抽签结果...');

    const confirmedTechnical = drawState.results.technical.filter(e => e.status === 'confirmed');
    const confirmedSupervisor = drawState.results.supervisor.filter(e => e.status === 'confirmed');
    const allConfirmedExperts = [...confirmedTechnical, ...confirmedSupervisor];

    // 准备导出数据
    const exportData = [];


    // 添加确认参加的专家
    allConfirmedExperts.forEach(expert => {
        const isSpecified = drawState.specifiedExpert && expert.id === drawState.specifiedExpert.id;
        exportData.push({
            '专家编号': expert.id,
            '姓名': expert.name,
            '联系号码': expert.phone,
            '科室': expert.department,
            '类型': expert.type,
            '是否参加': '确认参加',
            '备注': isSpecified ? '指定专家' : ''
        });
    });

    // 添加空行
    exportData.push({
        '专家编号': '',
        '姓名': '',
        '联系号码': '',
        '科室': '',
        '类型': '',
        '是否参加': '',
        '备注': ''
    });

    // 项目信息
    exportData.push({
        '专家编号': '项目名称',
        '姓名': drawState.projectName,
        '联系号码': `抽签时间: ${formatDateTime(drawState.drawTime)}`,
        '科室': `抽取模式: ${drawState.priorityGroup}`,
        '类型': `技术组人数: ${drawState.technicalNeeded}`,
        '是否参加': `监督组人数: ${drawState.supervisorNeeded}`,
        '备注': ''
    });

    // 添加无法参加的专家
    const rejectedTechnical = drawState.results.technical.filter(e => e.status === 'rejected');
    const rejectedSupervisor = drawState.results.supervisor.filter(e => e.status === 'rejected');
    const allRejectedExperts = [...rejectedTechnical, ...rejectedSupervisor];

    if (allRejectedExperts.length > 0) {
        // 标题行
        exportData.push({
            '专家编号': '无法参加的专家',
            '姓名': '',
            '联系号码': '',
            '科室': '',
            '类型': '',
            '是否参加': '',
            '备注': ''
        });

        allRejectedExperts.forEach(expert => {
            exportData.push({
                '专家编号': expert.id,
                '姓名': expert.name,
                '联系号码': expert.phone,
                '科室': expert.department,
                '类型': expert.type,
                '是否参加': '无法参加',
                '备注': ''
            });
        });
    }

    // 导出数据
    setTimeout(() => {
        // 导出为CSV
        let csvContent = "data:text/csv;charset=utf-8,\ufeff";

        // 添加表头
        const headers = ["专家编号", "姓名", "联系号码", "科室", "类型", "是否参加", "备注"];
        csvContent += headers.join(",") + "\n";

        // 添加数据行
        exportData.forEach(row => {
            const rowData = [
                row['专家编号'] || '',
                row['姓名'] || '',
                row['联系号码'] || '',
                row['科室'] || '',
                row['类型'] || '',
                row['是否参加'] || '',
                row['备注'] || ''
            ];
            csvContent += rowData.join(",") + "\n";
        });

        // 创建下载链接
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `抽签结果_${drawState.projectName}_${formatDateTime(drawState.drawTime).replace(/[: ]/g, '-')}.csv`);
        document.body.appendChild(link);

        // 触发下载
        link.click();
        document.body.removeChild(link);

        hideLoading();
        showNotification('success', '导出成功', '抽签结果已成功导出为CSV文件');
    }, 500);
}

// 导出抽签结果为JSON
function exportDrawResultsToJSON() {
    showLoading('正在导出抽签结果...');

    const confirmedTechnical = drawState.results.technical.filter(e => e.status === 'confirmed');
    const confirmedSupervisor = drawState.results.supervisor.filter(e => e.status === 'confirmed');
    const allConfirmedExperts = [...confirmedTechnical, ...confirmedSupervisor];

    // 准备导出数据
    const exportData = {
        projectInfo: {
            projectName: drawState.projectName,
            drawTime: formatDateTime(drawState.drawTime),
            priorityMode: drawState.priorityGroup,
            technicalNeeded: drawState.technicalNeeded,
            supervisorNeeded: drawState.supervisorNeeded
        },
        confirmedExperts: allConfirmedExperts.map(expert => ({
            id: expert.id,
            name: expert.name,
            phone: expert.phone,
            department: expert.department,
            type: expert.type,
            isSpecified: drawState.specifiedExpert && expert.id === drawState.specifiedExpert.id
        }))
    };

    setTimeout(() => {
        try {
            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `抽签结果_${drawState.projectName}_${formatDateTime(drawState.drawTime).replace(/[: ]/g, '-')}.json`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 100);

            hideLoading();
            showNotification('success', '导出成功', '抽签结果已成功导出为JSON文件');
        } catch (error) {
            hideLoading();
            showNotification('error', '导出失败', '导出过程中出现错误：' + error.message);
        }
    }, 500);
}

// 导出抽签结果为PDF
function exportDrawResultsToPDF() {
    showLoading('正在生成PDF文件...');

    // 创建临时容器来渲染PDF内容
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 20px;
        background: white;
        font-family: 'Microsoft YaHei', 'SimHei', 'SimSun', sans-serif;
        box-sizing: border-box;
    `;

    // 准备数据
    const confirmedTechnical = drawState.results.technical.filter(e => e.status === 'confirmed');
    const confirmedSupervisor = drawState.results.supervisor.filter(e => e.status === 'confirmed');
    const rejectedTechnical = drawState.results.technical.filter(e => e.status === 'rejected');
    const rejectedSupervisor = drawState.results.supervisor.filter(e => e.status === 'rejected');

    // 构建HTML内容
    tempContainer.innerHTML = generatePDFHTML(
        confirmedTechnical,
        confirmedSupervisor,
        rejectedTechnical,
        rejectedSupervisor
    );

    document.body.appendChild(tempContainer);

    // 使用html2canvas将HTML转换为图片
    html2canvas(tempContainer, {
        scale: 2, // 提高分辨率
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 900,
        height: tempContainer.scrollHeight,
        windowWidth: 800,
        onclone: function(clonedDoc) {
            // 确保克隆的文档也有正确的字体
            const clonedContainer = clonedDoc.querySelector('#temp-pdf-container');
            if (clonedContainer) {
                clonedContainer.style.fontFamily = "'Microsoft YaHei', 'SimHei', 'SimSun', sans-serif";
            }
        }
    }).then(canvas => {
        // 创建PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // 将canvas分成多页
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // 计算图片在PDF中的尺寸
        const pdfImageWidth = pageWidth - 30; // 留边距
        const pdfImageHeight = (imgHeight * pdfImageWidth) / imgWidth;

        // 如果图片高度超过一页，需要分页
        let position = 0;
        const pageHeightPixels = pageHeight * 3.78; // 转换为像素

        while (position < pdfImageHeight) {
            if (position > 0) {
                pdf.addPage();
            }

            // 计算当前页要显示的部分
            const srcY = position * (imgHeight / pdfImageHeight);
            const srcHeight = Math.min(
                pageHeightPixels * (imgHeight / pdfImageHeight),
                imgHeight - srcY
            );

            // 创建临时canvas来裁剪当前页的内容
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');

            tempCanvas.width = imgWidth;
            tempCanvas.height = srcHeight;

            // 复制当前页的内容
            ctx.drawImage(
                canvas,
                0, srcY, imgWidth, srcHeight,
                0, 0, imgWidth, srcHeight
            );

            // 添加到PDF
            const imgData = tempCanvas.toDataURL('image/jpeg', 0.9);
            pdf.addImage(imgData, 'JPEG', 10, 10, pdfImageWidth, Math.min(pageHeight - 20, pdfImageHeight - position));

            position += pageHeight - 20;
        }

        // 保存PDF
        const fileName = `抽签结果_${drawState.projectName}_${formatDateTime(drawState.drawTime).replace(/[: ]/g, '-')}.pdf`;
        pdf.save(fileName);

        // 清理临时元素
        document.body.removeChild(tempContainer);

        hideLoading();
        showNotification('success', 'PDF导出成功', '抽签结果已保存为PDF文件');

    }).catch(error => {
        console.error('生成PDF失败:', error);
        document.body.removeChild(tempContainer);
        hideLoading();

        // 如果html2canvas失败，尝试使用纯文本方式
        tryFallbackPDFExport();
    });
}

// 生成PDF的HTML内容
function generatePDFHTML(confirmedTechnical, confirmedSupervisor, rejectedTechnical, rejectedSupervisor) {
    return `
        <div id="temp-pdf-container" style="width: 900px;font-family: 'Microsoft YaHei', 'SimHei', 'SimSun', sans-serif;">
            <!-- 标题 -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px;">
                <h1 style="color: #2c3e50; margin-bottom: 10px; font-size: 30px;">专家抽签结果报告</h1>
                <div style="font-size: 25px; color: #030307;">${drawState.projectName}</div>
            </div>
            
            <!-- 项目信息 -->
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid #3498db; width: 900px">
                <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px;">抽签项目信息</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; width: 120px; color: #555;"><strong>项目名称：</strong></td>
                        <td style="padding: 8px 0;">${drawState.projectName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>抽签时间：</strong></td>
                        <td style="padding: 8px 0;">${formatDateTime(drawState.drawTime)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>抽取模式：</strong></td>
                        <td style="padding: 8px 0;">${drawState.priorityGroup}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>技术组专家：</strong></td>
                        <td style="padding: 8px 0;">${drawState.technicalNeeded} 位</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>监督组专家：</strong></td>
                        <td style="padding: 8px 0;">${drawState.supervisorNeeded} 位</td>
                    </tr>
                    ${drawState.specifiedExpert ? `
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>指定专家：</strong></td>
                        <td style="padding: 8px 0; color: #f39c12;">
                            ${drawState.specifiedExpert.name} (${drawState.specifiedExpert.department})
                        </td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            
            <!-- 确认参加的专家 -->
            <div style="margin-bottom: 30px;">
                <h2 style="color: #27ae60; margin-bottom: 20px; font-size: 22px; padding-bottom: 10px; border-bottom: 2px solid #27ae60;">
                    确认参加的专家
                </h2>
                
                <!-- 技术组专家 -->
                ${confirmedTechnical.length > 0 ? `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">
                        技术组专家（${confirmedTechnical.length}位）
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 15px;">
                        <thead style="background: #2c3e50; color: white;">
                            <tr>
                                <th style="padding: 10px 6px; text-align: left; width: 20%;">姓名</th>
                                <th style="padding: 10px 6px; text-align: left; width: 30%;">科室</th>
                                <th style="padding: 10px 6px; text-align: left; width: 30%;">类型</th>
                                <th style="padding: 10px 6px; text-align: left; width: 20%;">联系电话</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${confirmedTechnical.map((expert, index) => `
                                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : 'background: white;'}">
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">
                                        ${expert.name} 
                                        ${drawState.specifiedExpert && expert.id === drawState.specifiedExpert.id ?
                                    '<span style="color: #f39c12; font-size: 12px;">(指定)</span>' : ''}
                                    </td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.department}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.type}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.phone}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div style="text-align: center; padding: 20px; color: #7f8c8d;">无确认参加的技术组专家</div>'}
                
                <!-- 监督组专家 -->
                ${confirmedSupervisor.length > 0 ? `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">
                        监督组专家（${confirmedSupervisor.length}位）
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 15px;">
                        <thead style="background: #9b59b6; color: white;">
                            <tr>
                                <th style="padding: 10px 6px; text-align: left; width: 20%;">姓名</th>
                                <th style="padding: 10px 6px; text-align: left; width: 30%;">科室</th>
                                <th style="padding: 10px 6px; text-align: left; width: 30%;">类型</th>
                                <th style="padding: 10px 6px; text-align: left; width: 20%;">联系电话</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${confirmedSupervisor.map((expert, index) => `
                                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : 'background: white;'}">
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.name}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.department}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.type}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.phone}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div style="text-align: center; padding: 20px; color: #7f8c8d;">无确认参加的监督组专家</div>'}
            </div>
            
            <!-- 无法参加的专家 -->
            ${(rejectedTechnical.length > 0 || rejectedSupervisor.length > 0) ? `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #e74c3c; margin-bottom: 20px; font-size: 22px; padding-bottom: 10px; border-bottom: 2px solid #e74c3c;">
                    无法参加的专家
                </h2>
                
                <!-- 技术组无法参加专家 -->
                ${rejectedTechnical.length > 0 ? `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">
                        技术组专家（${rejectedTechnical.length}位）
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 15px;">
                        <thead style="background: #e74c3c; color: white;">
                            <tr>
                                <th style="padding: 10px 6px; text-align: left; width: 30%;">姓名</th>
                                <th style="padding: 10px 6px; text-align: left; width: 35%;">科室</th>
                                <th style="padding: 10px 6px; text-align: left; width: 35%;">类型</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rejectedTechnical.map((expert, index) => `
                                <tr style="${index % 2 === 0 ? 'background: #fdedec;' : 'background: white;'}">
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.name}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.department}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.type}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <!-- 监督组无法参加专家 -->
                ${rejectedSupervisor.length > 0 ? `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">
                        监督组专家（${rejectedSupervisor.length}位）
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 15px;">
                        <thead style="background: #e74c3c; color: white;">
                            <tr>
                                <th style="padding: 10px 6px; text-align: left; width: 30%;">姓名</th>
                                <th style="padding: 10px 6px; text-align: left; width: 35%;">科室</th>
                                <th style="padding: 10px 6px; text-align: left; width: 35%;">类型</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rejectedSupervisor.map((expert, index) => `
                                <tr style="${index % 2 === 0 ? 'background: #fdedec;' : 'background: white;'}">
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.name}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.department}</td>
                                    <td style="padding: 8px 6px; border-bottom: 1px solid #eee;">${expert.type}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
    `;
}

// 备用方案：如果html2canvas失败，使用纯文本方式
function tryFallbackPDFExport() {
    try {
        showNotification('warning', '使用备用方案', '正在使用纯文本方式生成PDF...');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const confirmedTechnical = drawState.results.technical.filter(e => e.status === 'confirmed');
        const confirmedSupervisor = drawState.results.supervisor.filter(e => e.status === 'confirmed');

        // 只能添加英文和数字
        pdf.setFont('helvetica');
        pdf.setFontSize(16);
        pdf.text('Draw Results Report', 20, 20);

        pdf.setFontSize(12);
        pdf.text(`Project: ${drawState.projectName}`, 20, 35);
        pdf.text(`Draw Time: ${formatDateTime(drawState.drawTime)}`, 20, 45);
        pdf.text(`Mode: ${drawState.priorityGroup}`, 20, 55);

        // 添加确认的专家（只能显示ID和数字信息）
        let yPos = 70;
        pdf.text('Confirmed Experts:', 20, yPos);
        yPos += 10;

        confirmedTechnical.forEach(expert => {
            pdf.text(`${expert.id} - ${expert.name} (${expert.department})`, 25, yPos);
            yPos += 7;
        });

        confirmedSupervisor.forEach(expert => {
            pdf.text(`${expert.id} - ${expert.name} (${expert.department})`, 25, yPos);
            yPos += 7;
        });

        const fileName = `draw_results_${drawState.projectName}_${Date.now()}.pdf`;
        pdf.save(fileName);

        hideLoading();
        showNotification('info', 'PDF导出完成', '由于浏览器限制，使用了纯文本格式');

    } catch (error) {
        hideLoading();
        showNotification('error', '导出失败', '无法生成PDF文件，请使用CSV导出功能');
    }
}