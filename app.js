// --- 核心状态空间 ---
let localVault = JSON.parse(localStorage.getItem('fandom_vault_v2')) || [];

// --- 初始化入口 ---
document.addEventListener("DOMContentLoaded", () => {
    renderDashboard();
    initCanvasAnimation();
});

// --- Tab 导航切换 ---
function switchTab(tabId) {
    document.querySelectorAll('.mod-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`mod-${tabId}`).classList.add('active');
    
    // 找到对应的导航按钮并高亮
    const matchedBtn = Array.from(document.querySelectorAll('.nav-menu .nav-btn'))
                            .find(btn => btn.getAttribute('onclick').includes(tabId));
    if(matchedBtn) matchedBtn.classList.add('active');

    if(tabId === 'dashboard') renderDashboard();
    if(tabId === 'repository') renderRepository();
}

// --- 自动填写平台 ---
function handleUrlAutoFill() {
    const url = document.getElementById('in-url').value.toLowerCase();
    const platformField = document.getElementById('in-platform');
    if (url.includes('archiveofourown.org') || url.includes('ao3')) platformField.value = 'AO3';
    else if (url.includes('lofter.com')) platformField.value = 'LOFTER';
    else if (url.includes('twitter.com') || url.includes('x.com')) platformField.value = 'X';
    else if (url.includes('weibo.com')) platformField.value = '微博';
    else if (url.includes('pixiv.net')) platformField.value = 'Pixiv';
}

// --- 弹窗控组 ---
function openArchiveModal(id = null) {
    const modal = document.getElementById('archive-modal');
    modal.classList.add('active');
    
    if(id) {
        const item = localVault.find(v => v.id === id);
        document.getElementById('in-id').value = item.id;
        document.getElementById('in-url').value = item.url;
        document.getElementById('in-title').value = item.title;
        document.getElementById('in-platform').value = item.platform;
        document.getElementById('in-author').value = item.author;
        document.getElementById('in-type').value = item.type || '文';
        document.getElementById('in-fandom').value = item.fandom;
        document.getElementById('in-cp').value = item.cp;
        document.getElementById('in-status').value = item.status;
        document.getElementById('in-size').value = item.size || '';
        document.getElementById('in-tags').value = item.tags.join(', ');
        document.getElementById('in-comment').value = item.comment;
    } else {
        // 清空表单
        document.getElementById('in-id').value = '';
        document.getElementById('in-url').value = '';
        document.getElementById('in-title').value = '';
        document.getElementById('in-platform').value = '';
        document.getElementById('in-author').value = '';
        document.getElementById('in-fandom').value = '';
        document.getElementById('in-cp').value = '';
        document.getElementById('in-size').value = '';
        document.getElementById('in-tags').value = '';
        document.getElementById('in-comment').value = '';
    }
}

function closeArchiveModal() {
    document.getElementById('archive-modal').classList.remove('active');
}

// --- 封装执行 (保存数据) ---
function executeEncapsulation() {
    const id = document.getElementById('in-id').value;
    const fandom = document.getElementById('in-fandom').value.trim() || '自由散落流砂';
    const cp = document.getElementById('in-cp').value.trim() || '无CP/全员向';
    
    // 解析标签，提取避雷标签
    const rawTags = document.getElementById('in-tags').value.split(/[,，\s]+/).map(t => t.trim()).filter(t => t);

    const artifact = {
        id: id ? parseInt(id) : Date.now(),
        url: document.getElementById('in-url').value.trim(),
        title: document.getElementById('in-title').value.trim() || '未命名无定型产物',
        platform: document.getElementById('in-platform').value.trim() || '未知维度',
        author: document.getElementById('in-author').value.trim() || '隐名太太',
        type: document.getElementById('in-type').value,
        fandom: fandom,
        cp: cp,
        status: document.getElementById('in-status').value,
        size: document.getElementById('in-size').value.trim(),
        tags: rawTags,
        comment: document.getElementById('in-comment').value,
        timestamp: new Date().toLocaleDateString()
    };

    if (id) {
        const idx = localVault.findIndex(v => v.id === parseInt(id));
        localVault[idx] = artifact;
    } else {
        localVault.unshift(artifact);
    }

    localStorage.setItem('fandom_vault_v2', JSON.stringify(localVault));
    closeArchiveModal();
    
    // 刷新当前视窗
    if(document.getElementById('mod-dashboard').classList.contains('active')) renderDashboard();
    if(document.getElementById('mod-repository').classList.contains('active')) renderRepository();
}

// --- 销毁存档 ---
function destroyArchive(id, event) {
    if(event) event.stopPropagation(); // 阻止触发阅览室模式
    if (confirm("确定要永久融毁这条私人藏品线索吗？")) {
        localVault = localVault.filter(v => v.id !== id);
        localStorage.setItem('fandom_vault_v2', JSON.stringify(localVault));
        renderRepository();
    }
}

// --- 沉浸式阅览室系统 (Zen Mode) ---
function launchZenMode(id) {
    const item = localVault.find(v => v.id === id);
    if(!item) return;

    document.getElementById('zen-title').innerText = item.title;
    document.getElementById('zen-author').innerText = item.author;
    document.getElementById('zen-fandom').innerText = item.fandom;
    document.getElementById('zen-cp').innerText = item.cp;
    document.getElementById('zen-status').className = `status-indicator status-${item.status}`;
    document.getElementById('zen-status').innerText = item.status;
    document.getElementById('zen-meta-platform').innerText = `${item.platform} // ${item.type || '文'}`;
    
    // 渲染阅览室标签
    const tagContainer = document.getElementById('zen-tags');
    tagContainer.innerHTML = '';
    item.tags.forEach(t => {
        const span = document.createElement('span');
        span.className = `c-tag ${t.startsWith('雷:') ? 'is-red' : ''}`;
        span.innerText = t;
        tagContainer.appendChild(span);
    });

    // 渲染核心长评/记录内容
    document.getElementById('zen-comment').innerText = item.comment || "（该入档作品暂无记录短评，静默留存中。）";
    
    const urlAnchor = document.getElementById('zen-original-url');
    if(item.url) {
        urlAnchor.href = item.url;
        urlAnchor.style.display = 'inline-block';
    } else {
        urlAnchor.style.display = 'none';
    }

    document.getElementById('zen-viewer').classList.add('active');
}

function closeZenMode() {
    document.getElementById('zen-viewer').classList.remove('active');
}

// --- 视图渲染：仪表盘 ---
function renderDashboard() {
    document.getElementById('stat-total').innerText = localVault.length;
    document.getElementById('stat-fandoms').innerText = [...new Set(localVault.map(v => v.fandom))].length;
    document.getElementById('stat-saved').innerText = localVault.filter(v => v.status === '孤本').length;

    const recentList = document.getElementById('recent-list');
    recentList.innerHTML = '';
    
    // 仅提取最近5条展示
    localVault.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'work-strip';
        div.onclick = () => launchZenMode(item.id);
        div.innerHTML = `
            <div class="strip-top">
                <span class="strip-title">[${item.fandom}] ${item.title}</span>
                <span class="platform-pill">${item.platform}</span>
            </div>
            <div class="strip-meta">
                <span>CP: ${item.cp}</span>
                <span>太太: ${item.author}</span>
                <span class="status-indicator status-${item.status}">${item.status}</span>
            </div>
        `;
        recentList.appendChild(div);
    });
}

