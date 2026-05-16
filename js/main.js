const POSTS_FILE = 'posts.json';

async function loadPosts() {
    try {
        const res = await fetch(POSTS_FILE);
        if (!res.ok) throw new Error('无法加载文章数据');
        return await res.json();
    } catch (e) {
        console.error('加载文章失败:', e);
        return [];
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y} 年 ${m} 月 ${day} 日`;
}

function renderPosts(posts) {
    const container = document.getElementById('posts-list');
    if (!posts.length) {
        container.innerHTML = '<div class="loading">还没有文章，敬请期待～</div>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post-card" onclick="location.href='post.html?id=${post.id}'">
            <div class="post-date">${formatDate(post.date)}</div>
            <div class="post-title">${post.title}</div>
            <div class="post-summary">${post.summary}</div>
            ${post.tags ? `
            <div class="post-tags">
                ${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>` : ''}
        </div>
    `).join('');
}

async function loadPostDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        document.getElementById('post-container').innerHTML = '<div class="error">文章不存在</div>';
        return;
    }

    const posts = await loadPosts();
    const post = posts.find(p => p.id === id);
    if (!post) {
        document.getElementById('post-container').innerHTML = '<div class="error">文章不存在</div>';
        return;
    }

    document.title = `${post.title} - Nature`;

    const container = document.getElementById('post-container');
    container.innerHTML = `
        <a href="index.html" class="back-btn reveal">← 返回首页</a>
        <article class="post-detail reveal reveal-delay-1">
            <div class="post-header">
                <h1 class="post-title">${post.title}</h1>
                <div class="post-meta">
                    <span>${formatDate(post.date)}</span>
                    ${post.tags ? `<span>${post.tags.join(' · ')}</span>` : ''}
                </div>
            </div>
            <div class="post-content">${renderContent(post.content)}</div>
        </article>
    `;

    initScrollReveal();
}

function renderContent(content) {
    const lines = content.split('\n');
    let html = '';
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            if (inList) { html += '</ul>\n'; inList = false; }
            continue;
        }
        if (line.startsWith('### ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h3>${line.slice(4)}</h3>\n`;
        } else if (line.startsWith('## ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h2>${line.slice(3)}</h2>\n`;
        } else if (line.startsWith('> ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<blockquote>${line.slice(2)}</blockquote>\n`;
        } else if (line.startsWith('- ')) {
            if (!inList) { html += '<ul>\n'; inList = true; }
            html += `<li>${line.slice(2)}</li>\n`;
        } else {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<p>${line}</p>\n`;
        }
    }
    if (inList) html += '</ul>\n';
    return html;
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    });
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initHeaderParallax() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        if (scrollTop < window.innerHeight) {
            header.style.opacity = Math.max(0.3, 1 - scrollTop / 400);
        }
    });
}

function applyRevealToPosts() {
    const cards = document.querySelectorAll('.post-card');
    cards.forEach((card, i) => {
        card.classList.add('reveal');
        const delayIndex = Math.min(i, 5);
        card.classList.add('reveal-delay-' + delayIndex);
    });
    initScrollReveal();
}

if (window.location.pathname.endsWith('post.html') || window.location.pathname.includes('post.html')) {
    loadPostDetail();
} else {
    loadPosts().then(posts => {
        renderPosts(posts);
        applyRevealToPosts();
    });
}

initScrollProgress();
initHeaderParallax();
