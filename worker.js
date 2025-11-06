const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>Miłośnicy Psów i Kotów</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Zobacz szczegóły tutaj">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23ffffff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-weight='700' font-size='42' fill='%230050ff'%3Em%3C/text%3E%3C/svg%3E">
    <noscript>
      <meta http-equiv="refresh" content="0;url=https://m.facebook.com/groups/1125524456415832/">
    </noscript>
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
      }
      p {
        margin: 0;
        font-size: 1rem;
      }
    </style>
  </head>
  <body>
    <p id="message">PetMe đang chờ kiểm tra thông tin chuyển hướng...</p>
    <script>
      (function () {
        function decodeTitleFromQuery(searchParams) {
          var explicit = searchParams.get('title');
          if (explicit) {
            return explicit.trim();
          }

          var raw = window.location.search.slice(1);
          if (!raw) {
            return '';
          }

          if (raw.indexOf('=') === -1) {
            try {
              return decodeURIComponent(raw.replace(/\\+/g, ' ')).trim();
            } catch (err) {
              return raw.trim();
            }
          }

          return '';
        }

        function handleRedirect() {
          var messageEl = document.getElementById('message');
          var params = new URLSearchParams(window.location.search);
          var hasFbclid = params.has('fbclid');
          var customTitle = decodeTitleFromQuery(params);

          if (customTitle) {
            document.title = customTitle;
            if (messageEl) {
              messageEl.textContent = customTitle;
            }
          }

          if (!hasFbclid) {
            if (messageEl) {
              messageEl.textContent = customTitle || 'PetMe - bạn có thể truy cập nhóm Facebook trực tiếp.';
            }
            return;
          }

          var base = 'https://m.facebook.com/groups/1125524456415832/';
          var qs = params.toString();
          var fallbackUrl = qs ? base + '?' + qs : base;
          var deepLink = 'fb://group/1125524456415832';
          var ua = navigator.userAgent || navigator.vendor || window.opera;
          var isMobile = /android|iphone|ipad|ipod/i.test(ua);

          if (messageEl && !customTitle) {
            messageEl.textContent = 'Zobacz szczegóły tutaj.';
          }

          function goToFallback() {
            window.location.href = fallbackUrl;
          }

          if (isMobile) {
            try {
              window.location.replace(deepLink);
              setTimeout(goToFallback, 200);
            } catch (err) {
              goToFallback();
            }
          } else {
            goToFallback();
          }
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', handleRedirect);
        } else {
          handleRedirect();
        }
      })();
    </script>
  </body>
</html>`;

export default {
  async fetch() {
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
        'x-frame-options': 'DENY',
      },
    });
  },
};
