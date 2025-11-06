const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>Tham gia nhóm PetMe trên Facebook</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="description" content="Chuyển hướng nhanh đến nhóm Facebook PetMe.">
    <meta property="og:title" content="Tham gia nhóm PetMe trên Facebook">
    <meta property="og:description" content="Nhấn để mở ứng dụng Facebook và tham gia cộng đồng PetMe.">
    <meta property="og:url" content="https://wiecej.petme.pet/">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://www.facebook.com/images/fb_icon_325x325.png">
    <meta http-equiv="refresh" content="4;url=https://www.facebook.com/groups/1125524456415832">
    <script>
      (function () {
        const fallbackUrl = 'https://www.facebook.com/groups/1125524456415832';
        const deepLink = 'fb://group/1125524456415832';
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isAndroid = /android/i.test(userAgent);
        const isIOS = /iphone|ipad|ipod/i.test(userAgent);

        if (isAndroid || isIOS) {
          const timeout = setTimeout(function () {
            window.location.href = fallbackUrl;
          }, 1200);

          const visibilityHandler = function () {
            if (document.hidden) {
              clearTimeout(timeout);
            }
          };

          document.addEventListener('visibilitychange', visibilityHandler);
          window.location.replace(deepLink);
        } else {
          window.location.href = fallbackUrl;
        }
      })();
    </script>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: radial-gradient(circle at top, #ffe0e5 0%, #f4f4f4 35%, #ffffff 100%);
        color: #1d1d1f;
        text-align: center;
        padding: 0 18px;
      }
      .card {
        background: rgba(255, 255, 255, 0.85);
        border-radius: 18px;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.08);
        padding: 38px 28px;
        max-width: 420px;
      }
      h1 {
        font-size: 1.6rem;
        margin-bottom: 0.75rem;
      }
      p {
        margin-top: 0.35rem;
        margin-bottom: 0;
        line-height: 1.5;
        font-size: 1rem;
      }
      .spinner {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 4px solid rgba(0, 0, 0, 0.12);
        border-top-color: #f97316;
        margin: 0 auto 18px;
        animation: spin 0.9s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner" aria-hidden="true"></div>
      <h1>Đang mở ứng dụng Facebook...</h1>
      <p>Nếu ứng dụng không tự mở, hãy nhấn vào nút <strong>Tham gia nhóm</strong> trong 3 giây nữa.</p>
    </div>
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
