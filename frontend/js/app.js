// 全局变量
let currentFileId = null;
let currentDefects = [];
let currentAnalysis = [];
let modelLoaded = false;
let modelError = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    checkModelStatus();
});

// 检查模型状态
function checkModelStatus() {
    fetch('/api/model_status')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            modelLoaded = data.model_loaded;
            modelError = data.error;
            updateModelStatusUI();
        }
    })
    .catch(error => {
        console.error('检查模型状态失败:', error);
    });
}

// 更新模型状态UI
function updateModelStatusUI() {
    const statusElement = document.createElement('div');
    statusElement.className = 'model-status';
    statusElement.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 2px 15px rgba(0,0,0,0.15);
    `;
    
    if (modelLoaded) {
        statusElement.innerHTML = `
            <span style="color: #27ae60; font-weight: bold;">✓</span>
            <span style="margin-left: 8px;">YOLO模型已加载</span>
        `;
        statusElement.style.background = '#e8f5e9';
    } else {
        statusElement.innerHTML = `
            <span style="color: #e74c3c; font-weight: bold;">⚠</span>
            <span style="margin-left: 8px;">使用模拟检测模式</span>
        `;
        statusElement.style.background = '#fff3e0';
    }
    
    // 移除旧状态
    const oldStatus = document.querySelector('.model-status');
    if (oldStatus) {
        oldStatus.remove();
    }
    
    document.body.appendChild(statusElement);
}

// 初始化事件监听器
function initEventListeners() {
    // 导航按钮切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // 上传区域点击
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', handleFileSelect);

    // 缺陷卡片点击（知识图谱页面）
    document.querySelectorAll('.defect-card').forEach(card => {
        card.addEventListener('click', function() {
            showKnowledgeDetail(this.dataset.type);
        });
    });

    // QA输入框回车提交
    document.getElementById('qaInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendQuestion();
        }
    });
}

// 切换标签页
function switchTab(tabName) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 显示对应内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// 文件上传相关处理
function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.target.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    // 验证文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
        alert('请上传有效的图片文件（PNG、JPG、JPEG、BMP）');
        return;
    }

    // 显示加载遮罩
    showLoading(true);

    // 构建表单数据
    const formData = new FormData();
    formData.append('file', file);

    // 发送上传请求
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentFileId = data.file_id;
            currentDefects = data.defects;
            currentAnalysis = data.analysis;
            displayResults(data);
        } else {
            alert('上传失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('上传错误:', error);
        alert('上传过程中发生错误');
    })
    .finally(() => {
        showLoading(false);
    });
}

// 显示加载遮罩
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// 显示检测结果
function displayResults(data) {
    // 隐藏上传区域，显示结果区域
    document.querySelector('.upload-section').style.display = 'none';
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';

    // 显示结果图像
    const resultImage = document.getElementById('resultImage');
    resultImage.src = data.result_image;

    // 更新缺陷数量
    document.getElementById('defectCount').textContent = data.defects.length;

    // 显示缺陷列表
    displayDefectsList(data.defects);

    // 显示分析报告
    displayAnalysis(data.analysis);
    
    // 更新问答建议问题
    updateQASuggestions();
}

// 显示缺陷列表
function displayDefectsList(defects) {
    const container = document.getElementById('defectsList');
    container.innerHTML = '';

    if (defects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">未检测到任何缺陷</p>';
        return;
    }

    defects.forEach((defect, index) => {
        const severity = getSeverity(defect.type);
        const item = document.createElement('div');
        item.className = `defect-item severity-${severity}`;
        item.innerHTML = `
            <div class="defect-item-header">
                <span class="defect-type">缺陷 #${index + 1}: ${defect.type}</span>
                <span class="defect-confidence">置信度: ${(defect.confidence * 100).toFixed(1)}%</span>
            </div>
            <div class="defect-meta">
                <span>位置: (${defect.bbox[0]}, ${defect.bbox[1]}) - (${defect.bbox[2]}, ${defect.bbox[3]})</span>
                <span>面积: ${defect.area} 像素</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// 获取缺陷严重程度
function getSeverity(defectType) {
    const highSeverity = ['断裂', '裂纹'];
    const mediumSeverity = ['腐蚀', '变形', '凹陷'];
    
    if (highSeverity.includes(defectType)) return 'high';
    if (mediumSeverity.includes(defectType)) return 'medium';
    return 'low';
}

// 显示分析报告
function displayAnalysis(analysis) {
    const container = document.getElementById('analysisContent');
    container.innerHTML = '';

    if (analysis.length === 0) {
        container.innerHTML = `
            <div class="analysis-summary">
                <div class="quality-score">
                    <div class="score-circle high">100</div>
                    <div>
                        <div class="score-label">质量评分</div>
                        <div style="font-size: 18px; font-weight: bold; color: #27ae60;">优秀</div>
                    </div>
                </div>
                <p>图片分析完成。未检测到任何缺陷，产品质量优秀！</p>
            </div>
        `;
        return;
    }

    // 计算质量分数
    let score = 100;
    analysis.forEach(item => {
        const severity = getSeverity(item.type);
        if (severity === 'high') score -= 20;
        else if (severity === 'medium') score -= 10;
        else score -= 5;
    });
    score = Math.max(0, score);

    let scoreLevel = 'high';
    let scoreText = '优秀';
    if (score < 60) {
        scoreLevel = 'low';
        scoreText = '较差';
    } else if (score < 80) {
        scoreLevel = 'medium';
        scoreText = '良好';
    }

    // 统计缺陷类型
    const typeCounts = {};
    analysis.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    // 创建分析摘要
    let summaryHtml = `
        <div class="analysis-summary">
            <div class="quality-score">
                <div class="score-circle ${scoreLevel}">${score}</div>
                <div>
                    <div class="score-label">质量评分</div>
                    <div style="font-size: 18px; font-weight: bold; color: ${scoreLevel === 'high' ? '#27ae60' : scoreLevel === 'medium' ? '#f39c12' : '#e74c3c'};">${scoreText}</div>
                </div>
            </div>
            <p>图片分析完成。共检测到 ${analysis.length} 个缺陷，包含 ${Object.keys(typeCounts).length} 种类型。
            ${score >= 80 ? '整体质量良好。' : score >= 60 ? '建议进行进一步检查和修复。' : '质量较差，需要立即处理。'}</p>
        </div>
    `;

    // 添加建议列表
    summaryHtml += '<h4 style="margin: 24px 0 16px; color: #1f2937; font-weight: 600;">💡 修复建议</h4>';
    summaryHtml += '<ul class="suggestions-list">';
    
    const uniqueTypes = [...new Set(analysis.map(a => a.type))];
    uniqueTypes.forEach(defectType => {
        const info = analysis.find(a => a.type === defectType);
        if (info && info.solutions && info.solutions.length > 0) {
            info.solutions.slice(0, 2).forEach(solution => {
                summaryHtml += `
                    <li>
                        <div class="suggestion-icon">⚙️</div>
                        <div class="suggestion-content">
                            <strong>${defectType}</strong>
                            <p>${solution.solution}</p>
                            <span class="suggestion-source">来源: ${solution.source}</span>
                        </div>
                    </li>
                `;
            });
        }
    });

    summaryHtml += '</ul>';
    container.innerHTML = summaryHtml;
}

// 生成报告
function generateReport() {
    if (!currentFileId || !currentDefects.length) {
        alert('请先上传图片并完成检测');
        return;
    }

    showLoading(true);

    fetch('/api/generate_report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file_id: currentFileId,
            defects: currentDefects,
            analysis: currentAnalysis
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 打开报告
            window.open(`/reports/${data.report_path}`, '_blank');
        } else {
            alert('生成报告失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('生成报告错误:', error);
        alert('生成报告过程中发生错误');
    })
    .finally(() => {
        showLoading(false);
    });
}

// 搜索知识库
function searchKnowledge() {
    const query = document.getElementById('knowledgeSearch').value.trim();
    if (!query) return;

    fetch('/api/search_knowledge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.results.length > 0) {
            displayKnowledgeSearchResults(data.results);
        } else {
            alert('未找到相关知识');
        }
    })
    .catch(error => {
        console.error('搜索错误:', error);
    });
}

