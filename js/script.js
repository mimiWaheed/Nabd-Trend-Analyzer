/* ============================================================
   NABD (نبض) V3 — shared multi-page script
   i18n EN/AR · themes · nav + scrollspy · page transitions ·
   landing widgets · workspace/auth helpers
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => min + Math.random() * (max - min);
  const $ = (id) => document.getElementById(id);

  /* ----------------------------------------------------------
     I18N DICTIONARY
     ---------------------------------------------------------- */
  const I18N = {
    en: {
      brand: 'NABD',
      'nav.home': 'Home', 'nav.analysis': 'Analysis',
      'nav.usecases': 'Use Cases', 'nav.docs': 'Documentation', 'nav.about': 'About',
      'nav.signin': 'Sign In', 'nav.getstarted': 'Get Started',
      'hero.eyebrow': 'SIGNAL INTELLIGENCE · EGYPT',
      'hero.h1': 'Egypt speaks in signals. We turn them into <span class="grad">answers</span>.',
      'hero.sub': 'NABD (نبض) monitors Egypt\'s news, public opinion, social media and crisis signals across all 27 governorates — then turns any question into a plain-language brief you can act on.',
      'hero.cta1': 'Launch NABD', 'hero.cta2': 'See the workspace',
      'hero.trust': 'Egypt live · all 27 governorates · answers in seconds',
      'pv.trends': 'CURRENT EGYPTIAN TRENDS', 'pv.sentiment': 'Egypt sentiment',
      'pv.positive': 'positive', 'pv.timeline': 'EGYPT · 24H VOLUME',
      'pv.shift': 'Sentiment shift', 'pv.skyline': 'CAIRO · LIVE MONITORING',
      'pv.regions': 'REGION COVERAGE',
      'pv.health': 'SIGNAL HEALTH', 'pv.health.s': 'LIVE · SIX-AXIS MODEL',
      'pv.sources': 'SOURCE MIX', 'pv.sources.s': 'LAST 24H',
      'search.ph': 'Ask NABD about Egypt…', 'search.btn': 'Analyze',
      'search.note': 'Live intelligence engine — results open inside your NABD app',
      'q.cairo': 'Cairo today', 'q.inflation': 'Inflation talks', 'q.pound': 'Egyptian Pound',
      'q.suez': 'Suez Canal', 'q.education': 'Education sentiment', 'q.football': 'Football pulse',
      'q.capital': 'New Capital',
      'stat.1': 'Egyptian signals daily', 'stat.2': 'governorates monitored',
      'stat.3': 'median crisis detection', 'stat.4': 'signal classification accuracy',
      'why.eyebrow': 'WHY NABD',
      'why.title': 'From question to <span class="grad">insight</span>',
      'why.sub': 'One sentence in, a brief you can act on. This is the transformation behind every NABD analysis.',
      'why.c1.t': 'Question',
      'why.c1.b': 'Ask in plain Arabic or English — the way you would ask a colleague.',
      'why.c1.s': '1.4M+ signals / day',
      'why.c2.t': 'Data',
      'why.c2.b': 'News, Facebook, X, Instagram, RSS and Google Trends — 1.4M+ signals a day.',
      'why.c2.s': '98.7% accuracy',
      'why.c3.t': 'Analysis',
      'why.c3.b': 'Classified, deduplicated and timestamped in seconds.',
      'why.c3.s': '3 min median alert',
      'why.c4.t': 'Patterns',
      'why.c4.b': 'Topics, sentiment, regional spread and escalation curves.',
      'why.c4.s': '27 governorates',
      'why.c5.t': 'Insight',
      'why.c5.b': 'A plain-language brief with suggested actions.',
      'why.c5.s': '7 source types',
      'prod.eyebrow': 'THE WORKSPACE',
      'prod.title': 'The analysis, <span class="grad">end to end</span>',
      'prod.sub': 'Run any question and watch it become a structured analysis — KPIs, signal health, regional coverage and source mix in one view.',
      'prod.lead': 'Built for Egypt\'s most demanding teams.',
      'prod.intro': 'NABD is a command center, not a dashboard: every widget below is generated live from the same signal stream — nothing is mocked.',
      'prod.c1.t': 'Real-time monitoring',
      'prod.c1.b': '1.4M+ Egyptian signals a day — aggregated, deduplicated and timestamped in seconds.',
      'prod.c2.t': 'AI analysis',
      'prod.c2.b': 'Classified, summarized and explained in plain Arabic or English.',
      'prod.c3.t': 'Crisis detection',
      'prod.c3.b': 'Early-warning models across the republic — median alert time: 3 minutes.',
      'prod.c4.t': 'Governorate coverage',
      'prod.c4.b': 'Regional nuance across all 27 governorates, not just the capital.',
      'prod.c5.t': 'Social intelligence',
      'prod.c5.b': 'Facebook, X, Instagram, RSS and Google Trends in one sentiment layer.',
      'gv.egypt': 'Egypt', 'gv.cairo': 'Cairo', 'gv.alex': 'Alexandria',
      'gv.giza': 'Giza', 'gv.sharqia': 'Sharqia', 'gv.delta': 'Delta',
      'gv.upper': 'Upper Egypt', 'gv.aswan': 'Aswan',
      'social.eyebrow': 'PRIVATE SOCIAL ANALYSIS',
      'social.title': 'Your audience, <span class="grad">decoded</span>',
      'social.sub': 'Public trends are only half the story. Connect your own Facebook Page and let NABD analyze your audience.',
      'social.fb.title': 'Facebook Page connection',
      'social.fb.desc': 'Connect your Facebook Page to analyze your own audience trends — posts, reactions, comments and growth, privately.',
      'social.fb.idle.title': 'Not connected', 'social.fb.idle.sub': 'No Facebook account linked yet',
      'social.fb.connect': 'Connect Facebook', 'social.fb.disconnect': 'Disconnect',
      'social.fb.connecting.title': 'Connecting…', 'social.fb.connecting.sub': 'Contacting Facebook platform',
      'social.fb.connected.title': 'Connected', 'social.fb.connected.sub': 'Page: NABD Analytics',
      'social.fb.privacy': 'Private by design — page data is never shared, sold or used to train public models.',
      'social.open': 'Open connections',
      'soc.eyebrow': 'PRIVATE SOCIAL ANALYSIS',
      'soc.tw.d': 'Real-time social conversation',
      'soc.yt.d': 'Video content and engagement',
      'soc.tt.d': 'Short-form video trends',
      'soc.li.d': 'Professional network signals',
      'soc.tg.d': 'Channel and group activity',
      'app.title.social': 'Social Media',
      'app.sub.social': 'Connect your social accounts for private audience analysis.',
      'app.nav.social': 'Social Media',
      'uc.eyebrow': 'USE CASES',
      'uc.title': 'Built for people who <span class="grad">need to know first</span>',
      'uc.sub': 'One platform, many missions.',
      'uc.c1.t': 'Government', 'uc.c1.b': 'Public sentiment, regional stability and misinformation tracking for ministries and policy desks.',
      'uc.c2.t': 'Journalists', 'uc.c2.b': 'Breaking-event detection, source discovery and trend evolution for Egyptian newsrooms.',
      'uc.c3.t': 'Researchers', 'uc.c3.b': 'Dataset-grade event streams, exportable evidence and reproducible timelines.',
      'uc.c4.t': 'NGOs', 'uc.c4.b': 'Early warnings on humanitarian issues and community-level public reaction.',
      'uc.c5.t': 'Businesses', 'uc.c5.b': 'Market shifts, competitor chatter and demand signals across Egyptian sectors.',
      'uc.c6.t': 'Security teams', 'uc.c6.b': 'Crisis signals, geopolitical risk and coordinated-activity detection.',
      'uc.c7.t': 'Marketing', 'uc.c7.b': 'Emerging conversations, audience sentiment and cultural timing for campaigns.',
      'uc.c8.t': 'Public relations', 'uc.c8.b': 'Reaction tracking, narrative drift and reputation-risk early warnings.',
      'brand': 'NABD',
      'cta.eyebrow': 'GET STARTED',
      'cta.title': 'Start with a <span class="grad">question</span>.',
      'cta.sub': 'Ask NABD about Egypt in plain language. The analysis opens in your workspace — sign in when you get there.',
      'cta.btn1': 'Start now', 'cta.btn2': 'Open the workspace',
      'cta.note': 'Free 14-day trial · No credit card · Setup in 5 minutes',
      'footer.tagline': 'AI trend intelligence for a country that never stops moving.',
      'footer.c1': 'Product', 'footer.l11': 'Live analysis', 'footer.l12': 'Features',
      'footer.l13': 'Pricing', 'footer.l14': 'Live dashboard',
      'footer.c2': 'Company', 'footer.l21': 'About', 'footer.l22': 'Use cases',
      'footer.l23': 'Contact',
      'footer.c3': 'Resources', 'footer.l31': 'Documentation', 'footer.l32': 'API reference',
      'footer.l33': 'Status',
      'footer.c4': 'Legal', 'footer.l41': 'Privacy', 'footer.l42': 'Terms',
      'footer.l43': 'Security', 'footer.l44': 'DPA',
      'footer.copyright': 'NABD (نبض) Intelligence Systems', 'footer.status': 'All systems operational',
      'nav.legal.eyebrow': 'NABD · LEGAL',
      'nav.legal.privacy': 'Privacy Policy', 'nav.legal.terms': 'Terms of Service',
      'nav.legal.effective': 'Effective Date:',

      /* workspace */
      'ws.back': 'Home', 'ws.new': 'New analysis', 'ws.querylabel': 'TRACKING', 'ws.private.badge': 'Private Analysis',
      'ws.brief': 'AI BRIEF', 'ws.meta1': '14 sources', 'ws.meta2': 'updated 2m ago', 'ws.meta3': 'confidence 94%',
      'ws.brief.findings': 'Key findings', 'ws.brief.dev': 'Key developments', 'ws.brief.why': 'Why it matters',
      'ws.brieftitle': 'Egypt — live brief',
      'ws.topics.t': 'Trending topics',
      'ws.timeline.t': 'Historical trend strength', 'ws.timeline.s': 'WEEKLY TREND INDEX · SIGNAL VOLUME',
      'ws.tab.day': '24H', 'ws.tab.week': '7D', 'ws.tab.month': '30D',
      'ws.donut.t': 'Sentiment split',
      'ws.donut.pos': 'Positive', 'ws.donut.neu': 'Neutral', 'ws.donut.neg': 'Negative',
      'ws.pie.c': 'VOLUME',
      'ws.nodata': 'No data available',
      'ws.sent.na': 'Sentiment data unavailable',
      'ws.sent.sparse': 'Based on {n} signals — low volume, interpret with caution.',
      'ws.timeline.na': 'No timestamped signal data available for this analysis.',
      'ws.timeline.tip': 'index',
      'ws.brief.datapoints': 'Structured data recovered: {d}.',
      'ws.brief.dp': '{name} at {value} {currency} per {unit}',
      'ws.brief.dp.plain': '{name} = {value} {currency}',
      'ws.brief.baseline': 'Trending {v} vs baseline: {t}.',
      'ws.brief.bl.higher': 'higher', 'ws.brief.bl.elevated': 'elevated', 'ws.brief.bl.lower': 'lower', 'ws.brief.bl.moderate': 'moderate',
      'ws.loc.na': 'No city-level geographic data available for this query.',
      'ws.national.t': 'National coverage',
      'ws.national.s': 'Egypt-wide signal',
      'ws.hl.na': 'No AI highlights generated for this query.',
      'ws.src.na': 'No source distribution available for this query.',
      'ws.feed.na': 'No live signals returned for this query.',
      'ws.sum.na': 'No AI brief returned for this query — signals are still displayed below.',
      'ws.src.count': 'sources',
      'ws.updated': 'updated',
      'ws.conf': 'confidence',
      'ws.brief.total': 'Total signal: {n} mentions across {s} sources.',
      'ws.brief.mentions': 'Total signal: {n} mentions.',
      'ws.brief.topics': 'Leading topics: {t}.',
      'ws.brief.sentiment': 'Overall tone is {l}.',
      'ws.brief.tone.pos': 'positive', 'ws.brief.tone.neg': 'negative', 'ws.brief.tone.neu': 'neutral',
      'ws.brief.crises': 'Active crisis signals: {n}.',
      'ws.brief.locations': 'Geographic focus: {l}.',
      'ws.brief.sources': 'Top sources: {l}.',
      'ws.brief.highlights': '{n} notable signals identified.',
      'ws.feed.t': 'Live feed',
      'ws.hl.t': 'AI highlights', 'ws.hl.s': 'GENERATED THIS CYCLE',
      'ws.hl.t1': 'BREAKING EVENT', 'ws.hl.t2': 'EMERGING PATTERN', 'ws.hl.t3': 'MISINFORMATION RISK',
      'ws.hl.t4': 'OPPORTUNITY', 'ws.hl.t5': 'PUBLIC REACTION',
      'ws.inf.t': 'Influencers', 'ws.inf.s': 'TOP VOICES THIS HOUR',
      'ws.src.t': 'Sources',
      'ws.kw.t': 'Top keywords', 'ws.kw.s': 'DETERMINISTIC · COMPUTED FROM AGGREGATION',
      'ws.ph.t': 'Top phrases', 'ws.ph.s': 'EMERGING 2–3 WORD PHRASES',
      'ws.ht.t': 'Hashtags', 'ws.ht.s': 'EXTRACTED FROM SIGNALS',
      'ws.health.t': 'Signal health', 'ws.health.s': 'MOMENTUM · STRENGTH · DIVERSITY · FRESHNESS · RELEVANCE · COVERAGE',
      'ws.foot': 'NABD INTELLIGENCE · REAL-TIME ANALYSIS',
      'ws.src.s2': 'PUBLISHERS FROM THIS ANALYSIS',
      'ws.toast.new': 'New analysis ready — workspace refreshed',
      'ws.toast.query': 'Tracking updated to: <b>{q}</b>',

      /* data-driven dashboard (real n8n contract) */
      'ws.rel.s': '{n}s', 'ws.rel.m': '{n}m', 'ws.rel.h': '{n}h', 'ws.rel.d': '{n}d', 'ws.rel.w': '{n}w',
      'ws.brief.active': 'Active topics: {n}.',
      'ws.brief.sparse': 'The dataset is sparse — treat these signals with caution.',
      'ws.brief.influencers': 'Top voices: {n} influencers.',
      'ws.regional.t': 'Regional intelligence',
      'ws.regional.s': 'DETECTED LOCATIONS FROM THIS ANALYSIS',
      'ws.gov.detected': 'detected mentions',
      'ws.priv.note': 'Private analysis — based on your connected Meta account',
      'ws.pub.note': 'Public analysis — open web signals',
      'ws.meta.generated': 'generated {t}',
      'ws.meta.posts': '{n} resources',
      'ws.meta.scope': 'Scope: {s}',
      'ws.kpi.posts': 'RESOURCES ANALYZED',
      'ws.kpi.active': 'ACTIVE TOPICS',
      'ws.kpi.sentiment': 'OVERALL SENTIMENT',
      'ws.kpi.emergency': 'EMERGENCY ALERTS',
      'ws.sent.sub': '{q} · {s}',
      'ws.topics.s2': 'RANKED BY SEVERITY',
      'ws.src.count2': '{n} items',
      'ws.src.author': 'by {a}',
      'ws.src.eng': '{n} engagements',
      'ws.feed.s2': 'REAL SOURCES · CLICK TO OPEN',
      'ws.influencers.na': 'No influencers identified in this analysis.',
      'ws.loc.egypt': 'Egypt',
      'ws.preview.t': 'Start a new analysis',
      'ws.preview.s': 'Try one of these queries, or ask anything about Egypt.',
      'ws.preview.go': 'Analyze',
      'ws.scope.public': 'Public', 'ws.scope.private': 'Private',
      'db.meta.connected': 'Facebook connected',
      'db.meta.error': 'Meta connection failed — please try again.',
      'db.meta.notconfigured': 'Meta OAuth is not configured on the server yet (set META_APP_ID, META_APP_SECRET, META_REDIRECT_URI).',
      'db.meta.startfail': 'Could not start Meta authorization.',
      'db.meta.popup': 'The Meta authorization window was blocked — allow popups and try again.',
      'db.meta.select.title': 'Select the page to analyze',
      'db.meta.select.sub': 'This page will be used for private analysis.',
      'db.meta.select.connect': 'Connect this page',
      'db.meta.select.cancel': 'Cancel',

      /* filters */
      'filters.label': 'FILTER', 'filters.all': 'All', 'filters.news': 'News',
      'filters.social': 'Social', 'filters.gov': 'Government', 'filters.sport': 'Sports',
      'filters.business': 'Business',

      /* auth */
      'auth.signin.title': 'Welcome back',
      'auth.signin.sub': 'Sign in to your NABD workspace.',
      'auth.signup.title': 'Create your account',
      'auth.signup.sub': 'Start watching Egypt\'s pulse in minutes.',
      'auth.email': 'Email address', 'auth.pass': 'Password', 'auth.confirm': 'Confirm password',
      'auth.phone': 'Phone number',
      'auth.first': 'First name', 'auth.last': 'Last name', 'auth.org': 'Organization',
      'auth.remember': 'Remember me', 'auth.forgot': 'Forgot password?',
      'auth.submit': 'Sign In', 'auth.signup.submit': 'Create account',
      'auth.alt': 'or continue with', 'auth.google': 'Google', 'auth.facebook': 'Facebook',
      'auth.soon': 'Soon', 'auth.soon.note': 'Google and Facebook sign-in are coming soon — no session is created.',
      'auth.signup.switch': 'Don\'t have an account? <a class="link-soft" href="signup.html" data-page="signup.html">Sign up</a>',
      'auth.signin.switch': 'Already have an account? <a class="link-soft" href="signin.html" data-page="signin.html">Sign in</a>',
      'auth.back': 'Back to home',
      'auth.terms': 'I agree to the <a class="link-soft" href="../terms.html" data-page="../terms.html">Terms of Service</a> and the <a class="link-soft" href="../privacy-policy.html" data-page="../privacy-policy.html">Privacy Policy</a>',
      'auth.legal': 'By continuing you agree to the <a class="link-soft" href="../terms.html" data-page="../terms.html">Terms of Service</a> and the <a class="link-soft" href="../privacy-policy.html" data-page="../privacy-policy.html">Privacy Policy</a>',
      'auth.art1.t': 'Your intelligence command center',
      'auth.art1.b': 'Trends, sentiment, crises and live feeds across every Egyptian governorate — in one live workspace.',
      'auth.art2.t': 'Your intelligence command center',
      'auth.art2.b': 'Trends, sentiment, crises and live feeds across every Egyptian governorate — in one live workspace.',
      'auth.err.email': 'Please enter a valid email address.',
      'auth.err.email.bad': 'Temporary mailboxes are not allowed.',
      'auth.err.email.notfound': 'This email does not exist.',
      'auth.err.name': 'Name required.',
      'auth.err.name.invalid': 'Invalid name.',
      'auth.err.phone': 'Invalid Egyptian phone number.',
      'auth.err.pass': 'Password must be at least 8 characters.',
      'auth.err.pass.required': 'Please enter a password.',
      'auth.err.confirm.req': 'Please confirm your password.',
      'auth.err.req': 'Please fill in all required fields.',
      'auth.err.match': 'Passwords do not match.',
      'auth.err.terms': 'Terms must be accepted.',
      'auth.verify.title': 'Verify your email',
      'auth.verify.sub': 'Enter the 6-digit code we sent to',
      'auth.verify.label': 'Verification code',
      'auth.verify.btn': 'Verify',
      'auth.verify.no': 'Didn\'t get a code?',
      'auth.verify.resend': 'Resend code',
      'auth.verify.sent': 'Code resent — check your inbox.',
      'auth.verify.err': 'Invalid or expired code. Please try again.',
      'auth.verify.err.digits': 'Enter the 6-digit code.',
      'auth.pending': 'Please wait…',
      'auth.ok.signin': 'Welcome back — launching app…',
      'auth.ok.signup': 'Account created — launching workspace…',
      'auth.social': 'Social sign-in is coming soon — no session was created.',
      'auth.otp.login': 'Continue with OTP',
      'auth.otp.title': 'Continue with OTP',
      'auth.otp.sub': 'Enter your email and we\'ll send a one-time code.',
      'auth.otp.send': 'Send code',
      'auth.otp.submit': 'Sign in with code',
      'auth.otp.hint': '<strong>Can\'t find your OTP?</strong> Check your <strong>Spam or Junk</strong> folder. Depending on your email provider, the message may also appear under <strong>Promotions or Other</strong>.',
      'auth.otp.cooldown': 'A code was already sent. Try again in {s} seconds.',
      'auth.otp.err.nomatch': 'We couldn\'t send a code to this email. Make sure you use the email you registered with.',
      'auth.otp.err.send': 'We couldn\'t send the code right now. Please try again.',
      'auth.forgot.title': 'Reset your password',
      'auth.forgot.sub': 'Enter your email and we\'ll send a reset code.',
      'auth.forgot.send': 'Send code',
      'auth.reset.next': 'Verify code',
      'auth.reset.submit': 'Reset password',
      'auth.reset.pass': 'New password',
      'auth.reset.confirm': 'Confirm new password',
      'auth.reset.ok.t': 'Password updated',
      'auth.reset.ok.s': 'You can now sign in with your new password.',
      'auth.back.to.signin': 'Back to sign in',
      'auth.back.to.signup': 'Back to sign up',
      'auth.back.to.request': 'Change email',
      'auth.go.to.signin': 'Go to log in',
      'auth.verify.err.sent': 'We couldn\'t send the email. Check your inbox or try again.',
      'auth.verify.err.dev': 'SMTP isn\'t configured — the code was printed to the server console.',
      'auth.pwd.hint': 'At least 8 characters — add numbers and symbols for a stronger password.',
      'auth.pwd.weak': 'Weak', 'auth.pwd.fair': 'Fair', 'auth.pwd.strong': 'Strong',
      'auth.pwd.good': 'Good', 'auth.pwd.len': '8+ characters', 'auth.pwd.upper': 'Uppercase', 'auth.pwd.lower': 'Lowercase', 'auth.pwd.num': 'Number', 'auth.pwd.spec': 'Special character',
      'c.eg': 'Egypt', 'c.sa': 'Saudi Arabia', 'c.ae': 'United Arab Emirates',
      'c.us': 'United States', 'c.gb': 'United Kingdom', 'c.de': 'Germany',
      'c.fr': 'France', 'c.qa': 'Qatar',
      'lng.en': 'English', 'lng.ar': 'العربية',

      /* app shell */
      'app.nav.dashboard': 'Dashboard', 'app.nav.analysis': 'Analysis',
      'app.nav.history': 'History', 'app.nav.reports': 'Reports',
      'app.nav.private': 'Private Analysis', 'app.nav.connections': 'Connections',
      'app.nav.favorites': 'Favorites', 'app.nav.notifications': 'Notifications',
      'app.nav.settings': 'Settings', 'app.nav.profile': 'Profile',
      'app.sep1': 'ANALYSIS', 'app.sep2': 'ACCOUNT',
      'app.status': 'All systems operational',
      'app.menu.profile': 'Profile', 'app.menu.workspace': 'Workspace',
      'app.menu.history': 'History', 'app.menu.settings': 'Settings',
      'app.menu.theme': 'Theme', 'app.menu.lang': 'Language', 'app.menu.signout': 'Sign Out',
      'app.theme.dark': 'Dark', 'app.theme.light': 'Light',
      'app.title.dashboard': 'Dashboard', 'app.title.history': 'Analysis History',
      'app.title.reports': 'Reports Center', 'app.title.profile': 'Profile',
      'app.title.settings': 'Settings', 'app.title.connections': 'Connections',
      'app.title.api': 'API & Developer', 'app.title.notifications': 'Notifications',
      'app.title.favorites': 'Favorites', 'app.title.searches': 'Saved Searches',
      'app.sub.dashboard': 'Your intelligence hub — briefing, trends and everything you pinned in one place.',
      'app.sub.history': 'Every analysis you ran, searchable and sorted.',
      'app.sub.reports': 'Generated, scheduled and exported — all your intelligence documents.',
      'app.sub.profile': 'Your identity and usage at a glance.',
      'app.sub.settings': 'Account, appearance, security and everything in between.',
      'app.sub.connections': 'Fuse your sources into one intelligence layer.',
      'app.sub.api': 'Programmatic access for advanced teams.',
      'app.sub.notifications': 'Alerts and updates across the platform.',
      'app.sub.favorites': 'Everything you bookmarked in one place.',
      'app.sub.searches': 'Your saved queries, organized in folders.',
      'app.crumb.app': 'App',
      'app.theme.light': 'Switch to light theme', 'app.theme.dark': 'Switch to dark theme',
      'app.st.done': 'Completed', 'app.st.running': 'Running', 'app.st.failed': 'Failed',
      'app.st.remove': 'Remove',
      'app.cat.news': 'News', 'app.cat.social': 'Social', 'app.cat.gov': 'Government',
      'app.cat.sport': 'Sports', 'app.cat.business': 'Business',
      'app.soon': 'Coming soon',
      'app.toast.saved': 'Settings saved.', 'app.toast.del': 'Deleted.',
      'app.toast.dup': 'Duplicated.', 'app.toast.shared': 'Share link copied.',
      'app.toast.exported': 'Export started.', 'app.toast.revoked': 'Key revoked.',
      'app.toast.empty': 'Ask NABD something first.',
      'app.toast.alert': 'Alert created — you will be notified when it fires.',
      'db.fb.on': 'Facebook connected', 'db.fb.off': 'Connect Facebook',
      'db.fb.disconnect': 'Disconnect', 'db.fb.acct': 'Private social signals active',
      'db.fb.conf.t': 'Disconnect Facebook?',
      'db.fb.conf.s': 'Private social trend analysis will no longer be available until you reconnect.',
      'db.fb.conf.cancel': 'Cancel', 'db.fb.conf.ok': 'Disconnect',
      'db.fb.need': 'Connect Facebook first — Private analysis needs a connected account.',
      'db.priv.pub': 'Public', 'db.priv.priv': 'Private',
      'db.preview.t': 'Live signals — what NABD tracks right now',
      'db.loading.1': 'Scanning news sources…',
      'db.loading.2': 'Cross-referencing social signals…',
      'db.loading.3': 'Detecting emerging topics…',
      'db.loading.4': 'Measuring sentiment…',
      'db.loading.5': 'Mapping geographic signals…',
      'db.loading.6': 'Building intelligence brief…',
      'db.analyzing': 'Analyzing…', 'db.ready': 'Intelligence ready',
      'db.error.t': 'Something interrupted the analysis.',
      'db.error.s': 'Your signals are still safe — try running the analysis again.',
      'db.error.retry': 'Try again',
      'app.toast.created': 'Created.', 'app.toast.renamed': 'Renamed.',
      'app.toast.conn': 'Demo mode — connection mocked.',
      'app.toast.signedout': 'Signed out.', 'app.toast.copied': 'Copied to clipboard.',
      'app.toast.moved': 'Moved to folder.', 'app.toast.folder': 'Folder created.',
      'app.toast.noexport': 'Run an analysis first — then export its report.',
      'app.toast.facility': 'Report queued to the responsive facility.',
      'app.toast.savedReport': 'Report saved for later.',
      'app.toast.fav': 'Added to favorites.',
      'app.toast.favOff': 'Removed from favorites.',
      'app.toast.email': 'Preparing your email…',
      'app.toast.avatar': 'Profile photo updated.',
      'app.toast.savedNotif': 'Saved report — re-run it from the Dashboard to view.',
      'app.toast.savedFail': 'Could not save the report — it may be too large.',

      /* report export */
      'export.back': 'Back to dashboard', 'export.title': 'Analysis report',
      'export.sub': 'NABD INTELLIGENCE · PDF EXPORT',
      'export.print': 'Download PDF', 'export.generated': 'Generated',
      'export.lang': 'Report language', 'export.noData.t': 'No report to export',
      'export.noData.s': 'Run an analysis on the dashboard first — your latest results will appear here.',
      'export.goDashboard': 'Go to dashboard', 'export.printHint': 'Choose “Save as PDF” in the print dialog.',
      'export.h.momentum': 'Momentum', 'export.h.signal': 'Signal strength',
      'export.h.diversity': 'Source diversity', 'export.h.freshness': 'Freshness',
      'export.h.relevance': 'Relevance', 'export.h.coverage': 'Coverage',
      'export.score': 'Score', 'export.top': 'top', 'export.recent': 'recent', 'export.articles': 'articles',
      'ws.gen.note': 'generated {t} · {n} resources',
      'ws.actions.t': 'Suggested actions',
      'ws.actions.s': 'QUICK ACTIONS FOR THIS ANALYSIS',
      'ws.actions.send': 'Send report to facility',
      'ws.actions.save': 'Save report for later',
      'ws.actions.share': 'Export / share report',
      'ws.actions.pick': 'Send the report to a facility',
      'ws.actions.pick.s': 'Choose a destination — the report will be drafted with their contact placeholder.',
      'ws.actions.pick.to': 'Recipient email',
      'ws.actions.pick.to.ph': 'facility@example.com',
      'ws.actions.pick.body': 'Ready complaint draft',
      'ws.actions.pick.send': 'Send report',
      'ws.actions.pick.err': 'Enter a recipient email first.',
      'ws.actions.fav': 'Add to favorites',
      'ws.actions.fav.on': 'Added to favorites',
      'ws.actions.fav.off': 'Removed from favorites',
      'ws.fac.email.line1': 'NABD report for query "{q}"',
      'ws.fac.email.line2': 'Generated {t}',
      'ws.fac.email.line3': 'Brief: {b}',
      'ws.fac.email.line4': 'Full report: {u}',
      'ws.fac.email.line5': 'Dear team, we are flagging the signals detected by the NABD analysis of "{q}". Please review and take the necessary action.',
      'ws.fac.email.sign': '— NABD (نبض)',
      'ws.actions.close': 'Close',
      'ws.src.more': 'Show all ({n})',
      'ws.src.fewer': 'Show fewer',

      /* overall analysis summary (generated from the real results) */
      'ws.hl.total': 'Overall analysis summary',
      'ws.total.momentum': 'Momentum is {dir} with a strength score of {score}.',
      'ws.total.sentiment': 'The overall tone is {label} — {pos}% positive, {neu}% neutral, {neg}% negative.',
      'ws.total.kw': 'Leading keyword: {kw}.',
      'ws.total.coverage': '{art} resources from {src} sources were analyzed.',
      'ws.total.crisis': 'Heads-up: {e} emergency signal(s) were flagged.',

      /* reminder (create alert) */
      'ws.reminder.t': 'Set a reminder',
      'ws.reminder.s': 'Based on this analysis, we recommend checking again later.',
      'ws.reminder.email': 'Reminder email',
      'ws.reminder.12h': 'Check again in 12 hours',
      'ws.reminder.24h': 'Check again in 24 hours',
      'ws.reminder.2d': 'Check again in 2 days',
      'ws.reminder.3d': 'Check again in 3 days',
      'ws.reminder.1w': 'Check again in 1 week',
      'ws.reminder.2w': 'Check again in 2 weeks',
      'ws.reminder.1mo': 'Check again in 1 month',
      'ws.reminder.alert.t': 'Create alert',
      'ws.reminder.alert.s': 'NABD stores this report and emails you when it is time to check again.',
      'ws.reminder.reco': 'RECOMMENDED',
      'ws.reminder.set': 'Set reminder',
      'ws.reminder.will': 'We will email you a reminder when it is due.',
      'app.toast.reminder': 'Reminder set — we will email you when it is due.',
      'app.toast.reminderErr': 'Could not set the reminder. Try again.',

      /* report facilities */
      'ws.facility.elec': 'Electricity companies',
      'ws.facility.water': 'Water companies',
      'ws.facility.gas': 'Gas companies',
      'ws.facility.complaints': 'General complaints',
      'ws.facility.hospitals': 'Hospitals',
      'ws.facility.emergencies': 'Emergencies',
      'ws.facility.police': 'Police stations',
      'ws.facility.emergencynumbers': 'Emergency numbers',

      /* dashboard */
      'dash.qa': 'Quick actions',
      'dash.qa.new': 'New analysis', 'dash.qa.saved': 'Private Analysis',
      'dash.qa.export': 'Export report', 'dash.qa.alert': 'Create alert',
      'dash.qa.nav': 'Jump back in',
      'dash.qa.nav.connections': 'Connect a source',
      'dash.qa.nav.connections.d': 'Add Facebook or an n8n API',
      'dash.qa.nav.settings': 'Open settings',
      'dash.qa.nav.settings.d': 'Theme, language and more',
      'dash.qa.nav.profile': 'View profile',
      'dash.qa.nav.profile.d': 'Your details and activity',
      'dash.qa.nav.history': 'Browse history',
      'dash.qa.nav.history.d': 'Re-run past analyses',
      'dash.suggest.t': 'Suggested for you',
      'dash.brief': 'Daily AI briefing', 'dash.brief.sub': 'EGYPT · PREPARED FOR YOU',
      'dash.brief.b1': 'Good morning. <strong>Economy</strong> leads today: Egyptian Pound strength is drawing inflows, inflation expectations are easing in Cairo, and Suez Canal volumes remain at record levels.',
      'dash.brief.b2': 'In <strong>society</strong>, the New Capital openings are dominating positive conversation, while staple-price chatter across the Delta needs monitoring. Two currency-rumor clusters flagged for review.',
      'dash.brief.b3': '<strong>Watchlist:</strong> inflation release, Suez announcement, El Clasico build-up.',
      'dash.brief.tag1': 'Economy', 'dash.brief.tag2': 'Suez Canal', 'dash.brief.tag3': 'Watchlist',
      'dash.trend': 'Trend summary', 'dash.trend.sub': 'EGYPT MENTIONS · 7 DAYS',
      'dash.trend.up': 'vs last week',
      'dash.rec': 'Recent analyses', 'dash.rec.all': 'View all',
      'dash.rec.q1': 'Cairo food prices', 'dash.rec.q2': 'Suez Canal traffic',
      'dash.rec.q3': 'Egyptian Pound outlook', 'dash.rec.q4': 'Education sentiment',
      'dash.rec.q5': 'El Clasico build-up',
      'dash.pinned': 'Pinned reports', 'dash.pinned.all': 'View all',
      'dash.pinned.r1': 'Weekly Egypt Brief', 'dash.pinned.r2': 'Inflation Risk Watch',
      'dash.pinned.r3': 'Social Pulse Report',
      'dash.sugg': 'Suggested analyses',
      'dash.sugg.q1': 'New Capital construction news', 'dash.sugg.q2': 'Tourism recovery metrics',
      'dash.sugg.q3': 'Election law debate', 'dash.sugg.q4': 'Delta grain markets',
      'dash.fav': 'Favorite searches',
      'dash.fav.q1': 'Egyptian Pound', 'dash.fav.q2': 'Suez Canal', 'dash.fav.q3': 'Inflation',
      'dash.alerts': 'Latest alerts',
      'dash.alerts.t1': 'Currency rumor cluster in Delta groups', 'dash.alerts.t2': 'Suez volume record trending',
      'dash.alerts.t3': 'Positive spike around New Capital openings',
      'dash.act': 'Recent activity',
      'dash.act.t1': 'Analysis completed — Cairo food prices', 'dash.act.t2': 'Report exported — Weekly Egypt Brief',
      'dash.act.t3': 'Facebook page connected', 'dash.act.t4': 'Alert created — inflation release',
      'dash.accounts': 'Connected accounts',
      'dash.exports': 'Recent exports',
      'dash.exports.t1': 'Weekly Egypt Brief', 'dash.exports.t2': 'Suez Canal dataset',
      'dash.exports.t3': 'Sentiment export — Cairo',

      /* history */
      'hist.search.ph': 'Search analyses…',
      'hist.filter.all': 'All', 'hist.filter.public': 'Public', 'hist.filter.private': 'Private',
      'hist.filter.exported': 'Exported', 'hist.filter.fav': 'Favorited',
      'hist.sort.recent': 'Newest', 'hist.sort.popular': 'Most popular',
      'hist.view.grid': 'Grid', 'hist.view.list': 'List', 'hist.view.timeline': 'Timeline',
      'hist.q1': 'Cairo food prices', 'hist.q2': 'Suez Canal traffic', 'hist.q3': 'Egyptian Pound outlook',
      'hist.q4': 'Inflation expectations', 'hist.q5': 'Education sentiment', 'hist.q6': 'El Clasico build-up',
      'hist.q7': 'New Capital openings', 'hist.q8': 'Tourism recovery',
      'hist.rerun': 'Re-run', 'hist.pin': 'Pin', 'hist.unpin': 'Unpin', 'hist.delete': 'Delete',
      'hist.count': 'analyses',
      'hist.empty': 'No analyses yet — run one from the dashboard and it will appear here.',

      /* reports */
      'rep.generated': 'Generated reports',
      'rep.scheduled': 'Scheduled reports',
      'rep.exports': 'Exports',
      'rep.empty': 'No reports yet — run an analysis and export one here.',
      'rep.type.pdf': 'PDF', 'rep.type.csv': 'CSV', 'rep.type.weekly': 'WEEKLY',
      'rep.type.monthly': 'MONTHLY', 'rep.type.risk': 'RISK', 'rep.type.trend': 'TREND',
      'rep.r1': 'Weekly Egypt Brief', 'rep.r2': 'Inflation Risk Watch', 'rep.r3': 'Social Pulse Report',
      'rep.r4': 'Monthly Intelligence Summary', 'rep.r5': 'Suez Canal Trend Report',
      'rep.r6': 'Egypt Market Risk Review',
      'rep.s1': 'Daily morning brief', 'rep.s2': 'Weekly governorate digest', 'rep.s3': 'Monthly export pack',
      'rep.e1': 'Suez Canal dataset', 'rep.e2': 'Sentiment export — Cairo', 'rep.e3': 'Crisis event log',
      'rep.preview': 'Preview', 'rep.download': 'Download', 'rep.duplicate': 'Duplicate',
      'rep.share': 'Share', 'rep.delete': 'Delete',
      'rep.saved.empty': 'No saved reports yet — save one from the dashboard.',
      'rep.open': 'Open',
      'rep.downloaded': 'Download recorded.',

      /* profile */
      'prof.about': 'About',
      'prof.name': 'Name', 'prof.role': 'Role', 'prof.org': 'Organization',
      'prof.city': 'City', 'prof.lang': 'Language', 'prof.email': 'Email',
      'prof.joined': 'Joined',
      'prof.usage': 'Usage',
      'prof.phone': 'Phone',
      'prof.verified': 'Verified', 'prof.unverified': 'Unverified',
      'prof.save': 'Save changes', 'prof.cancel': 'Cancel',
      'prof.edit.err': 'Could not update your profile. Please try again.',
      'prof.favorites.empty': 'No favorite categories yet.',
      'prof.activity.empty': 'No recent activity yet.',
      'prof.u3': 'Exports', 'prof.u4': 'Searches',
      'prof.photo': 'Profile photo',
      'prof.photo.add': 'Add photo',
      'prof.photo.remove': 'Remove photo',
      'prof.crop.t': 'Crop photo',
      'prof.crop.s': 'Drag to reposition. Use the corner handle to resize the square.',
      'prof.crop.save': 'Crop & save',
      'act.analysis': 'Analysis completed — {q}',
      'act.export': 'Report exported — {q}',
      'act.save': 'Report saved — {q}',
      'act.fav': 'Report favorited — {q}',
      'act.alert': 'Alert created — {q}',
      'act.reminder': 'Reminder set — {q}',
      'act.profile': 'Profile updated',
      'act.avatar': 'Profile photo updated',
      'act.conn': '{n} connected',
      'prof.cats': 'Favorite categories',
      'prof.activity': 'Recent activity',
      'prof.edit': 'Edit profile',
      'prof.nav.title': 'Looking for something?',
      'prof.nav.connections': 'Account Connections', 'prof.nav.connections.d': 'Check your account connections.',
      'prof.nav.history': 'Your History', 'prof.nav.history.d': 'Check your research history.',
      'prof.nav.settings': 'Nabd Settings', 'prof.nav.settings.d': 'Access Nabd settings.',

      /* settings */
      'set.appearance': 'Appearance', 'set.lang': 'Language',
      'set.notif': 'Notifications', 'set.privacy': 'Privacy', 'set.security': 'Security',
      'set.privacy.doc': 'Read the full policy', 'set.privacy.doc.s': 'See how Nabd handles your information.', 'set.privacy.doc.b': 'Privacy Policy',
      'set.shortcuts': 'Shortcuts', 'set.experimental': 'Experimental features',
      'set.danger': 'Danger zone',
      'set.app.theme': 'Theme', 'set.app.dark': 'Dark', 'set.app.light': 'Light', 'set.app.system': 'System',
      'set.app.accent': 'Accent', 'set.app.sub': 'Applies instantly and is saved on this device.',
      'set.an.title': 'Analysis preferences', 'set.an.sub': 'Defaults apply to every new analysis.',
      'set.an.scope': 'Default analysis scope', 'set.an.src': 'Default sources',
      'set.an.s1': 'All topics', 'set.an.s2': 'News', 'set.an.s3': 'Business', 'set.an.s4': 'Social', 'set.an.s5': 'Sports', 'set.an.s6': 'Government',
      'set.an.src1': 'News', 'set.an.src2': 'Social media', 'set.an.src3': 'RSS feeds', 'set.an.src4': 'Web search',
      'set.lang.sub': 'Interface language — content translation is applied instantly.',
      'set.n1.t': 'Breaking event alerts', 'set.n1.s': 'Push alerts for crisis detection',
      'set.n2.t': 'Trend spikes', 'set.n2.s': 'Notify when a topic crosses its volume threshold',
      'set.n3.t': 'Report ready', 'set.n3.s': 'Email when a scheduled report finishes',
      'set.n4.t': 'Connection issues', 'set.n4.s': 'Warn when a source fails to sync',
      'set.n5.t': 'Weekly digest', 'set.n5.s': 'A Saturday summary of your week',
      'set.p1.t': 'Private by default', 'set.p1.s': 'New analyses are not shared with the team',
      'set.p2.t': 'Hide export metadata', 'set.p2.s': 'Strip timestamps from exported files',
      'set.p3.t': 'Anonymize social data', 'set.p3.s': 'Remove handles from analysis views',
      'set.sec1.t': 'Change password', 'set.sec1.s': 'Last changed 42 days ago',
      'set.sec1.b': 'Change', 'set.sec2.t': 'Two-factor authentication', 'set.sec2.s': 'Add an authenticator app',
      'set.shk1': 'New analysis', 'set.shk2': 'Run saved search', 'set.shk3': 'Export report',
      'set.shk4': 'Open settings', 'set.shk5': 'Toggle theme',
      'set.k': 'Shortcut', 'set.k.action': 'Action',
      'set.exp1.t': 'Narrative maps', 'set.exp1.s': 'Visual story-of-the-story graphs',
      'set.exp2.t': 'Voice briefings', 'set.exp2.s': 'Listen to your daily briefing',
      'set.exp3.t': 'Live collaborator cursors', 'set.exp3.s': 'Multi-seat realtime presence',
      'set.danger.sub': 'Delete your account, analyses and exports. This cannot be undone.',
      'set.danger.b': 'Delete account',
      'set.change': 'Change', 'set.toggle': 'Enable',

      /* connections */
      'conn.health': 'API health', 'conn.last': 'Last sync', 'conn.status.ok': 'Connected',
      'conn.status.off': 'Disconnected', 'conn.status.soon': 'Coming soon',
      'conn.connect': 'Connect', 'conn.disconnect': 'Disconnect', 'conn.reconnect': 'Reconnect',
      'conn.fb.d': 'Page audience analysis', 'conn.ig.d': 'Instagram insights',
      'conn.rss.d': 'Custom RSS feeds', 'conn.gn.d': 'Global headlines',
      'conn.gt.d': 'Search interest curves', 'conn.na.d': 'News API aggregation',
      'conn.sp.d': 'Search engine results', 'conn.gq.d': 'Ultra-fast inference for AI',
      'conn.n8n': 'n8n resources',
      'conn.n8n.s': 'Extend NABD with automation resources. Add an API key to enable each one.',
      'conn.add': 'Add API',
      'conn.remove': 'Remove API',
      'conn.api.ph': 'Paste your API key…',
      'conn.api.saved': 'API key added.',
      'conn.api.removed': 'API key removed.',
      'conn.soon.more': 'More sources are on the way.',

      /* api */
      'api.keys': 'API keys', 'api.keys.create': 'Create key', 'api.keys.revoke': 'Revoke',
      'api.keys.copy': 'Copy', 'api.k1': 'Production key', 'api.k2': 'Staging key',
      'api.k1.s': 'prod · created 40 days ago', 'api.k2.s': 'staging · created 6 days ago',
      'api.webhooks': 'Webhooks', 'api.add': 'Add webhook', 'api.w1': 'Crisis alerts',
      'api.w2': 'Report completion', 'api.wx': 'Delete',
      'api.logs': 'Request logs', 'api.usage': 'Usage',
      'api.usage.req': 'Requests today', 'api.usage.limit': 'Rate limit',
      'api.usage.env': 'Environment', 'api.usage.env.v': 'Production',
      'api.usage.end': 'Endpoints', 'api.usage.end1': '/v1/analyze', 'api.usage.end2': '/v1/trends',
      'api.log1': 'POST /v1/analyze', 'api.log2': 'GET /v1/trends', 'api.log3': 'GET /v1/crisis',
      'api.log4': 'POST /v1/export', 'api.future': 'Future integrations',

      /* notifications */
      'notif.mark': 'Mark all read', 'notif.unread': 'unread',
      'notif.f.all': 'All', 'notif.f.ai': 'AI alerts', 'notif.f.trend': 'Trend spikes',
      'notif.f.system': 'System', 'notif.f.reports': 'Reports',
      'notif.f.conn': 'Connections', 'notif.f.export': 'Exports',
      'notif.t1': 'Crisis detected — currency rumor cluster', 'notif.t2': 'Trend spike: Suez Canal',
      'notif.t3': 'Weekly Egypt Brief is ready', 'notif.t4': 'Facebook page connected',
      'notif.t5': 'Export finished — Suez dataset', 'notif.t6': 'Inflation topic crossed threshold',
      'notif.t7': 'Scheduled report failed — source timeout', 'notif.t8': 'New feature: narrative maps',
      'notif.s1': 'Escalation risk: elevated misinformation around currency rumors in Delta groups.',
      'notif.s2': 'Conversation volume tripled in the last 3 hours.',
      'notif.s3': 'Generated from 14 sources — available as PDF and CSV.',
      'notif.s4': 'Page: NABD Analytics — audience sync started.',
      'notif.s5': 'CSV ready to download in Reports.',
      'notif.s6': 'Inflation discussion crossed its 24-hour threshold.',
      'notif.s7': 'One source timed out — the report will retry automatically.',
      'notif.s8': 'Try it under Settings → Experimental.',
      'notif.empty': 'Nothing here yet.',
      'notif.empty.new': 'No notifications yet — completed analyses and account events will appear here.',
      'notif.fb.t': 'Facebook connected', 'notif.fb.s': 'Page: {p}',
      'notif.run.t': 'Analysis completed', 'notif.run.s': 'Query: {q}',
      'notif.alert.t': 'Reminder due',
      'notif.alert.s': 'Re-run your analysis of "{q}" for the latest signals.',
      'notif.saved.t': 'Saved report — {q}',
      'notif.saved.s': 'This report is a saved draft. Re-run the analysis from the Dashboard to see full results.',
      'notif.email.reminder': 'Reminder email sent.',
      'notif.email.reminderErr': 'Could not send the reminder email.',
      'notif.auth.in.t': 'Signed in', 'notif.auth.in.s': 'Welcome back to NABD.',
      'notif.auth.up.t': 'Account created', 'notif.auth.up.s': 'Welcome to NABD — your workspace is ready.',

      /* favorites */
      'fav.t.reports': 'Reports', 'fav.t.searches': 'Searches',
      'fav.t.dashboards': 'Dashboards', 'fav.t.topics': 'Topics',
      'fav.r1': 'Weekly Egypt Brief', 'fav.r2': 'Inflation Risk Watch', 'fav.r3': 'Social Pulse Report',
      'fav.s1': 'Egyptian Pound', 'fav.s2': 'Suez Canal', 'fav.s3': 'New Capital',
      'fav.d1': 'Governorate overview', 'fav.d2': 'Crisis command board', 'fav.d3': 'Social pulse',
      'fav.t1': 'Economy', 'fav.t2': 'Suez Canal', 'fav.t3': 'Education',
      'fav.empty.reports': 'No favorited reports yet — star a report from the dashboard.',
      'fav.empty.searches': 'No favorited searches yet — pin a search from history.',
      'fav.empty.dashboards': 'Saved dashboards will appear here.',
      'fav.empty.topics': 'Followed topics will appear here.',

      /* saved searches */
      'srch.new': 'New folder', 'srch.rename': 'Rename', 'srch.dup': 'Duplicate',
      'srch.run': 'Run again', 'srch.del': 'Delete', 'srch.fav': 'Favorite',
      'srch.folders': 'Folders', 'srch.all': 'All searches',
      'srch.s1': 'Cairo food prices', 'srch.s2': 'Suez Canal traffic', 'srch.s3': 'Egyptian Pound outlook',
      'srch.s4': 'Education sentiment', 'srch.s5': 'Tourism recovery',
      'srch.f1': 'Economy', 'srch.f2': 'Infrastructure',
      'srch.empty': 'No saved searches match this folder.'
    },

    ar: {
      brand: 'نبض',
      'nav.home': 'الرئيسية', 'nav.analysis': 'التحليل',
      'nav.usecases': 'حالات الاستخدام', 'nav.docs': 'التوثيق', 'nav.about': 'من نحن',
      'nav.signin': 'تسجيل الدخول', 'nav.getstarted': 'ابدأ الآن',
      'hero.eyebrow': 'ذكاء الإشارات · مصر',
      'hero.h1': 'مصر تتحدث بالإشارات. نحولها إلى <span class="grad">إجابات</span>.',
      'hero.sub': 'نبض يرصد أخبار مصر والرأي العام ومواقع التواصل الاجتماعي وإشارات الأزمات في 27 محافظة — ثم يحوّل أي سؤال إلى موجز واضح يمكنك التصرف بناءً عليه.',
      'hero.cta1': 'أطلق نبض', 'hero.cta2': 'شاهد مساحة العمل',
      'hero.trust': 'مصر مباشرة · 27 محافظة · إجابات في ثوانٍ',
      'pv.trends': 'ترندات مصر الحالية', 'pv.sentiment': 'مشاعر مصر',
      'pv.positive': 'إيجابي', 'pv.timeline': 'مصر · 24 ساعة',
      'pv.shift': 'تحول في المشاعر', 'pv.skyline': 'القاهرة · مراقبة حية',
      'pv.regions': 'التغطية الإقليمية',
      'pv.health': 'صحة الإشارة', 'pv.health.s': 'مباشر · نموذج سداسي المحاور',
      'pv.sources': 'توزيع المصادر', 'pv.sources.s': 'آخر 24 ساعة',
      'search.ph': 'اسأل نبض عن مصر…', 'search.btn': 'حلّل',
      'search.note': 'محرك ذكاء حيّ — تظهر النتائج داخل تطبيق نبض',
      'q.cairo': 'القاهرة اليوم', 'q.inflation': 'نقاشات التضخم', 'q.pound': 'الجنيه المصري',
      'q.suez': 'قناة السويس', 'q.education': 'مشاعر التعليم', 'q.football': 'نبض الكرة',
      'q.capital': 'العاصمة الجديدة',
      'stat.1': 'إشارة مصرية يوميًا', 'stat.2': 'محافظة تحت المراقبة',
      'stat.3': 'متوسط رصد الأزمات', 'stat.4': 'دقة تصنيف الإشارات',
      'why.eyebrow': 'لماذا نبض',
      'why.title': 'من السؤال إلى <span class="grad">الرؤية</span>',
      'why.sub': 'جملة واحدة مدخلًا، وموجز يمكنك التصرف بناءً عليه مخرجًا. هذا هو التحوّل خلف كل تحليل من نبض.',
      'why.c1.t': 'السؤال',
      'why.c1.b': 'اسأل بالعربية أو الإنجليزية — كما تسأل زميلًا.',
      'why.c1.s': '1.4M+ إشارة / يوم',
      'why.c2.t': 'البيانات',
      'why.c2.b': 'أخبار وفيسبوك وX وإنستغرام وRSS وGoogle Trends — أكثر من 1.4 مليون إشارة يوميًا.',
      'why.c2.s': '98.7% دقة',
      'why.c3.t': 'التحليل',
      'why.c3.b': 'يُصنَّف ويُدقَّق ويُختَم بالوقت في ثوانٍ.',
      'why.c3.s': '3 دقائق متوسط التنبيه',
      'why.c4.t': 'الأنماط',
      'why.c4.b': 'المواضيع والمشاعر والانتشار الإقليمي ومنحنيات التصعيد.',
      'why.c4.s': '27 محافظة',
      'why.c5.t': 'الرؤية',
      'why.c5.b': 'موجز بلغة واضحة مع إجراءات مقترحة.',
      'why.c5.s': '7 أنواع مصادر',
      'prod.eyebrow': 'مساحة العمل',
      'prod.title': 'التحليل <span class="grad">من أوله إلى آخره</span>',
      'prod.sub': 'شغّل أي سؤال وشاهده يتحول إلى تحليل منظم — مؤشرات وصحة إشارة وتغطية إقليمية وتوزيع مصادر في شاشة واحدة.',
      'prod.lead': 'صُنع لأكثر فرق مصر إلحاحًا.',
      'prod.intro': 'نبض مركز قيادة وليس لوحة معلومات: كل عنصر أدناه يُولَّد مباشرة من نفس تدفق الإشارات — لا شيء مفبرك.',
      'prod.c1.t': 'مراقبة فورية',
      'prod.c1.b': 'أكثر من 1.4 مليون إشارة مصرية يوميًا — مجمّعة ومُدقّقة ومختومة بالوقت في ثوانٍ.',
      'prod.c2.t': 'تحليل بالذكاء الاصطناعي',
      'prod.c2.b': 'يُصنَّف ويُلخَّص ويُشرَح بالعربية أو الإنجليزية.',
      'prod.c3.t': 'رصد الأزمات',
      'prod.c3.b': 'نماذج إنذار مبكر في كل الجمهورية — متوسط وقت التنبيه: 3 دقائق.',
      'prod.c4.t': 'تغطية المحافظات',
      'prod.c4.b': 'دقة إقليمية في 27 محافظة، وليس العاصمة وحدها.',
      'prod.c5.t': 'ذكاء اجتماعي',
      'prod.c5.b': 'فيسبوك وX وإنستغرام وRSS وGoogle Trends في طبقة مشاعر واحدة.',
      'gv.egypt': 'مصر', 'gv.cairo': 'القاهرة', 'gv.alex': 'الإسكندرية',
      'gv.giza': 'الجيزة', 'gv.sharqia': 'الشرقية', 'gv.delta': 'الدلتا',
      'gv.upper': 'الصعيد', 'gv.aswan': 'أسوان',
      'social.eyebrow': 'تحليل اجتماعي خاص',
      'social.title': 'جمهورك، <span class="grad">مفكَّك</span>',
      'social.sub': 'الترندات العامة نصف الحكاية. اربط صفحة فيسبوك الخاصة بك ودَع نبض يحلّل جمهورك.',
      'social.fb.title': 'ربط صفحة فيسبوك',
      'social.fb.desc': 'اربط صفحة فيسبوك الخاصة بك لتحليل ترندات جمهورك — المنشورات والتفاعلات والتعليقات والنمو، بخصوصية تامة.',
      'social.fb.idle.title': 'غير متصل', 'social.fb.idle.sub': 'لم يتم ربط أي حساب فيسبوك بعد',
      'social.fb.connect': 'ربط فيسبوك', 'social.fb.disconnect': 'فصل الحساب',
      'social.fb.connecting.title': 'جارٍ الربط…', 'social.fb.connecting.sub': 'الاتصال بمنصة فيسبوك',
      'social.fb.connected.title': 'متصل', 'social.fb.connected.sub': 'الصفحة: نبض أناليتيكس',
      'social.fb.privacy': 'خاص بالتصميم — بيانات الصفحة لا تُشارك ولا تُباع ولا تُستخدم لتدريب نماذج عامة.',
      'social.open': 'افتح الاتصالات',
      'soc.eyebrow': 'تحليل اجتماعي خاص',
      'soc.tw.d': 'المحادثات الاجتماعية اللحظية',
      'soc.yt.d': 'محتوى فيديو والتفاعل',
      'soc.tt.d': 'اتجاهات الفيديو القصير',
      'soc.li.d': 'إشارات الشبكة المهنية',
      'soc.tg.d': 'نشاط القنوات والمجموعات',
      'app.title.social': 'وسائل التواصل الاجتماعي',
      'app.sub.social': 'اربط حساباتك الاجتماعية لتحليل خاص للجمهور.',
      'app.nav.social': 'التواصل الاجتماعي',
      'uc.eyebrow': 'حالات الاستخدام',
      'uc.title': 'صُنع لمن يحتاج <span class="grad">أن يعرف أولًا</span>',
      'uc.sub': 'منصة واحدة، مهام كثيرة.',
      'uc.c1.t': 'الحكومة', 'uc.c1.b': 'الرأي العام واستقرار الأقاليم ورصد المعلومات المضللة للوزارات وصنّاع القرار.',
      'uc.c2.t': 'الصحفيون', 'uc.c2.b': 'رصد الأحداث العاجلة واكتشاف المصادر وتطور الترندات لغرف الأخبار المصرية.',
      'uc.c3.t': 'الباحثون', 'uc.c3.b': 'تدفقات أحداث بجودة قواعد البيانات وبراهين قابلة للتصدير وخطوط زمنية قابلة لإعادة الإنتاج.',
      'uc.c4.t': 'المنظمات غير الحكومية', 'uc.c4.b': 'إنذارات مبكرة للقضايا الإنسانية وردود الفعل المجتمعية.',
      'uc.c5.t': 'الشركات', 'uc.c5.b': 'تحولات السوق وأحاديث المنافسين وإشارات الطلب في القطاعات المصرية.',
      'uc.c6.t': 'فرق الأمن', 'uc.c6.b': 'إشارات الأزمات والمخاطر الجيوسياسية وكشف الأنشطة المنسقة.',
      'uc.c7.t': 'التسويق', 'uc.c7.b': 'أحاديث ناشئة ومشاعر الجمهور وتوقيت ثقافي للحملات.',
      'uc.c8.t': 'العلاقات العامة', 'uc.c8.b': 'تتبّع ردود الفعل وانجراف السرد وإنذارات مبكرة لمخاطر السمعة.',
      'brand': 'نبض',
      'cta.eyebrow': 'ابدأ الآن',
      'cta.title': 'ابدأ <span class="grad">بسؤال</span>.',
      'cta.sub': 'اسأل نبض عن مصر بلغة طبيعية. يفتح التحليل في مساحة عملك — سجّل الدخول عند الوصول.',
      'cta.btn1': 'ابدأ الآن', 'cta.btn2': 'افتح مساحة العمل',
      'cta.note': 'تجربة مجانية 14 يومًا · بدون بطاقة ائتمان · الإعداد في 5 دقائق',
      'footer.tagline': 'ذكاء الترندات لبلد لا يتوقف عن الحركة.',
      'footer.c1': 'المنتج', 'footer.l11': 'تحليل مباشر', 'footer.l12': 'الميزات',
      'footer.l13': 'الأسعار', 'footer.l14': 'لوحة التحليل المباشر',
      'footer.c2': 'الشركة', 'footer.l21': 'من نحن', 'footer.l22': 'حالات الاستخدام',
      'footer.l23': 'تواصل',
      'footer.c3': 'الموارد', 'footer.l31': 'التوثيق', 'footer.l32': 'مرجع API',
      'footer.l33': 'الحالة',
      'footer.c4': 'القانونية', 'footer.l41': 'الخصوصية', 'footer.l42': 'الشروط',
      'footer.l43': 'الأمان', 'footer.l44': 'اتفاقية حماية البيانات',
      'footer.copyright': 'نبض لأنظمة الاستخبارات', 'footer.status': 'جميع الأنظمة تعمل',
      'nav.legal.eyebrow': 'نبض · قانوني',
      'nav.legal.privacy': 'سياسة الخصوصية', 'nav.legal.terms': 'شروط الخدمة',
      'nav.legal.effective': 'تاريخ السريان:',

      /* workspace */
      'ws.back': 'الرئيسية', 'ws.new': 'تحليل جديد', 'ws.querylabel': 'المتابعة', 'ws.private.badge': 'تحليل خاص',
      'ws.brief': 'موجز الذكاء الاصطناعي',
      'ws.brief.findings': 'النتائج الرئيسية', 'ws.brief.dev': 'التطورات الرئيسية', 'ws.brief.why': 'لماذا يهم',
      'ws.meta1': '14 مصدرًا', 'ws.meta2': 'حُدّث قبل دقيقتين', 'ws.meta3': 'ثقة 94%',
      'ws.brieftitle': 'مصر — تقرير حي',
      'ws.topics.t': 'ترندات رائجة',
      'ws.timeline.t': 'قوة الترند التاريخي', 'ws.timeline.s': 'مؤشر الترند الأسبوعي · حجم الإشارة',
      'ws.tab.day': '24 س', 'ws.tab.week': '7 أيام', 'ws.tab.month': '30 يومًا',
      'ws.donut.t': 'توزيع المشاعر',
      'ws.donut.pos': 'إيجابي', 'ws.donut.neu': 'محايد', 'ws.donut.neg': 'سلبي',
      'ws.pie.c': 'الحجم',
      'ws.nodata': 'لا توجد بيانات',
      'ws.sent.na': 'بيانات المشاعر غير متاحة',
      'ws.sent.sparse': 'استنادًا إلى {n} إشارة — حجم منخفض، يُفسَّر بحذر.',
      'ws.timeline.na': 'لا توجد بيانات إشارة زمنية متاحة لهذا التحليل.',
      'ws.timeline.tip': 'مؤشر',
      'ws.brief.datapoints': 'بيانات منظمة مُستخلصة: {d}.',
      'ws.brief.dp': '{name} بسعر {value} {currency} لكل {unit}',
      'ws.brief.dp.plain': '{name} = {value} {currency}',
      'ws.brief.baseline': 'تصاعد {v} مقارنة بالأساس: {t}.',
      'ws.brief.bl.higher': 'أعلى', 'ws.brief.bl.elevated': 'مرتفع', 'ws.brief.bl.lower': 'أقل', 'ws.brief.bl.moderate': 'متوسط',
      'ws.loc.na': 'لا توجد بيانات جغرافية على مستوى المدن لهذا الاستعلام',
      'ws.national.t': 'تغطية وطنية',
      'ws.national.s': 'إشارة على مستوى مصر',
      'ws.hl.na': 'لم تُنشأ ملخصات ذكاء اصطناعي لهذا الاستعلام.',
      'ws.src.na': 'لا تتوفر توزيعة مصادر لهذا الاستعلام.',
      'ws.feed.na': 'لم تُرجع الإشارات الحية نتائج لهذا الاستعلام.',
      'ws.sum.na': 'لم يُرجع الموجز ملخصًا ذكيًا لهذا الاستعلام — الإشارات معروضة أدناه.',
      'ws.src.count': 'مصدر',      'ws.updated': 'آخر تحديث',
      'ws.conf': 'ثقة',
      'ws.brief.total': 'إجمالي الإشارات: {n} ذكرًا عبر {s} مصادر.',
      'ws.brief.mentions': 'إجمالي الإشارات: {n} ذكرًا.',
      'ws.brief.topics': 'المواضيع الرائجة: {t}.',
      'ws.brief.sentiment': 'النبرة العامة {l}.',
      'ws.brief.tone.pos': 'إيجابية', 'ws.brief.tone.neg': 'سلبية', 'ws.brief.tone.neu': 'محايدة',
      'ws.brief.crises': 'إشارات الأزمات النشطة: {n}.',
      'ws.brief.locations': 'التركيز الجغرافي: {l}.',
      'ws.brief.sources': 'أبرز المصادر: {l}.',
      'ws.brief.highlights': 'تم رصد {n} إشارات ملحوظة.',
      'ws.feed.t': 'التغذية الحية',
      'ws.hl.t': 'ملخصات الذكاء الاصطناعي', 'ws.hl.s': 'صُنعت في هذه الدورة',
      'ws.hl.t1': 'حدث عاجل', 'ws.hl.t2': 'نمط ناشئ', 'ws.hl.t3': 'خطر تضليل',
      'ws.hl.t4': 'فرصة', 'ws.hl.t5': 'تفاعل جماهيري',
      'ws.inf.t': 'المؤثرون', 'ws.inf.s': 'أبرز الأصوات هذه الساعة',
      'ws.src.t': 'المصادر',
      'ws.kw.t': 'الكلمات المفتاحية', 'ws.kw.s': 'حتمية · محسوبة من التجميع',
      'ws.ph.t': 'أبرز العبارات', 'ws.ph.s': 'عبارات ناشئة من 2–3 كلمات',
      'ws.ht.t': 'الوسوم', 'ws.ht.s': 'مستخرجة من الإشارات',
      'ws.health.t': 'صحة الإشارة', 'ws.health.s': 'الزخم · القوة · التنوع · الحداثة · الصلة · التغطية',
      'ws.foot': 'ذكاء نبض · تحليل لحظي',
      'ws.src.s2': 'الناشرون من هذا التحليل',
      'ws.toast.new': 'تحليل جديد جاهز — أُعيد تحديث مساحة العمل',
      'ws.toast.query': 'تم تحديث المتابعة إلى: <b>{q}</b>',

      /* data-driven dashboard (real n8n contract) */
      'ws.rel.s': '{n}ث', 'ws.rel.m': '{n}د', 'ws.rel.h': '{n}س', 'ws.rel.d': '{n}ي', 'ws.rel.w': '{n}أ',
      'ws.brief.active': 'المواضيع النشطة: {n}.',
      'ws.brief.sparse': 'مجموعة البيانات محدودة — تعامل مع هذه الإشارات بحذر.',
      'ws.brief.influencers': 'أبرز الأصوات: {n} من المؤثرين.',
      'ws.regional.t': 'الذكاء الإقليمي',
      'ws.regional.s': 'المواقع المكتشفة من هذا التحليل',
      'ws.gov.detected': 'إشارات مكتشفة',
      'ws.priv.note': 'تحليل خاص — بناءً على حسابك المرتبط على Meta',
      'ws.pub.note': 'تحليل عام — إشارات الويب المفتوحة',
      'ws.meta.generated': 'أنشئ {t}',
      'ws.meta.posts': '{n} مصدر',
      'ws.meta.scope': 'النطاق: {s}',
      'ws.kpi.posts': 'الموارد المحللة',
      'ws.kpi.active': 'المواضيع النشطة',
      'ws.kpi.sentiment': 'المشاعر العامة',
      'ws.kpi.emergency': 'تنبيهات الطوارئ',
      'ws.sent.sub': '{q} · {s}',
      'ws.topics.s2': 'مرتبة حسب الشدة',
      'ws.src.count2': '{n} عنصر',
      'ws.src.author': 'بواسطة {a}',
      'ws.src.eng': '{n} تفاعل',
      'ws.feed.s2': 'مصادر حقيقية · انقر للفتح',
      'ws.influencers.na': 'لم يتم تحديد شخصيات مؤثرة في هذا التحليل.',
      'ws.loc.egypt': 'مصر',
      'ws.preview.t': 'ابدأ تحليلاً جديداً',
      'ws.preview.s': 'جرّب أحد هذه الاستعلامات، أو اسأل عن أي شيء عن مصر.',
      'ws.preview.go': 'تحليل',
      'ws.scope.public': 'عام', 'ws.scope.private': 'خاص',
      'db.meta.connected': 'تم الاتصال بفيسبوك',
      'db.meta.error': 'فشل الاتصال بـ Meta — حاول مرة أخرى.',
      'db.meta.notconfigured': 'لم يتم إعداد OAuth لـ Meta على الخادم بعد (META_APP_ID / META_APP_SECRET / META_REDIRECT_URI).',
      'db.meta.startfail': 'تعذر بدء تفويض Meta.',
      'db.meta.popup': 'تم حظر نافذة تفويض Meta — اسمح بالنوافذ المنبثقة وحاول مرة أخرى.',
      'db.meta.select.title': 'اختر الصفحة لتحليلها',
      'db.meta.select.sub': 'ستُستخدم هذه الصفحة في التحليل الخاص.',
      'db.meta.select.connect': 'اتصال بهذه الصفحة',
      'db.meta.select.cancel': 'إلغاء',

      /* filters */
      'filters.label': 'تصفية', 'filters.all': 'الكل', 'filters.news': 'أخبار',
      'filters.social': 'اجتماعي', 'filters.gov': 'حكومي', 'filters.sport': 'رياضة',
      'filters.business': 'أعمال',

      /* auth */
      'auth.signin.title': 'مرحبًا بعودتك',
      'auth.signin.sub': 'سجّل الدخول إلى مساحة نبض.',
      'auth.signup.title': 'أنشئ حسابك',
      'auth.signup.sub': 'ابدأ بمتابعة نبض مصر خلال دقائق.',
      'auth.email': 'البريد الإلكتروني', 'auth.pass': 'كلمة المرور', 'auth.confirm': 'تأكيد كلمة المرور',
      'auth.phone': 'رقم الهاتف',
      'auth.first': 'الاسم الأول', 'auth.last': 'الاسم الأخير', 'auth.org': 'المؤسسة',
      'auth.remember': 'تذكرني', 'auth.forgot': 'نسيت كلمة المرور؟',
      'auth.submit': 'تسجيل الدخول', 'auth.signup.submit': 'إنشاء الحساب',
      'auth.alt': 'أو المتابعة عبر', 'auth.google': 'جوجل', 'auth.facebook': 'فيسبوك',
      'auth.soon': 'قريبًا', 'auth.soon.note': 'تسجيل الدخول عبر جوجل وفيسبوك قريبًا — لا يتم إنشاء أي جلسة الآن.',
      'auth.signup.switch': 'ليس لديك حساب؟ <a class="link-soft" href="signup.html" data-page="signup.html">أنشئ حسابًا</a>',
      'auth.signin.switch': 'لديك حساب بالفعل؟ <a class="link-soft" href="signin.html" data-page="signin.html">سجّل الدخول</a>',
      'auth.back': 'العودة للرئيسية',
      'auth.terms': 'أوافق على <a class="link-soft" href="../terms.html" data-page="../terms.html">شروط الخدمة</a> و <a class="link-soft" href="../privacy-policy.html" data-page="../privacy-policy.html">سياسة الخصوصية</a>',
      'auth.legal': 'بالمتابعة فأنت توافق على <a class="link-soft" href="../terms.html" data-page="../terms.html">شروط الخدمة</a> و <a class="link-soft" href="../privacy-policy.html" data-page="../privacy-policy.html">سياسة الخصوصية</a>',
      'auth.art1.t': 'مركز قيادة الذكاء الخاص بك',
      'auth.art1.b': 'الترندات والمشاعر والأزمات والتغذية الحية في كل محافظات مصر — في مساحة عمل واحدة حية.',
      'auth.art2.t': 'مركز قيادة الذكاء الخاص بك',
      'auth.art2.b': 'الترندات والمشاعر والأزمات والتغذية الحية في كل محافظات مصر — في مساحة عمل واحدة حية.',
      'auth.err.email': 'يرجى إدخال بريد إلكتروني صحيح.',
      'auth.err.email.bad': 'البريد المؤقت غير مسموح به.',
      'auth.err.email.notfound': 'هذا البريد الإلكتروني غير موجود.',
      'auth.err.name': 'الاسم مطلوب.',
      'auth.err.name.invalid': 'اسم غير صالح.',
      'auth.err.phone': 'رقم هاتف مصري غير صالح.',
      'auth.err.pass': 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
      'auth.err.pass.required': 'يرجى إدخال كلمة المرور.',
      'auth.err.confirm.req': 'يرجى تأكيد كلمة المرور.',
      'auth.err.req': 'يرجى ملء جميع الحقول المطلوبة.',
      'auth.err.match': 'كلمتا المرور غير متطابقتين.',
      'auth.err.terms': 'يجب الموافقة على الشروط.',
      'auth.verify.title': 'تحقق من بريدك الإلكتروني',
      'auth.verify.sub': 'أدخل رمز التحقق المكوّن من 6 أرقام الذي أرسلناه إلى',
      'auth.verify.label': 'رمز التحقق',
      'auth.verify.btn': 'تحقق',
      'auth.verify.no': 'لم يصلك رمز؟',
      'auth.verify.resend': 'إعادة إرسال الرمز',
      'auth.verify.sent': 'تم إعادة إرسال الرمز — تحقق من بريدك.',
      'auth.verify.err': 'رمز غير صالح أو منتهي الصلاحية. حاول مرة أخرى.',
      'auth.verify.err.digits': 'أدخل الرمز المكوّن من 6 أرقام.',
      'auth.pending': 'يرجى الانتظار…',
      'auth.ok.signin': 'مرحبًا بعودتك — جارٍ تشغيل التطبيق…',
      'auth.ok.signup': 'تم إنشاء الحساب — جارٍ تشغيل مساحة العمل…',
      'auth.social': 'تسجيل الدخول عبر الشبكات الاجتماعية قريبًا — لم يتم إنشاء أي جلسة.',
      'auth.otp.login': 'المتابعة برمز التحقق (OTP)',
      'auth.otp.title': 'المتابعة برمز التحقق',
      'auth.otp.sub': 'أدخل بريدك الإلكتروني وسنرسل رمزًا لمرة واحدة.',
      'auth.otp.send': 'إرسال الرمز',
      'auth.otp.submit': 'تسجيل الدخول بالرمز',
      'auth.otp.hint': '<strong>لا تجد رمز التحقق؟</strong> تحقق من مجلد <strong>البريد غير المرغوب فيه (Spam/Junk)</strong>. حسب مزود البريد، قد يظهر الرمز أيضًا ضمن <strong>العروض الترويجية (Promotions)</strong> أو <strong>أخرى (Other)</strong>.',
      'auth.otp.cooldown': 'تم إرسال رمز مسبقًا. حاول مرة أخرى خلال {s} ثانية.',
      'auth.otp.err.nomatch': 'تعذر إرسال رمز إلى هذا البريد. تأكد من استخدام البريد الذي سجلت به.',
      'auth.otp.err.send': 'تعذر إرسال الرمز الآن. حاول مرة أخرى.',
      'auth.forgot.title': 'إعادة تعيين كلمة المرور',
      'auth.forgot.sub': 'أدخل بريدك الإلكتروني وسنرسل رمز إعادة التعيين.',
      'auth.forgot.send': 'إرسال الرمز',
      'auth.reset.next': 'التحقق من الرمز',
      'auth.reset.submit': 'إعادة تعيين كلمة المرور',
      'auth.reset.pass': 'كلمة المرور الجديدة',
      'auth.reset.confirm': 'تأكيد كلمة المرور الجديدة',
      'auth.reset.ok.t': 'تم تحديث كلمة المرور',
      'auth.reset.ok.s': 'يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة.',
      'auth.back.to.signin': 'العودة إلى تسجيل الدخول',
      'auth.back.to.signup': 'العودة إلى إنشاء الحساب',
      'auth.back.to.request': 'تغيير البريد الإلكتروني',
      'auth.go.to.signin': 'الانتقال إلى تسجيل الدخول',
      'auth.verify.err.sent': 'تعذر إرسال البريد. تحقق من بريدك أو حاول مجددًا.',
      'auth.verify.err.dev': 'SMTP غير مُعد — تم طباعة الرمز في سجل الخادم.',
      'auth.pwd.hint': '8 أحرف على الأقل — أضف أرقامًا ورموزًا لكلمة مرور أقوى.',
      'auth.pwd.weak': 'ضعيفة', 'auth.pwd.fair': 'متوسطة', 'auth.pwd.strong': 'قوية',
      'auth.pwd.good': 'جيدة', 'auth.pwd.len': '8+ أحرف', 'auth.pwd.upper': 'حرف كبير', 'auth.pwd.lower': 'حرف صغير', 'auth.pwd.num': 'رقم', 'auth.pwd.spec': 'رمز خاص',
      'c.eg': 'مصر', 'c.sa': 'السعودية', 'c.ae': 'الإمارات',
      'c.us': 'الولايات المتحدة', 'c.gb': 'المملكة المتحدة', 'c.de': 'ألمانيا',
      'c.fr': 'فرنسا', 'c.qa': 'قطر',
      'lng.en': 'English', 'lng.ar': 'العربية',

      /* app shell */
      'app.nav.dashboard': 'لوحة التحكم', 'app.nav.analysis': 'التحليل',
      'app.nav.history': 'السجل', 'app.nav.reports': 'التقارير',
      'app.nav.private': 'تحليل خاص', 'app.nav.connections': 'الاتصالات',
      'app.nav.favorites': 'المفضلة', 'app.nav.notifications': 'الإشعارات',
      'app.nav.settings': 'الإعدادات', 'app.nav.profile': 'الملف الشخصي',
      'app.sep1': 'التحليل', 'app.sep2': 'الحساب',
      'app.status': 'جميع الأنظمة تعمل',
      'app.menu.profile': 'الملف الشخصي', 'app.menu.workspace': 'مساحة العمل',
      'app.menu.history': 'السجل', 'app.menu.settings': 'الإعدادات',
      'app.menu.theme': 'المظهر', 'app.menu.lang': 'اللغة', 'app.menu.signout': 'تسجيل الخروج',
      'app.theme.dark': 'داكن', 'app.theme.light': 'فاتح',
      'app.title.dashboard': 'لوحة التحكم', 'app.title.history': 'سجل التحليلات',
      'app.title.reports': 'مركز التقارير', 'app.title.profile': 'الملف الشخصي',
      'app.title.settings': 'الإعدادات', 'app.title.connections': 'الاتصالات',
      'app.title.api': 'واجهة المطورين', 'app.title.notifications': 'الإشعارات',
      'app.title.favorites': 'المفضلة', 'app.title.searches': 'البحوث المحفوظة',
      'app.sub.dashboard': 'مركز استخباراتك — الموجز والاتجاهات وكل ما ثبتّه في مكان واحد.',
      'app.sub.history': 'كل تحليل شغّلته، قابل للبحث والفرز.',
      'app.sub.reports': 'منشأة وجدولة ومصدّرة — كل مستندات استخباراتك.',
      'app.sub.profile': 'هويتك واشتراكك واستخدامك بنظرة واحدة.',
      'app.sub.settings': 'الحساب والمظهر والأمان وكل ما بينهما.',
      'app.sub.connections': 'ادمج مصادرك في طبقة استخبارات واحدة.',
      'app.sub.api': 'وصول برمجي للفرق المتقدمة.',
      'app.sub.notifications': 'تنبيهات وتحديثات عبر المنصة.',
      'app.sub.favorites': 'كل ما علّمت عليه في مكان واحد.',
      'app.sub.searches': 'استعلاماتك المحفوظة، منظمة في مجلدات.',
      'app.crumb.app': 'التطبيق',
      'app.theme.light': 'التبديل إلى الوضع الفاتح', 'app.theme.dark': 'التبديل إلى الوضع الداكن',
      'app.st.done': 'مكتمل', 'app.st.running': 'قيد التشغيل', 'app.st.failed': 'فشل',
      'app.st.remove': 'إزالة',
      'app.cat.news': 'أخبار', 'app.cat.social': 'تواصل اجتماعي', 'app.cat.gov': 'حكومة',
      'app.cat.sport': 'رياضة', 'app.cat.business': 'أعمال',
      'app.soon': 'قريباً',
      'app.toast.saved': 'تم حفظ الإعدادات.', 'app.toast.del': 'تم الحذف.',
      'app.toast.dup': 'تم التكرار.', 'app.toast.shared': 'تم نسخ رابط المشاركة.',
      'app.toast.exported': 'بدأ التصدير.', 'app.toast.revoked': 'تم إلغاء المفتاح.',
      'app.toast.empty': 'اكتب سؤالًا لنبض أولًا.',
      'app.toast.alert': 'تم إنشاء التنبيه — سنخطرك عند تفعّل.',
      'db.fb.on': 'فيسبوك متصل', 'db.fb.off': 'ربط فيسبوك',
      'db.fb.disconnect': 'إلغاء الاتصال', 'db.fb.acct': 'إشارات اجتماعية خاصة نشطة',
      'db.fb.conf.t': 'إلغاء اتصال فيسبوك؟',
      'db.fb.conf.s': 'لن يتوفر تحليل الاتجاهات الاجتماعية الخاص حتى تعيد الربط.',
      'db.fb.conf.cancel': 'إلغاء', 'db.fb.conf.ok': 'إلغاء الاتصال',
      'db.fb.need': 'اربط فيسبوك أولًا — التحليل الخاص يتطلب حسابًا متصلًا.',
      'db.priv.pub': 'عام', 'db.priv.priv': 'خاص',
      'db.preview.t': 'إشارات حية — ما ترصده نبض الآن',
      'db.loading.1': 'جارٍ مسح المصادر الإخبارية…',
      'db.loading.2': 'مقارنة الإشارات الاجتماعية…',
      'db.loading.3': 'رصد الموضوعات الناشئة…',
      'db.loading.4': 'قياس المشاعر…',
      'db.loading.5': 'رسم الإشارات الجغرافية…',
      'db.loading.6': 'إعداد موجز الاستخبارات…',
      'db.analyzing': 'جارٍ التحليل…', 'db.ready': 'الذكاء جاهز',
      'db.error.t': 'هناك ما قطع التحليل.',
      'db.error.s': 'إشاراتك لا تزال آمنة — حاول تشغيل التحليل مرة أخرى.',
      'db.error.retry': 'حاول مجددًا',
      'app.toast.created': 'تم الإنشاء.', 'app.toast.renamed': 'تمت إعادة التسمية.',
      'app.toast.conn': 'وضع تجريبي — الاتصال محاكى.',
      'app.toast.signedout': 'تم تسجيل الخروج.', 'app.toast.copied': 'تم النسخ إلى الحافظة.',
      'app.toast.moved': 'تم النقل إلى المجلد.', 'app.toast.folder': 'تم إنشاء المجلد.',
      'app.toast.noexport': 'شغّل تحليلًا أولًا ثم صدّر تقريره.',
      'app.toast.facility': 'تم إرسال التقرير إلى المنشأة المسؤولة.',
      'app.toast.savedReport': 'تم حفظ التقرير لاحقًا.',
      'app.toast.fav': 'أُضيف إلى المفضلة.',
      'app.toast.favOff': 'أُزيل من المفضلة.',
      'app.toast.email': 'جارٍ تجهيز بريدك…',
      'app.toast.avatar': 'تم تحديث الصورة الشخصية.',
      'app.toast.savedNotif': 'تقرير محفوظ — أعد تشغيله من لوحة التحكم لعرضه.',
      'app.toast.savedFail': 'تعذر حفظ التقرير — ربما يكون حجمه كبيرًا جدًا.',

      /* report export */
      'export.back': 'العودة إلى لوحة التحكم', 'export.title': 'تقرير التحليل',
      'export.sub': 'ذكاء نبض · تصدير PDF',
      'export.print': 'تنزيل PDF', 'export.generated': 'أُنشئ في',
      'export.lang': 'لغة التقرير', 'export.noData.t': 'لا يوجد تقرير للتصدير',
      'export.noData.s': 'شغّل تحليلًا من لوحة التحكم أولًا — ستظهر أحدث نتائجك هنا.',
      'export.goDashboard': 'الانتقال إلى لوحة التحكم', 'export.printHint': 'اختر “حفظ كملف PDF” في نافذة الطباعة.',
      'export.h.momentum': 'الزخم', 'export.h.signal': 'قوة الإشارة',
      'export.h.diversity': 'تنوع المصادر', 'export.h.freshness': 'حداثة المعلومات',
      'export.h.relevance': 'الملاءمة', 'export.h.coverage': 'التغطية',
      'export.score': 'الدرجة', 'export.top': 'الأعلى', 'export.recent': 'حديث', 'export.articles': 'مقال',
      'ws.gen.note': 'أُنشئ منذ {t} · {n} مصدرًا',
      'ws.actions.t': 'إجراءات مقترحة',
      'ws.actions.s': 'إجراءات سريعة لهذا التحليل',
      'ws.actions.send': 'إرسال التقرير إلى المنشأة',
      'ws.actions.save': 'حفظ التقرير لاحقًا',
      'ws.actions.share': 'تصدير ومشاركة التقرير',
      'ws.actions.pick': 'أرسل التقرير إلى منشأة',
      'ws.actions.pick.s': 'اختر الوجهة — سيُجهّز التقرير ببيانات تواصلها.',
      'ws.actions.pick.to': 'البريد الإلكتروني للمستلم',
      'ws.actions.pick.to.ph': 'facility@example.com',
      'ws.actions.pick.body': 'مسودة البلاغ الجاهزة',
      'ws.actions.pick.send': 'إرسال التقرير',
      'ws.actions.pick.err': 'أدخل بريد المستلم أولًا.',
      'ws.actions.fav': 'أضف إلى المفضلة',
      'ws.actions.fav.on': 'أُضيف إلى المفضلة',
      'ws.actions.fav.off': 'أُزيل من المفضلة',
      'ws.fac.email.line1': 'تقرير NABD عن الاستعلام "{q}"',
      'ws.fac.email.line2': 'أُنشئ {t}',
      'ws.fac.email.line3': 'الملخص: {b}',
      'ws.fac.email.line4': 'التقرير الكامل: {u}',
      'ws.fac.email.line5': 'فريقنا العزيز، نرفع إليكم الإشارات التي رصدها تحليل NABD للاستعلام "{q}". يرجى المراجعة واتخاذ الإجراء اللازم.',
      'ws.fac.email.sign': '— NABD (نبض)',
      'ws.actions.close': 'إغلاق',
      'ws.src.more': 'عرض الكل ({n})',
      'ws.src.fewer': 'عرض أقل',

      /* ملخص التحليل الإجمالي */
      'ws.hl.total': 'ملخص التحليل الإجمالي',
      'ws.total.momentum': 'الزخم {dir} بدرجة قوة {score}.',
      'ws.total.sentiment': 'الاتجاه العام {label} — {pos}% إيجابي، {neu}% محايد، {neg}% سلبي.',
      'ws.total.kw': 'أبرز كلمة مفتاحية: {kw}.',
      'ws.total.coverage': 'تم تحليل {art} مصدرًا من {src} جهة إعلامية.',
      'ws.total.crisis': 'تنبيه: تم رصد {e} إشارة طارئة.',

      /* التذكير (إنشاء تنبيه) */
      'ws.reminder.t': 'تعيين تذكير',
      'ws.reminder.s': 'بناءً على هذا التحليل، ننصح بالعودة للفحص مجددًا لاحقًا.',
      'ws.reminder.email': 'بريد التذكير',
      'ws.reminder.12h': 'الفحص مجددًا خلال 12 ساعة',
      'ws.reminder.24h': 'الفحص مجددًا خلال 24 ساعة',
      'ws.reminder.2d': 'الفحص مجددًا بعد يومين',
      'ws.reminder.3d': 'الفحص مجددًا بعد 3 أيام',
      'ws.reminder.1w': 'الفحص مجددًا بعد أسبوع',
      'ws.reminder.2w': 'الفحص مجددًا بعد أسبوعين',
      'ws.reminder.1mo': 'الفحص مجددًا بعد شهر',
      'ws.reminder.alert.t': 'إنشاء تنبيه',
      'ws.reminder.alert.s': 'يحفظ NABD هذا التقرير ويرسل إليك بريدًا عند موعد الفحص.',
      'ws.reminder.reco': 'موصى به',
      'ws.reminder.set': 'تعيين التذكير',
      'ws.reminder.will': 'سيرسل إليك تذكيرًا على البريد عند الاستحقاق.',
      'app.toast.reminder': 'تم تعيين التذكير — سنرسل إليك بريدًا عند الاستحقاق.',
      'app.toast.reminderErr': 'تعذر تعيين التذكير. حاول مجددًا.',

      /* جهات إرسال التقرير */
      'ws.facility.elec': 'شركات الكهرباء',
      'ws.facility.water': 'شركات المياه',
      'ws.facility.gas': 'شركات الغاز',
      'ws.facility.complaints': 'الشكاوى العامة',
      'ws.facility.hospitals': 'المستشفيات',
      'ws.facility.emergencies': 'الطوارئ',
      'ws.facility.police': 'أقسام الشرطة',
      'ws.facility.emergencynumbers': 'أرقام الطوارئ',

      /* dashboard */
      'dash.qa': 'إجراءات سريعة',
      'dash.qa.new': 'تحليل جديد', 'dash.qa.saved': 'تحليل خاص',
      'dash.qa.export': 'تصدير تقرير', 'dash.qa.alert': 'إنشاء تنبيه',
      'dash.qa.nav': 'تابع من حيث توقفت',
      'dash.qa.nav.connections': 'اربط مصدرًا',
      'dash.qa.nav.connections.d': 'أضف فيسبوك أو واجهة n8n',
      'dash.qa.nav.settings': 'فتح الإعدادات',
      'dash.qa.nav.settings.d': 'المظهر واللغة والمزيد',
      'dash.qa.nav.profile': 'عرض الملف الشخصي',
      'dash.qa.nav.profile.d': 'بياناتك ونشاطك',
      'dash.qa.nav.history': 'تصفح السجل',
      'dash.qa.nav.history.d': 'أعد تشغيل التحليلات السابقة',
      'dash.suggest.t': 'مقترح لك',
      'dash.brief': 'الموجز اليومي بالذكاء الاصطناعي', 'dash.brief.sub': 'مصر · أُعدّ خصيصاً لك',
      'dash.brief.b1': 'صباح الخير. <strong>الاقتصاد</strong> يتصدر اليوم: قوة الجنيه تجذب التدفقات، وتوقعات التضخم تتراجع في القاهرة، وأرقام قناة السويس عند مستويات قياسية.',
      'dash.brief.b2': 'في <strong>المجتمع</strong>، افتتاحيات العاصمة الجديدة تسيطر على الحديث الإيجابي، بينما تحتاج مناقشات أسعار السلع في الدلتا للمراقبة. تم تحديد مجموعتي شائعات عن العملة.',
      'dash.brief.b3': '<strong>قائمة المتابعة:</strong> بيانات التضخم، إعلانات السويس، أجواء الكلاسيكو.',
      'dash.brief.tag1': 'اقتصاد', 'dash.brief.tag2': 'قناة السويس', 'dash.brief.tag3': 'متابعة',
      'dash.trend': 'ملخص الاتجاهات', 'dash.trend.sub': 'مصر · 7 أيام',
      'dash.trend.up': 'مقارنة بالأسبوع الماضي',
      'dash.rec': 'آخر التحليلات', 'dash.rec.all': 'عرض الكل',
      'dash.rec.q1': 'أسعار الغذاء في القاهرة', 'dash.rec.q2': 'حركة قناة السويس',
      'dash.rec.q3': 'توقعات الجنيه المصري', 'dash.rec.q4': 'مشاعر التعليم',
      'dash.rec.q5': 'أجواء الكلاسيكو',
      'dash.pinned': 'تقارير مثبتة', 'dash.pinned.all': 'عرض الكل',
      'dash.pinned.r1': 'موجز مصر الأسبوعي', 'dash.pinned.r2': 'رصد مخاطر التضخم',
      'dash.pinned.r3': 'تقرير نبض التواصل الاجتماعي',
      'dash.sugg': 'تحليلات مقترحة',
      'dash.sugg.q1': 'أخبار بناء العاصمة الجديدة', 'dash.sugg.q2': 'مؤشرات تعافي السياحة',
      'dash.sugg.q3': 'نقاش قانون الانتخابات', 'dash.sugg.q4': 'أسواق حبوب الدلتا',
      'dash.fav': 'البحوث المفضلة',
      'dash.fav.q1': 'الجنيه المصري', 'dash.fav.q2': 'قناة السويس', 'dash.fav.q3': 'التضخم',
      'dash.alerts': 'أحدث التنبيهات',
      'dash.alerts.t1': 'عنقود شائعات عملة في مجموعات الدلتا', 'dash.alerts.t2': 'رقم قياسي لحركة السويس',
      'dash.alerts.t3': 'ارتفاع إيجابي حول افتتاحيات العاصمة الجديدة',
      'dash.act': 'النشاط الأخير',
      'dash.act.t1': 'اكتمل التحليل — أسعار الغذاء في القاهرة', 'dash.act.t2': 'تم تصدير التقرير — موجز مصر الأسبوعي',
      'dash.act.t3': 'تم ربط صفحة فيسبوك', 'dash.act.t4': 'تم إنشاء تنبيه — بيانات التضخم',
      'dash.accounts': 'الحسابات المتصلة',
      'dash.exports': 'أحدث الصادرات',
      'dash.exports.t1': 'موجز مصر الأسبوعي', 'dash.exports.t2': 'مجموعة بيانات السويس',
      'dash.exports.t3': 'تصدير المشاعر — القاهرة',

      /* history */
      'hist.search.ph': 'ابحث في التحليلات…',
      'hist.filter.all': 'الكل', 'hist.filter.public': 'عام', 'hist.filter.private': 'خاص',
      'hist.filter.exported': 'مصدّر', 'hist.filter.fav': 'مفضل',
      'hist.sort.recent': 'الأحدث', 'hist.sort.popular': 'الأكثر شعبية',
      'hist.view.grid': 'شبكة', 'hist.view.list': 'قائمة', 'hist.view.timeline': 'خط زمني',
      'hist.q1': 'أسعار الغذاء في القاهرة', 'hist.q2': 'حركة قناة السويس', 'hist.q3': 'توقعات الجنيه المصري',
      'hist.q4': 'توقعات التضخم', 'hist.q5': 'مشاعر التعليم', 'hist.q6': 'أجواء الكلاسيكو',
      'hist.q7': 'افتتاحيات العاصمة الجديدة', 'hist.q8': 'تعافي السياحة',
      'hist.rerun': 'إعادة تشغيل', 'hist.pin': 'تثبيت', 'hist.unpin': 'إلغاء التثبيت', 'hist.delete': 'حذف',
      'hist.count': 'تحليلات',
      'hist.empty': 'لا توجد تحليلات بعد — شغّل تحليلًا من لوحة التحكم وسيظهر هنا.',

      /* reports */
      'rep.generated': 'التقارير المنشأة',
      'rep.scheduled': 'التقارير المجدولة',
      'rep.exports': 'الصادرات',
      'rep.empty': 'لا توجد تقارير بعد — أجرِ تحليلًا وصدّر تقريرًا ليظهر هنا.',
      'rep.type.pdf': 'PDF', 'rep.type.csv': 'CSV', 'rep.type.weekly': 'أسبوعي',
      'rep.type.monthly': 'شهري', 'rep.type.risk': 'مخاطر', 'rep.type.trend': 'اتجاهات',
      'rep.r1': 'موجز مصر الأسبوعي', 'rep.r2': 'رصد مخاطر التضخم', 'rep.r3': 'تقرير نبض التواصل الاجتماعي',
      'rep.r4': 'الملخص الاستخباراتي الشهري', 'rep.r5': 'تقرير اتجاهات قناة السويس',
      'rep.r6': 'مراجعة مخاطر السوق المصري',
      'rep.s1': 'الموجز الصباحي اليومي', 'rep.s2': 'موجز المحافظات الأسبوعي', 'rep.s3': 'حزمة التصدير الشهرية',
      'rep.e1': 'مجموعة بيانات السويس', 'rep.e2': 'تصدير المشاعر — القاهرة', 'rep.e3': 'سجل أحداث الأزمات',
      'rep.preview': 'معاينة', 'rep.download': 'تنزيل', 'rep.duplicate': 'تكرار',
      'rep.share': 'مشاركة', 'rep.delete': 'حذف',
      'rep.saved.empty': 'لا توجد تقارير محفوظة بعد — احفظ تقريرًا من لوحة التحكم.',
      'rep.open': 'فتح',
      'rep.downloaded': 'تم تسجيل التنزيل.',

      /* profile */
      'prof.about': 'نبذة',
      'prof.name': 'الاسم', 'prof.role': 'الدور', 'prof.org': 'المؤسسة',
      'prof.city': 'المدينة', 'prof.lang': 'اللغة', 'prof.email': 'البريد الإلكتروني',
      'prof.joined': 'تاريخ الانضمام',
      'prof.usage': 'الاستخدام',
      'prof.phone': 'الهاتف',
      'prof.verified': 'موثّق', 'prof.unverified': 'غير موثّق',
      'prof.save': 'حفظ التغييرات', 'prof.cancel': 'إلغاء',
      'prof.edit.err': 'تعذر تحديث ملفك الشخصي. حاول مجددًا.',
      'prof.favorites.empty': 'لا توجد فئات مفضلة بعد.',
      'prof.activity.empty': 'لا يوجد نشاط حديث بعد.',
      'prof.u3': 'صادرات', 'prof.u4': 'بحوث',
      'prof.photo': 'الصورة الشخصية',
      'prof.photo.add': 'إضافة صورة',
      'prof.photo.remove': 'إزالة الصورة',
      'prof.crop.t': 'قص الصورة',
      'prof.crop.s': 'اسحب لتغيير الموضع. استخدم مقبض الزاوية لتغيير حجم المربع.',
      'prof.crop.save': 'قص وحفظ',
      'act.analysis': 'اكتمل التحليل — {q}',
      'act.export': 'تم تصدير التقرير — {q}',
      'act.save': 'تم حفظ التقرير — {q}',
      'act.fav': 'أُضيف التقرير إلى المفضلة — {q}',
      'act.alert': 'تم إنشاء تنبيه — {q}',
      'act.reminder': 'تم تعيين تذكير — {q}',
      'act.profile': 'تم تحديث الملف الشخصي',
      'act.avatar': 'تم تحديث الصورة الشخصية',
      'act.conn': 'تم ربط {n}',
      'prof.cats': 'الفئات المفضلة',
      'prof.activity': 'النشاط الأخير',
      'prof.edit': 'تعديل الملف',
      'prof.nav.title': 'تبحث عن شيء؟',
      'prof.nav.connections': 'ربط الحسابات', 'prof.nav.connections.d': 'تحقق من ربط حسابك.',
      'prof.nav.history': 'سجلّك', 'prof.nav.history.d': 'تحقق من سجل أبحاثك.',
      'prof.nav.settings': 'إعدادات نبض', 'prof.nav.settings.d': 'الوصول إلى إعدادات نبض.',

      /* settings */
      'set.appearance': 'المظهر', 'set.lang': 'اللغة',
      'set.notif': 'الإشعارات', 'set.privacy': 'الخصوصية', 'set.security': 'الأمان',
      'set.privacy.doc': 'اقرأ السياسة كاملة', 'set.privacy.doc.s': 'اطّلع على كيفية تعامل نبض مع معلوماتك.', 'set.privacy.doc.b': 'سياسة الخصوصية',
      'set.shortcuts': 'الاختصارات', 'set.experimental': 'الميزات التجريبية',
      'set.danger': 'منطقة الخطر',
      'set.app.theme': 'المظهر', 'set.app.dark': 'داكن', 'set.app.light': 'فاتح', 'set.app.system': 'النظام',
      'set.app.accent': 'اللون المميز', 'set.app.sub': 'يُطبَّق فوراً ويُحفظ على هذا الجهاز.',
      'set.an.title': 'تفضيلات التحليل', 'set.an.sub': 'تُطبَّق الإعدادات الافتراضية على كل تحليل جديد.',
      'set.an.scope': 'نطاق التحليل الافتراضي', 'set.an.src': 'المصادر الافتراضية',
      'set.an.s1': 'كل الموضوعات', 'set.an.s2': 'الأخبار', 'set.an.s3': 'الأعمال', 'set.an.s4': 'الاجتماعي', 'set.an.s5': 'الرياضة', 'set.an.s6': 'الحكومة',
      'set.an.src1': 'الأخبار', 'set.an.src2': 'وسائل التواصل', 'set.an.src3': 'خلاصات RSS', 'set.an.src4': 'البحث عبر الويب',
      'set.lang.sub': 'لغة الواجهة — تُطبق الترجمة فوراً.',
      'set.n1.t': 'تنبيهات الأحداث الجارية', 'set.n1.s': 'تنبيهات فورية عند اكتشاف أزمة',
      'set.n2.t': 'قفزات الاتجاهات', 'set.n2.s': 'إشعار عند تجاوز موضوع حد حجم النقاش',
      'set.n3.t': 'جاهزية التقرير', 'set.n3.s': 'بريد عند اكتمال تقرير مجدول',
      'set.n4.t': 'مشاكل الاتصال', 'set.n4.s': 'تحذير عند فشل مزامنة مصدر',
      'set.n5.t': 'الموجز الأسبوعي', 'set.n5.s': 'ملخص يوم السبت لأسبوعك',
      'set.p1.t': 'خاص افتراضياً', 'set.p1.s': 'التحليلات الجديدة لا تُشارك مع الفريق',
      'set.p2.t': 'إخفاء بيانات التصدير', 'set.p2.s': 'إزالة الطوابع الزمنية من الملفات المصدرة',
      'set.p3.t': 'إخفاء هوية بيانات التواصل', 'set.p3.s': 'إزالة الحسابات من عرض التحليلات',
      'set.sec1.t': 'تغيير كلمة المرور', 'set.sec1.s': 'آخر تغيير قبل 42 يوماً',
      'set.sec1.b': 'تغيير', 'set.sec2.t': 'التحقق بخطوتين', 'set.sec2.s': 'أضف تطبيق مصادقة',
      'set.shk1': 'تحليل جديد', 'set.shk2': 'تشغيل بحث محفوظ', 'set.shk3': 'تصدير تقرير',
      'set.shk4': 'فتح الإعدادات', 'set.shk5': 'تبديل المظهر',
      'set.k': 'اختصار', 'set.k.action': 'الإجراء',
      'set.exp1.t': 'خرائط السرد', 'set.exp1.s': 'رسوم مرئية لقصة الحدث',
      'set.exp2.t': 'موجز صوتي', 'set.exp2.s': 'استمع إلى موجزك اليومي',
      'set.exp3.t': 'مؤشرات تعاون مباشرة', 'set.exp3.s': 'حضور فوري متعدد المقاعد',
      'set.danger.sub': 'احذف حسابك وتحليلاتك وصادراتك. لا يمكن التراجع.',
      'set.danger.b': 'حذف الحساب',
      'set.change': 'تغيير', 'set.toggle': 'تفعيل',

      /* connections */
      'conn.health': 'صحة الواجهة', 'conn.last': 'آخر مزامنة', 'conn.status.ok': 'متصل',
      'conn.status.off': 'غير متصل', 'conn.status.soon': 'قريباً',
      'conn.connect': 'اتصال', 'conn.disconnect': 'قطع الاتصال', 'conn.reconnect': 'إعادة الاتصال',
      'conn.fb.d': 'تحليل جمهور الصفحة', 'conn.ig.d': 'رؤى إنستغرام',
      'conn.rss.d': 'تغذيات RSS مخصصة', 'conn.gn.d': 'عناوين عالمية',
      'conn.gt.d': 'منحنيات الاهتمام', 'conn.na.d': 'تجميع واجهة الأخبار',
      'conn.sp.d': 'نتائج محركات البحث', 'conn.gq.d': 'استدلال فائق السرعة للذكاء الاصطناعي',
      'conn.n8n': 'موارد n8n',
      'conn.n8n.s': 'وسّع NABD بموارد الأتمتة. أضف مفتاح API لتفعيل كل مورد.',
      'conn.add': 'إضافة API',
      'conn.remove': 'إزالة API',
      'conn.api.ph': 'الصق مفتاح API…',
      'conn.api.saved': 'تمت إضافة مفتاح API.',
      'conn.api.removed': 'تمت إزالة مفتاح API.',
      'conn.soon.more': 'المزيد من المصادر قادم.',

      /* api */
      'api.keys': 'مفاتيح الواجهة', 'api.keys.create': 'إنشاء مفتاح', 'api.keys.revoke': 'إلغاء',
      'api.keys.copy': 'نسخ', 'api.k1': 'مفتاح الإنتاج', 'api.k2': 'مفتاح الاختبار',
      'api.k1.s': 'إنتاج · أُنشئ قبل 40 يوماً', 'api.k2.s': 'اختبار · أُنشئ قبل 6 أيام',
      'api.webhooks': 'الويب هوك', 'api.add': 'إضافة ويب هوك', 'api.w1': 'تنبيهات الأزمات',
      'api.w2': 'اكتمال التقرير', 'api.wx': 'حذف',
      'api.logs': 'سجلات الطلبات', 'api.usage': 'الاستخدام',
      'api.usage.req': 'طلبات اليوم', 'api.usage.limit': 'حد المعدل',
      'api.usage.env': 'البيئة', 'api.usage.env.v': 'إنتاج',
      'api.usage.end': 'النقاط', 'api.usage.end1': '/v1/analyze', 'api.usage.end2': '/v1/trends',
      'api.log1': 'POST /v1/analyze', 'api.log2': 'GET /v1/trends', 'api.log3': 'GET /v1/crisis',
      'api.log4': 'POST /v1/export', 'api.future': 'تكاملات مستقبلية',

      /* notifications */
      'notif.mark': 'تحديد الكل كمقروء', 'notif.unread': 'غير مقروء',
      'notif.f.all': 'الكل', 'notif.f.ai': 'تنبيهات ذكية', 'notif.f.trend': 'قفزات الاتجاه',
      'notif.f.system': 'النظام', 'notif.f.reports': 'التقارير',
      'notif.f.conn': 'الاتصالات', 'notif.f.export': 'الصادرات',
      'notif.t1': 'تم رصد أزمة — عنقود شائعات عملة', 'notif.t2': 'قفزة اتجاه: قناة السويس',
      'notif.t3': 'موجز مصر الأسبوعي جاهز', 'notif.t4': 'تم ربط صفحة فيسبوك',
      'notif.t5': 'اكتمل التصدير — بيانات السويس', 'notif.t6': 'موضوع التضخم تجاوز الحد',
      'notif.t7': 'فشل تقرير مجدول — مهلة المصدر', 'notif.t8': 'ميزة جديدة: خرائط السرد',
      'notif.s1': 'مخاطر تصاعد: تضخم معلومات مضللة حول شائعات العملة في مجموعات الدلتا.',
      'notif.s2': 'تضاعف حجم النقاش ثلاث مرات خلال 3 ساعات.',
      'notif.s3': 'أُنشئ من 14 مصدراً — متاح بصيغ PDF وCSV.',
      'notif.s4': 'الصفحة: تحليلات نبض — بدأت مزامنة الجمهور.',
      'notif.s5': 'ملف CSV جاهز للتنزيل في التقارير.',
      'notif.s6': 'تجاوز نقاش التضخم حد 24 ساعة.',
      'notif.s7': 'انتهت مهلة مصدر — سيُعاد المحاولة تلقائياً.',
      'notif.s8': 'جرّبها من الإعدادات → تجريبي.',
      'notif.empty': 'لا شيء هنا بعد.',
      'notif.empty.new': 'لا توجد إشعارات بعد — ستظهر هنا التحليلات المكتملة وأحداث الحساب.',
      'notif.fb.t': 'تم ربط فيسبوك', 'notif.fb.s': 'الصفحة: {p}',
      'notif.run.t': 'اكتمل التحليل', 'notif.run.s': 'الاستعلام: {q}',
      'notif.alert.t': 'حان موعد الفحص',
      'notif.alert.s': 'أعد تشغيل تحليل "{q}" للحصول على أحدث الإشارات.',
      'notif.saved.t': 'تقرير محفوظ — {q}',
      'notif.saved.s': 'هذا التقرير مسودة محفوظة. أعد تشغيل التحليل من لوحة التحكم لعرض النتائج الكاملة.',
      'notif.email.reminder': 'تم إرسال بريد التذكير.',
      'notif.email.reminderErr': 'تعذر إرسال بريد التذكير.',
      'notif.auth.in.t': 'تم تسجيل الدخول', 'notif.auth.in.s': 'مرحبًا بعودتك إلى نبض.',
      'notif.auth.up.t': 'تم إنشاء الحساب', 'notif.auth.up.s': 'أهلًا بك في نبض — مساحة العمل جاهزة.',

      /* favorites */
      'fav.t.reports': 'التقارير', 'fav.t.searches': 'البحوث',
      'fav.t.dashboards': 'لوحات التحكم', 'fav.t.topics': 'المواضيع',
      'fav.r1': 'موجز مصر الأسبوعي', 'fav.r2': 'رصد مخاطر التضخم', 'fav.r3': 'تقرير نبض التواصل الاجتماعي',
      'fav.s1': 'الجنيه المصري', 'fav.s2': 'قناة السويس', 'fav.s3': 'العاصمة الجديدة',
      'fav.d1': 'نظرة المحافظات', 'fav.d2': 'لوحة قيادة الأزمات', 'fav.d3': 'نبض التواصل',
      'fav.t1': 'الاقتصاد', 'fav.t2': 'قناة السويس', 'fav.t3': 'التعليم',
      'fav.empty.reports': 'لا توجد تقارير مفضلة بعد — فعّل النجمة على تقرير من لوحة التحكم.',
      'fav.empty.searches': 'لا توجد عمليات بحث مفضلة بعد — ثبّت بحثًا من السجل.',
      'fav.empty.dashboards': 'ستظهر لوحات التحكم المحفوظة هنا.',
      'fav.empty.topics': 'ستظهر الموضوعات المتابَعَة هنا.',

      /* saved searches */
      'srch.new': 'مجلد جديد', 'srch.rename': 'إعادة تسمية', 'srch.dup': 'تكرار',
      'srch.run': 'تشغيل مجدداً', 'srch.del': 'حذف', 'srch.fav': 'مفضل',
      'srch.folders': 'المجلدات', 'srch.all': 'كل البحوث',
      'srch.s1': 'أسعار الغذاء في القاهرة', 'srch.s2': 'حركة قناة السويس', 'srch.s3': 'توقعات الجنيه المصري',
      'srch.s4': 'مشاعر التعليم', 'srch.s5': 'تعافي السياحة',
      'srch.f1': 'الاقتصاد', 'srch.f2': 'البنية التحتية',
      'srch.empty': 'لا توجد بحوث محفوظة تطابق هذا المجلد.'
    }
  };

  const QUERIES = {
    en: ["What's happening in Cairo today?", "Analyze Egypt's inflation discussions.", 'Why is the Egyptian Pound trending?', 'Track Suez Canal conversations.', 'Show public sentiment about education.', "What's new in Egyptian football?", 'Track New Administrative Capital news.'],
    ar: ['ماذا يحدث في القاهرة اليوم؟', 'حلّل نقاشات التضخم في مصر.', 'لماذا يرتفع الجنيه المصري؟', 'تتبّع أحاديث قناة السويس.', 'أظهر الرأي العام حول التعليم.', 'ما الجديد في الكرة المصرية؟', 'تتبّع أخبار العاصمة الإدارية الجديدة.']
  };

  let lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = (key) => (I18N[lang][key] !== undefined ? I18N[lang][key] : I18N.en[key] !== undefined ? I18N.en[key] : key);

  /* ----------------------------------------------------------
     THEME
     ---------------------------------------------------------- */
  function resolveTheme(th) {
    if (th === 'system' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return th;
  }
  function applyTheme(th) {
    document.documentElement.setAttribute('data-theme', resolveTheme(th || 'dark'));
    try { localStorage.setItem('nabd-theme', th || 'dark'); } catch (e) {}
    document.dispatchEvent(new Event('nabd-theme'));
  }
  document.querySelectorAll('[data-action="theme"]').forEach((b) =>
    b.addEventListener('click', () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    })
  );

  /* ----------------------------------------------------------
     SESSION — auth helpers (shared across all pages)
     ---------------------------------------------------------- */
  function getUser() {
    let raw = null;
    try { raw = sessionStorage.getItem('nabd-user') || localStorage.getItem('nabd-user'); } catch (e) {}
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function persistUser(u, remember) {
    const json = JSON.stringify(u);
    try {
      if (remember) {
        localStorage.setItem('nabd-user', json);
        sessionStorage.removeItem('nabd-user');
      } else {
        sessionStorage.setItem('nabd-user', json);
        localStorage.removeItem('nabd-user');
      }
    } catch (e) {}
  }
  function clearUser() {
    try {
      localStorage.removeItem('nabd-user');
      sessionStorage.removeItem('nabd-user');
    } catch (e) {}
  }

  /* ----------------------------------------------------------
     API — same-origin Vercel serverless routes (/api/*).
     Sends the auth session cookie (credentials: 'include') on every
     request. Errors reject with { message, code, status, data }.
     ---------------------------------------------------------- */
  function api(path, opts) {
    const o = opts || {};
    const init = {
      method: o.method || 'GET',
      headers: Object.assign({ Accept: 'application/json' }, o.headers || {}),
      credentials: 'include',
      cache: 'no-store'
    };
    if (o.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(o.body);
    }
    return fetch(path, init).then((res) => {
      const ct = res.headers.get('content-type') || '';
      const parse = ct.indexOf('application/json') !== -1
        ? res.json()
        : res.text().then((t) => {
            const s = (t || '').trim();
            if (!s) return {};
            if (res.status >= 500 || /^\s*<!doctype html|^\s*<html/i.test(s)) {
              return { _serverError: true, status: res.status, message: 'Server error (' + res.status + ')' };
            }
            return { message: s };
          });
      return parse.then((data) => {
        if (!res.ok) {
          const err = new Error((data && data.message) || 'Request failed');
          err.status = res.status;
          err.code = data && data._serverError ? 'SERVER_ERROR' : (data && data.error);
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  /* Resolve the current server-side session (GET /api/auth?action=me).
     Resolves to the user object, or null when unauthenticated. */
  function authMe() {
    return Promise.resolve()
      .then(() => api('/api/auth?action=me'))
      .then((d) => (d && d.user) || null)
      .catch((err) => {
        if (err.status === 401) return null;
        throw err;
      });
  }

  /* End the server session and clear the local cache. */
  function logout() {
    return api('/api/auth?action=logout', { method: 'POST' }).then(() => { clearUser(); });
  }

  /* ----------------------------------------------------------
     ACTIVITY STORE — real history + notifications
     Persists actions the user actually takes (completed analyses,
     account events, Facebook connects). Nothing here is seeded or
     fabricated. History caps at 60 entries, notifications at 30.
     ---------------------------------------------------------- */
  const HISTORY_KEY = 'nabd-history';
  const NOTIF_KEY = 'nabd-notif';
  const NOTIF_MAX = 30;
  const NOTIF_CATS = ['ai', 'trend', 'system', 'reports', 'conn', 'export'];
  const HISTORY_CATS = ['news', 'social', 'gov', 'sport', 'business'];

  function readStore(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeStore(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
  }
  function historyGet() {
    return readStore(HISTORY_KEY).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  function historyAdd(entry) {
    const item = {
      id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      query: String((entry && entry.query) || '').trim(),
      ts: Number((entry && entry.ts) || Date.now()),
      status: entry && entry.status === 'failed' ? 'failed' : entry && entry.status === 'running' ? 'running' : 'done',
      vis: entry && entry.vis === 'private' ? 'private' : 'public',
      src: entry && entry.src != null ? entry.src : null,
      cat: entry && HISTORY_CATS.indexOf(entry.cat) !== -1 ? entry.cat : null,
      exp: entry && entry.exp ? 1 : 0
    };
    if (!item.query) return item;
    const list = readStore(HISTORY_KEY);
    list.unshift(item);
    writeStore(HISTORY_KEY, list.slice(0, 60));
    return item;
  }
  function historyRemove(id) {
    writeStore(HISTORY_KEY, readStore(HISTORY_KEY).filter((h) => h.id !== id));
  }
  function notifGet() {
    return readStore(NOTIF_KEY).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  function notifAdd(entry) {
    const item = {
      id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: String((entry && entry.title) || ''),
      sub: entry && entry.sub != null ? String(entry.sub) : '',
      cat: entry && NOTIF_CATS.indexOf(entry.cat) !== -1 ? entry.cat : 'system',
      ts: Number((entry && entry.ts) || Date.now()),
      params: entry && entry.params && typeof entry.params === 'object' ? entry.params : null
    };
    const list = readStore(NOTIF_KEY);
    list.unshift(item);
    writeStore(NOTIF_KEY, list.slice(0, NOTIF_MAX));
    return item;
  }

  function fmt(key, params) {
    let s = t(key);
    if (params && typeof params === 'object') {
      Object.keys(params).forEach((k) => { s = s.split('{' + k + '}').join(String(params[k])); });
    }
    return s;
  }

  /* ----------------------------------------------------------
     LOCAL ACTIVITY FEED — actions the user takes in this browser
     (analyses, exports, saved reports, favorites, alerts, profile
     and connection events). Caps at 30 entries.
     ---------------------------------------------------------- */
  const ACTIVITY_KEY = 'nabd-activity';
  const ACTIVITY_TYPES = ['analysis', 'export', 'save', 'fav', 'alert', 'reminder', 'profile', 'avatar', 'conn'];
  function activityGet() {
    return readStore(ACTIVITY_KEY).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  function activityAdd(type, meta) {
    if (ACTIVITY_TYPES.indexOf(type) === -1) return null;
    const item = {
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: type,
      q: meta && meta.q != null ? String(meta.q) : '',
      n: meta && meta.n != null ? String(meta.n) : '',
      ts: Number((meta && meta.ts) || Date.now())
    };
    const list = readStore(ACTIVITY_KEY);
    list.unshift(item);
    writeStore(ACTIVITY_KEY, list.slice(0, 30));
    return item;
  }

  /* ----------------------------------------------------------
     ALERTS — reminders stored locally with a due date.
     checkAlerts() moves due alerts into the notification store
     and asks the server to email a reminder.
     ---------------------------------------------------------- */
  const ALERT_KEY = 'nabd-alerts';
  function alertsGet() {
    return readStore(ALERT_KEY).slice().sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
  }
  function alertsAdd(entry) {
    const item = {
      id: 'al' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      q: String((entry && entry.q) || '').trim(),
      dueAt: Number((entry && entry.dueAt) || 0),
      ts: Number((entry && entry.ts) || Date.now()),
      done: false
    };
    if (!item.q || !item.dueAt) return null;
    const list = readStore(ALERT_KEY);
    list.unshift(item);
    writeStore(ALERT_KEY, list.slice(0, 50));
    return item;
  }
  function alertsRemove(id) {
    writeStore(ALERT_KEY, readStore(ALERT_KEY).filter((a) => a.id !== id));
  }
  function alertsDue() {
    const now = Date.now();
    return readStore(ALERT_KEY).filter((a) => !a.done && a.dueAt <= now);
  }
  function checkAlerts() {
    const due = alertsDue();
    if (!due.length) return;
    const now = Date.now();
    const list = readStore(ALERT_KEY);
    due.forEach((a) => {
      notifAdd({ title: 'notif.alert.t', sub: 'notif.alert.s', params: { q: a.q }, cat: 'reports', ts: now });
      a.done = true;
      const user = getUser();
      api('/api/notifications?action=send-reminder', {
        method: 'POST',
        body: { query: a.q, email: user && user.email }
      }).catch(() => {});
    });
    writeStore(ALERT_KEY, list);
  }

  /* ----------------------------------------------------------
     FAVORITES — reports the user starred from the dashboard.
     ---------------------------------------------------------- */
  const FAV_KEY = 'nabd-favs';
  function favGet() {
    return readStore(FAV_KEY);
  }
  function favHas(q) {
    const key = String(q == null ? '' : q).trim().toLowerCase();
    if (!key) return false;
    return favGet().some((f) => String(f.q || '').toLowerCase() === key);
  }
  function favAdd(entry) {
    const item = {
      id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      q: String((entry && entry.q) || '').trim(),
      t: Number((entry && entry.t) || Date.now()),
      r: null
    };
    const r = (entry && entry.r) || null;
    if (r && typeof r === 'object') {
      item.r = {
        query: String(r.query || item.q || ''),
        src: r.src != null ? r.src : null,
        tone: r.tone != null ? r.tone : null
      };
    }
    if (!item.q || favHas(item.q)) return null;
    const list = favGet();
    list.unshift(item);
    writeStore(FAV_KEY, list.slice(0, 50));
    return item;
  }
  function favRemove(q) {
    const key = String(q == null ? '' : q).trim().toLowerCase();
    writeStore(FAV_KEY, favGet().filter((f) => String(f.q || '').toLowerCase() !== key));
  }

  /* ----------------------------------------------------------
     AVATAR + local download counter (usage stats on profile).
     ---------------------------------------------------------- */
  const AVATAR_KEY = 'nabd-avatar';
  const DL_KEY = 'nabd-dlcount';
  function avatarGet() {
    try { return localStorage.getItem(AVATAR_KEY); } catch (e) { return null; }
  }
  function avatarSet(dataUrl) {
    try {
      if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl);
      else localStorage.removeItem(AVATAR_KEY);
    } catch (e) {}
  }
  function dlCount() {
    try { return parseInt(localStorage.getItem(DL_KEY) || '0', 10) || 0; } catch (e) { return 0; }
  }
  function recordDownload(fileType, searchId) {
    try { localStorage.setItem(DL_KEY, String(dlCount() + 1)); } catch (e) {}
    api('/api/downloads', { method: 'POST', body: { fileType: fileType || 'report', searchId: searchId || null } })
      .catch(() => {});
  }

  /* ----------------------------------------------------------
     I18N APPLY
     ---------------------------------------------------------- */
  const langBtns = document.querySelectorAll('.lang-toggle');

  function applyLang(next) {
    lang = next;
    const d = I18N[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      if (d[k] !== undefined) el.textContent = d[k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const k = el.dataset.i18nHtml;
      if (d[k] !== undefined) el.innerHTML = d[k];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const k = el.dataset.i18nPh;
      if (d[k] !== undefined) el.setAttribute('placeholder', d[k]);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const k = el.dataset.i18nTitle;
      if (d[k] !== undefined) el.title = d[k];
    });

    langBtns.forEach((b) => { b.textContent = lang === 'ar' ? 'EN' : 'العربية'; });

    document.querySelectorAll('.suggestions .chip').forEach((chip, i) => {
      if (!chip.dataset.qEn) chip.dataset.qEn = chip.dataset.q;
      if (!chip.dataset.qAr && QUERIES.ar[i]) chip.dataset.qAr = QUERIES.ar[i];
      chip.dataset.q = lang === 'ar' ? chip.dataset.qAr || chip.dataset.qEn : chip.dataset.qEn;
    });

    try { localStorage.setItem('nabd-lang', lang); } catch (e) {}
    document.dispatchEvent(new Event('nabd-lang'));
  }

  langBtns.forEach((b) => b.addEventListener('click', () => {
    applyLang(lang === 'ar' ? 'en' : 'ar');
  }));

  /* ----------------------------------------------------------
     THEME-AWARE COLOR HELPERS
     ---------------------------------------------------------- */
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function parseColor(c) {
    const m = c.match(/[\d.]+/g);
    if (!m || m.length < 3) return [94, 162, 255, 1];
    return [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2]), m.length > 3 ? +m[3] : 1];
  }
  const accentRGB = () => parseColor(cssVar('--accent'));
  const gridRGB = () => parseColor(cssVar('--chart-grid'));
  const labelRGB = () => parseColor(cssVar('--chart-label'));

  /* ----------------------------------------------------------
     PAGE TRANSITIONS (multi-page routing)
     ---------------------------------------------------------- */
  /* app pages live in pages/ — resolve relative to the current page's directory */
  const PAGE_DIR = location.pathname.split('/').pop() === 'index.html' ? 'pages/' : '';

  /* Subtle fade transition on the content container for data-page navigations.
     The fixed shell (sidebar/topbar) stays static; prefers-reduced-motion is
     respected. */
  function pageFadeTarget() {
    const el = document.querySelector('.app-main') || document.querySelector('main') || document.querySelector('.auth-panel');
    return (el && el.nodeType === 1) ? el : null;
  }

  function navigate(url) {
    const cur = location.pathname.split('/').pop();
    const target = url.split(/[?#]/)[0].split('/').pop();
    if (target === cur) {
      window.scrollTo(0, 0);
      return;
    }
    const el = pageFadeTarget();
    if (reduceMotion || !el || !el.classList) {
      location.href = url;
      return;
    }
    if (el._nabdNavToken) clearTimeout(el._nabdNavToken);
    el.classList.add('page-leaving');
    el._nabdNavToken = setTimeout(() => { location.href = url; }, 170);
  }

  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[data-page]');
    if (!a) return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  });

  function toast(el, msg) {
    if (!el) return;
    el.innerHTML = msg;
    el.classList.add('show');
    clearTimeout(window._nabdToastT);
    window._nabdToastT = setTimeout(() => el.classList.remove('show'), 3400);
  }

  /* ----------------------------------------------------------
     NAV — scrolled + burger
     ---------------------------------------------------------- */
  const nav = $('nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('navBurger');
  const navLinksEl = $('navLinks');
  if (burger && navLinksEl) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navLinksEl.classList.toggle('open');
    });
    navLinksEl.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinksEl.classList.remove('open');
    });
  }

  /* ----------------------------------------------------------
     SCROLLSPY (landing only)
     ---------------------------------------------------------- */
  const spySections = ['top', 'why', 'use-cases', 'cta']
    .map((id) => ({ id, el: document.getElementById(id) }))
    .filter((s) => s.el);
  if (spySections.length) {
    let ticking = false;
    const setActive = () => {
      const pos = window.scrollY + 140;
      let current = spySections[0].id;
      spySections.forEach((s) => { if (s.el.offsetTop <= pos) current = s.id; });
      document.querySelectorAll('.nav-links a[data-spy]').forEach((a) => {
        a.classList.toggle('active', a.dataset.spy === current);
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(setActive); ticking = true; }
    }, { passive: true });
    setActive();
  }

  /* ----------------------------------------------------------
     REVEAL ON SCROLL
     ---------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  function viewObserver(el, cb) {
    if (!el) return () => {};
    if (reduceMotion) { cb(); return () => {}; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { cb(); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }

  /* ----------------------------------------------------------
     SHARED SVG DEFS
     ---------------------------------------------------------- */
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
  defs.style.cssText = 'position:absolute;pointer-events:none;';
  defs.innerHTML =
    '<defs>' +
    '<linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0%" stop-color="#7A5CFF" stop-opacity=".5"/><stop offset="100%" stop-color="#5EA2FF"/>' +
    '</linearGradient>' +
    '<linearGradient id="mdGrad" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#5EA2FF"/><stop offset="100%" stop-color="#7A5CFF"/>' +
    '</linearGradient>' +
    '</defs>';
  document.body.appendChild(defs);

  /* ----------------------------------------------------------
     CHART HELPERS
     ---------------------------------------------------------- */
  function smoothPathD(pts, w, h, pad) {
    pad = pad || 6;
    const max = Math.max(...pts), min = Math.min(...pts);
    const range = max - min || 1;
    const X = (i) => pad + (i / (pts.length - 1)) * (w - pad * 2);
    const Y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
    let d = `M ${X(0).toFixed(1)},${Y(pts[0]).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const xm = (X(i - 1) + X(i)) / 2;
      const ym = (Y(pts[i - 1]) + Y(pts[i])) / 2;
      d += ` Q ${X(i - 1).toFixed(1)},${Y(pts[i - 1]).toFixed(1)} ${xm.toFixed(1)},${ym.toFixed(1)}`;
    }
    d += ` T ${X(pts.length - 1).toFixed(1)},${Y(pts[pts.length - 1]).toFixed(1)}`;
    return { d, X, Y, w, h };
  }

  function drawLineChart(ctx, w, h, pts, color, fill) {
    const { d, X, Y } = smoothPathD(pts, w, h, 8);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = `rgba(${gridRGB().join(',')})`;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const gy = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    if (fill) {
      const base = (color.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgba(${base.join(',')},.32)`);
      grad.addColorStop(1, `rgba(${base.join(',')},0)`);
      const pts2 = d.match(/[\d.]+,[\d.]+/g).map((p) => p.split(',').map(Number));
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(pts2[0][0], pts2[0][1]);
      for (let i = 1; i < pts2.length; i++) ctx.lineTo(pts2[i][0], pts2[i][1]);
      ctx.lineTo(pts2[pts2.length - 1][0], h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.beginPath();
    const ptsArr = d.match(/[\d.]+,[\d.]+/g).map((p) => p.split(',').map(Number));
    ptsArr.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(94,162,255,.75)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /* sentiment donut builder (shared: workspace) */
  function buildDonut(el, segs, centerBold, centerLabel) {
    if (!el) return;
    el.innerHTML = '';
    const size = 172, r = 62, cx = size / 2, cy = size / 2;
    const C = 2 * Math.PI * r;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    const total = segs.reduce((s, x) => s + x.v, 0);
    let acc = 0;
    segs.forEach((seg) => {
      const len = (seg.v / total) * C - 3.5;
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('class', 'd-seg');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      c.setAttribute('stroke', seg.color);
      c.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${(C - len).toFixed(2)}`);
      c.style.filter = seg.color === '#7A8BB5' ? '' : `drop-shadow(0 0 6px ${seg.color}66)`;
      c.setAttribute('data-final', (-acc).toFixed(2));
      c.setAttribute('stroke-dashoffset', (-(acc + len)).toFixed(2));
      acc += len;
      svg.appendChild(c);
    });
    const bg = document.createElementNS(ns, 'circle');
    bg.setAttribute('class', 'd-bg');
    bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
    svg.appendChild(bg);
    const center = document.createElement('div');
    center.setAttribute('class', 'donut-center');
    center.innerHTML = `<b>${centerBold}</b><span>${centerLabel}</span>`;
    el.appendChild(svg);
    el.appendChild(center);
    viewObserver(el, () => {
      requestAnimationFrame(() =>
        el.querySelectorAll('.d-seg').forEach((c) => c.setAttribute('stroke-dashoffset', c.dataset.final))
      );
    });
  }

  /* ----------------------------------------------------------
     HERO PREVIEW CHART (landing)
     ---------------------------------------------------------- */
  const pvCanvas = $('previewChart');
  if (pvCanvas) {
    const ctx = pvCanvas.getContext('2d');
    let pvData = [];
    for (let i = 0; i < 40; i++) pvData.push(30 + Math.sin(i * 0.3) * 12 + Math.sin(i * 0.11) * 7 + rand(0, 6));
    const drawPV = () => {
      const dpr = window.devicePixelRatio || 1;
      pvCanvas.width = (pvCanvas.clientWidth || 300) * dpr;
      pvCanvas.height = (pvCanvas.clientHeight || 90) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawLineChart(ctx, pvCanvas.clientWidth || 300, pvCanvas.clientHeight || 90, pvData, 'rgb(94,162,255)', true);
      const last = pvData[pvData.length - 1];
      const { X, Y } = smoothPathD(pvData, pvCanvas.clientWidth || 300, pvCanvas.clientHeight || 90, 8);
      ctx.beginPath();
      ctx.arc(X(pvData.length - 1), Y(last), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    };
    drawPV();
    setInterval(() => {
      pvData.push(Math.min(60, Math.max(12, pvData[pvData.length - 1] + rand(-4, 4))));
      pvData.shift();
      drawPV();
    }, 320);
    window.addEventListener('resize', drawPV);
    document.addEventListener('nabd-theme', drawPV);
  }

  /* ----------------------------------------------------------
     HERO PREVIEW DONUT (landing)
     ---------------------------------------------------------- */
  const previewDonut = $('previewDonut');
  if (previewDonut) {
    const ns = 'http://www.w3.org/2000/svg';
    const r = 36, C = 2 * Math.PI * r;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 84 84');
    const bg = document.createElementNS(ns, 'circle');
    bg.setAttribute('class', 'md-bg');
    bg.setAttribute('cx', 42); bg.setAttribute('cy', 42); bg.setAttribute('r', r);
    const seg = document.createElementNS(ns, 'circle');
    seg.setAttribute('class', 'md-seg');
    seg.setAttribute('cx', 42); seg.setAttribute('cy', 42); seg.setAttribute('r', r);
    seg.setAttribute('stroke-dasharray', C.toFixed(2));
    seg.setAttribute('stroke-dashoffset', C.toFixed(2));
    svg.appendChild(bg); svg.appendChild(seg);
    previewDonut.appendChild(svg);
    const b = document.createElement('b');
    b.textContent = '62%';
    previewDonut.appendChild(b);
    setTimeout(() => {
      seg.setAttribute('stroke-dashoffset', (C * (1 - 0.62)).toFixed(2));
      previewDonut.classList.add('ready');
    }, 900);
  }

  /* ----------------------------------------------------------
     HERO TILT (landing)
     ---------------------------------------------------------- */
  const hv = $('heroVisual');
  if (hv) {
    hv.addEventListener('mousemove', (e) => {
      const rect = hv.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      hv.style.transform = `perspective(1100px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
    });
    hv.addEventListener('mouseleave', () => (hv.style.transform = ''));
  }

  /* ----------------------------------------------------------
     COUNTERS (landing)
     ---------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent = decimals ? val.toFixed(decimals).replace(/\.0+$/, '') : Math.round(val).toLocaleString('en-US');
      el.textContent += suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { animateCounter(en.target); counterObserver.unobserve(en.target); }
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => counterObserver.observe(c));

  /* ----------------------------------------------------------
     SPARKLINES (landing preview + workspace KPIs)
     ---------------------------------------------------------- */
  document.querySelectorAll('.spark').forEach((svg) => {
    const raw = (svg.dataset.spark || '').split(',').map(Number);
    if (raw.length < 2) return;
    const w = 120, h = 36, pad = 3;
    const max = Math.max(...raw), min = Math.min(...raw);
    const range = max - min || 1;
    const X = (i) => pad + (i / (raw.length - 1)) * (w - pad * 2);
    const Y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);

    let d = `M ${X(0)},${Y(raw[0])}`;
    for (let i = 1; i < raw.length; i++) {
      const xm = (X(i - 1) + X(i)) / 2;
      d += ` Q ${X(i - 1)},${Y(raw[i - 1])} ${xm},${Y((raw[i - 1] + raw[i]) / 2)}`;
    }
    d += ` T ${X(raw.length - 1)},${Y(raw[raw.length - 1])}`;

    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', d + ` L ${X(raw.length - 1)},${h} L ${X(0)},${h} Z`);
    area.setAttribute('fill', 'url(#sparkGrad)');
    area.setAttribute('opacity', '.22');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', d);
    line.setAttribute('stroke', 'url(#sparkGrad)');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');

    svg.innerHTML = '';
    svg.appendChild(area);
    svg.appendChild(line);

    let pts = raw.slice();
    setInterval(() => {
      pts.push(Math.max(min - 2, Math.min(max + 2, pts[pts.length - 1] + rand(-3, 3))));
      pts.shift();
      const m2 = Math.max(...pts), n2 = Math.min(...pts);
      const r2 = m2 - n2 || 1;
      const Y2 = (v) => h - pad - ((v - n2) / r2) * (h - pad * 2);
      let d2 = `M ${X(0)},${Y2(pts[0])}`;
      for (let i = 1; i < pts.length; i++) {
        const xm = (X(i - 1) + X(i)) / 2;
        d2 += ` Q ${X(i - 1)},${Y2(pts[i - 1])} ${xm},${Y2((pts[i - 1] + pts[i]) / 2)}`;
      }
      d2 += ` T ${X(pts.length - 1)},${Y2(pts[pts.length - 1])}`;
      line.setAttribute('d', d2);
      area.setAttribute('d', d2 + ` L ${X(pts.length - 1)},${h} L ${X(0)},${h} Z`);
    }, 2600);
  });

  /* ----------------------------------------------------------
     LIVE FEED — seamless loop (workspace)
     ---------------------------------------------------------- */
  const feedTrack = $('feedTrack');
  if (feedTrack) feedTrack.innerHTML += feedTrack.innerHTML;

  /* ----------------------------------------------------------
     FACEBOOK PRIVATE ANALYSIS — real Meta OAuth (landing)
     UI reflects the real connection state; connect opens the OAuth
     popup, disconnect clears the session credentials.
     ---------------------------------------------------------- */
  const fbStatusEl = $('fbStatus');
  const fbConnect = $('fbConnect');
  const fbDisconnect = $('fbDisconnect');
  let fbTimer = null;

  function fbStateTexts() {
    if (!fbStatusEl) return;
    const d = I18N[lang];
    const st = fbStatusEl.dataset.state;
    const title = fbStatusEl.querySelector('.fb-state-title');
    const sub = fbStatusEl.querySelector('.fb-state-sub');
    if (st === 'connected') { title.textContent = d['social.fb.connected.title']; sub.textContent = d['social.fb.connected.sub']; }
    else if (st === 'connecting') { title.textContent = d['social.fb.connecting.title']; sub.textContent = d['social.fb.connecting.sub']; }
    else { title.textContent = d['social.fb.idle.title']; sub.textContent = d['social.fb.idle.sub']; }
  }

  function setFbState(state) {
    if (!fbStatusEl) return;
    fbStatusEl.dataset.state = state;
    if (state === 'connected') {
      if (fbConnect) fbConnect.classList.add('hidden');
      if (fbDisconnect) fbDisconnect.classList.remove('hidden');
    } else if (state === 'idle') {
      if (fbConnect) fbConnect.classList.remove('hidden');
      if (fbDisconnect) fbDisconnect.classList.add('hidden');
    } else {
      if (fbConnect) fbConnect.classList.add('hidden');
      if (fbDisconnect) fbDisconnect.classList.add('hidden');
    }
    fbStateTexts();
  }

  if (fbConnect) {
    fbConnect.addEventListener('click', () => {
      clearTimeout(fbTimer);
      setFbState('connecting');
      fb.connect();
    });
  }
  if (fbDisconnect) {
    fbDisconnect.addEventListener('click', () => {
      clearTimeout(fbTimer);
      fb.disconnect();
    });
  }
  document.addEventListener('nabd-fb-change', (e) => {
    setFbState(e && e.detail && e.detail.connected ? 'connected' : 'idle');
  });

  /* ----------------------------------------------------------
     API CONFIG — the n8n webhook URL is environment-configurable.
     The Vercel serverless route /api/config serves it from
     NABD_WEBHOOK_URL; when that route is unavailable (local static
     preview) the production default is used. Resolved once + cached.
     ---------------------------------------------------------- */
  const DEFAULT_WEBHOOK = 'https://n8n.addme.solutions/webhook/trend-analysis';

  let apiConfigPromise = null;
  function loadApiConfig() {
    if (!apiConfigPromise) {
      apiConfigPromise = fetch('/api/config', { headers: { Accept: 'application/json' }, cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('config http ' + res.status))))
        .then((cfg) => (cfg && typeof cfg === 'object' ? cfg : {}))
        .catch(() => ({}));
    }
    return apiConfigPromise;
  }
  const apiWebhookUrl = (cfg) => (cfg && cfg.webhookUrl) || DEFAULT_WEBHOOK;

  /* ----------------------------------------------------------
     ANALYSIS SERVICE — real n8n webhook
     USER INPUT → POST /webhook/trend-analysis → raw response
     ----------------------------------------------------------
     Public payload  : { query, prompt, scope: "public" }
     Private payload : { query, prompt, scope: "private", accessToken,
                         accountId, igUserId }
     Failures (HTTP or network/timeout) reject — never mock.
     Errors log status only — access tokens are never logged.     */
  function analyze(query, opts) {
    const scope = opts && opts.scope === 'private' ? 'private' : 'public';
    const q = String(query || '').trim();
    /* The deployed workflow requires BOTH `query` (drives data gathering) and
       `prompt` (its AI analysis input) — with only `query` present it responds
       with an empty body. */
    const payload = { query: q, scope: scope };
    if (q) payload.prompt = q;
    if (scope === 'private') {
      const st = fb.read();
      if (!st.connected) return Promise.reject(new Error('fb-not-connected'));
      if (st.accessToken) payload.accessToken = st.accessToken;
      if (st.accountId) payload.accountId = st.accountId;
      if (st.igUserId) payload.igUserId = st.igUserId;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    return loadApiConfig()
      .then((cfg) => fetch(apiWebhookUrl(cfg), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      }))
      .then((res) => {
        clearTimeout(timer);
        if (!res.ok) {
          if (typeof console !== 'undefined') console.error('[nabd] trend-analysis http ' + res.status);
          throw new Error('trend-analysis http ' + res.status);
        }
        return res.text().then((txt) => {
          if (!txt || !txt.trim()) throw new Error('trend-analysis empty response');
          try { return JSON.parse(txt); } catch (e) { throw new Error('trend-analysis invalid json'); }
        });
      })
      .catch((err) => {
        clearTimeout(timer);
        throw err;
      });
  }

  /* ----------------------------------------------------------
     NORMALIZATION LAYER — raw n8n response → NormalizedAnalysis
     One consistent model consumed by every dashboard component.
     Missing aggregates are DERIVED from the real returned
     records (articles/resources/results/posts/feed). Nothing is
     invented: fields that cannot be derived stay null and the
     dashboard renders a meaningful unavailable state instead.
     ---------------------------------------------------------- */

  /* ---- transport extraction: safely locate the actual analysis object
     inside whatever wrapper the backend produced — direct object,
     array-wrapped, { text: "<json string>" }, { response/result/body },
     code-fenced and prose-prefixed JSON. The wrapper itself is never
     returned, so raw JSON dumps can never be treated as the analysis. */
  const ANALYSIS_KEYS = ['query', 'stats', 'sentiment', 'trendingTopics', 'aiBrief', 'aiHighlights', 'topLocations', 'topInfluencers', 'sampleSources', 'signalVolume', 'generatedAt', 'ok'];
  const hasAnalysisShape = (o) => o != null && typeof o === 'object' && ANALYSIS_KEYS.some((k) => o[k] != null);
  const parseEmbeddedJson = (s) => {
    const t = String(s == null ? '' : s).trim();
    if (!t) return null;
    try { return JSON.parse(t); } catch (e) { /* fall through to brace scan */ }
    const st = t.indexOf('{');
    const sa = t.indexOf('[');
    const s2 = st === -1 ? sa : (sa === -1 ? st : Math.min(st, sa));
    if (s2 === -1) return null;
    let depth = 0, quote = false, esc = false, end = -1;
    for (let i = s2; i < t.length; i++) {
      const c = t.charAt(i);
      if (quote) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') quote = false;
        continue;
      }
      if (c === '"') { quote = true; continue; }
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end > s2) {
      try { return JSON.parse(t.slice(s2, end + 1)); } catch (e2) { return null; }
    }
    return null;
  };
  const extractAnalysisPayload = (response) => {
    let data = response;
    for (let guard = 0; guard < 4; guard++) {
      if (typeof data === 'string') {
        const inner = parseEmbeddedJson(data);
        if (inner && typeof inner === 'object') { data = inner; continue; }
        break;
      }
      if (Array.isArray(data)) { data = data[0] || null; continue; }
      if (data && typeof data === 'object') {
        if (hasAnalysisShape(data)) break;
        const s = data.text || data.response || data.result || data.body;
        if (typeof s === 'string' && s.trim()) {
          const inner = parseEmbeddedJson(s);
          if (inner && typeof inner === 'object') { data = inner; continue; }
        }
        if (data.output && typeof data.output === 'object') { data = data.output; continue; }
        break;
      }
      break;
    }
    return data;
  };
  /* A text value must never surface as the AI brief while it is still a
     JSON dump — true for fenced, array-wrapped, or prose-prefixed JSON. */
  const looksLikeJson = (s) => {
    let t = String(s == null ? '' : s).trim();
    if (!t) return false;
    t = t.replace(/```[a-z]*/gi, '').replace(/`/g, '').trim();
    if (t.charAt(0) === '{' || t.charAt(0) === '[') return true;
    if (/^("(query|ok|stats|sentiment|trendingTopics|aiBrief|aiHighlights|topLocations|topInfluencers|sampleSources|signalVolume|generatedAt)"\s*:)/i.test(t)) return true;
    const v = t.replace(/^(json|javascript|js)[\s:]*/i, '').trim();
    return v !== t && (v.charAt(0) === '{' || v.charAt(0) === '[');
  };

  function normalizeAnalysisResponse(raw) {
    /* ---- transport unwrap: peel every wrapper layer so consumers read the
       same object. The extracted payload is preserved on `.raw`. ---- */
    raw = extractAnalysisPayload(raw);
    const pick = (o, keys, dflt) => {
      for (let i = 0; i < keys.length; i++) if (o && o[keys[i]] != null && o[keys[i]] !== '') return o[keys[i]];
      return dflt;
    };
    const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    const strList = (v) => {
      if (v == null) return [];
      if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
      return String(v).split(/[,،\s]+/).map((x) => x.trim()).filter(Boolean);
    };
    const CATS = ['news', 'social', 'gov', 'sport', 'business'];
    const normCat = (v) => {
      if (v == null) return null;
      const s = String(v).toLowerCase().trim();
      if (s === 'sports' || s === 'sport') return 'sport';
      if (s === 'government' || s === 'gov') return 'gov';
      if (s === 'society') return 'social';
      return CATS.indexOf(s) !== -1 ? s : null;
    };
    const SRC_TYPE_TOKEN = { news: 1, web: 1, website: 1, article: 1, social: 1, x: 1, twitter: 1, facebook: 1, fb: 1, instagram: 1, ig: 1, rss: 1, feed: 1, google: 1, trends: 1, youtube: 1, newspaper: 1, press: 1, media: 1, unknown: 1 };
    const isSrcTypeToken = (v) => {
      if (v == null) return true;
      const s = String(v).toLowerCase().trim();
      return !!SRC_TYPE_TOKEN[s] || /^(news|web|article|social|rss|feed|google|trends|youtube|twitter|facebook|instagram|press|newspaper)/i.test(s);
    };
    /* Real publisher name beats a bare type token: items carry both
       `source: "news"` and `author: "BBC News"` — the latter is what
       the source cards should show. */
    const pickRealSource = (it) => {
      const keys = ['source', 'sourceName', 'source_name', 'domain', 'publisher', 'author', 'channel'];
      let fallback = null;
      for (let i = 0; i < keys.length; i++) {
        const v = it ? it[keys[i]] : null;
        if (v == null) continue;
        const s = String(v).trim();
        if (!s) continue;
        if (!isSrcTypeToken(s)) return s;
        if (fallback == null) fallback = s;
      }
      return fallback;
    };

    /* ---- NEW dashboard contract: {query, dashboard, intelligence, meta}.
       The dashboard block is deterministic (aggregation-level analytics); the
       intelligence block is the separated AI output. Flatten both back onto
       the legacy top-level keys so every existing consumer keeps working —
       but the deterministic totals always take precedence over any AI-guessed
       counter (e.g. the old "totalPosts: 8"). ---- */
    if (raw && typeof raw === 'object' && raw.dashboard && typeof raw.dashboard === 'object' && raw.intelligence && typeof raw.intelligence === 'object') {
      const D = raw.dashboard;
      const I = raw.intelligence;
      const ov = D.overview && typeof D.overview === 'object' ? D.overview : {};
      const iStats = I.stats && typeof I.stats === 'object' ? I.stats : {};
      const detTotal = num(ov.totalResults) != null ? num(ov.totalResults)
        : num(ov.relevantResults) != null ? num(ov.relevantResults)
        : num(iStats.totalPosts);
      raw = Object.assign({}, raw, {
        stats: Object.assign({}, iStats, {
          totalPosts: detTotal != null ? detTotal : 0,
          activeTopics: num(iStats.activeTopics) != null ? num(iStats.activeTopics) : null
        }),
        sentiment: I.sentiment && typeof I.sentiment === 'object' ? I.sentiment : null,
        trendingTopics: Array.isArray(I.trendingTopics) ? I.trendingTopics : [],
        aiBrief: I.aiBrief && typeof I.aiBrief === 'object' ? I.aiBrief : null,
        aiHighlights: Array.isArray(I.aiHighlights) ? I.aiHighlights : [],
        topLocations: Array.isArray(I.topLocations) ? I.topLocations : [],
        results: Array.isArray(D.sampleSignals) && D.sampleSignals.length
          ? D.sampleSignals
          : (Array.isArray(raw.results) ? raw.results : null),
        signalVolume: Array.isArray(D.timeline) && D.timeline.length
          ? D.timeline.map((p) => ({ time: p && p.date, value: p && p.count })).filter((p) => p.time != null)
          : (Array.isArray(raw.signalVolume) ? raw.signalVolume : null),
        generatedAt: (raw.meta && raw.meta.generatedAt) || raw.generatedAt || null,
        dashboard: D,
        intelligence: I,
        meta: raw.meta || null
      });
    }

    const out = {
      query: '', scope: null, raw: raw, language: null, summary: null, confidence: null, analyzedAt: null,
      articles: [], highlights: [], topics: [], locations: [], influencers: [],
      timeline: null, sentiment: null, network: null, globalContext: null, national: false, sources: [], categories: [],
      dataPoints: [], mediaMix: [], liveTimeline: null, stats: null, dashboard: null, meta: null
    };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;

    out.query = String(pick(raw, ['query', 'q', 'search', 'userQuery'], '') || '');
    out.dashboard = raw.dashboard && typeof raw.dashboard === 'object' ? raw.dashboard : null;
    out.meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : null;
    out.scope = String(pick(raw, ['scope'], '') || '').toLowerCase() || null;
    out.language = pick(raw, ['language', 'lang'], null) || null;
    let aiBriefObj = null;
    if (raw.aiBrief && typeof raw.aiBrief === 'object' && !Array.isArray(raw.aiBrief)) aiBriefObj = raw.aiBrief;
    else if (raw.brief && typeof raw.brief === 'object' && !Array.isArray(raw.brief)) aiBriefObj = raw.brief;
    let sumVal = pick(raw, ['summary', 'aiSummary', 'brief', 'aiBrief', 'answer', 'result', 'text'], null);
    if (sumVal && typeof sumVal === 'object' && !Array.isArray(sumVal)) {
      sumVal = pick(sumVal, ['summary', 'text', 'content', 'brief'], null);
      if (sumVal && typeof sumVal === 'object') sumVal = null;
    }
    if (typeof sumVal === 'string' && looksLikeJson(sumVal)) sumVal = null;
    out.summary = sumVal;
    let conf = num(pick(raw, ['confidence'], null));
    if (conf == null && aiBriefObj) conf = num(aiBriefObj.confidence);
    out.confidence = conf != null ? conf : null;
    out.aiBrief = aiBriefObj;
    out.briefMeta = aiBriefObj ? {
      title: aiBriefObj.title != null ? String(aiBriefObj.title) : null,
      headline: aiBriefObj.headline != null ? String(aiBriefObj.headline) : null,
      summary: aiBriefObj.summary != null ? String(aiBriefObj.summary) : null,
      keyFindings: Array.isArray(aiBriefObj.keyFindings) ? aiBriefObj.keyFindings.map((x) => String(x)).filter(Boolean) : [],
      keyDevelopments: Array.isArray(aiBriefObj.keyDevelopments) ? aiBriefObj.keyDevelopments.map((x) => String(x)).filter(Boolean) : [],
      whyItMatters: aiBriefObj.whyItMatters != null ? String(aiBriefObj.whyItMatters) : null,
      confidence: conf
    } : null;
    out.analyzedAt = pick(raw, ['analyzedAt', 'generatedAt', 'timestamp', 'completedAt', 'created_at'], null) || null;
    out.network = pick(raw, ['network', 'graph', 'entities', 'relations'], null) || null;
    out.globalContext = pick(raw, ['globalContext', 'global', 'global_trends', 'world'], null) || null;

    /* ---- stats (contract: totalPosts, activeTopics, sentimentScore,
       emergencyAlerts, negativeTopics, positiveTopics). Values that are
       genuinely missing stay null — the UI shows "—" for those, keeping
       0 distinct from unavailable. ---- */
    if (raw.stats && typeof raw.stats === 'object') {
      out.stats = {
        totalPosts: num(raw.stats.totalPosts),
        activeTopics: num(raw.stats.activeTopics),
        sentimentScore: num(raw.stats.sentimentScore),
        emergencyAlerts: num(raw.stats.emergencyAlerts),
        negativeTopics: num(raw.stats.negativeTopics),
        positiveTopics: num(raw.stats.positiveTopics)
      };
    }

    /* ---- articles/resources: the foundation ---- */
    const ITEM_KEYS = ['title', 'headline', 'name', 'text', 'content', 'post', 'message'];
    const augArrays = [raw.articles, raw.resources, raw.results, raw.items, raw.posts, raw.news, raw.analysis_corpus, raw.sampleSources];
    const seen = {};
    const rawItems = [];
    augArrays.forEach((arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((it) => {
        if (!it || typeof it !== 'object') return;
        const t = String(pick(it, ITEM_KEYS, '') || '').trim();
        if (!t || seen[t]) return;
        seen[t] = 1;
        rawItems.push(it);
      });
    });
    out.articles = rawItems.map((it) => {
      const topics = strList(pick(it, ['topics', 'keywords', 'entities'], null));
      const srcVal = pick(it, ['source'], null);
      const srcTok = (srcVal != null && isSrcTypeToken(srcVal)) ? String(srcVal).trim().toLowerCase() : null;
      return {
        title: pick(it, ITEM_KEYS, null),
        description: pick(it, ['description', 'summary', 'snippet', 'excerpt'], null),
        url: pick(it, ['url', 'link', 'href'], null),
        source: pickRealSource(it),
        sourceType: pick(it, ['sourceType', 'source_type', 'type', 'src', 'medium'], null) || srcTok,
        publishedAt: pick(it, ['publishedAt', 'published_at', 'published', 'date', 'datetime', 'ts', 'timestamp', 'time', 'created', 'createdAt', 'observedAt'], null),
        language: pick(it, ['language', 'lang'], null),
        category: pick(it, ['category', 'cat', 'section', 'group'], null),
        sentiment: pick(it, ['sentiment', 'sentimentLabel', 'sentiment_label', 'label'], null),
        sentimentScore: num(pick(it, ['sentimentScore', 'sentiment_score', 'score', 'polarity'], null)),
        topics: topics, keywords: topics,
        hashtags: strList(pick(it, ['hashtags', 'tags'], null)),
        location: pick(it, ['location', 'region', 'city', 'gov', 'governorate'], null),
        engagement: num(pick(it, ['engagement', 'mentions', 'reactions', 'comments', 'shares', 'reach', 'volume'], null))
      };
    });

    /* ---- categories: derive from the source medium when the feed gives no
       per-item category (n8n's sampleSources carry `source: "web"`). This keeps
       the media-mix + category filters populated with real, derivable data. ---- */
    const CAT_FROM_SRC = {
      news: 'news', web: 'news', website: 'news', article: 'news', rss: 'news', feed: 'news',
      google: 'news', trends: 'news', newspaper: 'news', press: 'news', media: 'news',
      x: 'social', twitter: 'social', facebook: 'social', fb: 'social', instagram: 'social', ig: 'social',
      youtube: 'social', social: 'social', tiktok: 'social',
      gov: 'gov', government: 'gov', official: 'gov',
      sport: 'sport', sports: 'sport',
      business: 'business', economy: 'business', finance: 'business'
    };
    out.articles.forEach((a) => {
      if (a.category) return;
      const t = a.sourceType ? String(a.sourceType).toLowerCase().trim() : '';
      a.category = CAT_FROM_SRC[t] || null;
    });

    /* ---- sentiment (aggregate first, else derived per record) ---- */
    const sAgg = raw.sentiment && typeof raw.sentiment === 'object' && !Array.isArray(raw.sentiment) ? raw.sentiment : null;
    if (sAgg) {
      const pos = num(sAgg.positive), neu = num(sAgg.neutral), neg = num(sAgg.negative);
      if (pos != null || neu != null || neg != null) {
        /* real percentages or real counts — a genuine 0 stays 0 */
        out.sentiment = {
          positive: pos, neutral: neu, negative: neg,
          label: sAgg.label != null ? String(sAgg.label) : null,
          fromCount: [pos, neu, neg].filter((v) => v != null).length, derived: false
        };
      } else if (sAgg.label || sAgg.score != null) {
        /* label/score only: never invent a 0/100/0 split. Keep percentages
           null so the UI shows the returned label without fabricated bars. */
        out.sentiment = { positive: null, neutral: null, negative: null, label: sAgg.label != null ? String(sAgg.label) : null, derived: false, fromCount: 1 };
      }
    }
    if (!out.sentiment) {
      const cnt = { positive: 0, neutral: 0, negative: 0 };
      out.articles.forEach((a) => {
        let cls = null;
        if (a.sentimentScore != null) {
          cls = a.sentimentScore > 0.2 ? 'positive' : a.sentimentScore < -0.2 ? 'negative' : 'neutral';
        } else if (a.sentiment != null) {
          const s = String(a.sentiment).toLowerCase().trim();
          if (['positive', 'pos', 'إيجابي', 'إيجابية', '1'].indexOf(s) !== -1) cls = 'positive';
          else if (['negative', 'neg', 'سلبي', 'سلبية', '-1'].indexOf(s) !== -1) cls = 'negative';
          else if (s && s !== '0') cls = 'neutral';
        }
        if (cls) cnt[cls] += 1;
      });
      if (cnt.positive + cnt.neutral + cnt.negative > 0) {
        out.sentiment = { positive: cnt.positive, neutral: cnt.neutral, negative: cnt.negative, label: null, fromCount: cnt.positive + cnt.neutral + cnt.negative, derived: true };
      }
    }
    if (out.sentiment) {
      const s = out.sentiment;
      const hasAny = s.positive != null || s.neutral != null || s.negative != null;
      if (hasAny) {
        const p = Math.max(0, s.positive != null ? s.positive : 0);
        const n = Math.max(0, s.neutral != null ? s.neutral : 0);
        const g = Math.max(0, s.negative != null ? s.negative : 0);
        const tot = p + n + g;
        if (tot > 0) {
          const rawPct = [p / tot * 100, n / tot * 100, g / tot * 100];
          const floors = rawPct.map(Math.floor);
          let rem = 100 - floors[0] - floors[1] - floors[2];
          const order = [0, 1, 2].sort((a, b) => (rawPct[b] - Math.floor(rawPct[b])) - (rawPct[a] - Math.floor(rawPct[a])));
          for (let i = 0; i < rem; i++) floors[order[i % 3]] += 1;
          s.positive = floors[0]; s.neutral = floors[1]; s.negative = floors[2];
        } else {
          s.positive = 0; s.neutral = 0; s.negative = 0;
        }
      }
      if (s.label == null || !String(s.label).trim()) {
        s.label = s.negative > s.positive ? 'negative' : s.positive > s.negative ? 'positive' : 'neutral';
      }
    }

    /* ---- topics (explicit + aggregated keyword frequency) ---- */
    const SEV_MAP = { critical: 'sev-danger', high: 'sev-danger', elevated: 'sev-warn', medium: 'sev-warn', moderate: 'sev-warn', low: 'sev-blue', info: 'sev-blue', stable: 'sev-pos', normal: 'sev-pos', down: 'sev-pos', watch: 'sev-purple' };
    const sevFrom = (v) => {
      if (v == null) return null;
      const s = String(v).toLowerCase().trim();
      return SEV_MAP[s] || v;
    };
    const baseDir = (v) => {
      const s = String(v == null ? '' : v).toLowerCase().trim();
      if (s === 'higher' || s === 'high' || s === 'up' || s === 'rising' || s === 'increase' || s === 'increasing' || s === 'gain') return 'up';
      if (s === 'lower' || s === 'low' || s === 'down' || s === 'falling' || s === 'decrease' || s === 'decreasing' || s === 'drop') return 'down';
      if (s === 'flat' || s === 'stable' || s === 'same' || s === 'even') return 'flat';
      return null;
    };
    const tMap = {};
    (Array.isArray(raw.trendingTopics) ? raw.trendingTopics : []).forEach((t, i) => {
      const label = String(pick(t, ['label', 'name', 'topic', 'title'], '') || '').trim();
      if (!label) return;
      const dir = baseDir(pick(t, ['vsBaseline', 'baseline', 'trend', 'dir', 'up'], null));
      let delta = pick(t, ['delta', 'change'], null);
      if (delta == null && dir) {
        const b = String(pick(t, ['vsBaseline', 'baseline', 'trend'], '') || '').toLowerCase();
        delta = dir === 'up' ? (b === 'rising' ? 'rising' : b === 'high' ? 'high' : 'higher')
          : dir === 'down' ? (b === 'falling' ? 'falling' : b === 'low' ? 'low' : 'lower')
            : 'stable';
      }
      tMap[label] = {
        label: label, count: num(pick(t, ['vol', 'volume', 'count', 'value', 'mentions'], null)),
        cat: normCat(pick(t, ['cat', 'category'], null)), sev: sevFrom(pick(t, ['sev', 'severity', 'level'], null)),
        w: num(pick(t, ['w', 'weight', 'intensity'], null)),
        delta: delta, dir: dir, order: i
      };
    });
    out.articles.forEach((a) => {
      (a.topics || []).forEach((kw) => {
        const k = String(kw).trim();
        if (!k) return;
        if (tMap[k]) { tMap[k].count = tMap[k].count == null ? 1 : tMap[k].count + 1; return; }
        tMap[k] = { label: k, count: 1, cat: normCat(a.category), sev: null, w: null, delta: null, dir: null, order: null };
      });
    });
    out.topics = Object.keys(tMap).map((k) => tMap[k]).sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      const ca = a.count == null ? -1 : a.count, cb = b.count == null ? -1 : b.count;
      return cb - ca;
    });
    {
      const tMax = Math.max(1, out.topics.map((t) => num(t.count) || 0).reduce((a, b) => Math.max(a, b), 0));
      out.topics.forEach((t) => {
        if (t.w == null) t.w = t.count != null ? Math.round((t.count / tMax) * 100) : null;
      });
    }

    /* ---- locations (explicit + aggregated geo references) ----
       The card is "Governorate intelligence" (city-level). Country-level names
       are NOT cities — they set the national flag (for Egypt) or are dropped
       so the UI shows an honest "no city-level data" state instead of listing
       a country as a governorate. */
    const NATIONAL = ['مصر', 'egypt', 'جمهورية مصر العربية', 'arab republic of egypt'];
    const isNational = (n) => NATIONAL.indexOf(String(n).toLowerCase().trim()) !== -1;
    const COUNTRY_NAMES = {
      'usa': 1, 'united states': 1, 'united states of america': 1, 'america': 1, 'الولايات المتحدة': 1, 'أمريكا': 1, 'امريكا': 1,
      'uk': 1, 'united kingdom': 1, 'britain': 1, 'england': 1, 'بريطانيا': 1, 'المملكة المتحدة': 1, 'انجلترا': 1,
      'saudi arabia': 1, 'السعودية': 1, 'المملكة العربية السعودية': 1,
      'uae': 1, 'united arab emirates': 1, 'الإمارات': 1, 'الامارات': 1, 'دبي': 1, 'dubai': 1, 'أبوظبي': 1, 'abu dhabi': 1,
      'qatar': 1, 'قطر': 1, 'kuwait': 1, 'الكويت': 1, 'bahrain': 1, 'البحرين': 1, 'oman': 1, 'عمان': 1,
      'jordan': 1, 'الأردن': 1, 'الاردن': 1, 'iraq': 1, 'العراق': 1, 'syria': 1, 'سوريا': 1, 'lebanon': 1, 'لبنان': 1,
      'palestine': 1, 'فلسطين': 1, 'israel': 1, 'إسرائيل': 1, 'اسرائيل': 1, 'turkey': 1, 'تركيا': 1, 'iran': 1, 'إيران': 1, 'ايران': 1,
      'sudan': 1, 'السودان': 1, 'libya': 1, 'ليبيا': 1, 'tunisia': 1, 'تونس': 1, 'algeria': 1, 'الجزائر': 1, 'morocco': 1, 'المغرب': 1,
      'yemen': 1, 'اليمن': 1, 'china': 1, 'الصين': 1, 'russia': 1, 'روسيا': 1, 'germany': 1, 'ألمانيا': 1, 'المانيا': 1,
      'france': 1, 'فرنسا': 1, 'spain': 1, 'إسبانيا': 1, 'اسبانيا': 1, 'italy': 1, 'إيطاليا': 1, 'ايطاليا': 1,
      'india': 1, 'الهند': 1, 'pakistan': 1, 'باكستان': 1, 'canada': 1, 'كندا': 1, 'australia': 1, 'أستراليا': 1, 'استراليا': 1,
      'brazil': 1, 'البرازيل': 1, 'mexico': 1, 'المكسيك': 1, 'japan': 1, 'اليابان': 1, 'south korea': 1, 'كوريا الجنوبية': 1,
      'greece': 1, 'اليونان': 1, 'cyprus': 1, 'قبرص': 1, 'ukraine': 1, 'أوكرانيا': 1, 'netherlands': 1, 'هولندا': 1,
      'switzerland': 1, 'سويسرا': 1, 'austria': 1, 'النمسا': 1, 'sweden': 1, 'السويد': 1, 'norway': 1, 'النرويج': 1,
      'denmark': 1, 'الدنمارك': 1, 'finland': 1, 'فنلندا': 1, 'poland': 1, 'بولندا': 1, 'romania': 1, 'رومانيا': 1,
      'south africa': 1, 'جنوب أفريقيا': 1, 'جنوب افريقيا': 1, 'nigeria': 1, 'نيجيريا': 1, 'kenya': 1, 'كينيا': 1,
      'ethiopia': 1, 'إثيوبيا': 1, 'argentina': 1, 'الأرجنتين': 1, 'chile': 1, 'تشيلي': 1, 'indonesia': 1, 'إندونيسيا': 1,
      'malaysia': 1, 'ماليزيا': 1, 'singapore': 1, 'سنغافورة': 1, 'thailand': 1, 'تايلاند': 1, 'afghanistan': 1, 'أفغانستان': 1,
      'azerbaijan': 1, 'أذربيجان': 1, 'armenia': 1, 'أرمينيا': 1, 'georgia': 1, 'جورجيا': 1, 'portugal': 1, 'البرتغال': 1,
      'ireland': 1, 'أيرلندا': 1, 'scotland': 1, 'wales': 1, 'belgium': 1, 'بلجيكا': 1
    };
    const isCountry = (n) => !!COUNTRY_NAMES[String(n).toLowerCase().trim()];
    const locSeen = {};
    (Array.isArray(raw.topLocations) ? raw.topLocations : []).forEach((l) => {
      const name = String(pick(l, ['name', 'label', 'city', 'region'], '') || '').trim();
      if (!name) return;
      if (isNational(name)) { out.national = true; return; }
      if (isCountry(name)) return;
      locSeen[name] = {
        name: name, country: 'Egypt', score: num(pick(l, ['score'], null)),
        count: num(pick(l, ['vol', 'volume', 'count', 'mentions'], null)),
        delta: pick(l, ['delta', 'change'], null), up: pick(l, ['up', 'dir'], null),
        vol: pick(l, ['vol', 'volume', '24h'], null), w: num(pick(l, ['w', 'weight'], null))
      };
    });
    out.articles.forEach((a) => {
      const n = a.location ? String(a.location).trim() : '';
      if (!n) return;
      if (isNational(n)) { out.national = true; return; }
      if (isCountry(n)) return;
      if (locSeen[n]) { locSeen[n].count = locSeen[n].count == null ? 0 : locSeen[n].count + 1; return; }
      locSeen[n] = { name: n, country: 'Egypt', score: null, count: 1, delta: null, up: null, vol: null, w: null };
    });
    out.locations = Object.keys(locSeen).map((k) => locSeen[k]).sort((a, b) => (b.count || 0) - (a.count || 0));
    {
      const lMax = Math.max(1, out.locations.map((l) => l.count || 0).reduce((a, b) => Math.max(a, b), 0));
      out.locations.forEach((l) => {
        if (l.score == null) l.score = l.count != null ? l.count : null;
        if (l.w == null) l.w = l.count != null ? Math.round((l.count / lMax) * 100) : null;
        if (l.vol == null && l.count != null) l.vol = l.count;
      });
    }

    /* ---- influencers (explicit data ONLY — news publishers and websites are
       never presented as influencers). A backend entry that is clearly a
       website (domain name) or that is just a source publisher with no real
       social handle/reach is filtered out so the card stays honest. ---- */
    const srcNames = {};
    out.articles.forEach((a) => { if (a.source && !isSrcTypeToken(a.source)) srcNames[String(a.source).toLowerCase().trim()] = 1; });
    const isWebName = (n) => /\.(com|net|org|io|info|co|me|ru|sa|eg|uk|online|site)([.\s]|$)/i.test(String(n || ''));
    const isRealReach = (r) => { const v = parseFloat(r); return v != null && !isNaN(v) && v >= 100; };
    const looksLikeInfluencer = (name, handle, reach) => {
      const n = String(name || '').toLowerCase().trim();
      if (isWebName(n)) return false;
      const h = String(handle || '');
      const r = String(reach || '');
      if (h.indexOf('@') !== -1) return true;
      if (isRealReach(r)) return true;
      /* publisher with no @ handle and only qualitative reach — a source, not an influencer */
      if (srcNames[n] && /^(low|medium|high|small|n\/a|\s*)$/i.test(r)) return false;
      return true;
    };
    const infSeen = {};
    (Array.isArray(raw.topInfluencers) ? raw.topInfluencers : []).forEach((f, i) => {
      const name = String(pick(f, ['name', 'label', 'title', 'handle'], '') || '').trim();
      if (!name) return;
      const handle = pick(f, ['handle', 'cat', 'meta'], null);
      const reach = pick(f, ['reach', 'score', 'value'], null);
      if (!looksLikeInfluencer(name, handle, reach)) return;
      infSeen[name] = {
        name: name, ini: pick(f, ['ini', 'initials'], null), hue: num(pick(f, ['hue', 'h'], null)),
        cat: handle, score: reach, order: i
      };
    });
    out.influencers = Object.keys(infSeen).map((k) => infSeen[k]).sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      return (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0);
    });

    /* ---- AI highlights ---- */
    (Array.isArray(raw.aiHighlights) ? raw.aiHighlights : []).forEach((h) => {
      const title = pick(h, ['title', 'headline', 'name'], null);
      const text = pick(h, ['text', 'summary', 'body', 'detail', 'description'], null) || title;
      if (!text) return;
      out.highlights.push({
        tag: pick(h, ['tag', 'type', 'kind', 'label'], null),
        cls: pick(h, ['cls', 'class', 'severity'], null),
        conf: num(pick(h, ['conf', 'confidence', 'score', 'pct'], null)),
        text: String(text), title: title != null ? String(title) : null,
        time: pick(h, ['time', 't', 'age', 'when', 'timestamp'], null),
        cat: normCat(pick(h, ['cat', 'category'], null)) || null,
        relatedTopic: pick(h, ['relatedTopic', 'topic', 'related'], null) || null,
        sourceUrl: pick(h, ['sourceUrl', 'url', 'source_ref'], null) || null
      });
    });

    /* ---- timeline (explicit signalVolume = HISTORICAL weekly trend index,
       else real timestamps). This is trend strength over time, NOT a live
       post count — it is labelled as such in the UI. ---- */
    if (Array.isArray(raw.signalVolume)) {
      const pts = [];
      raw.signalVolume.forEach((sv) => {
        if (sv && typeof sv === 'object') {
          const v = num(sv.value != null ? sv.value : sv.count);
          if (v == null) return;
          const ts = parseRangeTime(sv.time != null ? sv.time : (sv.period != null ? sv.period : sv.label));
          pts.push({ bucket: ts != null ? ts : pts.length, count: Math.max(0, Math.round(v)) });
        } else {
          const v = num(sv);
          if (v == null) return;
          pts.push({ bucket: pts.length, count: Math.max(0, Math.round(v)) });
        }
      });
      out.timeline = pts.length >= 1 ? pts : null;
    } else {
      out.timeline = deriveTimeline(out.articles);
    }

    /* ---- live timeline (optional): a real current timestamped volume series.
       Kept separate from the historical signalVolume — never conflated. ---- */
    if (Array.isArray(raw.liveVolume) || Array.isArray(raw.liveTimeline)) {
      const lv = Array.isArray(raw.liveVolume) ? raw.liveVolume : raw.liveTimeline;
      const pts = [];
      lv.forEach((sv) => {
        if (sv && typeof sv === 'object') {
          const v = num(sv.value != null ? sv.value : sv.count);
          if (v == null) return;
          const ts = parseRangeTime(sv.time != null ? sv.time : sv.label) || num(sv.ts);
          pts.push({ bucket: ts != null ? ts : pts.length, count: Math.max(0, Math.round(v)) });
        } else {
          const v = num(sv);
          if (v == null) return;
          pts.push({ bucket: pts.length, count: Math.max(0, Math.round(v)) });
        }
      });
      out.liveTimeline = pts.length >= 1 ? pts : null;
    }

    /* ---- structured data points (OPTIONAL): numeric facts extracted by the
       backend from the analyzed sources. Never fabricated here — only shown
       when the backend returns them. ---- */
    (Array.isArray(raw.dataPoints) ? raw.dataPoints : []).forEach((dp) => {
      if (!dp || typeof dp !== 'object') return;
      const value = num(pick(dp, ['value', 'val', 'amount', 'magnitude'], null));
      if (value == null) return;
      const name = String(pick(dp, ['name', 'label', 'title'], '') || '').trim();
      if (!name) return;
      out.dataPoints.push({
        category: pick(dp, ['category', 'cat', 'type', 'kind'], null) || 'general',
        name: name,
        value: value,
        currency: pick(dp, ['currency', 'cur'], null) || null,
        unit: pick(dp, ['unit', 'uom', 'measure'], null) || null,
        source: pick(dp, ['source', 'sourceName', 'origin'], null) || null,
        sourceUrl: pick(dp, ['sourceUrl', 'url', 'href'], null) || null,
        timestamp: pick(dp, ['timestamp', 'ts', 'date', 'observedAt', 'time'], null) || null
      });
    });

    out.sources = deriveSources(out.articles);

    /* ---- deterministic source analytics (from Generate Dashboard Metrics)
       beat the derived feed breakdown whenever the backend computed them. ---- */
    if (out.dashboard && Array.isArray(out.dashboard.sources) && out.dashboard.sources.length) {
      out.sources = out.dashboard.sources
        .map((s) => ({
          label: String(s.source || s.label || s.name || '').trim(),
          count: num(s.count) != null ? Math.max(0, Math.round(num(s.count))) : 0,
          pct: num(s.percentage) != null ? Math.round(num(s.percentage)) : null,
          type: 'news'
        }))
        .filter((s) => s.label)
        .sort((a, b) => b.count - a.count);
    }

    /* ---- media mix: use structured counts when the backend classifies the
       sources; otherwise derive categories from each record's real source
       medium. Percentages always come from actual counts. ---- */
    if (Array.isArray(raw.mediaMix) && raw.mediaMix.length) {
      const mm = {};
      raw.mediaMix.forEach((m) => {
        if (!m || typeof m !== 'object') return;
        const c = pick(m, ['category', 'label', 'name'], null);
        const n = num(pick(m, ['count', 'value', 'n'], null));
        if (c != null && n != null) mm[String(c)] = (mm[String(c)] || 0) + Math.max(0, n);
      });
      const tot = Object.keys(mm).reduce((a, k) => a + mm[k], 0);
      out.mediaMix = Object.keys(mm).map((k) => ({ label: k, count: mm[k], pct: tot ? Math.round((mm[k] / tot) * 100) : 0 })).sort((a, b) => b.count - a.count);
      out.categories = out.mediaMix;
    } else {
      out.categories = deriveCategories(out.articles);
    }
    return out;
  }

  /* Parse a timestamp or a week-range string like "Dec 28, 2025 – Jan 3, 2026"
     (including mangled variants such as "Aug 2?-?8, 2026") into an epoch ms
     value for the range's start date. Returns null when nothing parseable. */
  function parseRangeTime(s) {
    const t = String(s == null ? '' : s).trim();
    if (!t) return null;
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d.getTime();
    const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const nowY = new Date().getFullYear();
    const all = t.match(/([A-Za-z]{3,9})\s+(\d{1,2})/g) || [];
    let best = null;
    all.forEach((m) => {
      const mn = m.match(/([A-Za-z]{3,9})\s+(\d{1,2})/);
      if (!mn) return;
      const mo = MONTHS[mn[1].slice(0, 3).toLowerCase()];
      if (mo == null) return;
      const day = parseInt(mn[2], 10);
      const years = (t.match(/\d{4}/g) || []).map(Number).filter((y) => y >= nowY - 5 && y <= nowY + 2);
      if (!years.length) return;
      const year = years[0];
      const dd = new Date(year, mo, day);
      if (isNaN(dd.getTime())) return;
      if (!best || dd.getTime() < best.getTime()) best = dd;
    });
    return best ? best.getTime() : null;
  }

  /* Timestamp → timeline buckets (hour within a 2-day window, else day). */
  function deriveTimeline(items) {
    const times = (items || []).map((a) => {
      if (!a || !a.publishedAt) return null;
      const d = new Date(a.publishedAt);
      return isNaN(d.getTime()) ? null : d.getTime();
    }).filter((v) => v != null).sort((a, b) => a - b);
    if (times.length < 2) return null;
    const span = times[times.length - 1] - times[0];
    const DAY = 86400000;
    const bucketMs = span <= 2 * DAY ? 3600000 : DAY;
    const map = {};
    times.forEach((t) => { const k = Math.floor(t / bucketMs) * bucketMs; map[k] = (map[k] || 0) + 1; });
    return Object.keys(map).map(Number).sort((a, b) => a - b).map((k) => ({ bucket: k, count: map[k] }));
  }

  /* Source distribution from real records: real publisher names are grouped by
     name (جولد بيليون, Masrawy, …); bare type tokens (news/web/…) map to the fixed
     card labels only when no publisher name exists for a record. Every entry also
     carries a `type` so the filter buttons (News/Social/…) can match sources. */
  function deriveSources(items) {
    const TYPE_LABEL = {
      'news': 'News desks', 'newspaper': 'News desks', 'press': 'News desks', 'agency': 'News desks',
      'web': 'Web', 'website': 'Web',
      'x': 'X (Twitter)', 'twitter': 'X (Twitter)',
      'facebook': 'Facebook', 'fb': 'Facebook',
      'instagram': 'Instagram', 'ig': 'Instagram',
      'rss': 'RSS feeds', 'feed': 'RSS feeds',
      'google': 'Google Trends', 'trends': 'Google Trends',
      'youtube': 'YouTube', 'social': 'Social media',
      'gov': 'Government', 'government': 'Government', 'official': 'Government'
    };
    const TYPE_OF = {
      'news': 'news', 'web': 'news', 'website': 'news', 'article': 'news', 'rss': 'news', 'feed': 'news',
      'google': 'news', 'trends': 'news', 'newspaper': 'news', 'press': 'news', 'media': 'news',
      'x': 'social', 'twitter': 'social', 'facebook': 'social', 'fb': 'social', 'instagram': 'social',
      'ig': 'social', 'youtube': 'social', 'social': 'social', 'tiktok': 'social',
      'gov': 'government', 'government': 'government', 'official': 'government',
      'sport': 'sports', 'sports': 'sports', 'business': 'business', 'economy': 'business', 'finance': 'business'
    };
    const isToken = (v) => {
      if (v == null) return true;
      const s = String(v).toLowerCase().trim();
      return !!TYPE_LABEL[s] || /^(news|web|website|article|social|rss|feed|google|trends|youtube|twitter|facebook|instagram|press|newspaper|gov|government|official|business|economy|sport|x)\b/i.test(s);
    };
    const typeOf = (a) => {
      if (a.category) return a.category;
      const t = a.sourceType ? String(a.sourceType).toLowerCase().trim() : '';
      return TYPE_OF[t] || 'other';
    };
    const map = {};
    (items || []).forEach((a) => {
      const src = a.source ? String(a.source).trim() : '';
      let key = null;
      if (src && !isToken(src)) key = src;
      else {
        const tk = src ? src.toLowerCase() : (a.sourceType ? String(a.sourceType).toLowerCase().trim() : '');
        key = TYPE_LABEL[tk] || null;
      }
      if (!key) return;
      const cur = map[key];
      map[key] = cur ? { count: cur.count + 1, type: cur.type } : { count: 1, type: typeOf(a) };
    });
    const tot = items && items.length ? items.length : 0;
    return Object.keys(map).map((k) => ({ label: k, count: map[k].count, type: map[k].type, pct: tot ? Math.round((map[k].count / tot) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }

  /* Media-mix (category) distribution. Canonical card categories are News,
     Social, Government, Sports, Business — derived from real record categories
     or from the source medium, so `source: "web"` counts as News. */
  function deriveCategories(items) {
    const MIX = {
      news: 'News', web: 'News', website: 'News', article: 'News', rss: 'News', feed: 'News',
      google: 'News', trends: 'News', newspaper: 'News', press: 'News', media: 'News', agency: 'News',
      social: 'Social', x: 'Social', twitter: 'Social', facebook: 'Social', fb: 'Social',
      instagram: 'Social', ig: 'Social', youtube: 'Social', tiktok: 'Social',
      gov: 'Government', government: 'Government', official: 'Government', politics: 'Government',
      sport: 'Sports', sports: 'Sports',
      business: 'Business', economy: 'Business', finance: 'Business',
      tech: 'Technology', technology: 'Technology', science: 'Technology', culture: 'Culture', weather: 'Weather'
    };
    const map = {};
    (items || []).forEach((a) => {
      const c = a.category ? MIX[String(a.category).toLowerCase().trim()] : null;
      if (!c) return;
      map[c] = (map[c] || 0) + 1;
    });
    const tot = items && items.length ? items.length : 0;
    return Object.keys(map).map((k) => ({ label: k, count: map[k], pct: tot ? Math.round((map[k] / tot) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }

  /* ----------------------------------------------------------
     DATA AVAILABILITY HELPERS — shared by every dashboard widget.
     null / undefined / '' / NaN ⇒ unavailable; 0 is a real zero.
     Widgets must never use `value || 0` for metrics because 0 and
     "missing" mean different things. ------------------------- */
  const hasData = (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v));
  const isAvailable = (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v));

  function formatNumber(v, compact) {
    const n = parseFloat(v);
    if (isNaN(n)) return null;
    if (compact) {
      const abs = Math.abs(n);
      if (abs >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (abs >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return String(Math.round(n * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatRelativeTime(v) {
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return String(v == null ? '' : v);
    const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    const A = I18N[lang] || I18N.en || {};
    if (s < 60) return (A['ws.rel.s'] || '{n}s').split('{n}').join(s);
    if (s < 3600) return (A['ws.rel.m'] || '{n}m').split('{n}').join(Math.floor(s / 60));
    if (s < 86400) return (A['ws.rel.h'] || '{n}h').split('{n}').join(Math.floor(s / 3600));
    if (s < 604800) return (A['ws.rel.d'] || '{n}d').split('{n}').join(Math.floor(s / 86400));
    return (A['ws.rel.w'] || '{n}w').split('{n}').join(Math.floor(s / 604800));
  }

  const SRC_TYPE_TOKEN_RE = /^(news|web|website|article|social|x|twitter|facebook|fb|instagram|ig|rss|feed|google|trends|youtube|newspaper|press|media|unknown)$/i;
  const isSrcTypeToken = (v) => {
    if (v == null) return true;
    const s = String(v).toLowerCase().trim();
    return !!SRC_TYPE_TOKEN_RE.test(s) || /^(news|web|article|social|rss|feed|google|trends|youtube|twitter|facebook|instagram|press|newspaper)/i.test(s);
  };

  /* Real display label for a source record: the publisher/domain name
     beats a bare type token like "web" or "news". */
  function getSourceLabel(item) {
    if (!item || typeof item !== 'object') return '';
    const keys = ['source', 'sourceName', 'source_name', 'domain', 'publisher', 'author', 'channel', 'src'];
    for (let i = 0; i < keys.length; i++) {
      const v = item[keys[i]];
      if (v == null) continue;
      const s = String(v).trim();
      if (s && !isSrcTypeToken(s)) return s;
    }
    for (let i = 0; i < keys.length; i++) {
      const v = item[keys[i]];
      if (v == null) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return '';
  }

  /* Egyptian governorates (EN + AR + conservative aliases). Used ONLY to
     label locations that are explicitly present in returned API data. */
  const EGYPT_GOVERNORATES = [
    { en: 'Cairo', ar: 'القاهرة', aliases: ['القاهره', 'caire', 'القاهرة الجديدة', 'new cairo', 'مدينة نصر', 'nasr city', 'شبرا'] },
    { en: 'Giza', ar: 'الجيزة', aliases: ['الجيزه', '6 أكتوبر', '6 october', 'sixth of october', 'الشيخ زايد', 'sheikh zayed'] },
    { en: 'Alexandria', ar: 'الإسكندرية', aliases: ['الاسكندرية', 'alexandria', 'الإسكندرية'] },
    { en: 'Tanta', ar: 'طنطا', aliases: ['tanta'] },
    { en: 'Gharbia', ar: 'الغربية', aliases: ['الغربيه', 'gharbeya', 'المحلة الكبرى', 'el mahalla', 'almahalla'] },
    { en: 'Dakahlia', ar: 'الدقهلية', aliases: ['الدقهليه', 'dakahlia', 'المنصورة', 'mansoura', 'mansura'] },
    { en: 'Menoufia', ar: 'المنوفية', aliases: ['المنوفيه', 'menoufia'] },
    { en: 'Qalyubia', ar: 'القليوبية', aliases: ['القليوبيه', 'qalyubia', 'kalubia', 'بنها', 'benha', 'شبرا الخيمة', 'shubra el kheima'] },
    { en: 'Sharqia', ar: 'الشرقية', aliases: ['الشرقيه', 'sharqia', 'الزقازيق', 'zagazig'] },
    { en: 'Beheira', ar: 'البحيرة', aliases: ['البحيره', 'beheira', 'دمنهور', 'damanhur', 'damanhour'] },
    { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', aliases: ['kafr el sheikh'] },
    { en: 'Damietta', ar: 'دمياط', aliases: ['damietta'] },
    { en: 'Port Said', ar: 'بورسعيد', aliases: ['port said'] },
    { en: 'Suez', ar: 'السويس', aliases: ['suez'] },
    { en: 'Ismailia', ar: 'الإسماعيلية', aliases: ['الاسماعيلية', 'ismailia'] },
    { en: 'Fayoum', ar: 'الفيوم', aliases: ['fayoum', 'fayum'] },
    { en: 'Beni Suef', ar: 'بني سويف', aliases: ['beni suef'] },
    { en: 'Minya', ar: 'المنيا', aliases: ['minya'] },
    { en: 'Assiut', ar: 'أسيوط', aliases: ['اسيوط', 'assiut'] },
    { en: 'Sohag', ar: 'سوهاج', aliases: ['sohag'] },
    { en: 'Qena', ar: 'قنا', aliases: ['qena'] },
    { en: 'Luxor', ar: 'الأقصر', aliases: ['الاقصر', 'luxor'] },
    { en: 'Aswan', ar: 'أسوان', aliases: ['اسوان', 'aswan'] },
    { en: 'Matrouh', ar: 'مطروح', aliases: ['matrouh', 'مرسى مطروح', 'marsa matrouh'] },
    { en: 'Red Sea', ar: 'البحر الأحمر', aliases: ['البحر الاحمر', 'red sea', 'الغردقة', 'hurghada', 'العين السخنة', 'ain sokhna', 'سفاجا', 'safaga'] },
    { en: 'New Valley', ar: 'الوادي الجديد', aliases: ['الوادي الجديد'] },
    { en: 'North Sinai', ar: 'شمال سيناء', aliases: ['north sinai', 'العريش', 'arish'] },
    { en: 'South Sinai', ar: 'جنوب سيناء', aliases: ['جنوب سيناء', 'شرم الشيخ', 'sharm el sheikh', 'sharm'] }
  ];

  /* Report delivery facilities (placeholders for the "send report" action).
     Labels come from i18n via L(key); emails are placeholder destinations. */
  const REPORT_FACILITIES = [
    { key: 'ws.facility.elec', email: 'electricity@facility.eg' },
    { key: 'ws.facility.water', email: 'water@facility.eg' },
    { key: 'ws.facility.gas', email: 'gas@facility.eg' },
    { key: 'ws.facility.complaints', email: 'complaints@facility.eg' },
    { key: 'ws.facility.hospitals', email: 'hospitals@facility.eg' },
    { key: 'ws.facility.emergencies', email: 'emergencies@facility.eg' },
    { key: 'ws.facility.police', email: 'police@facility.eg' },
    { key: 'ws.facility.emergencynumbers', email: 'emergency@facility.eg' }
  ];

  /* normalizeLocation: canonicalize a returned location name to an
     Egyptian governorate, or flag national "Egypt" coverage. Returns null
     for anything that cannot be confirmed. Never fabricates a location. */
  function normalizeLocation(input) {
    if (!input) return null;
    const raw = String(input).trim();
    const key = raw.toLowerCase().replace(/[\s_]+/g, ' ').trim();
    const NATIONAL = { 'مصر': 1, 'egypt': 1, 'جمهورية مصر العربية': 1, 'arab republic of egypt': 1 };
    if (NATIONAL[key]) return { name: 'Egypt', ar: 'مصر', national: true, input: raw };
    for (let i = 0; i < EGYPT_GOVERNORATES.length; i++) {
      const g = EGYPT_GOVERNORATES[i];
      const esc = (s) => s.toLowerCase().replace(/[\s_]+/g, ' ').trim();
      if (key === esc(g.en) || key === g.ar || g.aliases.some((a) => key === esc(a))) {
        return { name: g.en, ar: g.ar, national: false, input: raw };
      }
    }
    return null;
  }

  /* detectGovernorates: scan a text blob for explicit Egyptian governorate
     mentions (word-boundary match, EN + AR). Returns canonical governorates
     only for explicit matches — used for the "detected mentions" label. */
  function detectGovernorates(text) {
    const found = [];
    if (!text) return found;
    const t = String(text);
    const seen = {};
    EGYPT_GOVERNORATES.forEach((g) => {
      const names = [g.en, g.ar].concat(g.aliases);
      let hit = false;
      for (let i = 0; i < names.length && !hit; i++) {
        const n = String(names[i] || '').trim();
        if (!n) continue;
        const escN = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = /[\u0600-\u06FF]/.test(n)
          ? new RegExp('(^|[^\\u0600-\\u06FF\\w])' + escN + '([^\\u0600-\\u06FF\\w]|$)', 'i')
          : new RegExp('(^|[^a-z0-9])' + escN + '([^a-z0-9]|$)', 'i');
        if (re.test(t)) hit = true;
      }
      if (hit && !seen[g.en]) { seen[g.en] = 1; found.push(g); }
    });
    return found;
  }

  /* Generate an AI brief from the ACTUAL normalized analysis — used only when
     n8n does not return a summary field. Every sentence is composed from real
     returned data; empty/missing sections are skipped, and mangled strings
     (literal '?' runs from backend encoding issues) are filtered out. */
  function buildBrief(r, lng) {
    const D = I18N[lng] || I18N.en || {};
    const F = (k) => (D[k] != null ? D[k] : (I18N.en[k] != null ? I18N.en[k] : k));
    const stats = (r && r.stats) || (r && r.raw && r.raw.stats) || {};
    const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    const cleanNames = (arr, get) => (arr || []).map(get).map((s) => String(s == null ? '' : s).trim()).filter((s) => s && !/^[?]+$/.test(s));
    const parts = [];

    const total = num(stats.totalPosts);
    const srcN = Array.isArray(r.articles) ? r.articles.length : 0;
    const active = num(stats.activeTopics);
    if (total != null) {
      parts.push(srcN > 0
        ? F('ws.brief.total').split('{n}').join(total).split('{s}').join(srcN)
        : F('ws.brief.mentions').split('{n}').join(total));
    }
    if (active != null && active > 0) parts.push(F('ws.brief.active').split('{n}').join(active));

    const topics = cleanNames(r.topics, (t) => t.label).slice(0, 3);
    if (topics.length) parts.push(F('ws.brief.topics').split('{t}').join(topics.join(', ')));

    /* concrete numeric facts recovered from the analyzed sources (only when
       the backend actually returned dataPoints — never invented) */
    const dps = Array.isArray(r.dataPoints) ? r.dataPoints.slice(0, 6) : [];
    if (dps.length) {
      const dpTxt = dps.map((p) => {
        const val = String(p.value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const unit = p.unit ? '/' + String(p.unit).trim() : '';
        const cur = p.currency ? String(p.currency).trim() + ' ' : '';
        const base = p.name + ' ' + cur + val + unit;
        return (p.source && String(p.source).trim()) ? String(p.source).trim() + ' — ' + base : base;
      }).join('; ');
      parts.push(F('ws.brief.datapoints').split('{d}').join(dpTxt));
    }

    /* meaningful changes vs baseline — only when topics carry a vsBaseline
       value other than stable/flat */
    const baseL = (r.topics || []).filter((t) => {
      const d = String(t.delta != null ? t.delta : (t.vsBaseline != null ? t.vsBaseline : '')).toLowerCase().trim();
      return !!d && d !== 'stable' && d !== 'flat' && d !== 'same' && d !== 'no change';
    }).slice(0, 3);
    if (baseL.length) {
      const BL = {
        higher: F('ws.brief.bl.higher'), high: F('ws.brief.bl.higher'), up: F('ws.brief.bl.higher'),
        elevated: F('ws.brief.bl.elevated'),
        lower: F('ws.brief.bl.lower'), low: F('ws.brief.bl.lower'), down: F('ws.brief.bl.lower'),
        moderate: F('ws.brief.bl.moderate')
      };
      const words = baseL.map((t) => {
        const raw = String(t.delta != null ? t.delta : t.vsBaseline).toLowerCase().trim();
        return BL[raw] || (t.delta != null ? t.delta : t.vsBaseline);
      });
      parts.push(F('ws.brief.baseline')
        .split('{v}').join(words.join(', '))
        .split('{t}').join(baseL.map((t) => t.label).join(', ')));
    }

    const st = r.sentiment;
    if (st && st.label) {
      const label = String(st.label).toLowerCase();
      const tone = label.indexOf('pos') !== -1 ? F('ws.brief.tone.pos')
        : label.indexOf('neg') !== -1 ? F('ws.brief.tone.neg')
          : label.indexOf('neu') !== -1 ? F('ws.brief.tone.neu') : null;
      parts.push(F('ws.brief.sentiment').split('{l}').join(tone || st.label));
    }

    const crises = num(stats.emergencyAlerts);
    if (crises != null) parts.push(F('ws.brief.crises').split('{n}').join(crises));

    const locs = cleanNames(r.locations, (l) => {
      const n = normalizeLocation(l && l.name);
      return n ? n.name : (l && l.name);
    }).slice(0, 3);
    if (locs.length) parts.push(F('ws.brief.locations').split('{l}').join(locs.join(', ')));

    const srcs = cleanNames(r.sources, (s) => s.label).slice(0, 3);
    if (srcs.length) parts.push(F('ws.brief.sources').split('{l}').join(srcs.join(', ')));

    const infN = Array.isArray(r.influencers) ? r.influencers.length : 0;
    if (infN > 0) parts.push(F('ws.brief.influencers').split('{n}').join(infN));

    const hlN = Array.isArray(r.highlights) ? r.highlights.length : 0;
    if (hlN > 0) parts.push(F('ws.brief.highlights').split('{n}').join(hlN));

    /* sparse dataset — say so explicitly instead of implying full coverage */
    if (total != null && total < 10) parts.push(F('ws.brief.sparse'));

    return parts;
  }

  /* ----------------------------------------------------------
     FACEBOOK / META OAUTH — real connection state.
     - localStorage `nabd-fb` keeps ONLY identity { connected,
       accountName, connectedAt } — never a token.
     - sessionStorage `nabd-meta` keeps the session access token +
       page ids (cleared on disconnect / when the tab closes).
     - The OAuth exchange happens server-side on Vercel
       (/api/meta?action=start, /api/meta/callback, /api/meta?action=revoke);
       the Meta App Secret never reaches the browser.
     ---------------------------------------------------------- */
  const fb = {
    key: 'nabd-fb',
    metaKey: 'nabd-meta',
    oauthStateKey: 'nabd-oauth-state',
    read() {
      let meta = null;
      try { const m = sessionStorage.getItem(this.metaKey); meta = m ? JSON.parse(m) : null; } catch (e) {}
      let raw = null;
      try { raw = localStorage.getItem(this.key); } catch (e) {}
      let st = { connected: false, accountName: '', connectedAt: 0 };
      if (raw) {
        try {
          const o = JSON.parse(raw);
          if (o && typeof o === 'object') {
            st = {
              connected: !!o.connected,
              accountName: String(o.accountName || ''),
              connectedAt: Number(o.connectedAt || 0)
            };
          }
        } catch (e) { st = { connected: raw === 'connected', accountName: '', connectedAt: 0 }; }
      }
      if (meta && meta.accessToken) {
        st.connected = true;
        if (meta.accountName) st.accountName = meta.accountName;
        st.accessToken = meta.accessToken;
        st.accountId = meta.accountId || meta.pageId || '';
        st.igUserId = meta.igUserId || '';
      } else if (st.connected) {
        /* legacy credentials (pre-OAuth builds) — keep working until the
           user reconnects through the real flow */
        try {
          const o = JSON.parse(raw);
          if (o.facebookAccessToken) st.accessToken = o.facebookAccessToken;
          if (o.facebookPageId) st.accountId = o.facebookPageId;
          if (o.instagramBusinessId) st.igUserId = o.instagramBusinessId;
        } catch (e) {}
      }
      return st;
    },
    write(state) {
      /* never persist access tokens in localStorage */
      const safe = { connected: !!state.connected, accountName: String(state.accountName || ''), connectedAt: Number(state.connectedAt || 0) };
      try { localStorage.setItem(this.key, JSON.stringify(safe)); } catch (e) {}
    },
    toastKey(key) {
      try { document.dispatchEvent(new CustomEvent('nabd-toast', { detail: { key: key } })); } catch (e) {}
    },
    connect() {
      if (this.read().connected) return;
      const stateId = String(Math.random().toString(36).slice(2)) + String(Date.now().toString(36));
      try { sessionStorage.setItem(this.oauthStateKey, stateId); } catch (e) {}
      loadApiConfig()
        .then((cfg) => fetch('/api/meta?action=start&state=' + encodeURIComponent(stateId), { headers: { Accept: 'application/json' } }))
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (!data || !data.url) {
            if (data && data.error === 'META_NOT_CONFIGURED') throw new Error('META_NOT_CONFIGURED');
            throw new Error('META_START_FAILED');
          }
          const w = 640, h = 780;
          const left = Math.max(0, Math.round((window.screen.width - w) / 2));
          const top = Math.max(0, Math.round((window.screen.height - h) / 3));
          const popup = window.open(data.url, 'nabd-meta-oauth', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',popup=1');
          if (!popup) { this.toastKey('db.meta.popup'); return; }
          let handled = false;
          const onMsg = (ev) => {
            if (!ev || ev.origin !== location.origin) return;
            const d = ev.data;
            if (!d || d.type !== 'nabd-meta-result') return;
            handled = true;
            window.removeEventListener('message', onMsg);
            if (d.error) { this.toastKey('db.meta.error'); this.emit({ connected: false, accountName: '', connectedAt: 0 }); return; }
            const meta = {
              accessToken: String(d.accessToken || ''),
              userToken: d.userToken ? String(d.userToken) : '',
              accountId: String(d.accountId || ''),
              pageId: String(d.accountId || ''),
              igUserId: d.igUserId ? String(d.igUserId) : '',
              accountName: String(d.accountName || ''),
              expiresAt: Number(d.expiresAt || 0)
            };
            if (!meta.accessToken || !meta.accountId) { this.toastKey('db.meta.error'); return; }
            try { sessionStorage.setItem(this.metaKey, JSON.stringify(meta)); } catch (e) {}
            const st = { connected: true, accountName: meta.accountName, connectedAt: Date.now() };
            this.write(st);
            notifAdd({ title: 'notif.fb.t', sub: 'notif.fb.s', params: { p: meta.accountName || '' }, cat: 'conn', ts: Date.now() });
            this.emit(st);
            this.toastKey('db.meta.connected');
          };
          window.addEventListener('message', onMsg);
          const poll = setInterval(() => {
            try {
              if (popup.closed) {
                clearInterval(poll);
                window.removeEventListener('message', onMsg);
                if (!handled) {
                  /* popup closed with no result — keep state honest */
                  const cur = this.read();
                  if (!cur.connected) this.emit({ connected: false, accountName: '', connectedAt: 0 });
                }
              }
            } catch (e) {}
          }, 800);
          return null;
        })
        .catch((err) => {
          if (err && err.message === 'META_NOT_CONFIGURED') { this.toastKey('db.meta.notconfigured'); return; }
          this.toastKey('db.meta.startfail');
        });
    },
    disconnect() {
      let meta = null;
      try { const m = sessionStorage.getItem(this.metaKey); meta = m ? JSON.parse(m) : null; } catch (e) {}
      try { sessionStorage.removeItem(this.metaKey); } catch (e) {}
      try { sessionStorage.removeItem(this.oauthStateKey); } catch (e) {}
      const state = { connected: false, accountName: '', connectedAt: 0 };
      this.write(state);
      this.emit(state);
      if (meta && meta.accessToken) {
        /* best-effort server-side token revocation — never blocks the UI.
           Revoke the user token when we have it (page tokens cannot be
           revoked through /me/permissions). */
        try {
          fetch('/api/meta?action=revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: meta.userToken || meta.accessToken })
          }).catch(() => {});
        } catch (e) {}
      }
      return state;
    },
    emit(state) {
      try { document.dispatchEvent(new CustomEvent('nabd-fb-change', { detail: state })); } catch (e) {}
      try { localStorage.setItem('nabd-last-fb', state.connected ? state.accountName : ''); } catch (e) {}
    }
  };

  /* ----------------------------------------------------------
     LIGHTWEIGHT CONFIRM DIALOG (Promise<boolean>)
     ---------------------------------------------------------- */
  function confirmDialog(cfg) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'c-modal';
      const d = I18N[lang] || I18N.en || {};
      const title = cfg.title || '';
      const text = cfg.text || '';
      const okLabel = cfg.okLabel || d['db.fb.conf.ok'] || 'OK';
      const cancelLabel = cfg.cancelLabel || d['db.fb.conf.cancel'] || 'Cancel';
      wrap.innerHTML =
        '<div class="c-modal-mask"></div>'
        + '<div class="c-modal-card" role="dialog" aria-modal="true">'
        + '<div class="c-modal-t"></div>'
        + '<div class="c-modal-s"></div>'
        + '<div class="c-modal-actions">'
        + '<button type="button" class="btn btn-ghost btn-sm" data-c="cancel"></button>'
        + '<button type="button" class="btn btn-primary btn-sm" data-c="ok"></button>'
        + '</div></div>';
      const tEl = wrap.querySelector('.c-modal-t');
      const sEl = wrap.querySelector('.c-modal-s');
      const oEl = wrap.querySelector('[data-c="ok"]');
      const cEl = wrap.querySelector('[data-c="cancel"]');
      tEl.textContent = title;
      sEl.textContent = text;
      oEl.textContent = okLabel;
      cEl.textContent = cancelLabel;
      const done = (val) => {
        try { document.removeEventListener('keydown', onKey); } catch (e) {}
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        resolve(val);
      };
      const onKey = (e) => { if (e.key === 'Escape') done(false); };
      wrap.querySelector('.c-modal-mask').addEventListener('click', () => done(false));
      oEl.addEventListener('click', () => done(true));
      cEl.addEventListener('click', () => done(false));
      document.addEventListener('keydown', onKey);
      document.body.appendChild(wrap);
      oEl.focus();
    });
  }

  /* ----------------------------------------------------------
     FOOTER YEAR + INIT
     ---------------------------------------------------------- */
  const year = $('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* gentle content fade-in for the current page (reduced motion is skipped) */
  if (!reduceMotion) {
    const fadeTarget = pageFadeTarget();
    if (fadeTarget) fadeTarget.classList.add('page-enter');
  }

  applyLang(lang);
  setFbState(fb.read().connected ? 'connected' : 'idle');

  /* ----------------------------------------------------------
     PUBLIC API for page scripts
     ---------------------------------------------------------- */
  window.NABD = {
    get lang() { return lang; },
    t,
    I18N,
    QUERIES,
    rand,
    cssVar,
    accentRGB,
    gridRGB,
    labelRGB,
    navigate,
    normalizeAnalysisResponse,
    extractAnalysisPayload,
    looksLikeJson,
    buildBrief,
    hasData,
    isAvailable,
    formatNumber,
    formatRelativeTime,
    getSourceLabel,
    normalizeLocation,
    detectGovernorates,
    governorates: EGYPT_GOVERNORATES,
    facilities: REPORT_FACILITIES,
    toast,
    applyTheme,
    getUser,
    persistUser,
    clearUser,
    api,
    authMe,
    logout,
    historyGet,
    historyAdd,
    historyRemove,
    notifGet,
    notifAdd,
    fmt,
    activityGet,
    activityAdd,
    alertsGet,
    alertsAdd,
    alertsRemove,
    alertsDue,
    checkAlerts,
    favGet,
    favHas,
    favAdd,
    favRemove,
    avatarGet,
    avatarSet,
    dlCount,
    recordDownload,
    buildDonut,
    analyze,
    fb,
    confirmDialog,
    drawLineChart,
    smoothPathD,
    viewObserver,
    applyLang
  };
})();
