const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// -------------------------------
// DOM ELEMENTS
// -------------------------------
const loginView = document.getElementById('login-view');
const homeView = document.getElementById('home-view');
const dashboardView = document.getElementById('dashboard-view');
const apidocsView = document.getElementById('apidocs-view');

const mainNav = document.getElementById('main-nav');
const navBtns = document.querySelectorAll('.nav-btn');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userNameDisplay = document.getElementById('user-name-display');
const userAvatarInitial = document.getElementById('user-avatar-initial');

const videosGrid = document.getElementById('videos-grid');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('search-input');
const filterTagsContainer = document.getElementById('filter-tags-container');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statTags = document.getElementById('stat-tags');
const statWeek = document.getElementById('stat-week');

// Modal Elements
const videoModal = document.getElementById('video-modal');
const closeModal = document.getElementById('close-modal');
const modalIframeContainer = document.getElementById('modal-iframe-container');
const modalTitle = document.getElementById('modal-title');
const modalSummary = document.getElementById('modal-summary');

let allVideos = [];
let activeSearchTerm = '';
let activeTagFilter = '';

// -------------------------------
// INITIALIZATION
// -------------------------------
function init() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        setUserData(user);
        switchView('home-view');
        fetchVideos(); // Preload data
    } else {
        switchView('login-view');
    }
}

// -------------------------------
// NAVIGATION & VIEWS
// -------------------------------
function switchView(viewId) {
    // Hide all
    loginView.classList.add('hidden');
    homeView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    apidocsView.classList.add('hidden');

    // Show target
    document.getElementById(viewId).classList.remove('hidden');

    // Top Nav visibility
    if (viewId === 'login-view') {
        mainNav.classList.add('hidden');
    } else {
        mainNav.classList.remove('hidden');
    }

    // Update Nav Buttons State
    navBtns.forEach(btn => {
        if (btn.dataset.target === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Setup Nav clicks
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchView(btn.dataset.target);
        if (btn.dataset.target === 'dashboard-view') fetchVideos();
    });
});

// Setup Home buttons
document.querySelector('.n-goToDashboard').addEventListener('click', () => switchView('dashboard-view'));
document.querySelector('.n-goToApiDocs').addEventListener('click', () => switchView('apidocs-view'));

// -------------------------------
// AUTHENTICATION
// -------------------------------
function setUserData(user) {
    if (!user || !user.nome) return;
    userNameDisplay.textContent = user.nome;
    userAvatarInitial.textContent = user.nome.charAt(0).toUpperCase();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = loginForm.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Autenticando...';

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || 'Erro ao realizar login.');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setUserData(data.user);
        document.getElementById('password').value = '';
        showToast('Login efetuado com sucesso!', 'success');

        fetchVideos();
        switchView('home-view');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.textContent = originalText;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    switchView('login-view');
});

// -------------------------------
// NOTIFICATIONS
// -------------------------------
function showToast(message, type = 'error') {
    toast.textContent = message;
    toast.style.borderColor = type === 'error' ? 'var(--danger-color)' : 'rgba(52, 211, 153, 0.4)';
    toast.style.color = type === 'error' ? 'var(--danger-color)' : '#34d399';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// -------------------------------
// DATA FETCHING & STATS
// -------------------------------
async function fetchVideos() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/videos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            logoutBtn.click();
            return;
        }

        allVideos = await res.json();
        calculateStats(allVideos);
        extractAndRenderTagsFilter(allVideos);
        applyFiltersAndRender();
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar os tutoriais da API.', 'error');
    }
}

function calculateStats(videos) {
    if (!videos || !videos.length) return;

    // Total
    statTotal.textContent = videos.length;

    // Unique Tags
    const uniqueTags = new Set();
    videos.forEach(v => v.Tags.forEach(t => uniqueTags.add(t.nome)));
    statTags.textContent = uniqueTags.size;

    // This Week (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekCount = videos.filter(v => new Date(v.data_publicacao) > oneWeekAgo).length;
    statWeek.textContent = weekCount;
}

