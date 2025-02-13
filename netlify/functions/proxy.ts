import { Context } from "@netlify/edge-functions";

const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === "string" ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === "string") {
        picked.set(key, value);
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

export default async (request: Request, context: Context) => {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, searchParams } = new URL(request.url);
  if(pathname === "/") {
    let blank_html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>GoogleAPI代理</title>
    <style>
        body {
            margin: 0;
            height: 100vh;
            background: url('img/1.jpg') no-repeat center/cover;
            font-family: 'Microsoft YaHei', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(3px);
        }

        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 3px solid #ffb6c1;
            box-shadow: 0 0 20px rgba(255,182,193,0.5);
            transition: transform 0.3s;
            cursor: pointer;
            object-fit: cover;
        }

        .avatar:hover {
            transform: rotate(360deg) scale(1.1);
        }

        .name {
            color: #ff69b4;
            font-size: 24px;
            margin: 20px 0;
            text-shadow: 1px 1px 2px white;
        }

        .links {
            display: flex;
            gap: 20px;
        }

        .link-item {
            padding: 10px 20px;
            background: rgba(255, 182, 193, 0.8);
            border-radius: 20px;
            color: white;
            text-decoration: none;
            transition: all 0.3s;
        }

        .link-item:hover {
            background: #ff69b4;
            transform: translateY(-3px);
        }

        #music-player {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <img src="https://q.qlogo.cn/headimg_dl?dst_uin=2976598430&spec=640" alt="头像" class="avatar" id="qqAvatar">
    <h1 class="name">Lika</h1>
    <div class="links">
        <a href="https://github.com/cutelika/palm-netlify-proxy" class="link-item">项目地址</a>
        <a href="https://gitee.com/ds_qi/lika_proxy/" class="link-item">国内地址</a>
    </div>
    <audio id="music-player" controls autoplay loop>
        <source src="//www.wgkj.ltd/music/crn.mp3" type="audio/mpeg">
        您的浏览器不支持音频播放
    </audio>
    <script>
        // QQ头像自动更新
        function updateQQAvatar(qq) {
            const avatar = document.getElementById('qqAvatar');
            avatar.src = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=640`;
        }

        // 请在此处填入你的QQ号
        updateQQAvatar('746882276');

        // 音乐播放器控制
        const musicPlayer = document.getElementById('music-player');
        musicPlayer.volume = 0.3; // 设置音量
        
        // 页面入场动画
        document.body.style.opacity = 0;
        setTimeout(() => {
            document.body.style.transition = 'opacity 1s';
            document.body.style.opacity = 1;
        }, 100);
    </script>
	</body>
</html>

    `
    return new Response(blank_html, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/html"
      },
    });
  }

  const url = new URL(pathname, "https://generativelanguage.googleapis.com");
  searchParams.delete("_path");

  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = pickHeaders(request.headers, ["content-type", "x-goog-api-client", "x-goog-api-key", "accept-encoding"]);

  const response = await fetch(url, {
    body: request.body,
    method: request.method,
    duplex: 'half',
    headers,
  });

  const responseHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(response.headers),
    "content-encoding": null
  };

  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status
  });
};
