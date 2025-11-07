const statusEl = document.getElementById('status');
const articleEl = document.getElementById('article');
const titleEl = document.getElementById('title');
const previewWrapper = document.getElementById('preview-wrapper');
const previewImg = document.getElementById('preview');
const contentEl = document.getElementById('content');

function applyPostData(data) {
  if (!data) {
    throw new Error('Không tìm thấy bài viết.');
  }
  document.title = data.title || document.title;
  titleEl.textContent = data.title || '';

  if (data.previewImage) {
    previewImg.src = data.previewImage;
    previewImg.alt = data.title || 'Ảnh xem trước';
    previewWrapper.classList.remove('hidden');
  } else {
    previewWrapper.classList.add('hidden');
  }

  contentEl.innerHTML = renderContent(data.content);
  statusEl.classList.add('hidden');
  articleEl.classList.remove('hidden');
}

function slugifyInput(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getSlug() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (slug) {
    return slugifyInput(slug);
  }
  const raw = window.location.pathname.split('/').filter(Boolean);
  return slugifyInput(raw[raw.length - 1] || '');
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function renderContent(text = '') {
  if (!text.trim()) {
    return '<p><em>Nội dung trống.</em></p>';
  }
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

async function loadPost() {
  if (window.__POST_PREFETCH__) {
    try {
      applyPostData(window.__POST_PREFETCH__);
      return;
    } catch (err) {
      console.error(err);
    }
  }

  const slug = getSlug();
  if (!slug) {
    statusEl.textContent = 'Thiếu tham số slug.';
    return;
  }
  try {
    statusEl.textContent = 'Đang tải dữ liệu...';
    const res = await fetch(`/public/posts/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      throw new Error('Không tìm thấy bài viết.');
    }
    const data = await res.json();
    applyPostData(data);
  } catch (err) {
    statusEl.textContent = err.message || 'Đã xảy ra lỗi.';
  }
}

loadPost();
