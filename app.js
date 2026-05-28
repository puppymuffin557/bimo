// --- 数据本地化存储空间 ---
let bimoVault = JSON.parse(localStorage.getItem('bimo_vault_data')) || [];
let currentProgressFilter = '连载';

// --- 初始化触发器 ---
document.addEventListener("DOMContentLoaded", () => {
    refreshAllViews();
    initMotionBg();
});

// --- 全局核心刷新控制 ---
function refreshAllViews() {
    renderHomeView();
    renderFandomsView();
    renderProgressView();
    updateDashboardStats();
}

function updateDashboardStats() {
    document.getElementById('stat-total').innerText = bimoVault.length;
    document.getElementById('stat-fandoms').innerText = [...new Set(bimoVault.map(v => v.fandom))].length;
    document.getElementById('stat-lost').innerText = bimoVault.filter(v => v.status === '孤本').length;
}

// --- 底部 Tab 视图切换器 ---
function switchView(viewId, clickedBtn) {
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    if (clickedBtn) clickedBtn.classList.add('active');

    // 切到对应视图时触发定向刷新
    if (viewId === 'home') renderHomeView();
    if (viewId === 'fandoms') renderFandomsView();
    if (viewId === 'progress') renderProgressView();
}

// --- 网址输入自动识别平台 ---
function autoDetectPlatform() {
    const url = document.getElementById('form-url').value.toLowerCase();
    const platformInput = document.getElementById('form-platform');
    if (url.includes('archiveofourown.org') || url.includes('ao3')) platformInput.value = 'AO3';
    else if (url.includes('lofter.com')) platformInput.value = 'LOFTER';
    else if (url.includes('twitter.com') || url.includes('x.com')) platformInput.value = 'X';
    else if (url.includes('weibo.com')) platformInput.value = '微博';
    else if (url.includes('pixiv.net')) platformInput.value = 'Pixiv';
}

// --- 顶部全局实时搜索处理 ---
function handleGlobalSearch() {
    const query = document.getElementById('global-search').value.trim().toLowerCase();
    if(!query) {
        switchView('home', document.querySelector('.tab-item:nth-child(1)'));
        return;
    }
    
    // 静默切到搜索选项卡
    switchView('search', document.querySelector('.tab-item:nth-child(2)'));
    
    const matched = bimoVault.filter(item => {
        return item.title.toLowerCase().includes(query) ||
               item.author.toLowerCase().includes(query) ||
               item.fandom.toLowerCase().includes(query) ||
               item.cp.toLowerCase().includes(query) ||
               item.tags.some(t => t.toLowerCase().includes(query));
    });

    const container = document.getElementById('search-results-list');
    container.innerHTML = matched.length ? '' : '<p style="color:var(--text-muted);text-align:center;margin-top:20px;">没有搜到相关的同人藏品线索</p>';
    matched.forEach(item => container.appendChild(createBimoCardElement(item)));
}

// --- 快速触发 TAG 搜索跳转 ---
function jumpToTagSearch(tagValue, event) {
    if(event) event.stopPropagation();
    document.getElementById('global-search').value = tagValue;
    handleGlobalSearch();
}

// --- 动态生成标准的 bimo 拟玻璃化大卡片 ---
function createBimoCardElement(item) {
    const card = document.createElement('div');
    card.className = 'bimo-card glass';
    
    const tagsHtml = item.tags.map(t => {
        const isRed = t.startsWith('雷:') || t.startsWith('避雷:');
        return `<span class="clickable-tag ${isRed ? 'is-trigger' : ''}" onclick="jumpToTagSearch('${t}', event)">${t}</span>`;
    }).join('');

    // 判断评语内容是否过长需要折叠
    const isLongComment = item.comment && item.comment.length > 120;

    card.innerHTML = `
        <div class="card-main-info">
            <div class="card-title-text">[${item.fandom}] ${item.title} ${item.size ? `<span style="font-size:0.8rem;font-weight:normal;color:var(--text-muted);">(${item.size})</span>`:''}</div>
            <span class="card-badge">${item.platform}</span>
        </div>
        <div class="card-author-line">太太: ${item.author} · 配对: <strong style="color:var(--text-primary);">${item.cp}</strong></div>
        
        ${item.comment ? `
            <div class="card-excerpt-zone ${isLongComment ? 'collapsed' : ''}" id="excerpt-${item.id}">${item.comment}</div>
            ${isLongComment ? `<button class="expand-toggle-btn" onclick="toggleExcerptExpand(${item.id}, this)"><i class="ri-arrow-down-s-line"></i> 展开长评摘要</button>` : ''}
        ` : ''}

        <div class="card-tags-line">${tagsHtml}</div>
        
        <div class="card-footer-meta">
            <div class="footer-left-indicators">
                <span class="dot-indicator dot-${item.status}">${item.status}</span>
                <span>类型: ${item.type || '文'}</span>
            </div>
            <div class="card-ops">
                ${item.url ? `<a href="${item.url}" target="_blank" class="card-url-link" onclick="event.stopPropagation()"><i class="ri-link-m"></i> 原址</a>` : ''}
                <button class="op-btn" onclick="openArchiveModal(${item.id})"><i class="ri-edit-line"></i></button>
                <button class="op-btn" onclick="obliterateArchive(${item.id})"><i class="ri-delete-bin-6-line"></i></button>
            </div>
        </div>
    `;
    return card;
}

