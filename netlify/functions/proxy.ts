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
<html>
<head>
  <meta charset="UTF-8">
  <title>GoogleGemini代理--lika</title>
</head>
<body>
  <h1 id="google-palm-api-proxy-on-netlify-edge">Google代理--lika</h1>
  <p>Tips: 提示：本项目使用反向代理来解决 Google API 中的位置限制等问题。 </p>
  <p>如果您有以下任何要求，您可能需要此项目的支持。</p>
  <ol>
  <li>当您在调用 Google API 时看到错误消息“API 使用不支持用户位置”时</li>
  <li>您想要自定义 Google API时</li>
  <li>题外话:记得点个Star~</li>
  </ol>
  <p>该项目免费向所有人提供，本人Gmail： <a href="./">ellyminor1291981utg@gmail.com</a></p>
  <p>项目地址： <a href="//github.com/cutelika/palm-netlify-proxy">点我进入</a></p>
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
