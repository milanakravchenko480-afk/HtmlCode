export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const GITHUB_TOKEN = "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";
    const OWNER = "milanakravchenko480-afk";
    const REPO = "HtmlCode";
    const FILE_PATH = "apps.json";

    try {
      const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
      const getRes = await fetch(getUrl, {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Cloudflare-Worker"
        }
      });

      let currentContent = [];
      let sha = null;

      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
        const decoded = atob(data.content);
        currentContent = JSON.parse(decoded);
      } else if (getRes.status !== 404) {
        return new Response("Ошибка чтения файла", { status: 500 });
      }

      const newApp = await request.json();
      currentContent.push(newApp);

      const newContentEncoded = btoa(JSON.stringify(currentContent, null, 2));

      const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
      const putRes = await fetch(putUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Cloudflare-Worker",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Добавлено приложение: ${newApp.name}`,
          content: newContentEncoded,
          sha: sha
        })
      });

      if (!putRes.ok) {
        const err = await putRes.text();
        return new Response(`Ошибка GitHub: ${err}`, { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (e) {
      return new Response(`Ошибка: ${e.message}`, { status: 500 });
    }
  }
}
