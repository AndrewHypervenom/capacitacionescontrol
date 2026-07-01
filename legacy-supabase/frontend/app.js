/* =====================================================================
   Mesa de Control — lógica de la app (sin framework, vanilla JS)
   ===================================================================== */
(() => {
  const cfg = window.APP_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  // ---------- Estado ----------
  let supa = null;
  let me = null;                 // { id, name, color }
  let locks = [];                // filas de file_locks
  let repoFiles = [];            // rutas de archivos del repo (GitHub)
  let filesLoaded = false;

  // ---------- Utilidades de usuario (identidad sin login) ----------
  const PALETTE = ['#6366f1','#db2777','#0891b2','#16a34a','#ea580c','#7c3aed','#0d9488','#dc2626','#2563eb','#ca8a04'];
  function loadMe() {
    let raw = localStorage.getItem('mc_user');
    if (raw) { try { return JSON.parse(raw); } catch {} }
    return null;
  }
  function saveMe(u) { localStorage.setItem('mc_user', JSON.stringify(u)); }
  function colorFor(str) {
    let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }
  function initials(name) {
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
  }

  // ---------- Toasts ----------
  function toast(msg, type = 'ok') {
    const colors = { ok: 'bg-slate-800', err: 'bg-rose-600', warn: 'bg-amber-600' };
    const el = document.createElement('div');
    el.className = `${colors[type]} text-white text-sm rounded-lg px-4 py-3 shadow-lg fade-in max-w-xs`;
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2800);
    setTimeout(() => el.remove(), 3200);
  }

  const escapeHtml = (s) => (s ?? '').replace(/[&<>"']/g, m => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  function timeAgo(iso) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'hace un momento';
    const m = Math.floor(s / 60); if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24); return `hace ${d} d`;
  }

  // ---------- Conexión Supabase ----------
  function configOk() {
    return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
           !cfg.SUPABASE_URL.includes('TU-PROYECTO') &&
           !cfg.SUPABASE_ANON_KEY.includes('TU_CLAVE');
  }

  function setConn(state, text) {
    const led = $('connLed'), txt = $('connText');
    txt.textContent = text;
    led.className = 'w-2.5 h-2.5 rounded-full ' + (
      state === 'ok'   ? 'bg-emerald-400' :
      state === 'err'  ? 'bg-rose-400' : 'bg-amber-300 animate-pulse');
  }

  // ---------- Lista de archivos del repo (GitHub) ----------
  async function loadRepoFiles() {
    const branches = cfg.BRANCHES || ['main'];
    const set = new Set();
    for (const b of branches) {
      try {
        const r = await fetch(`https://api.github.com/repos/${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}/git/trees/${b}?recursive=1`);
        if (!r.ok) continue;
        const data = await r.json();
        (data.tree || []).forEach(n => { if (n.type === 'blob') set.add(n.path); });
      } catch (e) { /* ignora ramas que fallen */ }
    }
    repoFiles = [...set].sort();
    filesLoaded = true;
    if (repoFiles.length) {
      $('fileHint').textContent = `${repoFiles.length} archivos disponibles del repo. Escribe para buscar.`;
    } else {
      $('fileHint').textContent = 'No se pudo leer GitHub (¿límite de la API?). Puedes escribir la ruta del archivo a mano.';
    }
  }

  // ---------- Autocompletar archivos ----------
  function renderFileSuggestions() {
    const q = $('fileInput').value.trim().toLowerCase();
    const box = $('fileList');
    if (!q) { box.classList.add('hidden'); return; }
    const matches = repoFiles.filter(f => f.toLowerCase().includes(q)).slice(0, 50);
    if (!matches.length) { box.classList.add('hidden'); return; }
    box.innerHTML = matches.map(f =>
      `<button type="button" data-f="${escapeHtml(f)}" class="block w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b border-slate-50 last:border-0">${escapeHtml(f)}</button>`
    ).join('');
    box.classList.remove('hidden');
    box.querySelectorAll('button').forEach(btn => btn.onclick = () => {
      $('fileInput').value = btn.dataset.f;
      box.classList.add('hidden');
    });
  }

  // ---------- Datos ----------
  async function fetchLocks() {
    const { data, error } = await supa.from('file_locks').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); setConn('err', 'Error de datos'); return; }
    locks = data || [];
    render();
  }

  async function claimFile() {
    if (!me) return openNameModal();
    const file = $('fileInput').value.trim();
    const branch = $('branchSel').value;
    const note = $('noteInput').value.trim();
    if (!file) { toast('Escribe o elige un archivo', 'warn'); return; }

    $('claimBtn').disabled = true;
    const row = { file_path: file, branch, user_name: me.name, client_id: me.id, color: me.color, note: note || null };
    const { error } = await supa.from('file_locks')
      .upsert(row, { onConflict: 'file_path,branch,client_id' });
    $('claimBtn').disabled = false;

    if (error) { console.error(error); toast('No se pudo guardar: ' + error.message, 'err'); return; }
    $('fileInput').value = ''; $('noteInput').value = '';
    toast('Archivo marcado ✅');
    fetchLocks();
  }

  async function releaseLock(id) {
    const { error } = await supa.from('file_locks').delete().eq('id', id);
    if (error) { toast('No se pudo liberar', 'err'); return; }
    toast('Archivo liberado 👋');
    fetchLocks();
  }

  // ---------- Detección de conflictos ----------
  // Agrupa por archivo. Riesgo de conflicto = mismo archivo trabajado
  // por más de una persona (especialmente en ramas distintas).
  function groupByFile() {
    const map = new Map();
    for (const l of locks) {
      if (!map.has(l.file_path)) map.set(l.file_path, []);
      map.get(l.file_path).push(l);
    }
    return map;
  }

  function render() {
    // Badge / vacío
    $('countBadge').textContent = locks.length;
    $('emptyBoard').classList.toggle('hidden', locks.length !== 0);

    renderAlerts();
    renderBoard();
  }

  function renderAlerts() {
    const wrap = $('alertsWrap');
    const groups = groupByFile();
    const alerts = [];
    for (const [file, rows] of groups) {
      const people = [...new Set(rows.map(r => r.user_name))];
      const branches = [...new Set(rows.map(r => r.branch))];
      if (people.length > 1 || branches.length > 1) {
        alerts.push({ file, rows, people, branches });
      }
    }
    if (!alerts.length) { wrap.innerHTML = ''; return; }

    wrap.innerHTML = alerts.map(a => {
      const crossBranch = a.branches.length > 1;
      const who = a.rows.map(r =>
        `<span class="inline-flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5 text-xs font-medium">
           <span class="w-2 h-2 rounded-full" style="background:${r.color}"></span>${escapeHtml(r.user_name)}
           <span class="text-rose-500">· ${escapeHtml(r.branch)}</span></span>`).join(' ');
      return `<div class="bg-rose-50 border border-rose-300 rounded-xl p-4 fade-in">
        <div class="flex items-start gap-3">
          <div class="text-2xl">🚨</div>
          <div class="flex-1">
            <p class="font-bold text-rose-800">Conflicto potencial en <code class="bg-rose-100 px-1 rounded">${escapeHtml(a.file)}</code></p>
            <p class="text-sm text-rose-700 mt-0.5">
              ${crossBranch
                ? 'Este archivo se está tocando en <b>ramas distintas</b>: al hacer el merge habrá conflicto.'
                : 'Más de una persona está trabajando este archivo.'}
            </p>
            <div class="flex flex-wrap gap-1.5 mt-2">${who}</div>
            <p class="text-sm text-rose-800 mt-2">👉 <b>Qué hacer:</b> pónganse de acuerdo en quién edita ahora. La otra persona espera, hace <code class="bg-rose-100 px-1 rounded">git pull</code> y luego edita. Liberen el archivo al terminar.</p>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderBoard() {
    const board = $('board');
    const q = $('searchBoard').value.trim().toLowerCase();
    const onlyMine = $('onlyMine').checked;
    const groups = groupByFile();

    let entries = [...groups.entries()];
    if (q) entries = entries.filter(([f]) => f.toLowerCase().includes(q));
    if (onlyMine && me) entries = entries.filter(([, rows]) => rows.some(r => r.client_id === me.id));

    // Conflictivos primero
    entries.sort((a, b) => {
      const ca = new Set(a[1].map(r => r.branch)).size > 1 || new Set(a[1].map(r => r.user_name)).size > 1;
      const cb = new Set(b[1].map(r => r.branch)).size > 1 || new Set(b[1].map(r => r.user_name)).size > 1;
      return (cb ? 1 : 0) - (ca ? 1 : 0);
    });

    board.innerHTML = entries.map(([file, rows]) => {
      const conflict = new Set(rows.map(r => r.branch)).size > 1 || new Set(rows.map(r => r.user_name)).size > 1;
      const people = rows.map(r => {
        const mine = me && r.client_id === me.id;
        return `<div class="flex items-center justify-between gap-3 py-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-6 h-6 shrink-0 rounded-full grid place-items-center text-white text-[10px] font-bold" style="background:${r.color}">${initials(r.user_name)}</span>
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">${escapeHtml(r.user_name)} ${mine ? '<span class="text-indigo-500 text-xs">(tú)</span>' : ''}
                <span class="text-xs font-semibold text-violet-600 bg-violet-50 rounded px-1.5 py-0.5 ml-1">${escapeHtml(r.branch)}</span>
              </div>
              <div class="text-xs text-slate-400 truncate">${r.note ? escapeHtml(r.note) + ' · ' : ''}${timeAgo(r.created_at)}</div>
            </div>
          </div>
          ${mine ? `<button data-rel="${r.id}" class="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-lg px-2.5 py-1">Liberar</button>` : ''}
        </div>`;
      }).join('');

      return `<div class="bg-white rounded-xl border ${conflict ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'} shadow-sm p-4 fade-in">
        <div class="flex items-center gap-2 mb-2">
          ${conflict ? '<span title="Conflicto potencial">🚨</span>' : '<span title="OK">✅</span>'}
          <code class="text-sm font-semibold text-slate-700 break-all">${escapeHtml(file)}</code>
          <span class="ml-auto text-xs text-slate-400">${rows.length} ${rows.length === 1 ? 'persona' : 'personas'}</span>
        </div>
        <div class="divide-y divide-slate-100">${people}</div>
      </div>`;
    }).join('');

    board.querySelectorAll('[data-rel]').forEach(b => b.onclick = () => releaseLock(b.dataset.rel));
  }

  // ---------- Modal nombre ----------
  function openNameModal() {
    $('nameModal').classList.remove('hidden');
    $('nameField').value = me?.name || '';
    setTimeout(() => $('nameField').focus(), 50);
  }
  function closeNameModal() { $('nameModal').classList.add('hidden'); }

  function applyMe() {
    $('whoName').textContent = me.name;
    const av = $('whoAvatar');
    av.textContent = initials(me.name);
    av.style.background = me.color;
  }

  function saveNameHandler() {
    const name = $('nameField').value.trim();
    if (!name) { $('nameError').classList.remove('hidden'); return; }
    $('nameError').classList.add('hidden');
    if (!me) me = { id: 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36) };
    me.name = name;
    me.color = colorFor(name);
    saveMe(me);
    applyMe();
    closeNameModal();
    toast(`¡Hola, ${name}! 👋`);
  }

  // ---------- Init ----------
  function wireUI() {
    $('repoLabel').textContent = `${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}`;
    (cfg.BRANCHES || ['main']).forEach(b => {
      const o = document.createElement('option'); o.value = b; o.textContent = b; $('branchSel').appendChild(o);
    });
    $('whoBtn').onclick = openNameModal;
    $('saveName').onclick = saveNameHandler;
    $('nameField').addEventListener('keydown', e => { if (e.key === 'Enter') saveNameHandler(); });
    $('claimBtn').onclick = claimFile;
    $('fileInput').addEventListener('input', renderFileSuggestions);
    $('fileInput').addEventListener('focus', renderFileSuggestions);
    document.addEventListener('click', e => {
      if (!e.target.closest('#fileInput') && !e.target.closest('#fileList')) $('fileList').classList.add('hidden');
    });
    $('searchBoard').addEventListener('input', renderBoard);
    $('onlyMine').addEventListener('change', renderBoard);
  }

  async function start() {
    wireUI();
    loadRepoFiles();

    if (!configOk()) {
      $('setupWarn').classList.remove('hidden');
      setConn('err', 'Sin Supabase');
      return;
    }

    supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

    me = loadMe();
    if (me) applyMe(); else openNameModal();

    try {
      await fetchLocks();
      setConn('ok', 'En vivo');
    } catch (e) { setConn('err', 'Error'); }

    // Realtime: cambios de cualquier usuario llegan al instante.
    supa.channel('file_locks_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'file_locks' }, () => fetchLocks())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConn('ok', 'En vivo');
      });

    // Refresco suave para que los "hace X min" se actualicen.
    setInterval(() => { if (locks.length) renderBoard(); }, 60000);
  }

  document.addEventListener('DOMContentLoaded', start);
})();
