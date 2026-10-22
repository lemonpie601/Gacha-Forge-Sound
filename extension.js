(async () => {
  const KEY = "__gachaForgeSound";
  if (window[KEY]) window[KEY].dispose();

  const HOST_TAG = "MARINARA-CAPABILITY-GACHA-FORGE";
  const api = typeof marinara !== "undefined" && marinara ? marinara : null;
  const cleanups = [];
  const later = (fn) => cleanups.push(fn);
  const timers = new Set();
  const every = (fn, ms) => { const id = setInterval(fn, ms); timers.add(id); return id; };

  /* =========================================================
   * 소리 목록 (그룹 / 이름)
   * ========================================================= */
  const SOUND_LIST = [
    ["UI", [
      ["click", "기본 버튼"], ["confirm", "확인·결정"], ["back", "뒤로·취소"], ["tab", "탭·필터"],
      ["toggle", "켜기/끄기"], ["error", "잠김·불가"], ["popup", "팝업 열림"], ["whoosh", "화면 전환"],
      ["deal", "목록 촤르륵"], ["page", "대사 넘김"], ["tick", "대사 타자음"],
    ]],
    ["소환", [
      ["pullPress", "소환 버튼"], ["charge", "소환 차지"], ["flash", "섬광"], ["flip", "카드 뒤집기"],
      ["reveal3", "★3 공개"], ["reveal4", "★4 공개"], ["reveal5", "★5 공개"], ["rays", "★5 빛줄기"],
    ]],
    ["전투", [
      ["sortie", "출격·전투 시작"], ["skillSelect", "스킬 선택"], ["turn", "턴 시작"], ["hit", "타격"],
      ["crit", "치명타"], ["hitFire", "타격·불"], ["hitWater", "타격·물"], ["hitWind", "타격·바람"],
      ["hitEarth", "타격·대지"], ["hitLight", "타격·빛"], ["hitDark", "타격·어둠"], ["heal", "회복"],
      ["shield", "방어막"], ["shieldBreak", "방어 깨짐"], ["charged", "기 모으기"], ["ko", "쓰러짐"],
      ["enrage", "보스 분노"], ["victory", "승리"], ["defeat", "패배"],
    ]],
    ["보상·성장", [
      ["coin", "구매·재화"], ["reward", "보상 획득"], ["drop", "아이템 드롭"], ["levelUp", "레벨 업·강화"],
      ["equip", "장착"], ["potion", "물약·회복 사용"], ["unlock", "해금"], ["delete", "삭제"],
    ]],
    ["획득", [
      ["aether", "에테르 획득"], ["glimmer", "글리머 획득"], ["funds", "자금 획득"], ["vigorGain", "활력 회복"],
      ["spend", "재화 사용"], ["relic", "유물 획득"], ["rune", "시길·룬 획득"], ["insight", "통찰 획득"],
    ]],
    ["스토리 연출", [
      ["notice", "시스템 알림 [ ]"], ["affection", "호감도 알림"], ["letter", "편지·연락 도착"], ["glitch", "버그·글리치"],
    ]],
  ];

  /* =========================================================
   * 장르 테마 · 스토리 분위기 · 상황별 배경음
   * ========================================================= */
  const THEMES = [
    ["auto", "자동"], ["otome", "오토메·로판"], ["hunter", "헌터·액션"], ["daily", "일상·힐링"], ["fantasy", "정통 판타지"], ["oriental", "동양풍"], ["idol", "아이돌·연예계"], ["dark", "다크·호러"],
  ];
  const MOODS = [
    ["calm", "평온"], ["happy", "밝음"], ["comedy", "코믹"], ["romance", "설렘"], ["sad", "슬픔"],
    ["tense", "긴장"], ["mystery", "신비"], ["dark", "집착·광기"], ["glitch", "버그·글리치"],
  ];
  const SITUATIONS = [["lobby", "로비·메뉴"], ["summon", "소환"], ["battle", "전투"], ...MOODS.map(([k, l]) => ["story_" + k, "스토리 · " + l])];
  const SIT_LABEL = Object.fromEntries(SITUATIONS);
  const THEME_LABEL = Object.fromEntries(THEMES);

  /* =========================================================
   * 설정 (마리나라 확장 저장소에 저장 → 기기 간 동기화, 실패 시 localStorage)
   * ========================================================= */
  const DEFAULTS = {
    master: 0.8, sfxOn: true, sfxVol: 0.8, bgmOn: true, bgmVol: 0.4,
    storyMoodMode: "auto",
    theme: "auto",
    sounds: {},
    bgm: {},
    // 효과음
    groups: {},          // 그룹 이름 -> false면 그 그룹 전체 끔
    reverb: 0.32,        // 울림 양
    typingGap: 45,       // 타자음 최소 간격(ms)
    elemHits: true,      // 속성별 타격음 사용
    rewardChain: 6,      // 보상 아이템 연속 재생 최대 개수
    boom: 0.4,           // 효과음의 저음 '둥' 세기
    kick: 0.6,           // 배경음 킥·팀파니 세기
    duck: true,          // 큰 효과음 때 배경음 잠깐 줄이기
    duckAmount: 0.5,
    // 배경음
    bgmOutside: false,   // 가챠포지 밖에서도 로비 음악
    tempo: 1,
    engine: "v2", ensemble: 1, melody: "auto", padInst: "auto", drums: "auto", leadInst: "auto",
    density: 1,
    fade: 0.6,
    // 분위기 감지
    sensitivity: 1,
    minHold: 12,
    moodEnabled: {},
    keywords: {},
    genreKeywords: {},
    // 버튼·화면
    openMode: "icon",         // 여는 방법: icon(가챠포지 안 아이콘) | floating(떠 있는 버튼) | both
    launcherPos: "br", launcherSize: 34, launcherOpacity: 0.8,
    iconTopbar: "beforeFs",   // 상단바 아이콘 위치: beforeFs | beforeSettings | end
    iconBattle: true,         // 전투 조작줄에도 아이콘
    iconStory: true,          // 스토리 화면(Auto·Skip·Log 줄)에도 아이콘
    iconStyle: "speaker",     // speaker | note | gear | wave
    launcherOffsetX: 0, launcherOffsetY: 0,
    hotkey: "alt+s",          // alt+s | alt+m | ctrl+shift+s | off
    // 고급
    lowPower: false,
    sleepSec: 8,
  };
  const LS = "gf-sound:v2";
  const MAPS = ["sounds", "bgm", "groups", "moodEnabled", "keywords", "genreKeywords"];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  // 예전 버전에서 저장된 설정만 한 번 옮김(새로 설치·초기화한 설정에는 손대지 않음)
  function migrate(stored) {
    const c = { ...stored };
    if (c.schema >= 2) return c;
    if (!c.migratedV51) {
      const legacyHidden = !c.migratedV5 || !c.launcherPos || c.launcherPos === "hidden";
      const iconsOff = c.inGameIcon === false || (c.iconTopbar === "none" && c.iconBattle === false);
      c.openMode = iconsOff ? "floating" : legacyHidden ? "icon" : "both";
    }
    if (c.inGameIcon === false) { c.iconTopbar = "beforeFs"; c.iconBattle = false; }
    delete c.inGameIcon; delete c.migratedV5; delete c.migratedV51;
    if (c.iconTopbar === "none") c.iconTopbar = "beforeFs";
    if (!c.launcherPos || c.launcherPos === "hidden") c.launcherPos = "br";
    if (c.hotkey === true) c.hotkey = "alt+s"; else if (c.hotkey === false) c.hotkey = "off";
    c.schema = 2;
    return c;
  }
  function normalize(stored) {
    const c = { ...clone(DEFAULTS), ...(stored ? migrate(stored) : {}), schema: 2 };
    for (const k of MAPS) c[k] = { ...(c[k] || {}) };
    return c;
  }

  // 1) 이 기기 사본(localStorage)과 2) 서버 사본을 따로 읽음.
  //    서버를 못 읽어도 기본값으로 돌아가지 않고 이 기기 사본을 씀.
  let localStored = null, remoteStored = null, remoteOk = false;
  try { localStored = JSON.parse(localStorage.getItem(LS) || "null"); } catch {}
  // 서버 응답을 기다리지 않고 이 기기 사본으로 바로 시작(아이콘이 늦게 뜨지 않게). 서버 값은 뒤에서 받아 합침
  let cfg = normalize(localStored);
  // 서버와 마지막으로 맞춘 상태. 저장할 땐 이것과 비교해서 '내가 바꾼 칸'만 서버에 반영함
  let synced = clone(cfg);

  // 내가 바꾼 칸 찾기 (맵은 한 칸씩)
  function changedPaths(cur, base) {
    const out = [];
    for (const k of new Set([...Object.keys(cur), ...Object.keys(base)])) {
      if (MAPS.includes(k)) {
        const a = cur[k] || {}, b = base[k] || {};
        for (const sk of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[sk]) !== JSON.stringify(b[sk])) out.push([k, sk]);
      } else if (JSON.stringify(cur[k]) !== JSON.stringify(base[k])) out.push([k]);
    }
    return out;
  }
  function applyPaths(target, src, paths) {
    for (const [k, sk] of paths) {
      if (sk === undefined) { if (src[k] === undefined) delete target[k]; else target[k] = clone(src[k]); }
      else { target[k] = { ...(target[k] || {}) }; if (src[k] && src[k][sk] !== undefined) target[k][sk] = clone(src[k][sk]); else delete target[k][sk]; }
    }
    return target;
  }

  let saveTimer = 0, saving = null, fullOverwrite = false, onRemoteApplied = null;
  // 저장: 서버의 최신 설정을 먼저 받아서, 이 기기에서 바꾼 칸만 덮어씀
  // → 다른 기기·다른 탭이 오래된 설정을 통째로 덮어써 '초기화'처럼 보이던 문제 방지
  async function flush() {
    clearTimeout(saveTimer); saveTimer = 0;
    try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch {}
    if (!api || !api.storage) return;
    if (saving) { await saving; }
    const paths = fullOverwrite ? null : changedPaths(cfg, synced);
    if (paths && !paths.length) return;
    saving = (async () => {
      try {
        let latest = null;
        if (!fullOverwrite) { const r = await api.storage.get(); latest = r && r.cfg ? normalize(r.cfg) : null; }
        const merged = fullOverwrite || !latest ? clone(cfg) : applyPaths(latest, cfg, paths);
        await api.storage.patch({ cfg: merged });
        remoteOk = true; fullOverwrite = false;
        const changedElsewhere = latest && changedPaths(merged, cfg).length;
        cfg = merged; synced = clone(merged);
        try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch {}
        if (changedElsewhere && onRemoteApplied) onRemoteApplied();
      } catch { remoteOk = false; }
      finally { saving = null; updateSyncLabel(); }
    })();
    return saving;
  }
  const save = () => {
    clearTimeout(saveTimer);
    try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch {}
    saveTimer = setTimeout(flush, 400);
  };
  // 다른 기기에서 바꾼 설정 불러오기 (내가 아직 저장 안 한 칸은 지킴)
  async function pullRemote() {
    if (!api || !api.storage || saving || saveTimer) return;
    try {
      const r = await api.storage.get(); remoteOk = true;
      if (!r || !r.cfg) { if (changedPaths(cfg, synced).length || !remoteStored) { fullOverwrite = !r || !r.cfg; flush(); } return; }
      const remote = normalize(r.cfg);
      const mine = changedPaths(cfg, synced);
      const next = applyPaths(clone(remote), cfg, mine);
      const differs = changedPaths(next, cfg).length;
      synced = remote; cfg = next;
      if (mine.length) save();
      if (differs && onRemoteApplied) onRemoteApplied();
    } catch { remoteOk = false; }
    updateSyncLabel();
  }
  let updateSyncLabel = () => {};
  // 서버를 못 읽고 시작했다면 연결되는 대로 바꾼 칸만 올림
  let pullRetry = 0;
  const sCfg = (name) => ({ on: true, vol: 1, pitch: 1, ...(cfg.sounds[name] || {}) });
  const bgmMode = (sit) => cfg.bgm[sit] || "synth";

  /* =========================================================
   * 오디오 그래프
   *   sfxBus / bgmBus → 압축기 → masterOut(전체 볼륨) → 스피커
   *   볼륨을 압축기 뒤에 둬야 슬라이더를 내렸을 때 압축기가 다시 키우지 않음
   * ========================================================= */
  let ctx = null, comp, masterOut, sfxBus, bgmBus, reverbIn, noiseBuf, wet;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = 0.002; comp.release.value = 0.15;
    masterOut = ctx.createGain();
    // 맨 끝 안전 리미터: 어떤 상황에서도 갑자기 튀는 큰 소리를 눌러줌
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.1;
    comp.connect(masterOut).connect(limiter).connect(ctx.destination);
    sfxBus = ctx.createGain();
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0; bgmBus.connect(comp);

    const len = Math.floor(ctx.sampleRate * 2.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    wet = ctx.createGain(); wet.gain.value = cfg.reverb;
    reverbIn = ctx.createGain(); reverbIn.connect(conv).connect(wet).connect(comp);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    buildFxChains(); fxTheme = null; setSfxFx(activeTheme()); // 효과음 처리 회로는 처음에 한 번만 연결
    applyVolumes();
    return ctx;
  }
  function applyVolumes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    masterOut.gain.setTargetAtTime(cfg.master * cfg.master, t, 0.03); // 귀에 맞게 제곱 곡선
    sfxBus.gain.setTargetAtTime(cfg.sfxOn ? cfg.sfxVol * cfg.sfxVol : 0, t, 0.03);
    if (wet) wet.gain.setTargetAtTime(cfg.lowPower ? 0 : cfg.reverb, t, 0.05);
  }
  // 큰 효과음이 날 때 배경음을 잠깐 낮춤
  let duckUntil = 0;
  function duckBgm(sec = 1.4) {
    if (!cfg.duck || !ctx || !bgmActive) return;
    const t = ctx.currentTime, target = cfg.bgmVol * cfg.bgmVol;
    bgmBus.gain.cancelScheduledValues(t);
    bgmBus.gain.setTargetAtTime(target * (1 - cfg.duckAmount), t, 0.05);
    bgmBus.gain.setTargetAtTime(target, t + sec, 0.4);
    duckUntil = performance.now() + sec * 1000;
  }

  // 아무 소리도 안 날 땐 오디오 엔진을 재워서 배터리·CPU 아낌
  let lastSound = 0, unlocked = false, bgmActive = false;
  const touch = () => { lastSound = performance.now(); if (ctx && ctx.state === "suspended" && unlocked) ctx.resume().catch(() => {}); };
  every(() => {
    if (ctx && ctx.state === "running" && !bgmActive && performance.now() - lastSound > cfg.sleepSec * 1000) ctx.suspend().catch(() => {});
  }, 4000);

  const unlock = () => {
    const c = ensureCtx(); if (!c) return;
    if (c.state !== "running") c.resume().then(() => { unlocked = true; syncBgm(); }).catch(() => {});
    else unlocked = true;
    lastSound = performance.now();
    // iOS는 음악 파일 재생을 터치 순간에만 허락해서 여기서 바로 맞춤
    try { if (fileTrack.el && fileTrack.el.paused) fileTrack.el.play().catch(() => {}); } catch {}
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
  later(() => { document.removeEventListener("pointerdown", unlock, true); document.removeEventListener("keydown", unlock, true); });

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- 합성 도구 (P = 음높이 배율, V = 볼륨 배율) ---------- */
  let P = 1, V = 1, K = null, OUT = null; // K: 지금 소리에 적용할 테마 키트, OUT: 임시 출력(왜곡 등)
  function env(g, t0, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }
  function route(g, pan, rev) {
    let out = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    out.connect(OUT || sfxBus);
    if (rev) { const s = ctx.createGain(); s.gain.value = rev * (K ? K.rev : 1); out.connect(s).connect(reverbIn); }
  }
  function osc({ f, to, type = "sine", at = 0, dur = 0.2, vol = 0.3, a = 0.004, rev = 0, lp, hp, q = 0.7, detune = 0, pan = 0, curve = "exp" }) {
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator(); o.type = K && f * P > 220 && K.wave[type] ? K.wave[type] : type; o.detune.value = detune;
    o.frequency.setValueAtTime(f * P, t0);
    if (to) curve === "lin" ? o.frequency.linearRampToValueAtTime(to * P, t0 + dur) : o.frequency.exponentialRampToValueAtTime(Math.max(20, to * P), t0 + dur);
    const g = ctx.createGain(); env(g, t0, a, vol * V, dur);
    let n = o;
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp * P; fl.Q.value = q; n.connect(fl); n = fl; }
    if (hp) { const fh = ctx.createBiquadFilter(); fh.type = "highpass"; fh.frequency.value = hp; n.connect(fh); n = fh; }
    n.connect(g); route(g, pan, rev);
    o.start(t0); o.stop(t0 + a + dur + 0.05);
  }
  function nz({ at = 0, dur = 0.2, vol = 0.3, type = "bandpass", f = 1000, to, q = 1, a = 0.003, rev = 0, pan = 0 }) {
    const t0 = ctx.currentTime + at;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f * P, t0);
    if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(30, to * P), t0 + dur);
    const g = ctx.createGain(); env(g, t0, a, vol * V, dur);
    s.connect(fl).connect(g); route(g, pan, rev);
    s.start(t0, Math.random()); s.stop(t0 + a + dur + 0.05);
  }
  // FM 벨: 실제 종·크리스털에 가까운 금속성 울림
  function fmBell(midi, at = 0, vol = 0.16, dur = 1.4, rev = 0.5, ratio = 3.5, index = 2.2, pan = 0) {
    if (K) { if (K.bellRatio) ratio = K.bellRatio; index *= K.bellIndex; dur *= K.bellDec; }
    const t0 = ctx.currentTime + at, fc = mtof(midi) * P;
    const car = ctx.createOscillator(); car.frequency.value = fc;
    const mod = ctx.createOscillator(); mod.frequency.value = fc * ratio;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(fc * index, t0); mg.gain.exponentialRampToValueAtTime(fc * 0.05, t0 + dur);
    mod.connect(mg).connect(car.frequency);
    const g = ctx.createGain(); env(g, t0, 0.003, vol * V, dur);
    car.connect(g); route(g, pan, rev);
    car.start(t0); mod.start(t0); car.stop(t0 + dur + 0.1); mod.stop(t0 + dur + 0.1);
  }
  const sparkle = (at = 0, n = 8, base = 88, vol = 0.05) => {
    for (let i = 0; i < n; i++) fmBell(base + [0, 3, 5, 7, 10, 12][i % 6] + (i > 5 ? 12 : 0), at + i * 0.04 + Math.random() * 0.02, vol, 0.35, 0.7, 2, 1, (Math.random() - 0.5) * 1.4);
  };
  const chord = (notes, at, vol, dur, type = "triangle", rev = 0.4, lp = 3000) => notes.forEach((m, i) => osc({ f: mtof(m), type, at, dur, vol, a: 0.01, rev, lp, detune: i % 2 ? 6 : -6 }));
  // 저음 '둥': 설정의 '둥 소리 세기'로 한꺼번에 조절. 너무 낮은 초저음은 스피커만 울려서 바닥을 50Hz로 제한
  const thump = (at = 0, vol = 0.45, from = 140, to = 45, dur = 0.22) => { const b = cfg.boom; if (b <= 0.01) return; osc({ f: from, to: Math.max(50, to), type: "sine", at, dur, vol: vol * b, a: 0.004 }); };

  /* ---------- 효과음 ---------- */
  const SYNTH = {
    // UI
    click: () => { osc({ f: 2200, to: 1300, dur: 0.035, vol: 0.12 }); nz({ dur: 0.02, vol: 0.05, type: "highpass", f: 5000 }); },
    confirm: () => { fmBell(84, 0, 0.1, 0.35, 0.25, 2, 0.8); fmBell(91, 0.06, 0.09, 0.5, 0.3, 2, 0.8); },
    back: () => { osc({ f: 900, to: 520, type: "triangle", dur: 0.09, vol: 0.12 }); nz({ dur: 0.06, vol: 0.03, f: 1200, to: 400 }); },
    tab: () => { osc({ f: 1500, dur: 0.04, vol: 0.09 }); osc({ f: 2250, at: 0.025, dur: 0.05, vol: 0.06 }); },
    toggle: () => { nz({ dur: 0.025, vol: 0.12, type: "bandpass", f: 3000, q: 3 }); osc({ f: 1100, dur: 0.05, vol: 0.06, type: "square", lp: 2500 }); },
    error: () => { osc({ f: 180, type: "square", dur: 0.09, vol: 0.06, lp: 900 }); osc({ f: 150, type: "square", at: 0.1, dur: 0.14, vol: 0.06, lp: 900 }); },
    popup: () => { osc({ f: 500, to: 1100, dur: 0.12, vol: 0.1 }); nz({ dur: 0.12, vol: 0.03, f: 2000, to: 6000, q: 2 }); },
    whoosh: () => nz({ dur: 0.28, vol: 0.09, f: 300, to: 3200, q: 1.2, a: 0.08 }),
    deal: () => { for (let i = 0; i < 5; i++) nz({ at: i * 0.035, dur: 0.05, vol: 0.05, f: 2500 + i * 300, q: 4, pan: -0.4 + i * 0.2 }); },
    page: () => { nz({ dur: 0.18, vol: 0.06, f: 1500, to: 4000, q: 0.8, a: 0.03 }); nz({ at: 0.06, dur: 0.06, vol: 0.03, type: "highpass", f: 6000 }); },
    tick: () => osc({ f: 1700 + Math.random() * 600, type: "square", dur: 0.015, vol: 0.022, lp: 4500 }),
    // 소환
    pullPress: () => { fmBell(88, 0, 0.12, 0.3, 0.3, 1.5, 1.2); fmBell(95, 0.07, 0.1, 0.6, 0.4, 1.5, 1.2); thump(0, 0.25, 90, 50, 0.2); },
    charge: () => {
      osc({ f: 80, to: 420, type: "sawtooth", dur: 1.15, vol: 0.07, a: 0.35, lp: 1100, q: 6, rev: 0.4, curve: "lin" });
      osc({ f: 160, to: 840, dur: 1.15, vol: 0.06, a: 0.4, rev: 0.4, curve: "lin" });
      nz({ dur: 1.15, vol: 0.05, f: 300, to: 7000, q: 3, a: 0.6, rev: 0.5 });
      for (let i = 0; i < 6; i++) fmBell(76 + i * 2, 0.15 + i * 0.15, 0.03 + i * 0.008, 0.25, 0.5, 2, 1);
    },
    flash: () => { nz({ dur: 0.7, vol: 0.22, type: "highpass", f: 1200, a: 0.002, rev: 0.7 }); nz({ dur: 0.25, vol: 0.25, type: "lowpass", f: 900, a: 0.002 }); thump(0, 0.6, 110, 32, 0.8); },
    flip: () => { nz({ dur: 0.08, vol: 0.1, f: 2200, to: 900, q: 1.5 }); osc({ f: 700, to: 1000, dur: 0.06, vol: 0.05 }); },
    reveal3: () => { fmBell(79, 0, 0.12, 0.8, 0.4, 3, 1.5); fmBell(83, 0.05, 0.1, 0.8, 0.4, 3, 1.5); },
    reveal4: () => { [76, 80, 83, 88].forEach((m, i) => fmBell(m, i * 0.06, 0.13, 1.2, 0.55, 3.5, 2, -0.3 + i * 0.2)); sparkle(0.22, 7, 90, 0.04); thump(0, 0.25, 100, 50, 0.4); },
    reveal5: () => {
      thump(0, 0.7, 90, 28, 1.4);
      nz({ dur: 1.6, vol: 0.06, type: "highpass", f: 5000, a: 0.25, rev: 0.9 });
      chord([60, 64, 67, 72], 0, 0.05, 2.4, "sawtooth", 0.6, 2200);
      [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => fmBell(m, i * 0.055, 0.15, 2, 0.75, 3.5, 2.4, -0.6 + i * 0.2));
      sparkle(0.35, 16, 93, 0.045);
    },
    rays: () => { sparkle(0, 10, 95, 0.04); osc({ f: 2000, to: 4000, dur: 0.9, vol: 0.02, a: 0.3, rev: 0.8 }); },
    // 전투
    sortie: () => {
      [[55, 0], [62, 0.12], [67, 0.24]].forEach(([m, t]) => { osc({ f: mtof(m), type: "sawtooth", at: t, dur: 0.22, vol: 0.06, lp: 2400, rev: 0.3 }); osc({ f: mtof(m - 12), type: "square", at: t, dur: 0.22, vol: 0.04, lp: 800 }); });
      chord([67, 71, 74], 0.36, 0.06, 0.8, "sawtooth", 0.5, 2600); thump(0.36, 0.5, 120, 40, 0.4); nz({ at: 0.36, dur: 0.5, vol: 0.06, type: "highpass", f: 5000, rev: 0.5 });
    },
    skillSelect: () => { osc({ f: 600, to: 1500, dur: 0.12, vol: 0.08, type: "triangle" }); nz({ dur: 0.1, vol: 0.04, f: 3000, q: 4 }); },
    turn: () => fmBell(81, 0, 0.07, 0.4, 0.3, 2, 0.6),
    hit: () => { nz({ dur: 0.1, vol: 0.3, type: "lowpass", f: 2500, a: 0.001 }); nz({ dur: 0.04, vol: 0.15, type: "highpass", f: 4000, a: 0.001 }); thump(0, 0.45, 180, 55, 0.18); },
    crit: () => {
      nz({ dur: 0.05, vol: 0.3, type: "highpass", f: 3500, a: 0.001 });
      nz({ at: 0.015, dur: 0.22, vol: 0.32, type: "lowpass", f: 3000, to: 500, a: 0.001 });
      osc({ f: 260, to: 45, type: "sawtooth", dur: 0.3, vol: 0.18, lp: 1500 });
      thump(0, 0.6, 200, 40, 0.3); fmBell(96, 0.02, 0.05, 0.3, 0.4, 5, 3);
    },
    hitFire: () => { SYNTH.hit(); for (let i = 0; i < 7; i++) nz({ at: 0.02 + Math.random() * 0.25, dur: 0.04, vol: 0.08, f: 1500 + Math.random() * 3000, q: 5 }); nz({ dur: 0.45, vol: 0.12, f: 400, to: 1800, a: 0.02 }); },
    hitWater: () => { SYNTH.hit(); for (let i = 0; i < 5; i++) osc({ f: 500 + Math.random() * 700, to: 1400 + Math.random() * 900, at: 0.02 + i * 0.04, dur: 0.06, vol: 0.05 }); nz({ dur: 0.35, vol: 0.1, type: "lowpass", f: 1800, to: 500, a: 0.01 }); },
    hitWind: () => { SYNTH.hit(); nz({ dur: 0.35, vol: 0.14, f: 600, to: 5000, q: 2, a: 0.03 }); nz({ at: 0.08, dur: 0.25, vol: 0.08, f: 4000, to: 900, q: 3 }); },
    hitEarth: () => { thump(0, 0.7, 120, 30, 0.4); nz({ dur: 0.5, vol: 0.2, type: "lowpass", f: 600, to: 150, a: 0.005 }); for (let i = 0; i < 4; i++) nz({ at: 0.05 + i * 0.05, dur: 0.05, vol: 0.06, f: 900 + Math.random() * 600, q: 4 }); },
    hitLight: () => { SYNTH.hit(); sparkle(0.02, 6, 96, 0.035); osc({ f: 1800, to: 3000, dur: 0.25, vol: 0.03, rev: 0.6 }); },
    hitDark: () => { SYNTH.hit(); osc({ f: 90, to: 50, type: "sawtooth", dur: 0.6, vol: 0.1, lp: 500, q: 8, rev: 0.4 }); nz({ dur: 0.5, vol: 0.06, f: 300, to: 120, q: 6, rev: 0.4 }); },
    heal: () => { [72, 76, 79, 84].forEach((m, i) => fmBell(m, i * 0.08, 0.07, 0.9, 0.6, 2, 0.7)); nz({ dur: 0.6, vol: 0.03, type: "highpass", f: 6000, a: 0.2, rev: 0.6 }); },
    shield: () => { osc({ f: 300, to: 900, type: "triangle", dur: 0.25, vol: 0.09, rev: 0.4 }); fmBell(86, 0.12, 0.07, 0.6, 0.5, 1.41, 3); },
    shieldBreak: () => { for (let i = 0; i < 9; i++) fmBell(88 + Math.floor(Math.random() * 14), i * 0.025, 0.05, 0.25, 0.4, 2.76, 4, Math.random() - 0.5); nz({ dur: 0.3, vol: 0.18, type: "highpass", f: 3000, a: 0.001 }); thump(0, 0.3, 160, 60, 0.2); },
    charged: () => { osc({ f: 200, to: 600, type: "sawtooth", dur: 0.6, vol: 0.05, lp: 1400, q: 8, a: 0.2, rev: 0.4, curve: "lin" }); nz({ dur: 0.6, vol: 0.04, f: 800, to: 3000, q: 6, a: 0.25 }); },
    ko: () => { osc({ f: 400, to: 60, type: "triangle", dur: 0.6, vol: 0.12, rev: 0.4 }); thump(0.25, 0.4, 90, 35, 0.4); nz({ at: 0.25, dur: 0.3, vol: 0.08, type: "lowpass", f: 800 }); },
    enrage: () => { osc({ f: 70, to: 55, type: "sawtooth", dur: 1.1, vol: 0.14, lp: 700, q: 4, a: 0.08, rev: 0.4 }); osc({ f: 73, to: 57, type: "sawtooth", dur: 1.1, vol: 0.1, lp: 700, a: 0.08 }); nz({ dur: 1.0, vol: 0.12, f: 400, to: 200, q: 2, a: 0.1, rev: 0.4 }); thump(0, 0.5, 80, 30, 0.8); },
    victory: () => {
      [[67, 0, 0.13], [72, 0.13, 0.13], [76, 0.26, 0.13], [79, 0.39, 0.2], [76, 0.6, 0.1], [79, 0.7, 0.1], [84, 0.82, 0.9]].forEach(([m, t, d]) => {
        osc({ f: mtof(m), type: "sawtooth", at: t, dur: d + 0.1, vol: 0.06, lp: 2800, rev: 0.4 });
        osc({ f: mtof(m), type: "square", at: t, dur: d + 0.1, vol: 0.03, lp: 1800, detune: 7 });
      });
      chord([48, 55, 60, 64], 0.82, 0.05, 1.4, "sawtooth", 0.6, 1800);
      thump(0.82, 0.5, 110, 40, 0.5); sparkle(0.9, 12, 91, 0.04);
    },
    defeat: () => {
      [[69, 0], [68, 0.35], [67, 0.7], [62, 1.05]].forEach(([m, t]) => osc({ f: mtof(m), type: "triangle", at: t, dur: 0.6, vol: 0.12, rev: 0.6, lp: 1500 }));
      chord([38, 45, 50], 1.05, 0.06, 2, "sawtooth", 0.6, 600);
    },
    // 보상·성장
    coin: () => { fmBell(95, 0, 0.09, 0.15, 0.2, 1, 0.5); fmBell(100, 0.06, 0.09, 0.45, 0.35, 1, 0.5); },
    reward: () => { [79, 83, 86, 91].forEach((m, i) => fmBell(m, i * 0.07, 0.1, 0.9, 0.5, 3.5, 1.8)); sparkle(0.25, 8, 93, 0.035); },
    drop: () => { osc({ f: 1200, to: 300, dur: 0.12, vol: 0.06 }); fmBell(91, 0.1, 0.08, 0.5, 0.4, 3, 1.5); },
    levelUp: () => { [67, 71, 74, 79, 83, 86, 91].forEach((m, i) => osc({ f: mtof(m), type: "square", at: i * 0.05, dur: 0.14, vol: 0.045, lp: 3000, rev: 0.4 })); fmBell(91, 0.38, 0.13, 1.4, 0.6, 3.5, 2); sparkle(0.4, 10, 93, 0.04); },
    equip: () => { nz({ dur: 0.06, vol: 0.18, f: 2600, q: 6 }); fmBell(74, 0.01, 0.08, 0.4, 0.2, 2.76, 5); nz({ at: 0.08, dur: 0.04, vol: 0.08, f: 3500, q: 6 }); },
    potion: () => { for (let i = 0; i < 6; i++) osc({ f: 400 + Math.random() * 500, to: 900 + Math.random() * 800, at: i * 0.06, dur: 0.07, vol: 0.05 }); SYNTH.heal(); },
    unlock: () => { nz({ dur: 0.05, vol: 0.15, f: 2000, q: 5 }); osc({ f: 300, to: 200, type: "square", at: 0.05, dur: 0.06, vol: 0.06, lp: 1500 }); [79, 84, 88].forEach((m, i) => fmBell(m, 0.15 + i * 0.07, 0.1, 0.9, 0.5)); },
    delete: () => { nz({ dur: 0.2, vol: 0.1, type: "lowpass", f: 1500, to: 300 }); osc({ f: 300, to: 120, type: "triangle", dur: 0.2, vol: 0.08 }); },
    // 획득
    aether: () => { [86, 91, 93, 98].forEach((m, i) => fmBell(m, i * 0.05, 0.08, 0.9, 0.7, 7.01, 1.4, -0.3 + i * 0.2)); osc({ f: 1400, to: 2800, dur: 0.5, vol: 0.025, a: 0.1, rev: 0.7 }); nz({ dur: 0.5, vol: 0.025, type: "highpass", f: 7000, a: 0.1, rev: 0.6 }); },
    glimmer: () => { sparkle(0, 6, 96, 0.05); fmBell(91, 0.05, 0.07, 0.6, 0.6, 2, 0.8); },
    funds: () => { for (let i = 0; i < 4; i++) { fmBell(93 + (i % 2) * 5, i * 0.055, 0.07, 0.2, 0.25, 1, 0.5, (Math.random() - 0.5) * 0.8); nz({ at: i * 0.055, dur: 0.03, vol: 0.05, f: 6000, q: 6 }); } },
    vigorGain: () => { osc({ f: 400, to: 900, dur: 0.35, vol: 0.06, a: 0.08, rev: 0.4 }); [76, 81].forEach((m, i) => fmBell(m, 0.15 + i * 0.08, 0.07, 0.6, 0.5, 2, 0.6)); },
    spend: () => { osc({ f: 1200, to: 700, dur: 0.08, vol: 0.06, type: "triangle" }); nz({ dur: 0.05, vol: 0.04, f: 4000, q: 4 }); },
    relic: () => { fmBell(62, 0, 0.12, 1.4, 0.6, 2.76, 4); fmBell(74, 0.08, 0.08, 1.1, 0.6, 2.76, 3); nz({ dur: 0.08, vol: 0.12, f: 2500, q: 6 }); },
    rune: () => { [81, 88, 84, 91].forEach((m, i) => fmBell(m, i * 0.07, 0.07, 0.8, 0.7, 5.4, 1.6, -0.3 + i * 0.2)); osc({ f: 220, to: 330, type: "triangle", dur: 0.6, vol: 0.04, a: 0.1, rev: 0.6 }); },
    insight: () => { nz({ dur: 0.2, vol: 0.05, f: 1500, to: 4000, q: 0.8, a: 0.03 }); [79, 83, 86].forEach((m, i) => fmBell(m, 0.08 + i * 0.07, 0.07, 0.7, 0.5, 2, 0.8)); },
    // 스토리 연출
    notice: () => { fmBell(96, 0, 0.09, 0.25, 0.3, 2, 0.6); fmBell(91, 0.09, 0.09, 0.5, 0.4, 2, 0.6); },
    affection: () => { [84, 88, 91, 96].forEach((m, i) => fmBell(m, i * 0.06, 0.08, 0.7, 0.6, 7.01, 1.2)); osc({ f: 660, to: 990, dur: 0.3, vol: 0.03, a: 0.05, rev: 0.6 }); sparkle(0.2, 5, 98, 0.03); },
    letter: () => { nz({ dur: 0.35, vol: 0.06, f: 600, to: 2500, q: 1, a: 0.1 }); nz({ at: 0.3, dur: 0.05, vol: 0.08, type: "lowpass", f: 900 }); fmBell(88, 0.35, 0.08, 0.6, 0.5, 2, 0.8); fmBell(93, 0.43, 0.07, 0.7, 0.5, 2, 0.8); },
    glitch: () => {
      for (let i = 0; i < 7; i++) {
        const at = i * 0.035 + Math.random() * 0.02;
        if (Math.random() < 0.5) osc({ f: 200 + Math.random() * 3000, type: "square", at, dur: 0.025, vol: 0.05, lp: 6000 });
        else nz({ at, dur: 0.03, vol: 0.08, type: "bandpass", f: 500 + Math.random() * 6000, q: 8 });
      }
      osc({ f: 60, to: 40, type: "sawtooth", dur: 0.3, vol: 0.06, lp: 400 });
    },
  };

  // 테마별 UI 소리 색깔 (같은 버튼이라도 장르마다 다르게)
  const FLAVOR = {
    otome: {
      click: () => fmBell(98, 0, 0.06, 0.18, 0.3, 7.01, 0.9),
      confirm: () => { [91, 96, 100].forEach((m, i) => fmBell(m, i * 0.05, 0.07, 0.5, 0.5, 7.01, 1)); },
      back: () => { fmBell(93, 0, 0.06, 0.25, 0.3, 7.01, 0.9); fmBell(86, 0.06, 0.06, 0.35, 0.3, 7.01, 0.9); },
      tab: () => fmBell(103, 0, 0.05, 0.15, 0.25, 7.01, 0.8),
      popup: () => { fmBell(96, 0, 0.07, 0.4, 0.5, 7.01, 1); sparkle(0.05, 4, 98, 0.03); },
      notice: () => { [96, 100, 103].forEach((m, i) => fmBell(m, i * 0.06, 0.07, 0.5, 0.6, 7.01, 1)); sparkle(0.12, 4, 100, 0.025); },
    },
    hunter: {
      click: () => { osc({ f: 1800, type: "square", dur: 0.025, vol: 0.05, lp: 5000 }); osc({ f: 2400, type: "square", at: 0.03, dur: 0.02, vol: 0.035, lp: 5000 }); },
      confirm: () => { osc({ f: 880, type: "square", dur: 0.06, vol: 0.05, lp: 4000 }); osc({ f: 1320, type: "square", at: 0.07, dur: 0.12, vol: 0.05, lp: 4000, rev: 0.2 }); },
      back: () => { osc({ f: 1100, to: 500, type: "square", dur: 0.08, vol: 0.05, lp: 3000 }); },
      tab: () => osc({ f: 2000, type: "square", dur: 0.02, vol: 0.04, lp: 5000 }),
      popup: () => { osc({ f: 300, to: 1600, type: "sawtooth", dur: 0.15, vol: 0.04, lp: 3000 }); nz({ dur: 0.15, vol: 0.04, f: 2000, to: 8000, q: 3 }); },
      notice: () => { osc({ f: 1046, type: "square", dur: 0.07, vol: 0.05, lp: 4000 }); osc({ f: 1568, type: "square", at: 0.08, dur: 0.07, vol: 0.05, lp: 4000 }); osc({ f: 2093, type: "square", at: 0.16, dur: 0.15, vol: 0.05, lp: 4000, rev: 0.3 }); },
      hit: () => { nz({ dur: 0.08, vol: 0.32, type: "lowpass", f: 3500, a: 0.001 }); nz({ dur: 0.03, vol: 0.2, type: "highpass", f: 5000, a: 0.001 }); thump(0, 0.55, 220, 45, 0.16); osc({ f: 120, to: 60, type: "sawtooth", dur: 0.12, vol: 0.08, lp: 900 }); },
    },
    daily: {
      click: () => osc({ f: 900, to: 1100, type: "sine", dur: 0.05, vol: 0.09 }),
      confirm: () => { [72, 76, 79].forEach((m, i) => osc({ f: mtof(m + 12), type: "sine", at: i * 0.06, dur: 0.25, vol: 0.07, rev: 0.3 })); },
      back: () => osc({ f: 700, to: 450, type: "sine", dur: 0.1, vol: 0.08 }),
      tab: () => osc({ f: 1200, type: "triangle", dur: 0.04, vol: 0.06 }),
      popup: () => { osc({ f: 400, to: 800, type: "sine", dur: 0.08, vol: 0.08 }); osc({ f: 800, to: 1200, at: 0.05, dur: 0.06, vol: 0.05 }); },
      notice: () => { osc({ f: mtof(84), type: "sine", dur: 0.3, vol: 0.08, rev: 0.3 }); osc({ f: mtof(88), type: "sine", at: 0.1, dur: 0.4, vol: 0.07, rev: 0.3 }); },
    },
    idol: { // 스마트폰·무대 느낌
      click: () => { osc({ f: 1400, to: 1900, dur: 0.04, vol: 0.07 }); },
      confirm: () => { synthStab([84, 88, 91], 0, 0.05, 0.18); synthStab([88, 91, 96], 0.08, 0.05, 0.25); },
      back: () => { osc({ f: 1200, to: 700, dur: 0.07, vol: 0.07 }); },
      tab: () => osc({ f: 2200, dur: 0.025, vol: 0.05 }),
      popup: () => { nz({ dur: 0.2, vol: 0.05, f: 800, to: 6000, q: 1.5, a: 0.05 }); sparkle(0.08, 4, 100, 0.025); },
      notice: () => { [88, 95, 100].forEach((m, i) => osc({ f: mtof(m), at: i * 0.07, dur: 0.12, vol: 0.06, rev: 0.3 })); }, // SNS 알림
    },
    oriental: { // 목탁·편경·풍경 느낌
      click: () => woodblock(0, 0.1, 1500),
      confirm: () => { chime(84, 0, 0.08); chime(91, 0.07, 0.07); },
      back: () => { woodblock(0, 0.1, 1100); woodblock(0.07, 0.07, 850); },
      tab: () => woodblock(0, 0.07, 2000),
      popup: () => { zither(79, 0, 0.09, 0.6); zither(86, 0.05, 0.07, 0.7); },
      notice: () => { chime(91, 0, 0.07); chime(96, 0.12, 0.06); chime(88, 0.24, 0.05); },
      page: () => { nz({ dur: 0.2, vol: 0.05, f: 900, to: 2500, q: 0.7, a: 0.04 }); }, // 한지 넘기는 소리
    },
    dark: {
      click: () => { osc({ f: 900, to: 600, type: "triangle", dur: 0.05, vol: 0.08, rev: 0.4 }); },
      confirm: () => { fmBell(69, 0, 0.09, 0.8, 0.7, 2.76, 3); },
      popup: () => { nz({ dur: 0.3, vol: 0.05, f: 200, to: 1200, q: 3, rev: 0.6 }); },
      notice: () => { fmBell(81, 0, 0.08, 0.8, 0.8, 2.76, 2); fmBell(80, 0.15, 0.06, 0.9, 0.8, 2.76, 2); },
    },
  };


  /* =========================================================
   * 장르 테마별 사운드 키트
   *  1) KIT: 모든 효과음에 공통으로 입히는 테마 색 (음높이, 종소리 재질, 파형, 울림)
   *  2) 테마별 효과음 체인 (헌터 왜곡, 일상 테이프, 다크 어둡게, 오토메 반짝)
   *  3) SIGNATURE: ★공개·치명타·승리 같은 큰 소리는 테마마다 따로 작곡
   * ========================================================= */
  const KIT = {
    fantasy: { shift: 0, bellRatio: 0, bellIndex: 1, bellDec: 1, wave: {}, rev: 1 },
    otome:   { shift: 5, bellRatio: 7.01, bellIndex: 0.55, bellDec: 1.3, wave: { sawtooth: "triangle", square: "sine" }, rev: 1.35 },
    hunter:  { shift: 0, bellRatio: 1.0, bellIndex: 2.6, bellDec: 0.45, wave: { sine: "square", triangle: "sawtooth" }, rev: 0.55 },
    daily:   { shift: 2, bellRatio: 4.0, bellIndex: 0.35, bellDec: 0.4, wave: { sawtooth: "triangle", square: "triangle" }, rev: 0.45 },
    dark:    { shift: -4, bellRatio: 2.76, bellIndex: 1.8, bellDec: 1.9, wave: { square: "sawtooth" }, rev: 1.8 },
    idol:    { shift: 3, bellRatio: 2.0, bellIndex: 0.8, bellDec: 0.8, wave: { triangle: "sawtooth" }, rev: 0.9 },
    oriental:{ shift: 0, bellRatio: 3.0, bellIndex: 1.1, bellDec: 1.5, wave: { square: "triangle", sawtooth: "triangle" }, rev: 1.4 },
  };

  // 테마별 효과음 체인: sfxBus → (테마 처리) → 압축기
  let fxTheme = null;
  function curve(k) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); } return c; }
  // 테마별 처리 회로를 처음에 한 번만 만들어 두고, 바꿀 땐 끊지 않고 볼륨만 부드럽게 넘김(끊으면 '탁·쾅' 튀는 소리가 남)
  let fxChains = null;
  function buildFxChains() {
    fxChains = {};
    const filt = (type, f, g = 0, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.gain.value = g; b.Q.value = q; return b; };
    const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const chain = (name, wire) => { const inp = gain(0); sfxBus.connect(inp); wire(inp); fxChains[name] = inp; };
    chain("fantasy", (i) => i.connect(comp));
    chain("hunter", (i) => { // 살짝 찌그러진 디지털 질감 + 또렷한 고음
      const dry = gain(0.75), sh = ctx.createWaveShaper(), wetG = gain(0.4), hs = filt("highshelf", 3500, 4);
      sh.curve = curve(14); sh.oversample = "2x";
      i.connect(dry).connect(hs); i.connect(sh).connect(wetG).connect(hs); hs.connect(comp);
    });
    chain("daily", (i) => { const lp = filt("lowpass", 7000), ls = filt("lowshelf", 250, 3); i.connect(ls).connect(lp).connect(comp); }); // 따뜻한 테이프
    chain("dark", (i) => { const lp = filt("lowpass", 4200), send = gain(0.35); i.connect(lp).connect(comp); lp.connect(send).connect(reverbIn); }); // 어둡고 깊게
    chain("otome", (i) => { const hs = filt("highshelf", 6000, 4), send = gain(0.15); i.connect(hs).connect(comp); hs.connect(send).connect(reverbIn); }); // 반짝이게
    chain("idol", (i) => { const hs = filt("highshelf", 5000, 3), ls = filt("lowshelf", 120, 2), send = gain(0.2); i.connect(ls).connect(hs).connect(comp); hs.connect(send).connect(reverbIn); }); // 무대처럼 반짝·묵직
    chain("oriental", (i) => { const pk = filt("peaking", 1800, 3, 0.8), lp = filt("lowpass", 9000), send = gain(0.3); i.connect(pk).connect(lp).connect(comp); lp.connect(send).connect(reverbIn); }); // 넓은 대청마루 울림
  }
  function setSfxFx(theme) {
    if (!ctx || fxTheme === theme) return;
    if (!fxChains) buildFxChains();
    fxTheme = theme;
    const t = ctx.currentTime;
    for (const k in fxChains) { const g = fxChains[k].gain; g.cancelScheduledValues(t); g.setTargetAtTime(k === (fxChains[theme] ? theme : "fantasy") ? 1 : 0, t, 0.03); }
  }

  // 시그니처 효과음용 도구
  const pluck = (m, at = 0, vol = 0.1, dur = 0.7, pan = 0, rev = 0.45) => { osc({ f: mtof(m), type: "triangle", at, dur, vol, a: 0.002, lp: 3800, rev, pan }); osc({ f: mtof(m) * 2, at, dur: dur * 0.3, vol: vol * 0.3, a: 0.002, rev, pan }); };
  const gliss = (notes, at, step, vol, dur = 0.8) => notes.forEach((m, i) => pluck(m, at + i * step, vol, dur, -0.6 + (1.2 * i) / Math.max(1, notes.length - 1)));
  const musicbox = (m, at = 0, vol = 0.1, dur = 1.1, pan = 0) => fmBell(m, at, vol, dur, 0.6, 7.01, 0.9, pan);
  const marimba = (m, at = 0, vol = 0.13, pan = 0) => { fmBell(m, at, vol, 0.32, 0.15, 4, 0.5, pan); osc({ f: mtof(m), at, dur: 0.18, vol: vol * 0.6, a: 0.002 }); };
  const heartbeat = (at = 0, vol = 0.4) => { thump(at, vol, 75, 38, 0.16); thump(at + 0.2, vol * 0.75, 70, 36, 0.2); };
  const choir = (notes, at, dur, vol = 0.03, rev = 0.8) => notes.forEach((m, i) => { osc({ f: mtof(m), at, dur, vol, a: dur * 0.35, rev, detune: (i % 2 ? 9 : -9) }); osc({ f: mtof(m), type: "triangle", at, dur, vol: vol * 0.5, a: dur * 0.4, rev, lp: 1400, detune: (i % 2 ? -5 : 5) }); });
  const toll = (m, at = 0, vol = 0.18, dur = 3.2) => { fmBell(m, at, vol, dur, 0.9, 2.76, 4); fmBell(m + 12, at, vol * 0.4, dur * 0.6, 0.9, 2.76, 2); thump(at, vol * 0.8, 60, 35, 0.6); };
  const riser = (at, dur, vol = 0.08) => { osc({ f: 150, to: 1800, type: "sawtooth", at, dur, vol, a: dur * 0.8, lp: 2500, q: 5, curve: "lin" }); nz({ at, dur, vol: vol * 0.8, f: 400, to: 9000, q: 2, a: dur * 0.85 }); };
  const synthChord = (notes, at, dur, vol = 0.05, lp = 2600) => notes.forEach((m, i) => { osc({ f: mtof(m), type: "sawtooth", at, dur, vol, a: 0.01, lp, rev: 0.35, detune: i % 2 ? 8 : -8 }); });
  const blips = (at, n, base = 84, gap = 0.035, vol = 0.04) => { for (let i = 0; i < n; i++) osc({ f: mtof(base + Math.floor(Math.random() * 24)), type: "square", at: at + i * gap, dur: 0.025, vol, lp: 6000 }); };
  function withDist(k, fn) { // 이 소리만 강하게 찌그러뜨림
    const sh = ctx.createWaveShaper(); sh.curve = curve(k); const g = ctx.createGain(); g.gain.value = 0.55;
    sh.connect(g).connect(sfxBus); const prev = OUT; OUT = sh;
    try { fn(); } finally { OUT = prev; }
    setTimeout(() => { try { sh.disconnect(); g.disconnect(); } catch {} }, 4000);
  }
  const C5PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];
  // 동양풍 악기: 가야금·고쟁(뜯는 현, 농현), 대금·피리(숨소리 섞인 피리), 징, 큰북, 목탁, 편경·풍경
  function zither(m, at = 0, vol = 0.12, dur = 0.9, pan = 0, bend = 0) {
    const t0 = ctx.currentTime + at, f = mtof(m) * P;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, t0);
    if (bend) o.frequency.setTargetAtTime(f * Math.pow(2, bend / 12), t0 + dur * 0.3, 0.09); // 농현: 줄을 눌러 음을 밀어 올림
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 2; lp.frequency.setValueAtTime(6000, t0); lp.frequency.exponentialRampToValueAtTime(450, t0 + 0.4);
    const g = ctx.createGain(); env(g, t0, 0.002, vol * V, dur);
    o.connect(lp).connect(g); route(g, pan, 0.45);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function bamboo(m, at = 0, dur = 0.6, vol = 0.07, pan = 0) {
    const t0 = ctx.currentTime + at, f = mtof(m) * P;
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(f * 0.94, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.09); // 아래에서 밀어 올리는 시김새
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(f * 0.012, t0 + Math.min(0.4, dur * 0.6));
    lfo.connect(lg).connect(o.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol * V, t0 + 0.06);
    g.gain.setValueAtTime(vol * V, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); route(g, pan, 0.55);
    o.start(t0); lfo.start(t0); o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
    nz({ at, dur, vol: vol * 0.35, type: "bandpass", f: f / P * 2, q: 3, a: 0.05, pan }); // 숨소리
  }
  const gong = (m = 45, at = 0, vol = 0.14, dur = 3.5) => { fmBell(m, at, vol, dur, 0.9, 1.414, 3.2); fmBell(m + 7, at, vol * 0.35, dur * 0.7, 0.9, 1.59, 2); nz({ at, dur: dur * 0.5, vol: vol * 0.25, type: "bandpass", f: 400, to: 250, q: 1.5, a: 0.15, rev: 0.6 }); };
  const taiko = (at = 0, vol = 0.5) => { thump(at, vol, 115, 55, 0.4); nz({ at, dur: 0.12, vol: vol * 0.25, type: "lowpass", f: 600, a: 0.002 }); };
  const woodblock = (at = 0, vol = 0.1, f = 1300) => { osc({ f, to: f * 0.92, at, dur: 0.07, vol, a: 0.001 }); nz({ at, dur: 0.025, vol: vol * 0.5, type: "bandpass", f: f * 1.6, q: 8 }); };
  const chime = (m, at = 0, vol = 0.07, pan) => fmBell(m, at, vol, 1.8, 0.8, 3.0, 1.0, pan == null ? (Math.random() - 0.5) * 0.8 : pan);
  const windChimes = (at = 0, n = 6, vol = 0.04) => { for (let i = 0; i < n; i++) chime(C5PENTA[Math.floor(Math.random() * C5PENTA.length)] + 12, at + i * (0.06 + Math.random() * 0.08), vol * (1 - i * 0.08)); };
  // 아이돌·연예계: 카메라 셔터, 환호, 박수, 신스 화음, 무대 드롭
  const shutter = (at = 0, vol = 0.12) => { nz({ at, dur: 0.02, vol, type: "highpass", f: 2500, a: 0.001 }); nz({ at: at + 0.045, dur: 0.035, vol: vol * 0.8, type: "bandpass", f: 1800, q: 2, a: 0.001 }); };
  const flashPop = (at = 0, vol = 0.05) => { shutter(at, vol * 2); osc({ f: 3000, to: 6000, at, dur: 0.25, vol: vol * 0.3, a: 0.02 }); };
  function crowd(at = 0, dur = 2, vol = 0.05) { // 환호성: 여러 목소리가 겹친 듯한 소음
    for (let i = 0; i < 4; i++) nz({ at: at + i * 0.04, dur, vol: vol * (0.6 + Math.random() * 0.4), type: "bandpass", f: 700 + i * 350 + Math.random() * 200, to: 900 + i * 300, q: 2.5, a: dur * 0.25, pan: (Math.random() - 0.5) * 1.2, rev: 0.4 });
    for (let i = 0; i < 6; i++) osc({ f: 500 + Math.random() * 500, to: 900 + Math.random() * 600, type: "sawtooth", at: at + Math.random() * dur * 0.5, dur: 0.5 + Math.random() * 0.6, vol: vol * 0.08, a: 0.1, lp: 1800, pan: (Math.random() - 0.5) * 1.4, rev: 0.4 }); // '와~'
  }
  function applause(at = 0, dur = 2, vol = 0.05) { const n = Math.floor(dur * 40); for (let i = 0; i < n; i++) { const t = at + Math.random() * dur; nz({ at: t, dur: 0.02, vol: vol * (1 - (t - at) / dur * 0.7) * (0.5 + Math.random() * 0.5), type: "bandpass", f: 1200 + Math.random() * 2500, q: 1.2, a: 0.001, pan: (Math.random() - 0.5) * 1.6 }); } }
  const synthStab = (notes, at = 0, vol = 0.05, dur = 0.3) => notes.forEach((m, i) => [-12, 0, 12].forEach((d) => osc({ f: mtof(m), type: "sawtooth", at, dur, vol: vol / 2, a: 0.004, lp: 3500, detune: d + i * 2, rev: 0.35, pan: d / 30 })));
  const swordRing = (at = 0, vol = 0.08) => { nz({ at, dur: 0.18, vol: vol * 1.6, type: "highpass", f: 3000, to: 9000, a: 0.002 }); fmBell(100, at + 0.02, vol, 0.9, 0.5, 5.4, 2.5); };

  const SIGNATURE = {
    otome: {
      charge: () => { gliss([72, 76, 79, 84, 88, 91], 0, 0.14, 0.06, 0.6); choir([64, 67, 72], 0, 1.2, 0.025); nz({ dur: 1.1, vol: 0.03, type: "highpass", f: 6000, a: 0.6, rev: 0.7 }); },
      flash: () => { nz({ dur: 0.9, vol: 0.12, type: "highpass", f: 3000, a: 0.25, rev: 0.9 }); [84, 88, 91, 96].forEach((m) => musicbox(m, 0.2, 0.06, 1.4)); thump(0.2, 0.2, 90, 50, 0.4); },
      reveal3: () => { musicbox(84, 0, 0.11); musicbox(88, 0.08, 0.1); },
      reveal4: () => { gliss([72, 76, 79, 84, 88], 0, 0.045, 0.08); [84, 88, 91].forEach((m, i) => musicbox(m, 0.25 + i * 0.08, 0.1, 1.3)); sparkle(0.3, 6, 96, 0.03); },
      reveal5: () => {
        gliss(C5PENTA, 0, 0.04, 0.09, 1);
        choir([60, 64, 67, 72, 76], 0.1, 2.6, 0.03);
        [84, 88, 91, 96, 100].forEach((m, i) => musicbox(m, 0.45 + i * 0.09, 0.11, 1.8, -0.5 + i * 0.25));
        heartbeat(0.45, 0.3); sparkle(0.6, 18, 96, 0.035);
      },
      hit: () => { nz({ dur: 0.06, vol: 0.18, type: "bandpass", f: 2500, q: 1.5, a: 0.001 }); musicbox(91, 0.01, 0.05, 0.4); thump(0, 0.25, 160, 70, 0.12); },
      crit: () => { nz({ dur: 0.25, vol: 0.14, f: 800, to: 7000, q: 2, a: 0.01 }); [91, 96, 100].forEach((m, i) => musicbox(m, 0.08 + i * 0.03, 0.08, 0.7)); thump(0.08, 0.35, 180, 50, 0.2); sparkle(0.12, 8, 98, 0.03); },
      sortie: () => { gliss([67, 72, 76, 79, 84], 0, 0.06, 0.08); [79, 84, 88].forEach((m) => musicbox(m, 0.35, 0.09, 1.2)); },
      victory: () => {
        const mel = [[72, 0], [76, 0.18], [79, 0.36], [84, 0.54], [83, 0.78], [84, 0.9]];
        mel.forEach(([m, t]) => { osc({ f: mtof(m), at: t, dur: 0.35, vol: 0.07, a: 0.02, rev: 0.5 }); musicbox(m + 12, t, 0.05, 0.6); });
        gliss(C5PENTA, 0.9, 0.035, 0.07); choir([60, 64, 67, 72], 0.9, 2, 0.03); sparkle(1.1, 14, 96, 0.035);
      },
      defeat: () => { [84, 83, 79, 76, 72, 71].forEach((m, i) => musicbox(m, i * (0.22 + i * 0.06), 0.08 - i * 0.008, 1)); osc({ f: 500, to: 380, at: 1.6, dur: 0.8, vol: 0.03, rev: 0.6 }); },
      levelUp: () => { [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => osc({ f: mtof(m), at: i * 0.06, dur: 0.25, vol: 0.06, a: 0.01, rev: 0.4 })); musicbox(96, 0.45, 0.1, 1.4); sparkle(0.45, 10, 98, 0.03); },
      aether: () => { [96, 100, 103, 108].forEach((m, i) => musicbox(m, i * 0.05, 0.07, 1.2, -0.3 + i * 0.2)); nz({ dur: 0.6, vol: 0.025, type: "highpass", f: 8000, a: 0.15, rev: 0.8 }); },
      affection: () => { heartbeat(0, 0.28); [84, 88, 91, 88, 96].forEach((m, i) => musicbox(m, 0.35 + i * 0.12, 0.08, 0.9)); sparkle(0.9, 6, 100, 0.03); },
    },
    hunter: {
      charge: () => withDist(6, () => { riser(0, 1.15, 0.09); osc({ f: 110, to: 220, type: "square", dur: 1.15, vol: 0.05, lp: 900, a: 0.3, curve: "lin" }); blips(0.6, 10, 84, 0.05, 0.03); }),
      flash: () => withDist(10, () => { thump(0, 0.8, 120, 28, 0.9); nz({ dur: 0.6, vol: 0.3, type: "lowpass", f: 2500, to: 200, a: 0.001 }); nz({ dur: 0.15, vol: 0.2, type: "highpass", f: 5000, a: 0.001 }); }),
      reveal3: () => { osc({ f: 1568, type: "square", dur: 0.05, vol: 0.05, lp: 5000 }); osc({ f: 2093, type: "square", at: 0.06, dur: 0.1, vol: 0.05, lp: 5000 }); },
      reveal4: () => { riser(0, 0.3, 0.06); withDist(8, () => thump(0.3, 0.5, 130, 40, 0.4)); synthChord([57, 64, 69, 72], 0.3, 0.9, 0.05); blips(0.3, 6, 88, 0.03, 0.03); },
      reveal5: () => {
        riser(0, 0.5, 0.09);
        withDist(12, () => { thump(0.5, 0.9, 140, 26, 1.4); nz({ at: 0.5, dur: 0.8, vol: 0.25, type: "lowpass", f: 1800, to: 150, a: 0.001 }); });
        synthChord([45, 52, 57, 64, 69], 0.5, 2.2, 0.055, 3200);
        blips(0.55, 18, 84, 0.03, 0.035);
        [81, 88, 93].forEach((m, i) => osc({ f: mtof(m), type: "square", at: 0.9 + i * 0.12, dur: 0.12, vol: 0.05, lp: 5000, rev: 0.3 }));
      },
      hit: () => withDist(8, () => { nz({ dur: 0.08, vol: 0.32, type: "lowpass", f: 3500, a: 0.001 }); thump(0, 0.55, 220, 45, 0.16); }),
      crit: () => withDist(14, () => { nz({ dur: 0.18, vol: 0.25, f: 6000, to: 600, q: 1.2, a: 0.001 }); thump(0.05, 0.8, 240, 35, 0.35); nz({ at: 0.05, dur: 0.3, vol: 0.25, type: "lowpass", f: 2200, to: 300 }); fmBell(98, 0.05, 0.05, 0.5, 0.3, 1.41, 6); }),
      sortie: () => { for (let i = 0; i < 4; i++) osc({ f: i % 2 ? 660 : 880, type: "square", at: i * 0.16, dur: 0.14, vol: 0.045, lp: 3500 }); withDist(10, () => thump(0.66, 0.7, 120, 30, 0.6)); synthChord([45, 52, 57], 0.66, 1, 0.05); },
      victory: () => { [[57, 64, 69], [60, 67, 72], [62, 69, 74], [64, 71, 76]].forEach((c, i) => synthChord(c, i * 0.2, 0.22, 0.05, 3500)); synthChord([57, 64, 69, 76], 0.85, 1.4, 0.055, 3800); [1046, 1568, 2093].forEach((f, i) => osc({ f, type: "square", at: 1.0 + i * 0.1, dur: 0.1, vol: 0.04, lp: 5000 })); withDist(8, () => thump(0.85, 0.6, 120, 35, 0.5)); },
      defeat: () => { osc({ f: 900, to: 40, type: "sawtooth", dur: 1.4, vol: 0.08, lp: 2000 }); blips(0, 8, 70, 0.07, 0.03); nz({ at: 1.2, dur: 0.4, vol: 0.06, type: "lowpass", f: 600 }); },
      levelUp: () => { [69, 72, 76, 81, 84, 88, 93].forEach((m, i) => osc({ f: mtof(m), type: "square", at: i * 0.035, dur: 0.09, vol: 0.045, lp: 5000 })); osc({ f: 1760, type: "square", at: 0.3, dur: 0.25, vol: 0.045, lp: 5000, rev: 0.3 }); },
      aether: () => { for (let i = 0; i < 8; i++) osc({ f: mtof(84 + i * 2), type: "square", at: i * 0.03, dur: 0.05, vol: 0.035, lp: 6000 }); osc({ f: 2000, to: 4000, dur: 0.3, vol: 0.02, a: 0.05 }); },
      affection: () => { osc({ f: 1318, type: "square", dur: 0.08, vol: 0.04, lp: 5000 }); osc({ f: 1760, type: "square", at: 0.09, dur: 0.18, vol: 0.04, lp: 5000, rev: 0.3 }); },
    },
    daily: {
      charge: () => { osc({ f: 400, to: 1800, dur: 1.1, vol: 0.06, a: 0.05, curve: "lin" }); for (let i = 0; i < 4; i++) marimba(72 + i * 4, 0.2 + i * 0.22, 0.08); },
      flash: () => { nz({ dur: 0.04, vol: 0.25, type: "highpass", f: 3000, a: 0.001 }); nz({ at: 0.05, dur: 0.06, vol: 0.18, type: "bandpass", f: 1500, q: 3 }); [79, 84, 88].forEach((m, i) => marimba(m, 0.15 + i * 0.03, 0.08)); },
      reveal3: () => { marimba(79, 0, 0.12); marimba(84, 0.1, 0.12); },
      reveal4: () => { nz({ dur: 0.15, vol: 0.18, type: "highpass", f: 2000, a: 0.002 }); [72, 76, 79, 84].forEach((m, i) => marimba(m, 0.1 + i * 0.08, 0.12)); },
      reveal5: () => {
        nz({ dur: 0.25, vol: 0.28, type: "highpass", f: 1500, a: 0.001 }); thump(0, 0.3, 160, 60, 0.15);
        for (let i = 0; i < 14; i++) nz({ at: 0.15 + Math.random() * 0.5, dur: 0.03, vol: 0.06, type: "bandpass", f: 3000 + Math.random() * 4000, q: 6 });
        [72, 76, 79, 84, 79, 84, 88, 91].forEach((m, i) => marimba(m, 0.2 + i * 0.09, 0.12, -0.5 + i * 0.14));
        [0.95, 1.2].forEach((t) => nz({ at: t, dur: 0.06, vol: 0.12, type: "bandpass", f: 1800, q: 2 }));
      },
      hit: () => { osc({ f: 320, to: 120, dur: 0.12, vol: 0.18, a: 0.002 }); nz({ dur: 0.03, vol: 0.12, type: "bandpass", f: 1800, q: 4 }); },
      crit: () => { osc({ f: 900, to: 160, dur: 0.18, vol: 0.18, a: 0.002 }); nz({ dur: 0.04, vol: 0.2, type: "bandpass", f: 2400, q: 5 }); osc({ f: 200, to: 600, at: 0.12, dur: 0.25, vol: 0.06, a: 0.01 }); },
      sortie: () => { for (let i = 0; i < 6; i++) osc({ f: i % 2 ? 1900 : 2200, at: i * 0.05, dur: 0.05, vol: 0.05 }); [0.35, 0.5].forEach((t) => nz({ at: t, dur: 0.05, vol: 0.12, type: "bandpass", f: 1800, q: 2 })); },
      victory: () => { [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.5], [84, 0.62]].forEach(([m, t]) => marimba(m, t, 0.13)); [0.75, 0.9, 1.05].forEach((t) => nz({ at: t, dur: 0.05, vol: 0.1, type: "bandpass", f: 1800, q: 2 })); [60, 64, 67].forEach((m) => osc({ f: mtof(m), type: "triangle", at: 0.75, dur: 1, vol: 0.05, rev: 0.3 })); },
      defeat: () => { [[58, 0, 0.35], [57, 0.4, 0.35], [56, 0.8, 0.9]].forEach(([m, t, d]) => osc({ f: mtof(m), to: mtof(m) * 0.97, type: "sawtooth", at: t, dur: d, vol: 0.07, lp: 900, a: 0.03 })); },
      levelUp: () => { [72, 74, 76, 79, 81, 84, 88].forEach((m, i) => marimba(m, i * 0.05, 0.1)); marimba(91, 0.4, 0.13); },
      aether: () => { [88, 91, 96].forEach((m, i) => marimba(m, i * 0.06, 0.1)); },
      affection: () => { osc({ f: 500, to: 900, dur: 0.08, vol: 0.08 }); [84, 88, 91].forEach((m, i) => marimba(m, 0.1 + i * 0.07, 0.09)); },
    },
    idol: {
      charge: () => { riser(0, 1.15, 0.07); crowd(0.3, 1, 0.025); for (let i = 0; i < 8; i++) nz({ at: 0.6 + i * (0.06 - i * 0.005), dur: 0.03, vol: 0.05 + i * 0.01, type: "bandpass", f: 1500, q: 2 }); },
      flash: () => { thump(0, 0.6, 120, 40, 0.5); for (let i = 0; i < 5; i++) flashPop(i * 0.06 + Math.random() * 0.03, 0.05); crowd(0.05, 1.6, 0.05); },
      reveal3: () => { synthStab([79, 83, 86], 0, 0.06, 0.35); },
      reveal4: () => { [79, 83, 86, 91].forEach((m, i) => synthStab([m], i * 0.07, 0.07, 0.3)); flashPop(0.3, 0.04); crowd(0.3, 1.2, 0.025); },
      reveal5: () => { // 무대 '드롭': 쿵 + 박수 + 화음 + 환호 + 플래시 세례
        thump(0, 0.8, 140, 38, 0.6); nz({ dur: 0.18, vol: 0.18, type: "bandpass", f: 1300, q: 1.2, a: 0.001, rev: 0.5 });
        synthStab([67, 71, 74, 79, 83], 0, 0.06, 1.6); synthStab([91, 95], 0.25, 0.04, 1.2);
        for (let i = 0; i < 10; i++) flashPop(0.2 + Math.random() * 1.4, 0.045);
        crowd(0.05, 2.6, 0.06); applause(0.4, 2.2, 0.04); sparkle(0.3, 14, 98, 0.035);
      },
      hit: () => { thump(0, 0.45, 160, 50, 0.15); nz({ dur: 0.1, vol: 0.2, type: "bandpass", f: 1400, q: 1.2, a: 0.001 }); },
      crit: () => { thump(0, 0.6, 180, 45, 0.25); nz({ dur: 0.12, vol: 0.22, type: "bandpass", f: 1300, q: 1, a: 0.001, rev: 0.4 }); osc({ f: 2400, to: 400, type: "square", dur: 0.18, vol: 0.05, lp: 4000 }); flashPop(0.05, 0.04); },
      sortie: () => { [0, 0.45, 0.9].forEach((t) => osc({ f: 880, type: "square", at: t, dur: 0.12, vol: 0.05, lp: 3000 })); osc({ f: 1760, type: "square", at: 1.35, dur: 0.3, vol: 0.06, lp: 3500 }); thump(1.35, 0.5, 130, 40, 0.4); crowd(1.35, 1.4, 0.04); },
      victory: () => { synthStab([72, 76, 79], 0, 0.05, 0.2); synthStab([74, 77, 81], 0.22, 0.05, 0.2); synthStab([76, 79, 84, 88], 0.44, 0.06, 1.4); thump(0.44, 0.5, 130, 40, 0.4); applause(0.5, 2.8, 0.05); crowd(0.5, 2.4, 0.05); for (let i = 0; i < 6; i++) flashPop(0.6 + Math.random() * 1.6, 0.04); },
      defeat: () => { osc({ f: 900, to: 120, type: "sawtooth", dur: 0.35, vol: 0.06, lp: 2000 }); nz({ dur: 0.3, vol: 0.08, f: 3000, to: 500, q: 2 }); [[72, 0.5], [71, 0.85], [67, 1.2]].forEach(([m, t]) => osc({ f: mtof(m), at: t, dur: 0.6, vol: 0.06, a: 0.02, rev: 0.5 })); },
      levelUp: () => { [72, 76, 79, 84, 88, 91].forEach((m, i) => synthStab([m], i * 0.05, 0.05, 0.18)); osc({ f: mtof(96), at: 0.32, dur: 0.6, vol: 0.06, rev: 0.4 }); sparkle(0.32, 8, 98, 0.03); },
      aether: () => { sparkle(0, 9, 98, 0.04); osc({ f: 2000, to: 4000, dur: 0.4, vol: 0.02, a: 0.05, rev: 0.5 }); },
      affection: () => { [0, 0.12].forEach((t, i) => osc({ f: 900 + i * 300, to: 1500 + i * 400, at: t, dur: 0.1, vol: 0.06 })); synthStab([84, 88, 91], 0.25, 0.04, 0.5); sparkle(0.3, 5, 100, 0.03); }, // 심쿵
    },
    oriental: {
      charge: () => { bamboo(76, 0, 0.35, 0.06); bamboo(79, 0.3, 0.35, 0.065); bamboo(84, 0.6, 0.55, 0.07); nz({ dur: 1.15, vol: 0.04, f: 500, to: 3000, q: 1, a: 0.6, rev: 0.5 }); windChimes(0.7, 4, 0.03); },
      flash: () => { gong(43, 0, 0.16, 3.8); taiko(0, 0.55); },
      reveal3: () => { zither(79, 0, 0.11, 0.9); zither(84, 0.09, 0.1, 1); },
      reveal4: () => { C5PENTA.slice(0, 7).forEach((m, i) => zither(m, i * 0.04, 0.09, 0.8, -0.6 + i * 0.2)); chime(91, 0.32, 0.08); chime(96, 0.42, 0.07); taiko(0, 0.3); },
      reveal5: () => {
        gong(40, 0, 0.18, 4.5); taiko(0, 0.6); taiko(0.18, 0.4);
        C5PENTA.forEach((m, i) => zither(m, 0.2 + i * 0.035, 0.09, 1.1, -0.7 + i * 0.15));
        C5PENTA.slice(3).forEach((m, i) => zither(m + 12, 0.6 + i * 0.035, 0.07, 1.2, 0.7 - i * 0.2));
        bamboo(88, 0.75, 0.5, 0.07); bamboo(91, 1.2, 1.2, 0.075);
        windChimes(0.9, 10, 0.035);
      },
      hit: () => { taiko(0, 0.4); woodblock(0, 0.08, 900); nz({ dur: 0.12, vol: 0.12, f: 1500, to: 600, q: 1, a: 0.003 }); },
      crit: () => { swordRing(0, 0.09); taiko(0.04, 0.6); nz({ at: 0.04, dur: 0.2, vol: 0.18, type: "lowpass", f: 2000, to: 400, a: 0.002 }); },
      sortie: () => { [0, 0.18, 0.32, 0.43, 0.52, 0.6, 0.67].forEach((t, i) => taiko(t, 0.25 + i * 0.05)); gong(45, 0.75, 0.12, 2.5); bamboo(81, 0.75, 0.9, 0.06); },
      victory: () => {
        [[72, 0, 0.3], [76, 0.3, 0.3], [79, 0.6, 0.25], [81, 0.85, 0.25], [84, 1.1, 1.0]].forEach(([m, t, d]) => bamboo(m, t, d + 0.1, 0.07));
        [60, 67, 72, 76, 79, 84].forEach((m, i) => zither(m, 1.1 + i * 0.04, 0.08, 1.4));
        gong(48, 1.1, 0.1, 3); windChimes(1.3, 8, 0.03);
      },
      defeat: () => { [84, 81, 79, 76, 72, 69].forEach((m, i) => zither(m, i * 0.28, 0.08 - i * 0.008, 1.1, 0, i === 5 ? -1 : 0)); gong(36, 1.5, 0.1, 4); },
      levelUp: () => { C5PENTA.forEach((m, i) => zither(m, i * 0.04, 0.08, 0.7)); chime(96, 0.42, 0.09); chime(100, 0.5, 0.08); },
      aether: () => windChimes(0, 7, 0.045),
      affection: () => { zither(84, 0, 0.09, 1.1, 0, 2); zither(88, 0.25, 0.08, 1.1); chime(96, 0.45, 0.06); },
    },
    dark: {
      charge: () => { choir([45, 46, 52], 0, 1.2, 0.04, 0.9); osc({ f: 55, to: 110, type: "sawtooth", dur: 1.15, vol: 0.08, lp: 400, a: 0.4, curve: "lin" }); for (let i = 0; i < 6; i++) nz({ at: i * 0.18, dur: 0.15, vol: 0.03, type: "bandpass", f: 900 + Math.random() * 1500, q: 12, rev: 0.6 }); },
      flash: () => { nz({ dur: 0.08, vol: 0.35, type: "highpass", f: 1500, a: 0.001 }); nz({ at: 0.05, dur: 2.2, vol: 0.18, type: "lowpass", f: 300, to: 60, a: 0.05, rev: 0.6 }); },
      reveal3: () => toll(62, 0, 0.12, 2),
      reveal4: () => { toll(57, 0, 0.15, 2.6); choir([57, 60, 63, 66], 0.1, 2, 0.03); },
      reveal5: () => {
        nz({ dur: 1.0, vol: 0.1, type: "highpass", f: 2000, a: 0.9, rev: 0.8 }); // 거꾸로 빨려 들어오는 소리
        toll(45, 1.0, 0.22, 4); toll(57, 1.0, 0.12, 3.5);
        choir([45, 48, 51, 54, 57], 1.0, 3, 0.035);
        heartbeat(1.6, 0.35); heartbeat(2.6, 0.3);
      },
      hit: () => { thump(0, 0.5, 120, 40, 0.25); nz({ dur: 0.25, vol: 0.15, type: "lowpass", f: 900, a: 0.002, rev: 0.4 }); },
      crit: () => { thump(0, 0.7, 140, 30, 0.4); nz({ dur: 0.5, vol: 0.12, type: "bandpass", f: 700, to: 300, q: 4, a: 0.01, rev: 0.5 }); fmBell(64, 0.05, 0.08, 1.4, 0.8, 2.76, 4); },
      sortie: () => { [0, 0.3, 0.45].forEach((t, i) => thump(t, 0.6 - i * 0.1, 90, 40, 0.4)); osc({ f: 110, type: "sawtooth", at: 0.6, dur: 1.4, vol: 0.06, lp: 600, a: 0.15, rev: 0.6 }); osc({ f: 164.8, type: "sawtooth", at: 0.6, dur: 1.4, vol: 0.04, lp: 600, a: 0.15, rev: 0.6 }); },
      victory: () => { choir([45, 48, 52], 0, 1.2, 0.04); choir([45, 49, 52, 57], 1.1, 2.2, 0.04); toll(57, 1.1, 0.12, 3); },
      defeat: () => { choir([40, 41, 46, 47], 0, 2.5, 0.04); heartbeat(0.3, 0.4); heartbeat(1.1, 0.3); thump(2.0, 0.15, 60, 35, 0.3); },
      levelUp: () => { [60, 62, 64, 66, 68, 70, 72].forEach((m, i) => fmBell(m + 12, i * 0.09, 0.07, 1.2, 0.8, 2.76, 2.5)); },
      aether: () => { [91, 92, 98].forEach((m, i) => fmBell(m, i * 0.07, 0.06, 1.4, 0.9, 3.5, 1.5)); },
      affection: () => { heartbeat(0, 0.35); [76, 75, 72, 75].forEach((m, i) => fmBell(m + 12, 0.4 + i * 0.18, 0.06, 1.0, 0.7, 7.01, 0.8)); },
    },
  };

  /* ---------- 내 소리 파일 (IndexedDB, 이 기기 전용) ---------- */
  const DB = "gf-sound-files", ST = "files";
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const idbReq = async (mode, fn) => { const d = await idb(); return new Promise((res, rej) => { const tx = d.transaction(ST, mode); const q = fn(tx.objectStore(ST)); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); };
  const idbGet = (k) => idbReq("readonly", (s) => s.get(k)).catch(() => null);
  const idbPut = (k, v) => idbReq("readwrite", (s) => s.put(v, k));
  const idbDel = (k) => idbReq("readwrite", (s) => s.delete(k)).catch(() => {});
  const idbKeys = () => idbReq("readonly", (s) => s.getAllKeys()).catch(() => []);

  const customNames = new Map(); // "sfx:hit" / "bgm:battle" -> 파일 이름
  const sfxBuffers = new Map();  // 처음 쓸 때 한 번만 디코딩해서 보관
  async function loadCustomIndex() {
    const keys = await idbKeys();
    customNames.clear();
    for (const k of keys || []) { const rec = await idbGet(k); if (rec) customNames.set(k, rec.name); }
  }
  async function getSfxBuffer(name) {
    if (sfxBuffers.has(name)) return sfxBuffers.get(name);
    const rec = await idbGet("sfx:" + name); if (!rec) return null;
    const ab = await rec.blob.arrayBuffer();
    const buf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)).catch(() => null);
    if (buf) sfxBuffers.set(name, buf);
    return buf;
  }

  /* ---------- 재생 ---------- */
  const lastPlay = new Map();
  const GROUP_OF = Object.fromEntries(SOUND_LIST.flatMap(([g, list]) => list.map(([k]) => [k, g])));
  const BIG = new Set(["reveal4", "reveal5", "victory", "defeat", "levelUp", "sortie", "enrage", "flash", "affection", "unlock"]);
  /* ---------- 테마별 UI·글자 소리 ----------
   *  각 테마 배경음에 쓰는 악기로 만듦(오토메=오르골·하프, 헌터=디지털 신스, 일상=타자기·전자 피아노,
   *  판타지=하프·호른, 동양풍=목탁·가야금, 아이돌=버블 신스·셔터, 다크=낮은 종·합창)
   *  tick(대사 글자)은 아주 작고 짧게, 음높이를 살짝씩 흔들어 기계적으로 들리지 않게 함 */
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const jit = (n) => (Math.random() - 0.5) * n;
  const THEME_UI = {
    otome: {
      tick: () => fmBell(rnd([91, 93, 96, 98, 100]), 0, 0.016, 0.14, 0.3, 7.01, 0.5, jit(0.4)),
      toggle: () => { musicbox(91, 0, 0.06, 0.4); musicbox(98, 0.05, 0.05, 0.5); },
      page: () => { gliss([84, 88, 91], 0, 0.04, 0.035, 0.5); nz({ dur: 0.2, vol: 0.025, f: 2500, to: 6000, q: 0.8, a: 0.05 }); },
      error: () => { musicbox(80, 0, 0.07, 0.5); musicbox(79, 0.12, 0.06, 0.6); },
      whoosh: () => { nz({ dur: 0.35, vol: 0.05, type: "highpass", f: 2000, to: 7000, a: 0.12, rev: 0.6 }); sparkle(0.1, 3, 96, 0.02); },
      pullPress: () => { gliss([79, 84, 88, 91, 96], 0, 0.05, 0.06, 0.8); musicbox(100, 0.25, 0.07, 1); },
      skillSelect: () => musicbox(rnd([88, 91, 93]), 0, 0.07, 0.5),
      turn: () => { musicbox(84, 0, 0.06, 0.6); musicbox(91, 0.09, 0.06, 0.8); },
      coin: () => { musicbox(96, 0, 0.07, 0.5); musicbox(103, 0.06, 0.06, 0.7); },
      equip: () => { pluck(72, 0, 0.07, 0.6); musicbox(88, 0.04, 0.05, 0.6); },
      reward: () => { [84, 88, 91, 96].forEach((m, i) => musicbox(m, i * 0.07, 0.07, 0.9)); sparkle(0.25, 4, 98, 0.025); },
    },
    hunter: {
      tick: () => { osc({ f: 2000 + Math.random() * 500, type: "square", dur: 0.012, vol: 0.016, lp: 6500 }); if (Math.random() < 0.15) osc({ f: 3200, type: "square", at: 0.02, dur: 0.008, vol: 0.01, lp: 7000 }); },
      toggle: () => { osc({ f: 1200, type: "square", dur: 0.02, vol: 0.04, lp: 5000 }); nz({ dur: 0.02, vol: 0.06, type: "highpass", f: 4000 }); osc({ f: 600, type: "sawtooth", at: 0.025, dur: 0.04, vol: 0.03, lp: 2000 }); },
      page: () => { blips(0, 4, 84, 0.025, 0.025); nz({ dur: 0.12, vol: 0.04, type: "bandpass", f: 3000, to: 900, q: 2 }); },
      error: () => { osc({ f: 140, type: "sawtooth", dur: 0.12, vol: 0.06, lp: 1200 }); osc({ f: 140, type: "sawtooth", at: 0.15, dur: 0.12, vol: 0.06, lp: 1200 }); },
      whoosh: () => { nz({ dur: 0.22, vol: 0.08, f: 400, to: 5000, q: 2, a: 0.05 }); osc({ f: 200, to: 900, type: "sawtooth", dur: 0.2, vol: 0.025, lp: 2500 }); },
      pullPress: () => { synthChord([57, 64, 69], 0, 0.25, 0.04, 3000); osc({ f: 110, to: 55, type: "sawtooth", dur: 0.3, vol: 0.06, lp: 600 }); blips(0.05, 5, 88, 0.03, 0.025); },
      skillSelect: () => { osc({ f: 1600, type: "square", dur: 0.03, vol: 0.035, lp: 5000 }); osc({ f: 2400, type: "square", at: 0.035, dur: 0.03, vol: 0.03, lp: 5000 }); },
      turn: () => { osc({ f: 440, to: 880, type: "sawtooth", dur: 0.12, vol: 0.04, lp: 3000 }); nz({ dur: 0.1, vol: 0.04, type: "highpass", f: 3000 }); },
      coin: () => { blips(0, 3, 96, 0.03, 0.03); },
      equip: () => { nz({ dur: 0.03, vol: 0.1, type: "bandpass", f: 2500, q: 4 }); osc({ f: 220, to: 110, type: "square", dur: 0.08, vol: 0.05, lp: 1500 }); },
      reward: () => { [69, 76, 81, 88].forEach((m, i) => osc({ f: mtof(m), type: "square", at: i * 0.05, dur: 0.08, vol: 0.035, lp: 4000 })); },
    },
    daily: {
      tick: () => { nz({ dur: 0.012, vol: 0.045, type: "highpass", f: 2800 + Math.random() * 1200 }); osc({ f: 170 + Math.random() * 40, to: 110, type: "triangle", dur: 0.025, vol: 0.03 }); },
      toggle: () => { nz({ dur: 0.015, vol: 0.08, type: "bandpass", f: 2200, q: 2 }); marimba(84, 0.01, 0.05); },
      page: () => { nz({ dur: 0.22, vol: 0.06, f: 1200, to: 3500, q: 0.7, a: 0.04 }); },
      error: () => { marimba(67, 0, 0.08); marimba(63, 0.12, 0.07); },
      whoosh: () => nz({ dur: 0.25, vol: 0.06, f: 500, to: 2500, q: 1, a: 0.07 }),
      pullPress: () => { [72, 76, 79, 84].forEach((m, i) => fmBell(m, i * 0.05, 0.06, 0.5, 0.25, 1, 0.6)); },
      skillSelect: () => marimba(rnd([76, 79, 81]), 0, 0.08),
      turn: () => { osc({ f: 1200, to: 1500, dur: 0.15, vol: 0.04 }); osc({ f: 1500, to: 1800, at: 0.12, dur: 0.12, vol: 0.035 }); }, // 휘파람 '휙휙'
      coin: () => { marimba(88, 0, 0.07); marimba(91, 0.06, 0.06); },
      equip: () => { nz({ dur: 0.04, vol: 0.06, type: "lowpass", f: 900 }); marimba(72, 0.02, 0.07); },
      reward: () => { [72, 76, 79, 84].forEach((m, i) => fmBell(m, i * 0.06, 0.06, 0.7, 0.3, 1, 0.6)); },
    },
    fantasy: {
      tick: () => nz({ dur: 0.028, vol: 0.022, type: "bandpass", f: 4200 + Math.random() * 1600, q: 3, a: 0.004 }), // 깃펜이 종이를 긁는 소리
      toggle: () => { pluck(76, 0, 0.06, 0.4); pluck(83, 0.04, 0.05, 0.5); },
      page: () => { nz({ dur: 0.3, vol: 0.06, f: 900, to: 3000, q: 0.6, a: 0.06 }); nz({ at: 0.18, dur: 0.06, vol: 0.03, type: "highpass", f: 5000 }); },
      error: () => { osc({ f: mtof(50), type: "sawtooth", dur: 0.25, vol: 0.04, lp: 900, a: 0.02 }); osc({ f: mtof(49), type: "sawtooth", at: 0.2, dur: 0.3, vol: 0.04, lp: 800, a: 0.02 }); },
      pullPress: () => { gliss([67, 71, 74, 79, 83, 86], 0, 0.04, 0.06, 0.9); },
      skillSelect: () => pluck(rnd([74, 79, 81]), 0, 0.08, 0.5),
      turn: () => { osc({ f: mtof(55), type: "sawtooth", dur: 0.5, vol: 0.035, lp: 1400, a: 0.05, rev: 0.6 }); osc({ f: mtof(62), type: "sawtooth", at: 0.15, dur: 0.6, vol: 0.035, lp: 1400, a: 0.05, rev: 0.6 }); }, // 호른 신호
      coin: () => { fmBell(91, 0, 0.06, 0.5, 0.4, 3.5, 1.5); fmBell(96, 0.07, 0.05, 0.6, 0.4, 3.5, 1.5); },
      equip: () => { swordRing(0, 0.05); },
      reward: () => { gliss([74, 79, 83, 86], 0, 0.06, 0.07, 0.9); fmBell(98, 0.25, 0.05, 1, 0.6, 3.5, 1.5); },
    },
    oriental: {
      tick: () => { const f = 820 + Math.random() * 260; osc({ f, to: f * 0.9, dur: 0.03, vol: 0.026, a: 0.001 }); nz({ dur: 0.01, vol: 0.012, type: "bandpass", f: f * 1.7, q: 8 }); }, // 작은 목탁
      toggle: () => { woodblock(0, 0.07, 1500); zither(rnd([72, 74, 76]), 0.02, 0.05, 0.4); },
      page: () => { nz({ dur: 0.3, vol: 0.05, f: 700, to: 2200, q: 0.6, a: 0.08 }); zither(79, 0.1, 0.035, 0.5); }, // 한지 넘기는 소리
      error: () => { zither(64, 0, 0.08, 0.6, 0, -1); },
      whoosh: () => { nz({ dur: 0.4, vol: 0.05, f: 300, to: 1800, q: 1, a: 0.15, rev: 0.5 }); },
      pullPress: () => { [67, 69, 72, 74, 76].forEach((m, i) => zither(m, i * 0.05, 0.07, 0.9, -0.5 + i * 0.25)); },
      skillSelect: () => zither(rnd([72, 74, 76, 79]), 0, 0.07, 0.6),
      turn: () => { woodblock(0, 0.08, 1100); woodblock(0.14, 0.06, 1300); },
      coin: () => { chime(rnd([96, 98, 100]), 0, 0.05, 0); chime(103, 0.08, 0.04, 0.2); },
      equip: () => { zither(55, 0, 0.08, 0.7, 0, 2); },
      reward: () => { [72, 74, 76, 79, 81].forEach((m, i) => zither(m + 12, i * 0.06, 0.05, 0.8)); windChimes(0.3, 4, 0.03); },
    },
    idol: {
      tick: () => { const f = 700 + Math.random() * 300; osc({ f, to: f * 1.8, dur: 0.03, vol: 0.024 }); }, // 톡톡 터지는 버블
      toggle: () => { osc({ f: 600, to: 1400, dur: 0.06, vol: 0.05 }); shutter(0.02, 0.04); },
      page: () => { nz({ dur: 0.15, vol: 0.05, f: 1500, to: 6000, q: 1, a: 0.03 }); osc({ f: 900, to: 1800, at: 0.05, dur: 0.08, vol: 0.03 }); },
      error: () => { synthStab([58, 61], 0, 0.035, 0.12); synthStab([57, 60], 0.14, 0.035, 0.18); },
      whoosh: () => { nz({ dur: 0.3, vol: 0.07, f: 600, to: 8000, q: 1.2, a: 0.1 }); },
      pullPress: () => { synthStab([64, 68, 71], 0, 0.05, 0.25); flashPop(0.05, 0.04); },
      skillSelect: () => { osc({ f: 800, to: 1600, dur: 0.05, vol: 0.05 }); },
      turn: () => { synthStab([69, 73, 76], 0, 0.035, 0.15); },
      coin: () => { osc({ f: 1300, to: 2600, dur: 0.06, vol: 0.05 }); osc({ f: 2000, to: 3400, at: 0.06, dur: 0.06, vol: 0.04 }); },
      equip: () => { shutter(0, 0.08); },
      reward: () => { synthStab([64, 68, 71, 76], 0, 0.045, 0.4); flashPop(0.15, 0.04); },
    },
    dark: {
      tick: () => { osc({ f: 300 + Math.random() * 60, to: 240, type: "triangle", dur: 0.035, vol: 0.026, lp: 1200 }); nz({ dur: 0.02, vol: 0.012, type: "lowpass", f: 900 }); },
      toggle: () => { fmBell(62, 0, 0.06, 0.5, 0.6, 2.76, 2); },
      page: () => { nz({ dur: 0.35, vol: 0.05, f: 300, to: 1200, q: 0.6, a: 0.08, rev: 0.5 }); },
      error: () => { fmBell(50, 0, 0.08, 0.8, 0.7, 2.76, 3); fmBell(49, 0.15, 0.07, 1, 0.7, 2.76, 3); },
      whoosh: () => nz({ dur: 0.5, vol: 0.06, f: 150, to: 900, q: 1.5, a: 0.2, rev: 0.7 }),
      pullPress: () => { toll(57, 0, 0.08, 1.8); choir([57, 60, 64], 0.05, 0.9, 0.018); },
      skillSelect: () => fmBell(rnd([69, 72, 74]), 0, 0.05, 0.5, 0.6, 2.76, 1.5),
      turn: () => { heartbeat(0, 0.25); },
      coin: () => { fmBell(81, 0, 0.05, 0.6, 0.6, 2.76, 1.5); },
      equip: () => { nz({ dur: 0.05, vol: 0.06, type: "bandpass", f: 1800, q: 3 }); fmBell(57, 0.02, 0.06, 0.7, 0.6, 2.76, 2.5); },
      reward: () => { choir([60, 63, 67, 72], 0, 1, 0.02); fmBell(84, 0.1, 0.05, 1.2, 0.8, 2.76, 1.5); },
    },
  };
  for (const th in THEME_UI) { SIGNATURE[th] = SIGNATURE[th] || {}; for (const k in THEME_UI[th]) if (!SIGNATURE[th][k] && !(FLAVOR[th] && FLAVOR[th][k])) SIGNATURE[th][k] = THEME_UI[th][k]; }

  function play(name, gap = 60, opts = {}) {
    if (!ctx || !unlocked) return;
    if (!opts.force && (!cfg.sfxOn || !gfVisible())) return;
    if (!opts.force && cfg.groups[GROUP_OF[name]] === false) return;
    if (!cfg.elemHits && /^hit[A-Z]/.test(name)) name = "hit";
    const sc = sCfg(name);
    if (!opts.force && !sc.on) return;
    if (BIG.has(name)) duckBgm(name === "reveal5" || name === "victory" ? 2.2 : 1.3);
    const now = performance.now();
    if (!opts.force && now - (lastPlay.get(name) || 0) < gap) return;
    lastPlay.set(name, now);
    touch();
    // 미리 듣기는 효과음이 꺼져 있어도 들리게
    if (opts.force && (!cfg.sfxOn || cfg.sfxVol < 0.05)) sfxBus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.01), setTimeout(applyVolumes, 2500);
    if (customNames.has("sfx:" + name)) {
      getSfxBuffer(name).then((buf) => {
        if (!buf) return;
        const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = sc.pitch;
        const g = ctx.createGain(); g.gain.value = sc.vol * sc.vol;
        s.connect(g).connect(sfxBus); s.start();
      });
      return;
    }
    const th = activeTheme();
    setSfxFx(th);
    const sig = SIGNATURE[th] && SIGNATURE[th][name];
    const fl = FLAVOR[th];
    const fn = sig || (fl && fl[name]) || SYNTH[name];
    const kit = sig ? null : KIT[th] || KIT.fantasy;
    try { K = kit; P = sc.pitch * (kit ? Math.pow(2, kit.shift / 12) : 1); V = sc.vol; fn && fn(); } catch {} finally { P = 1; V = 1; K = null; OUT = null; }
  }

  /* =========================================================
   * 가챠포지 화면 연결
   * ========================================================= */
  let host = null, root = null, rootMO = null, vnMO = null, vnEl = null;
  const gfVisible = () => {
    if (!host || !host.isConnected || document.hidden) return false;
    const r = host.getBoundingClientRect();
    return r.width > 40 && r.height > 40;
  };
  const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  let lastAff = null, lastAffAt = 0;
  const AFF = { fire: "hitFire", water: "hitWater", wind: "hitWind", earth: "hitEarth", light: "hitLight", dark: "hitDark" };

  function onAnim(e) {
    const n = e.animationName || "", t = e.target;
    if (n === "rvSigilIn") return play("charge", 400);
    if (n === "rvFlash") return play("flash", 300);
    if (n === "rvFlarePop") {
      const card = t.closest && t.closest(".rv-card");
      const r = card ? (card.classList.contains("r5") ? 5 : card.classList.contains("r4") ? 4 : 3) : 3;
      return play("reveal" + r, r === 5 ? 250 : 90);
    }
    if (n === "rvRays") return play("rays", 300);
    if (n === "hitShake") {
      const box = t.closest && t.closest(".cbt") || t.parentElement;
      const crit = box && box.querySelector && box.querySelector(".crit");
      if (crit) return play("crit", 80);
      if (lastAff && performance.now() - lastAffAt < 4000 && AFF[lastAff]) return play(AFF[lastAff], 80);
      return play("hit", 70);
    }
    if (n === "charged") return play("charged", 1200);
    if (n === "shieldPop") return play("shield", 200);
    if (n === "slash") return play("hit", 70);
    if (n === "auraUp") return play("heal", 400);
    if (n === "cbt-hero-in") return play("turn", 500);
    if (n === "gf-grid-in" || /^gf-tr-deal/.test(n)) return play("deal", 600);
    if (/^gf-pop-(from|lift|to)$/.test(n)) return play("popup", 300);
    if (/^gf-tr-(from|in|swap|turn)|^gf-view-swap$|^gf-(farm|modes)-cut$/.test(n)) return play("whoosh", 400);
    if (n === "lab-in" || n === "q-in" || n === "est-in") return play("popup", 400);
  }

  // 버튼 종류별 소리
  const hasA = (b, ...attrs) => attrs.some((a) => b.hasAttribute(a));
  const anyAttr = (b, re) => { for (const a of b.getAttributeNames()) if (re.test(a)) return true; return false; };
  // 가챠포지 버튼 고유 표시(data-*) → 소리. 글자보다 정확해서 먼저 봄
  const BTN_ATTR = [
    [/^data-(pull|seasonal-draw|seasonal-draw-many)$/, "pullPress"],
    [/^data-act$/, "skillSelect"],
    [/^data-(start|into-battle|tower-fight|foe-go|seasonal-fight|tower-enter)$/, "sortie"],
    [/^data-(wlevel|ascend|inv-upgrade|gear-upgrade|form-up|feed-go|inv-feed-go)$/, "levelUp"],
    [/^data-(of-wear|inv-equip-on)$/, "equip"],
    [/^data-(shop-buy|tower-unit-buy)$/, "coin"],
    [/^data-(ach-claim|ach-claim-all|events-claim|newworld-claim|pass-claim|seasonal-milestone|relic-ok|bingo-won-ok)$/, "reward"],
    [/^data-vigor-use$/, "potion"],
    [/^data-unlock-ok$/, "unlock"],
    [/^data-(del-yes|preset-delete|gear-remove)$/, "delete"],
    [/^data-(vn-resume|vn-restart|next|continue|rv-continue|result-continue|skip|rv-skip|chat-send)$/, "page"],
    [/^data-(auto|speed|fav|gear-lock|inv-lock|compress|expand|text-scale|keep)$/, "toggle"],
    [/^data-(tab|cat|rar|rarity|inv-filter|inv-section|pass-tab|shop-cat|ach-cat|pk-mode|pk-page|history-page|tower-element|role|view|mode)$/, "tab"],
    [/^data-(back|cancel|aim-x)|-(back|close|cancel|no|x|later|keep)$/, "back"],
    [/-(ok|yes|go|now)$|^data-(save|saveas|go|goto|generate|new|forge|take|set-party|story-write|upload|retry|pre-retry|replay|result-again|tower-retry|preset-load|preset-save|use|inv-use|board-roll|bond-make)$/, "confirm"],
  ];
  // 표시가 없는 버튼만 글자로 판단. '얻기·재료·이동' 같은 말이 있으면 실제 행동이 아니라 안내라서 기본 소리
  const NAV_WORDS = /얻|획득|파밍|재료|보러|가기|이동|던전|입장|확인하|보기|목록|정보|farm|get |where|go to|open|view|info|list/i;
  function buttonSound(b) {
    if (b.disabled || b.getAttribute("aria-disabled") === "true" || b.classList.contains("locked")) return "error";
    if (b.classList.contains("pull")) return "pullPress";
    const names = b.getAttributeNames().filter((n) => n.startsWith("data-") && n !== "data-gfs");
    for (const n of names) for (const [re, snd] of BTN_ATTR) if (re.test(n)) {
      if (snd === "skillSelect") { const m = /--aff:\s*var\(--([a-z]+)\)/.exec(b.getAttribute("style") || ""); lastAff = m ? m[1] : null; lastAffAt = performance.now(); }
      return snd;
    }
    if (b.classList.contains("cbt-act")) return "skillSelect";
    if (b.classList.contains("chip") || b.getAttribute("role") === "tab") return "tab";
    if (b.getAttribute("role") === "switch" || b.hasAttribute("aria-pressed")) return "toggle";
    if (names.length) return "click"; // 표시는 있는데 모르는 버튼: 기본 소리(엉뚱한 소리보다 낫게)
    const label = ((b.getAttribute("aria-label") || "") + " " + (b.textContent || "")).trim().toLowerCase().slice(0, 60);
    if (/^(◀|←)|뒤로|닫기|취소|^back|close|cancel/.test(label)) return "back";
    if (NAV_WORDS.test(label)) return "click";
    if (/^(구매|구입)|buy$|purchase/.test(label)) return "coin";
    if (/^(강화|레벨 ?업|승급)|level ?up$|upgrade$|enhance$/.test(label)) return "levelUp";
    if (/^장착|equip$/.test(label)) return "equip";
    if (/^삭제|delete$|remove$/.test(label)) return "delete";
    if (/^(확인|수령|받기|시작)|^ok$|confirm$|claim$/.test(label)) return "confirm";
    return "click";
  }
  function onClick(e) {
    const path = e.composedPath ? e.composedPath() : [];
    const b = path.find((n) => n && n.getAttribute && (n.tagName === "BUTTON" || n.getAttribute("role") === "button"));
    if (b) return play(buttonSound(b), 45);
    if (path.some((n) => n && n.classList && (n.classList.contains("vn-stage") || n.classList.contains("vn-text")))) play("page", 120);
  }

  // 클래스가 새로 붙는 순간 (쓰러짐, 분노, 방어 깨짐 등)
  const CLASS_SOUNDS = { dead: ["ko", 200], enraged: ["enrage", 1500], broken: ["shieldBreak", 200], turned: ["flip", 60], "drop-ok": ["drop", 150], acting: ["turn", 500], "is-actor": ["turn", 500], confirming: ["popup", 300] };
  /* ---------- 재화 변화 (상단바 에테르·자금·활력) ---------- */
  const CUR = { aether: "[data-bar-aether]", funds: "[data-bar-funds]", vigor: "[data-bar-vigor]" };
  const CUR_SEL = Object.values(CUR).join(",");
  const curLast = {};
  const parseNum = (s) => {
    const t = String(s || "").replace(/,/g, "").trim().toLowerCase();
    const m = /^([\d.]+)\s*([km])?/.exec(t); if (!m) return null;
    return parseFloat(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1);
  };
  function readCurrencies(silent) {
    if (!root) return;
    for (const k in CUR) {
      const el = root.querySelector(CUR[k]); if (!el) continue;
      const v = parseNum(el.textContent); if (v == null) continue;
      const prev = curLast[k];
      curLast[k] = v;
      if (silent || prev == null || v === prev) continue;
      if (v > prev) play(k === "vigor" ? "vigorGain" : k, 350);
      else if (k !== "vigor") play("spend", 300);
    }
  }

  /* ---------- 보상 아이템 그림이 새로 뜰 때 종류별 획득음 ---------- */
  // 실제로 받는 순간만: 결과 화면, 수령·전리품 표시 (상점·도감·안내 패널은 제외)
  const REWARD_CTX = /\b(rs-[a-z-]+|result|loot|claimed|gained|got)\b/i;
  function itemKind(src) {
    const f = (src.split("/").pop() || "").replace(/\?.*$/, "");
    if (/item-aether/.test(f)) return "aether";
    if (/item-glimmer/.test(f)) return "glimmer";
    if (/item-(funds|coin)/.test(f)) return "funds";
    if (/item-vigor/.test(f)) return "potion";
    if (/item-relic/.test(f)) return "relic";
    if (/item-(sigil|tenet|doctrine|mandate)/.test(f)) return "rune";
    if (/item-insight/.test(f)) return "insight";
    if (/item-(rank|unit)/.test(f)) return "reward";
    return "drop";
  }
  function inRewardContext(el) {
    for (let n = el, i = 0; n && i < 8; n = n.parentElement, i++) {
      const c = (n.className && n.className.baseVal === undefined ? n.className : "") + " " + (n.getAttribute && (n.getAttribute("data-screen") || "") || "");
      if (REWARD_CTX.test(c)) return true;
    }
    return false;
  }
  let rewardQueue = [], rewardTimer = 0;
  function queueReward(kind) {
    if (rewardQueue.length < cfg.rewardChain && !rewardQueue.includes(kind)) rewardQueue.push(kind);
    if (rewardTimer) return;
    rewardTimer = setTimeout(function next() {
      const k = rewardQueue.shift();
      if (k) { play(k, 0); rewardTimer = setTimeout(next, 170); } else rewardTimer = 0;
    }, 120);
  }

  function onMutations(list) {
    let structural = false, curChanged = false;
    for (const m of list) {
      if (m.type === "attributes") {
        const cl = m.target.classList; if (!cl) continue;
        const old = " " + (m.oldValue || "") + " ";
        for (const c in CLASS_SOUNDS) if (cl.contains(c) && old.indexOf(" " + c + " ") < 0) play(CLASS_SOUNDS[c][0], CLASS_SOUNDS[c][1]);
        continue;
      }
      const tg = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (tg && tg.matches && tg.matches(CUR_SEL)) { curChanged = true; continue; }
      if (!m.addedNodes.length) continue;
      structural = true;
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1 || !n.matches) continue;
        // (.gx-up '착용하면 +CP' 미리보기, .ul-reward '해금 보상' 안내는 실제 획득이 아니라서 소리 안 냄)
        const arts = n.matches("img.item-art") ? [n] : n.querySelectorAll ? n.querySelectorAll("img.item-art") : [];
        if (arts.length && arts.length <= 12) for (const img of arts) if (inRewardContext(img)) queueReward(itemKind(img.getAttribute("src") || ""));
        if (n.querySelector && n.querySelector(CUR_SEL)) curChanged = true;
      }
    }
    if (curChanged) readCurrencies(false);
    if (structural) {
      // 아이콘은 화면이 그려지기 전에(같은 프레임) 바로 다시 붙임 → 새로고침·화면 전환 때 깜빡이지 않음
      if (root) ensureGameButtons();
      if (lifted && launcher.parentNode !== lifted) liftLauncher(); // 게임이 화면을 다시 그려 플로팅 버튼이 빠졌으면 다시 넣음
      scheduleStructural();
    }
  }

  let structTimer = 0;
  function scheduleStructural() {
    if (structTimer) return;
    structTimer = setTimeout(() => { structTimer = 0; try { onStructural(); } catch {} }, 220);
  }
  let resultSeen = null;
  /* ---------- 가챠포지 상단바·전투 조작줄에 소리 아이콘 넣기 ---------- */
  const ICONS = {
    speaker: '<path d="M11 5 6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path class="gfs-waves" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    note: '<path d="M9 18V5l11-2v13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/><circle class="gfs-waves" cx="17" cy="16" r="3" stroke="currentColor" stroke-width="2"/>',
    wave: '<path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4M21 12h0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="gfs-waves" d="M11 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    gear: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path class="gfs-waves" d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const iconSvg = () => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${ICONS[cfg.iconStyle] || ICONS.speaker}</svg>`;
  // 우리 버튼에만 적용되는 스타일 (가챠포지·다른 확장 버튼엔 영향 없음)
  const gameSheet = ("adoptedStyleSheets" in Document.prototype && "replaceSync" in CSSStyleSheet.prototype) ? new CSSStyleSheet() : null;
  if (gameSheet) gameSheet.replaceSync(`button[data-gfs]:not(.icon-button):not(.vn-tool){display:inline-flex;align-items:center;justify-content:center;padding:calc(var(--f,16px)*0.35) calc(var(--f,16px)*0.55)}
    button[data-gfs].vn-tool svg{display:block;width:1.25em;height:1.25em}
    button[data-gfs]:not(.icon-button):not(.vn-tool) svg{display:block;width:calc(var(--f,16px)*1.3);height:calc(var(--f,16px)*1.3)}
    button[data-gfs].gfs-muted .gfs-waves{opacity:.25}`);
  let iconSig = "";
  function makeGameButton(kind, native) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = (native ? "icon-button " : kind === "story" ? "vn-tool " : "") + "gf-sound-btn";
    b.dataset.gfs = kind;                      // 다른 버튼과 구분하는 고유 표시
    b.setAttribute("aria-label", "소리 설정");
    b.title = "소리 설정" + (cfg.hotkey !== "off" ? ` (${cfg.hotkey.toUpperCase()})` : "");
    b.innerHTML = iconSvg();
    // 우리 클릭이 가챠포지나 다른 확장의 클릭 처리로 번지지 않게 막음
    const stop = (e) => { e.stopPropagation(); };
    b.addEventListener("pointerdown", stop);
    b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); unlock(); popOpen ? closePopup() : openPopup(); });
    return b;
  }
  function placeIn(container, kind, native, ref, atEnd) {
    // 이미 들어가 있으면 그대로 둠 → 다른 확장이 같은 줄에 버튼을 넣어도 서로 자리싸움(무한 재배치)을 하지 않음
    if (container.querySelector(`:scope > button[data-gfs="${kind}"]`)) return;
    const b = makeGameButton(kind, native);
    if (atEnd || !ref || ref.parentNode !== container) container.appendChild(b);
    else container.insertBefore(b, ref);
  }
  function ensureGameButtons(force) {
    if (!root) return;
    const sig = [cfg.openMode, cfg.iconTopbar, cfg.iconBattle, cfg.iconStory, cfg.iconStyle, cfg.hotkey].join("|");
    if (force || sig !== iconSig) { root.querySelectorAll("button[data-gfs]").forEach((b) => b.remove()); iconSig = sig; }
    if (cfg.openMode === "floating") return;
    if (gameSheet && !root.adoptedStyleSheets.includes(gameSheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, gameSheet];
    for (const fsb of root.querySelectorAll(".gf-fs-bar")) {
      const box = fsb.parentElement; if (!box) continue;
      const native = fsb.classList.contains("icon-button");
      if (native) { // 상단바
        const settingsBtn = [...box.children].find((c) => c.getAttribute && /settings/i.test(c.getAttribute("aria-label") || ""));
        if (cfg.iconTopbar === "end") placeIn(box, "top", true, null, true);
        else placeIn(box, "top", true, cfg.iconTopbar === "beforeSettings" && settingsBtn ? settingsBtn : fsb, false);
      } else if (cfg.iconBattle) { // 전투 조작줄
        placeIn(box, "battle", false, fsb, false);
      }
    }
    // 스토리 화면은 상단바가 없어서 Auto·Skip·Log 줄 끝에 같은 모양(vn-tool)으로 넣음
    if (cfg.iconStory) for (const tools of root.querySelectorAll(".vn-tools")) placeIn(tools, "story", false, null, true);
    const muted = !cfg.sfxOn && !cfg.bgmOn;
    root.querySelectorAll("button[data-gfs]").forEach((b) => b.classList.toggle("gfs-muted", muted));
  }

  function onStructural() {
    ensureGameButtons();
    watchVn();
    const res = root && root.querySelector('[data-screen="result"] .rs-verdict h2');
    if (res && res !== resultSeen) {
      resultSeen = res;
      const win = /victory|승리/i.test(res.textContent || "");
      setTimeout(() => play(win ? "victory" : "defeat", 1500), 120);
      if (win) setTimeout(() => { if (root && root.querySelector('[data-screen="result"] [class*="reward"], [data-screen="result"] [class*="loot"]')) play("reward", 1500); }, 1400);
    } else if (!res) resultSeen = null;
    syncBgm();
  }

  function watchVn() {
    const el = root && root.querySelector(".vn-text");
    if (el === vnEl) return;
    vnMO && vnMO.disconnect(); vnMO = null; vnEl = el;
    if (!el) return;
    let lastLen = (el.textContent || "").length, doneTimer = 0;
    vnMO = new MutationObserver(() => {
      const len = (el.textContent || "").length;
      if (len > lastLen) play("tick", cfg.typingGap);
      lastLen = len;
      clearTimeout(doneTimer);
      doneTimer = setTimeout(() => analyzeLine(el), 700); // 한 줄이 다 찍힌 뒤 분위기 분석
    });
    vnMO.observe(el, { childList: true, characterData: true, subtree: true });
    analyzeLine(el);
  }

  // 최적화: 가챠포지가 안 보이면 화면 감시를 멈추고, 다시 보이면 이어서 감시
  let observing = false;
  const MO_OPTS = { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true };
  function observeRoot() { if (rootMO && root && !observing) { rootMO.observe(root, MO_OPTS); observing = true; } }
  function pauseWatch() {
    if (!observing) return;
    rootMO && rootMO.disconnect(); observing = false;
    vnMO && vnMO.disconnect(); vnMO = null; vnEl = null;
  }
  function resumeWatch() {
    if (observing || !root) return;
    observeRoot(); readCurrencies(true); onStructural();
  }
  function attach(h) {
    detach();
    host = h; root = h.shadowRoot;
    if (!root) { host = null; return; } // 섀도 루트가 아직이면 다음 변화 때 다시
    root.addEventListener("animationstart", onAnim, true);
    root.addEventListener("click", onClick, true);
    rootMO = new MutationObserver(onMutations);
    observeRoot();
    readCurrencies(true);
    onStructural();
    ensureGameButtons();
  }
  function detach() {
    if (root) { root.removeEventListener("animationstart", onAnim, true); root.removeEventListener("click", onClick, true); }
    rootMO && rootMO.disconnect(); rootMO = null; observing = false;
    vnMO && vnMO.disconnect(); vnMO = null; vnEl = null;
    host = null; root = null;
  }
  // 가벼운 탐색: 일반 DOM은 live 컬렉션으로 바로, 못 찾을 때만 섀도 DOM까지 (10초에 한 번)
  const liveHosts = document.getElementsByTagName(HOST_TAG.toLowerCase());
  let lastDeepScan = 0;
  function findHost() {
    if (liveHosts.length) return liveHosts[0];
    const now = performance.now();
    if (now - lastDeepScan < 10000) return null;
    lastDeepScan = now;
    const walk = (node) => {
      for (const el of node.querySelectorAll("*")) {
        if (el.tagName === HOST_TAG) return el;
        if (el.shadowRoot) { const f = walk(el.shadowRoot); if (f) return f; }
      }
      return null;
    };
    try { return walk(document); } catch { return null; }
  }

  /* =========================================================
   * 스토리 분위기 감지 + 장르(테마) 자동 감지
   * ========================================================= */
  const LEX = {
    tense: ["긴장", "위험", "칼날", "칼을", "검을", "비명", "습격", "적이", "적들", "쫓", "도망", "위협", "싸움", "공격", "폭발", "함정", "살기", "경계", "괴물", "마물", "포효", "다급", "서둘러", "막아", "피해", "숨을 죽", "승급 시험", "대련", "결계", "danger", "attack", "enemy", "threat", "fight", "monster"],
    sad: ["눈물", "울었", "울고", "울음", "흐느", "슬픔", "슬프", "이별", "상실", "장례", "무덤", "그리움", "그리워", "외로", "아프", "후회", "미안해", "떠나", "잃었", "잃은", "죽음", "쓸쓸", "공허", "tears", "cried", "grief", "loss", "lonely", "farewell"],
    romance: ["설레", "두근", "심장이", "붉어", "붉게", "볼을", "귓가", "귀가 빨", "달아올", "손을 잡", "손끝", "손등", "이마에", "입맞", "키스", "포옹", "안아", "품에", "다정", "사랑", "좋아해", "데이트", "속눈썹", "숨결", "가까이", "시선을 피", "낮게 웃", "blush", "kiss", "embrace", "heartbeat", "love"],
    mystery: ["비밀", "수수께끼", "신비", "고대", "유적", "봉인", "의식", "속삭", "안개", "기묘", "낯선", "룬", "문양", "시길", "예언", "환영", "장막", "차원", "천문탑", "동쪽 날개", "점술", "secret", "ancient", "ritual", "mist", "strange", "rune", "prophecy"],
    happy: ["웃음", "웃었", "웃으", "미소", "축제", "기쁨", "기뻐", "신나", "즐거", "맛있", "환호", "박수", "축하", "반짝", "햇살", "산뜻", "명랑", "laugh", "festival", "joy", "cheer", "celebrat"],
    comedy: ["허둥", "당황", "버럭", "엉뚱", "투덜", "얼빠", "헛기침", "화들짝", "데굴", "뻘쭘", "푸핫", "풉", "하하하", "ㅋㅋ", "와하하", "어이없", "황당", "삐죽", "꽥", "바보", "멍청", "꼬르륵", "넘어졌", "awkward", "oops"],
    dark: ["집착", "광기", "가둬", "가두", "놓아주지", "놓지 않", "영원히", "내 거", "내 것", "소유", "사슬", "목줄", "감금", "죽여", "질투", "소름", "서늘", "웃음기가 사라", "빛이 없", "눈이 어둡", "피가", "피를", "핏", "저주", "희생", "금기", "어둠 마법", "호문쿨루스", "강제", "결속", "obsess", "mine", "forever", "cage", "curse"],
    glitch: ["오류", "에러", "error", "버그", "bug", "지지직", "치직", "지직", "깜빡", "뒤틀", "일그러", "노이즈", "잡음", "시스템", "재부팅", "로딩", "null", "undefined", "▒", "█", "▓"],
  };
  const GENRE = {
    otome: ["공략", "호감도", "오토메", "마법사", "아카데미", "아르카눔", "사역마", "요정", "무도회", "영애", "황태자", "공작", "마기스터", "어뎁트", "이니시에이트", "사랑의 요정", "편지가 도착"],
    hunter: ["헌터", "게이트", "던전", "각성", "길드", "마석", "s급", "a급", "레이드", "몬스터", "상태창", "협회", "균열", "브레이크", "랭커", "스탯"],
    daily: ["카페", "학교", "교실", "수업", "회사", "출근", "퇴근", "점심", "편의점", "산책", "방과후", "동아리", "알바", "아르바이트", "주말", "자취", "라면", "버스", "지하철"],
    fantasy: ["기사", "왕국", "드래곤", "용이", "모험", "엘프", "드워프", "마왕", "성검", "여관", "길드 의뢰", "영지", "성기사"],
    idol: ["아이돌", "데뷔", "연습생", "소속사", "기획사", "무대", "컴백", "팬미팅", "팬들", "콘서트", "음방", "음악방송", "센터", "직캠", "매니저", "스케줄", "리허설", "안무", "녹음실", "앨범", "뮤비", "화보", "배우", "드라마 촬영", "오디션", "시상식", "레드카펫", "기자", "스캔들", "열애설", "엔터", "연예", "카메라", "생방송"],
    oriental: ["무협", "강호", "무림", "검객", "협객", "대협", "문파", "사형", "사부", "사매", "내공", "무공", "경공", "단전", "선협", "수련", "신선", "선계", "도사", "요괴", "황제", "황궁", "폐하", "전하", "공주", "세자", "대감", "궁녀", "한복", "조선", "사극", "객잔", "주막", "낭자", "소저", "공자", "마교", "정파", "사파", "비단", "부채", "가마", "기와"],
    dark: ["좀비", "괴담", "살인", "시체", "폐가", "귀신", "악령", "실종", "피투성이", "공포", "의식의 제물"],
  };
  const MOOD_KEYS = Object.keys(LEX);
  const scores = Object.fromEntries(MOOD_KEYS.map((k) => [k, 0]));
  let storyMood = "calm", lastLine = "", lastMoodSwitch = 0, pendingMood = null, pendingCount = 0, lastStoryAt = 0;
  const genreScore = Object.fromEntries(Object.keys(GENRE).map((k) => [k, 0]));
  let guessedTheme = "fantasy", lastGenreScan = 0;

  const hits = (text, words) => { let n = 0; for (const w of words) if (w && text.includes(w)) n++; return n; };
  const wordCache = new Map();
  const userWords = (str) => {
    if (!str) return [];
    if (!wordCache.has(str)) wordCache.set(str, str.split(/[,\n]/).map((w) => w.trim().toLowerCase()).filter(Boolean));
    return wordCache.get(str);
  };
  let lastAnalysis = { line: "", at: 0 };
  const ZALGO = /[̀-ͯ҉]{2,}/;

  // 장르 단어를 읽을 화면: 스토리는 대사창만, 전투는 전장만, 홈은 화면 전체. 그 밖의 탭은 읽지 않음(null)
  const OTHER_TABS = /^(settings|roster|unit|portrait|portrait-crop|modes|materials|inventory|gear.*|events|tower.*|achievements|shop|result)$/;
  function genreText() {
    const vn = root.querySelector(".vn-text");
    if (vis(vn)) { const box = root.querySelector("[data-vn]"); return (box || vn).textContent || ""; }
    if (anyVis(BATTLE_SEL)) { const a = root.querySelector(".arena"); return a ? a.textContent || "" : ""; }
    for (const el of root.querySelectorAll("[data-screen]")) if (OTHER_TABS.test(el.getAttribute("data-screen") || "") && vis(el)) return null;
    return root.textContent || "";
  }
  function detectGenre(force) {
    if (!root) return;
    const now = performance.now();
    if (!force && now - lastGenreScan < 20000) return;
    const src = genreText(); if (src == null) return; // 홈·스토리·전투가 아닌 탭(상점·가방·장비 등)에선 단어를 읽지 않음
    lastGenreScan = now;
    const text = src.slice(0, 20000).toLowerCase();
    for (const g in GENRE) genreScore[g] = genreScore[g] * 0.7 + hits(text, GENRE[g]) + hits(text, userWords(cfg.genreKeywords[g])) * 2;
    let best = null, bs = 2.5;
    for (const g in genreScore) if (genreScore[g] > bs) { best = g; bs = genreScore[g]; }
    if (best && best !== guessedTheme) { guessedTheme = best; if (cfg.theme === "auto") { MUSIC().invalidate(); syncBgm(); updateNowLabel(); try { applyThemeColors(); } catch {} } }
  }
  const activeTheme = () => (cfg.theme === "auto" ? guessedTheme : cfg.theme);

  function analyzeLine(el) {
    if (!el) return;
    const raw = el.textContent || "";
    const text = raw.toLowerCase();
    if (!text || text === lastLine) return;
    lastLine = text;
    // 대사 속 연출 신호 (시스템 알림, 호감도, 편지, 글리치)
    const trimmed = raw.trim();
    if (/편지가 도착|연락이 왔|통신 수정이|쪽지가|a letter/i.test(raw)) play("letter", 1500);
    else if (/^[\[【]/.test(trimmed) || /(좋아합니다|싫어합니다)\s*[\]】]/.test(raw)) play(/좋아합니다|호감|likes this/i.test(raw) ? "affection" : "notice", 800);
    const glitchy = ZALGO.test(raw) || /[▒█▓]{2,}|(.)\1{5,}/.test(raw) || /\b(error|null)\b|오류|지지직|치직/.test(text);
    if (glitchy) play("glitch", 1200);

    if (performance.now() - lastStoryAt > 60000) for (const k in scores) scores[k] = 0;
    lastStoryAt = performance.now();
    // 글리치는 순간 연출이라 금방 사라지고, 다른 분위기는 몇 줄에 걸쳐 쌓임
    for (const k of MOOD_KEYS) {
      const words = userWords(cfg.keywords[k]);
      scores[k] = scores[k] * (k === "glitch" ? 0.15 : 0.55) + Math.min(3, hits(text, LEX[k]) + hits(text, words) * 1.5);
      if (cfg.moodEnabled[k] === false) scores[k] = 0;
    }
    if (glitchy && cfg.moodEnabled.glitch !== false) scores.glitch += 2;
    lastAnalysis = { line: raw.trim().slice(0, 80), at: Date.now() };
    // 같은 줄에 설렘과 집착이 섞이면 어두운 쪽이 이김 (얀데레 장면)
    if (scores.dark > 0 && scores.romance > 0) scores.dark += 0.5;
    const sens = cfg.sensitivity || 1;
    let best = "calm", bestScore = 0.9 / sens;
    for (const k of MOOD_KEYS) if (scores[k] > bestScore) { best = k; bestScore = scores[k]; }
    detectGenre(false);
    if (best === storyMood) { pendingMood = null; pendingCount = 0; return; }
    if (best === pendingMood) pendingCount++; else { pendingMood = best; pendingCount = 1; }
    const strong = bestScore >= 2.2 / sens || best === "glitch";
    const hold = best === "glitch" ? 2500 : (strong ? 0.5 : 1) * cfg.minHold * 1000;
    if ((pendingCount >= 2 || strong) && performance.now() - lastMoodSwitch > hold) {
      storyMood = best; lastMoodSwitch = performance.now(); pendingMood = null; pendingCount = 0;
      syncBgm();
      // 글리치는 잠깐만: 다음 평범한 줄에서 빨리 원래대로
      if (best === "glitch") lastMoodSwitch -= 9000;
    }
  }

  // 여러 후보 중 하나라도 보이면 true (querySelector는 첫 번째만 봐서, 그게 숨겨져 있으면 놓침)
  const anyVis = (sel) => { for (const el of root.querySelectorAll(sel)) if (vis(el)) return true; return false; };
  // 전투 단서: 스킬 줄, 턴 순서·라운드, 적 지정(aim) 화면, Auto·배속 조작줄, 프리셋
  // (스토리 화면의 '자동 넘김' 버튼도 data-auto를 써서 그건 단서에서 뺌)
  const BATTLE_SEL = ".arena, [data-side-enemies], .cbt.enemy, .cbt-acts, .cbt-queue, [data-queue], [data-turn], .cbt-aim, .cbt-turn, .cbt-turn-slot, .cbt-presets, [data-speed]";
  function currentSituation() {
    if (!gfVisible() || !root) return cfg.bgmOutside && !document.hidden ? "lobby" : null;
    if (vis(root.querySelector(".reveal"))) return "summon";
    if (anyVis(BATTLE_SEL)) return "battle";
    if (vis(root.querySelector(".vn-text"))) return "story_" + (cfg.storyMoodMode === "auto" ? storyMood : cfg.storyMoodMode);
    return "lobby";
  }

  /* =========================================================
   * 배경음: 자동 생성 (상황별 프리셋)
   * ========================================================= */
  /* =========================================================
   * 음악 엔진 선택: v1(예전·가벼움) / v2(새 엔진)
   *  고른 엔진만 만들어서 돌림. 안 쓰는 엔진은 실행되지 않음
   * ========================================================= */
  function createEngineV1() {
    // 분위기별 기본 악곡 (코드 진행·빠르기·음 밀도)
    const BASE = {
      lobby:   { bpm: 84,  chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], pat: [0, 2, 1, 3, 2, 1, 3, 2], dens: 0.7, oct: 12, energy: 1 },
      summon:  { bpm: 90,  chords: [[62, 66, 69, 73], [64, 68, 71, 74], [62, 66, 69, 73], [64, 68, 71, 76]], pat: [0, 1, 2, 3, 2, 3, 1, 2], dens: 1, oct: 24, energy: 1 },
      battle:  { bpm: 132, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], pat: [0, 1, 2, 1, 0, 2, 1, 2], dens: 1, oct: 12, energy: 3 },
      calm:    { bpm: 68,  chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], pat: [0, 2, 3, 1], dens: 0.45, oct: 12, energy: 0 },
      happy:   { bpm: 112, chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], pat: [0, 2, 1, 2, 0, 2, 1, 2], dens: 0.85, oct: 12, energy: 2 },
      comedy:  { bpm: 128, chords: [[60, 64, 67], [62, 65, 69], [64, 67, 71], [55, 59, 62]], pat: [0, 2, 0, 1, 2, 2, 1, 0], dens: 0.75, oct: 12, energy: 2, staccato: true },
      romance: { bpm: 72,  chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 67]], pat: [0, 2, 3, 2, 1, 3], dens: 0.55, oct: 12, energy: 0 },
      sad:     { bpm: 60,  chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], pat: [0, 1, 2, 1], dens: 0.35, oct: 12, energy: 0 },
      tense:   { bpm: 110, chords: [[45, 48, 52], [46, 50, 53], [45, 48, 52], [44, 47, 52]], pat: [0, 0, 1, 0, 0, 2, 0, 1], dens: 1, oct: 12, energy: 2 },
      mystery: { bpm: 64,  chords: [[50, 53, 57, 64], [46, 50, 53, 57], [43, 46, 50, 52], [45, 49, 52, 55]], pat: [0, 3, 1, 2, 3, 0], dens: 0.5, oct: 24, energy: 0 },
      dark:    { bpm: 66,  chords: [[50, 53, 57], [49, 53, 56], [50, 53, 57], [46, 50, 53]], pat: [0, 2, 1, 2], dens: 0.4, oct: 24, energy: 1, minorBell: true },
      glitch:  { bpm: 96,  chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], pat: [0, 2, 1, 3, 2, 1, 3, 2], dens: 0.8, oct: 12, energy: 1, glitch: true },
    };
    // 장르별 악기·드럼 스타일
    const STYLE = {
      otome:   { tempo: 0.95, pad: "sine", cut: 1100, arp: { def: "musicbox", tense: "pluck", battle: "pluck", dark: "musicbox", comedy: "pluck" }, drums: { battle: "orch", tense: "pulse", happy: "bounce", comedy: "bounce", lobby: "soft" } },
      hunter:  { tempo: 1.08, pad: "sawtooth", cut: 1500, arp: { def: "square", calm: "epiano", romance: "epiano", sad: "epiano", mystery: "bell" }, drums: { battle: "battle", tense: "battle", lobby: "pulse", happy: "battle", comedy: "bounce", summon: "pulse", dark: "pulse" } },
      daily:   { tempo: 0.92, pad: "triangle", cut: 700, arp: { def: "epiano", comedy: "pluck", tense: "square", battle: "square" }, drums: { def: "lofi", sad: "none", mystery: "none", dark: "none", tense: "pulse", battle: "battle" } },
      fantasy: { tempo: 1, pad: "triangle", cut: 900, arp: { def: "pluck", mystery: "bell", summon: "bell", battle: "square", romance: "bell" }, drums: { battle: "orch", tense: "pulse", happy: "bounce", comedy: "bounce", lobby: "soft" } },
      dark:    { tempo: 0.9, pad: "sawtooth", cut: 600, arp: { def: "bell", battle: "square", tense: "square" }, drums: { battle: "battle", tense: "pulse", def: "none" } },
      oriental:{ tempo: 0.94, pad: "sine", cut: 750, arp: { def: "zither", mystery: "bell", summon: "bell" }, drums: { battle: "taiko", tense: "taiko", happy: "janggu", comedy: "janggu", lobby: "janggu", def: "none" } },
    };
    // 테마별 화성: 같은 곡이라도 테마마다 코드 색이 달라짐
    const minorize = (c) => c.map((m, i) => (i === 1 && c[1] - c[0] === 4 ? m - 1 : m));
    const CHORD_XFORM = {
      fantasy: (c) => c,
      otome: (c) => (c.length < 4 ? [...c, c[0] + 9] : c), // 6도를 더해 달콤하게
      daily: (c) => [...new Set([...c, c[0] + (c[1] - c[0] === 4 ? 11 : 10), c[0] + 14])].sort((a, b) => a - b).slice(0, 5), // 재즈풍 7·9화음
      hunter: (c) => minorize(c).map((m) => m - 2),
      dark: (c) => minorize(c).map((m) => m - 3),
      oriental: (c) => { // 5음계(궁·상·각·치·우)로 맞춤 → 반음 없는 동양풍 화음
        const P5 = [0, 2, 4, 7, 9];
        const snap = (m) => { const pc = ((m % 12) + 12) % 12; let best = P5[0], bd = 99; for (const p of P5) { const d = Math.min(Math.abs(p - pc), 12 - Math.abs(p - pc)); if (d < bd) { bd = d; best = p; } } let n = m - pc + best; if (best - pc > 6) n -= 12; if (pc - best > 6) n += 12; return n; };
        const out = [...new Set(c.map(snap))].sort((a, b) => a - b);
        if (out.length < 3) out.push(snap(out[0] + 7), snap(out[0] + 12));
        return [...new Set(out)].sort((a, b) => a - b).slice(0, 4);
      },
    };
    // 테마별 리드 멜로디 악기
    const LEAD = {
      otome: { inst: "flute", dens: 0.5, oct: 12 },
      hunter: { inst: "lead", dens: 0.55, oct: 12 },
      daily: { inst: "epiano", dens: 0.4, oct: 12 },
      fantasy: { inst: "horn", dens: 0.45, oct: 0 },
      dark: { inst: "bell", dens: 0.25, oct: 12 },
      oriental: { inst: "bamboo", dens: 0.5, oct: 12 },
    };
    function buildPreset(sit) {
      const mood = sit.startsWith("story_") ? sit.slice(6) : sit;
      const b = BASE[mood] || BASE.lobby;
      const st = STYLE[activeTheme()] || STYLE.fantasy;
      const drums = (st.drums[mood] !== undefined ? st.drums[mood] : st.drums.def) || (b.energy >= 3 ? "battle" : "none");
      let pad = st.pad, cut = st.cut;
      if (mood === "dark" || mood === "mystery") { cut = Math.min(cut, 700); }
      if (mood === "sad" || mood === "romance") pad = "sine";
      const p = { ...b, bpm: b.bpm * st.tempo * cfg.tempo, pad, cut, arp: st.arp[mood] || st.arp.def, drums };
      // 사용자가 고른 악기·드럼·밀도가 있으면 그걸로 덮어씀
      if (cfg.melody !== "auto") p.arp = cfg.melody;
      if (cfg.padInst !== "auto") p.pad = cfg.padInst;
      if (cfg.drums !== "auto") p.drums = cfg.drums;
      p.dens = Math.min(1, b.dens * cfg.density * (cfg.lowPower ? 0.6 : 1));
      const th = activeTheme();
      p.theme = th;
      p.chords = b.chords.map(CHORD_XFORM[th] || CHORD_XFORM.fantasy);
      const ld = LEAD[th] || LEAD.fantasy;
      p.lead = cfg.lowPower || mood === "glitch" ? null : { ...ld, dens: Math.min(0.9, ld.dens * (b.energy >= 2 ? 1.25 : b.energy === 0 ? 0.65 : 1) * cfg.density) };
      if (cfg.leadInst === "none") p.lead = null;
      else if (cfg.leadInst !== "auto" && p.lead) p.lead.inst = cfg.leadInst;
      p.mood = mood;
      return p;
    }
    let seqTimer = 0, nextTime = 0, step = 0, preset = null, presetKey = null, padNodes = [];
    let introLeft = 0; // 곡이 시작·전환된 직후 몇 칸은 드럼 없이 → 처음부터 '둥!' 하고 터지지 않게

    function stopPad(at, fade = 0.8) {
      for (const p of padNodes) { try { p.g.gain.cancelScheduledValues(at); p.g.gain.setTargetAtTime(0.0001, at, fade); p.o.stop(at + fade * 5); } catch {} }
      padNodes = [];
    }
    function startPad(ch, at, beat) {
      if (preset.pad === "none") { stopPad(at); return; } // 배경 화음 없음
      stopPad(at);
      for (const m of ch) for (const det of cfg.lowPower ? [0] : [-7, 7]) {
        const o = ctx.createOscillator(); o.type = preset.pad; o.frequency.value = mtof(m - 12); o.detune.value = det + (preset.glitch ? (Math.random() - 0.5) * 60 : 0);
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = preset.cut;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(preset.pad === "sawtooth" ? 0.015 : 0.026, at + beat * 1.5);
        o.connect(f).connect(g).connect(bgmBus);
        const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s).connect(reverbIn);
        o.start(at); padNodes.push({ o, g });
      }
    }
    function fmNote(freq, at, len, vol, ratio, index, rev) {
      const g = ctx.createGain(); env(g, at, 0.004, vol, len);
      g.connect(bgmBus); const r = ctx.createGain(); r.gain.value = rev; g.connect(r).connect(reverbIn);
      const car = ctx.createOscillator(); car.frequency.value = freq;
      const mod = ctx.createOscillator(); mod.frequency.value = freq * ratio;
      const mg = ctx.createGain(); mg.gain.setValueAtTime(freq * index, at); mg.gain.exponentialRampToValueAtTime(freq * 0.05, at + len);
      mod.connect(mg).connect(car.frequency); car.connect(g);
      car.start(at); mod.start(at); car.stop(at + len + 0.1); mod.stop(at + len + 0.1);
    }
    function bgmNote(type, freq, at, len, vol) {
      if (type === "bell") return fmNote(freq, at, len, vol, 3.5, 1.5, 0.7);
      if (type === "musicbox") return fmNote(freq * 2, at, Math.max(len, 0.6), vol * 0.9, 7.01, 0.8, 0.6);
      if (type === "epiano") { fmNote(freq, at, len * 1.4, vol, 1, 0.9, 0.35); return; }
      if (type === "zither") { // 가야금·고쟁: 뜯고 빠르게 어두워지는 현, 가끔 농현
        const g2 = ctx.createGain(); g2.connect(bgmBus); const r2 = ctx.createGain(); r2.gain.value = 0.45; g2.connect(r2).connect(reverbIn);
        const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.setValueAtTime(freq, at);
        if (Math.random() < 0.18) o2.frequency.setTargetAtTime(freq * Math.pow(2, (Math.random() < 0.5 ? 1 : 2) / 12), at + 0.18, 0.08);
        const f2 = ctx.createBiquadFilter(); f2.type = "lowpass"; f2.Q.value = 2; f2.frequency.setValueAtTime(5000, at); f2.frequency.exponentialRampToValueAtTime(400, at + 0.4);
        const d = Math.max(0.5, Math.min(len * 1.6, 1.2));
        env(g2, at, 0.002, vol * 1.2, d); o2.connect(f2).connect(g2); o2.start(at); o2.stop(at + d + 0.05);
        return;
      }
      const g = ctx.createGain(); g.connect(bgmBus); const r = ctx.createGain(); r.gain.value = 0.45; g.connect(r).connect(reverbIn);
      const o = ctx.createOscillator(); const f = ctx.createBiquadFilter(); f.type = "lowpass";
      if (type === "pluck") { // 하프·피치카토 느낌
        o.type = "triangle"; o.frequency.value = freq; f.frequency.setValueAtTime(4000, at); f.frequency.exponentialRampToValueAtTime(600, at + 0.3);
        env(g, at, 0.003, vol * 1.3, Math.min(len, 0.5));
      } else {
        o.type = type; o.frequency.value = freq; f.frequency.value = type === "square" ? 2200 : 3500;
        env(g, at, 0.008, vol, len);
      }
      o.connect(f).connect(g); o.start(at); o.stop(at + len + 0.1);
    }
    function kick(at, v = 0.3) { v *= cfg.kick; if (v <= 0.003) return; const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, at); o.frequency.exponentialRampToValueAtTime(40, at + 0.12); const g = ctx.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2); o.connect(g).connect(bgmBus); o.start(at); o.stop(at + 0.22); }
    function hat(at, v = 0.03, len = 0.04) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000; const g = ctx.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len); s.connect(f).connect(g).connect(bgmBus); s.start(at, Math.random()); s.stop(at + len + 0.02); }
    function snare(at, v = 0.08, freq = 1800, len = 0.15) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len); s.connect(f).connect(g).connect(bgmBus); s.start(at, Math.random()); s.stop(at + len + 0.02); }
    function bass(m, at, len, v = 0.1) { const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = mtof(m); const g = ctx.createGain(); env(g, at, 0.005, v, len); o.connect(g).connect(bgmBus); o.start(at); o.stop(at + len + 0.05); }
    function timpani(m, at, v = 0.18) { v *= cfg.kick; if (v <= 0.003) return; const o = ctx.createOscillator(); o.frequency.setValueAtTime(mtof(m) * 1.5, at); o.frequency.exponentialRampToValueAtTime(mtof(m), at + 0.08); const g = ctx.createGain(); env(g, at, 0.004, v, 0.6); o.connect(g).connect(bgmBus); const r = ctx.createGain(); r.gain.value = 0.4; g.connect(r).connect(reverbIn); o.start(at); o.stop(at + 0.7); }

    // 동양풍 타악기: 장구(덩·쿵·덕), 큰북, 징
    function lowDrum(at, v, f0 = 95) { v *= cfg.kick; if (v <= 0.003) return; const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0 * 1.3, at); o.frequency.exponentialRampToValueAtTime(f0, at + 0.06); const g = ctx.createGain(); env(g, at, 0.003, v, 0.35); o.connect(g).connect(bgmBus); const r = ctx.createGain(); r.gain.value = 0.25; g.connect(r).connect(reverbIn); o.start(at); o.stop(at + 0.4); }
    function rim(at, v = 0.05) { snare(at, v, 2600, 0.05); const o = ctx.createOscillator(); o.frequency.value = 620; const g = ctx.createGain(); env(g, at, 0.001, v * 0.8, 0.05); o.connect(g).connect(bgmBus); o.start(at); o.stop(at + 0.08); }
    function bgmGong(m, at, v = 0.05) { fmNote(mtof(m), at, 3, v, 1.414, 3, 0.9); }

    // 리드 멜로디: 비브라토가 들어간 플루트·신스 리드·호른 등
    let leadPrev = null;
    function leadNote(inst, freq, at, len, vol) {
      if (inst === "epiano") return fmNote(freq, at, len * 1.3, vol * 1.1, 1, 0.9, 0.35);
      if (inst === "bell") return fmNote(freq, at, len * 2, vol * 0.9, 2.76, 1.6, 0.8);
      if (inst === "bamboo") { // 대금·피리: 아래에서 밀어 올리는 시김새 + 늦게 들어오는 떨림 + 숨소리
        const o3 = ctx.createOscillator(); o3.type = "sine";
        o3.frequency.setValueAtTime(freq * 0.94, at); o3.frequency.exponentialRampToValueAtTime(freq, at + 0.1);
        const l3 = ctx.createOscillator(), lg3 = ctx.createGain(); l3.frequency.value = 5;
        lg3.gain.setValueAtTime(0, at); lg3.gain.linearRampToValueAtTime(freq * 0.012, at + Math.min(0.5, len * 0.6)); l3.connect(lg3).connect(o3.frequency);
        const g3 = ctx.createGain(); g3.gain.setValueAtTime(0.0001, at); g3.gain.exponentialRampToValueAtTime(vol * 1.1, at + 0.07);
        g3.gain.setValueAtTime(vol * 1.1, at + len * 0.7); g3.gain.exponentialRampToValueAtTime(0.0001, at + len);
        o3.connect(g3).connect(bgmBus); const r3 = ctx.createGain(); r3.gain.value = 0.6; g3.connect(r3).connect(reverbIn);
        const n3 = ctx.createBufferSource(); n3.buffer = noiseBuf; const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = freq * 2; nf.Q.value = 3;
        const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, at); ng.gain.exponentialRampToValueAtTime(vol * 0.4, at + 0.05); ng.gain.exponentialRampToValueAtTime(0.0001, at + len);
        n3.connect(nf).connect(ng).connect(bgmBus);
        o3.start(at); l3.start(at); n3.start(at, Math.random()); o3.stop(at + len + 0.05); l3.stop(at + len + 0.05); n3.stop(at + len + 0.05);
        return;
      }
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = inst === "lead" ? 6 : 5; lg.gain.value = freq * (inst === "horn" ? 0.003 : 0.006);
      lfo.connect(lg).connect(o.frequency);
      o.frequency.value = freq;
      if (inst === "flute") { o.type = "sine"; f.type = "lowpass"; f.frequency.value = 4000; }
      else if (inst === "lead") { o.type = "square"; f.type = "lowpass"; f.frequency.value = 2400; vol *= 0.45; }
      else { o.type = "sawtooth"; f.type = "lowpass"; f.frequency.value = 1100; vol *= 0.6; } // horn
      const a = inst === "horn" ? 0.08 : 0.04;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + a);
      g.gain.setValueAtTime(vol, at + Math.max(a, len * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      o.connect(f).connect(g).connect(bgmBus); const r = ctx.createGain(); r.gain.value = 0.5; g.connect(r).connect(reverbIn);
      o.start(at); lfo.start(at); o.stop(at + len + 0.05); lfo.stop(at + len + 0.05);
    }
    function crackle(at, dur) { // 레코드 잡음 툭툭
      for (let i = 0; i < 3; i++) if (Math.random() < 0.6) { const t = at + Math.random() * dur, s2 = ctx.createBufferSource(); s2.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2500; const g = ctx.createGain(); g.gain.setValueAtTime(0.02 + Math.random() * 0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.008); s2.connect(f).connect(g).connect(bgmBus); s2.start(t, Math.random()); s2.stop(t + 0.01); }
    }
    function scheduleStep(at) {
      const beat = 60 / preset.bpm, eighth = beat / 2;
      const ch = preset.chords[Math.floor(step / 16) % preset.chords.length];
      const s = step % 16;
      const swing = preset.drums === "lofi" && s % 2 ? eighth * 0.18 : 0;
      const t = at + swing;
      if (s === 0) startPad(ch, at, beat);
      // 글리치: 가끔 음이 끊기거나 튀거나 되감기듯 반복
      if (preset.glitch && Math.random() < 0.18) {
        const r = Math.random();
        if (r < 0.4) { for (let i = 0; i < 3; i++) bgmNote("square", mtof(ch[0] + 24 + Math.floor(Math.random() * 12)), t + i * 0.03, 0.03, 0.02); }
        else if (r < 0.7) snare(t, 0.06, 500 + Math.random() * 5000, 0.05);
        else { step++; return; } // 한 칸 통째로 끊김
      }
      if (preset.arp !== "none" && (Math.random() < preset.dens || s % 4 === 0)) {
        let m = ch[preset.pat[s % preset.pat.length] % ch.length] + preset.oct;
        if (preset.minorBell && Math.random() < 0.15) m += 1; // 살짝 어긋난 불협음
        const short = preset.staccato || preset.drums === "battle" || preset.drums === "pulse" || preset.drums === "orch";
        const len = short ? eighth * 0.8 : eighth * 2.6;
        const vol = { bell: 0.05, musicbox: 0.045, square: 0.022, pluck: 0.05, epiano: 0.05 }[preset.arp] || 0.04;
        bgmNote(preset.arp, mtof(m) * (preset.glitch && Math.random() < 0.1 ? 1.03 : 1), t, len, vol);
      }
      // 리드 멜로디
      if (preset.lead && (s % 4 === 0 || (s % 4 === 2 && Math.random() < 0.5)) && Math.random() < preset.lead.dens) {
        const tones = ch.map((m) => m + 12 + preset.lead.oct);
        let m = tones[Math.floor(Math.random() * tones.length)];
        if (leadPrev != null) { // 너무 크게 뛰지 않게 가까운 음으로
          const near = tones.slice().sort((x, y) => Math.abs(x - leadPrev) - Math.abs(y - leadPrev));
          m = Math.random() < 0.7 ? near[Math.min(1, near.length - 1)] : near[0];
        }
        leadPrev = m;
        const len = (s % 4 === 0 ? beat * (Math.random() < 0.4 ? 2 : 1) : eighth) * 0.95;
        leadNote(preset.lead.inst, mtof(m), t, len, preset.theme === "dark" ? 0.035 : 0.045);
      }
      // 테마별 양념
      if (preset.theme === "otome" && s === 0) fmNote(mtof(ch[0] + 36), at, 1.4, 0.018, 7.01, 0.5, 0.8); // 마디 첫 박 '띵'
      if (preset.theme === "daily" && s % 4 === 0) crackle(at, beat * 2);
      if (preset.theme === "oriental" && s === 0 && /calm|lobby|romance|mystery|sad|happy/.test(preset.mood) && Math.random() < 0.5) { for (let i = 0; i < 3; i++) fmNote(mtof(ch[i % ch.length] + 36), at + i * 0.11 + Math.random() * 0.05, 1.6, 0.012, 3.0, 0.8, 0.9); } // 처마 끝 풍경
      if (introLeft <= 0 && preset.theme === "dark" && (s === 0 || s === 8) && /calm|mystery|dark|sad|lobby/.test(preset.mood)) { kick(at, 0.1); kick(at + beat * 0.45, 0.065); } // 심장 박동 (곡 시작 첫 마디엔 없음)
      if (preset.theme === "hunter" && (preset.drums === "battle" || preset.drums === "pulse")) hat(at + eighth / 2, 0.012, 0.025); // 16비트 하이햇
      if (introLeft > 0) { introLeft--; step++; return; } // 첫 마디는 멜로디·화음만 (위에서 이미 연주)
      switch (preset.drums) {
        case "battle": if (s % 2 === 0) bass(ch[0] - 24, at, beat * 0.8, 0.12); if (s % 4 === 0) kick(at); if (s % 8 === 4) snare(at); hat(at, s % 2 ? 0.02 : 0.035); break;
        case "orch": if (s % 4 === 0) timpani(ch[0] - 24, at, 0.2); if (s % 8 === 6) timpani(ch[0] - 17, at, 0.12); if (s % 2 === 0) bass(ch[0] - 24, at, beat * 0.7, 0.07); if (s % 4 === 2) snare(at, 0.03, 3000, 0.08); break;
        case "pulse": bass(ch[0] - 24, at, eighth * 0.7, 0.08); if (s % 8 === 0) kick(at, 0.25); if (s % 2) hat(at, 0.015); break;
        case "bounce": if (s % 4 === 0) { kick(at, 0.18); bass(ch[0] - 24, at, beat * 0.5, 0.09); } if (s % 4 === 2) { hat(at, 0.03, 0.06); bass(ch[2 % ch.length] - 24, at, beat * 0.4, 0.07); } break;
        case "soft": if (s % 8 === 0) bass(ch[0] - 24, at, beat * 3, 0.06); if (s % 4 === 2) hat(at, 0.008, 0.03); break;
        case "janggu": // 굿거리풍 장구: 덩 . . 기덕 . . 덕 . 쿵 . . 덕 . . 덕 .
          if (s === 0 || s === 8) { lowDrum(t, s === 0 ? 0.2 : 0.16, 95); if (s === 0) rim(t, 0.05); }
          if (s === 3 || s === 11) { rim(t, 0.035); rim(t + eighth * 0.45, 0.045); }
          if (s === 6 || s === 14) rim(t, 0.04);
          if (s % 8 === 0) bass(ch[0] - 24, t, beat * 1.4, 0.05);
          break;
        case "taiko": // 큰북 + 징
          if (s % 4 === 0) lowDrum(at, 0.3, 70);
          if (s === 6 || s === 14) lowDrum(at, 0.18, 85);
          if (s === 15) { lowDrum(at, 0.14, 90); lowDrum(at + eighth / 2, 0.18, 90); }
          if (s % 2) rim(at, 0.02);
          if (s === 0 && Math.floor(step / 16) % 2 === 0) bgmGong(ch[0] - 12, at, 0.04);
          if (s % 2 === 0) bass(ch[0] - 24, at, beat * 0.7, 0.08);
          break;
        case "lofi":
          if (s % 8 === 0 || s === 11) kick(t, 0.16);
          if (s % 8 === 4) snare(t, 0.05, 1400, 0.2);
          if (s % 2 === 0) hat(t, 0.012, 0.03);
          if (s % 8 === 0) bass(ch[0] - 24, t, beat * 1.6, 0.07);
          if (s === 0) { const n = ctx.createBufferSource(); n.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3000; f.Q.value = 0.5; const g = ctx.createGain(); g.gain.value = 0.004; n.connect(f).connect(g).connect(bgmBus); n.start(at); n.stop(at + beat * 8); } // 레코드 잡음
          break;
      }
      step++;
    }
    let curKey = null;
    function startSynth(key) {
      if (!ctx) return;
      curKey = key;
      const pk = key + "|" + activeTheme();
      if (seqTimer && presetKey === pk) return;
      const changing = !!seqTimer;
      preset = buildPreset(key); presetKey = pk; step = 0; introLeft = 16;
      if (changing) { stopPad(ctx.currentTime, cfg.fade); nextTime = ctx.currentTime + Math.min(0.35, cfg.fade); return; }
      nextTime = ctx.currentTime + 0.1;
      seqTimer = setInterval(() => {
        if (!ctx || ctx.state !== "running") return;
        const e = 60 / preset.bpm / 2;
        if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05; // 탭이 잠시 멈췄다 돌아와도 몰아서 연주하지 않게
        while (nextTime < ctx.currentTime + 0.5) { scheduleStep(nextTime); nextTime += e; }
      }, 150);
      timers.add(seqTimer);
    }
    function stopSynth() {
      if (!seqTimer) return;
      clearInterval(seqTimer); timers.delete(seqTimer); seqTimer = 0; presetKey = null;
      if (ctx) stopPad(ctx.currentTime, 0.5);
    }


    return {
      start: startSynth, stop: stopSynth, running: () => !!seqTimer,
      invalidate: () => { presetKey = null; },
      refresh: () => { if (seqTimer && curKey) { preset = buildPreset(curKey); presetKey = curKey + "|" + activeTheme(); return true; } return false; },
    };
  }

  function createEngineV2() {
    /* =========================================================
     * 배경음 엔진 2 — '곡'처럼 들리게
     *  - 배경 화음은 끊지 않고 다음 화음과 겹쳐 이어짐(가까운 음으로 움직이는 보이스 리딩)
     *  - 멜로디는 미리 지은 4마디 악절을 반복·변주(A → A′), 악절 끝에서 숨을 쉼
     *  - 반주는 일정한 리듬으로 치고, 음이 서로 울리며 이어짐(서스테인 페달처럼)
     *  - 같은 상황·테마면 항상 같은 곡(시드 난수)
     * ========================================================= */
    function seeded(str) {
      let h = 1779033703 ^ str.length;
      for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    }
    const rpick = (r, arr) => arr[Math.floor(r() * arr.length)];

    // 분위기별 곡의 뼈대 (코드 진행·빠르기·에너지 0~3)
    const BASE = {
      lobby:   { bpm: 84,  chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], energy: 1 },
      summon:  { bpm: 88,  chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 67]], energy: 1 },
      battle:  { bpm: 132, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], energy: 3 },
      calm:    { bpm: 70,  chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 59, 62, 65]], energy: 0 },
      happy:   { bpm: 112, chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], energy: 2 },
      comedy:  { bpm: 126, chords: [[60, 64, 67], [62, 65, 69], [64, 67, 71], [55, 59, 62]], energy: 2, staccato: true },
      romance: { bpm: 72,  chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 67]], energy: 0 },
      sad:     { bpm: 64,  chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], energy: 0 },
      tense:   { bpm: 110, chords: [[45, 48, 52], [46, 50, 53], [45, 48, 52], [44, 47, 52]], energy: 2 },
      mystery: { bpm: 66,  chords: [[50, 53, 57, 64], [46, 50, 53, 57], [43, 46, 50, 52], [45, 49, 52, 55]], energy: 0 },
      dark:    { bpm: 66,  chords: [[50, 53, 57], [49, 53, 56], [50, 53, 57], [46, 50, 53]], energy: 0, minorBell: true },
      glitch:  { bpm: 96,  chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], energy: 1, glitch: true },
    };
    // 테마별 악기 편성
    const STYLE = {
      fantasy: { // 관현악: 현악 합주·하프·호른·트럼펫·합창·팀파니
        ens: [{ i: "harp", p: "roll", sec: [0, 1, 3] }, { i: "pizz", p: "pizz", sec: [1, 3] }, { i: "cello", p: "counter", sec: [2, 3] }, { i: "choirpad", p: "pad", sec: [2] }], ensBattle: [], tempo: 1, pad: "strings", padCut: 1500, arp: { def: "none", mystery: "bell", summon: "pluck" }, comp: {}, lead: "horn", leadCenter: 72, bassInst: "cello", bassBattle: false,
        leadSec: { lobby: ["horn", "horn", "trumpet", "horn"], summon: ["horn", "trumpet", "trumpet", "horn"], happy: ["flute", "flute", "trumpet", "flute"] },
        leadBy: { calm: "flute", romance: "violin", sad: "violin", mystery: "flute", comedy: "flute", dark: "cello" },
        drums: { battle: "orch", tense: "orch", happy: "orchSoft", comedy: "orchSoft", lobby: "orchSoft", summon: "orchSoft", def: "none" }, rev: 0.55, mix: 1.8, mixBattle: 1 },
      otome: { // 실내악 무도회: 하프·피치카토·첼로·바이올린·플루트·첼레스타 (드럼 없음)
        ens: [{ i: "harp", p: "roll" }, { i: "pizz", p: "offstab" }, { i: "celesta", p: "glock", sec: [1, 3] }, { i: "violin", p: "counter", sec: [2, 3], v: 0.8 }], ensBattle: [{ i: "harp", p: "roll", sec: [0, 1, 3] }], tempo: 0.96, pad: "none", padCut: 1700, arp: { def: "none", calm: "musicbox", sad: "musicbox", summon: "musicbox" }, comp: {}, lead: "flute", leadCenter: 79, bassInst: "cello", bassBattle: false, noAutoWaltz: true,
        leadSec: { lobby: ["flute", "flute", "violin", "flute"], summon: ["flute", "flute", "violin", "flute"], romance: ["violin", "violin", "flute", "violin"] },
        leadBy: { sad: "violin", tense: "violin", mystery: "flute", dark: "violin" },
        drums: { battle: "orch", tense: "orch", def: "none" }, rev: 0.6, mix: 1.4, mixBattle: 2.2 },
      hunter: { // 전자음 게임 OST: 신스 패드·아르페지에이터·신스 베이스·808 드럼·신스 리드
        ens: [{ i: "stab", p: "offstab", sec: [1, 2, 3] }, { i: "chip", p: "glock", sec: [1, 3] }], ensBattle: [{ i: "chip", p: "glock", sec: [1, 3] }], tempo: 1.06, pad: "synth", padCut: 2000, arp: { def: "synthpluck", mystery: "bell" }, comp: {}, lead: "lead", leadCenter: 76, bassInst: "synthbass", bassBattle: false,
        drums: { battle: "battle", tense: "808", happy: "808", lobby: "808", summon: "808", dark: "808", comedy: "808", mystery: "808", def: "none" }, rev: 0.35, sidechain: true, mix: 2.5, mixBattle: 1 },
      daily: { // 어쿠스틱: 통기타·우쿨렐레·콘트라베이스·글로켄슈필·휘파람·브러시 드럼
        ens: [{ i: "guitar", p: "strum" }, { i: "ukulele", p: "offstab", sec: [1, 2, 3], v: 0.9 }, { i: "glock", p: "glock", sec: [1, 3], v: 0.9 }], ensBattle: [], tempo: 0.92, pad: "none", padCut: 1200, arp: { def: "none" }, comp: {}, lead: "whistle", leadCenter: 77, bassInst: "upright", bassBattle: false,
        leadSec: { lobby: ["whistle", "whistle", "flute", "whistle"], happy: ["whistle", "whistle", "flute", "whistle"] },
        leadBy: { sad: "flute", romance: "flute", mystery: "flute" },
        drums: { def: "brush", sad: "none", mystery: "none", dark: "none", calm: "none", battle: "battle" }, rev: 0.35, swing: 0.16, mix: 2.2, mixBattle: 1 },
      dark: { // 고딕 호러: 파이프오르간·뮤직박스·현의 트레몰로·하프시코드·합창
        ens: [{ i: "cello", p: "trem", sec: [1, 2, 3] }, { i: "harpsichord", p: "roll", sec: [0, 1, 3], v: 0.7 }, { i: "choirpad", p: "pad", sec: [2] }], ensBattle: [{ i: "cello", p: "trem" }], tempo: 0.9, pad: "organ", padCut: 1600, arp: { def: "none" }, comp: {}, lead: "musicbox", leadCenter: 76, bassInst: "organ", bassBattle: false, noAutoWaltz: true,
        leadSec: { lobby: ["musicbox", "musicbox", "choir", "musicbox"], summon: ["musicbox", "musicbox", "choir", "musicbox"] },
        leadBy: { sad: "violin", romance: "violin", tense: "choir", dark: "choir", calm: "choir", battle: "choir", glitch: "musicbox" },
        drums: { battle: "battle", tense: "pulse", def: "none" }, rev: 0.75, mix: 2.1, mixBattle: 1 },
      oriental: { ens: [{ i: "gayageum", p: "gaya" }, { i: "gayageum", p: "gliss" }, { i: "haegeum", p: "counter", sec: [2, 3] }], ensBattle: [{ i: "haegeum", p: "counter", sec: [1, 2, 3], v: 0.8 }], tempo: 1, pad: "none", padCut: 700, arp: { def: "none" }, comp: {}, lead: "daegeum", leadCenter: 77, bassInst: "geomungo", droneInst: "ajaeng", mix: 2, mixBattle: 1.5,
        leadSec: { lobby: ["daegeum", "danso", "piri", "daegeum"], summon: ["daegeum", "danso", "piri", "daegeum"] },
        leadBy: { sad: "haegeum", dark: "haegeum", romance: "danso", calm: "danso", happy: "danso", comedy: "piri", tense: "piri", battle: "piri", mystery: "daegeum" },
        drums: { battle: "hwimori", tense: "dagu", lobby: "jangdan", summon: "jangdan", happy: "janggu", comedy: "janggu", dark: "dagu", mystery: "dagu", def: "jingOnly" }, rev: 0.6, drone: true },
      idol: { ens: [{ i: "piano", p: "offstab" }, { i: "celesta", p: "glock", sec: [1, 3] }, { i: "stab", p: "offstab", sec: [2], v: 0.6 }], ensBattle: [{ i: "stab", p: "offstab", sec: [2], v: 0.6 }], tempo: 1, pad: "supersaw", padCut: 2300, arp: { def: "synthpluck", calm: "epiano", romance: "epiano", sad: "epiano", mystery: "epiano" }, comp: { calm: true, romance: true, sad: true, mystery: true }, lead: "vocal", leadCenter: 76,
        drums: { def: "kpop", calm: "rnb", romance: "rnb", sad: "rnb", mystery: "rnb", dark: "pulse" }, rev: 0.4, sidechain: true,
        bpm: { lobby: 118, summon: 120, battle: 128, calm: 88, happy: 124, comedy: 122, romance: 80, sad: 74, tense: 120, mystery: 92, dark: 96, glitch: 110 },
        padBy: { calm: "warm", romance: "warm", sad: "warm", mystery: "warm" }, leadBy: { calm: "whistle", romance: "whistle", sad: "whistle", mystery: "whistle" } },
    };
    // 화음 배치: 직전 화음에서 가장 적게 움직이는 자리바꿈을 고름 → 매끄럽게 이어짐
    function voiceChord(chord, prev, lo = 52, hi = 74) {
      const pcs = [...new Set(chord.map((m) => ((m % 12) + 12) % 12))];
      const cands = [];
      for (let r = 0; r < pcs.length; r++) {
        const order = pcs.slice(r).concat(pcs.slice(0, r));
        for (let base = lo - 12; base <= lo + 12; base++) {
          if (((base % 12) + 12) % 12 !== order[0]) continue;
          const v = [base]; for (let i = 1; i < order.length; i++) { let n = order[i]; while (n <= v[i - 1]) n += 12; v.push(n); }
          if (v[0] >= lo && v[v.length - 1] <= hi + 7) cands.push(v.slice(0, 4));
        }
      }
      if (!cands.length) return chord.slice(0, 4);
      if (!prev) return cands.sort((a, b) => Math.abs(a[0] - 57) - Math.abs(b[0] - 57))[0];
      const cost = (v) => { let c = 0; for (let i = 0; i < Math.max(v.length, prev.length); i++) c += Math.abs((v[i] ?? v[v.length - 1]) - (prev[i] ?? prev[prev.length - 1])); return c; };
      return cands.sort((a, b) => cost(a) - cost(b))[0];
    }

    /* ---------- 테마별 작곡 ----------
     *  테마마다 조성·음계·박자·화성 진행·멜로디 말투를 따로 정함
     *   판타지: 믹솔리디안 영웅풍 팡파레, 목가적인 12/8
     *   오토메: 3/4 왈츠, 왕도 진행(IV△7–V7–iii7–vi7), 내려앉는 꾸밈음(아포자투라)
     *   헌터: 에올리안 마이너, 반복되는 16분 리프(신스웨이브)
     *   일상: 재즈 화성(ii–V–I, 7·9화음), 스윙, 엇박에서 시작하는 느긋한 가락
     *   동양풍: 5음 음계, 굿거리 12/8, 아래에서 밀어 올리는 시김새, 4도 쌓기 화음
     *   아이돌: 반복되는 훅(같은 음 연타·당김음), 후렴은 높고 길게
     *   다크: 화성 단음계, 3/4 마카브르 왈츠, 반음 꾸밈음, 라멘트 베이스
     * ---------------------------------- */
    const MODES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11], mixo: [0, 2, 4, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], penta: [0, 2, 4, 7, 9], yu: [0, 3, 5, 7, 10] };
    const QUAL = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 7: [0, 4, 7, 10], M9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14], add9: [0, 4, 7, 14], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], m7b5: [0, 3, 6, 10], 5: [0, 7, 12], q: [0, 5, 10] };
    const METER = { "4/4": { spb: 16, bs: 4 }, "3/4": { spb: 12, bs: 4 }, "12/8": { spb: 12, bs: 3 } };
    // "근음(으뜸음에서 반음 수):화음[/베이스]" 를 띄어 씀
    function parseProg(str, key) {
      return str.split(" ").map((tok) => {
        const [rq, bass] = tok.split("/"); const i = rq.indexOf(":");
        const r = +rq.slice(0, i), q = QUAL[rq.slice(i + 1)] || QUAL.M;
        let root = key + r; while (root >= 60) root -= 12; while (root < 48) root += 12;
        const notes = q.map((x) => root + x);
        notes.bass = bass != null ? (((key + +bass) % 12) + 12) % 12 : ((root % 12) + 12) % 12;
        return notes;
      });
    }
    const SONGBOOK = {
      fantasy: {
        bright: { key: 50, mode: "mixo", meter: "4/4", bpm: 96, prog: "0:M 10:M 5:M 0:M", progB: "9:m 5:M 0:M 7:M", mel: "fanfare" },
        soft:   { key: 50, mode: "major", meter: "12/8", bpm: 56, prog: "0:M 5:M 0:M 7:sus4", progB: "9:m 5:M 2:m 7:M", mel: "pastoral" },
        sad:    { key: 50, mode: "minor", meter: "4/4", bpm: 62, prog: "0:m 8:M 3:M 10:M", progB: "5:m 0:m 8:M 7:M", mel: "ballad" },
        tense:  { key: 50, mode: "harm", meter: "4/4", bpm: 100, prog: "0:m 8:M 7:M 0:m", progB: "5:m 1:M 7:7 7:7", mel: "ostinato" },
        battle: { key: 50, mode: "minor", meter: "4/4", bpm: 144, prog: "0:m 8:M 10:M 0:m", progB: "3:M 10:M 8:M 7:M", mel: "battle" },
      },
      otome: {
        bright: { key: 53, mode: "major", meter: "3/4", bpm: 138, prog: "5:M7 7:7 4:m7 9:m7", progB: "2:m7 7:7 0:M7 9:m7", mel: "waltz" },
        soft:   { key: 53, mode: "major", meter: "3/4", bpm: 100, prog: "0:M7 4:m7 5:M7 7:sus4", progB: "9:m7 2:m7 5:M7 7:7", mel: "waltz" },
        sad:    { key: 53, mode: "major", meter: "4/4", bpm: 64, prog: "9:m 5:M 0:M 7:M", progB: "2:m7 4:m7 5:M7 7:sus4", mel: "ballad" },
        tense:  { key: 57, mode: "harm", meter: "4/4", bpm: 100, prog: "0:m 5:m 7:7 0:m", progB: "8:M 5:m 2:m7b5 7:7", mel: "strings" },
        battle: { key: 57, mode: "minor", meter: "4/4", bpm: 140, prog: "0:m 8:M 10:M 0:m", progB: "5:m 8:M 7:M 7:7", mel: "battle" },
      },
      hunter: {
        bright: { key: 52, mode: "minor", meter: "4/4", bpm: 112, prog: "0:m 8:M 3:M 10:M", progB: "5:m 8:M 10:M 10:sus4", mel: "riff" },
        soft:   { key: 52, mode: "dorian", meter: "4/4", bpm: 84, prog: "0:m9 5:M 0:m9 10:M", progB: "3:M7 5:M 8:M7 10:M", mel: "pad" },
        sad:    { key: 52, mode: "minor", meter: "4/4", bpm: 76, prog: "0:m 10:M 8:M 10:M", progB: "3:M 10:M 5:m 7:m", mel: "pad" },
        tense:  { key: 52, mode: "phryg", meter: "4/4", bpm: 118, prog: "0:5 1:M 0:5 1:M", progB: "8:M 7:m 1:M 0:5", mel: "riff" },
        battle: { key: 52, mode: "minor", meter: "4/4", bpm: 144, prog: "0:5 0:5 8:M 10:M", progB: "3:M 10:M 8:M 7:m", mel: "riff" },
      },
      daily: {
        bright: { key: 51, mode: "major", meter: "4/4", bpm: 92, prog: "2:m7 7:7 0:M9 9:m7", progB: "5:M7 4:m7 9:m7 2:7", mel: "jazzy" },
        comedy: { key: 48, mode: "major", meter: "4/4", bpm: 124, prog: "0:M 9:m 2:m 7:7", progB: "5:M 7:M 4:m 9:m", mel: "bouncy" },
        soft:   { key: 51, mode: "major", meter: "4/4", bpm: 74, prog: "0:M7 5:M7 0:M7 5:M7", progB: "4:m7 9:m7 2:m7 7:sus4", mel: "lazy" },
        sad:    { key: 51, mode: "major", meter: "4/4", bpm: 66, prog: "9:m7 2:m7 7:7 0:M7", progB: "5:M7 4:m7 9:m7 7:sus4", mel: "lazy" },
        tense:  { key: 50, mode: "dorian", meter: "4/4", bpm: 100, prog: "0:m7 5:7 0:m7 5:7", progB: "3:M7 5:7 10:M 7:m7", mel: "jazzy" },
        battle: { key: 52, mode: "minor", meter: "4/4", bpm: 148, prog: "0:5 8:5 10:5 0:5", progB: "5:5 3:5 10:5 7:5", mel: "battle" },
      },
      oriental: { // 국악 관현악(사극·무협 OST): 계면조 느낌의 5음 음계, 가야금·거문고·해금·아쟁·대금·단소·피리, 장구·북·징·박
        bright: { key: 57, mode: "yu", meter: "4/4", bpm: 70, prog: "0:m 3:M 10:sus2 0:m", progB: "5:sus2 3:M 10:sus2 7:q", mel: "lyric" },
        summon: { key: 57, mode: "yu", meter: "4/4", bpm: 74, prog: "3:M 10:sus2 0:m 0:m", progB: "5:sus2 3:M 7:q 0:m", mel: "lyric" },
        happy:  { key: 55, mode: "penta", meter: "12/8", bpm: 62, prog: "0:sus2 9:q 7:sus4 0:sus2", progB: "4:q 2:sus4 9:q 7:sus2", mel: "penta" },
        comedy: { key: 55, mode: "penta", meter: "12/8", bpm: 66, prog: "0:sus2 9:q 7:sus4 0:sus2", progB: "4:q 2:sus4 9:q 7:sus2", mel: "penta" },
        soft:   { key: 57, mode: "yu", meter: "4/4", bpm: 62, prog: "3:M 10:sus2 0:m 0:m", progB: "5:sus2 3:M 7:q 0:m", mel: "lyric" },
        sad:    { key: 57, mode: "yu", meter: "4/4", bpm: 56, prog: "0:m 5:sus2 10:sus2 0:m", progB: "3:M 10:sus2 7:q 0:m", mel: "pentaSlow" },
        tense:  { key: 57, mode: "yu", meter: "4/4", bpm: 88, prog: "0:5 0:5 10:5 0:5", progB: "5:5 3:5 10:5 7:q", mel: "ostinato" },
        battle: { key: 57, mode: "yu", meter: "4/4", bpm: 146, prog: "0:m 10:sus2 3:M 0:m", progB: "5:sus2 3:M 10:sus2 7:q", mel: "wuxiaFight" },
      },
      idol: {
        bright: { key: 56, mode: "major", meter: "4/4", bpm: 120, prog: "9:m7 5:M9 0:add9 7:sus4", progB: "5:M7 7:7 4:m7 9:m7", mel: "hook" },
        soft:   { key: 53, mode: "major", meter: "4/4", bpm: 80, prog: "0:M9 4:m7 9:m9 5:M7", progB: "2:m9 7:7 0:M9 9:m7", mel: "rnb" },
        sad:    { key: 56, mode: "major", meter: "4/4", bpm: 72, prog: "9:m 5:M 0:M 7:M", progB: "2:m7 4:m7 5:M7 7:sus4", mel: "ballad" },
        tense:  { key: 53, mode: "minor", meter: "4/4", bpm: 120, prog: "0:m 8:M 10:M 0:m", progB: "8:M7 10:M 3:M 7:m", mel: "riff" },
        battle: { key: 53, mode: "minor", meter: "4/4", bpm: 128, prog: "0:m 8:M 3:M 10:M", progB: "5:m 8:M 10:M 10:sus4", mel: "hook" },
      },
      dark: {
        bright: { key: 50, mode: "harm", meter: "3/4", bpm: 112, prog: "0:m 5:m 7:7 0:m", progB: "8:M 4:dim 7:7 0:m", mel: "macabre" },
        soft:   { key: 50, mode: "minor", meter: "4/4", bpm: 60, prog: "0:m 8:M 5:m 7:M", progB: "3:M 10:M 5:m 7:7", mel: "chant" },
        sad:    { key: 50, mode: "harm", meter: "4/4", bpm: 58, prog: "0:m 0:m/10 8:M 7:M", progB: "5:m 5:m/3 7:7 0:m", mel: "lament" },
        tense:  { key: 50, mode: "phryg", meter: "4/4", bpm: 92, prog: "0:m 1:M 0:m 1:M", progB: "5:m 1:M 7:7 0:m", mel: "ostinato" },
        battle: { key: 50, mode: "harm", meter: "4/4", bpm: 140, prog: "0:m 8:M 5:m 7:7", progB: "1:M 8:M 7:7 7:7", mel: "battle" },
      },
    };
    // 분위기 → 곡 종류 (+빠르기 배율)
    const MOOD_SONG = { lobby: ["bright", 1], summon: ["bright", 1.04], happy: ["bright", 1.1], comedy: ["bright", 1.14], glitch: ["bright", 0.95], calm: ["soft", 1], romance: ["soft", 0.95], sad: ["sad", 1], tense: ["tense", 1], mystery: ["tense", 0.72], dark: ["tense", 0.8], battle: ["battle", 1] };

    // 멜로디 말투: 리듬 칸(시작, 길이), 도약·반복 성향, 꾸밈음 종류
    const MEL = {
      fanfare:   { A: [[[0, 6], [6, 2], [8, 8]], [[0, 4], [4, 2], [6, 2], [8, 8]], [[0, 3], [3, 1], [4, 4], [8, 4], [12, 4]]], B: [[[0, 8], [8, 4], [12, 4]], [[0, 12], [12, 4]]], leap: 0.5, rep: 0.1, up: true },
      ballad:    { A: [[[0, 8], [8, 4], [12, 4]], [[0, 4], [4, 4], [8, 8]], [[0, 12], [12, 2], [14, 2]]], B: [[[0, 6], [6, 2], [8, 8]], [[0, 16]]], leap: 0.15, rep: 0.05, app: "step" },
      ostinato:  { A: [[[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]]], B: [[[0, 4], [4, 4], [8, 4], [12, 4]]], leap: 0, rep: 0.35, riff: [0, 1, 0, -1, 0, 1, 2, 1], span: 7 },
      strings:   { A: [[[0, 4], [4, 4], [8, 4], [12, 4]], [[0, 2], [2, 2], [4, 4], [8, 2], [10, 2], [12, 4]]], B: [[[0, 8], [8, 8]], [[0, 6], [6, 2], [8, 8]]], leap: 0.2, rep: 0.05 },
      riff:      { A: [[[0, 3], [3, 3], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]], [[0, 2], [3, 1], [4, 2], [6, 2], [8, 3], [11, 3], [14, 2]]], B: [[[0, 8], [8, 8]], [[0, 4], [4, 4], [8, 8]]], leap: 0, rep: 0.3, riff: "auto", span: 9 },
      pad:       { A: [[[0, 16]], [[0, 8], [8, 8]], [[0, 12], [12, 4]]], B: [[[0, 8], [8, 8]], [[0, 16]]], leap: 0.3, rep: 0 },
      jazzy:     { A: [[[2, 2], [4, 4], [10, 2], [12, 4]], [[0, 3], [3, 3], [6, 6]], [[4, 2], [6, 2], [8, 6]], [[2, 6], [10, 4]]], B: [[[0, 4], [4, 2], [6, 2], [8, 8]], [[2, 2], [4, 2], [6, 2], [8, 8]]], leap: 0.3, rep: 0.05, ext: true },
      bouncy:    { A: [[[0, 2], [4, 2], [6, 2], [8, 2], [12, 4]], [[0, 2], [2, 2], [4, 2], [8, 2], [10, 2], [12, 2]]], B: [[[0, 4], [4, 4], [8, 2], [10, 2], [12, 4]]], leap: 0.35, rep: 0.2, stac: true },
      lazy:      { A: [[[4, 6], [12, 4]], [[2, 4], [8, 8]], [[0, 10]], [[6, 2], [8, 8]]], B: [[[0, 8], [8, 6]], [[2, 6], [10, 6]]], leap: 0.25, rep: 0, ext: true },
      hook:      { A: [[[0, 2], [2, 2], [4, 3], [7, 1], [8, 2], [10, 2], [12, 4]], [[0, 3], [3, 3], [6, 2], [8, 2], [10, 4], [14, 2]]], B: [[[0, 4], [4, 4], [8, 8]], [[0, 6], [6, 2], [8, 8]]], leap: 0.15, rep: 0.45, hook: true },
      rnb:       { A: [[[0, 6], [6, 1], [7, 1], [8, 8]], [[0, 2], [2, 1], [3, 1], [4, 4], [8, 8]]], B: [[[0, 8], [8, 4], [12, 2], [14, 2]]], leap: 0.2, rep: 0.05, ext: true, app: "step" },
      chant:     { A: [[[0, 8], [8, 8]], [[0, 16]], [[0, 4], [4, 4], [8, 8]]], B: [[[0, 8], [8, 8]]], leap: 0, rep: 0.2, span: 7 },
      lament:    { A: [[[0, 8], [8, 8]], [[0, 4], [4, 4], [8, 8]]], B: [[[0, 6], [6, 2], [8, 8]]], leap: 0.05, rep: 0, app: "half", down: true },
      waltz:     { A: [[[0, 8], [8, 4]], [[0, 4], [4, 4], [8, 4]], [[0, 6], [6, 2], [8, 4]]], B: [[[0, 12]], [[0, 8], [8, 4]]], leap: 0.3, rep: 0.05, app: "step" },
      macabre:   { A: [[[0, 4], [4, 4], [8, 4]], [[0, 8], [8, 2], [10, 2]]], B: [[[0, 12]], [[0, 6], [6, 6]]], leap: 0.25, rep: 0.1, app: "half" },
      pastoral:  { A: [[[0, 4], [4, 2], [6, 6]], [[0, 3], [3, 3], [6, 3], [9, 3]], [[0, 6], [6, 4], [10, 2]]], B: [[[0, 6], [6, 6]], [[0, 9], [9, 3]]], leap: 0.3, rep: 0.05 },
      penta:     { A: [[[0, 6], [6, 3], [9, 3]], [[0, 3], [3, 3], [6, 6]], [[0, 9], [9, 3]], [[0, 4], [4, 2], [6, 6]]], B: [[[0, 6], [6, 6]], [[0, 12]]], leap: 0.25, rep: 0.05, grace: true },
      battle:    { A: [[[0, 3], [3, 3], [6, 2], [8, 6], [14, 2]], [[0, 2], [2, 2], [4, 4], [8, 3], [11, 3], [14, 2]], [[0, 6], [6, 2], [8, 4], [12, 4]]], B: [[[0, 8], [8, 4], [12, 4]], [[0, 6], [6, 2], [8, 8]], [[0, 12], [12, 2], [14, 2]]], leap: 0.4, rep: 0.1, up: true },
      lyric:     { A: [[[0, 6], [6, 2], [8, 6], [14, 2]], [[0, 4], [4, 2], [6, 2], [8, 8]], [[0, 10], [10, 2], [12, 2], [14, 2]]], B: [[[0, 6], [6, 2], [8, 8]], [[0, 12], [12, 2], [14, 2]], [[0, 4], [4, 4], [8, 8]]], leap: 0.25, rep: 0.05, grace: true },
      wuxia:     { A: [[[0, 8], [8, 2], [10, 2], [12, 4]], [[0, 6], [6, 2], [8, 8]], [[0, 4], [4, 4], [8, 6], [14, 2]]], B: [[[0, 12], [12, 2], [14, 2]], [[0, 8], [8, 8]]], leap: 0.35, rep: 0.05, grace: true, up: true },
      wuxiaFight:{ A: [[[0, 2], [2, 2], [4, 2], [6, 2], [8, 4], [12, 4]], [[0, 4], [4, 2], [6, 2], [8, 2], [10, 2], [12, 4]], [[0, 3], [3, 3], [6, 2], [8, 8]]], B: [[[0, 8], [8, 4], [12, 4]], [[0, 6], [6, 2], [8, 8]]], leap: 0.3, rep: 0.05, grace: true },
      pentaSlow: { A: [[[0, 12], [12, 4]], [[0, 6], [6, 2], [8, 8]], [[0, 16]]], B: [[[0, 8], [8, 8]]], leap: 0.3, rep: 0, grace: true },
    };
    const CAD_OPEN = { 16: [[[0, 12]], [[0, 4], [4, 12]], [[0, 8], [8, 6]]], 12: [[[0, 12]], [[0, 4], [4, 8]], [[0, 8], [8, 4]]] };
    const CAD_CLOSE = { 16: [[0, 4], [4, 12]], 12: [[0, 4], [4, 8]] };

    function composeSong(r, S, bars, scale, keyPc, center, spb, bs) {
      const span = S.span || 9, lo = center - 8, hi = center - 8 + span + 8;
      const pc = (m) => ((m % 12) + 12) % 12;
      const clamp = (m) => { while (m < lo) m += 12; while (m > hi) m -= 12; return m; };
      const nearTone = (pcs, from) => { let best = from, bd = 99; for (let m = lo; m <= hi; m++) if (pcs.includes(pc(m))) { const d = Math.abs(m - from); if (d < bd) { bd = d; best = m; } } return best; };
      const scaleStep = (from, k) => { let m = from; const dir = Math.sign(k); for (let i = 0; i < Math.abs(k); i++) { m += dir; let g = 0; while (!scale.includes(pc(m)) && g++ < 4) m += dir; } return m; };
      const strongTones = (ch) => { const t = (S.ext && ch.length >= 4 ? [ch[1], ch[3], ch[4] ?? ch[2]] : ch).map(pc), f = t.filter((x) => scale.includes(x)); return f.length ? f : t; }; // 멜로디 음계에 없는 화음 음은 피함
      const fitCells = (pool) => pool.map((c) => c.filter(([st]) => st < spb).map(([st, len]) => [st, Math.min(len, spb - st)])).filter((c) => c.length);
      const poolA = fitCells(S.A), poolB = fitCells(S.B);
      const contourFor = (cell) => cell.map((_, i) => {
        if (!i) return 0;
        if (r() < S.rep) return 0;
        const sgn = S.down ? (r() < 0.75 ? -1 : 1) : S.up && i === 1 ? 1 : r() < 0.5 ? 1 : -1;
        return r() < S.leap ? sgn * (2 + Math.floor(r() * 3)) : sgn;
      });
      const strong = (st) => st === 0 || st % (bs * 2) === 0;
      function render(cell, cont, ch, from) {
        let m = nearTone(strongTones(ch), from);
        return cell.map(([st, len], i) => {
          if (i > 0) { m = scaleStep(m, cont[i] || 0); if (strong(st) || len >= bs * 2) m = nearTone(strongTones(ch), m); }
          m = clamp(m);
          const n = { st, len, m };
          if (S.app && strong(st) && len >= bs * 2 && r() < 0.45) n.app = S.app === "half" ? 1 : scaleStep(m, 1) - m;
          if (S.grace && len >= bs && r() < 0.55) n.grace = m - scaleStep(m, -1);
          if (S.stac) n.stac = true;
          return n;
        });
      }
      // 리프형(헌터·아이돌 긴장·오스티나토): 한 마디 리프를 화음 근음 따라 옮겨 반복
      function riffBar(cell, shape, ch, ref) {
        const root = nearTone([ch.bass ?? pc(ch[0])], ref);
        let m = root; return cell.map(([st, len], i) => { if (i) m = scaleStep(root, shape[i % shape.length]); return { st, len, m: clamp(m), stac: len <= 2 }; });
      }
      const A = bars.slice(0, 4), Bc = bars.slice(8, 12);
      let a0, a1, a2, a3, a2v, b, a2b, a3c;
      if (S.riff) {
        const cell = rpick(r, poolA), shape = Array.isArray(S.riff) ? S.riff : cell.map((_, i) => (i ? rpick(r, [0, 0, 2, -1, 3, 4, 1]) : 0));
        const ref = center - 2;
        [a0, a1, a2, a3] = A.map((ch) => riffBar(cell, shape, ch, ref));
        a2v = riffBar(cell, shape.map((x, i) => (i === shape.length - 1 ? x + 2 : x)), A[2], ref);
        const bc = rpick(r, poolB);
        b = Bc.map((ch, i) => render(bc, contourFor(bc), ch, center + 3 + (i % 2) * 2));
        a2b = a2; a3c = riffBar(cell, shape.map(() => 0), A[3], ref);
        return [a0, a1, a2, a3, a0, a1, a2v, a3, ...b, a0, a1, a2b, a3c];
      }
      const motif = rpick(r, poolA), cont = contourFor(motif);
      a0 = render(motif, cont, A[0], center);
      a1 = S.hook ? render(motif, cont, A[1], a0[0].m) // 훅: 같은 리듬·같은 모양을 그대로 반복
                  : render(motif, cont, A[1], a0[0].m + (r() < 0.5 ? 2 : -2)); // 같은 가락을 옮겨 부르기
      const alt = rpick(r, poolA);
      a2 = S.hook ? render(motif, cont.map((x, i) => (i === cont.length - 1 ? x + 2 : x)), A[2], a1[0].m)
                  : r() < 0.5 ? render(motif, cont.map((x) => -x), A[2], a1[a1.length - 1].m) : render(alt, contourFor(alt), A[2], a1[a1.length - 1].m);
      const oc = rpick(r, CAD_OPEN[spb]);
      const t3 = strongTones(A[3]);
      a3 = oc.map(([st, len], i) => ({ st, len, m: nearTone(i === oc.length - 1 ? [t3[1] ?? t3[0], t3[2] ?? t3[0]] : t3, a2[a2.length - 1].m) })); // 열린 끝(질문)
      a2v = a2.map((n, i) => (i % 2 ? { ...n, m: clamp(scaleStep(n.m, 1)) } : { ...n }));
      const bc = rpick(r, poolB), bcont = contourFor(bc);
      b = Bc.map((ch, i) => render(bc, i % 2 ? bcont.map((x) => -x) : bcont, ch, center + 4 + (i === 2 ? 2 : 0)));
      b[3] = [{ st: 0, len: Math.round(spb * 0.6), m: nearTone(strongTones(Bc[3]), center + 5) }];
      a2b = a2.map((n, i) => (i === a2.length - 1 ? { ...n, m: clamp(scaleStep(n.m, -1)) } : { ...n }));
      const cc = CAD_CLOSE[spb];
      const t3b = A[3].map(pc), tonicIn = t3b.includes(keyPc) ? [keyPc] : [t3b[0]];
      a3c = [{ st: cc[0][0], len: cc[0][1], m: nearTone(t3b, a2b[a2b.length - 1].m) }, { st: cc[1][0], len: cc[1][1], m: nearTone(tonicIn, center) }]; // 닫힌 끝(대답)
      const cp = (x) => x.map((n) => ({ ...n }));
      return [a0, a1, a2, a3, cp(a0), cp(a1), a2v, cp(a3), ...b, cp(a0), cp(a1), a2b, a3c];
    }

    function buildPreset(sit) {
      const mood = sit.startsWith("story_") ? sit.slice(6) : sit;
      const b = BASE[mood] || BASE.lobby;
      const th = activeTheme();
      const st = STYLE[th] || STYLE.fantasy;
      const book = SONGBOOK[th] || SONGBOOK.fantasy;
      const [cat, mul] = MOOD_SONG[mood] || MOOD_SONG.lobby;
      const song = book[mood] || book[cat];
      const M = METER[song.meter];
      const energy = Math.max(0, Math.min(3, b.energy + (cfg.density < 0.6 ? -1 : cfg.density > 1.25 ? 1 : 0)));
      const bpm = song.bpm * mul * cfg.tempo;
      const A = parseProg(song.prog, song.key), B = parseProg(song.progB, song.key);
      const bars = [...A, ...A, ...B, ...A]; // A A′ B A″ 화성
      const scale = MODES[song.mode].map((i) => (song.key + i) % 12);
      const melScale = MODES[song.melMode || song.mode].map((i) => (song.key + i) % 12); // 동양풍: 화음은 서양식, 멜로디는 5음 음계
      const r = seeded(sit + "|" + th);
      const p = {
        mood, theme: th, bpm, energy, scale, key: song.key % 12, meter: song.meter, spb: M.spb, bs: M.bs,
        glitch: !!b.glitch, minorBell: !!b.minorBell, staccato: !!b.staccato || song.mel === "bouncy",
        pad: (st.padBy && st.padBy[mood]) || st.pad, padCut: st.padCut * (mood === "dark" || mood === "mystery" ? 0.7 : 1),
        arp: st.arp[mood] || st.arp.def,
        comp: st.comp[mood] !== undefined ? st.comp[mood] : !!st.comp.def,
        lead: (st.leadBy && st.leadBy[mood]) || st.lead, leadCenter: st.leadCenter,
        drums: (st.drums[mood] !== undefined ? st.drums[mood] : st.drums.def) || "none",
        rev: st.rev, swing: song.meter === "4/4" && (st.swing || song.mel === "jazzy" || song.mel === "lazy") ? (st.swing || 0.14) : 0,
        sidechain: !!st.sidechain, drone: !!st.drone && mood !== "battle" && mood !== "comedy" && mood !== "happy", droneInst: st.droneInst, bassInst: mood === "battle" && st.bassBattle === false ? null : st.bassInst,
        leadSec: cfg.leadInst === "auto" && st.leadSec ? st.leadSec[mood] || null : null,
        mix: (mood === "battle" ? st.mixBattle : st.mix) || 1,
        ens: mood === "glitch" ? null : mood === "battle" && st.ensBattle !== undefined ? st.ensBattle : st.ens,
        battle: mood === "battle" ? BATTLE_ARR[th] || null : null,
      };
      if (cfg.melody !== "auto") p.arp = cfg.melody;
      if (cfg.padInst !== "auto") p.pad = cfg.padInst;
      if (cfg.drums !== "auto") p.drums = cfg.drums;
      if (cfg.leadInst !== "auto") p.lead = cfg.leadInst;
      // 박자에 맞는 드럼으로 바꿈
      if (p.meter === "3/4" && p.drums !== "none") p.drums = /battle|orch|taiko/.test(p.drums) ? "waltzOrch" : "waltz";
      if (p.meter === "3/4" && p.drums === "none" && energy >= 1 && cfg.drums === "auto" && !st.noAutoWaltz) p.drums = "waltz";
      if (p.meter === "12/8" && p.drums !== "none") p.drums = th === "oriental" || p.drums === "janggu" ? "gutgeori" : "shuffle";
      p.melody = composeSong(r, MEL[song.mel] || MEL.ballad, bars, melScale, song.key % 12, p.leadCenter, p.spb, p.bs);
      p.chords = bars; p.voicings = []; let prev = null;
      for (const c of bars) { prev = voiceChord(c, prev); p.voicings.push(prev); }
      return p;
    }

    /* ---------- 악기 ---------- */
    let musicIn = null, padBus = null, musicGate = null, activePads = [], mixGain = null;
    function ensureMusicBus() {
      if (musicIn) return;
      // 반짝이는 고음을 살짝 눌러 귀가 편하게
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000; lp.Q.value = 0.5;
      const shelf = ctx.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 4500; shelf.gain.value = -3;
      musicGate = ctx.createGain();
      musicIn = ctx.createGain();
      mixGain = ctx.createGain(); // 테마마다 전체 크기 맞춤(악기 구성이 달라 크기가 다름)
      musicIn.connect(mixGain).connect(shelf).connect(lp).connect(musicGate).connect(bgmBus);
      padBus = ctx.createGain(); padBus.connect(musicIn);
    }
    const revSend = (node, amt) => { if (amt > 0 && !cfg.lowPower) { const s = ctx.createGain(); s.gain.value = amt; node.connect(s).connect(reverbIn); } };
    // ADSR 엔벨로프
    function adsr(g, t, peak, a, d, s, dur, rel) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.setTargetAtTime(peak * s, t + a, Math.max(0.01, d / 3));
      const end = t + Math.max(dur, a + 0.01);
      g.gain.setTargetAtTime(0.0001, end, Math.max(0.01, rel / 4));
      return end + rel * 1.5;
    }
    function fmVoice(f, t, dur, vol, ratio, index, decay, out, rev) {
      const g = ctx.createGain(); const stop = adsr(g, t, vol, 0.004, decay, 0.02, Math.min(dur, decay), decay * 0.5);
      const car = ctx.createOscillator(); car.frequency.value = f;
      const mod = ctx.createOscillator(); mod.frequency.value = f * ratio;
      const mg = ctx.createGain(); mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(f * index * 0.08, t + decay);
      mod.connect(mg).connect(car.frequency); car.connect(g).connect(out); revSend(g, rev);
      car.start(t); mod.start(t); car.stop(stop); mod.stop(stop);
    }
    // 반주·화음 악기 한 음
    function playInst(inst, f, t, dur, vol, out, rev = 0.4, opts = {}) {
      switch (inst) {
        case "none": return;
        case "bell": return fmVoice(f, t, dur, vol * 0.9, 3.5, 1.2, 2.2, out, rev + 0.2);
        case "musicbox": return fmVoice(f * 2, t, dur, vol * 0.75, 7.01, 0.7, 1.8, out, rev + 0.15);
        case "epiano": { // 로즈 피아노: 부드러운 타건 + 길게 남는 울림 + 살짝 흔들림
          const g = ctx.createGain(); const stop = adsr(g, t, vol * 1.1, 0.006, 1.2, 0.35, dur, 0.45);
          const car = ctx.createOscillator(); car.frequency.value = f;
          const mod = ctx.createOscillator(); mod.frequency.value = f; const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 1.1, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.6);
          mod.connect(mg).connect(car.frequency);
          const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 4.5; tg.gain.value = 0.18;
          const amp = ctx.createGain(); amp.gain.value = 0.82; trem.connect(tg).connect(amp.gain);
          car.connect(amp).connect(g).connect(out); revSend(g, rev);
          car.start(t); mod.start(t); trem.start(t); car.stop(stop); mod.stop(stop); trem.stop(stop);
          return;
        }
        case "pluck": case "zither": case "synthpluck": { // 하프·가야금·신스 플럭: 뜯은 뒤 길게 울리며 다음 음과 겹침
          const g = ctx.createGain();
          const ring = inst === "synthpluck" ? 0.9 : inst === "zither" ? 1.8 : 2.2;
          const stop = adsr(g, t, vol * (inst === "zither" ? 0.9 : 1), 0.004, ring, 0.05, Math.min(ring, Math.max(dur, 0.25)), ring * 0.4);
          const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = inst === "synthpluck" ? 4 : 1;
          const top = inst === "synthpluck" ? 5200 : inst === "zither" ? 3600 : 3000;
          lp.frequency.setValueAtTime(top, t); lp.frequency.exponentialRampToValueAtTime(inst === "synthpluck" ? 700 : 900, t + (inst === "synthpluck" ? 0.25 : 0.7));
          const types = inst === "synthpluck" ? ["sawtooth", "sawtooth"] : inst === "zither" ? ["sawtooth", "sine"] : ["triangle", "sine"];
          types.forEach((ty, i) => {
            const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f * (i && inst !== "synthpluck" ? 2 : 1); o.detune.value = inst === "synthpluck" ? (i ? 9 : -9) : 0;
            if (inst === "zither" && opts.bend) o.frequency.setTargetAtTime(f * Math.pow(2, opts.bend / 12), t + 0.22, 0.09); // 농현
            const og = ctx.createGain(); og.gain.value = i && inst !== "synthpluck" ? 0.35 : 1;
            o.connect(og).connect(lp); o.start(t); o.stop(stop);
          });
          lp.connect(g).connect(out); revSend(g, rev);
          return;
        }
        default: { // 지속음 악기 (sine·triangle·square·sawtooth)
          const g = ctx.createGain(); const stop = adsr(g, t, vol * (inst === "square" || inst === "sawtooth" ? 0.55 : 1), 0.02, 0.25, 0.7, dur * 0.92, 0.25);
          const o = ctx.createOscillator(); o.type = ["sine", "triangle", "square", "sawtooth"].includes(inst) ? inst : "triangle"; o.frequency.value = f;
          const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = inst === "square" ? 2200 : 3000;
          o.connect(lp).connect(g).connect(out); revSend(g, rev); o.start(t); o.stop(stop);
        }
      }
    }
    // 배경 화음 (끊김 없이 다음 화음과 겹침)
    function playPad(kind, notes, t, dur, cut, rev) {
      if (kind === "none") return;
      const fade = Math.min(1.2, dur * 0.35);
      // 슈퍼쏘: 톱니파를 너무 많이·넓게 겹치면 서로 맞부딪혀 '지지직' 잡음처럼 들려서 3겹·좁게
      const voices = kind === "supersaw" ? (cfg.lowPower ? [-8, 8] : [-13, 0, 13]) : cfg.lowPower ? [0] : [-7, 7];
      const wave = kind === "organ" ? "organ" : kind === "supersaw" || kind === "synth" || kind === "ajaeng" ? "sawtooth" : kind === "strings" ? "sawtooth" : kind === "warm" ? "triangle" : ["sine", "triangle", "square", "sawtooth"].includes(kind) ? kind : "triangle";
      const per = (kind === "supersaw" ? 0.009 : wave === "sawtooth" ? 0.016 : wave === "square" ? 0.013 : 0.026) / Math.sqrt(voices.length / 2);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cut * (kind === "strings" ? 1.1 : 1); lp.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + fade);
      g.gain.setValueAtTime(1, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + fade * 1.2);
      lp.connect(g).connect(padBus); revSend(g, rev + 0.15);
      const stop = t + dur + fade * 1.3;
      activePads = activePads.filter((x) => x.stop > ctx.currentTime); activePads.push({ g, stop });
      notes.forEach((m, i) => voices.forEach((det) => {
        const o = ctx.createOscillator(); if (wave === "organ") o.setPeriodicWave(organWave()); else o.type = wave; o.frequency.value = mtof(m); o.detune.value = det + (kind === "strings" ? Math.sin(i + det) * 4 : 0);
        if (kind === "strings" || kind === "ajaeng") { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = kind === "ajaeng" ? 4.2 + i * 0.4 : 4.8 + i * 0.3; vg.gain.value = kind === "ajaeng" ? 9 : 5; v.connect(vg).connect(o.detune); v.start(t); v.stop(stop); }
        const og = ctx.createGain(); og.gain.value = per;
        if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-0.7, Math.min(0.7, (i - 1.5) * 0.3 + det / 60)); o.connect(og).connect(pn).connect(lp); } else o.connect(og).connect(lp);
        o.start(t); o.stop(stop);
      }));
    }
    // 리드 멜로디 (이어지는 음은 미끄러지듯 연결)
    function playLead(inst, m, prevM, t, dur, vol, rev) {
      const f = mtof(m), pf = prevM ? mtof(prevM) : null;
      if (inst === "none") return;
      if (inst === "bell") return fmVoice(f, t, dur, vol * 0.8, 2.76, 1.4, Math.max(1.4, dur), musicIn, rev + 0.2);
      if (inst === "epiano") return playInst("epiano", f, t, dur, vol, musicIn, rev);
      if (inst === "erhu") return playGugak("haegeum", m, prevM, t, dur, vol, rev);
      if (inst === "violin" || inst === "cello") return playBowed(inst, inst === "cello" ? m - 12 : m, t, dur, vol * 1.25, rev);
      if (inst === "musicbox") return playInst("musicbox", f / 2, t, Math.max(dur, 1), vol * 1.15, musicIn, rev);
      if (inst === "glock") return fmVoice(f * 2, t, Math.max(dur, 1), vol * 0.9, 2.76, 0.5, 1.6, musicIn, rev + 0.15);
      if (inst === "organ") return playOrgan(m, t, dur, vol * 0.9, rev);
      if (GUGAK.has(inst)) return playGugak(inst, m, prevM, t, dur, vol * (inst === "piri" ? 0.85 : 1), rev);
      const g = ctx.createGain();
      const breathy = inst === "flute" || inst === "bamboo" || inst === "whistle";
      const a = inst === "horn" || inst === "choir" ? 0.09 : inst === "vocal" ? 0.012 : 0.05;
      const gate = inst === "vocal" ? Math.min(dur, 0.32) : dur;
      const stop = adsr(g, t, vol, a, 0.3, inst === "vocal" ? 0.6 : 0.85, gate * 0.97, inst === "vocal" ? 0.12 : 0.2);
      const o = ctx.createOscillator();
      o.type = inst === "lead" || inst === "horn" || inst === "trumpet" || inst === "vocal" || inst === "choir" ? "sawtooth" : "sine";
      const glide = pf && Math.abs(pf - f) < f * 0.6 && inst !== "vocal";
      if (glide) { o.frequency.setValueAtTime(pf, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); }
      else if (inst === "bamboo") { o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.1); }
      else o.frequency.setValueAtTime(f, t);
      // 늦게 들어오는 비브라토
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = inst === "lead" ? 5.8 : 5.1;
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (inst === "vocal" ? 0 : inst === "horn" ? 0.004 : 0.009), t + Math.min(0.45, dur * 0.6));
      lfo.connect(lg).connect(o.frequency);
      let out = o;
      if (inst === "lead" || inst === "horn") { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = inst === "horn" ? 1300 : 2600; o.connect(lp); out = lp; }
      if (inst === "trumpet") { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 1.2; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(3400, t + 0.05); lp.frequency.exponentialRampToValueAtTime(2200, t + 0.3); o.connect(lp); out = lp; }
      if (inst === "choir" || inst === "vocal") { // 모음 소리(아·오): 포먼트 두 개
        const mix = ctx.createGain(); const fm = inst === "choir" ? [[570, 0.9], [840, 0.6]] : [[730, 1], [1090, 0.7]];
        fm.forEach(([ff, gg]) => { const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = ff; bp.Q.value = 6; const bg = ctx.createGain(); bg.gain.value = gg * 2.2; o.connect(bp).connect(bg).connect(mix); });
        out = mix;
      }
      const lv = inst === "lead" ? 0.45 : inst === "horn" ? 0.7 : inst === "trumpet" ? 0.5 : inst === "vocal" ? 1.1 : inst === "choir" ? 1.2 : 1;
      const lg2 = ctx.createGain(); lg2.gain.value = lv;
      out.connect(lg2).connect(g).connect(musicIn); revSend(g, rev + (breathy ? 0.15 : 0.05));
      o.start(t); lfo.start(t); o.stop(stop); lfo.stop(stop);
      if (breathy) { // 숨소리
        const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 2.5;
        const ng = ctx.createGain(); adsr(ng, t, vol * (inst === "bamboo" ? 0.35 : 0.18), 0.04, 0.2, 0.5, dur * 0.9, 0.15);
        n.connect(bp).connect(ng).connect(musicIn); n.start(t, Math.random()); n.stop(stop);
      }
    }
    /* ---------- 합주 악기 (테마마다 다른 '진짜 악기' 색) ----------
     *  뜯는 현(기타·하프·피치카토·하프시코드·양금): 카플러스-스트롱 방식으로 실제 줄이 떨리듯 만든 소리.
     *   악기마다 음 두 개(낮은 음·높은 음)만 미리 만들어 두고 재생 속도로 음높이를 바꿈 → 메모리 적게 씀
     *  활로 켜는 현(첼로·바이올린·해금), 신스 스탭, 피아노, 첼레스타 */
    const KS_DEF = {
      guitar:      { len: 2.2, d: 0.9965, w: 0.5, soft: 0.55, pos: 0.18, gain: 1 },
      harp:        { len: 2.6, d: 0.9978, w: 0.5, soft: 0.7, pos: 0.3, gain: 0.9 },
      pizz:        { len: 0.7, d: 0.985, w: 0.5, soft: 0.6, pos: 0.25, gain: 1.2 },
      harpsichord: { len: 1.6, d: 0.997, w: 0.72, soft: 0.1, pos: 0.08, gain: 0.8 },
      dulcimer:    { len: 2.2, d: 0.9972, w: 0.62, soft: 0.25, pos: 0.12, gain: 0.85 },
      pipa:        { len: 0.6, d: 0.991, w: 0.6, soft: 0.2, pos: 0.1, gain: 1 },
      guzheng:     { len: 2.4, d: 0.998, w: 0.6, soft: 0.3, pos: 0.15, gain: 0.9 },
      ukulele:     { len: 1.1, d: 0.993, w: 0.5, soft: 0.5, pos: 0.2, gain: 1 },
      upright:     { len: 1.4, d: 0.992, w: 0.42, soft: 0.75, pos: 0.3, gain: 1.7 }, // 콘트라베이스 피치카토
      gayageum:    { len: 2.0, d: 0.9966, w: 0.5, soft: 0.6, pos: 0.22, gain: 1.05 },  // 명주실: 둥글고 따뜻한 뜯는 소리
      geomungo:    { len: 1.5, d: 0.9945, w: 0.55, soft: 0.45, pos: 0.1, gain: 1.3 },  // 술대로 내려치는 낮은 현
    };
    const ksCache = new Map();
    function ksBuffer(inst, base) {
      const key = inst + base; if (ksCache.has(key)) return ksCache.get(key);
      const d = KS_DEF[inst], sr = ctx.sampleRate, N = Math.max(2, Math.round(sr / mtof(base))), len = Math.floor(d.len * sr);
      const buf = ctx.createBuffer(1, len, sr), y = buf.getChannelData(0);
      let lp = 0; const P = Math.max(1, Math.floor(N * d.pos));
      for (let i = 0; i < N; i++) { lp = lp * d.soft + (Math.random() * 2 - 1) * (1 - d.soft); y[i] = lp; }
      for (let i = N - 1; i >= P; i--) y[i] -= y[i - P] * 0.9; // 줄을 뜯는 자리(음색)
      for (let i = N; i < len; i++) y[i] = d.d * (d.w * y[i - N] + (1 - d.w) * y[i - N - 1 < 0 ? 0 : i - N - 1]);
      let pk = 0; for (let i = 0; i < Math.min(len, N * 4); i++) pk = Math.max(pk, Math.abs(y[i]));
      const k = pk > 0 ? 0.9 / pk : 1; const fo = Math.floor(sr * 0.05);
      for (let i = 0; i < len; i++) y[i] *= k * (i > len - fo ? (len - i) / fo : 1);
      const out = { buf, f: sr / N }; ksCache.set(key, out); return out;
    }
    function playString(inst, m, t, dur, vol, rev, pan = 0, out = null, opts = {}) {
      const base = m < 57 ? 45 : 69, kb = ksBuffer(inst, base);
      const src = ctx.createBufferSource(); src.buffer = kb.buf; const rate = mtof(m) / kb.f; src.playbackRate.setValueAtTime(rate, t);
      if (opts.nong && dur > 0.3) { // 농현: 줄을 눌렀다 놓으며 떨기
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5 + Math.random();
        lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(rate * 0.014 * opts.nong, t + Math.min(0.45, dur * 0.5));
        lfo.connect(lg).connect(src.playbackRate); lfo.start(t + 0.12); lfo.stop(t + dur + 0.5);
      }
      if (opts.bend) src.playbackRate.setTargetAtTime(rate * Math.pow(2, opts.bend / 12), t + Math.max(0.15, dur * 0.45), 0.08); // 밀어 올리거나 꺾어 내림
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * KS_DEF[inst].gain, t);
      const end = t + Math.max(0.08, dur); g.gain.setTargetAtTime(0.0001, end, 0.06); // 손으로 줄을 막듯 멈춤
      let node = src.connect(g);
      if (pan && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; node = node.connect(pn); }
      node.connect(out || musicIn); revSend(g, rev);
      src.start(t); src.stop(Math.min(t + kb.buf.duration / src.playbackRate.value, end + 0.4));
    }
    function playBowed(inst, m, t, dur, vol, rev) { // 첼로·바이올린·해금
      const f = mtof(m), g = ctx.createGain();
      const a = inst === "erhu" ? 0.08 : 0.16;
      const stop = adsr(g, t, vol, a, 0.4, 0.8, dur * 0.95, 0.3);
      const o = ctx.createOscillator(); o.type = "sawtooth";
      if (inst === "erhu") { o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); } else o.frequency.setValueAtTime(f, t);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = inst === "erhu" ? 5.6 : 5;
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (inst === "erhu" ? 0.012 : 0.006), t + Math.min(0.5, dur * 0.5)); lfo.connect(lg).connect(o.frequency);
      const body = ctx.createBiquadFilter();
      if (inst === "erhu") { body.type = "bandpass"; body.frequency.value = 1300; body.Q.value = 1.6; } // 콧소리 같은 해금
      else { body.type = "lowpass"; body.frequency.value = inst === "cello" ? 1500 : 2800; body.Q.value = 0.9; }
      const air = ctx.createBiquadFilter(); air.type = "peaking"; air.frequency.value = inst === "cello" ? 250 : 900; air.gain.value = 4; air.Q.value = 1;
      o.connect(body).connect(air).connect(g).connect(musicIn); revSend(g, rev + 0.15);
      o.start(t); lfo.start(t); o.stop(stop); lfo.stop(stop);
      // 활이 줄을 긁는 소리
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; const nb = ctx.createBiquadFilter(); nb.type = "bandpass"; nb.frequency.value = inst === "cello" ? 1200 : 3000; nb.Q.value = 1;
      const ng = ctx.createGain(); adsr(ng, t, vol * 0.12, a, 0.3, 0.5, dur * 0.9, 0.2); n.connect(nb).connect(ng).connect(musicIn); n.start(t, Math.random()); n.stop(stop);
    }
    // 파이프오르간 음색(배음을 겹친 파형)
    let organPW = null;
    const organWave = () => organPW || (organPW = ctx.createPeriodicWave(new Float32Array([0, 1, 0.65, 0.4, 0.3, 0.12, 0.18, 0.05, 0.1]), new Float32Array(9)));
    function playOrgan(m, t, dur, vol, rev) {
      const g = ctx.createGain(); const stop = adsr(g, t, vol, 0.09, 0.2, 0.9, dur * 0.97, 0.25);
      [0, 12].forEach((oc, i) => { const o = ctx.createOscillator(); o.setPeriodicWave(organWave()); o.frequency.value = mtof(m + oc); o.detune.value = i ? 3 : 0; const og = ctx.createGain(); og.gain.value = i ? 0.35 : 1; o.connect(og).connect(g); o.start(t); o.stop(stop); });
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
      g.connect(lp).connect(musicIn); revSend(lp, rev + 0.25);
    }
    /* ---------- 국악기 ----------
     *  관악: 대금(청 울림이 섞인 낮고 굵은 대나무 피리), 단소(맑고 높은 세로 피리), 피리(겹서 → 콧소리 섞인 강한 소리)
     *  찰현: 해금(두 줄, 콧소리 + 활 긁는 소리, 넓은 농현), 아쟁(낮고 거친 활 소리)
     *  모든 음은 아래에서 밀어 올리며 시작(시김새), 길게 끄는 음은 늦게 깊어지는 농현 */
    const GUGAK = new Set(["daegeum", "danso", "piri", "haegeum", "ajaeng"]);
    function playGugak(inst, m, prevM, t, dur, vol, rev) {
      const f = mtof(m), pf = prevM ? mtof(prevM) : null;
      const wind = inst === "daegeum" || inst === "danso" || inst === "piri";
      const g = ctx.createGain();
      const a = inst === "ajaeng" ? 0.18 : inst === "haegeum" ? 0.06 : inst === "piri" ? 0.03 : 0.05;
      const stop = adsr(g, t, vol, a, 0.3, 0.85, dur * 0.97, inst === "ajaeng" ? 0.35 : 0.18);
      const o = ctx.createOscillator();
      o.type = inst === "danso" ? "triangle" : inst === "daegeum" ? "sine" : "sawtooth";
      // 시김새: 앞 음에서 미끄러지거나, 아래(피리는 더 깊게)에서 밀어 올림
      const scoop = inst === "piri" ? 0.9 : inst === "haegeum" ? 0.94 : inst === "ajaeng" ? 0.95 : 0.96;
      if (pf && Math.abs(pf - f) < f * 0.5) { o.frequency.setValueAtTime(pf, t); o.frequency.exponentialRampToValueAtTime(f, t + (inst === "haegeum" ? 0.1 : 0.07)); }
      else { o.frequency.setValueAtTime(f * scoop, t); o.frequency.exponentialRampToValueAtTime(f, t + (inst === "piri" ? 0.14 : 0.1)); }
      // 농현: 늦게 들어와 점점 깊어짐 (해금·피리는 넓게)
      const depth = { daegeum: 0.012, danso: 0.007, piri: 0.022, haegeum: 0.024, ajaeng: 0.012 }[inst];
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = inst === "ajaeng" ? 4.4 : inst === "danso" ? 5.4 : 5;
      lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + Math.min(0.25, dur * 0.3)); lg.gain.linearRampToValueAtTime(f * depth, t + Math.min(0.9, dur * 0.8));
      lfo.connect(lg).connect(o.frequency);
      const mix = ctx.createGain(); let lv = 1;
      if (inst === "piri") { // 겹서: 콧소리 포먼트 세 개 + 살짝 찌그러짐
        const sh = ctx.createWaveShaper(); sh.curve = curve(3); o.connect(sh);
        [[750, 2, 1], [1650, 3, 0.8], [2900, 4, 0.45]].forEach(([ff, q, gg]) => { const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = ff; bp.Q.value = q; const bg = ctx.createGain(); bg.gain.value = gg * 2; sh.connect(bp).connect(bg).connect(mix); });
        lv = 0.8;
      } else if (inst === "haegeum" || inst === "ajaeng") { // 해금: 1.1kHz 콧소리 / 아쟁: 낮고 거칠게
        const bp = ctx.createBiquadFilter(); bp.type = inst === "haegeum" ? "bandpass" : "lowpass"; bp.frequency.value = inst === "haegeum" ? 1150 : 1100; bp.Q.value = inst === "haegeum" ? 1.4 : 0.8;
        const pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = inst === "haegeum" ? 2500 : 420; pk.gain.value = 6; pk.Q.value = 1.2;
        o.connect(bp).connect(pk).connect(mix); lv = inst === "haegeum" ? 1.15 : 0.9;
      } else if (inst === "daegeum") { // 대금: 굵은 기음 + 청(갈대막)이 떨리는 '지잉' 소리 약간
        o.connect(mix);
        const buzz = ctx.createOscillator(); buzz.type = "sawtooth"; buzz.frequency.value = f; o.frequency && lg.connect(buzz.frequency);
        const bb = ctx.createBiquadFilter(); bb.type = "bandpass"; bb.frequency.value = 2400; bb.Q.value = 3; const bg = ctx.createGain(); bg.gain.value = 0.12;
        buzz.connect(bb).connect(bg).connect(mix); buzz.start(t); buzz.stop(stop);
      } else { // 단소: 맑은 소리에 2배음 살짝
        o.connect(mix); const h = ctx.createOscillator(); h.frequency.value = f * 2; const hg = ctx.createGain(); hg.gain.value = 0.08; h.connect(hg).connect(mix); h.start(t); h.stop(stop);
      }
      const lg2 = ctx.createGain(); lg2.gain.value = lv;
      mix.connect(lg2).connect(g).connect(musicIn); revSend(g, rev + 0.15);
      o.start(t); lfo.start(t); o.stop(stop); lfo.stop(stop);
      // 숨소리(관악) / 활 긁는 소리(찰현)
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
      bp.frequency.value = wind ? Math.min(6000, f * 2.2) : inst === "ajaeng" ? 900 : 3200; bp.Q.value = wind ? 2 : 1.2;
      const ng = ctx.createGain(); adsr(ng, t, vol * (inst === "daegeum" ? 0.4 : inst === "danso" ? 0.32 : inst === "piri" ? 0.1 : inst === "ajaeng" ? 0.35 : 0.16), 0.03, 0.25, 0.45, dur * 0.9, 0.15);
      n.connect(bp).connect(ng).connect(musicIn); n.start(t, Math.random()); n.stop(stop);
    }
    // 국악 타악기: 장구(덩·쿵·덕·기덕), 북, 징, 꽹과리, 박
    function jgGung(at, v, f = 105) { lowDrum(at, v, f); noiseHit(at, v * 0.12, "lowpass", 400, 0.08); } // 궁편: 낮고 둥근 '쿵'
    function jgChae(at, v) { noiseHit(at, v * 0.55, "bandpass", 2600, 0.05, 1.5, 0.15); const o = ctx.createOscillator(); o.frequency.setValueAtTime(900, at); o.frequency.exponentialRampToValueAtTime(600, at + 0.03); const g = ctx.createGain(); g.gain.setValueAtTime(v * 0.5, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05); o.connect(g).connect(musicIn); o.start(at); o.stop(at + 0.06); } // 채편: 날카로운 '덕'
    const jgDeong = (at, v) => { jgGung(at, v); jgChae(at, v * 0.9); };
    const jgGiDeok = (at, v, six) => { jgChae(at - six * 0.35, v * 0.5); jgChae(at, v); };
    const buk = (at, v) => lowDrum(at, v, 64);
    const jing = (m, at, v) => { fmVoice(mtof(m), at, 4.5, v, 1.41, 1.6, 4.5, musicIn, 0.7); fmVoice(mtof(m) * 1.5, at, 3, v * 0.3, 1.19, 1, 3, musicIn, 0.7); };
    function kkwaeng(at, v) { fmVoice(2100, at, 0.25, v, 1.47, 4, 0.22, musicIn, 0.2); noiseHit(at, v * 0.6, "highpass", 4000, 0.08); } // 꽹과리 '깽'
    const bak = (at, v) => { noiseHit(at, v, "bandpass", 1700, 0.06, 4, 0.3); noiseHit(at + 0.008, v * 0.8, "bandpass", 2300, 0.05, 4, 0.3); }; // 박 '딱'

    function playEnsInst(inst, m, t, dur, vol, rev, pan) {
      if (GUGAK.has(inst)) return playGugak(inst, m, null, t, dur, vol, rev);
      if (inst === "gayageum" || inst === "geomungo") return playString(inst, m, t, dur, vol, rev, pan, null, { nong: dur > 0.5 ? 1 : 0, bend: dur > 0.9 && Math.random() < 0.25 ? (Math.random() < 0.6 ? 1 : -1) : 0 });
      if (KS_DEF[inst]) return playString(inst, m, t, dur, vol, rev, pan);
      if (inst === "cello" || inst === "violin" || inst === "erhu") return playBowed(inst, m, t, dur, vol, rev);
      const f = mtof(m);
      if (inst === "celesta") return fmVoice(f, t, dur, vol, 4, 0.7, 1.1, musicIn, rev + 0.2);
      if (inst === "glock") return fmVoice(f * 2, t, dur, vol * 0.8, 2.76, 0.5, 1.6, musicIn, rev + 0.15); // 글로켄슈필: 맑은 쇠막대
      if (inst === "organ") return playOrgan(m, t, dur, vol, rev);
      if (inst === "choirpad") return playLead("choir", m, null, t, dur, vol, rev + 0.2);
      if (inst === "dguitar") return playString("guitar", m, t, dur, vol * 1.4, rev * 0.4, pan, distIn()); // 일렉 기타(찌그러뜨림)
      if (inst === "spic" || inst === "brass" || inst === "synthbass") { // 짧게 끊는 현악·금관 화음·신스 베이스
        const g = ctx.createGain();
        const a = inst === "brass" ? 0.025 : 0.004, sus = inst === "brass" ? 0.7 : 0.25;
        const stop = adsr(g, t, vol, a, inst === "brass" ? 0.25 : 0.09, sus, dur, inst === "brass" ? 0.12 : 0.05);
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = inst === "synthbass" ? 5 : 1;
        if (inst === "brass") { lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(2600, t + 0.07); lp.frequency.exponentialRampToValueAtTime(1500, t + 0.35); }
        else if (inst === "synthbass") { lp.frequency.setValueAtTime(1800, t); lp.frequency.exponentialRampToValueAtTime(350, t + 0.12); }
        else { lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(900, t + 0.1); }
        const dets = inst === "brass" ? [-6, 0, 6] : inst === "spic" ? [-5, 5] : [0];
        dets.forEach((dt) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(stop); });
        if (inst === "synthbass") { const sub = ctx.createOscillator(); sub.type = "square"; sub.frequency.value = f / 2; const sg = ctx.createGain(); sg.gain.value = 0.35; sub.connect(sg).connect(lp); sub.start(t); sub.stop(stop); }
        let node = lp.connect(g);
        if (pan && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; node = node.connect(pn); }
        node.connect(musicIn); revSend(g, inst === "synthbass" ? 0 : rev * 0.6); return;
      }
      if (inst === "chip") { const g = ctx.createGain(); const stop = adsr(g, t, vol * 0.5, 0.002, 0.08, 0.3, Math.min(dur, 0.12), 0.05); const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = f; const lp = ctx.createBiquadFilter(); lp.frequency.value = 5000; o.connect(lp).connect(g).connect(musicIn); revSend(g, rev); o.start(t); o.stop(stop); return; }
      if (inst === "piano") { fmVoice(f, t, dur, vol, 1, 1.6, 0.9, musicIn, rev); fmVoice(f * 2, t, dur, vol * 0.25, 1, 0.8, 0.5, musicIn, rev); return; }
      if (inst === "stab") { // 신스 스탭: 두 톱니파를 어긋나게 + 필터가 빠르게 닫힘
        const g = ctx.createGain(); const stop = adsr(g, t, vol * 0.6, 0.004, 0.12, 0.2, dur, 0.08);
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 3; lp.frequency.setValueAtTime(3500, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.18);
        [-12, 12].forEach((dt) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(stop); });
        lp.connect(g).connect(musicIn); revSend(g, rev); return;
      }
    }
    // 합주 패턴: 한 마디(16칸) 안에서 언제 어떻게 치는지
    let distNode = null;
    function distIn() { // 일렉 기타용 찌그러뜨림 회로(처음 쓸 때 한 번만 만듦)
      if (distNode) return distNode;
      const sh = ctx.createWaveShaper(); sh.curve = curve(28); sh.oversample = "2x";
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 90;
      const g = ctx.createGain(); g.gain.value = 0.24;
      sh.connect(hp).connect(lp).connect(g).connect(musicIn);
      distNode = sh; return sh;
    }
    // 스케일 음으로 빠르게 훑는 글리산도(하프·고쟁)
    function glissRun(inst, p, from, n, t, gap, vol, down = false) {
      const out = []; let m = from;
      while (out.length < n && m < from + 36) { if (p.scale.includes(((m % 12) + 12) % 12)) out.push(m); m++; }
      (down ? out.reverse() : out).forEach((x, i) => playEnsInst(inst, x, t + i * gap, 1.2, vol * (0.7 + 0.3 * (i / out.length)), p.rev, -0.6 + (1.2 * i) / out.length));
    }

    /* ---------- 전투 편곡 ----------
     *  전투 곡 위에 얹는 층: 낮은 현·신스가 16분으로 몰아치는 오스티나토, 강박에 터지는 금관·스탭 화음,
     *  B(후렴)에서 합창·더 잦은 강세, 악절 끝 탐탐 필인, 악절 시작 심벌(동양풍은 징) */
    const BATTLE_ARR = {
      fantasy:  { ost: "spic", hit: "brass", choir: true, fill: "timp" },
      otome:    { ost: "spic", hit: "brass", gliss: "harp", fill: "timp", hitV: 0.75 },
      hunter:   { ost: "synthbass", hit: "stab", fill: "snare", riser: true },
      daily:    { ost: "dguitar", hit: "dguitar", fill: "tom" },
      oriental: { ost: "gayageum", hit: "jing", gliss: "gayageum", fill: "buk", kkwaeng: true },
      idol:     { ost: "synthbass", hit: "brass", fill: "snare", riser: true, hitV: 0.8 },
      dark:     { ost: "spic", hit: "brass", choir: true, toll: true, fill: "timp" },
    };
    const OST = [0, 0, 12, 0, 7, 0, 12, 0, 0, 0, 12, 0, 7, 12, 7, 0];
    function playBattle(p, bar, s, t, six, barDur, voicing, chord, root, sec, hi) {
      const B = p.battle, amt = Math.max(0.35, cfg.ensemble); if (!B || cfg.lowPower) return;
      const dyn = sec === 2 ? 1.15 : sec < 0 ? 0.8 : 1;
      // 오스티나토
      if (p.meter === "4/4") {
        if (B.ost === "pipa") { // 비파 트레몰로: 화음 음을 32분으로 떨며 긁음
          if (s % 4 === 0) { const tones = voicing.map((m) => m + 12); const m = tones[(s / 4 + hi) % tones.length]; for (let k = 0; k < 8; k++) playEnsInst("pipa", m, t + k * six / 2, six * 0.6, 0.022 * amt * dyn * (k ? 0.8 : 1.1), p.rev * 0.5, 0.25); }
        } else {
          const base = 40 + ((root - 4 + 12) % 12), iv = OST[s], acc = s % 4 === 0 ? 1.15 : 0.85;
          if (B.ost === "dguitar") { if (s % 2 === 0) playEnsInst("dguitar", base + (iv === 12 ? 0 : iv), t, six * 1.6, 0.03 * amt * dyn * acc, 0.1, 0); }
          else playEnsInst(B.ost, base + iv + (B.ost === "spic" || B.ost === "gayageum" ? 12 : 0), t, six * (B.ost === "synthbass" ? 0.9 : 0.8), (B.ost === "synthbass" ? 0.045 : 0.034) * amt * dyn * acc, p.rev, s % 2 ? 0.2 : -0.2);
        }
      }
      if (sec < 0) return; // 첫 두 마디는 오스티나토로만 긴장을 쌓음
      // 강박 화음
      const accents = sec === 2 ? [0, 3, 6, 10, 12] : hi % 2 ? [0, 6, 12] : [0];
      if (accents.includes(s)) {
        const hv = (B.hitV || 1) * amt * dyn * (s === 0 ? 1.1 : 0.85);
        if (B.hit === "jing") { if (s === 0 && hi % 2 === 0) jing(root + 36, t, 0.03 * hv); buk(t, 0.17 * hv); if (s) jgChae(t, 0.08 * hv); }
        else if (B.hit === "gong") { if (s === 0 && hi % 2 === 0) gongNote(root + 36, t, 0.03 * hv); lowDrum(t, 0.16 * hv, 62); }
        else if (B.hit === "dguitar") [0, 7, 12].forEach((iv, i) => playEnsInst("dguitar", 40 + ((root - 4 + 12) % 12) + iv, t + i * 0.006, six * (s === 0 ? 3.5 : 1.8), 0.035 * hv, 0.15, (i - 1) * 0.3));
        else voicing.slice(0, 3).forEach((m, i) => playEnsInst(B.hit, m + (B.hit === "brass" ? 0 : 12), t + i * 0.004, six * (s === 0 ? 3 : 1.6), (B.hit === "brass" ? 0.03 : 0.034) * hv, p.rev, (i - 1) * 0.35));
      }
      // 후렴 합창, 다크의 종
      if (B.choir && sec >= 2 && s === 0) voicing.slice(0, 3).forEach((m, i) => playLead("choir", m + 12, null, t + i * 0.01, barDur * 0.95, 0.014 * amt, p.rev + 0.2));
      if (B.toll && hi % 4 === 0 && s === 0) fmVoice(mtof(root + 48), t, 3, 0.035 * amt, 2.76, 2.2, 3, musicIn, 0.8);
      // 악절 시작 글리산도 / 후렴 직전 내려오는 글리산도
      if (B.gliss && s === 0 && hi % 4 === 0) glissRun(B.gliss, p, voicing[0], 9, t, 0.028, 0.035 * amt);
      if (B.gliss && hi === 7 && s === 8) glissRun(B.gliss, p, voicing[0] + 12, 9, t, 0.03, 0.035 * amt, true);
      if (B.riser && hi === 7 && s === 0) bgmRiser(t, barDur, 0.006);
      // 악절 끝 필인
      if (hi % 4 === 3 && s >= 12) {
        if (B.fill === "timp") { timpani(root + 36, t, 0.07 + (s - 12) * 0.025); timpani(root + 36, t + six / 2, 0.06 + (s - 12) * 0.025); }
        else if (B.fill === "tom") lowDrum(t, 0.14 * amt, [190, 160, 130, 105][s - 12]);
        else if (B.fill === "buk") { buk(t, 0.15 * amt); jgChae(t + six / 2, 0.06 * amt); if (s === 15) buk(t + six / 2, 0.18 * amt); }
        else if (B.fill === "dagu") { lowDrum(t, 0.15 * amt, 75); if (s === 15) lowDrum(t + six / 2, 0.18 * amt, 68); }
        else if (B.fill === "snare") { snare(t, 0.02 + (s - 12) * 0.008); snare(t + six / 2, 0.02 + (s - 12) * 0.008); }
      }
      if (hi % 4 === 0 && s === 0 && B.hit !== "gong" && B.hit !== "jing") crash(t, 0.022);
      if (B.kkwaeng && sec === 2 && s % 2 === 0) kkwaeng(t, s % 4 ? 0.012 : 0.022); // 후렴: 꽹과리
    }

    let counterPrev = null, counterPrevLead = null;
    function playEnsemble(p, bar, s, t, six, barDur, voicing, chord, root, sec) {
      const amt = cfg.ensemble; if (!p.ens || !(amt > 0.01) || cfg.lowPower) return;
      const dyn = sec >= 0 ? SEC_DYN[sec] : 0.85;
      for (const L of p.ens) {
        if (L.sec && !L.sec.includes(sec)) continue;
        const v = (L.v || 1) * amt * dyn, rev = p.rev;
        switch (L.p) {
          case "roll": { // 하프처럼 아래에서 위로 굴리기
            if (s === 0) { const ns = [voicing[0] - 12, ...voicing, voicing[1] + 12]; ns.forEach((m, i) => playEnsInst(L.i, m, t + i * six * 0.45, barDur * 0.9, 0.05 * v, rev, -0.5 + i / ns.length)); }
            else if (s === p.spb / 2 && p.energy >= 1) [voicing[1] + 12, voicing[2 % voicing.length] + 12].forEach((m, i) => playEnsInst(L.i, m, t + i * six * 0.5, barDur * 0.45, 0.035 * v, rev, 0.3));
            break;
          }
          case "strum": { // 기타 스트로크: 다운(1·3박) 업(사이)
            const pat = p.meter === "3/4" ? (p.energy >= 1 ? [0, 4, 8] : [0]) : p.meter === "12/8" ? (p.energy >= 1 ? [0, 3, 6, 9] : [0, 6]) : p.energy >= 2 ? [0, 4, 6, 8, 10, 12, 14] : p.energy === 1 ? [0, 6, 8, 12, 14] : [0, 8];
            if (!pat.includes(s)) break;
            const down = p.meter === "12/8" ? s % 6 === 0 : s % 4 === 0, ns = [root + 40 + (root > 7 ? -12 : 0), ...voicing.slice(0, 4)];
            const order = down ? ns : ns.slice(1).reverse();
            order.forEach((m, i) => playEnsInst(L.i, m, t + i * 0.011, down ? six * 3.6 : six * 1.8, (down ? 0.04 : 0.024) * v, rev * 0.6, -0.2 + i * 0.1));
            break;
          }
          case "offstab": { // 엇박에 짧게 치는 화음
            if (p.comp && L.i === "piano") break;
            const pat = p.meter === "3/4" ? [4, 8] : p.meter === "12/8" ? [3, 9] : p.energy >= 2 ? [2, 6, 10, 14] : [4, 12];
            if (pat.includes(s)) voicing.slice(0, 3).forEach((m, i) => playEnsInst(L.i, m + (L.i === "piano" || L.i === "ukulele" ? 12 : 0), t + i * 0.006, six * 1.3, 0.03 * v, rev * 0.7, (i - 1) * 0.3));
            break;
          }
          case "pizz": { // 현악 피치카토: 박마다 화음 음을 번갈아
            if (s % p.bs === 0 && (p.energy >= 1 || s === 0)) { const k = s / p.bs, tones = [root + 48, (chord[1] % 12) + 48, (chord[2 % chord.length] % 12) + 48, root + 60]; playEnsInst(L.i, tones[(k + bar) % 4], t, six * 2, 0.06 * v, rev, k % 2 ? 0.35 : -0.35); }
            break;
          }
          case "counter": { // 대선율: 길게 켜는 두 번째 멜로디(멜로디와 반대로 움직임)
            const lo = L.i === "cello" ? 48 : L.i === "violin" ? 74 : 67, hi = lo + 14;
            if (s !== 0 && !(p.energy >= 1 && s === p.spb / 2)) break;
            const pcs = chord.map((m) => ((m % 12) + 12) % 12), cand = [];
            for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12)) cand.push(m);
            if (!cand.length) break;
            const prev = counterPrev == null ? cand[Math.floor(cand.length / 2)] : counterPrev;
            const leadDown = lastLead != null && counterPrevLead != null && lastLead < counterPrevLead;
            const opts = cand.filter((m) => m !== prev && Math.abs(m - prev) <= 5);
            const ups = opts.filter((m) => m > prev), downs = opts.filter((m) => m < prev);
            const pool = leadDown ? (ups.length ? ups : downs) : (downs.length ? downs : ups); // 멜로디와 반대 방향으로
            const pick = pool.length ? pool.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev))[0] : cand.includes(prev) ? prev : cand[0];
            counterPrev = Math.max(lo, Math.min(hi, pick)); counterPrevLead = lastLead;
            playEnsInst(L.i, counterPrev, t, (p.energy >= 1 ? barDur / 2 : barDur) * 0.98, (L.i === "cello" ? 0.05 : 0.035) * v, rev);
            break;
          }
          case "pad": { // 합창: 마디마다 화음을 길게 '아—'
            if (s === 0) voicing.slice(0, 3).forEach((m, i) => playEnsInst(L.i, m + 12, t + i * 0.01, barDur * 0.97, 0.013 * v, rev, 0));
            break;
          }
          case "trem": { // 낮은 현의 트레몰로: 같은 음을 빠르게 떨며 긁음(불안한 느낌)
            const lowR = voicing[0] - 12, m = s % 2 ? lowR + 7 : lowR;
            playEnsInst("spic", m, t, six * 0.9, 0.011 * v * (s === 0 ? 1.3 : 1), rev, s % 2 ? 0.25 : -0.25);
            break;
          }
          case "gaya": { // 가야금 반주: 5음 음계 화음 음을 뜯고, 긴 음엔 농현
            const tones = voicing.map((m) => m + 12);
            if (p.meter === "12/8") { if (s % 3 !== 1) playEnsInst(L.i, tones[(s + bar) % tones.length], t, six * 2.5, (s % 3 ? 0.022 : 0.03) * v, rev, 0.25); break; }
            if (p.energy === 0) { if (s === 0 || s === p.spb / 2) { playEnsInst(L.i, tones[0], t, barDur * 0.5, 0.034 * v, rev, 0.2); playEnsInst(L.i, tones[2 % tones.length], t + 0.05, barDur * 0.45, 0.026 * v, rev, 0.35); } break; }
            if (s % 2 === 0) { const pat = [0, 2, 1, 2, 3, 2, 1, 2]; const m = tones[pat[s / 2] % tones.length]; playEnsInst(L.i, m, t, six * (s === 0 || s === 8 ? 4 : 2.2), (s === 0 ? 0.034 : s === 8 ? 0.028 : 0.021) * v, rev, 0.25); }
            break;
          }
          case "broken": { // 피아노 분산화음(8분): 아래-위로 물결치듯
            if (p.meter === "4/4" && s % 2 === 0) { const ns = [voicing[0] - 12, voicing[1], voicing[2 % voicing.length], voicing[0] + 12, voicing[2 % voicing.length], voicing[1], voicing[0] + 12, voicing[1] + 12]; playEnsInst(L.i, ns[s / 2], t, six * 4, (s === 0 ? 0.026 : 0.019) * v, rev, (s / 2) % 2 ? 0.2 : -0.2); }
            break;
          }
          case "gliss": { // 고쟁·하프: 악절이 시작할 때 스케일로 촤라락
            if (s === 0 && sec >= 0 && bar % 4 === 2) glissRun(L.i, p, voicing[0], 10, t, 0.032, 0.035 * v);
            break;
          }
          case "tremolo": { // 비파: 긴 음을 떨며 긁는 소리
            if (s === 0 || s === p.spb / 2) { const m = voicing[(bar + s) % voicing.length] + 12; const n = p.spb; for (let k = 0; k < n; k++) playEnsInst(L.i, m, t + k * six / 2, six * 0.6, 0.016 * v * (1 - k / (n * 1.6)), rev * 0.5, 0.3); }
            break;
          }
          case "glock": { // 멜로디 중 센박 음을 한 옥타브 위에서 반짝 겹쳐 줌
            if (p.lead === "none" || cfg.lowPower || bar < 2) break;
            const mbar = p.melody[(bar - 2) % p.melody.length];
            for (const n of mbar) if (n.st === s && (n.st % p.bs === 0 || n.len >= 6)) playEnsInst(L.i, n.m + 12, t + 0.004, Math.min(n.len * six, 1.2), 0.03 * v, rev + 0.1, 0.25);
            break;
          }
        }
      }
    }
    function playBass(m, t, dur, vol, style) {
      const g = ctx.createGain(); const stop = adsr(g, t, vol, 0.008, 0.2, style === "synth" ? 0.55 : 0.8, dur * 0.95, 0.12);
      const o = ctx.createOscillator(); o.type = style === "synth" ? "sawtooth" : "triangle"; o.frequency.value = mtof(m);
      const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = mtof(m);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = style === "synth" ? 900 : 650;
      const sg = ctx.createGain(); sg.gain.value = 0.7;
      o.connect(lp).connect(g); sub.connect(sg).connect(g); g.connect(musicIn);
      o.start(t); sub.start(t); o.stop(stop); sub.stop(stop);
    }

    /* ---------- 타악기 (모두 '드럼 킥·팀파니 세기' 설정을 따름) ---------- */
    const KK = () => cfg.kick;
    function kick(at, v = 0.3, f0 = 120) { v *= KK(); if (v <= 0.003) return; const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(48, at + 0.12); const g = ctx.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28); o.connect(g).connect(musicIn); o.start(at); o.stop(at + 0.3); }
    function noiseHit(at, v, type, f, len, q = 1, rev = 0) { if (v <= 0.002) return; const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len); s.connect(fl).connect(g).connect(musicIn); revSend(g, rev); s.start(at, Math.random()); s.stop(at + len + 0.02); }
    const hat = (at, v = 0.02, open = false) => noiseHit(at, open ? v * 0.6 : v, "highpass", open ? 9000 : 7500, open ? 0.11 : 0.035); // 열린 하이햇은 짧고 작게(길면 '치익' 잡음처럼 깔림)
    const snare = (at, v = 0.06) => { noiseHit(at, v * KK(), "bandpass", 1900, 0.16, 0.8, 0.25); const o = ctx.createOscillator(); o.frequency.setValueAtTime(220, at); o.frequency.exponentialRampToValueAtTime(160, at + 0.08); const g = ctx.createGain(); g.gain.setValueAtTime(v * 0.6 * KK(), at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.1); o.connect(g).connect(musicIn); o.start(at); o.stop(at + 0.12); };
    const clap = (at, v = 0.06) => { for (let i = 0; i < 3; i++) noiseHit(at + i * 0.011, v * KK() * (i === 2 ? 1 : 0.6), "bandpass", 1300, i === 2 ? 0.14 : 0.02, 1.2, 0.15); };
    const crash = (at, v = 0.03) => noiseHit(at, v * 0.7, "highpass", 6500, 1.1, 0.5, 0.2);
    const lowDrum = (at, v, f0 = 95) => { v *= KK(); if (v <= 0.003) return; const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0 * 1.3, at); o.frequency.exponentialRampToValueAtTime(f0, at + 0.06); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(v, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.4); o.connect(g).connect(musicIn); revSend(g, 0.25); o.start(at); o.stop(at + 0.45); };
    const rim = (at, v = 0.04) => { noiseHit(at, v, "bandpass", 2600, 0.05, 3); const o = ctx.createOscillator(); o.frequency.value = 620; const g = ctx.createGain(); g.gain.setValueAtTime(v * 0.7, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06); o.connect(g).connect(musicIn); o.start(at); o.stop(at + 0.08); };
    const timpani = (m, at, v = 0.16) => lowDrum(at, v, mtof(m));
    const gongNote = (m, at, v = 0.04) => fmVoice(mtof(m), at, 3, v, 1.414, 2.5, 3, musicIn, 0.6);
    function bgmRiser(at, dur, v = 0.02) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = "bandpass"; fl.Q.value = 1.5; fl.frequency.setValueAtTime(400, at); fl.frequency.exponentialRampToValueAtTime(8000, at + dur); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + dur); g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.05); s.connect(fl).connect(g).connect(musicIn); s.start(at); s.stop(at + dur + 0.1); }
    // 사이드체인: 킥마다 화음을 살짝 눌렀다 올림. 한 번에 뚝 떨어뜨리면 '틱틱' 잡음이 나서 아주 짧게 미끄러지듯 내림
    function kick808(at, v) { v *= KK(); if (v <= 0.003) return; const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(46, at + 0.09); const g = ctx.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.7); o.connect(g).connect(musicIn); o.start(at); o.stop(at + 0.75); }
    function cymSwell(at, dur, v) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = "highpass"; fl.frequency.value = 5500; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + dur * 0.95); g.gain.linearRampToValueAtTime(0.0001, at + dur + 0.05); s.connect(fl).connect(g).connect(musicIn); revSend(g, 0.4); s.start(at); s.stop(at + dur + 0.1); }
    function duckPads(at, beat) { if (!padBus) return; const g = padBus.gain; g.setValueAtTime(1, at); g.linearRampToValueAtTime(0.5, at + 0.012); g.linearRampToValueAtTime(1, at + beat * 0.7); }

    /* ---------- 시퀀서 (16분음표 단위) ---------- */
    let seqTimer = 0, nextTime = 0, step = 0, preset = null, presetKey = null, curKey = null;
    let introLeft = 0, lastLead = null;
    const SEC_DYN = [0.92, 1, 1.12, 1.04]; // A·A′·B·A″ 세기 (B에서 살짝 북돋움)
    function scheduleStep(at) {
      const p = preset;
      const spb = p.spb, bs = p.bs, beat = 60 / p.bpm, six = beat / bs, barDur = six * spb;
      const bar = Math.floor(step / spb), s = step % spb;
      const hi = (bar - 2 + 32) % 16; // 노래(16마디) 안에서 이번 마디 자리. 첫 두 마디는 끝부분 화음으로 시작(자연스럽게 1마디로 이어짐)
      const voicing = p.voicings[hi], chord = p.chords[hi];
      const root = chord.bass ?? ((chord[0] % 12) + 12) % 12;
      const swing = p.swing && s % 4 === 2 ? six * p.swing * 2 : 0;
      const t = at + swing;
      const intro = introLeft > 0;
      const half = spb / 2;

      // 화음·드론: 마디 첫 박에, 다음 마디까지 겹쳐 이어짐
      if (s === 0) {
        playPad(p.pad, voicing, at, barDur, p.padCut, p.rev);
        if (p.drone) playPad(p.droneInst || "warm", [36 + root, 43 + root], at, barDur, 600, p.rev);
        if (p.theme === "oriental" && step === 0) bak(at, 0.09); // 사극: 박을 '딱' 치며 시작
      }
      // 베이스 (배경 화음과 반주를 모두 '없음'으로 하면 같이 쉼)
      if (p.bassInst) { // 테마 악기가 베이스를 맡음
        const bm = (root > 4 ? 48 : 60) + root - 12, B = p.bassInst;
        if (B === "upright") { // 콘트라베이스 워킹: 박마다 한 음씩 걸어감
          if (s % p.bs === 0 && (p.energy >= 1 || s === 0 || s === p.spb / 2)) {
            const k = s / p.bs, nc = p.chords[(hi + 1) % 16], nr = nc.bass ?? ((nc[0] % 12) + 12) % 12;
            const third = chord[1] - chord[0];
            const walk = [0, third, 7, null][k % 4];
            let nb = bm + ((nr - root + 12) % 12); if (nb > bm + 6) nb -= 12;
            const m = walk == null ? (nb === bm ? bm + 7 : nb - 1) : bm + walk; // 마지막 박은 다음 화음 바로 아래 음으로 다가감
            playEnsInst("upright", m, t, beat * 0.95, k ? 0.07 : 0.085, p.rev * 0.3, -0.1);
          }
        } else if (B === "synthbass") { // 8분 펄스 + 옥타브
          if (p.energy === 0) { if (s === 0) playEnsInst(B, bm, at, barDur * 0.9, 0.045, 0, 0); }
          else if (s % 2 === 0) playEnsInst(B, bm + (s % 4 === 2 && p.energy >= 2 ? 12 : 0), at, six * 1.6, s % 4 ? 0.035 : 0.045, 0, 0);
        } else if (B === "cello" || B === "organ") { // 길게 받치는 저음(첼로·오르간 페달)
          const lowM = bm;
          if (s === 0) playEnsInst(B, lowM, at, (p.energy >= 2 && p.meter === "4/4" ? barDur / 2 : barDur) * 0.96, B === "organ" ? 0.05 : 0.06, p.rev * 0.6, -0.2);
          else if (s === p.spb / 2 && p.energy >= 2 && p.meter === "4/4") playEnsInst(B, lowM + 7, at, barDur / 2 * 0.96, B === "organ" ? 0.045 : 0.055, p.rev * 0.6, -0.2);
        } else { // 거문고: 술대로 내려치는 낮은 현
          if (s === 0) playEnsInst(B, bm, at, beat * 2.5, 0.075, p.rev * 0.5, -0.15);
          else if (p.energy >= 1 && s === p.spb / 2) playEnsInst(B, bm + (hi % 2 ? 7 : 0), at, beat * 1.8, 0.055, p.rev * 0.5, -0.15);
          else if (p.energy >= 2 && p.meter === "4/4" && (s === 6 || s === 14)) playEnsInst(B, bm + 12, at, beat * 0.8, 0.035, p.rev * 0.5, -0.15);
        }
      } else if (p.pad !== "none" || p.arp !== "none") {
        const bassM = (root > 4 ? 36 : 48) + root;
        const fifth = bassM + 7;
        if (p.meter === "3/4") { // 쿵-짝-짝: 첫 박만 베이스
          if (s === 0) playBass(bassM, at, beat * (p.energy >= 2 ? 1.6 : 2.6), 0.09, "warm");
          if (p.energy >= 2 && s === 8) playBass(fifth, at, beat * 0.8, 0.07, "warm");
        } else if (p.meter === "12/8") {
          if (s === 0) playBass(bassM, at, beat * 1.7, 0.09, "warm");
          if (s === 6 && p.energy >= 1) playBass(bar % 2 ? fifth : bassM, at, beat * 1.4, 0.075, "warm");
        } else if (p.drums === "kpop" || (p.energy >= 3 && p.drums !== "orch")) { if (s % 2 === 0) playBass(bassM + (p.drums === "kpop" && s % 4 === 2 ? 12 : 0), at, six * 1.6, 0.11, "synth"); }
        else if (p.energy === 2) { if (s % 4 === 0) playBass(s === 8 ? fifth : bassM, at, beat * 0.9, 0.1, "warm"); }
        else if (p.energy === 1) { if (s === 0 || s === 8) playBass(s === 8 && bar % 2 ? fifth : bassM, at, beat * (s === 8 ? 1.45 : 1.9), 0.09, "warm"); }
        else if (s === 0) playBass(bassM, at, barDur * 0.98, 0.08, "warm");
        // 다음 화음으로 넘어가기 직전 한 음으로 이어 줌(베이스가 '걸어가는' 느낌)
        if (s === spb - 2 && p.energy >= 1 && p.energy <= 2 && p.meter !== "12/8") {
          const nc = p.chords[(hi + 1) % 16], nr = nc.bass ?? ((nc[0] % 12) + 12) % 12;
          if (nr !== root) { const target = (nr > 4 ? 36 : 48) + nr; const ap = target + (target > bassM ? -1 : 1) * (p.scale.includes((nr + 11) % 12) ? 1 : 2); playBass(ap, at, six * 1.7, 0.07, "warm"); }
        }
      }

      // 반주
      const sec = bar < 2 ? -1 : Math.floor(hi / 4), inB = sec === 2;
      if (p.arp !== "none") {
        const notes = voicing.map((m) => m + 12);
        const vol = ({ bell: 0.035, musicbox: 0.04, synthpluck: 0.03, epiano: 0.032, zither: 0.04, pluck: 0.045 }[p.arp] || 0.03) * (p.lead !== "none" && !cfg.lowPower ? 0.7 : 1); // 멜로디가 있으면 반주는 한 걸음 뒤로
        const bend = () => (p.arp === "zither" && Math.random() < 0.12 ? (Math.random() < 0.5 ? 1 : 2) : 0);
        if (p.meter === "3/4") { // 왈츠: 쿵(베이스)-짝-짝 / 오르골이면 8분 분산화음
          if (p.arp === "musicbox" || p.arp === "bell" || p.energy === 0) {
            if (s % 2 === 0) { const shape = [0, 1, 2, 3, 2, 1]; const m = notes[shape[s / 2] % notes.length]; playInst(p.arp, mtof(m), t, six * 3, vol * (s === 0 ? 1.1 : 0.9), musicIn, p.rev, { bend: bend() }); }
          } else if (s === 4 || s === 8) notes.slice(1).forEach((m, i) => playInst(p.arp, mtof(m), t + i * 0.008, six * 2.2, vol * 0.75, musicIn, p.rev));
        } else if (p.meter === "12/8") { // 셋잇단 분산화음(물결처럼)
          const rate = p.energy >= 1 ? 1 : 3;
          if (s % rate === 0) { const shape = [0, 1, 2, 3, 2, 1]; const m = notes[shape[(s / rate) % shape.length] % notes.length]; playInst(p.arp, mtof(m), t, six * rate * 2.2, vol * (s % 3 === 0 ? 1.05 : 0.85), musicIn, p.rev, { bend: bend() }); }
        } else if (p.comp) { // 화음 치기: 1박, 2박 반, 3박 반 (느긋한 리듬)
          if (s === 0 || s === 6 || s === 10) notes.forEach((m, i) => playInst(p.arp, mtof(m), t + i * 0.012, s === 0 ? beat * 1.4 : beat * 0.9, (s === 0 ? 0.03 : 0.022) * (p.arp === "epiano" ? 1 : 0.8), musicIn, p.rev));
        } else {
          const rate = p.energy >= 3 || (p.energy >= 2 && p.arp === "synthpluck") ? 2 : p.energy === 0 && cfg.density < 0.8 ? 8 : 4; // 16분·8분·4분
          if (s % rate === 0) {
            const k = s / rate, shape = inB ? (p.energy >= 2 ? [3, 2, 1, 2, 3, 1, 2, 0] : [0, 3, 2, 1, 3, 2, 1, 2]) : p.energy >= 2 ? [0, 1, 2, 3, 2, 1, 2, 3] : [0, 2, 1, 3, 2, 1, 3, 2];
            const m = notes[shape[k % shape.length] % notes.length] + (p.minorBell && Math.random() < 0.08 ? 1 : 0);
            playInst(p.arp, mtof(m), t + (s ? Math.random() * 0.006 : 0), six * rate * (p.staccato ? 0.6 : 1.8), vol * (s === 0 ? 1.15 : s % 4 ? 0.88 + Math.random() * 0.1 : 1) * (inB ? 1.1 : 1), musicIn, p.rev, { bend: bend() });
          }
        }
      }

      // 합주 악기(테마 고유 악기들). 곡이 진행될수록 하나씩 더해짐
      playEnsemble(p, bar, s, t, six, barDur, voicing, chord, root, sec);
      if (p.battle) playBattle(p, bar, s, t, six, barDur, voicing, chord, root, sec, hi);

      // 리드 멜로디: 16마디 노래(A·A′·B·A″)
      const li = p.leadSec && sec >= 0 ? p.leadSec[sec] : p.lead; // 동양풍: 악절마다 대금 → 단소 → 피리 → 대금
      if (li !== "none" && !cfg.lowPower && bar >= 2) { // 반주가 두 마디 깔린 뒤 노래가 들어옴
        const mbar = p.melody[hi];
        for (const n of mbar) if (n.st === s) {
          const lv = (p.theme === "dark" ? 0.032 : li === "vocal" ? 0.05 : 0.04) * SEC_DYN[sec] * (n.st % (bs * 2) === 0 ? 1.06 : 0.94 + Math.random() * 0.08);
          const tt = t + (n.st ? (Math.random() - 0.5) * 0.012 : 0), dur = n.len * six * (n.stac ? 0.55 : 1);
          if (n.app) { // 꾸밈음: 위 음에서 시작해 화음 음으로 내려앉음
            const d1 = Math.min(dur * 0.4, beat * 0.75);
            playLead(li, n.m + n.app, lastLead, tt, d1, lv, p.rev);
            playLead(li, n.m, n.m + n.app, tt + d1, dur - d1, lv * 0.92, p.rev);
          } else if (n.grace) playLead(li, n.m, n.m - n.grace, tt, dur, lv, p.rev); // 시김새: 아래에서 밀어 올림
          else playLead(li, n.m, lastLead, tt, dur, lv, p.rev); // 사람이 부르듯 아주 살짝 흔들림
          lastLead = n.m;
        }
        if (s === spb - 1 && hi % 4 === 3) lastLead = null; // 악절 끝에서 숨 쉬기
      }

      // 테마별 양념
      if (s === 0) {
        if (p.theme === "otome" && bar % 2 === 0) fmVoice(mtof(voicing[voicing.length - 1] + 24), at + beat * 2, 1, 0.012, 7.01, 0.6, 1.6, musicIn, 0.8);
        if (p.theme === "oriental" && /calm|lobby|romance|mystery|sad|happy/.test(p.mood) && bar % 2 === 1) for (let i = 0; i < 3; i++) fmVoice(mtof(voicing[i % voicing.length] + 36), at + beat * (2 + i * 0.35), 1.6, 0.01, 3.0, 0.8, 1.8, musicIn, 0.9); // 처마 끝 풍경
        if (p.theme === "dark" && !intro && /calm|mystery|dark|sad/.test(p.mood)) { lowDrum(at, 0.09, 60); lowDrum(at + beat * 0.42, 0.06, 58); } // 심장 박동
        if (p.theme === "daily") for (let i = 0; i < 6; i++) if (Math.random() < 0.5) noiseHit(at + Math.random() * barDur, 0.008 + Math.random() * 0.012, "highpass", 2500, 0.006); // 레코드 잡음
      }
      if (p.theme === "idol" && p.drums === "kpop" && !intro) {
        if (hi === 0 && s === 0) crash(at, 0.02); // 노래 처음·후렴(B) 들어갈 때만
        if (hi === 8 && s === 0) crash(at, 0.02);
        if (hi === 7 && s === 0) bgmRiser(at, barDur, 0.007);
      }
      // 글리치: 가끔 소리가 '툭' 끊기거나 튐
      if (p.glitch && s % 2 === 0 && Math.random() < 0.08) {
        const rr = Math.random();
        if (rr < 0.5) { musicGate.gain.setValueAtTime(0.0001, t); musicGate.gain.setValueAtTime(1, t + six * (1 + Math.floor(Math.random() * 3))); }
        else for (let i = 0; i < 3; i++) playInst("square", mtof(voicing[0] + 24 + Math.floor(Math.random() * 12)), t + i * 0.03, 0.03, 0.012, musicIn, 0);
      }

      // 드럼 (곡 시작 첫 마디는 쉼)
      if (intro) { introLeft--; step++; return; }
      switch (p.drums) {
        case "soft": if (s === 0) kick(at, 0.1); if (s === 8) rim(at, 0.02); if (s % 4 === 2) hat(at, 0.008); break;
        case "bounce": if (s === 0 || s === 8 || s === 10) kick(at, 0.16); if (s === 4 || s === 12) snare(at, 0.045); if (s % 2 === 0) hat(at, s % 4 ? 0.012 : 0.018); break;
        case "battle":
          if (s === 0 || s === 6 || s === 8 || s === 11) kick(at, 0.2); if (s === 4 || s === 12) snare(at, 0.06);
          hat(at, s % 2 ? 0.01 : 0.018);
          if (bar % 4 === 3 && s >= 12) snare(at, 0.03 + (s - 12) * 0.01);
          if (bar % 4 === 0 && s === 0) crash(at, 0.02);
          if (sec === 2 && (s === 2 || s === 10 || s === 14)) kick(at, 0.15); // 후렴에서 킥을 더 몰아침
          if (p.sidechain && s % 4 === 0) duckPads(at, beat);
          break;
        case "orch":
          if (s === 0) timpani(root + 36, at, 0.16); if (s === 8) timpani(root + 43, at, 0.11);
          if (bar % 4 === 3 && s >= 8 && s % 2 === 0) timpani(root + 36, at, 0.05 + (s - 8) * 0.012);
          if (bar % 4 === 0 && s === 0) crash(at, 0.015);
          if (s === 4 || s === 12) noiseHit(at, 0.012, "bandpass", 3200, 0.06, 2);
          if (p.mood === "battle") { if (s === 0 || s === 8) kick(at, 0.12); if (sec === 2 && s % 2 === 1) noiseHit(at, 0.006, "bandpass", 3600, 0.04, 2); if (s === 4 || s === 12) snare(at, 0.035); } // 전투: 킥·스네어·군악 롤
          break;
        case "pulse": if (s === 0) kick(at, 0.18); if (s % 4 === 2) hat(at, 0.012); if (s === 12) rim(at, 0.02); break;
        case "lofi":
          if (s === 0 || s === 10) kick(t, 0.14); if (s === 4 || s === 12) snare(t, 0.035);
          if (s % 2 === 0) hat(t, s % 4 ? 0.007 : 0.012);
          break;
        case "kpop":
          if (s % 4 === 0) { kick(at, 0.22, 140); if (p.sidechain) duckPads(at, beat); }
          if (s === 4 || s === 12) clap(at, 0.06);
          if (s % 4 === 2) hat(at, 0.016, true); else hat(at, 0.006);
          if (bar % 8 === 7 && s >= 8) snare(at, 0.015 + (s - 8) * 0.006);
          break;
        case "rnb":
          if (s === 0 || s === 7 || s === 10) kick(at, 0.16); if (s === 4 || s === 12) clap(at, 0.04);
          hat(t, s % 4 === 0 ? 0.012 : 0.006);
          break;
        case "janggu": // 굿거리풍(4/4용)
          if (s === 0) { lowDrum(t, 0.18, 95); rim(t, 0.04); } if (s === 8) lowDrum(t, 0.13, 95);
          if (s === 5) { rim(t, 0.025); rim(t + six * 0.6, 0.035); } if (s === 11 || s === 14) rim(t, 0.03);
          break;
        case "taiko":
          if (s % 4 === 0) lowDrum(at, 0.26, 70); if (s === 6 || s === 14) lowDrum(at, 0.15, 85);
          if (bar % 2 === 1 && s === 15) { lowDrum(at, 0.12, 90); lowDrum(at + six / 2, 0.16, 90); }
          if (s === 0 && bar % 4 === 0) gongNote(root + 36, at, 0.035);
          break;
        case "dagu": // 무협·사극: 큰북이 느리게 울리고 딱따기가 사이를 채움
          if (s === 0) buk(at, 0.17); if (s === 8) buk(at, 0.1);
          if (p.mood === "tense" || p.mood === "dark") { if (s === 6 || s === 14) bak(at, 0.03); if (s === 15 && hi % 2) buk(at, 0.08); }
          else if (s === 12 && hi % 2) jgChae(at, 0.04);
          if (s === 0 && hi % 8 === 0) jing(root + 36, at, 0.03);
          break;
        case "808": // 전자음: 길게 우는 808 킥, 하프타임 클랩, 하이햇 32분 롤
          if (s === 0 || s === 10 || (sec === 2 && s === 7)) kick808(at, s ? 0.14 : 0.18);
          if (s === 8) clap(at, 0.05);
          if (s % 2 === 0) hat(at, s % 4 ? 0.007 : 0.011);
          if (hi % 2 === 1 && s >= 12) hat(at + six / 2, 0.006);
          if (p.sidechain && s % 4 === 0) duckPads(at, beat);
          break;
        case "brush": // 재즈 브러시: 쓱— 하고 쓸고, 탁탁 두드림
          if (s === 0 || s === 10) kick(t, 0.07, 90);
          if (s === 4 || s === 12) noiseHit(t, 0.013, "bandpass", 2200, 0.2, 0.7, 0.05);
          if (s % 2 === 0) noiseHit(t, s % 4 ? 0.0025 : 0.004, "bandpass", 4200, 0.04, 1.2);
          break;
        case "orchSoft": // 관현악: 악절 첫머리 팀파니, 악절 끝 심벌 스웰
          if (s === 0 && hi % 4 === 0 && bar >= 2) timpani(root + 36, at, 0.12);
          if (s === 0 && hi % 4 === 0 && sec === 2) timpani(root + 43, at + beat * 2, 0.08);
          if (s === 0 && hi % 4 === 3) cymSwell(at, barDur, 0.012);
          break;
        case "jangdan": // 장구 장단(느린 4박): 덩 . . . . . 덕 . 쿵 . . 기덕 . . 쿵 .
          if (s === 0) jgDeong(at, 0.13); if (s === 6) jgChae(at, 0.07); if (s === 8) jgGung(at, 0.1);
          if (s === 11) jgGiDeok(at, 0.07, six); if (s === 14) jgGung(at, 0.06);
          if (sec === 2 && (s === 0 || s === 8)) buk(at, 0.12);
          if (s === 0 && hi % 4 === 0 && bar >= 2) jing(root + 36, at, 0.025);
          break;
        case "hwimori": // 휘모리: 장구 16분 + 북이 몰아침
          if (s === 0 || s === 8) { jgDeong(at, 0.14); buk(at, 0.18); }
          if (s % 2 === 0 && s !== 0 && s !== 8) (s % 4 ? jgChae : jgGung)(at, s % 4 ? 0.06 : 0.08);
          if (s === 13 || s === 15) jgChae(at, 0.045);
          if (sec === 2 && (s === 6 || s === 11 || s === 14)) buk(at, 0.13);
          break;
        case "jingOnly": // 잔잔한 장면: 악절 첫머리에만 징이 은은하게
          if (s === 0 && hi % 4 === 0 && bar >= 2) jing(root + 36, at, 0.022);
          break;
        case "swell": // 서정 오케스트라: 악절 첫머리에 큰북이 낮게 울리고, 후렴에선 박마다 은은하게
          if (s === 0 && hi % 4 === 0) { lowDrum(at, 0.16, 60); if (hi % 8 === 0) gongNote(root + 36, at, 0.02); }
          if (sec === 2 && (s === 0 || s === 8)) lowDrum(at, 0.09, 66);
          if (hi % 4 === 3 && (s === 12 || s === 14)) lowDrum(at, 0.07 + (s - 12) * 0.02, 70);
          break;
        case "wuxia": // 무협 전투: 큰북 몰아치기 + 작은북 16분 + 딱따기
          if (s === 0 || s === 6 || s === 8 || s === 11) lowDrum(at, 0.2, 64);
          if (s % 2 === 0) lowDrum(at, s % 4 ? 0.035 : 0.05, 150);
          if (s === 4 || s === 12) rim(at, 0.05);
          if (sec === 2 && (s === 3 || s === 14)) lowDrum(at, 0.14, 70);
          break;
        case "waltz": // 3/4: 쿵 짝 짝
          if (s === 0) kick(at, 0.09); if (s === 4 || s === 8) { hat(at, 0.01); rim(at, 0.012); }
          break;
        case "waltzOrch":
          if (s === 0) timpani(root + 36, at, 0.14); if (s === 4 || s === 8) noiseHit(at, 0.012, "bandpass", 3200, 0.06, 2);
          if (bar % 4 === 3 && s >= 6 && s % 2 === 0) timpani(root + 36, at, 0.05 + (s - 6) * 0.012);
          break;
        case "gutgeori": // 굿거리 12/8: 덩 . . 기 덕 . 쿵 . . 기 덕 .
          if (s === 0) jgDeong(t, 0.13);
          if (s === 3 || s === 9) jgChae(t, 0.045); if (s === 4 || s === 10) jgChae(t, 0.065);
          if (s === 6) jgGung(t, 0.1);
          break;
        case "shuffle": // 12/8 목가풍
          if (s === 0 || s === 6) kick(at, 0.08); if (s === 3 || s === 9) hat(at, 0.012); else if (s % 3 === 2) hat(at, 0.005);
          break;
      }
      step++;
    }

    function startSynth(key) {
      if (!ctx) return;
      ensureMusicBus();
      curKey = key;
      const pk = key + "|" + activeTheme();
      if (seqTimer && presetKey === pk) return;
      const changing = !!seqTimer;
      preset = buildPreset(key); presetKey = pk; step = 0; introLeft = preset.spb; lastLead = null;
      if (mixGain) mixGain.gain.setTargetAtTime(preset.mix, ctx.currentTime, 0.3);
      if (changing) { // 이전 곡은 페이드아웃, 새 곡은 다음 박에서 시작
        const t = ctx.currentTime;
        for (const x of activePads) { try { x.g.gain.cancelScheduledValues(t); x.g.gain.setValueAtTime(x.g.gain.value, t); x.g.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.2, cfg.fade * 0.6)); } catch {} }
        activePads = [];
        musicIn.gain.cancelScheduledValues(t); musicIn.gain.setValueAtTime(musicIn.gain.value, t);
        musicIn.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.2, cfg.fade * 0.6));
        musicIn.gain.linearRampToValueAtTime(1, t + Math.max(0.2, cfg.fade * 0.6) + 0.6);
        nextTime = t + Math.max(0.2, cfg.fade * 0.6);
        return;
      }
      musicIn.gain.cancelScheduledValues(ctx.currentTime); musicIn.gain.setValueAtTime(0.0001, ctx.currentTime); musicIn.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
      nextTime = ctx.currentTime + 0.1;
      seqTimer = setInterval(() => {
        if (!ctx || ctx.state !== "running" || !preset) return;
        const six = 60 / preset.bpm / preset.bs;
        if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05; // 탭이 잠시 멈췄다 와도 몰아서 연주하지 않게
        while (nextTime < ctx.currentTime + 0.4) { scheduleStep(nextTime); nextTime += six; }
      }, 100);
      timers.add(seqTimer);
    }
    function stopSynth() {
      if (!seqTimer) return;
      clearInterval(seqTimer); timers.delete(seqTimer); seqTimer = 0; presetKey = null;
      if (ctx && musicIn) { const t = ctx.currentTime; musicIn.gain.cancelScheduledValues(t); musicIn.gain.setValueAtTime(musicIn.gain.value, t); musicIn.gain.linearRampToValueAtTime(0.0001, t + 0.5); }
    }


    return {
      start: startSynth, stop: stopSynth, running: () => !!seqTimer,
      invalidate: () => { presetKey = null; },
      _build: (k) => buildPreset(k), // 점검용
      refresh: () => { if (seqTimer && curKey) { const np = buildPreset(curKey); if (np.spb !== preset.spb) step = Math.floor(step / preset.spb) * np.spb; preset = np; if (mixGain) mixGain.gain.setTargetAtTime(np.mix, ctx.currentTime, 0.3); presetKey = curKey + "|" + activeTheme(); return true; } return false; },
    };
  }

  const engines = {};
  const engineKey = () => (cfg.engine === "v1" ? "v1" : "v2");
  function MUSIC() {
    const k = engineKey();
    if (!engines[k]) engines[k] = k === "v1" ? createEngineV1() : createEngineV2();
    for (const o in engines) if (o !== k) { engines[o].stop(); delete engines[o]; } // 안 쓰는 엔진은 멈추고 메모리에서 버림
    return engines[k];
  }
  const startSynth = (key) => MUSIC().start(key);
  const stopSynth = () => { for (const k in engines) engines[k].stop(); };

  /* ---------- 배경음: 내 파일 (상황별) ---------- */
  const fileTrack = { key: null, el: null, url: null, gain: null, node: null };
  async function playFile(sit) {
    if (fileTrack.key === sit) { if (fileTrack.el && fileTrack.el.paused) fileTrack.el.play().catch(() => {}); return true; }
    const rec = await idbGet("bgm:" + sit);
    if (!rec) return false;
    stopFile(cfg.fade + 0.2);
    const url = URL.createObjectURL(rec.blob);
    const el = new Audio(); el.src = url; el.loop = true; el.preload = "auto"; el.playsInline = true;
    const node = ctx.createMediaElementSource(el); const gain = ctx.createGain(); gain.gain.value = 0.0001;
    node.connect(gain).connect(bgmBus);
    Object.assign(fileTrack, { key: sit, el, url, gain, node });
    el.play().catch(() => {});
    gain.gain.setTargetAtTime(1, ctx.currentTime, cfg.fade);
    return true;
  }
  function stopFile(fade = 0.6) {
    if (!fileTrack.el) return;
    const { el, url, gain, node } = fileTrack;
    Object.assign(fileTrack, { key: null, el: null, url: null, gain: null, node: null });
    try { gain.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3); } catch {}
    setTimeout(() => { try { el.pause(); node.disconnect(); } catch {} URL.revokeObjectURL(url); }, fade * 1000 + 200);
  }

  /* ---------- 상황에 맞춰 배경음 맞추기 ---------- */
  let currentSit = null, previewSit = null, battleLeaveAt = 0;
  async function syncBgm() {
    if (!host || !host.isConnected) { const h = findHost(); if (h && h !== host) attach(h); else if (!h && host) detach(); }
    if (host && root) { if (gfVisible()) resumeWatch(); else pauseWatch(); }
    if (previewSit) return; // 미리 듣는 중엔 건드리지 않음
    detectGenre(false);
    let sit = currentSituation();
    // 전투 중엔 화면이 잠깐 바뀌어도(스킬 고르기·적 지정·연출) 2초 동안은 전투 음악을 유지
    if (currentSit === "battle" && sit !== "battle" && sit !== "summon" && sit !== null) {
      if (!battleLeaveAt) battleLeaveAt = performance.now();
      if (performance.now() - battleLeaveAt < 2000) { sit = "battle"; setTimeout(() => syncBgm(), 2100); }
    } else battleLeaveAt = 0;
    currentSit = sit;
    updateNowLabel();
    const want = !!(sit && cfg.bgmOn && ctx && unlocked);
    if (ctx && performance.now() > duckUntil) bgmBus.gain.setTargetAtTime(want ? cfg.bgmVol * cfg.bgmVol : 0, ctx.currentTime, 0.5);
    if (!want) {
      if (bgmActive) { bgmActive = false; setTimeout(() => { if (!bgmActive && !previewSit) { stopSynth(); stopFile(); } }, 1500); }
      return;
    }
    bgmActive = true; touch();
    const mode = bgmMode(sit);
    if (mode === "off") { stopSynth(); stopFile(); return; }
    if (mode === "file" && customNames.has("bgm:" + sit)) { stopSynth(); await playFile(sit); return; }
    stopFile(); startSynth(sit);
  }
  every(() => syncBgm(), 2500);
  // 이 탭으로 돌아오면 다른 기기에서 바꾼 설정을 불러오고, 떠날 땐 대기 중인 설정을 바로 저장
  const onVis = () => { syncBgm(); if (document.hidden) { if (saveTimer) flush(); } else pullRemote(); };
  document.addEventListener("visibilitychange", onVis);
  later(() => document.removeEventListener("visibilitychange", onVis));

  /* =========================================================
   * 런처 버튼 + 커스텀 설정 팝업
   * ========================================================= */
  const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
  const launcher = document.createElement("button");
  launcher.id = "gf-sound-launcher";
  launcher.type = "button";
  launcher.title = "가챠포지 소리 설정 (Alt+S)";
  launcher.setAttribute("aria-label", "가챠포지 소리");
  launcher.innerHTML = ICON;
  document.body.appendChild(launcher);
  later(() => launcher.remove());
  const LAUNCH_COLORS = { fantasy: ["rgba(16,21,31,.68)", "#F2C14E"], otome: ["rgba(238,111,160,.9)", "#FFFFFF"], hunter: ["rgba(7,12,20,.8)", "#22D3EE"], daily: ["rgba(255,251,244,.95)", "#E8964A"], dark: ["rgba(13,9,11,.85)", "#C2334D"], oriental: ["rgba(246,240,227,.95)", "#B83A2B"], idol: ["rgba(255,62,165,.92)", "#FFFFFF"] };
  function placeLauncher() {
    const size = cfg.launcherSize + "px", gx = 12 + (cfg.launcherOffsetX || 0) + "px", gy = 12 + (cfg.launcherOffsetY || 0) + "px";
    const pos = cfg.launcherPos;
    Object.assign(launcher.style, {
      position: "fixed", width: size, height: size, borderRadius: "50%", border: "0", padding: "0",
      background: LAUNCH_COLORS[activeTheme()][0], color: LAUNCH_COLORS[activeTheme()][1], placeItems: "center", cursor: "pointer",
      boxShadow: "0 4px 14px rgba(0,0,0,.25)",
      zIndex: "2147482000", opacity: String(cfg.launcherOpacity),
      top: pos[0] === "t" ? `calc(env(safe-area-inset-top) + ${gy})` : "auto",
      bottom: pos[0] === "b" ? `calc(env(safe-area-inset-bottom) + ${gy})` : "auto",
      right: pos[1] === "r" ? `calc(env(safe-area-inset-right) + ${gx})` : "auto",
      left: pos[1] === "l" ? `calc(env(safe-area-inset-left) + ${gx})` : "auto",
    });
    // 서랍이 숨긴 경우(display:none !important)는 건드리지 않음
    if (launcher.style.getPropertyPriority("display") !== "important") launcher.style.display = cfg.openMode === "icon" ? "none" : "grid";
  }
  placeLauncher();

  // 팝업은 <dialog>로 브라우저 최상위 레이어(top layer)에 띄움 → 가챠포지 전체 화면 위에도 보임
  const dlg = document.createElement("dialog");
  dlg.id = "gf-sound-dialog";
  dlg.setAttribute("role", "dialog");
  dlg.setAttribute("aria-label", "가챠포지 소리 설정");
  Object.assign(dlg.style, { padding: "0", margin: "0", border: "0", background: "transparent", width: "100vw", height: "100dvh", maxWidth: "100vw", maxHeight: "100dvh", inset: "0", overflow: "hidden", zIndex: "2147483600" });
  const dlgStyle = document.createElement("style");
  dlgStyle.textContent = "#gf-sound-dialog::backdrop{background:transparent}#gf-sound-dialog:not([open]){display:none}";
  document.head.appendChild(dlgStyle);
  const popHost = document.createElement("div");
  popHost.id = "gf-sound-popup";
  Object.assign(popHost.style, { width: "100%", height: "100%" });
  dlg.appendChild(popHost);
  document.body.appendChild(dlg);
  later(() => { try { dlg.open && dlg.close(); } catch {} dlg.remove(); dlgStyle.remove(); });
  const sr = popHost.attachShadow({ mode: "open" });

  /* ---------- 설정 값 읽기/쓰기 (경로: "groups.UI" 같은 형태) ---------- */
  const DEFAULT_TRUE_MAPS = new Set(["groups", "moodEnabled"]);
  function getCfg(path) {
    const [a, b] = path.split(".");
    if (b === undefined) return cfg[a];
    const v = (cfg[a] || {})[b];
    return v === undefined ? (DEFAULT_TRUE_MAPS.has(a) ? true : "") : v;
  }
  function setCfg(path, v) {
    const [a, b] = path.split(".");
    if (b === undefined) cfg[a] = v; else cfg[a] = { ...(cfg[a] || {}), [b]: v };
  }

  /* ---------- 작은 UI 조립 도구 ---------- */
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = {
    pct: (v) => Math.round(v * 100) + "%",
    x: (v) => Number(v).toFixed(2).replace(/0$/, "") + "×",
    ms: (v) => Math.round(v) + "ms",
    s: (v) => Number(v) + "초",
    sf: (v) => Number(v).toFixed(1) + "초",
    n: (v) => String(v),
    px: (v) => v + "px",
  };
  const range = (path, label, min, max, step, f = "pct", hint = "") => `
    <div class="ctl"><div class="ctl-top"><span>${label}</span><output data-out="${path}" data-fmt="${f}"></output></div>
      <input type="range" min="${min}" max="${max}" step="${step}" data-cfg="${path}" data-type="num">${hint ? `<small>${hint}</small>` : ""}</div>`;
  const toggle = (path, label, hint = "") => `
    <label class="ctl tg"><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span><input type="checkbox" data-cfg="${path}" data-type="bool"><i></i></label>`;
  const select = (path, label, opts, hint = "") => `
    <div class="ctl sel"><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span>
      <select data-cfg="${path}" data-type="str">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>`;
  const chips = (path, opts) => `<div class="chips">${opts.map(([v, l]) => `<button type="button" data-chip="${path}" data-val="${v}">${l}</button>`).join("")}</div>`;
  const textarea = (path, label, ph) => `<div class="ctl"><span class="lbl">${label}</span><textarea data-cfg="${path}" data-type="str" rows="2" placeholder="${esc(ph)}"></textarea></div>`;
  const card = (title, body, hint = "") => `<div class="card2"><h4>${title}</h4>${hint ? `<p class="hint">${hint}</p>` : ""}${body}</div>`;

  const INSTR = [["auto", "테마 따라"], ["none", "없음"], ["synthpluck", "신스 플럭"], ["musicbox", "오르골"], ["bell", "종·크리스털"], ["pluck", "하프·피치카토"], ["epiano", "전자 피아노"], ["square", "8비트 신스"], ["sine", "부드러운 사인"], ["triangle", "플루트 같은 삼각파"], ["zither", "가야금·고쟁"]];
  const PADS = [["auto", "테마 따라"], ["none", "없음"], ["strings", "현악(스트링)"], ["warm", "따뜻한 패드"], ["synth", "신스 패드"], ["supersaw", "슈퍼쏘(댄스)"], ["sine", "부드럽게"], ["triangle", "따뜻하게"], ["sawtooth", "선명하게(현악·신스)"]];
  const DRUMS = [["auto", "테마·상황 따라"], ["none", "없음"], ["soft", "잔잔한 박자"], ["lofi", "로파이"], ["orch", "오케스트라 팀파니"], ["battle", "배틀 드럼"], ["pulse", "긴박한 펄스"], ["bounce", "통통 튀는"], ["janggu", "장구"], ["taiko", "큰북·징"], ["kpop", "K-팝 댄스"], ["rnb", "R&B·발라드"]];
  const MOOD_HINT = { calm: "예: 차분, 고요, 잔잔", happy: "예: 소풍, 선물, 생일", comedy: "예: 꽈당, 엥?, 어버버", romance: "예: 손깍지, 고백, 두근", sad: "예: 작별, 흐느, 빈자리", tense: "예: 추격, 시험장, 결투", mystery: "예: 수정구, 장막, 계시", dark: "예: 독점, 가두다, 눈빛이 탁", glitch: "예: 화면이 멈, 문자 깨짐" };
  const GENRE_LABEL = { otome: "오토메·로판", hunter: "헌터·액션", daily: "일상·힐링", fantasy: "정통 판타지", oriental: "동양풍", idol: "아이돌·연예계", dark: "다크·호러" };

  const soundRows = SOUND_LIST.map(([g, list]) => `
    <details class="grp"><summary><span>${g}</span><small>${list.length}개</small>
      <label class="mini-tg" title="이 그룹 전체 켜기/끄기"><input type="checkbox" data-cfg="groups.${g}" data-type="bool"><i></i></label></summary>
      ${list.map(([k, label]) => `
        <div class="snd" data-snd="${k}">
          <div class="snd-top"><label class="chk"><input type="checkbox" data-s="on"><span>${label}</span></label><button class="ib" data-play="${k}" title="미리 듣기">▶</button></div>
          <div class="snd-ctl"><span class="lab">볼륨</span><input type="range" min="0" max="1.5" step="0.05" data-s="vol"><span class="lab">음높이</span><input type="range" min="0.5" max="2" step="0.05" data-s="pitch"></div>
          <div class="snd-file"><em data-fname>기본 합성음</em><button class="sb" data-pick-sfx="${k}">내 파일</button><button class="sb ghost" data-clear-sfx="${k}">기본으로</button></div>
        </div>`).join("")}
    </details>`).join("");

  const sitRows = SITUATIONS.map(([k, label]) => `
    <div class="sit" data-sit="${k}">
      <div class="sit-top"><b>${label}</b>
        <select data-bgm-mode><option value="synth">자동 생성</option><option value="file">내 파일</option><option value="off">끄기</option></select>
        <button class="ib" data-play-bgm="${k}" title="12초 미리 듣기">▶</button></div>
      <div class="snd-file"><em data-fname>파일 없음</em><button class="sb" data-pick-bgm="${k}">파일 선택</button><button class="sb ghost" data-clear-bgm="${k}">✕</button></div>
    </div>`).join("");

  const TABS = [["basic", "기본"], ["sfx", "효과음"], ["bgm", "배경음"], ["mood", "분위기 감지"], ["view", "버튼·화면"], ["adv", "고급"]];
  const PANELS = {
    basic:
      card("볼륨", range("master", "전체 볼륨", 0, 1, 0.05) + toggle("sfxOn", "효과음 켜기") + range("sfxVol", "효과음 볼륨", 0, 1, 0.05) + toggle("bgmOn", "배경음 켜기") + range("bgmVol", "배경음 볼륨", 0, 1, 0.05)) +
      card("장르 테마 <small data-guess></small>", chips("theme", THEMES), "테마에 따라 배경음 악기와 버튼 소리가 바뀌어요. 자동은 화면 속 단어로 장르를 짐작해요.") +
      card("스토리 배경음 분위기", chips("storyMoodMode", [["auto", "자동 감지"], ...MOODS]), "자동 감지는 대사를 읽고 골라요. 세부 조절은 '분위기 감지' 탭에 있어요.") +
      card("어울림", toggle("duck", "효과음이 클 때 배경음 낮추기", "★5 공개·승리·레벨 업 같은 순간에 음악이 잠깐 비켜줘요") + range("duckAmount", "얼마나 낮출지", 0.1, 0.9, 0.05) + toggle("bgmOutside", "가챠포지 밖에서도 배경음", "다른 화면에서는 로비 음악이 계속 나와요")) +
      card("빠른 미리 듣기", `<div class="row-btns"><button class="sb" data-play="reveal5">★5 소환</button><button class="sb" data-play="crit">치명타</button><button class="sb" data-play="aether">에테르</button><button class="sb" data-play="affection">호감도</button><button class="sb" data-play="victory">승리</button></div>`),
    sfx:
      card("효과음 전체", range("boom", "둥 소리(저음 쿵) 세기", 0, 1.5, 0.05, "pct", "소환 공개·타격·출격 때 깔리는 저음이에요. 0%면 꺼져요") + range("reverb", "울림(리버브)", 0, 0.8, 0.02) + range("typingGap", "타자음 간격", 20, 150, 5, "ms", "숫자가 클수록 타자음이 드문드문 나요") + toggle("elemHits", "속성별 타격음", "불·물·바람·대지·빛·어둠 스킬마다 다른 타격음") + range("rewardChain", "보상 아이템 연속 재생", 1, 10, 1, "n", "보상 화면에서 최대 몇 종류까지 차례로 울릴지")) +
      card("소리별 설정", soundRows, "그룹 오른쪽 스위치로 묶음째 끌 수 있어요. 소리마다 볼륨·음높이·내 파일 교체가 돼요. 파일은 이 기기에만 저장돼요."),
    bgm:
      card("음악 엔진", chips("engine", [["v1", "v1 · 가벼움"], ["v2", "v2 · 풍성함"]]), "v1은 예전 엔진이라 가볍고 단순해요. v2는 멜로디·반주가 풍성한 새 엔진이에요. 고른 엔진만 실행되고, 다른 쪽은 메모리에서 비워져요.") +
      card("음악 스타일", range("tempo", "빠르기", 0.7, 1.4, 0.05, "x") + range("kick", "드럼 킥·팀파니 세기", 0, 1.5, 0.05, "pct", "배경음의 '둥둥' 박자 소리예요") + select("melody", "반주(아르페지오) 악기", INSTR, "화음을 쪼개 깔아주는 소리예요") + select("leadInst", "리드 멜로디 악기", [["auto", "테마 따라"], ["none", "없음"], ["flute", "플루트"], ["lead", "신스 리드"], ["epiano", "전자 피아노"], ["horn", "호른"], ["bell", "종"], ["bamboo", "피리(부드럽게)"], ["daegeum", "대금"], ["danso", "단소"], ["piri", "피리"], ["haegeum", "해금"], ["whistle", "휘파람"], ["vocal", "보컬 찹"], ["choir", "합창"]], "위에서 노래하듯 흐르는 멜로디예요") + select("padInst", "배경 화음 음색", PADS) + range("ensemble", "합주 악기", 0, 1.5, 0.05, "pct", "테마 고유 악기(하프·기타·첼로·해금·피아노 등)가 곡이 진행될수록 하나씩 더해져요. 0%면 꺼져요 (v2 전용)") + select("drums", "드럼", DRUMS) + range("density", "음 밀도", 0.3, 1.5, 0.05, "x", "낮추면 여백이 많고 차분해져요") + range("fade", "곡 전환 페이드", 0.2, 4, 0.1, "sf")) +
      card("상황별 음악", sitRows, "상황마다 자동 생성·내 파일·끄기 중에 골라요. ▶는 12초 미리 듣기예요."),
    mood:
      card("감지 방식", range("sensitivity", "감도", 0.5, 2, 0.05, "x", "높이면 작은 단서에도 분위기가 바뀌어요") + range("minHold", "한 분위기 최소 유지 시간", 3, 60, 1, "s", "강한 장면은 이 시간의 절반만 지나도 바뀌어요")) +
      card("쓸 분위기", MOODS.filter(([k]) => k !== "calm").map(([k, l]) => toggle("moodEnabled." + k, l)).join(""), "끈 분위기는 자동 감지에서 고르지 않아요. 아무 분위기에도 안 맞으면 '평온'으로 돌아가요.") +
      card("분위기 단어 추가", MOODS.filter(([k]) => k !== "calm").map(([k, l]) => textarea("keywords." + k, l, MOOD_HINT[k])).join(""), "쉼표나 줄바꿈으로 구분해요. 내 세계관의 고유 단어(인물 이름, 장소, 주문 등)를 넣으면 더 잘 맞아요.") +
      card("장르 단어 추가", Object.keys(GENRE_LABEL).map((g) => textarea("genreKeywords." + g, GENRE_LABEL[g], "예: 세계관 고유 명사")).join(""), "테마 '자동'일 때 장르를 짐작하는 데 써요.") +
      card("지금 감지 상태", `<div class="meter" data-meter></div><p class="hint" data-lastline></p>`),
    view:
      card("여는 방법", chips("openMode", [["icon", "아이콘"], ["floating", "플로팅"], ["both", "둘 다"]]),
        "아이콘: 가챠포지 상단바와 전투 조작줄에 🔊이 들어가요. 플로팅: 화면 구석에 떠 있는 버튼으로 열어요(가챠포지 밖 화면에서도, 확장 서랍에도 담겨요).") +
      `<div data-show="icon">` + card("아이콘 설정",
        select("iconTopbar", "상단바 아이콘 위치", [["beforeFs", "전체 화면 아이콘 앞 (기본)"], ["beforeSettings", "게임 설정 아이콘 앞"], ["end", "맨 끝"]], "오른쪽 위 '월드·게임 설정·전체 화면' 아이콘 줄이에요") +
        toggle("iconBattle", "전투 조작줄에도 넣기", "Auto·배속·전체 화면 버튼 옆") +
        toggle("iconStory", "스토리 화면에도 넣기", "대사창 위 Auto·Skip·Log 버튼 옆") +
        select("iconStyle", "아이콘 모양", [["speaker", "스피커"], ["note", "음표"], ["wave", "음파"], ["gear", "톱니"]]),
        "가챠포지 버튼과 같은 모양으로 들어가고, 전체 화면에서도 팝업이 열려요. 다른 확장이 같은 줄에 버튼을 넣어도 서로 밀어내지 않아요.") + `</div>` +
      `<div data-show="floating">` + card("플로팅 버튼 설정",
        select("launcherPos", "위치", [["br", "오른쪽 아래"], ["bl", "왼쪽 아래"], ["tr", "오른쪽 위"], ["tl", "왼쪽 위"]], "확장 서랍에 담겨 있으면 서랍이 우선이에요") +
        range("launcherOffsetX", "가로 간격", 0, 240, 4, "px", "다른 확장의 떠 있는 버튼과 겹치면 늘려요") + range("launcherOffsetY", "세로 간격", 0, 240, 4, "px") +
        range("launcherSize", "크기", 24, 52, 2, "px") + range("launcherOpacity", "불투명도", 0.2, 1, 0.05)) + `</div>` +
      card("단축키", select("hotkey", "설정 열기", [["alt+s", "Alt + S"], ["alt+m", "Alt + M"], ["ctrl+shift+s", "Ctrl + Shift + S"], ["off", "쓰지 않기"]], "다른 확장 단축키와 겹치면 바꾸거나 꺼요"), "Esc로 닫혀요."),
    adv:
      card("성능", toggle("lowPower", "저사양 모드", "울림 끄기, 음 밀도 낮추기, 화음 단순화") + range("sleepSec", "조용할 때 오디오 엔진 쉬기", 3, 60, 1, "s", "배경음이 꺼져 있을 때만 적용돼요")) +
      card("설정 백업", `<div class="row-btns"><button class="sb" data-act="export">설정 내보내기</button><button class="sb" data-act="import">설정 가져오기</button><button class="sb danger" data-act="reset">모두 초기화</button></div><p class="hint">내 소리 파일은 설정 파일에 들어가지 않아요(기기에 따로 저장).</p>`) +
      card("설정 저장", `<p class="hint" data-sync></p><div class="row-btns"><button class="sb" data-act="pull">다른 기기 설정 지금 불러오기</button></div>`) +
      card("정보", `<p class="hint" data-info></p>`),
  };

  sr.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .ov { position: fixed; inset: 0; background: var(--scrim); display: flex; align-items: center; justify-content: center; padding: 14px; font: 13px/1.45 system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; color: var(--fg); }
      .win { width: min(520px, 100%); height: min(86vh, 820px); display: flex; flex-direction: column; background: var(--win); border: 1px solid var(--ctl); border-radius: 18px; box-shadow: 0 24px 60px rgba(0,0,0,.55); overflow: hidden; }
      header { display: flex; align-items: center; gap: 8px; padding: 12px 14px 10px; }
      header h3 { margin: 0; font-size: 15px; flex: 1; letter-spacing: -.01em; }
      .now { font-size: 11px; color: var(--gold); background: var(--gold-bg); border-radius: 999px; padding: 3px 9px; white-space: nowrap; max-width: 55%; overflow: hidden; text-overflow: ellipsis; }
      .x { background: none; border: 0; color: var(--muted); font-size: 18px; cursor: pointer; padding: 2px 6px; }
      button:focus:not(:focus-visible) { outline: none; }
      nav { display: flex; gap: 4px; padding: 0 10px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--ctl2); }
      nav::-webkit-scrollbar { display: none; }
      nav button { flex: 0 0 auto; background: none; color: var(--muted); border: 0; border-bottom: 2px solid transparent; padding: 9px 10px; cursor: pointer; font: inherit; }
      nav button[aria-selected="true"] { color: var(--fg-strong); border-bottom-color: var(--accent); font-weight: 600; }
      .body { overflow: auto; padding: 12px; background: var(--body); flex: 1; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
      section[hidden], [data-show][hidden] { display: none; }
      .card2 { background: var(--card); border: 1px solid var(--card-bd); border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; }
      .card2 h4 { margin: 0 0 6px; font-size: 13px; }
      .card2 h4 small { color: var(--muted); font-weight: 400; }
      .hint { color: var(--muted); font-size: 11px; margin: 2px 0 8px; }
      .ctl { display: block; margin: 9px 0; }
      .ctl-top { display: flex; justify-content: space-between; align-items: baseline; }
      .ctl output { color: var(--gold); font-size: 12px; font-variant-numeric: tabular-nums; }
      .ctl small { display: block; color: var(--muted); font-size: 11px; margin-top: 2px; }
      input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; margin: 10px 0 4px; border-radius: 999px; cursor: pointer;
        background: linear-gradient(to right, var(--accent) 0 var(--p, 50%), var(--ctl) var(--p, 50%) 100%); outline: none; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--win); border: 3px solid var(--accent); box-shadow: 0 1px 4px rgba(0,0,0,.25); }
      input[type=range]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--win); border: 3px solid var(--accent); }
      input[type=range]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--gold-bg); }
      .snd-ctl input[type=range] { margin: 6px 0; }
      .tg { display: flex; align-items: center; gap: 10px; cursor: pointer; }
      .tg > span { flex: 1; } .tg b { font-weight: 500; }
      .tg input, .mini-tg input { display: none; }
      .tg i, .mini-tg i { width: 36px; height: 20px; border-radius: 999px; background: var(--ctl); position: relative; flex: 0 0 auto; transition: background .15s; }
      .tg i::after, .mini-tg i::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--knob); transition: transform .15s, background .15s; }
      .tg input:checked + i, .mini-tg input:checked + i { background: var(--accent); }
      .tg input:checked + i::after, .mini-tg input:checked + i::after { transform: translateX(16px); background: #fff; }
      .mini-tg { display: inline-flex; margin-left: auto; } .mini-tg i { width: 30px; height: 17px; } .mini-tg i::after { width: 13px; height: 13px; } .mini-tg input:checked + i::after { transform: translateX(13px); }
      .sel { display: flex; align-items: center; gap: 10px; } .sel > span { flex: 1; } .sel b { font-weight: 500; }
      .lbl { display: block; margin-bottom: 3px; }
      select, textarea { background: var(--ctl2); color: var(--fg); border: 1px solid var(--ctl-bd); border-radius: 8px; padding: 5px 7px; font: inherit; font-size: 12px; }
      textarea { width: 100%; resize: vertical; min-height: 34px; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0; }
      .chips button { background: var(--ctl2); color: var(--fg); border: 0; border-radius: 999px; padding: 6px 11px; cursor: pointer; font: inherit; font-size: 12px; }
      .chips button[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); font-weight: 600; }
      .chips button:hover, .sb:hover, .ib:hover { filter: brightness(1.08); }
      .row-btns { display: flex; flex-wrap: wrap; gap: 6px; }
      .sb, .ib { background: var(--ctl); color: var(--fg); border: 0; border-radius: 7px; padding: 6px 10px; cursor: pointer; font: inherit; font-size: 12px; }
      .ib { padding: 4px 9px; } .ib.on { background: var(--accent); color: var(--accent-fg); }
      .sb.ghost { background: transparent; color: var(--muted); } .sb.danger { background: #3A2230; color: #FF9AA8; }
      .grp { border-top: 1px solid var(--ctl); padding: 2px 0; }
      .grp summary { cursor: pointer; padding: 8px 0; font-weight: 600; display: flex; align-items: center; gap: 6px; list-style: none; }
      .grp summary::-webkit-details-marker { display: none; }
      .grp summary::before { content: "▸"; color: var(--muted); transition: transform .15s; } .grp[open] summary::before { transform: rotate(90deg); }
      .grp summary small { color: var(--muted); font-weight: 400; }
      .snd, .sit { border-top: 1px dashed var(--ctl); padding: 8px 0; }
      .snd-top, .sit-top { display: flex; align-items: center; gap: 8px; } .sit-top b { flex: 1; font-weight: 500; }
      .chk { flex: 1; display: flex; align-items: center; gap: 6px; cursor: pointer; }
      .snd-ctl { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 6px; align-items: center; margin-top: 4px; }
      .lab { color: var(--muted); font-size: 11px; }
      .snd-file { display: flex; gap: 6px; align-items: center; margin-top: 5px; }
      .snd-file em { flex: 1; font-style: normal; color: var(--muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .snd-file em.custom { color: var(--ok); }
      .meter { display: grid; grid-template-columns: 80px 1fr 34px; gap: 4px 8px; align-items: center; font-size: 12px; }
      .meter .bar { height: 7px; background: var(--ctl2); border-radius: 99px; overflow: hidden; }
      .meter .bar i { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width .3s; }
      .meter .cur { color: var(--gold); font-weight: 600; }
      .meter span:nth-child(3n) { color: var(--muted); font-variant-numeric: tabular-nums; text-align: right; }

      /* ---- 장르 테마별 색 ---- */
      .ov { --scrim: rgba(5,8,14,.58); --win: #111725; --body: #141B29; --card: #1A2232; --card-bd: #232C3E; --ctl: #2A3346; --ctl2: #222B3D; --ctl-bd: #2E384C;
            --fg: #E6EAF2; --fg-strong: #fff; --muted: #8D99AE; --knob: #AEB7C7; --accent: #F2603C; --accent-fg: #10151F; --gold: #F2C14E; --gold-bg: rgba(242,193,78,.12); --ok: #7BD389;
            --scroll: #3A4560; --scroll-h: #F2603C; --glow: 0 24px 60px rgba(0,0,0,.55); }
      .ov[data-theme="otome"] { --scrim: rgba(60,20,45,.35); --win: #FFF7FB; --body: #FDEFF5; --card: #FFFFFF; --card-bd: #F6D9E6; --ctl: #F7DCE8; --ctl2: #FBE6EF; --ctl-bd: #F0CADB;
            --fg: #4B2A3B; --fg-strong: #2E1424; --muted: #A6809A; --knob: #FFFFFF; --accent: #EE6FA0; --accent-fg: #FFFFFF; --gold: #C98A2E; --gold-bg: rgba(238,111,160,.12); --ok: #3FA66B;
            --scroll: #F2B8CF; --scroll-h: #EE6FA0; --glow: 0 24px 60px rgba(160,60,110,.25); }
      .ov[data-theme="hunter"] { --scrim: rgba(0,6,12,.6); --win: #070C14; --body: #0A1220; --card: #0E1828; --card-bd: #17304A; --ctl: #13263C; --ctl2: #0F2034; --ctl-bd: #1C3A5A;
            --fg: #D7F3FF; --fg-strong: #FFFFFF; --muted: #6E8FAA; --knob: #8FB3CC; --accent: #22D3EE; --accent-fg: #03121A; --gold: #7CF0FF; --gold-bg: rgba(34,211,238,.12); --ok: #4ADE80;
            --scroll: #1C3A5A; --scroll-h: #22D3EE; --glow: 0 0 0 1px rgba(34,211,238,.25), 0 24px 60px rgba(0,0,0,.6); }
      .ov[data-theme="daily"] { --scrim: rgba(40,30,20,.3); --win: #FFFBF4; --body: #F8F1E6; --card: #FFFFFF; --card-bd: #EADFCD; --ctl: #EFE5D6; --ctl2: #F4ECDF; --ctl-bd: #E3D5C0;
            --fg: #3F362C; --fg-strong: #241C14; --muted: #9A8B78; --knob: #FFFFFF; --accent: #E8964A; --accent-fg: #FFFFFF; --gold: #B9772F; --gold-bg: rgba(232,150,74,.13); --ok: #5A9E5F;
            --scroll: #DECDB4; --scroll-h: #E8964A; --glow: 0 24px 60px rgba(90,60,30,.22); }
      .ov[data-theme="fantasy"] { --accent: #F2603C; --gold: #F2C14E; }
      .ov[data-theme="idol"] { --scrim: rgba(10,0,20,.55); --win: #140A22; --body: #1A0E2C; --card: #221338; --card-bd: #3A1F5A; --ctl: #31194F; --ctl2: #2A1545; --ctl-bd: #4A2670;
            --fg: #F6EAFF; --fg-strong: #FFFFFF; --muted: #B79BD6; --knob: #E8D8FF; --accent: #FF3EA5; --accent-fg: #FFFFFF; --gold: #7CF7FF; --gold-bg: rgba(255,62,165,.15); --ok: #7CF7A0;
            --scroll: #4A2670; --scroll-h: #FF3EA5; --glow: 0 0 0 1px rgba(255,62,165,.35), 0 0 40px rgba(124,247,255,.15), 0 24px 60px rgba(0,0,0,.6); }
      .ov[data-theme="idol"] header { background: linear-gradient(90deg, rgba(255,62,165,.25), rgba(124,247,255,.15)); }
      .ov[data-theme="idol"] .chips button[aria-pressed="true"] { background: linear-gradient(90deg, #FF3EA5, #B36BFF); }
      .ov[data-theme="oriental"] { --scrim: rgba(30,22,14,.4); --win: #F7F1E3; --body: #EFE6D2; --card: #FBF7EC; --card-bd: #DCCDAE; --ctl: #E4D7BC; --ctl2: #EADFC8; --ctl-bd: #D3C29E;
            --fg: #2B241C; --fg-strong: #14100B; --muted: #8A7A62; --knob: #FBF7EC; --accent: #B83A2B; --accent-fg: #FBF7EC; --gold: #9A6B1F; --gold-bg: rgba(184,58,43,.1); --ok: #4E7D4A;
            --scroll: #CDB98F; --scroll-h: #B83A2B; --glow: 0 24px 60px rgba(60,40,20,.28);
            font-family: "Nanum Myeongjo", "Noto Serif KR", "AppleMyungjo", "Batang", serif; }
      .ov[data-theme="oriental"] .win { border-color: #B89B66; }
      .ov[data-theme="oriental"] header h3::after { content: "樂"; margin-left: 6px; font-size: 11px; color: #FBF7EC; background: #B83A2B; border-radius: 3px; padding: 1px 4px; vertical-align: 2px; }
      .ov[data-theme="dark"] { --scrim: rgba(0,0,0,.7); --win: #0D090B; --body: #120C10; --card: #1A1117; --card-bd: #2C1A24; --ctl: #2A1822; --ctl2: #21141B; --ctl-bd: #3A2230;
            --fg: #EBDCE2; --fg-strong: #FFF; --muted: #9A7F8B; --knob: #B79AA7; --accent: #C2334D; --accent-fg: #FFF2F4; --gold: #D9B98C; --gold-bg: rgba(194,51,77,.15); --ok: #8FBF7F;
            --scroll: #3A2230; --scroll-h: #C2334D; --glow: 0 0 40px rgba(194,51,77,.18), 0 24px 60px rgba(0,0,0,.7); }
      .win { box-shadow: var(--glow) !important; transition: background .25s, color .25s; }
      input[type=checkbox] { accent-color: var(--accent); }
      /* ---- 스크롤바 ---- */
      .body, textarea, nav { scrollbar-width: thin; scrollbar-color: var(--scroll) transparent; }
      .body::-webkit-scrollbar, textarea::-webkit-scrollbar { width: 10px; height: 10px; }
      .body::-webkit-scrollbar-track, textarea::-webkit-scrollbar-track { background: transparent; }
      .body::-webkit-scrollbar-thumb, textarea::-webkit-scrollbar-thumb { background: var(--scroll); border-radius: 999px; border: 3px solid var(--body); min-height: 40px; }
      textarea::-webkit-scrollbar-thumb { border-color: var(--ctl2); }
      .body::-webkit-scrollbar-thumb:hover, textarea::-webkit-scrollbar-thumb:hover { background: var(--scroll-h); }
      .body::-webkit-scrollbar-corner { background: transparent; }
    </style>
    <div class="ov">
      <div class="win" role="dialog" aria-label="가챠포지 소리 설정">
        <header><h3>🔊 가챠포지 소리</h3><span class="now" data-now>대기 중</span><button class="x" data-close aria-label="닫기">✕</button></header>
        <nav role="tablist">${TABS.map(([k, l], i) => `<button data-tab="${k}" aria-selected="${i === 0}">${l}</button>`).join("")}</nav>
        <div class="body">${TABS.map(([k], i) => `<section data-panel="${k}"${i ? " hidden" : ""}>${PANELS[k]}</section>`).join("")}</div>
      </div>
      <input type="file" accept="audio/*" hidden data-file>
      <input type="file" accept="application/json,.json" hidden data-import>
    </div>`;

  const $ = (q) => sr.querySelector(q);
  const $$ = (q) => sr.querySelectorAll(q);
  const fileInput = $("[data-file]");
  let pickTarget = null;

  function updateNowLabel() {
    const el = $("[data-now]"); if (!el) return;
    el.textContent = previewSit ? "미리 듣기 · " + SIT_LABEL[previewSit] : currentSit ? (SIT_LABEL[currentSit] || currentSit) + " · " + THEME_LABEL[activeTheme()] : "가챠포지 밖";
  }
  // 슬라이더 채워진 부분을 테마 색으로 칠함
  const paintRange = (el) => { const mn = +el.min, mx = +el.max, v = +el.value; el.style.setProperty("--p", ((v - mn) / (mx - mn || 1)) * 100 + "%"); };
  function syncOutputs() {
    $$("output[data-out]").forEach((o) => { o.textContent = fmt[o.dataset.fmt](getCfg(o.dataset.out)); });
    $$("input[type=range]").forEach(paintRange);
  }
  function syncUi() {
    $$("[data-cfg]").forEach((el) => {
      const v = getCfg(el.dataset.cfg);
      if (el.type === "checkbox") return;
      if (document.activeElement !== popHost || sr.activeElement !== el) el.value = v == null ? "" : String(v);
    });
    $$("[data-cfg][data-type='bool']").forEach((el) => { const v = getCfg(el.dataset.cfg); el.checked = v === true || (v === "" ? false : v !== false); });
    $$("[data-chip]").forEach((b) => b.setAttribute("aria-pressed", String(String(getCfg(b.dataset.chip)) === b.dataset.val)));
    $$("[data-show]").forEach((el) => { el.hidden = !(cfg.openMode === "both" || cfg.openMode === el.dataset.show); });
    const gs = $("[data-guess]"); if (gs) gs.textContent = cfg.theme === "auto" ? "· 지금 " + THEME_LABEL[guessedTheme] + "로 판단" : "";
    $$(".snd").forEach((row) => {
      const k = row.dataset.snd, sc = sCfg(k);
      row.querySelector('[data-s="on"]').checked = sc.on;
      row.querySelector('[data-s="vol"]').value = String(sc.vol);
      row.querySelector('[data-s="pitch"]').value = String(sc.pitch);
      const fn = customNames.get("sfx:" + k), em = row.querySelector("[data-fname]");
      em.textContent = fn || "기본 합성음"; em.classList.toggle("custom", !!fn);
    });
    $$(".sit").forEach((row) => {
      const k = row.dataset.sit;
      row.querySelector("[data-bgm-mode]").value = bgmMode(k);
      row.querySelector("[data-play-bgm]").classList.toggle("on", previewSit === k);
      const fn = customNames.get("bgm:" + k), em = row.querySelector("[data-fname]");
      em.textContent = fn || "파일 없음"; em.classList.toggle("custom", !!fn);
    });
    const info = $("[data-info]");
    const sy = $("[data-sync]");
    if (sy) sy.textContent = !api || !api.storage ? "이 기기에만 저장돼요." : remoteOk ? "✓ 마리나라 서버에 저장 중이에요. 다른 기기도 같은 설정을 써요." : "⚠ 지금 서버에 연결이 안 돼서 이 기기에만 저장 중이에요. 연결되면 바꾼 칸만 자동으로 올려요.";
    if (info) info.textContent = `효과음 ${SOUND_LIST.reduce((n, [, l]) => n + l.length, 0)}종 · 배경음 상황 ${SITUATIONS.length}가지 · 내 파일 ${customNames.size}개 · 오디오 ${ctx ? ctx.state : "꺼짐"} · 가챠포지 ${host ? "연결됨" : "찾는 중"}`;
    syncOutputs(); updateNowLabel(); applyThemeColors();
  }
  function applyThemeColors() {
    const th = activeTheme();
    const ov = $(".ov"); if (ov && ov.dataset.theme !== th) ov.dataset.theme = th;
    placeLauncher();
  }

  // 분위기 감지 실시간 표시 (탭이 열려 있을 때만 1초마다)
  function renderMeter() {
    const m = $("[data-meter]"); if (!m) return;
    const max = Math.max(3, ...MOOD_KEYS.map((k) => scores[k]));
    const cur = cfg.storyMoodMode === "auto" ? storyMood : cfg.storyMoodMode;
    m.innerHTML = [["calm", "평온"], ...MOODS.filter(([k]) => k !== "calm")].map(([k, l]) => {
      const v = k === "calm" ? 0 : scores[k] || 0;
      return `<span class="${k === cur ? "cur" : ""}">${k === cur ? "▶ " : ""}${l}</span><span class="bar"><i style="width:${Math.min(100, (v / max) * 100)}%"></i></span><span>${v.toFixed(1)}</span>`;
    }).join("");
    const ll = $("[data-lastline]");
    if (ll) ll.textContent = lastAnalysis.line ? `마지막으로 읽은 대사: "${lastAnalysis.line}${lastAnalysis.line.length >= 80 ? "…" : ""}"` : "아직 읽은 대사가 없어요. 스토리를 진행하면 여기에 점수가 보여요.";
  }
  every(() => { if (popOpen && !$('[data-panel="mood"]').hidden) renderMeter(); }, 1000);

  let popOpen = false;
  function showDlg() {
    try { if (dlg.open) dlg.close(); dlg.showModal(); }
    catch { dlg.setAttribute("open", ""); Object.assign(dlg.style, { position: "fixed", display: "block" }); } // 아주 오래된 브라우저용
  }
  function openPopup() { unlock(); popOpen = true; showDlg(); syncUi(); renderMeter(); pullRemote(); }
  function closePopup() { popOpen = false; try { dlg.close(); } catch { dlg.removeAttribute("open"); } stopPreview(); }
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); closePopup(); }); // Esc
  // 팝업을 연 채로 전체 화면을 켜고 끄면 다시 맨 위로 올림
  // 플로팅 버튼: 전체 화면일 땐 전체 화면이 된 가챠포지 화면 안으로 옮겨서 보이고 눌리게 함(끝나면 제자리로).
  //  서랍이 가져간 경우는 건드리지 않음
  let lifted = null;
  function liftLauncher() {
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    const mine = launcher.parentNode === document.body || (lifted && launcher.parentNode === lifted) || !launcher.parentNode;
    const want = !!fs && mine && cfg.openMode !== "icon" && launcher.style.getPropertyPriority("display") !== "important";
    if (want) { const box = fs.shadowRoot || fs; if (launcher.parentNode !== box) box.appendChild(launcher); lifted = box; }
    else if (lifted) { if (mine) document.body.appendChild(launcher); lifted = null; }
  }
  const onFs = () => { setTimeout(liftLauncher, 30); if (popOpen) setTimeout(showDlg, 60); };
  document.addEventListener("fullscreenchange", onFs);
  document.addEventListener("webkitfullscreenchange", onFs);
  later(() => { document.removeEventListener("fullscreenchange", onFs); document.removeEventListener("webkitfullscreenchange", onFs); });
  launcher.addEventListener("click", (e) => { e.stopPropagation(); popOpen ? closePopup() : openPopup(); });
  $(".ov").addEventListener("pointerdown", (e) => { if (e.target === $(".ov")) closePopup(); });
  $("[data-close]").addEventListener("click", closePopup);
  const onKey = (e) => {
    if (popOpen && e.key === "Escape") return closePopup();
    const hk = cfg.hotkey;
    if (!hk || hk === "off" || e.repeat) return;
    const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (typing && !popOpen) return; // 글 쓰는 중엔 가로채지 않음
    const ok = hk === "alt+s" ? e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyS"
      : hk === "alt+m" ? e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyM"
      : hk === "ctrl+shift+s" ? (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.code === "KeyS" : false;
    if (ok) { e.preventDefault(); e.stopPropagation(); popOpen ? closePopup() : openPopup(); }
  };
  document.addEventListener("keydown", onKey);
  later(() => document.removeEventListener("keydown", onKey));

  // 배경음 미리 듣기 (가챠포지 밖에서도 들림)
  let previewTimer = 0;
  function stopPreview() {
    if (!previewSit) return;
    previewSit = null; clearTimeout(previewTimer);
    stopSynth(); stopFile(0.3);
    syncUi(); syncBgm();
  }
  async function previewBgm(sit) {
    unlock(); if (!ctx) return;
    if (previewSit === sit) return stopPreview();
    previewSit = sit; bgmActive = true; touch();
    bgmBus.gain.setTargetAtTime(Math.max(0.08, cfg.bgmVol * cfg.bgmVol), ctx.currentTime, 0.2);
    if (bgmMode(sit) === "file" && customNames.has("bgm:" + sit)) { stopSynth(); await playFile(sit); }
    else { stopFile(0.2); stopSynth(); startSynth(sit); }
    clearTimeout(previewTimer); previewTimer = setTimeout(stopPreview, 12000);
    syncUi();
  }
  // 설정을 바꿔도 곡을 처음부터 다시 시작하지 않고, 연주 중인 곡에 바로 반영(다음 음부터 새 설정)
  let refreshTimer = 0;
  function restartMusic() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (MUSIC().refresh()) return;
      if (previewSit) { const p = previewSit; previewSit = null; previewBgm(p); } else { MUSIC().invalidate(); syncBgm(); }
    }, 120); // 슬라이더를 끄는 동안 수십 번 바뀌어도 한 번만 반영
  }

  // 설정 바뀔 때 엔진에 반영
  const MUSIC_KEYS = new Set(["ensemble", "tempo", "melody", "padInst", "drums", "leadInst", "density", "lowPower", "theme"]);
  function applyChange(path) {
    const top = path.split(".")[0];
    save(); applyVolumes(); syncOutputs();
    if (top === "engine") { const sit = previewSit; stopSynth(); MUSIC(); if (sit) { previewSit = null; previewBgm(sit); if (popOpen === false && !dlg.open) clearTimeout(previewTimer); } else syncBgm(); }
    else if (MUSIC_KEYS.has(top)) restartMusic();
    else if (top === "bgmOn" || top === "bgmVol" || top === "bgmOutside" || top === "storyMoodMode") {
      if (ctx && previewSit) bgmBus.gain.setTargetAtTime(cfg.bgmOn ? Math.max(0.08, cfg.bgmVol * cfg.bgmVol) : 0, ctx.currentTime, 0.05);
      else syncBgm();
    }
    if (top.startsWith("launcher")) placeLauncher();
    if (/^icon|^hotkey$|^sfxOn$|^bgmOn$|^openMode$/.test(top)) ensureGameButtons();
    if (top === "openMode") { placeLauncher(); liftLauncher(); syncUi(); }
    if (top === "theme") { detectGenre(true); setSfxFx(activeTheme()); syncUi(); }
    if (top === "keywords" || top === "genreKeywords") wordCache.clear();
  }

  const pick = (target) => { pickTarget = target; fileInput.value = ""; fileInput.click(); };
  sr.addEventListener("click", async (e) => {
    const t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
    const d = t.dataset;
    if (d.tab) {
      $$("nav button").forEach((b) => b.setAttribute("aria-selected", String(b === t)));
      $$("section[data-panel]").forEach((s) => (s.hidden = s.dataset.panel !== d.tab));
      if (d.tab === "mood") renderMeter();
      $(".body").scrollTop = 0;
      return;
    }
    if (d.chip) { setCfg(d.chip, d.val); syncUi(); applyChange(d.chip); if (d.chip === "theme") play("confirm", 0, { force: true }); return; }
    if (d.play) { unlock(); setTimeout(() => play(d.play, 0, { force: true }), 30); return; }
    if (d.playBgm) return previewBgm(d.playBgm);
    if (d.pickSfx) return pick("sfx:" + d.pickSfx);
    if (d.pickBgm) return pick("bgm:" + d.pickBgm);
    if (d.clearSfx) { await idbDel("sfx:" + d.clearSfx); customNames.delete("sfx:" + d.clearSfx); sfxBuffers.delete(d.clearSfx); syncUi(); return; }
    if (d.clearBgm) {
      await idbDel("bgm:" + d.clearBgm); customNames.delete("bgm:" + d.clearBgm);
      if (fileTrack.key === d.clearBgm) stopFile();
      if (bgmMode(d.clearBgm) === "file") { cfg.bgm[d.clearBgm] = "synth"; save(); }
      syncUi(); syncBgm(); return;
    }
    if (d.act === "export") {
      const blob = new Blob([JSON.stringify({ kind: "gacha-forge-sound-settings", version: 4, cfg }, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gacha-forge-sound-settings.json";
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      return;
    }
    if (d.act === "pull") { await flush(); await pullRemote(); syncUi(); return; }
    if (d.act === "import") { const inp = $("[data-import]"); inp.value = ""; inp.click(); return; }
    if (d.act === "reset") {
      if (!confirm("소리 설정을 전부 처음으로 되돌릴까요? (내 소리 파일은 그대로 남아요)")) return;
      cfg = normalize(null); fullOverwrite = true; save(); applyVolumes(); placeLauncher(); restartMusic(); ensureGameButtons(); syncUi();
    }
  });
  sr.addEventListener("input", (e) => {
    const el = e.target;
    if (el.type === "range") paintRange(el);
    if (el.dataset.cfg) {
      const ty = el.dataset.type;
      const v = ty === "bool" ? el.checked : ty === "num" ? Number(el.value) : el.value;
      setCfg(el.dataset.cfg, v);
      if (ty === "str" && el.tagName === "TEXTAREA") { save(); wordCache.clear(); return; }
      applyChange(el.dataset.cfg);
      return;
    }
    if (el.dataset.s) {
      const k = el.closest(".snd").dataset.snd, sc = sCfg(k);
      sc[el.dataset.s] = el.type === "checkbox" ? el.checked : Number(el.value);
      cfg.sounds[k] = sc; save();
    }
  });
  sr.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.s && el.type === "range") { play(el.closest(".snd").dataset.snd, 0, { force: true }); return; }
    if (el.dataset.cfg === "sfxVol" || el.dataset.cfg === "reverb") { play("confirm", 0, { force: true }); return; }
    if (el.dataset.cfg === "boom") { play("hit", 0, { force: true }); return; } // 바꾼 둥 세기를 바로 들려줌
    if (el.hasAttribute("data-bgm-mode")) {
      const sit = el.closest(".sit").dataset.sit;
      cfg.bgm[sit] = el.value; save();
      if (el.value === "file" && !customNames.has("bgm:" + sit)) pick("bgm:" + sit);
      syncBgm();
    }
  });
  // 클릭이 그룹 접기/펴기로 번지지 않게
  $$(".mini-tg").forEach((l) => l.addEventListener("click", (e) => e.stopPropagation()));

  fileInput.addEventListener("change", async () => {
    const f = fileInput.files && fileInput.files[0]; if (!f || !pickTarget) return;
    const isBgm = pickTarget.startsWith("bgm:");
    const limit = isBgm ? 60 : 5;
    if (f.size > limit * 1024 * 1024) { alert(`${isBgm ? "배경음" : "효과음"} 파일은 ${limit}MB 이하로 넣어주세요.`); return; }
    try {
      await idbPut(pickTarget, { name: f.name, blob: f });
      customNames.set(pickTarget, f.name);
      if (!isBgm) { const k = pickTarget.slice(4); sfxBuffers.delete(k); setTimeout(() => play(k, 0, { force: true }), 50); }
      else { const sit = pickTarget.slice(4); cfg.bgm[sit] = "file"; save(); if (fileTrack.key === sit) stopFile(0.1); syncBgm(); }
    } catch { alert("이 기기에서는 파일을 저장하지 못했어요."); }
    syncUi();
  });
  $("[data-import]").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j || j.kind !== "gacha-forge-sound-settings" || !j.cfg) throw new Error();
      cfg = normalize(j.cfg); fullOverwrite = true;
      save(); applyVolumes(); placeLauncher(); restartMusic(); wordCache.clear(); syncUi();
    } catch { alert("가챠포지 소리 설정 파일이 아니에요."); }
  });

  /* =========================================================
   * 시작 / 정리
   * ========================================================= */
  // 다른 기기에서 바뀐 설정이 들어오면 소리·버튼·화면에 바로 반영
  onRemoteApplied = () => { applyVolumes(); placeLauncher(); ensureGameButtons(); restartMusic(); wordCache.clear(); if (popOpen) syncUi(); };
  updateSyncLabel = () => { if (popOpen) { const sy = $("[data-sync]"); if (sy) syncUi(); } };
  // 팝업을 열어 둔 동안엔 20초마다 다른 기기 변경 확인
  every(() => { if (popOpen && !document.hidden) pullRemote(); }, 20000);
  syncUi();
  const h0 = findHost(); if (h0) attach(h0);
  // 가챠포지 화면이 생기는 즉시 붙음(2.5초 순찰을 기다리지 않음). 콜백은 길이만 보는 가벼운 확인
  const hostMO = new MutationObserver(() => {
    if (host && host.isConnected && root) return;
    const h = liveHosts[0]; if (h && (h !== host || !root)) attach(h);
  });
  hostMO.observe(document.documentElement, { childList: true, subtree: true });
  cleanups.push(() => hostMO.disconnect());
  // 서버 설정·내 파일 목록은 화면이 뜬 뒤에 천천히
  loadCustomIndex().catch(() => {}).then(() => { if (popOpen) syncUi(); });
  if (api && api.storage) {
    const firstPull = async () => { await pullRemote(); if (!remoteOk && pullRetry++ < 5) setTimeout(firstPull, 3000 * pullRetry); };
    firstPull();
  }

  function dispose() {
    if (saveTimer) flush(); // 저장 대기 중인 설정은 버리지 않고 바로 저장
    clearTimeout(structTimer); clearTimeout(previewTimer);
    for (const id of timers) clearInterval(id);
    stopSynth(); stopFile(0.1);
    try { root && root.querySelectorAll(".gf-sound-btn").forEach((b) => b.remove()); if (root && gameSheet) root.adoptedStyleSheets = root.adoptedStyleSheets.filter((x) => x !== gameSheet); } catch {}
    detach();
    for (const fn of cleanups.splice(0)) { try { fn(); } catch {} }
    if (ctx) { ctx.close().catch(() => {}); ctx = null; }
    delete window[KEY];
  }
  window[KEY] = {
    dispose, open: openPopup,
    _last: () => [...lastPlay.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map((e) => e[0]),
    // 미리듣기 페이지용
    _preview: (sit) => { unlock(); if (previewSit !== sit) { previewSit = null; previewBgm(sit); } clearTimeout(previewTimer); },
    _stop: () => stopPreview(),
    _play: (n) => { unlock(); play(n, 0, { force: true }); },
    _set: (path, v) => { setCfg(path, v); applyChange(path); },
    _get: (k) => cfg[k],
    _sounds: () => SOUND_LIST,
    _song: (k) => { const e = MUSIC(); return e._build ? e._build(k) : null; }, // 점검용
    _tap: () => { ensureCtx(); const d = ctx.createMediaStreamDestination(); masterOut.connect(d); return d.stream; }, // 녹음·점검용
  };
  if (api && typeof api.onCleanup === "function") api.onCleanup(dispose);
})();
