// ── AUTH ──
const USERS = { admin: '123456', user: 'password' };
let currentUser = null;
let posts = [];
let editingPostId = null; // track which post is being edited

function doLogin() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    const err = document.getElementById('error-msg');

    if (USERS[u] && USERS[u] === p) {
        err.classList.remove('show');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', u);
        currentUser = u;
        showDashboard(u);
    } else {
        err.classList.add('show');
        document.getElementById('password').value = '';
    }
}

function showDashboard(user) {
    const initial = user.charAt(0).toUpperCase();
    document.getElementById('user-avatar').textContent = initial;
    document.getElementById('user-name-display').textContent =
        user.charAt(0).toUpperCase() + user.slice(1);
    loadPostsFromStorage();
    renderPosts();
    showPage('dashboard-page');
}

function doLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    currentUser = null;
    showPage('login-page');
}

// ── PAGES ──
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ── LOCAL STORAGE PERSISTENCE ──
function savePostsToStorage() {
    localStorage.setItem('posts', JSON.stringify(posts));
}

function loadPostsFromStorage() {
    const saved = localStorage.getItem('posts');
    posts = saved ? JSON.parse(saved) : [];
}

// ── POSTS CRUD ──
function publishPost() {
    const title = document.getElementById('post-title').value.trim();
    const cat = document.getElementById('post-category').value.trim() || 'Chung';
    const content = document.getElementById('post-content').value.trim();

    if (!title) { showToast('⚠ Vui lòng nhập tiêu đề!', true); return; }
    if (!content) { showToast('⚠ Vui lòng nhập nội dung!', true); return; }

    if (editingPostId !== null) {
        // UPDATE existing post
        const idx = posts.findIndex(p => p.id === editingPostId);
        if (idx !== -1) {
            posts[idx].title = title;
            posts[idx].cat = cat;
            posts[idx].content = content;
            posts[idx].edited = true;
        }
        editingPostId = null;
        resetFormUI();
        showToast('✓ Bài viết đã được cập nhật!');
    } else {
        // CREATE new post
        posts.unshift({
            id: Date.now(),
            title, cat, content,
            author: currentUser || localStorage.getItem('currentUser'),
            date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
        showToast('✓ Bài viết đã được đăng thành công!');
    }

    savePostsToStorage();
    renderPosts();
    clearForm();
}

function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    editingPostId = id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-category').value = post.cat;
    document.getElementById('post-content').value = post.content;

    // Update form UI to show "editing" state
    const publishBtn = document.getElementById('publish-btn');
    publishBtn.textContent = 'Cập nhật →';
    publishBtn.classList.add('editing');

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    // Scroll to form
    document.querySelector('.post-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });

    showToast('📝 Đang chỉnh sửa bài viết...');
}

function cancelEdit() {
    editingPostId = null;
    clearForm();
    resetFormUI();
}

function resetFormUI() {
    const publishBtn = document.getElementById('publish-btn');
    publishBtn.textContent = 'Đăng bài →';
    publishBtn.classList.remove('editing');

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function deletePost(id) {
    // Show inline confirm modal instead of browser confirm()
    showDeleteModal(id);
}

function showDeleteModal(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'delete-modal-overlay';
    overlay.innerHTML = `
        <div class="delete-modal">
            <div class="delete-modal-icon">🗑️</div>
            <h4>Xoá bài viết?</h4>
            <p>Bài viết "<strong>${escHtml(post.title)}</strong>" sẽ bị xoá vĩnh viễn.</p>
            <div class="delete-modal-actions">
                <button class="btn-outline" onclick="closeDeleteModal()">Huỷ</button>
                <button class="btn btn-danger" onclick="confirmDelete(${id})">Xoá</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
}

function closeDeleteModal() {
    const overlay = document.getElementById('delete-modal-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 250);
    }
}

function confirmDelete(id) {
    posts = posts.filter(p => p.id !== id);
    if (editingPostId === id) {
        editingPostId = null;
        clearForm();
        resetFormUI();
    }
    savePostsToStorage();
    renderPosts();
    closeDeleteModal();
    showToast('🗑 Bài viết đã được xoá.');
}

function clearForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-content').value = '';
}

// ── RENDER ──
function renderPosts() {
    const grid = document.getElementById('posts-grid');

    // Update post count badge
    const countEl = document.getElementById('post-count');
    if (countEl) countEl.textContent = posts.length;

    if (posts.length === 0) {
        grid.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p>Chưa có bài viết nào. Hãy đăng bài đầu tiên!</p>
        </div>`;
        return;
    }

    grid.innerHTML = posts.map(post => `
        <div class="post-card ${editingPostId === post.id ? 'is-editing' : ''}" data-id="${post.id}">
            <div class="post-meta">
                <span class="post-category">${escHtml(post.cat)}</span>
                <span class="post-date">${post.date}${post.edited ? ' <em>(đã sửa)</em>' : ''}</span>
            </div>
            <h4>${escHtml(post.title)}</h4>
            <p>${escHtml(post.content.length > 120 ? post.content.slice(0, 120) + '…' : post.content)}</p>
            <div class="post-footer">
                <div class="post-author">
                    <div class="author-dot">${post.author.charAt(0).toUpperCase()}</div>
                    ${escHtml(post.author.charAt(0).toUpperCase() + post.author.slice(1))}
                </div>
                <div class="post-actions">
                    <button class="action-btn edit-btn" onclick="editPost(${post.id})" title="Chỉnh sửa">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Sửa
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePost(${post.id})" title="Xoá bài">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Xoá
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── TOAST ──
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Enter key on login
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-page').classList.contains('active')) {
        doLogin();
    }
    if (e.key === 'Escape') {
        closeDeleteModal();
        if (editingPostId !== null) cancelEdit();
    }
});

window.onload = function () {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        document.getElementById('user-avatar').textContent = savedUser.charAt(0).toUpperCase();
        document.getElementById('user-name-display').textContent =
            savedUser.charAt(0).toUpperCase() + savedUser.slice(1);
        loadPostsFromStorage();
        renderPosts();
        showPage('dashboard-page');
    } else {
        showPage('login-page');
    }
};