const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin;

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
        // fetchVideos(); // Removido: O HTML agora é gerado estaticamente no servidor
        updateStaticStats(); // Nova função para ler o HTML estático
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
        if (btn.dataset.target === 'dashboard-view') updateStaticStats();
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

        updateStaticStats();
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
// STATIC HTML STATS
// -------------------------------
function updateStaticStats() {
    const cards = document.querySelectorAll('.video-card');

    // Atualiza apenas se houver cards e o empty state
    if (cards.length > 0) {
        emptyState.classList.add('hidden');
    } else {
        emptyState.classList.remove('hidden');
    }

    resultsCount.textContent = `${cards.length} tutoriais encontrados`;
    statTotal.textContent = cards.length;

    // Contar tags unicas lendo o HTML
    const uniqueTags = new Set();
    document.querySelectorAll('.tag-badge').forEach(badge => {
        if (!badge.classList.contains('more-tag')) {
            uniqueTags.add(badge.textContent.trim());
        }
    });
    statTags.textContent = uniqueTags.size;
}

// O código de busca (Search) antigo foi removido, pois exigiria re-renderização completa.
// Como o HTML agora é estático, a busca precisaria ser feita ocultando/mostrando cards (display: none).
// Sinta-se à vontade para pedir a reimplementação da busca estática!

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