// --- 视图渲染：树形多圈藏品库 ---
function renderRepository() {
    const container = document.getElementById('repo-tree');
    const keyword = document.getElementById('search-input').value.toLowerCase();
    container.innerHTML = '';

    const filtered = localVault.filter(v => {
        return v.title.toLowerCase().includes(keyword) ||
               v.author.toLowerCase().includes(keyword) ||
               v.fandom.toLowerCase().includes(keyword) ||
               v.cp.toLowerCase().includes(keyword) ||
               v.tags.some(t => t.toLowerCase().includes(keyword));
    });

    // 多维度聚合成 圈子 -> CP
    const tree = {};
    filtered.forEach(item => {
        if (!tree[item.fandom]) tree[item.fandom] = {};
        if (!tree[item.fandom][item.cp]) tree[item.fandom][item.cp] = [];
        tree[item.fandom][item.cp].push(item);
    });

    for (const fandom in tree) {
        const fandomBlock = document.createElement('div');
        fandomBlock.className = 'fandom-block';
        
        let cpCount = Object.keys(tree[fandom]).length;
        
        fandomBlock.innerHTML = `
            <div class="fandom-title-bar">
                <h4><i class="ri-hashtag"></i> ${fandom}</h4>
                <span style="font-size:0.75rem; color:var(--text-muted);">${cpCount} 个关系链分区</span>
            </div>
            <div class="cp-wrapper"></div>
        `;

        const cpWrapper = fandomBlock.querySelector('.cp-wrapper');

        for (const cp in tree[fandom]) {
            const cpGroup = document.createElement('div');
            cpGroup.innerHTML = `
                <div class="cp-tag-header"><i class="ri-git-merge-line"></i> ${cp}</div>
                <div class="cards-list"></div>
            `;
            const cardsList = cpGroup.querySelector('.cards-list');

            tree[fandom][cp].forEach(item => {
                const strip = document.createElement('div');
                strip.className = 'work-strip';
                // 点击卡片主体进入沉浸式阅览室
                strip.onclick = () => launchZenMode(item.id);

                const tagsHtml = item.tags.map(t => `
                    <span class="c-tag ${t.startsWith('雷:') ? 'is-red' : ''}">${t}</span>
                `).join('');

                strip.innerHTML = `
                    <div class="strip-top">
                        <span class="strip-title">${item.title} ${item.size ? `<span style="font-size:0.75rem; font-weight:normal; color:var(--text-muted);">(${item.size})</span>`:''}</span>
                        <span class="platform-pill">${item.platform}</span>
                    </div>
                    <div class="strip-meta">
                        <span>BY. ${item.author}</span>
                        <span>类型: ${item.type || '文'}</span>
                        <span class="status-indicator status-${item.status}">${item.status}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:auto;">${item.timestamp} 入库</span>
                    </div>
                    ${tagsHtml ? `<div class="strip-tags">${tagsHtml}</div>` : ''}
                    <div class="strip-actions">
                        <button class="action-btn" onclick="openArchiveModal(${item.id}); event.stopPropagation();"><i class="ri-edit-line"></i> 修改</button>
                        <button class="action-btn" onclick="destroyArchive(${item.id}, event)"><i class="ri-delete-bin-line"></i> 融毁</button>
                    </div>
                `;
                cardsList.appendChild(strip);
            });
            cpWrapper.appendChild(cpGroup);
        }
        container.appendChild(fandomBlock);
    }
}

