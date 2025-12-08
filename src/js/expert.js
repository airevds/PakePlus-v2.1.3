/**
 * 专家管理模块
 * 创建时间：2025年12月3日
 * 作用：专家数据的增删改查、导入导出功能
 * 作者：陶锵
 */

// 专家数据存储 - 从localStorage加载
let experts = [];
let currentPage = 1;
const expertsPerPage = 10;

// 初始化专家管理模块
function initExpertManagement() {
    const container = document.getElementById('expert-management');

    container.innerHTML = `
        <div class="card">
            <h2 class="card-title">专家库管理</h2>
            <div class="form-row">
                <div class="form-col">
                    <button id="addExpertBtn" class="btn btn-primary">
                        <i class="fas fa-plus"></i> 添加专家
                    </button>
                    <button id="importExpertBtn" class="btn btn-success">
                        <i class="fas fa-file-import"></i> 导入JSON
                    </button>
                    <button id="exportExpertBtn" class="btn btn-warning">
                        <i class="fas fa-file-export"></i> 导出JSON
                    </button>
                    <button id="downloadTemplateBtn" class="btn btn-info">
                        <i class="fas fa-download"></i> 下载模板
                    </button>
                    <button id="clearExpertsBtn" class="btn btn-danger" title="清除所有专家数据">
                        <i class="fas fa-trash-alt"></i> 清空
                    </button>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <input type="text" id="searchExpert" placeholder="输入姓名、科室或编号搜索专家..." class="search-input">
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table id="expertsTable">
                    <thead>
                        <tr>
                            <th>专家编号</th>
                            <th>姓名</th>
                            <th>联系号码</th>
                            <th>科室</th>
                            <th>类型</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="expertsTableBody">
                        <!-- 专家数据将通过JS动态加载 -->
                    </tbody>
                </table>
            </div>
            
            <div class="pagination" id="pagination">
                <!-- 分页将通过JS动态加载 -->
            </div>
        </div>
    `;

    // 加载专家数据
    loadExperts();

    // 绑定事件
    bindExpertEvents();
}

// 加载专家数据
function loadExperts() {
    showLoading('加载专家数据...');

    setTimeout(() => {
        try {
            const storedExperts = localStorage.getItem('expert-draw-system-experts');
            if (storedExperts) {
                experts = JSON.parse(storedExperts);
            } else {
                // 如果没有数据，只创建少量示例数据
                experts = [
                    {
                        id: generateId(),
                        name: "张明",
                        phone: "13800138001",
                        department: "心血管内科",
                        type: "技术组-内科医疗组"
                    },
                    {
                        id: generateId(),
                        name: "李华",
                        phone: "13800138002",
                        department: "骨科",
                        type: "技术组-外科医疗组"
                    },
                    {
                        id: generateId(),
                        name: "陈静",
                        phone: "13800138003",
                        department: "监察科",
                        type: "监督组"
                    }
                ];
                saveExperts();
            }

            renderExpertsTable();
            hideLoading();
        } catch (error) {
            console.error('加载专家数据失败:', error);
            experts = [];
            renderExpertsTable();
            hideLoading();
            showNotification('error', '加载失败', '加载专家数据时出错');
        }
    }, 500);
}

// 保存专家数据到本地存储
function saveExperts() {
    try {
        localStorage.setItem('expert-draw-system-experts', JSON.stringify(experts));
        return true;
    } catch (error) {
        console.error('保存专家数据失败:', error);
        showNotification('error', '保存失败', '无法保存专家数据到本地存储');
        return false;
    }
}

