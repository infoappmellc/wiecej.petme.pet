const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const postForm = document.getElementById('post-form');
const postStatus = document.getElementById('post-status');
const postsList = document.getElementById('posts');
const logoutBtn = document.getElementById('logout-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');

const inputs = {
  id: document.getElementById('post-id'),
  title: document.getElementById('post-title'),
  slug: document.getElementById('post-slug'),
  description: document.getElementById('post-description'),
  content: document.getElementById('post-content'),
  previewImage: document.getElementById('post-preview'),
};

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Yêu cầu thất bại');
  }
  return res.json().catch(() => ({}));
}

function setStatus(el, message, isSuccess = false) {
  el.textContent = message || '';
  el.classList.toggle('success', isSuccess);
}

async function refreshAuthState() {
  try {
    const data = await apiFetch('/api/me', { method: 'GET', credentials: 'same-origin' });
    if (data.authenticated) {
      loginSection.classList.add('hidden');
      adminSection.classList.remove('hidden');
      await loadPosts();
    } else {
      loginSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
    }
  } catch (err) {
    console.error(err);
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  setStatus(loginStatus, 'Đang đăng nhập...');
  try {
    await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password'),
      }),
    });
    setStatus(loginStatus, 'Đăng nhập thành công', true);
    await refreshAuthState();
  } catch (err) {
    setStatus(loginStatus, err.message);
  }
});

logoutBtn?.addEventListener('click', async () => {
  await apiFetch('/api/logout', { method: 'POST' });
  resetForm();
  setStatus(postStatus, '');
  await refreshAuthState();
});

async function loadPosts() {
  postsList.innerHTML = '<li>Đang tải...</li>';
  try {
    const posts = await apiFetch('/api/posts');
    if (!posts.length) {
      postsList.innerHTML = '<li>Chưa có bài viết.</li>';
      return;
    }
    postsList.innerHTML = '';
    posts
      .slice()
      .reverse()
      .forEach((post) => {
        const li = document.createElement('li');
        li.className = 'post-card';
        li.innerHTML = `
          <h3>${post.title}</h3>
          <small>${post.slug}</small>
          <p>${post.description || '—'}</p>
          <div class="post-card__actions">
            <a href="/${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">Xem</a>
            <button type="button" data-action="edit" data-id="${post.id}">Sửa</button>
            <button type="button" class="ghost" data-action="delete" data-id="${post.id}">Xóa</button>
          </div>
        `;
        postsList.appendChild(li);
      });
  } catch (err) {
    postsList.innerHTML = `<li>Lỗi: ${err.message}</li>`;
  }
}

postsList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'edit') {
    try {
      const post = await apiFetch(`/api/posts/${id}`);
      fillForm(post);
    } catch (err) {
      setStatus(postStatus, err.message);
    }
  }
  if (action === 'delete') {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
      setStatus(postStatus, 'Đã xóa bài viết.', true);
      resetForm();
      await loadPosts();
    } catch (err) {
      setStatus(postStatus, err.message);
    }
  }
});

postForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    title: inputs.title.value,
    slug: inputs.slug.value,
    description: inputs.description.value,
    content: inputs.content.value,
    previewImage: inputs.previewImage.value,
  };

  const id = inputs.id.value;
  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `/api/posts/${id}` : '/api/posts';

  setStatus(postStatus, 'Đang lưu...');
  try {
    await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
    setStatus(postStatus, 'Đã lưu bài viết.', true);
    resetForm();
    await loadPosts();
  } catch (err) {
    setStatus(postStatus, err.message);
  }
});

cancelEditBtn?.addEventListener('click', () => {
  resetForm();
});

function fillForm(post) {
  slugManuallyEdited = true;
  inputs.id.value = post.id;
  inputs.title.value = post.title || '';
  inputs.slug.value = post.slug || '';
  inputs.description.value = post.description || '';
  inputs.content.value = post.content || '';
  inputs.previewImage.value = post.previewImage || '';
  formTitle.textContent = 'Chỉnh sửa bài viết';
  cancelEditBtn.classList.remove('hidden');
}

function resetForm() {
  slugManuallyEdited = false;
  inputs.id.value = '';
  postForm.reset();
  formTitle.textContent = 'Thêm bài viết';
  cancelEditBtn.classList.add('hidden');
}

refreshAuthState();
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

let slugManuallyEdited = false;

inputs.slug.addEventListener('input', () => {
  slugManuallyEdited = inputs.slug.value.trim().length > 0;
});

inputs.title.addEventListener('input', () => {
  if (!inputs.id.value && !slugManuallyEdited) {
    inputs.slug.value = slugifyInput(inputs.title.value);
  }
});