// 显示搜索结果
function displayKnowledgeSearchResults(results) {
    const container = document.getElementById('detailContent');
    const detailSection = document.getElementById('knowledgeDetail');
    
    detailSection.style.display = 'block';
    document.getElementById('detailTitle').textContent = '搜索结果';

    let html = '';
    results.forEach((info, index) => {
        html += `
            <div class="detail-section">
                <h3>${index + 1}. ${info.name}</h3>
                <div class="detail-description">${info.description}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 显示缺陷详情
function showKnowledgeDetail(defectType) {
    fetch(`/api/defect_info/${encodeURIComponent(defectType)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayKnowledgeDetail(data.info);
        } else {
            alert('未找到该缺陷类型的信息');
        }
    })
    .catch(error => {
        console.error('获取缺陷信息错误:', error);
    });
}

// 显示知识详情
function displayKnowledgeDetail(info) {
    const container = document.getElementById('detailContent');
    const detailSection = document.getElementById('knowledgeDetail');
    
    detailSection.style.display = 'block';
    document.getElementById('detailTitle').textContent = info.name;

    let html = `
        <div class="detail-section">
            <h3>📋 描述</h3>
            <div class="detail-description">${info.description}</div>
        </div>
    `;

    if (info.causes && info.causes.length > 0) {
        html += `
            <div class="detail-section">
                <h3>💡 可能原因</h3>
                <ul class="detail-list">
        `;
        info.causes.forEach(cause => {
            html += `<li>${cause.cause}<span class="source">来源: ${cause.source}</span></li>`;
        });
        html += '</ul></div>';
    }

    if (info.solutions && info.solutions.length > 0) {
        html += `
            <div class="detail-section">
                <h3>🛠️ 解决方案</h3>
                <ul class="detail-list">
        `;
        info.solutions.forEach(solution => {
            html += `<li>${solution.solution}<span class="source">来源: ${solution.source}</span></li>`;
        });
        html += '</ul></div>';
    }

    if (info.prevention && info.prevention.length > 0) {
        html += `
            <div class="detail-section">
                <h3>✅ 预防措施</h3>
                <ul class="detail-list">
        `;
        info.prevention.forEach(prevention => {
            html += `<li>${prevention.method}<span class="source">来源: ${prevention.source}</span></li>`;
        });
        html += '</ul></div>';
    }

    container.innerHTML = html;
}