// --- 备份主控 ---
function exportJSON() {
    const blob = new Blob([JSON.stringify(localVault, null, 2)], {type : 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAULT_EXPORT_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

function importJSON() {
    const file = document.getElementById('import-file').files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(Array.isArray(data)) {
                localVault = data;
                localStorage.setItem('fandom_vault_v2', JSON.stringify(localVault));
                alert('// 核心存储同步完毕。全量历史数据已安全载入。');
                renderDashboard();
            }
        } catch(err) {
            alert('// ERROR: 文件流解析失败，请检查是否为本站导出的标准存档。');
        }
    };
    reader.readAsText(file);
}

// --- UI 主题切换 ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const label = document.querySelector('.theme-toggle span');
    
    if(body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        icon.className = 'ri-sun-line';
        label.innerText = '浅色模式';
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.className = 'ri-moon-clear-line';
        label.innerText = '深色模式';
    }
}

// --- Motion Graphic 粒子连线系统 ---
let canvas, ctx, points = [];
function initCanvasAnimation() {
    canvas = document.getElementById('bg-canvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    // 纯粹、稀疏的几维几何点
    const count = Math.min(Math.floor(canvas.width / 25), 45);
    for(let i=0; i<count; i++) {
        points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3
        });
    }
    animate();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
    
    points.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI*2);
        ctx.fill();
    });

    for(let i=0; i<points.length; i++) {
        for(let j=i+1; j<points.length; j++) {
            const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
            if(d < 150) {
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}
