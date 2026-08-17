/* ============================================================
   NABD (نبض) — Citizen Portal page module
   Complaint form · facility selection · email sending ·
   recent incident summary from dashboard history
   ============================================================ */
(function () {
  'use strict';
  const N = window.NABD;
  if (!N) return;
  const L = (k) => N.t(k);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const DEFAULT_SENDER = 'nabdanalyzerinfo@gmail.com';

  const CATEGORY_LABELS = {
    'power-outage': 'cp.cat.power',
    'water-flooding': 'cp.cat.water',
    'fire': 'cp.cat.fire',
    'incident': 'cp.cat.incident',
    'complaint': 'cp.cat.complaint',
    'infrastructure': 'cp.cat.infrastructure',
    'waste': 'cp.cat.waste',
    'other': 'cp.cat.other'
  };

  const CATEGORY_SUBJECTS = {
    'power-outage': { en: 'Power Outage Report', ar: 'تقرير انقطاع كهرباء' },
    'water-flooding': { en: 'Water Flooding Report', ar: 'تقرير فيضان مياه' },
    'fire': { en: 'Fire Report', ar: 'تقرير حريق' },
    'incident': { en: 'Incident Report', ar: 'تقرير حادث' },
    'complaint': { en: 'Citizen Complaint', ar: 'شكوى مواطنة' },
    'infrastructure': { en: 'Infrastructure Issue', ar: 'مشكلة بنية تحتية' },
    'waste': { en: 'Waste Management Report', ar: 'تقرير إدارة نفايات' },
    'other': { en: 'General Report', ar: 'تقرير عام' }
  };

  function init() {
    const form = $('cpForm');
    const catInput = $('cpCategory');
    const catBtns = $('cpCategories');
    const facChips = $('cpFacilityChips');
    const fromEl = $('cpFrom');
    const toEl = $('cpTo');
    const subjectEl = $('cpSubject');
    const bodyEl = $('cpBody');
    const sendBtn = $('cpSendBtn');
    const resetBtn = $('cpResetBtn');
    const statusEl = $('cpStatus');
    const statusInner = $('cpStatusInner');
    const incidentsList = $('cpIncidentsList');
    const incidentsEmpty = $('cpIncidentsEmpty');

    if (!form) return;

    if (fromEl) fromEl.value = DEFAULT_SENDER;

    /* ---------- facility chips ---------- */
    function renderFacilityChips() {
      if (!facChips) return;
      const facs = Array.isArray(N.facilities) ? N.facilities : [];
      facChips.innerHTML = facs.map((f, i) =>
        '<button type="button" class="cp-fac-chip" data-idx="' + i + '">'
        + '<span class="cp-fac-chip-name">' + esc(L(f.key)) + '</span>'
        + '<span class="cp-fac-chip-mail mono">' + esc(f.email || '') + '</span>'
        + '</button>'
      ).join('');
      facChips.querySelectorAll('.cp-fac-chip').forEach((ch) => {
        ch.addEventListener('click', () => {
          const f = facs[Number(ch.dataset.idx)];
          if (f && f.email && toEl) toEl.value = f.email;
          facChips.querySelectorAll('.cp-fac-chip').forEach((c) => c.classList.remove('active'));
          ch.classList.add('active');
        });
      });
    }
    renderFacilityChips();

    /* ---------- category buttons ---------- */
    if (catBtns) {
      catBtns.addEventListener('click', (e) => {
        const btn = e.target.closest('.cp-cat-btn');
        if (!btn) return;
        catBtns.querySelectorAll('.cp-cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat || '';
        if (catInput) catInput.value = cat;
        const subKey = CATEGORY_SUBJECTS[cat];
        if (subjectEl && subKey && !subjectEl.value.trim()) {
          subjectEl.value = N.lang === 'ar' ? subKey.ar : subKey.en;
        }
      });
    }

    /* ---------- status display ---------- */
    function showStatus(type, msg) {
      if (!statusEl || !statusInner) return;
      statusEl.hidden = false;
      statusInner.className = 'cp-status-inner cp-status-' + type;
      statusInner.textContent = msg;
    }
    function hideStatus() {
      if (statusEl) statusEl.hidden = true;
    }

    /* ---------- form submission ---------- */
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideStatus();

        const cat = (catInput ? catInput.value : '').trim();
        const to = (toEl ? toEl.value : '').trim();
        const subject = (subjectEl ? subjectEl.value : '').trim();
        const body = (bodyEl ? bodyEl.value : '').trim();
        const from = (fromEl ? fromEl.value : '').trim() || DEFAULT_SENDER;

        if (!cat) { N.toast($('appToast'), L('cp.toast.cat')); return; }
        if (!to) { N.toast($('appToast'), L('cp.toast.to')); return; }
        if (!body) { N.toast($('appToast'), L('cp.toast.body')); return; }

        sendBtn.disabled = true;
        showStatus('sending', L('cp.status.sending'));

        const catLabel = L(CATEGORY_LABELS[cat] || cat);
        const finalSubject = subject || (catLabel + ' — NABD Citizen Portal');

        try {
          const res = await N.api('/api/complaints', {
            method: 'POST',
            body: { from, to, subject: finalSubject, body, category: cat }
          });
          if (res && res.sent) {
            showStatus('sent', L('cp.status.sent'));
            form.reset();
            if (fromEl) fromEl.value = DEFAULT_SENDER;
            catBtns.querySelectorAll('.cp-cat-btn').forEach((b) => b.classList.remove('active'));
            if (catInput) catInput.value = '';
            facChips.querySelectorAll('.cp-fac-chip').forEach((c) => c.classList.remove('active'));
          } else {
            showStatus('failed', L('cp.status.failed'));
          }
        } catch (err) {
          showStatus('failed', L('cp.status.err'));
        }
        sendBtn.disabled = false;
      });
    }

    /* ---------- reset ---------- */
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        if (fromEl) fromEl.value = DEFAULT_SENDER;
        if (catInput) catInput.value = '';
        catBtns.querySelectorAll('.cp-cat-btn').forEach((b) => b.classList.remove('active'));
        facChips.querySelectorAll('.cp-fac-chip').forEach((c) => c.classList.remove('active'));
        hideStatus();
        N.toast($('appToast'), L('cp.toast.reset'));
      });
    }

    /* ---------- recent incidents summary ---------- */
    function renderIncidents() {
      if (!incidentsList || !incidentsEmpty) return;
      const history = N.historyGet ? N.historyGet() : [];
      const recent = history.slice(0, 8);
      if (!recent.length) {
        incidentsList.style.display = 'none';
        incidentsEmpty.hidden = false;
        return;
      }
      incidentsList.style.display = '';
      incidentsEmpty.hidden = true;
      incidentsList.innerHTML = recent.map((h) => {
        const cat = h.cat ? esc(h.cat) : '—';
        const src = h.src != null ? esc(String(h.src)) : '—';
        const time = h.ts ? N.formatRelativeTime(h.ts) : '';
        const statusCls = h.status === 'done' ? 'ok' : h.status === 'failed' ? 'danger' : 'warn';
        return '<div class="cp-incident-row">'
          + '<div class="cp-incident-meta">'
          + '<div class="cp-incident-query">' + esc(h.query || '—') + '</div>'
          + '<div class="cp-incident-details mono">'
          + '<span class="cp-incident-cat">' + cat + '</span>'
          + '<span class="dot-sep" aria-hidden="true"></span>'
          + '<span>' + L('cp.incidents.src') + ': ' + src + '</span>'
          + '<span class="dot-sep" aria-hidden="true"></span>'
          + '<span>' + time + '</span>'
          + '</div>'
          + '</div>'
          + '<span class="status-chip ' + statusCls + '"><span class="d"></span>' + esc(h.status || '') + '</span>'
          + '</div>';
      }).join('');
    }
    renderIncidents();
    document.addEventListener('app-render', renderIncidents);
  }

  function $(id) { return document.getElementById(id); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