// 长评折叠控制
function toggleExcerptExpand(id, btn) {
    const excerpt = document.getElementById(`excerpt-${id}`);
    if(excerpt.classList.contains('collapsed')) {
        excerpt.classList.remove('collapsed');
        btn.innerHTML = `<i class="ri-arrow-up-s-line"></i> 收起长评`;
    } else {
        excerpt.classList.add('collapsed');
        btn.innerHTML = `<i class="ri-arrow-down-s-line"></i> 展开长评摘要`;
    }
}

// --- 弹窗控制组 ---
function openArchiveModal(id = null) {
    document.getElementById('archive-modal').classList.add('active');
    if (id) {
        const item = bimoVault.find(v => v.id === id);
        document.getElementById('form-edit-id').value = item.id;
        document.getElementById('form-url').value = item.url;
        document.getElementById('form-title').value = item.title;
        document.getElementById('form-platform').value = item.platform;
        document.getElementById('form-author').value = item.author;
        document.getElementById('form-type').value = item.type || '文';
        document.getElementById('form-fandom').value = item.fandom;
        document.getElementById('form-cp').value = item.cp;
        document.getElementById('form-status').value = item.status;
        document.getElementById('form-size').value = item.size || '';
        document.getElementById('form-tags').value = item.tags.join(' ');
        document.getElementById('form-comment').value = item.comment;
    } else {
        document.getElementById('form-edit-id').value = '';
        document.getElementById('form-url').value = '';
        document.getElementById('form-title').value = '';
        document.getElementById('form-platform').value = '';
        document.getElementById('form-author').value = '';
        document.getElementById('form-fandom').value = '';
        document.getElementById('form-cp').value = '';
        document.getElementById('form-size').value = '';
        document.getElementById('form-tags').value = '';
        document.getElementById('form-comment').value = '';
    }
}

function closeArchiveModal() {
    document.getElementById('archive-modal').classList.remove('active');
}

// --- 封装存入数据 ---
function submitEncapsulation() {
    const editId = document.getElementById('form-edit-id').value;
    const fandom = document.getElementById('form-fandom').value.trim() || '自由散布流砂';
    const cp = document.getElementById('form-cp').value.trim() || '无CP';
    
    // 处理干净标签组
    const rawTags = document.getElementById('form-tags').value.split(/[,，\s]+/).map(t => t.trim()).filter(t => t);

    const targetData = {
        id: editId ? parseInt(editId) : Date.now(),
        url: document.getElementById('form-url').value.trim(),
        title: document.getElementById('form-title').value.trim() || '未命名的时空截面',
        platform: document.getElementById('form-platform').value.trim() || '未知空间',
        author: document.getElementById('form-author').value.trim() || '佚名太太',
        type: document.getElementById('form-type').value,
        fandom: fandom,
        cp: cp,
        status: document.getElementById('form-status').value,
        size: document.getElementById('form-size').value.trim(),
        tags: rawTags,
        comment: document.getElementById('form-comment').value
    };

    if (editId) {
        const index = bimoVault.findIndex(v => v.id === parseInt(editId));
        bimoVault[index] = targetData;
    } else {
        bimoVault.unshift(targetData);
    }

    localStorage.setItem('bimo_vault_data', JSON.stringify(bimoVault));
    closeArchiveModal();
    refreshAllViews();
}

// --- 彻底融毁销毁记录 ---
function obliterateArchive(id) {
    if (confirm("确定要彻底销毁这篇好不容易抢救回来的同人存档线索吗？")) {
        bimoVault = bimoVault.filter(v => v.id !== id);
        localStorage.setItem('bimo_vault_data', JSON.stringify(bimoVault));
        refreshAllViews();
    }
}