// 渲染专家表格
function renderExpertsTable(searchTerm = '') {
    const tableBody = document.getElementById('expertsTableBody');
    if (!tableBody) return;

    // 过滤专家数据
    let filteredExperts = experts;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredExperts = experts.filter(expert =>
            expert.name.toLowerCase().includes(term) ||
            expert.id.toLowerCase().includes(term) ||
            expert.department.toLowerCase().includes(term) ||
            expert.type.toLowerCase().includes(term)
        );
    }

    // 分页计算
    const totalPages = Math.ceil(filteredExperts.length / expertsPerPage);
    const startIndex = (currentPage - 1) * expertsPerPage;
    const endIndex = startIndex + expertsPerPage;
    const paginatedExperts = filteredExperts.slice(startIndex, endIndex);

    // 清空表格
    tableBody.innerHTML = '';

    if (paginatedExperts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-user-times" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p>没有找到专家数据</p>
                    ${searchTerm ? '<p>尝试使用不同的搜索词</p>' : '<p>点击"添加专家"按钮添加新专家</p>'}
                </td>
            </tr>
        `;
    } else {
        // 填充表格数据
        paginatedExperts.forEach(expert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expert.id}</td>
                <td>${expert.name}</td>
                <td>${expert.phone}</td>
                <td>${expert.department}</td>
                <td>
                    <span class="expert-type ${expert.type.includes('技术组') ? 'technical' : 'supervisor'}">
                        ${expert.type}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-id="${expert.id}">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="action-btn delete-btn" data-id="${expert.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 渲染分页
    renderPagination(filteredExperts.length, totalPages);
}

// 渲染分页控件
function renderPagination(totalExperts, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = `
            <div class="page-info">共 ${totalExperts} 位专家</div>
        `;
        return;
    }

    let paginationHTML = `
        <button class="page-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> 上一页
        </button>
    `;

    // 显示页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }

    paginationHTML += `
        <button class="page-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>
            下一页 <i class="fas fa-chevron-right"></i>
        </button>
        <div class="page-info">共 ${totalExperts} 位专家，第 ${currentPage} / ${totalPages} 页</div>
    `;

    pagination.innerHTML = paginationHTML;

    // 绑定分页事件
    bindPaginationEvents();
}

// 绑定分页事件
function bindPaginationEvents() {
    // 上一页
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderExpertsTable(document.getElementById('searchExpert')?.value || '');
        }
    });

    // 下一页
    document.getElementById('nextPage')?.addEventListener('click', () => {
        const totalExperts = experts.length;
        const totalPages = Math.ceil(totalExperts / expertsPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            renderExpertsTable(document.getElementById('searchExpert')?.value || '');
        }
    });

    // 页码点击
    document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = parseInt(e.target.getAttribute('data-page'));
            if (page !== currentPage) {
                currentPage = page;
                renderExpertsTable(document.getElementById('searchExpert')?.value || '');
            }
        });
    });
}

// 绑定专家模块事件
function bindExpertEvents() {
    // 添加专家按钮
/*
    document.getElementById('addExpertBtn')?.addEventListener('click', showAddExpertForm);
*/
document.getElementById('addExpertBtn')?.addEventListener('click', () => {
        showAddExpertForm();
    });

    // 导入JSON按钮
    document.getElementById('importExpertBtn')?.addEventListener('click', importExpertsFromJSON);

    // 导出JSON按钮
    document.getElementById('exportExpertBtn')?.addEventListener('click', exportExpertsToJSON);

    // 导出JSON模版按钮
    document.getElementById('downloadTemplateBtn')?.addEventListener('click', exportExampleJSON);

    // 清空按钮
    document.getElementById('clearExpertsBtn')?.addEventListener('click', clearAllExperts);

    // 搜索输入框
    const searchInput = document.getElementById('searchExpert');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentPage = 1;
            renderExpertsTable(e.target.value);
        }, 300));
    }

    // 使用事件委托处理编辑和删除按钮
    setTimeout(() => {
        const tableBody = document.getElementById('expertsTableBody');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                const expertId = target.getAttribute('data-id');
                if (!expertId) return;

                if (target.classList.contains('edit-btn')) {
                    editExpert(expertId);
                } else if (target.classList.contains('delete-btn')) {
                    deleteExpert(expertId);
                }
            });
        }
    }, 500);
}

// 独立的自定义模态框函数
function showAddExpertForm(expert = null) {
    const isEdit = expert !== null;

    // 创建模态框容器
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal active';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        width: 500px;
        max-width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    `;

    // 表单HTML
    modalContent.innerHTML = `
        <h2 style="margin-top: 0; margin-bottom: 20px;">${isEdit ? '编辑专家' : '添加专家'}</h2>
        
        <form id="dialogExpertForm">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">姓名 *</label>
                <input type="text" id="dialogName" value="${isEdit ? (expert.name || '') : ''}" 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">手机号 *</label>
                <input type="tel" id="dialogPhone" value="${isEdit ? (expert.phone || '') : ''}" 
                       pattern="[0-9]{11}" placeholder="11位手机号码"
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">科室 *</label>
                <input type="text" id="dialogDepartment" value="${isEdit ? (expert.department || '') : ''}" 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">类型 *</label>
                <select id="dialogType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
                    <option value="">请选择类型</option>
                    <option value="技术组-内科医疗组" ${isEdit && expert.type === '技术组-内科医疗组' ? 'selected' : ''}>技术组-内科医疗组</option>
                    <option value="技术组-外科医疗组" ${isEdit && expert.type === '技术组-外科医疗组' ? 'selected' : ''}>技术组-外科医疗组</option>
                    <option value="技术组-非医疗组" ${isEdit && expert.type === '技术组-非医疗组' ? 'selected' : ''}>技术组-非医疗组</option>
                    <option value="监督组" ${isEdit && expert.type === '监督组' ? 'selected' : ''}>监督组</option>
                </select>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" id="dialogCancel" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    取消
                </button>
                <button type="submit" id="dialogSubmit" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    提交
                </button>
            </div>
        </form>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // 事件处理
    const closeModal = () => {
        document.body.removeChild(modalOverlay);
    };

    // 取消按钮
    modalContent.querySelector('#dialogCancel').addEventListener('click', closeModal);

    // 外部点击关闭
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // 表单提交
    modalContent.querySelector('#dialogExpertForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('dialogName').value.trim();
        const phone = document.getElementById('dialogPhone').value.trim();
        const department = document.getElementById('dialogDepartment').value.trim();
        const type = document.getElementById('dialogType').value;

        // 验证
        if (!name || !phone || !department || !type) {
            alert('请填写所有必填字段');
            return;
        }

        if (!/^[0-9]{11}$/.test(phone)) {
            alert('请输入有效的11位手机号码');
            return;
        }

        if (isEdit) {
            const index = experts.findIndex(e => e.id === expert.id);
            if (index !== -1) {
                experts[index] = {
                    ...experts[index],
                    name,
                    phone,
                    department,
                    type
                };

                saveExperts();
                renderExpertsTable(document.getElementById('searchExpert')?.value || '');
                showNotification('success', '更新成功', `专家 "${name}" 已更新`);
            }
        } else {
            const newExpert = {
                id: generateId(),
                name,
                phone,
                department,
                type
            };

            experts.unshift(newExpert);
            saveExperts();
            currentPage = 1;
            renderExpertsTable(document.getElementById('searchExpert')?.value || '');
            showNotification('success', '添加成功', `专家 "${name}" 已添加到专家库`);
        }

        closeModal();
    });
}

// 编辑专家
function editExpert(expertId) {
    const expert = experts.find(e => e.id === expertId);
    if (expert) {
        showAddExpertForm(expert);
    }
}

// 删除专家
async function deleteExpert(expertId) {
    const expert = experts.find(e => e.id === expertId);
    if (!expert) return;

    const confirmed = await confirmDialog({
        title: '删除专家',
        message: `确定要删除专家 "${expert.name}" 吗？`,
        detail: '此操作将永久删除该专家记录，且无法恢复。'
    });

    if (confirmed) {
        const index = experts.findIndex(e => e.id === expertId);
        if (index !== -1) {
            const deletedName = experts[index].name;
            experts.splice(index, 1);
            saveExperts();

            // 重新计算分页
            const totalPages = Math.ceil(experts.length / expertsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }

            renderExpertsTable(document.getElementById('searchExpert')?.value || '');
            showNotification('success', '删除成功', `专家 "${deletedName}" 已从专家库中删除`);
        }
    }
}

// 导入JSON文件
function importExpertsFromJSON() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.txt';

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.txt')) {
            showNotification('error', '文件格式错误', '请选择JSON文件');
            return;
        }

        showLoading('正在导入专家数据...');

        // 读取文件
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const content = e.target.result;
                console.log('JSON文件内容:', content.substring(0, 200) + '...');

                // 解析JSON数据
                const importedData = JSON.parse(content);

                // 验证数据格式
                if (!Array.isArray(importedData)) {
                    throw new Error('JSON数据必须是数组格式');
                }

                const importedExperts = [];
                let validCount = 0;
                let duplicateCount = 0;

                // 处理导入的专家数据
                importedData.forEach(item => {
                    // 检查必需字段
                    if (item.name && item.phone && item.phone.match(/^[0-9]{11}$/)) {
                        const expert = {
                            id: item.id || generateId(),
                            name: item.name,
                            phone: item.phone,
                            department: item.department || '未指定科室',
                            type: item.type || '技术组-内科医疗组'
                        };

                        // 检查是否已存在相同手机号的专家
                        const exists = experts.some(e => e.phone === expert.phone);
                        if (!exists) {
                            importedExperts.push(expert);
                            validCount++;
                        } else {
                            duplicateCount++;
                        }
                    }
                });

                console.log(`找到 ${validCount} 位有效专家，跳过 ${duplicateCount} 位重复专家`);

                if (validCount === 0) {
                    hideLoading();
                    showNotification('warning', '导入失败', '文件中没有找到有效的专家数据。\n请确保JSON格式正确，包含姓名和11位手机号字段。');
                    return;
                }

                // 添加新专家
                experts.push(...importedExperts);
                saveExperts();
                currentPage = 1;
                renderExpertsTable();
                hideLoading();

                showNotification('success', '导入成功', `成功导入 ${validCount} 位专家${duplicateCount > 0 ? `，跳过 ${duplicateCount} 位重复专家` : ''}`);

            } catch (error) {
                console.error('JSON导入错误:', error);
                hideLoading();
                showNotification('error', '导入失败',
                    `JSON解析错误：${error.message}\n\n` +
                    'JSON文件格式要求：\n' +
                    '1. 必须是有效的JSON数组格式\n' +
                    '2. 每个专家对象需包含：\n' +
                    '   - name: 姓名（必需）\n' +
                    '   - phone: 11位手机号（必需）\n' +
                    '   - department: 科室（可选）\n' +
                    '   - type: 类型（可选）\n\n' +
                    '示例格式：\n' +
                    '[\n' +
                    '  {\n' +
                    '    "name": "张三",\n' +
                    '    "phone": "13800138001",\n' +
                    '    "department": "心血管内科",\n' +
                    '    "type": "技术组-内科医疗组"\n' +
                    '  }\n' +
                    ']');
            }
        };

        reader.onerror = function() {
            hideLoading();
            showNotification('error', '读取失败', '无法读取文件，请检查文件是否损坏');
        };

        reader.readAsText(file, 'UTF-8');
    });

    // 触发文件选择
    fileInput.click();
}

// 导出为JSON文件
function exportExpertsToJSON() {
    if (experts.length === 0) {
        showNotification('warning', '导出失败', '专家库中没有数据可以导出');
        return;
    }

    showLoading('正在导出数据...');

    try {
        // 准备导出数据
        const exportData = experts.map(expert => ({
            id: expert.id,
            name: expert.name,
            phone: expert.phone,
            department: expert.department,
            type: expert.type
        }));

        // 创建JSON字符串，格式美化
        const jsonContent = JSON.stringify(exportData, null, 2);

        // 创建下载链接
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `专家数据_${formatDateTime().replace(/[: ]/g, '-')}.json`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 释放URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);

        setTimeout(() => {
            hideLoading();
            showNotification('success', '导出成功', `成功导出 ${experts.length} 位专家数据为JSON文件`);
        }, 500);

    } catch (error) {
        hideLoading();
        showNotification('error', '导出失败', '导出过程中出现错误：' + error.message);
    }
}

// 清空所有专家数据
function clearAllExperts() {
    confirmDialog({
        title: '清空专家库',
        message: '确定要清空所有专家数据吗？',
        detail: '此操作将永久删除所有专家记录，且无法恢复！'
    }).then(confirmed => {
        if (confirmed) {
            experts = [];
            saveExperts();
            currentPage = 1;
            renderExpertsTable();
            showNotification('success', '清空成功', '所有专家数据已清空');
        }
    });
}

// 获取所有专家
function getAllExperts() {
    return experts;
}

// 根据类型获取专家
function getExpertsByType(type) {
    return experts.filter(expert => expert.type === type);
}

// 获取技术组专家（所有子类型）
function getTechnicalExperts() {
    return experts.filter(expert => expert.type.includes('技术组'));
}

// 获取监督组专家
function getSupervisorExperts() {
    return experts.filter(expert => expert.type === '监督组');
}

// 导出示例JSON文件（用于测试）
function exportExampleJSON() {
    const exampleData = [
        {
            "name": "张明",
            "phone": "13800138001",
            "department": "心血管内科",
            "type": "技术组-内科医疗组"
        },
        {
            "name": "李华",
            "phone": "13800138002",
            "department": "骨科",
            "type": "技术组-外科医疗组"
        },
        {
            "name": "王伟",
            "phone": "13800138003",
            "department": "监察科",
            "type": "监督组"
        }
    ];

    const jsonContent = JSON.stringify(exampleData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "专家数据模板.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
    showNotification('info', '模板已下载', '专家数据模板已下载，请编辑后导入');
}