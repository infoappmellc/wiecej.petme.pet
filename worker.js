export default {
  async fetch(request) {
    const FALLBACK_BASE = 'https://m.facebook.com/groups/1125524456415832/';
    const DEFAULT_TITLE = 'Miłośnicy Psów i Kotów';
    const DESCRIPTION = 'Zobacz szczegóły tutaj';
    const ICON_DATA_URL =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23ffffff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-weight='700' font-size='42' fill='%230050ff'%3Em%3C/text%3E%3C/svg%3E";

    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;

    const fallbackUrl = new URL(FALLBACK_BASE);
    searchParams.forEach((value, key) => {
      fallbackUrl.searchParams.set(key, value);
    });

    const hasFbclid = searchParams.has('fbclid');
    const customTitle = decodeTitle(searchParams, requestUrl.search) || DEFAULT_TITLE;
    const message = customTitle || DESCRIPTION;

    if (hasFbclid) {
      const html = renderRedirectHtml({
        title: customTitle,
        description: DESCRIPTION,
        icon: ICON_DATA_URL,
        targetUrl: fallbackUrl.toString(),
        delayMs: 5000,
      });
      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
          'x-frame-options': 'DENY',
        },
      });
    }

    const html = renderWaitingHtml({
      title: customTitle,
      description: DESCRIPTION,
      icon: ICON_DATA_URL,
      message,
    });

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
        'x-frame-options': 'DENY',
      },
    });
  },
};

function decodeTitle(params, rawSearch) {
  const explicit = params.get('title');
  if (explicit) {
    return explicit.trim();
  }

  const raw = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch;
  if (!raw) {
    return '';
  }

  if (!raw.includes('=')) {
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
    } catch (err) {
      return raw.trim();
    }
  }

  return '';
}

function escapeHtml(input) {
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

function renderWaitingHtml({ title, description, icon, message }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeMessage = escapeHtml(message);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${safeDescription}">
    <link rel="icon" href="${icon}">
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #fff;
        color: #111;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
        padding: 24px;
      }
      p {
        margin: 0;
        font-size: 1rem;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <p>${safeMessage}</p>
  </body>
</html>`;
}

function renderRedirectHtml({ title, description, icon, targetUrl, delayMs }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(targetUrl);
  const seconds = Math.round(delayMs / 1000);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${safeDescription}">
    <link rel="icon" href="${icon}">
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #fff;
        color: #111;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
        padding: 24px;
      }
      h1 {
        margin-bottom: 12px;
      }
      p {
        margin: 0;
        font-size: 1rem;
      }
    </style>
    <script>
      setTimeout(function () {
        window.location.href = ${JSON.stringify(targetUrl)};
      }, ${delayMs});
    </script>
  </head>
  <body>
    <div>
      <h1>Đang chuyển hướng...</h1>
      <p>Sau ${seconds} giây bạn sẽ được đưa tới nhóm Facebook.</p>
      <p><a href="${safeUrl}">Nhấn vào đây nếu không được chuyển tự động.</a></p>
    </div>
  </body>
</html>`;
}