// --- 渲染模块：主页面板 ---
function renderHomeView() {
    const list = document.getElementById('recent-list');
    list.innerHTML = bimoVault.length ? '' : '<p style="color:var(--text-muted);text-align:center;padding:40px 0;">空空如也，点击右下角按钮开始封存第一篇好粮。</p>';
    bimoVault.slice(0, 10).forEach(item => {
        list.appendChild(createBimoCardElement(item));
    });
}

// --- 渲染模块：树形分圈面板 ---
function renderFandomsView() {
    const container = document.getElementById('fandoms-tree-container');
    container.innerHTML = '';

    // 重新结构化聚类 圈子 -> CP
    const tree = {};
    bimoVault.forEach(item => {
        if (!tree[item.fandom]) tree[item.fandom] = {};
        if (!tree[item.fandom][item.cp]) tree[item.fandom][item.cp] = [];
        tree[item.fandom][item.cp].push(item);
    });

    for (const fandom in tree) {
        const groupNode = document.createElement('div');
        groupNode.className = 'fandom-group-node glass';
        
        groupNode.innerHTML = `
            <div class="fandom-group-header" onclick="toggleFandomAccordion(this)">
                <span><i class="ri-arrow-right-s-line"></i> ${fandom}</span>
                <span style="font-size:0.85rem; color:var(--text-muted); font-weight:normal;">${Object.keys(tree[fandom]).length} 个分区</span>
            </div>
            <div class="fandom-group-content"></div>
        `;
        
        const contentArea = groupNode.querySelector('.fandom-group-content');

        for (const cp in tree[fandom]) {
            const cpTitle = document.createElement('div');
            cpTitle.className = 'cp-division-title';
            cpTitle.innerHTML = `<i class="ri-git-merge-line"></i> ${cp}`;
            contentArea.appendChild(cpTitle);

            tree[fandom][cp].forEach(item => {
                contentArea.appendChild(createBimoCardElement(item));
            });
        }
        container.appendChild(groupNode);
    }
}

function toggleFandomAccordion(headerEl) {
    headerEl.classList.toggle('open');
    const content = headerEl.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

// --- 渲染模块：连载/追更进度控制 ---
function filterProgress(statusType) {
    currentProgressFilter = statusType;
    document.querySelectorAll('.p-tab').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.includes(statusType));
    });
    renderProgressView();
}

function renderProgressView() {
    const container = document.getElementById('progress-list');
    container.innerHTML = '';
    const filtered = bimoVault.filter(v => v.status === currentProgressFilter);
    
    if(!filtered.length) {
        container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:30px 0;">当前分类下无对应作品状态</p>`;
        return;
    }
    filtered.forEach(item => container.appendChild(createBimoCardElement(item)));
}

// --- 数据管理：导入与导出系统 ---
function exportDataVault() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bimoVault, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `bimo_vault_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function importDataVault() {
    const fileInput = document.getElementById('import-file-input');
    if (!fileInput.files.length) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (Array.isArray(parsed)) {
                bimoVault = parsed;
                localStorage.setItem('bimo_vault_data', JSON.stringify(bimoVault));
                alert('// 成功载入数据。全局存档线索已恢复。');
                refreshAllViews();
                switchView('home', document.querySelector('.tab-item:nth-child(1)'));
            }
        } catch(err) {
            alert('// ERROR: 无法解析此文件。');
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// --- 深色 / 浅色模式极简无缝切换 ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        icon.className = 'ri-sun-line';
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.className = 'ri-moon-line';
    }
}

// --- 动态极简几何粒子连线 (Motion Graphic 风格) ---
let canvas, ctx, nodes = [];
function initMotionBg() {
    canvas = document.getElementById('mg-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvasSize();
    window.addEventListener('resize', resizeCanvasSize);

    const density = Math.min(Math.floor(canvas.width / 22), 40);
    for(let i = 0; i < density; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35
        });
    }
    runAnimationLoop();
}

function resizeCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function runAnimationLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.body.getAttribute('data-theme') === 'dark';

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

    nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if(n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if(n.y < 0 || n.y > canvas.height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });

    for(let i = 0; i < nodes.length; i++) {
        for(let j = i + 1; j < nodes.length; j++) {
            const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if(distance < 140) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(runAnimationLoop);
}
