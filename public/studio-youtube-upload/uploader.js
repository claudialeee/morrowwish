"use strict";
// Morrow Wish owner-only browser uploader. OAuth token remains in memory.
// Public OAuth CLIENT ID is browser-safe; never ask for Client Secret or API Key.
(function () {
  const EXPECTED_CHANNEL = "UC9v31QGhSfBASDsbXMjch4Q";
  const MANIFEST_PATH = "/promo/latest-review.json";
  const CAMPAIGN = "mw-v14-relaunch-20261122";
  const SLOT_0 = Date.parse("2026-11-23T03:00:00Z"); // 2026-11-22 19:00 PST
  const GAMES = [
    {
      slug: "pocket-aquarium", label: "Pocket Aquarium",
      title: "Pocket Aquarium — Can You Beat This Fish Combo? #Shorts",
      text: "Looks peaceful... until the timer starts. Feed the fish, build your combo, and chase your best score. Can you do better? #PocketAquarium #IndieGame #BrowserGame"
    },
    {
      slug: "parcel-panic", label: "Parcel Panic",
      title: "Parcel Panic — Can You Survive the Express Orders? #Shorts",
      text: "Looks easy? Wait until the express orders hit! One life left. Can you survive the shift? #ParcelPanic #IndieGame #BrowserGame"
    },
    {
      slug: "flip-dash", label: "Flip Dash",
      title: "Flip Dash — One Wrong Flip and It's Over! #Shorts",
      text: "One tap. One gravity flip. One tiny mistake... game over. How far can you survive? #FlipDash #IndieGame #ArcadeGame"
    },
    {
      slug: "elsewhere", label: "Elsewhere",
      title: "Elsewhere — What If You Could Choose Another Life? #Shorts",
      text: "A new city. A different future. One choice can change everything. Which life would you live? #ElsewhereGame #IndieGame #StoryGame"
    },
    {
      slug: "tiny-town", label: "Tiny Town",
      title: "Tiny Town — No Jobs. Just Build Your Dream Town! #Shorts",
      text: "Seven days. Five neighbors. A town full of wishes. What would you build first? #TinyTown #CozyGame #IndieGame"
    },
    {
      slug: "pawsibly-innocent", label: "Pawsibly Innocent",
      title: "Pawsibly Innocent — Steal the Fish. Don't Get Caught! #Shorts",
      text: "A sneaky cat. Three fish to steal. One very suspicious human. Can you escape without getting caught? #PawsiblyInnocent #CatGame #IndieGame"
    },
    {
      slug: "cat-bond", label: "Cat Bond",
      title: "Cat Bond — TWO Cats, ONE Legendary Ultimate! #Shorts",
      text: "Two cats. One legendary duo finisher. Build your dream cat team, unleash the combo, and meet rare new friends. Which cats would you choose? #CatBond #CatGame #IndieGame #BrowserGame"
    }
  ];
  const el = id => document.getElementById(id);
  const state = {
    token: null, channel: null, videos: null, manifest: null,
    uploadBusy: false, existing: new Map(), draftVerified: false
  };
  const ledgerKey = CAMPAIGN + ":finished:" + EXPECTED_CHANNEL;
  const clientKey = CAMPAIGN + ":oauth-client-id";
  const ledger = loadLedger();
  const rowStates = new Map();

  function loadLedger() {
    try {
      const value = JSON.parse(localStorage.getItem(ledgerKey) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function saveLedger() {
    localStorage.setItem(ledgerKey, JSON.stringify(ledger));
  }
  function setStatus(message, isError) {
    el("state").textContent = message;
    el("state").className = isError ? "fail" : "";
  }
  function setChannelStatus(message, isError) {
    el("channel-state").textContent = message;
    el("channel-state").className = isError ? "fail" : "good";
  }
  function setRow(slug, message, isError) {
    rowStates.set(slug, { message, isError });
    const target = document.querySelector('[data-status-for="' + slug + '"]');
    if (target) {
      target.textContent = message;
      target.className = isError ? "fail" : "";
    }
  }
  function progress(total) {
    el("progress").style.width = Math.round(Math.min(1, Math.max(0, total)) * 100) + "%";
  }
  function controls() {
    el("start").disabled = !state.token || !state.channel ||
      !state.draftVerified || !el("confirm").checked || state.uploadBusy;
    el("connect").disabled = state.uploadBusy;
    el("check").disabled = !state.token || !state.channel || state.uploadBusy;
  }
  function isValidClientId(value) {
    return /^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(value.trim());
  }
  function descriptionFor(game) {
    return game.text + "\n\nPlay free — find the game on our channel profile!\n#Shorts";
  }
  function slotFor(index) {
    return new Date(SLOT_0 + index * 300000);
  }
  function renderManifest() {
    const tbody = el("list");
    tbody.replaceChildren();
    for (const [i, game] of GAMES.entries()) {
      const item = state.videos && state.videos[game.slug];
      const tr = document.createElement("tr");
      const parts = [
        String(i + 1),
        game.label,
        item ? item.video.split("/").at(-1) : "—",
        "19:" + String(i * 5).padStart(2, "0")
      ];
      for (const label of parts) {
        const td = document.createElement("td");
        td.textContent = label;
        tr.append(td);
      }
      const status = document.createElement("td");
      status.dataset.statusFor = game.slug;
      status.textContent = rowStates.get(game.slug)?.message || "等待";
      tr.append(status);
      tbody.append(tr);
    }
  }
  async function loadManifest() {
    const res = await fetch(MANIFEST_PATH + "?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw Error("无法读取最新审核清单（HTTP " + res.status + "）。");
    const parsed = await res.json();
    const entries = parsed.trailers || [];
    const expected = new Set(GAMES.map(game => game.slug));
    if (!Array.isArray(entries) || entries.length !== 7 ||
      entries.some(x => !expected.has(x.slug))) {
      throw Error("最新审核清单不是完整的七款游戏，不允许上传。");
    }
    const videos = {};
    for (const item of entries) {
      if (videos[item.slug]) throw Error("审核清单包含重复游戏：" + item.slug);
      if (item.paused) throw Error("审核视频已经暂停制作：" + item.slug);
      if (typeof item.video !== "string" ||
        !/^\/promo\/[a-z0-9-]+\/[a-zA-Z0-9-]+\.mp4$/.test(item.video) ||
        item.video.includes("hook-v3")) {
        throw Error("审核视频路径无效或是旧版本：" + item.slug);
      }
      videos[item.slug] = item;
    }
    if (GAMES.some(game => !videos[game.slug])) throw Error("审核清单缺少游戏。");
    state.manifest = parsed;
    state.videos = videos;
    state.draftVerified = true;
    el("manifest-status").textContent = "已读取线上最新版：" +
      (parsed.latestVersion || parsed.version || "latest") + " · " +
      (parsed.createdAt ? new Date(parsed.createdAt).toLocaleString("zh-CN",{timeZone:"America/Los_Angeles"}) : "") +
      " · 7 / 7";
    renderManifest();
    controls();
  }
  async function apiGet(path) {
    if (!state.token) throw Error("没有 Google 授权。");
    const res = await fetch("https://www.googleapis.com/youtube/v3/" + path, {
      headers: { Authorization: "Bearer " + state.token },
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Error("YouTube API (" + res.status + "): " +
      (data.error?.message || data.message || "请求失败"));
    return data;
  }
  async function verifyChannel() {
    const data = await apiGet("channels?part=snippet,contentDetails&mine=true");
    const current = data.items || [];
    const channel = current.find(item => item.id === EXPECTED_CHANNEL);
    if (current.length !== 1 || !channel) {
      state.channel = null;
      controls();
      throw Error("授权的 YouTube 频道不是 @morrowwishgames。发现：" +
        (current.map(x => x.snippet?.title + " [" + x.id + "]").join(", ") || "无频道") +
        "。请换正确的 Google / Brand 频道授权。");
    }
    state.channel = channel;
    setChannelStatus("频道已验证：" + channel.snippet.title + " · " + channel.id);
    await checkExisting();
    controls();
  }
  async function checkExisting() {
    if (!state.channel) return;
    const playlist = state.channel.contentDetails?.relatedPlaylists?.uploads;
    if (!playlist) throw Error("无法读取本频道的上传列表。");
    state.existing.clear();
    let page = "";
    for (let n = 0; n < 5; n++) {
      const q = new URLSearchParams({part:"snippet",playlistId:playlist,maxResults:"50"});
      if (page) q.set("pageToken",page);
      const response = await apiGet("playlistItems?" + q);
      for (const item of response.items || []) {
        const s = item.snippet || {};
        const id = s.resourceId?.videoId;
        if (id && s.title) state.existing.set(s.title,id);
      }
      page = response.nextPageToken || "";
      if (!page) break;
    }
    for (const game of GAMES) {
      const record = ledger[game.slug];
      const localId = record && record.video === state.videos?.[game.slug]?.video && record.videoId;
      if (localId) setRow(game.slug, "已登记 · " + localId);
      else if (state.existing.has(game.title)) setRow(game.slug,"频道已有同名视频 · 跳过");
      else setRow(game.slug,"未上传");
    }
  }
  function googleReady() {
    return Boolean(window.google?.accounts?.oauth2?.initTokenClient);
  }
  function connect() {
    const client = el("client-id").value.trim();
    if (!isValidClientId(client)) {
      setChannelStatus("请填入 Web application 类型的 OAuth Client ID，不是 API Key。", true);
      return;
    }
    if (!googleReady()) {
      setChannelStatus("Google 授权组件尚未加载。请刷新网页并检查拦截插件。", true);
      return;
    }
    localStorage.setItem(clientKey, client);
    try {
      const t = window.google.accounts.oauth2.initTokenClient({
        client_id: client,
        scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
        callback: async (response) => {
          if (response.error || !response.access_token) {
            setChannelStatus("Google 授权未完成：" + (response.error || "无授权令牌"), true);
            return;
          }
          state.token = response.access_token; // never persisted
          state.channel = null;
          setChannelStatus("Google 授权成功，正在核对频道…");
          try {
            await verifyChannel();
          } catch (err) {
            setChannelStatus(err.message, true);
          } finally {
            controls();
          }
        },
        error_callback: (error) => {
          setChannelStatus("Google 授权窗口未能完成：" + (error.type || "unknown"), true);
        }
      });
      t.requestAccessToken({ prompt:"consent" });
      setChannelStatus("请在 Google 官方弹窗完成授权，并选择 @morrowwishgames。");
    } catch (err) {
      setChannelStatus("Google 授权初始化失败：" + err.message, true);
    }
  }
  async function obtainVideoBlob(videoPath) {
    // Same-origin, exact path from deployed review manifest.
    if (!videoPath.startsWith("/promo/") || !videoPath.endsWith(".mp4")) {
      throw Error("不允许访问审核清单以外的源文件。");
    }
    const result = await fetch(videoPath, {cache:"no-store"});
    if (!result.ok) throw Error("最新版视频下载失败（HTTP " + result.status + "）。");
    const b = await result.blob();
    if (b.size < 100000 || b.size > 150000000) {
      throw Error("视频文件大小不合理：" + Math.round(b.size / 1048576) + "MB");
    }
    const header = new Uint8Array(await b.slice(0,24).arrayBuffer());
    if (String.fromCharCode(...header).indexOf("ftyp") < 0) {
      throw Error("视频不是有效 MP4，已停止。");
    }
    return b;
  }
  async function beginResumable(blob, game, schedule) {
    const now = Date.now();
    const status = schedule.getTime() > now + 180000
      ? { privacyStatus:"private", publishAt:schedule.toISOString(), selfDeclaredMadeForKids:false }
      : { privacyStatus:"public", selfDeclaredMadeForKids:false };
    const body = {
      snippet: {
        title:game.title,
        description:descriptionFor(game),
        categoryId:"20",
        defaultLanguage:"en",
        tags:["Morrow Wish","IndieGame","BrowserGame","Shorts"]
      },
      status
    };
    const response = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",{
      method:"POST",
      headers:{
        Authorization:"Bearer "+state.token,
        "Content-Type":"application/json; charset=UTF-8",
        "X-Upload-Content-Length":String(blob.size),
        "X-Upload-Content-Type":"video/mp4"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw Error("YouTube 上传初始化失败（HTTP " + response.status + "）：" +
        (error.error?.message || JSON.stringify(error).slice(0,450)));
    }
    const uploadUri = response.headers.get("Location");
    if (!uploadUri || !uploadUri.startsWith("https://www.googleapis.com/upload/youtube/v3/")) {
      throw Error("Google 未返回可读取的断点续传地址。没有上传视频；请检查浏览器跨域权限。");
    }
    return {uploadUri, status};
  }
  function uploadBinary(uploadUri, blob, onProgress) {
    return new Promise((resolve,reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT",uploadUri,true);
      xhr.setRequestHeader("Authorization","Bearer "+state.token);
      xhr.setRequestHeader("Content-Type","video/mp4");
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
      xhr.onerror = () => reject(Error("上传过程中网络中断，当前上传状态需核实，切勿盲目重复。"));
      xhr.onabort = () => reject(Error("视频上传已中止，可能需要核实上传状态。"));
      xhr.onload = () => {
        let data = {};
        try {data=JSON.parse(xhr.responseText || "{}");} catch (_) {}
        if (xhr.status >= 200 && xhr.status < 300 && data.id) resolve(data);
        else reject(Error("YouTube 上传未确认完成（HTTP " + xhr.status + "）：" +
          (data.error?.message || xhr.responseText.slice(0,500))));
      };
      xhr.send(blob);
    });
  }
  function resultLink(game,id,label) {
    const box = document.createElement("div");
    box.className = "result";
    const head = document.createElement("strong");
    head.textContent = game.label + "：";
    const link = document.createElement("a");
    link.href = "https://www.youtube.com/shorts/" + encodeURIComponent(id);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label || link.href;
    box.append(head,document.createTextNode(" "),link);
    el("results").append(box);
  }
  async function uploadAll() {
    if (state.uploadBusy || !state.token || !state.channel || !state.draftVerified || !el("confirm").checked) return;
    state.uploadBusy = true;
    controls();
    setStatus("重新核对频道、审核清单以及已存在的视频。");
    try {
      await loadManifest();
      await verifyChannel();
      const current = state.channel;
      if (!current || current.id !== EXPECTED_CHANNEL) throw Error("未能确认正确的 YouTube 频道。");
      let finished = 0;
      for (const [i,game] of GAMES.entries()) {
        const currentVideo = state.videos[game.slug].video;
        const remembered = ledger[game.slug];
        if (remembered && remembered.video === currentVideo && remembered.videoId) {
          setRow(game.slug,"已上传 · " + remembered.videoId);
          resultLink(game, remembered.videoId,"已记录的 Shorts");
          finished++;
          progress(finished / GAMES.length);
          continue;
        }
        if (state.existing.has(game.title)) {
          const foundId = state.existing.get(game.title);
          ledger[game.slug] = {video:currentVideo,videoId:foundId,source:"existing-channel"};
          saveLedger();
          setRow(game.slug,"已存在 · " + foundId);
          resultLink(game,foundId,"频道已有视频（未重复上传）");
          finished++;
          progress(finished/GAMES.length);
          continue;
        }
        setRow(game.slug,"正在获取最新审核视频…");
        setStatus("正在处理第 " + (i+1) + "/7 条：" + game.label);
        const blob = await obtainVideoBlob(currentVideo);
        setRow(game.slug,"创建 YouTube 官方断点续传任务…");
        const session = await beginResumable(blob,game,slotFor(i));
        setRow(game.slug,"上传视频中…");
        const response = await uploadBinary(session.uploadUri,blob,p => {
          setRow(game.slug,"上传中 " + Math.round(p * 100) + "%");
          progress((i+p)/GAMES.length);
        });
        if (!response.id) throw Error("YouTube 未返回视频 ID；停止上传。");
        const videoInfo = await apiGet("videos?part=snippet,status&id=" + encodeURIComponent(response.id));
        const actual = videoInfo.items?.[0];
        if (!actual || actual.snippet?.channelId !== EXPECTED_CHANNEL) {
          throw Error("视频已经上传但无法确认频道，已停止。YouTube ID：" + response.id);
        }
        const privacy = actual.status?.privacyStatus || session.status.privacyStatus;
        ledger[game.slug] = {
          video:currentVideo,videoId:response.id,source:"official-api",privacy,
          uploadedAt:new Date().toISOString(),scheduledFor:session.status.publishAt || null
        };
        saveLedger();
        state.existing.set(game.title,response.id);
        setRow(game.slug,(privacy==="private" ? "已上传，定时公开" : "已上传") + " · " + response.id);
        resultLink(game,response.id,"查看真实 Shorts URL (" + privacy + ")");
        finished++;
        progress(finished / GAMES.length);
      }
      setStatus("YouTube 官方上传任务已完成 7/7。请点击链接核对平台实际公开状态和处理结果。");
    } catch (err) {
      setStatus("已停止上传：" + (err.message || String(err)) +
        "。为了防止误重复，需核实当前上传状态后再继续。",true);
    } finally {
      state.uploadBusy = false;
      controls();
    }
  }

  el("origin").textContent = location.origin;
  el("copy-origin").addEventListener("click", () => {
    navigator.clipboard.writeText(location.origin).then(() => {
      el("copy-origin").textContent = "已复制";
    }).catch(() => { el("copy-origin").textContent = "复制失败"; });
  });
  el("client-id").value = localStorage.getItem(clientKey) || "";
  el("connect").addEventListener("click",connect);
  el("confirm").addEventListener("change",controls);
  el("start").addEventListener("click",uploadAll);
  el("check").addEventListener("click", async () => {
    try {
      await verifyChannel();
      setStatus("已核对频道最近上传视频。");
    } catch(err) {
      setStatus(err.message,true);
    }
  });
  renderManifest();
  loadManifest().catch(err => {
    state.draftVerified=false;
    el("manifest-status").textContent = "无法安全加载最新审核清单：" + err.message;
    controls();
  });
})();
