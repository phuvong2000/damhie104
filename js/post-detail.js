// ── POST DETAIL — đọc bài từ localStorage theo id ──

const CAT_IMAGES = {
    'chăm sóc':   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    'dinh dưỡng': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    'huấn luyện': 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&q=80',
    'sức khoẻ':   'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&q=80',
    'làm đẹp':    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
    'thú cưng':   'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    'default':    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
};

function getImage(cat) {
    return CAT_IMAGES[(cat || '').toLowerCase()] || CAT_IMAGES['default'];
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Lấy tất cả bài (API JSON + dashboard)
async function getAllPosts() {
    return JSON.parse(localStorage.getItem('posts') || '[]');
}

async function renderDetail() {
    const postId = localStorage.getItem('currentPostId');
    if (!postId) {
        showNotFound();
        return;
    }

    const allPosts = await getAllPosts();
    const post = allPosts.find(p => String(p.id) === String(postId));

    if (!post) {
        showNotFound();
        return;
    }

    // ── Cập nhật <title> trang ──
    document.title = post.title + ' — Pooh Care';

    // ── Breadcrumb ──
    const breadcrumb = document.querySelector('.breadcrumb-wrap span:last-child');
    if (breadcrumb) breadcrumb.textContent = post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title;

    // ── Article title ──
    const titleEl = document.querySelector('.article-title');
    if (titleEl) titleEl.textContent = post.title;

    // ── Article meta ──
    const metaEl = document.querySelector('.article-meta');
    if (metaEl) metaEl.innerHTML = `
        <span><i class="fa fa-calendar-alt"></i> ${post.date}</span>
        <span><i class="fa fa-user"></i> By ${escHtml(post.author ? post.author.charAt(0).toUpperCase() + post.author.slice(1) : 'Admin')}</span>
        <span><i class="fa fa-tag"></i> ${escHtml(post.cat)}</span>
        <span><i class="fa fa-eye"></i> ${post.views || 0} Lượt xem</span>
        <span><i class="fa fa-comment"></i> ${post.comments || 0} Bình luận</span>
    `;

    // ── Cover image ──
    const coverEl = document.querySelector('.article-cover');
    if (coverEl) {
        coverEl.src = post.image || getImage(post.cat);
        coverEl.alt = post.title;
    }

    // ── Nội dung bài ──
    const bodyEl = document.querySelector('.article-body');
    if (bodyEl) {
        // Chia nội dung thành các đoạn
        const paragraphs = post.content
            .split('\n')
            .filter(p => p.trim())
            .map(p => `<p>${escHtml(p.trim())}</p>`)
            .join('');
        bodyEl.innerHTML = paragraphs || `<p>${escHtml(post.content)}</p>`;
    }

    // ── Prev / Next ──
    const idx = allPosts.findIndex(p => String(p.id) === String(postId));
    const prevPost = allPosts[idx + 1] || null;
    const nextPost = allPosts[idx - 1] || null;

    const prevEl = document.querySelector('.post-nav-item.prev');
    if (prevEl) {
        if (prevPost) {
            prevEl.querySelector('img').src = prevPost.image || getImage(prevPost.cat);
            prevEl.querySelector('.post-nav-title').textContent = prevPost.title;
            prevEl.onclick = () => goToPost(prevPost.id);
            prevEl.style.cursor = 'pointer';
        } else {
            prevEl.style.opacity = '.4';
            prevEl.style.pointerEvents = 'none';
        }
    }

    const nextEl = document.querySelector('.post-nav-item.next');
    if (nextEl) {
        if (nextPost) {
            nextEl.querySelector('img').src = nextPost.image || getImage(nextPost.cat);
            nextEl.querySelector('.post-nav-title').textContent = nextPost.title;
            nextEl.onclick = () => goToPost(nextPost.id);
            nextEl.style.cursor = 'pointer';
        } else {
            nextEl.style.opacity = '.4';
            nextEl.style.pointerEvents = 'none';
        }
    }

    // ── Related posts (cùng danh mục) ──
    const related = allPosts
        .filter(p => String(p.id) !== String(postId) && p.cat === post.cat)
        .slice(0, 2);

    const relatedContainer = document.querySelector('#related .row.g-4');
    if (relatedContainer && related.length > 0) {
        relatedContainer.innerHTML = related.map(p => `
          <div class="col-md-6">
            <div class="related-card card" style="cursor:pointer" onclick="goToPost(${p.id})">
              <img src="${p.image || getImage(p.cat)}" alt="${escHtml(p.title)}" />
              <div class="card-body">
                <h5><a href="#" style="color:inherit;text-decoration:none;">${escHtml(p.title)}</a></h5>
                <p>${escHtml(p.content.length > 80 ? p.content.slice(0, 80) + '…' : p.content)}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="related-author">
                    <a href="#">${escHtml(p.author ? p.author.charAt(0).toUpperCase() + p.author.slice(1) : 'Admin')}</a>
                    · ${p.date}
                  </span>
                  <div class="related-meta">
                    <span><i class="fa fa-comment"></i> ${p.comments || 0}</span>
                    <span><i class="fa fa-eye"></i> ${p.views || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('');
    }

    // ── Recent posts sidebar ──
    const recentContainer = document.querySelector('.sidebar-widget:nth-child(3)');
    if (recentContainer) {
        const recent = allPosts.filter(p => String(p.id) !== String(postId)).slice(0, 3);
        const recentHtml = recent.map(p => `
          <div class="recent-post" style="cursor:pointer" onclick="goToPost(${p.id})">
            <img src="${p.image || getImage(p.cat)}" alt="${escHtml(p.title)}" />
            <div class="recent-post-info">
              <h6><a href="#">${escHtml(p.title.length > 40 ? p.title.slice(0, 40) + '…' : p.title)}</a></h6>
              <span><i class="fa fa-calendar-alt" style="color:#28a745;margin-right:4px"></i>${p.date}</span>
            </div>
          </div>
        `).join('');
        const widgetTitle = recentContainer.querySelector('.widget-title');
        recentContainer.innerHTML = '';
        recentContainer.appendChild(widgetTitle);
        recentContainer.insertAdjacentHTML('beforeend', recentHtml);
    }
}

// Chuyển sang bài khác
function goToPost(id) {
    localStorage.setItem('currentPostId', String(id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderDetail();
}

function showNotFound() {
    const titleEl = document.querySelector('.article-title');
    if (titleEl) titleEl.textContent = 'Không tìm thấy bài viết';
    const bodyEl = document.querySelector('.article-body');
    if (bodyEl) bodyEl.innerHTML = `
        <p style="color:#aaa;text-align:center;padding:40px 0">
            Bài viết không tồn tại hoặc đã bị xóa.
            <br><br>
            <a href="../post/index.html" style="color:#28a745">← Quay về danh sách bài viết</a>
        </p>`;
}

document.addEventListener('DOMContentLoaded', renderDetail);