// -------------------------------
// FILTERING & SEARCH
// -------------------------------
function extractAndRenderTagsFilter(videos) {
    const tagCounts = {};
    videos.forEach(v => v.Tags.forEach(t => {
        tagCounts[t.nome] = (tagCounts[t.nome] || 0) + 1;
    }));

    // Sort tags by frequency desc
    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    filterTagsContainer.innerHTML = '';

    // "Todos" button
    const allBtn = document.createElement('button');
    allBtn.className = `filter-tag ${activeTagFilter === '' ? 'active' : ''}`;
    allBtn.textContent = 'Todos';
    allBtn.onclick = () => { activeTagFilter = ''; applyFiltersAndRender(); updateTagButtons(); };
    filterTagsContainer.appendChild(allBtn);

    sortedTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `filter-tag ${activeTagFilter === tag ? 'active' : ''}`;
        btn.textContent = tag;
        btn.onclick = () => { activeTagFilter = tag; applyFiltersAndRender(); updateTagButtons(); };
        filterTagsContainer.appendChild(btn);
    });
}

function updateTagButtons() {
    const btns = filterTagsContainer.querySelectorAll('.filter-tag');
    btns.forEach(btn => {
        if (btn.textContent === 'Todos' && activeTagFilter === '') btn.classList.add('active');
        else if (btn.textContent === activeTagFilter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

searchInput.addEventListener('input', (e) => {
    activeSearchTerm = e.target.value.toLowerCase();
    applyFiltersAndRender();
});

function applyFiltersAndRender() {
    let filtered = allVideos;

    // Exclude if doesn't match search term
    if (activeSearchTerm) {
        filtered = filtered.filter(v => {
            const mTitle = v.titulo.toLowerCase().includes(activeSearchTerm);
            const mTags = v.Tags.some(t => t.nome.toLowerCase().includes(activeSearchTerm));
            return mTitle || mTags;
        });
    }

    // Exclude if doesn't have the active tag
    if (activeTagFilter) {
        filtered = filtered.filter(v => v.Tags.some(t => t.nome === activeTagFilter));
    }

    renderVideos(filtered);
}

// -------------------------------
// RENDERING
// -------------------------------
function renderVideos(videos) {
    videosGrid.innerHTML = '';
    resultsCount.textContent = `${videos.length} tutoriais encontrados`;

    if (!videos || videos.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    videos.forEach(video => {
        const dateObj = new Date(video.data_publicacao);
        const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        const duracaoStr = video.duracao ? video.duracao : '15:30'; // fallback

        // Tags Logic (max 3 displayed)
        let tagsHtml = '';
        const displayTags = video.Tags.slice(0, 3);
        const hiddenTagsCount = video.Tags.length - 3;

        displayTags.forEach(tag => {
            let extraClass = '';
            if (['n8n', 'automação'].includes(tag.nome)) extraClass = 'tag-n8n';
            if (['ia', 'openai', 'gpt-4'].includes(tag.nome)) extraClass = 'tag-ia';
            tagsHtml += `<span class="tag-badge ${extraClass}">${tag.nome}</span>`;
        });
        if (hiddenTagsCount > 0) {
            tagsHtml += `<span class="tag-badge more-tag">+${hiddenTagsCount}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="card-thumbnail" onclick="openModal('${video.id}')">
                <div class="play-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
                <div class="duration-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${duracaoStr}
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${video.titulo}</h3>
                <div class="tags-container">
                    ${tagsHtml}
                </div>
                <p class="card-summary">${video.resumo_ia || 'Nenhum resumo disponível.'}</p>
                <div class="card-footer">
                    <span class="card-date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${dateStr}
                    </span>
                    <button class="ver-mais-btn" onclick="openModal('${video.id}')">
                        Ver mais 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>
        `;
        videosGrid.appendChild(card);
    });
}

// -------------------------------
// MODAL & IFRAME
// -------------------------------
window.openModal = function (videoId) {
    const video = allVideos.find(v => v.id === videoId);
    if (!video) return;

    modalTitle.textContent = video.titulo;
    modalSummary.textContent = video.resumo_ia || '';

    // Inject iframe fresh to ensure playback state drops on close
    modalIframeContainer.innerHTML = `<iframe src="${video.link_iframe}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

    videoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // prevent bg scroll
};

closeModal.addEventListener('click', () => {
    videoModal.classList.add('hidden');
    modalIframeContainer.innerHTML = ''; // Kill iframe to stop audio
    document.body.style.overflow = 'auto';
});

// Close modal on outside click
videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
        closeModal.click();
    }
});

// Copy Buttons in API Docs
document.querySelectorAll('.copy-btn, .copy-text-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.previousElementSibling.textContent;
        navigator.clipboard.writeText(text);
        const origIcon = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado`;
        setTimeout(() => { btn.innerHTML = origIcon; }, 2000);
    });
});

// Init on load
init();