// 隐藏知识详情
function hideKnowledgeDetail() {
    document.getElementById('knowledgeDetail').style.display = 'none';
}

// 智能问答相关
function sendQuestion() {
    const question = document.getElementById('qaInput').value.trim();
    if (!question) return;

    // 添加用户消息
    addMessage(question, 'user');
    document.getElementById('qaInput').value = '';

    // 发送请求
    fetch('/api/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question,
            file_id: currentFileId,
            defects: currentDefects,
            analysis: currentAnalysis
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addMessage(data.answer, 'agent', data.sources);
        } else {
            addMessage('抱歉，我无法回答这个问题。', 'agent');
        }
    })
    .catch(error => {
        console.error('问答错误:', error);
        addMessage('抱歉，发生了错误，请重试。', 'agent');
    });
}

// 添加消息到聊天历史
function addMessage(content, sender, sources = []) {
    const history = document.getElementById('qaHistory');
    const message = document.createElement('div');
    message.className = `message ${sender}`;
    
    const avatarEmoji = sender === 'user' ? '👤' : '🤖';
    
    let sourcesHtml = '';
    if (sources && sources.length > 0) {
        sourcesHtml = `<div class="message-sources">来源: ${sources.join(', ')}</div>`;
    }
    
    message.innerHTML = `
        <div class="message-avatar">${avatarEmoji}</div>
        <div class="message-content">
            ${content.replace(/\n/g, '<br>')}
            ${sourcesHtml}
        </div>
    `;
    
    history.appendChild(message);
    history.scrollTop = history.scrollHeight;
}

// 建议问题
function suggestQuestion(question) {
    document.getElementById('qaInput').value = question;
    sendQuestion();
}

// 更新问答建议问题（根据检测结果）
function updateQASuggestions() {
    const suggestionsContainer = document.querySelector('.suggestion-tags');
    if (!suggestionsContainer) return;
    
    // 基础问题
    let suggestions = [
        { text: '图片中有多少个缺陷？', action: () => suggestQuestion('图片中有多少个缺陷？') },
        { text: '帮我分析一下检测结果', action: () => suggestQuestion('帮我分析一下检测结果') }
    ];
    
    // 如果有检测结果，添加针对具体缺陷的问题
    if (currentDefects.length > 0) {
        const uniqueTypes = [...new Set(currentDefects.map(d => d.type))];
        
        uniqueTypes.forEach(defectType => {
            suggestions.push({
                text: `${defectType}是什么原因造成的？`,
                action: () => suggestQuestion(`${defectType}是什么原因造成的？`)
            });
            suggestions.push({
                text: `如何解决${defectType}问题？`,
                action: () => suggestQuestion(`如何解决${defectType}问题？`)
            });
            suggestions.push({
                text: `如何预防${defectType}的发生？`,
                action: () => suggestQuestion(`如何预防${defectType}的发生？`)
            });
        });
    }
    
    // 清空并重新创建建议标签
    suggestionsContainer.innerHTML = '';
    suggestions.slice(0, 6).forEach(suggestion => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = suggestion.text;
        tag.addEventListener('click', suggestion.action);
        suggestionsContainer.appendChild(tag);
    });
}