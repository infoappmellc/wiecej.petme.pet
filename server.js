const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const slugify = require('slugify');
const { randomUUID } = require('crypto');

const slugifyOptions = { lower: true, strict: true };

const SITE_NAME = 'Miłośnicy Psów i Kotów';
const DEFAULT_DESCRIPTION = 'Zobacz szczegóły tutaj';
const DEFAULT_IMAGE = 'https://www.facebook.com/images/fb_icon_325x325.png';

const ADMIN_USER = 'admin';
const ADMIN_PASS = '123123123';
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const PORT = process.env.PORT || 8787;

const app = express();

app.use(bodyParser.json({ limit: '1mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'petme-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

function requireAuth(req, res, next) {
  if (req.session && req.session.user === ADMIN_USER) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

async function readPosts() {
  try {
    const contents = await fs.readFile(POSTS_FILE, 'utf8');
    return JSON.parse(contents);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(POSTS_FILE, '[]', 'utf8');
      return [];
    }
    throw err;
  }
}

async function writePosts(posts) {
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

function toSlug(value) {
  return slugify(value || '', slugifyOptions);
}

function sanitizePostInput(body) {
  const { title = '', slug = '', description = '', content = '', previewImage = '' } = body;
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { error: 'Title is required.' };
  }

  const derivedSlug = slug.trim() ? toSlug(slug.trim()) : toSlug(trimmedTitle);
  if (!derivedSlug) {
    return { error: 'Slug could not be generated.' };
  }

  return {
    title: trimmedTitle,
    slug: derivedSlug,
    description: description.trim(),
    content: content.trim(),
    previewImage: previewImage.trim(),
  };
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = ADMIN_USER;
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ authenticated: req.session?.user === ADMIN_USER });
});

app.get('/api/posts', requireAuth, async (req, res) => {
  const posts = await readPosts();
  res.json(posts);
});

app.get('/api/posts/:id', requireAuth, async (req, res) => {
  const posts = await readPosts();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.get('/public/posts/:slug', async (req, res) => {
  const posts = await readPosts();
  const requestedSlug = req.params.slug || '';
  const normalizedSlug = toSlug(requestedSlug);
  const post = posts.find((p) => p.slug === normalizedSlug);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { id, ...rest } = post;
  res.json(rest);
});

app.post('/api/posts', requireAuth, async (req, res) => {
  const sanitized = sanitizePostInput(req.body);
  if (sanitized.error) {
    return res.status(400).json({ error: sanitized.error });
  }

  const posts = await readPosts();
  if (posts.some((p) => p.slug === sanitized.slug)) {
    return res.status(409).json({ error: 'Slug already exists' });
  }

  const newPost = {
    id: randomUUID(),
    ...sanitized,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  await writePosts(posts);
  res.status(201).json(newPost);
});

app.put('/api/posts/:id', requireAuth, async (req, res) => {
  const sanitized = sanitizePostInput(req.body);
  if (sanitized.error) {
    return res.status(400).json({ error: sanitized.error });
  }

  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (posts.some((p) => p.slug === sanitized.slug && p.id !== req.params.id)) {
    return res.status(409).json({ error: 'Slug already exists' });
  }

  posts[index] = {
    ...posts[index],
    ...sanitized,
    updatedAt: new Date().toISOString(),
  };

  await writePosts(posts);
  res.json(posts[index]);
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const posts = await readPosts();
  const filtered = posts.filter((p) => p.id !== req.params.id);
  if (filtered.length === posts.length) {
    return res.status(404).json({ error: 'Post not found' });
  }
  await writePosts(filtered);
  res.status(204).send();
});

const RESERVED_SLUGS = new Set([
  'api',
  'public',
  'admin',
  'styles.css',
  'post.css',
  'post.js',
  'app.js',
  'admin.js',
  'favicon.ico',
]);

app.get('/:slug', async (req, res, next) => {
  const { slug } = req.params;
  if (!slug || RESERVED_SLUGS.has(slug) || slug.includes('.')) {
    return next();
  }

  const normalizedSlug = toSlug(slug);
  const posts = await readPosts();
  const post = posts.find((p) => p.slug === normalizedSlug);
  if (!post) {
    return next();
  }

  const fullUrl = `${req.protocol}://${req.get('host')}/${post.slug}`;
  return res.send(renderPostHtml(post, fullUrl));
});

app.use((err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Admin backend running on http://localhost:${PORT}`);
});

function escapeHtml(input = '') {
  return input.replace(/[&<>"']/g, (char) => {
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

function renderPostHtml(post, fullUrl) {
  const title = escapeHtml(post.title || SITE_NAME);
  const description = escapeHtml(post.description || DEFAULT_DESCRIPTION);
  const image = escapeHtml(post.previewImage || DEFAULT_IMAGE);
  const safeUrl = escapeHtml(fullUrl);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <link rel="stylesheet" href="/post.css">
    <script>
      window.__POST_PREFETCH__ = ${JSON.stringify({
        title: post.title,
        content: post.content,
        previewImage: post.previewImage,
        slug: post.slug,
      })};
    </script>
  </head>
  <body>
    <main class="post-container">
      <div id="status" class="status">Đang tải bài viết...</div>
      <article id="article" class="hidden">
        <h1 id="title"></h1>
        <figure id="preview-wrapper" class="hidden">
          <img id="preview" alt="Ảnh xem trước">
        </figure>
        <section id="content" class="content"></section>
      </article>
    </main>
    <script src="/post.js" type="module"></script>
  </body>
</html>`;
}
