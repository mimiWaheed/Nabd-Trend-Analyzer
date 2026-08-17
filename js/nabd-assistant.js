/* NABD AI Assistant — reusable floating chat component.
   Usage: <script src="js/nabd-assistant.js"><script> then call NabdAssistant.init({ context: 'landing' })
   or NabdAssistant.init({ context: 'workspace', page: 'dashboard', section: 'analysis' }) */

(function () {
  'use strict';

  const L = (k) => {
    try { return (window.NABD && NABD.t) ? NABD.t(k) : k; } catch (e) { return k; }
  };

  const STRINGS = {
    en: {
      trigger: 'Ask NABD',
      intro: 'Hi, I\'m NABD. I can help you navigate the platform, explain how things work, answer questions, or suggest things worth analyzing.',
      bubble: 'Ask me anything about NABD, trends, or what you can analyze.',
      dismiss: 'Got it',
      placeholder: 'Ask NABD anything...',
      typing: 'NABD is thinking...',
      error: 'I couldn\'t reach NABD right now. Please try again in a moment.',
      chips: ['What can I do with NABD?', 'Where is my history?', 'What should I analyze today?', 'How does NABD work?'],
      close: 'Close assistant',
      open: 'Open assistant'
    },
    ar: {
      trigger: 'اسأل نبض',
      intro: 'مرحبًا، أنا نبض. يمكنني مساعدتك في التنقل بالمنصة، وشرح كيفية العمل، والإجابة على أسئلتك، أو اقتراح تحليلات تستحق المتابعة.',
      bubble: 'اسألني أي شيء عن نبض أو الترندات أو ما يمكن تحليله.',
      dismiss: 'حسنًا',
      placeholder: 'اسأل نبض...',
      typing: 'نبض يفكر...',
      error: 'لم أتمكن من الوصول إلى نبض الآن. حاول مرة أخرى.',
      chips: ['ما الذي يمكنني فعله مع نبض؟', 'أين سجل بحثي؟', 'ماذا أحلل اليوم؟', 'كيف يعمل نبض؟'],
      close: 'إغلاق المساعد',
      open: 'فتح المساعد'
    }
  };

  const MAX_STORED = 40;
  const STORAGE_KEY = 'nabd-chat';

  let state = { open: false, bubbleShown: false, messages: [], sending: false };
  let els = {};
  let config = {};

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages.slice(-MAX_STORED))); } catch (e) {}
  }

  function str(k) {
    const lang = document.documentElement.lang || 'en';
    const dict = STRINGS[lang] || STRINGS.en;
    return dict[k] || STRINGS.en[k] || k;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderMarkdown(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function buildHTML() {
    const lang = document.documentElement.lang || 'en';
    const isAr = lang === 'ar';
    return `
    <div class="nabd-fab" role="button" tabindex="0" aria-label="${esc(str('open'))}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nabd-fab-ic">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="3" x2="12" y2="5"/>
        <line x1="12" y1="19" x2="12" y2="21"/>
        <line x1="3" y1="12" x2="5" y2="12"/>
        <line x1="19" y1="12" x2="21" y2="12"/>
      </svg>
      <span class="nabd-fab-pulse"></span>
    </div>
    <div class="nabd-bubble" role="status" aria-live="polite">
      <p><strong>${esc(str('trigger'))}</strong></p>
      <p>${esc(str('bubble'))}</p>
      <button class="nabd-bubble-dismiss" aria-label="${esc(str('dismiss'))}">${esc(str('dismiss'))}</button>
    </div>
    <div class="nabd-panel" role="dialog" aria-label="${esc(str('open'))}">
      <div class="nabd-panel-head">
        <div class="nabd-panel-brand">
          <span class="nabd-panel-logo">N</span>
          <span class="nabd-panel-title">NABD</span>
        </div>
        <button class="nabd-panel-close" aria-label="${esc(str('close'))}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="nabd-panel-messages" id="nabdMessages"></div>
      <div class="nabd-panel-input">
        <textarea class="nabd-input" placeholder="${esc(str('placeholder'))}" rows="1" aria-label="${esc(str('placeholder'))}"></textarea>
        <button class="nabd-send" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>`;
  }

  function showWelcome() {
    const msgs = els.messages;
    if (!msgs) return;
    msgs.innerHTML = `
      <div class="nabd-msg nabd-msg-bot">
        <div class="nabd-msg-avatar">N</div>
        <div class="nabd-msg-body">${renderMarkdown(str('intro'))}</div>
      </div>
      <div class="nabd-chips" id="nabdChips">
        ${str('chips').map((c) => '<button class="nabd-chip" data-msg="' + esc(c) + '">' + esc(c) + '</button>').join('')}
      </div>`;
    state.messages = [];
  }

  function restoreMessages() {
    const msgs = els.messages;
    if (!msgs || !state.messages.length) return;
    msgs.innerHTML = '';
    state.messages.forEach(function (m) {
      const div = document.createElement('div');
      div.className = 'nabd-msg nabd-msg-' + (m.role === 'assistant' ? 'bot' : 'user');
      if (m.role === 'assistant') {
        div.innerHTML = '<div class="nabd-msg-avatar">N</div><div class="nabd-msg-body">' + renderMarkdown(m.content) + '</div>';
      } else {
        div.innerHTML = '<div class="nabd-msg-body nabd-msg-user-body">' + esc(m.content) + '</div>';
      }
      msgs.appendChild(div);
    });
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addMessage(role, content) {
    state.messages.push({ role, content });
    saveHistory();
    const msgs = els.messages;
    if (!msgs) return;
    const chipWrap = msgs.querySelector('.nabd-chips');
    if (chipWrap) chipWrap.remove();
    const div = document.createElement('div');
    div.className = 'nabd-msg nabd-msg-' + (role === 'assistant' ? 'bot' : 'user');
    if (role === 'assistant') {
      div.innerHTML = '<div class="nabd-msg-avatar">N</div><div class="nabd-msg-body">' + renderMarkdown(content) + '</div>';
    } else {
      div.innerHTML = '<div class="nabd-msg-body nabd-msg-user-body">' + esc(content) + '</div>';
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = els.messages;
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'nabd-msg nabd-msg-bot nabd-typing';
    div.innerHTML = '<div class="nabd-msg-avatar">N</div><div class="nabd-msg-body"><span class="nabd-typing-dots"><i></i><i></i><i></i></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const t = els.messages && els.messages.querySelector('.nabd-typing');
    if (t) t.remove();
  }

  async function sendMessage(text) {
    if (state.sending || !text.trim()) return;
    state.sending = true;
    els.input.value = '';
    els.input.style.height = 'auto';
    addMessage('user', text);
    showTyping();

    const lang = document.documentElement.lang || 'en';
    const ctx = Object.assign({ language: lang }, config.context || {});

    try {
      const res = await fetch('/api/nabd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          message: text,
          history: state.messages.slice(-20),
          context: ctx
        })
      });
      const data = await res.json();
      hideTyping();
      if (data.ok && data.reply) {
        addMessage('assistant', data.reply);
      } else {
        addMessage('assistant', str('error'));
      }
    } catch (e) {
      hideTyping();
      addMessage('assistant', str('error'));
    }
    state.sending = false;
  }

  function toggle() {
    state.open = !state.open;
    els.panel.classList.toggle('open', state.open);
    els.fab.classList.toggle('active', state.open);
    els.fab.setAttribute('aria-label', state.open ? str('close') : str('open'));
    if (state.open && state.messages.length === 0) showWelcome();
    if (state.open && state.messages.length > 0) restoreMessages();
    if (state.open) {
      setTimeout(() => els.input && els.input.focus(), 200);
    }
  }

  function bind() {
    els.fab.addEventListener('click', toggle);
    els.fab.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    els.close.addEventListener('click', toggle);

    if (els.bubble) {
      els.bubbleDismiss.addEventListener('click', () => {
        els.bubble.classList.remove('show');
        state.bubbleShown = false;
      });
      setTimeout(() => {
        if (!state.open) { els.bubble.classList.add('show'); state.bubbleShown = true; }
      }, 2000);
    }

    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(els.input.value); }
    });
    els.send.addEventListener('click', () => sendMessage(els.input.value));

    els.messages.addEventListener('click', (e) => {
      const chip = e.target.closest('.nabd-chip');
      if (chip) sendMessage(chip.dataset.msg);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.open) toggle();
    });
  }

  function init(userConfig) {
    config = userConfig || {};
    const container = document.createElement('div');
    container.className = 'nabd-assistant';
    container.innerHTML = buildHTML();
    document.body.appendChild(container);

    els = {
      container,
      fab: container.querySelector('.nabd-fab'),
      bubble: container.querySelector('.nabd-bubble'),
      bubbleDismiss: container.querySelector('.nabd-bubble-dismiss'),
      panel: container.querySelector('.nabd-panel'),
      messages: container.querySelector('.nabd-panel-messages'),
      input: container.querySelector('.nabd-input'),
      send: container.querySelector('.nabd-send'),
      close: container.querySelector('.nabd-panel-close')
    };

    state.messages = loadHistory();
    bind();
  }

  window.NabdAssistant = { init };
})();
