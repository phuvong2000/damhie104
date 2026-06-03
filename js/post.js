// ── POST GRID ──
// Kết hợp: bài từ API JSON tĩnh + bài người dùng tạo ở dashboard

const API_URL = '../../data/posts.json'; // đường dẫn file JSON
const PAGE_SIZE = 9;
let currentPage = 1;
let allPosts = []; // toàn bộ bài (API + dashboard)

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── BƯỚC 1: Load bài từ file JSON tĩnh ──
async function fetchFromAPI() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Không tải được JSON');
        const data = await res.json();
        return data.posts || [];
    } catch (err) {
        console.warn('Lỗi load API:', err);
        return [];
    }
}

// ── BƯỚC 2: Load bài từ localStorage (dashboard tạo) ──
function fetchFromStorage() {
    const saved = localStorage.getItem('posts');
    return saved ? JSON.parse(saved) : [];
}

// ── BƯỚC 3: Gộp, loại trùng, sắp xếp mới nhất lên đầu ──
function mergePosts(apiPosts, storagePosts) {
    // Đánh dấu nguồn gốc
    const tagged = [
        ...storagePosts.map(p => ({ ...p, _source: 'user' })),
        ...apiPosts.map(p => ({ ...p, _source: 'api' }))
    ];
    // Loại trùng theo id (ưu tiên user)
    const seen = new Set();
    return tagged.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });
}

// ── RENDER CARDS ──
function renderCards(posts) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    if (posts.length === 0) {
        grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#ccc" style="margin-bottom:16px;display:block;margin-left:auto;margin-right:auto">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p style="color:#aaa">Chưa có bài viết nào.</p>
        </div>`;
        return;
    }

    // Đường dẫn trang detail — chỉnh nếu cấu trúc thư mục khác
    const DETAIL_URL = '../posts/index.html';

    grid.innerHTML = posts.map(post => `
      <div class="col-lg-4 col-md-6 d-flex mb-4">
        <div class="post-card w-100" style="cursor:pointer" onclick="goToDetail(${post.id})">
          <div class="img-wrap">
            <img src="${post.image || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80'}"
                 alt="${escHtml(post.cat)}" loading="lazy">
            <span class="cat-badge">${escHtml(post.cat)}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">
              <a href="${DETAIL_URL}" onclick="event.stopPropagation();goToDetail(${post.id});return false;">
                ${escHtml(post.title)}
              </a>
            </h3>
            <p class="card-text">
              ${escHtml(post.content.length > 120 ? post.content.slice(0, 120) + '…' : post.content)}
            </p>
            <div class="post-meta">
              <div class="author">
                <div class="author-avatar">${post.author ? post.author.charAt(0).toUpperCase() : '?'}</div>
                <div>
                  <a href="#">${escHtml(post.author ? post.author.charAt(0).toUpperCase() + post.author.slice(1) : 'Unknown')}</a>
                  <br><span>${post.date}${post.edited ? ' · <em>đã sửa</em>' : ''}</span>
                </div>
              </div>
              <div class="stats">
                <span><i class="fas fa-comment"></i> ${post.comments || 0}</span>
                <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
}

// ── RENDER PAGINATION ──
function renderPagination(total) {
    const el = document.getElementById('blog-pagination');
    if (!el) return;

    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    let html = '<ul class="pagination">';

    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${currentPage - 1});return false;">
            <i class="fas fa-chevron-left" style="font-size:.7rem"></i>
        </a></li>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${i});return false;">${i}</a>
        </li>`;
    }

    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${currentPage + 1});return false;">
            <i class="fas fa-chevron-right" style="font-size:.7rem"></i>
        </a></li>`;

    html += '</ul>';
    el.innerHTML = html;
}

// ── PHÂN TRANG ──
function goToPage(page) {
    const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    const slice = allPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    renderCards(slice);
    renderPagination(allPosts.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── INIT ──
async function init() {
    allPosts = fetchFromStorage(); // chỉ lấy từ localStorage
    const slice = allPosts.slice(0, PAGE_SIZE);
    renderCards(slice);
    renderPagination(allPosts.length);
}

// Lắng nghe khi dashboard thêm/sửa/xóa bài (tab khác)
window.addEventListener('storage', e => {
    if (e.key === 'posts') {
        currentPage = 1;
        init();
    }
});

document.addEventListener('DOMContentLoaded', init);

// ── Chuyển sang trang detail ──
function goToDetail(id) {
    localStorage.setItem('currentPostId', String(id));
    window.location.href = '../post/index.html'; // 
}
