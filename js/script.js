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
      'nav.home': 'Home', 'nav.analysis': 'Analysis', 'nav.technology': 'Technology',
      'nav.usecases': 'Use Cases', 'nav.docs': 'Documentation', 'nav.about': 'About',
      'nav.signin': 'Sign In', 'nav.getstarted': 'Get Started',
      'hero.eyebrow': 'AI TREND INTELLIGENCE',
      'hero.h1': 'Understand <span class="grad">Egypt</span> before it reacts.',
      'hero.sub': 'NABD (نبض) is Egypt\'s AI intelligence platform — monitoring news, public opinion, social media and crises across every governorate in real time, with global coverage when you need it.',
      'hero.cta1': 'Explore the intelligence', 'hero.cta2': 'How it works',
      'hero.trust': '5 crises detected today · 27 governorates · 40+ languages',
      'pv.trends': 'CURRENT EGYPTIAN TRENDS', 'pv.sentiment': 'Egypt sentiment',
      'pv.positive': 'positive', 'pv.timeline': 'EGYPT · 24H VOLUME',
      'pv.shift': 'Sentiment shift', 'pv.skyline': 'CAIRO · LIVE MONITORING',
      'search.ph': 'Ask NABD about Egypt…', 'search.btn': 'Analyze',
      'search.note': 'Live intelligence engine — results open inside your NABD app',
      'q.cairo': 'Cairo today', 'q.inflation': 'Inflation talks', 'q.pound': 'Egyptian Pound',
      'q.suez': 'Suez Canal', 'q.education': 'Education sentiment', 'q.football': 'Football pulse',
      'q.capital': 'New Capital',
      'stat.1': 'Egyptian signals daily', 'stat.2': 'governorates monitored',
      'stat.3': 'median crisis detection', 'stat.4': 'signal classification accuracy',
      'why.eyebrow': 'WHY NABD',
      'why.title': 'Intelligence that <span class="grad">never sleeps</span>',
      'why.sub': 'Five capabilities, one command center — built for Egypt\'s most demanding teams.',
      'why.c1.t': 'Real-time monitoring',
      'why.c1.b': '1.4M+ Egyptian signals per day across national news, social media, RSS and search trends — aggregated, deduplicated and timestamped in seconds.',
      'why.c1.s': '1.4M+ <i>signals / day</i>',
      'why.c2.t': 'AI analysis',
      'why.c2.b': 'LLM-grade reasoning on ultra-fast inference. Every Egyptian trend is classified, summarized and explained in plain Arabic or English.',
      'why.c2.s': '98.7% <i>accuracy</i>',
      'why.c3.t': 'Crisis detection',
      'why.c3.b': 'Early-warning models flag breaking events, escalation curves and misinformation risk across the republic — median alert time: 3 minutes.',
      'why.c3.s': '3 min <i>median alert</i>',
      'why.c4.t': 'Governorate coverage',
      'why.c4.b': '27 governorates with regional nuance that generic aggregators miss — Cairo, Alexandria, the Delta, Sinai, Upper Egypt and beyond.',
      'why.c4.s': '27 <i>governorates</i>',
      'why.c5.t': 'Social intelligence',
      'why.c5.b': 'Facebook pages, X, Instagram, RSS and Google Trends fused into one sentiment layer — with influencer mapping and spread tracking.',
      'why.c5.s': '7 <i>source types</i>',
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
      'tech.eyebrow': 'TECHNOLOGY',
      'tech.title': 'From raw noise to <span class="grad">decision-ready truth</span>',
      'tech.sub': 'Egyptian sources, global scale — three processing layers, one intelligence core.',
      'tech.stage1': '01 · INGEST', 'tech.stage2': '02 · PROCESS', 'tech.stage3': '03 · ACT',
      'tech.trends': 'Egypt + global', 'tech.news': 'Egyptian + international',
      'tech.llm': 'AR + EN classification', 'tech.groq': 'ultra-fast inference', 'tech.n8n': 'workflow automation',
      'tech.core': 'NABD CORE', 'tech.core.sub': 'fusion · ranking · narrative',
      'tech.out1': 'Analysis workspace', 'tech.out1.sub': 'live dashboards',
      'tech.b1.t': 'Fast by design', 'tech.b1.b': 'Groq-powered inference at 1,000+ tokens/sec — summaries in under a second.',
      'tech.b2.t': 'Private by default', 'tech.b2.b': 'Encrypted pipeline, no resale of your signals, Egypt data residency available.',
      'tech.b3.t': 'Composable', 'tech.b3.b': 'Every layer is exposed — connect n8n, webhooks, or the raw API.',
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
      'tm.eyebrow': 'TESTIMONIALS',
      'tm.title': 'Trusted by teams that <span class="grad">move fast</span>',
      'tm.q1.b': 'NABD flagged a misinformation wave three hours before it reached our coverage. That\'s the difference between reacting and leading.',
      'tm.q1.n': 'Sherif Hassan', 'tm.q1.r': 'Editor-in-Chief, Al-Masry Media Group',
      'tm.q2.b': 'We track fourteen Egyptian markets on one screen — and the briefings are better than our morning meetings.',
      'tm.q2.n': 'Amira Nabil', 'tm.q2.r': 'VP Strategy, Delta Digital Group',
      'tm.q3.b': 'Crisis-detection latency is the real story. We redeploy field teams on NABD alerts now — not on headlines.',
      'tm.q3.n': 'Tarek Mostafa', 'tm.q3.r': 'Director of Operations, Aoun Relief',
      'cta.eyebrow': 'GET STARTED',
      'cta.title': 'Start understanding<br>Egypt\'s <span class="grad">pulse</span>.',
      'cta.sub': 'Join intelligence teams across Egypt and 30+ countries watching the world in real time.',
      'cta.btn1': 'Launch NABD', 'cta.btn2': 'Talk to us',
      'cta.note': 'Free 14-day trial · No credit card · Setup in 5 minutes',
      'footer.tagline': 'AI trend intelligence for a country that never stops moving.',
      'footer.c1': 'Product', 'footer.l11': 'Live analysis', 'footer.l12': 'Features',
      'footer.l13': 'Pricing', 'footer.l14': 'Technology',
      'footer.c2': 'Company', 'footer.l21': 'About', 'footer.l22': 'Customers',
      'footer.l23': 'Use cases', 'footer.l24': 'Contact',
      'footer.c3': 'Resources', 'footer.l31': 'Documentation', 'footer.l32': 'API reference',
      'footer.l33': 'Status', 'footer.l34': 'Blog',
      'footer.c4': 'Legal', 'footer.l41': 'Privacy', 'footer.l42': 'Terms',
      'footer.l43': 'Security', 'footer.l44': 'DPA',
      'footer.copyright': 'NABD (نبض) Intelligence Systems', 'footer.status': 'All systems operational',

      /* workspace */
      'ws.back': 'Home', 'ws.new': 'New analysis', 'ws.querylabel': 'TRACKING', 'ws.private.badge': 'Private Analysis',
      'ws.brief': 'AI BRIEF', 'ws.meta1': '14 sources', 'ws.meta2': 'updated 2m ago', 'ws.meta3': 'confidence 94%',
      'ws.brieftitle': 'Egypt — live brief',
      'ws.sum1': 'Egypt\'s conversation is moving on three fronts today. <strong>Economy</strong> dominates: Egyptian Pound discussions are up sharply, inflation expectations are the top topic in Cairo, and Suez Canal traffic numbers are drawing international attention.',
      'ws.sum2': 'In <strong>politics and society</strong>, the New Administrative Capital is trending with strong positive sentiment, while education reform debates are active across the Delta and Upper Egypt. Misinformation risk is elevated around currency rumors — two clusters flagged for review.',
      'ws.sum3': '<strong>Recommended watchlist:</strong> inflation data release, Suez Canal announcements, and the El Clasico build-up across Alexandria and Cairo.',
      'ws.briefchip1': 'Economy', 'ws.briefchip2': 'Politics', 'ws.briefchip3': 'Sports', 'ws.briefchip4': 'Cairo',
      'ws.kpi1': 'TOTAL MENTIONS', 'ws.kpi2': 'OVERALL SENTIMENT', 'ws.kpi3': 'ACTIVE CRISES', 'ws.kpi4': 'INFLATION TALKS',
      'ws.gov.t': 'Governorate intelligence', 'ws.gov.s': 'TREND INTENSITY BY REGION',
      'ws.loc.cairo': 'Cairo', 'ws.loc.capital': 'New Capital', 'ws.loc.ale': 'Alexandria',
      'ws.loc.giza': 'Giza', 'ws.loc.suez': 'Suez Canal', 'ws.loc.upper': 'Upper Egypt',
      'ws.loc.ps': 'Port Said', 'ws.loc.mans': 'Mansoura', 'ws.loc.tanta': 'Tanta', 'ws.loc.aswan': 'Aswan',
      'ws.global.t': 'Global context', 'ws.global.s': 'WORLD SIGNALS · EGYPT WATCH',
      'ws.global.r1': 'Global recession watch', 'ws.global.r2': 'Gaza ceasefire talks',
      'ws.global.r3': 'Energy markets', 'ws.global.r4': 'Gulf investment flows',
      'ws.global.r5': 'Global tourism recovery', 'ws.global.r6': 'BRICS coordination',
      'ws.topics.t': 'Trending topics', 'ws.topics.s': 'BY SEVERITY · EGYPT',
      'ws.topics.t1': 'Egyptian Pound', 'ws.topics.t2': 'Suez Canal', 'ws.topics.t3': 'New Capital',
      'ws.topics.t4': 'Inflation', 'ws.topics.t5': 'El Clasico', 'ws.topics.t6': 'Tourism',
      'ws.topics.t7': 'Education', 'ws.topics.t8': 'Election law debate',
      'ws.timeline.t': 'Live trend timeline', 'ws.timeline.s': 'EGYPT CONVERSATION VOLUME · 24H',
      'ws.tab.day': '24H', 'ws.tab.week': '7D', 'ws.tab.month': '30D',
      'ws.donut.t': 'Sentiment split', 'ws.donut.s': 'EGYPT · LAST 24 HOURS',
      'ws.donut.pos': 'Positive', 'ws.donut.neu': 'Neutral', 'ws.donut.neg': 'Negative',
      'ws.nodata': 'No data available',
      'ws.sent.na': 'Sentiment data unavailable',
      'ws.timeline.na': 'Not enough timestamped signals for a timeline',
      'ws.loc.na': 'Not enough location data for this query.',
      'ws.national.t': 'National coverage',
      'ws.national.s': 'Egypt-wide signal',
      'ws.inf.na': 'No identifiable influencers in this analysis',
      'ws.hl.na': 'No AI highlights generated for this query.',
      'ws.src.na': 'No source distribution available for this query.',
      'ws.mix.na': 'No category mix available for this query.',
      'ws.global.na': 'No global context available for this query.',
      'ws.net.na': 'Network relationships unavailable for this analysis.',
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
      'ws.feed.t': 'Live feed', 'ws.feed.s': 'NEWS · SOCIAL · RSS',
      'ws.feed.i1': 'Finance minister to discuss subsidy reforms in economic council session',
      'ws.feed.i2': 'Egyptian Pound jumps on record investment inflows',
      'ws.feed.i3': 'Suez Canal authority reports record quarterly transit numbers',
      'ws.feed.i4': 'Wide discussion on staple prices in governorate groups',
      'ws.feed.i5': 'New Capital events draw interest as openings announced',
      'ws.feed.i6': 'Weather: fog warnings on desert roads for the morning',
      'ws.feed.i7': 'Analysts split on winter tourism outlook',
      'ws.feed.i8': 'Community beach-cleanup initiatives grow in Alexandria',
      'ws.feed.i9': 'EGX closes higher on foreign buying',
      'ws.hl.t': 'AI highlights', 'ws.hl.s': 'GENERATED THIS CYCLE',
      'ws.hl.t1': 'BREAKING EVENT', 'ws.hl.t2': 'EMERGING PATTERN', 'ws.hl.t3': 'MISINFORMATION RISK',
      'ws.hl.t4': 'OPPORTUNITY', 'ws.hl.t5': 'PUBLIC REACTION',
      'ws.hl.b1': 'Suez Canal transit figures released — volumes beat expectations.',
      'ws.hl.b2': 'Pound-related discussions up 43% across Cairo within 3 hours.',
      'ws.hl.b3': 'Currency devaluation rumors lack primary sources; reach accelerating.',
      'ws.hl.b4': 'New Capital property interest rising among Gulf investors.',
      'ws.hl.b5': 'Education reform debate polarized — strong support in Upper Egypt.',
      'ws.hl.time1': '12m ago', 'ws.hl.time2': '8m ago', 'ws.hl.time3': '6m ago', 'ws.hl.time4': '4m ago', 'ws.hl.time5': '2m ago',
      'ws.inf.t': 'Influencers', 'ws.inf.s': 'TOP VOICES THIS HOUR',
      'ws.inf.n1': 'Masr Today', 'ws.inf.n2': 'Cairo Pulse', 'ws.inf.n3': 'Dr. Ahmed Hassan',
      'ws.inf.n4': 'Nour Media', 'ws.inf.n5': 'Omnia Tarek',
      'ws.src.t': 'Sources', 'ws.src.s': 'SIGNAL SHARE · 24H',
      'ws.src.r1': 'News desks', 'ws.src.r2': 'X (Twitter)', 'ws.src.r3': 'Facebook',
      'ws.src.r4': 'RSS feeds', 'ws.src.r5': 'Instagram', 'ws.src.r6': 'Google Trends',
      'ws.net.t': 'Network graph', 'ws.net.s': 'TOPICS · INSTITUTIONS · VOICES',
      'ws.mix.t': 'Media mix', 'ws.mix.s': 'SIGNAL SHARE BY CATEGORY',
      'ws.mix.r1': 'Economy', 'ws.mix.r2': 'Politics', 'ws.mix.r3': 'Sports',
      'ws.mix.r4': 'Culture', 'ws.mix.r5': 'Tech', 'ws.mix.r6': 'Weather',
      'ws.foot': 'LIVE INTELLIGENCE · REFRESHED EVERY 60 SECONDS · 14 SOURCE TYPES',
      'ws.toast.new': 'New analysis ready — workspace refreshed',
      'ws.toast.query': 'Tracking updated to: <b>{q}</b>',

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
      'auth.first': 'First name', 'auth.last': 'Last name', 'auth.org': 'Organization',
      'auth.remember': 'Remember me', 'auth.forgot': 'Forgot password?',
      'auth.submit': 'Sign In', 'auth.signup.submit': 'Create account',
      'auth.alt': 'or continue with', 'auth.google': 'Google', 'auth.facebook': 'Facebook',
      'auth.signup.switch': 'Don\'t have an account? <a class="link-soft" href="signup.html" data-page="signup.html">Sign up</a>',
      'auth.signin.switch': 'Already have an account? <a class="link-soft" href="signin.html" data-page="signin.html">Sign in</a>',
      'auth.back': 'Back to home', 'auth.country': 'Country', 'auth.lang': 'Language',
      'auth.terms': 'I agree to the Terms & Privacy Policy',
      'auth.art1.t': 'Your intelligence command center',
      'auth.art1.b': 'Trends, sentiment, crises and live feeds across every Egyptian governorate — in one live workspace.',
      'auth.art2.t': 'Your intelligence command center',
      'auth.art2.b': 'Trends, sentiment, crises and live feeds across every Egyptian governorate — in one live workspace.',
      'auth.err.email': 'Please enter a valid email address.',
      'auth.err.pass': 'Password must be at least 8 characters.',
      'auth.err.req': 'Please fill in all required fields.',
      'auth.err.match': 'Passwords do not match.',
      'auth.err.terms': 'Please accept the terms to continue.',
      'auth.pending': 'Please wait…',
      'auth.ok.signin': 'Welcome back — launching app…',
      'auth.ok.signup': 'Account created — launching workspace…',
      'auth.social': 'Demo mode — social sign-in mocked.',
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
      'app.sub.profile': 'Your identity, subscription and usage at a glance.',
      'app.sub.settings': 'Account, appearance, security and everything in between.',
      'app.sub.connections': 'Fuse your sources into one intelligence layer.',
      'app.sub.api': 'Programmatic access for advanced teams.',
      'app.sub.notifications': 'Alerts and updates across the platform.',
      'app.sub.favorites': 'Everything you bookmarked in one place.',
      'app.sub.searches': 'Your saved queries, organized in folders.',
      'app.crumb.app': 'App',
      'app.st.done': 'Completed', 'app.st.running': 'Running', 'app.st.failed': 'Failed',
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

      /* dashboard */
      'dash.qa': 'Quick actions',
      'dash.qa.new': 'New analysis', 'dash.qa.saved': 'Run saved search',
      'dash.qa.export': 'Export report', 'dash.qa.alert': 'Create alert',
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

      /* profile */
      'prof.about': 'About',
      'prof.name': 'Name', 'prof.role': 'Role', 'prof.org': 'Organization',
      'prof.country': 'Country', 'prof.lang': 'Language', 'prof.email': 'Email',
      'prof.joined': 'Joined', 'prof.sub': 'Subscription',
      'prof.plan': 'Intelligence Pro', 'prof.renew': 'Renews in 12 days',
      'prof.usage': 'Usage this month',
      'prof.u1': 'Analyses', 'prof.u2': 'Alerts', 'prof.u3': 'Exports', 'prof.u4': 'Searches',
      'prof.cats': 'Favorite categories',
      'prof.activity': 'Recent activity',
      'prof.role.v': 'Senior Analyst', 'prof.org.v': 'Delta Digital Group',
      'prof.edit': 'Edit profile',

      /* settings */
      'set.general': 'General', 'set.appearance': 'Appearance', 'set.lang': 'Language',
      'set.notif': 'Notifications', 'set.privacy': 'Privacy', 'set.security': 'Security',
      'set.shortcuts': 'Shortcuts', 'set.experimental': 'Experimental features',
      'set.danger': 'Danger zone',
      'set.g.name': 'Full name', 'set.g.org': 'Organization', 'set.g.email': 'Email',
      'set.g.save': 'Save changes',
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

      /* favorites */
      'fav.t.reports': 'Reports', 'fav.t.searches': 'Searches',
      'fav.t.dashboards': 'Dashboards', 'fav.t.topics': 'Topics',
      'fav.r1': 'Weekly Egypt Brief', 'fav.r2': 'Inflation Risk Watch', 'fav.r3': 'Social Pulse Report',
      'fav.s1': 'Egyptian Pound', 'fav.s2': 'Suez Canal', 'fav.s3': 'New Capital',
      'fav.d1': 'Governorate overview', 'fav.d2': 'Crisis command board', 'fav.d3': 'Social pulse',
      'fav.t1': 'Economy', 'fav.t2': 'Suez Canal', 'fav.t3': 'Education',

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
      'nav.home': 'الرئيسية', 'nav.analysis': 'التحليل', 'nav.technology': 'التقنية',
      'nav.usecases': 'حالات الاستخدام', 'nav.docs': 'التوثيق', 'nav.about': 'من نحن',
      'nav.signin': 'تسجيل الدخول', 'nav.getstarted': 'ابدأ الآن',
      'hero.eyebrow': 'ذكاء الترندات الاصطناعي',
      'hero.h1': 'افهم <span class="grad">مصر</span> قبل أن تتفاعل.',
      'hero.sub': 'نبض هو منصة الذكاء الاصطناعي المصرية — ترصد الأخبار والرأي العام ومواقع التواصل الاجتماعي والأزمات في كل المحافظات لحظة بلحظة، مع تغطية عالمية عند الحاجة.',
      'hero.cta1': 'استكشف الذكاء', 'hero.cta2': 'كيف يعمل',
      'hero.trust': '5 أزمات رُصدت اليوم · 27 محافظة · 40+ لغة',
      'pv.trends': 'ترندات مصر الحالية', 'pv.sentiment': 'مشاعر مصر',
      'pv.positive': 'إيجابي', 'pv.timeline': 'مصر · 24 ساعة',
      'pv.shift': 'تحول في المشاعر', 'pv.skyline': 'القاهرة · مراقبة حية',
      'search.ph': 'اسأل نبض عن مصر…', 'search.btn': 'حلّل',
      'search.note': 'محرك ذكاء حيّ — تظهر النتائج داخل تطبيق نبض',
      'q.cairo': 'القاهرة اليوم', 'q.inflation': 'نقاشات التضخم', 'q.pound': 'الجنيه المصري',
      'q.suez': 'قناة السويس', 'q.education': 'مشاعر التعليم', 'q.football': 'نبض الكرة',
      'q.capital': 'العاصمة الجديدة',
      'stat.1': 'إشارة مصرية يوميًا', 'stat.2': 'محافظة تحت المراقبة',
      'stat.3': 'متوسط رصد الأزمات', 'stat.4': 'دقة تصنيف الإشارات',
      'why.eyebrow': 'لماذا نبض',
      'why.title': 'ذكاء <span class="grad">لا ينام</span>',
      'why.sub': 'خمس قدرات في مركز قيادة واحد — صُنع لأكثر فرق مصر إلحاحًا.',
      'why.c1.t': 'مراقبة فورية',
      'why.c1.b': 'أكثر من 1.4 مليون إشارة مصرية يوميًا من الأخبار الوطنية ومواقع التواصل وRSS والبحث — مجمّعة ومُدقّقة ومختومة بالوقت في ثوانٍ.',
      'why.c1.s': '1.4M+ <i>إشارة / يوم</i>',
      'why.c2.t': 'تحليل بالذكاء الاصطناعي',
      'why.c2.b': 'نماذج لغوية عالية الدقة على استدلال فائق السرعة. كل ترند مصري يُصنَّف ويُلخَّص ويُشرَح بالعربية أو الإنجليزية.',
      'why.c2.s': '98.7% <i>دقة</i>',
      'why.c3.t': 'رصد الأزمات',
      'why.c3.b': 'نماذج إنذار مبكر تلتقط الأحداث العاجلة ومنحنيات التصعيد ومخاطر التضليل في كل الجمهورية — متوسط وقت التنبيه: 3 دقائق.',
      'why.c3.s': '3 دقائق <i>متوسط التنبيه</i>',
      'why.c4.t': 'تغطية المحافظات',
      'why.c4.b': '27 محافظة بدقة إقليمية لا تصل إليها أدوات التجميع العامة — القاهرة والإسكندرية والدلتا وسيناء والصعيد وما بعدها.',
      'why.c4.s': '27 <i>محافظة</i>',
      'why.c5.t': 'ذكاء اجتماعي',
      'why.c5.b': 'صفحات فيسبوك وX وإنستغرام وRSS وGoogle Trends في طبقة مشاعر واحدة — مع خريطة المؤثرين وتتبّع الانتشار.',
      'why.c5.s': '7 <i>أنواع مصادر</i>',
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
      'tech.eyebrow': 'التقنية',
      'tech.title': 'من الضوضاء الخام إلى <span class="grad">الحقيقة الجاهزة للقرار</span>',
      'tech.sub': 'مصادر مصرية، نطاق عالمي — ثلاث طبقات معالجة ونواة ذكاء واحدة.',
      'tech.stage1': '01 · الاستيعاب', 'tech.stage2': '02 · المعالجة', 'tech.stage3': '03 · التنفيذ',
      'tech.trends': 'مصر + العالم', 'tech.news': 'مصرية + دولية',
      'tech.llm': 'تصنيف عربي + إنجليزي', 'tech.groq': 'استدلال فائق السرعة', 'tech.n8n': 'أتمتة سير العمل',
      'tech.core': 'نواة نبض', 'tech.core.sub': 'دمج · ترتيب · سرد',
      'tech.out1': 'مساحة التحليل', 'tech.out1.sub': 'لوحات حية',
      'tech.b1.t': 'سريع بالتصميم', 'tech.b1.b': 'استدلال Groq بأكثر من 1000 رمز/ثانية — ملخصات في أقل من ثانية.',
      'tech.b2.t': 'خاص افتراضيًا', 'tech.b2.b': 'خط أنابيب مشفّر، لا بيع لإشاراتك، مع إقامة بيانات مصرية عند الطلب.',
      'tech.b3.t': 'قابل للتركيب', 'tech.b3.b': 'كل طبقة مكشوفة — اربط n8n أو webhooks أو API الخام.',
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
      'tm.eyebrow': 'آراء العملاء',
      'tm.title': 'موثوق من فرق <span class="grad">تتحرك بسرعة</span>',
      'tm.q1.b': 'نبض رصد موجة معلومات مضللة قبل ثلاث ساعات من وصولها إلى تغطيتنا. هذا هو الفرق بين من يتفاعل ومن يقود.',
      'tm.q1.n': 'شريف حسن', 'tm.q1.r': 'رئيس تحرير مجموعة المصري للإعلام',
      'tm.q2.b': 'نتابع أربعة عشر سوقًا مصريًا على شاشة واحدة — والملخصات أفضل من اجتماعاتنا الصباحية.',
      'tm.q2.n': 'أميرة نبيل', 'tm.q2.r': 'نائب الرئيس للاستراتيجية، مجموعة دلتا الرقمية',
      'tm.q3.b': 'زمن الاستجابة في رصد الأزمات هو القصة الحقيقية. نعيد نشر فرق الميدان الآن بناءً على تنبيهات نبض، وليس على العناوين.',
      'tm.q3.n': 'طارق مصطفى', 'tm.q3.r': 'مدير العمليات، جمعية عون للإغاثة',
      'cta.eyebrow': 'ابدأ الآن',
      'cta.title': 'ابدأ بفهم<br>نبض <span class="grad">مصر</span>.',
      'cta.sub': 'انضم إلى فرق استخبارات في مصر وأكثر من 30 دولة تراقب العالم لحظة بلحظة.',
      'cta.btn1': 'أطلق نبض', 'cta.btn2': 'تحدث معنا',
      'cta.note': 'تجربة مجانية 14 يومًا · بدون بطاقة ائتمان · الإعداد في 5 دقائق',
      'footer.tagline': 'ذكاء الترندات لبلد لا يتوقف عن الحركة.',
      'footer.c1': 'المنتج', 'footer.l11': 'تحليل مباشر', 'footer.l12': 'الميزات',
      'footer.l13': 'الأسعار', 'footer.l14': 'التقنية',
      'footer.c2': 'الشركة', 'footer.l21': 'من نحن', 'footer.l22': 'العملاء',
      'footer.l23': 'حالات الاستخدام', 'footer.l24': 'تواصل',
      'footer.c3': 'الموارد', 'footer.l31': 'التوثيق', 'footer.l32': 'مرجع API',
      'footer.l33': 'الحالة', 'footer.l34': 'المدونة',
      'footer.c4': 'القانونية', 'footer.l41': 'الخصوصية', 'footer.l42': 'الشروط',
      'footer.l43': 'الأمان', 'footer.l44': 'اتفاقية حماية البيانات',
      'footer.copyright': 'نبض لأنظمة الاستخبارات', 'footer.status': 'جميع الأنظمة تعمل',

      /* workspace */
      'ws.back': 'الرئيسية', 'ws.new': 'تحليل جديد', 'ws.querylabel': 'المتابعة', 'ws.private.badge': 'تحليل خاص',
      'ws.brief': 'موجز الذكاء الاصطناعي',
      'ws.meta1': '14 مصدرًا', 'ws.meta2': 'حُدّث قبل دقيقتين', 'ws.meta3': 'ثقة 94%',
      'ws.brieftitle': 'مصر — تقرير حي',
      'ws.sum1': 'يتحرك الحديث في مصر اليوم على ثلاثة جبهات. <strong>الاقتصاد</strong> يتصدر: أحاديث الجنيه المصري ترتفع بحدة، والتضخم هو الموضوع الأول في القاهرة، وأرقام حركة قناة السويس تجذب انتباه العالم.',
      'ws.sum2': 'في <strong>السياسة والمجتمع</strong>، العاصمة الإدارية الجديدة تتصدر الترند بمشاعر إيجابية قوية، بينما تتصاعد مناقشات إصلاح التعليم في الدلتا والصعيد. خطر التضليل مرتفع حول شائعات العملة — مجموعتان رُصدتا للمراجعة.',
      'ws.sum3': '<strong>قائمة المتابعة المقترحة:</strong> إصدار بيانات التضخم، إعلانات قناة السويس، والاستعدادات للكلاسيكو في الإسكندرية والقاهرة.',
      'ws.briefchip1': 'اقتصاد', 'ws.briefchip2': 'سياسة', 'ws.briefchip3': 'رياضة', 'ws.briefchip4': 'القاهرة',
      'ws.kpi1': 'إجمالي الأحاديث', 'ws.kpi2': 'المشاعر العامة', 'ws.kpi3': 'أزمات نشطة', 'ws.kpi4': 'نقاشات التضخم',
      'ws.gov.t': 'ذكاء المحافظات', 'ws.gov.s': 'كثافة الترندات حسب الإقليم',
      'ws.loc.cairo': 'القاهرة', 'ws.loc.capital': 'العاصمة الجديدة', 'ws.loc.ale': 'الإسكندرية',
      'ws.loc.giza': 'الجيزة', 'ws.loc.suez': 'قناة السويس', 'ws.loc.upper': 'الصعيد',
      'ws.loc.ps': 'بورسعيد', 'ws.loc.mans': 'المنصورة', 'ws.loc.tanta': 'طنطا', 'ws.loc.aswan': 'أسوان',
      'ws.global.t': 'السياق العالمي', 'ws.global.s': 'إشارات العالم · متابعة مصر',
      'ws.global.r1': 'مراقبة الركود العالمي', 'ws.global.r2': 'مفاوضات وقف إطلاق النار في غزة',
      'ws.global.r3': 'أسواق الطاقة', 'ws.global.r4': 'تدفقات الاستثمار الخليجية',
      'ws.global.r5': 'تعافي السياحة العالمية', 'ws.global.r6': 'تنسيق بريكس',
      'ws.topics.t': 'ترندات رائجة', 'ws.topics.s': 'حسب الخطورة · مصر',
      'ws.topics.t1': 'الجنيه المصري', 'ws.topics.t2': 'قناة السويس', 'ws.topics.t3': 'العاصمة الجديدة',
      'ws.topics.t4': 'التضخم', 'ws.topics.t5': 'الكلاسيكو', 'ws.topics.t6': 'السياحة',
      'ws.topics.t7': 'التعليم', 'ws.topics.t8': 'نقاش قانون الانتخابات',
      'ws.timeline.t': 'الخط الزمني الحي', 'ws.timeline.s': 'حجم الحديث في مصر · 24 ساعة',
      'ws.tab.day': '24 س', 'ws.tab.week': '7 أيام', 'ws.tab.month': '30 يومًا',
      'ws.donut.t': 'توزيع المشاعر', 'ws.donut.s': 'مصر · آخر 24 ساعة',
      'ws.donut.pos': 'إيجابي', 'ws.donut.neu': 'محايد', 'ws.donut.neg': 'سلبي',
      'ws.nodata': 'لا توجد بيانات',
      'ws.sent.na': 'بيانات المشاعر غير متاحة',
      'ws.timeline.na': 'لا توجد إشارات زمنية كافية لرسم خط زمني',
      'ws.loc.na': 'لا توجد بيانات مواقع كافية لهذا الاستعلام',
      'ws.national.t': 'تغطية وطنية',
      'ws.national.s': 'إشارة على مستوى مصر',
      'ws.inf.na': 'لا توجد شخصيات مؤثرة يمكن تحديدها في هذا التحليل',
      'ws.hl.na': 'لم تُنشأ ملخصات ذكاء اصطناعي لهذا الاستعلام.',
      'ws.src.na': 'لا تتوفر توزيعة مصادر لهذا الاستعلام.',
      'ws.mix.na': 'لا يتوفر مزيج فئات لهذا الاستعلام.',
      'ws.global.na': 'لا يتوفر سياق عالمي لهذا الاستعلام.',
      'ws.net.na': 'علاقات الشبكة غير متاحة لهذا التحليل.',
      'ws.feed.na': 'لم تُرجع الإشارات الحية نتائج لهذا الاستعلام.',
      'ws.sum.na': 'لم يُرجع الموجز ملخصًا ذكيًا لهذا الاستعلام — الإشارات معروضة أدناه.',
      'ws.src.count': 'مصدر',
      'ws.updated': 'آخر تحديث',
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
      'ws.feed.t': 'التغذية الحية', 'ws.feed.s': 'أخبار · اجتماعي · RSS',
      'ws.feed.i1': 'وزير المالية يناقش إصلاحات الدعم في اجتماع المجلس الاقتصادي',
      'ws.feed.i2': 'الجنيه المصري يقفز على خلفية تدفقات استثمارية قياسية',
      'ws.feed.i3': 'هيئة قناة السويس تعلن أرقام عبور قياسية للربع',
      'ws.feed.i4': 'نقاش واسع حول أسعار السلع الأساسية في مجموعات المحافظات',
      'ws.feed.i5': 'فعاليات العاصمة الجديدة تجذب الاهتمام مع الإعلان عن افتتاحات',
      'ws.feed.i6': 'الطقس: تحذيرات من شبورة على الطرق الصحراوية صباحًا',
      'ws.feed.i7': 'محللون منقسمون حول آفاق السياحة الشتوية',
      'ws.feed.i8': 'مبادرات مجتمعية لتنظيف الشواطئ تنمو في الإسكندرية',
      'ws.feed.i9': 'البورصة المصرية تغلق على ارتفاع مع شراء أجنبي',
      'ws.hl.t': 'ملخصات الذكاء الاصطناعي', 'ws.hl.s': 'صُنعت في هذه الدورة',
      'ws.hl.t1': 'حدث عاجل', 'ws.hl.t2': 'نمط ناشئ', 'ws.hl.t3': 'خطر تضليل',
      'ws.hl.t4': 'فرصة', 'ws.hl.t5': 'تفاعل جماهيري',
      'ws.hl.b1': 'أرقام عبور قناة السويس صدرت — الحجم فاق التوقعات.',
      'ws.hl.b2': 'أحاديث الجنيه ارتفعت 43% في القاهرة خلال 3 ساعات.',
      'ws.hl.b3': 'شائعات تخفيض قيمة العملة بلا مصادر موثوقة؛ الانتشار يتسارع.',
      'ws.hl.b4': 'اهتمام خليجي متزايد بمشروعات العاصمة الإدارية الجديدة.',
      'ws.hl.b5': 'نقاش إصلاح التعليم منقسم — دعم قوي في الصعيد.',
      'ws.hl.time1': 'منذ 12 دقيقة', 'ws.hl.time2': 'منذ 8 دقائق', 'ws.hl.time3': 'منذ 6 دقائق', 'ws.hl.time4': 'منذ 4 دقائق', 'ws.hl.time5': 'منذ دقيقتين',
      'ws.inf.t': 'المؤثرون', 'ws.inf.s': 'أبرز الأصوات هذه الساعة',
      'ws.inf.n1': 'مصر اليوم', 'ws.inf.n2': 'كايرو بلس', 'ws.inf.n3': 'د. أحمد حسن',
      'ws.inf.n4': 'نور ميديا', 'ws.inf.n5': 'أمنية طارق',
      'ws.src.t': 'المصادر', 'ws.src.s': 'حصة الإشارات · 24 ساعة',
      'ws.src.r1': 'مكاتب الأخبار', 'ws.src.r2': 'إكس (تويتر)', 'ws.src.r3': 'فيسبوك',
      'ws.src.r4': 'خلاصات RSS', 'ws.src.r5': 'إنستغرام', 'ws.src.r6': 'جوجل ترندز',
      'ws.net.t': 'شبكة العلاقات', 'ws.net.s': 'موضوعات · مؤسسات · أصوات',
      'ws.mix.t': 'مزيج الوسائط', 'ws.mix.s': 'حصة الإشارات حسب الفئة',
      'ws.mix.r1': 'اقتصاد', 'ws.mix.r2': 'سياسة', 'ws.mix.r3': 'رياضة',
      'ws.mix.r4': 'ثقافة', 'ws.mix.r5': 'تقنية', 'ws.mix.r6': 'طقس',
      'ws.foot': 'ذكاء حيّ · يُحدَّث كل 60 ثانية · 14 نوع مصدر',
      'ws.toast.new': 'تحليل جديد جاهز — أُعيد تحديث مساحة العمل',
      'ws.toast.query': 'تم تحديث المتابعة إلى: <b>{q}</b>',

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
      'auth.first': 'الاسم الأول', 'auth.last': 'الاسم الأخير', 'auth.org': 'المؤسسة',
      'auth.remember': 'تذكرني', 'auth.forgot': 'نسيت كلمة المرور؟',
      'auth.submit': 'تسجيل الدخول', 'auth.signup.submit': 'إنشاء الحساب',
      'auth.alt': 'أو المتابعة عبر', 'auth.google': 'جوجل', 'auth.facebook': 'فيسبوك',
      'auth.signup.switch': 'ليس لديك حساب؟ <a class="link-soft" href="signup.html" data-page="signup.html">أنشئ حسابًا</a>',
      'auth.signin.switch': 'لديك حساب بالفعل؟ <a class="link-soft" href="signin.html" data-page="signin.html">سجّل الدخول</a>',
      'auth.back': 'العودة للرئيسية', 'auth.country': 'الدولة', 'auth.lang': 'اللغة',
      'auth.terms': 'أوافق على الشروط وسياسة الخصوصية',
      'auth.art1.t': 'مركز قيادة الذكاء الخاص بك',
      'auth.art1.b': 'الترندات والمشاعر والأزمات والتغذية الحية في كل محافظات مصر — في مساحة عمل واحدة حية.',
      'auth.art2.t': 'مركز قيادة الذكاء الخاص بك',
      'auth.art2.b': 'الترندات والمشاعر والأزمات والتغذية الحية في كل محافظات مصر — في مساحة عمل واحدة حية.',
      'auth.err.email': 'يرجى إدخال بريد إلكتروني صحيح.',
      'auth.err.pass': 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
      'auth.err.req': 'يرجى ملء جميع الحقول المطلوبة.',
      'auth.err.match': 'كلمتا المرور غير متطابقتين.',
      'auth.err.terms': 'يرجى الموافقة على الشروط للمتابعة.',
      'auth.pending': 'يرجى الانتظار…',
      'auth.ok.signin': 'مرحبًا بعودتك — جارٍ تشغيل التطبيق…',
      'auth.ok.signup': 'تم إنشاء الحساب — جارٍ تشغيل مساحة العمل…',
      'auth.social': 'وضع تجريبي — تسجيل دخول الشبكات الاجتماعية محاكى.',
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
      'app.st.done': 'مكتمل', 'app.st.running': 'قيد التشغيل', 'app.st.failed': 'فشل',
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

      /* dashboard */
      'dash.qa': 'إجراءات سريعة',
      'dash.qa.new': 'تحليل جديد', 'dash.qa.saved': 'تشغيل بحث محفوظ',
      'dash.qa.export': 'تصدير تقرير', 'dash.qa.alert': 'إنشاء تنبيه',
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

      /* profile */
      'prof.about': 'نبذة',
      'prof.name': 'الاسم', 'prof.role': 'الدور', 'prof.org': 'المؤسسة',
      'prof.country': 'البلد', 'prof.lang': 'اللغة', 'prof.email': 'البريد الإلكتروني',
      'prof.joined': 'تاريخ الانضمام', 'prof.sub': 'الاشتراك',
      'prof.plan': 'الاستخبارات الاحترافية', 'prof.renew': 'يتجدد خلال 12 يوماً',
      'prof.usage': 'الاستخدام هذا الشهر',
      'prof.u1': 'تحليلات', 'prof.u2': 'تنبيهات', 'prof.u3': 'صادرات', 'prof.u4': 'بحوث',
      'prof.cats': 'الفئات المفضلة',
      'prof.activity': 'النشاط الأخير',
      'prof.role.v': 'محلل أول', 'prof.org.v': 'مجموعة دلتا الرقمية',
      'prof.edit': 'تعديل الملف',

      /* settings */
      'set.general': 'عام', 'set.appearance': 'المظهر', 'set.lang': 'اللغة',
      'set.notif': 'الإشعارات', 'set.privacy': 'الخصوصية', 'set.security': 'الأمان',
      'set.shortcuts': 'الاختصارات', 'set.experimental': 'الميزات التجريبية',
      'set.danger': 'منطقة الخطر',
      'set.g.name': 'الاسم الكامل', 'set.g.org': 'المؤسسة', 'set.g.email': 'البريد الإلكتروني',
      'set.g.save': 'حفظ التغييرات',
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

      /* favorites */
      'fav.t.reports': 'التقارير', 'fav.t.searches': 'البحوث',
      'fav.t.dashboards': 'لوحات التحكم', 'fav.t.topics': 'المواضيع',
      'fav.r1': 'موجز مصر الأسبوعي', 'fav.r2': 'رصد مخاطر التضخم', 'fav.r3': 'تقرير نبض التواصل الاجتماعي',
      'fav.s1': 'الجنيه المصري', 'fav.s2': 'قناة السويس', 'fav.s3': 'العاصمة الجديدة',
      'fav.d1': 'نظرة المحافظات', 'fav.d2': 'لوحة قيادة الأزمات', 'fav.d3': 'نبض التواصل',
      'fav.t1': 'الاقتصاد', 'fav.t2': 'قناة السويس', 'fav.t3': 'التعليم',

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
    const next = lang === 'ar' ? 'en' : 'ar';
    phrases = QUERIES[next];
    if (typedEl) typedEl.textContent = '';
    applyLang(next);
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

  function navigate(url) {
    const cur = location.pathname.split('/').pop();
    const target = url.split(/[?#]/)[0].split('/').pop();
    if (target === cur) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.body.classList.add('page-leave');
    setTimeout(() => { location.href = url; }, 420);
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
  const spySections = ['top', 'why', 'technology', 'use-cases', 'cta']
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
     TYPEWRITER (landing)
     ---------------------------------------------------------- */
  const typedEl = $('typedText');
  const searchInput = $('searchInput');
  const placeholder = $('searchPlaceholder');
  let phrases = QUERIES[lang];

  if (typedEl && searchInput) {
    let pi = 0, ci = 0, deleting = false;
    const hidePlaceholder = () => {
      placeholder.style.opacity = '0';
      placeholder.style.transition = 'opacity .2s';
    };
    const showPlaceholder = () => {
      if (!searchInput.value) {
        placeholder.style.opacity = '1';
        placeholder.style.transition = 'opacity .3s';
      }
    };
    searchInput.addEventListener('input', () => searchInput.value ? hidePlaceholder() : showPlaceholder());
    searchInput.addEventListener('focus', () => searchInput.value && hidePlaceholder());
    searchInput.addEventListener('blur', showPlaceholder);

    const tick = () => {
      if (deleting) {
        ci--;
        typedEl.textContent = phrases[pi].slice(0, ci);
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 600); return; }
        setTimeout(tick, 20);
      } else {
        ci++;
        typedEl.textContent = phrases[pi].slice(0, ci);
        if (ci >= phrases[pi].length) { deleting = true; setTimeout(tick, 5000); return; }
        setTimeout(tick, 42);
      }
    };
    tick();
  }

  /* ----------------------------------------------------------
     SUGGESTIONS — rotation + navigate
     ---------------------------------------------------------- */
  const sTrack = $('suggestionsTrack');
  if (sTrack) {
    setInterval(() => {
      sTrack.classList.add('swap');
      setTimeout(() => {
        sTrack.appendChild(sTrack.children[0]);
        sTrack.classList.remove('swap');
      }, 500);
    }, 4200);
  }

  document.querySelectorAll('.suggestions .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      if (searchInput) {
        searchInput.value = q;
        placeholder.style.opacity = '0';
      }
      navigate(PAGE_DIR + 'dashboard.html?view=analysis&q=' + encodeURIComponent(q));
    });
  });

  /* search submit → analysis inside the authenticated app */
  const searchBtn = $('searchBtn');
  if (searchBtn) searchBtn.addEventListener('click', () => submitSearch());
  if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitSearch(); });

  function submitSearch() {
    const q = (searchInput.value || '').trim() || QUERIES[lang][0];
    navigate(PAGE_DIR + 'dashboard.html?view=analysis&q=' + encodeURIComponent(q));
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
     WORKSPACE KPI JITTER
     ---------------------------------------------------------- */
  const kpiMentions = $('kpiMentions');
  const kpiCairoSent = $('kpiCairoSent');
  setInterval(() => {
    if (kpiMentions && kpiMentions.textContent) {
      const base = parseFloat(kpiMentions.textContent.replace(/[^\d.]/g, '')) || 1.4;
      kpiMentions.textContent = (base + rand(0.002, 0.012)).toFixed(1) + 'M+';
    }
    if (kpiCairoSent && kpiCairoSent.textContent) {
      const base = parseFloat(kpiCairoSent.textContent) || 68.4;
      kpiCairoSent.textContent = Math.max(0, Math.min(100, base + rand(-0.3, 0.3))).toFixed(1);
    }
  }, 3200);

  /* ----------------------------------------------------------
     LIVE FEED — seamless loop (workspace)
     ---------------------------------------------------------- */
  const feedTrack = $('feedTrack');
  if (feedTrack) feedTrack.innerHTML += feedTrack.innerHTML;

  /* ----------------------------------------------------------
     FACEBOOK PRIVATE ANALYSIS — mock connect (landing)
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
      fb.connect();
    } else if (state === 'idle') {
      if (fbConnect) fbConnect.classList.remove('hidden');
      if (fbDisconnect) fbDisconnect.classList.add('hidden');
      fb.disconnect();
    } else {
      if (fbConnect) fbConnect.classList.add('hidden');
      if (fbDisconnect) fbDisconnect.classList.add('hidden');
    }
    fbStateTexts();
  }

  if (fbConnect) {
    fbConnect.addEventListener('click', () => {
      setFbState('connecting');
      fbTimer = setTimeout(() => setFbState('connected'), 1500);
    });
  }
  if (fbDisconnect) {
    fbDisconnect.addEventListener('click', () => {
      clearTimeout(fbTimer);
      setFbState('idle');
    });
  }

  /* ----------------------------------------------------------
     ANALYSIS SERVICE — real n8n webhook
     USER INPUT → POST /webhook/trend-analysis → raw response
     ----------------------------------------------------------
     Public payload  : { query, scope: "public" }
     Private payload : { query, scope: "private", …existing fb identity }
     Failures (HTTP or network/timeout) reject — never mock.      */
  const NABD_WEBHOOK = 'https://n8n.addme.solutions/webhook/trend-analysis';

  function analyze(query, opts) {
    const scope = opts && opts.scope === 'private' ? 'private' : 'public';
    const payload = { query: String(query || '').trim(), scope: scope };
    if (scope === 'private') {
      const st = fb.read();
      if (!st.connected) return Promise.reject(new Error('fb-not-connected'));
      ['facebookAccessToken', 'facebookUserId', 'facebookPageId', 'instagramBusinessId'].forEach((k) => {
        if (st[k]) payload[k] = st[k];
      });
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    return fetch(NABD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    }).then((res) => {
      clearTimeout(timer);
      if (!res.ok) throw new Error('trend-analysis http ' + res.status);
      return res.text().then((txt) => {
        if (!txt || !txt.trim()) throw new Error('trend-analysis empty response');
        try { return JSON.parse(txt); } catch (e) { throw new Error('trend-analysis invalid json'); }
      });
    }).catch((err) => {
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
  function normalizeAnalysisResponse(raw) {
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

    const out = {
      query: '', raw: raw, language: null, summary: null, confidence: null, analyzedAt: null,
      articles: [], highlights: [], topics: [], locations: [], influencers: [],
      timeline: null, sentiment: null, network: null, globalContext: null, national: false, sources: [], categories: []
    };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;

    out.query = String(pick(raw, ['query', 'q', 'search', 'userQuery'], '') || '');
    out.language = pick(raw, ['language', 'lang'], null) || null;
    out.summary = pick(raw, ['summary', 'aiSummary', 'brief', 'aiBrief', 'answer', 'result'], null);
    const conf = num(pick(raw, ['confidence'], null));
    out.confidence = conf != null ? conf : null;
    out.analyzedAt = pick(raw, ['analyzedAt', 'generatedAt', 'timestamp', 'completedAt', 'created_at'], null) || null;
    out.network = pick(raw, ['network', 'graph', 'entities', 'relations'], null) || null;
    out.globalContext = pick(raw, ['globalContext', 'global', 'global_trends', 'world'], null) || null;

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
      return {
        title: pick(it, ITEM_KEYS, null),
        description: pick(it, ['description', 'summary', 'snippet', 'excerpt'], null),
        url: pick(it, ['url', 'link', 'href'], null),
        source: pickRealSource(it),
        sourceType: pick(it, ['sourceType', 'source_type', 'type', 'src', 'medium'], null),
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

    /* ---- sentiment (aggregate first, else derived per record) ---- */
    const sAgg = raw.sentiment && typeof raw.sentiment === 'object' && !Array.isArray(raw.sentiment) ? raw.sentiment : null;
    if (sAgg) {
      const pos = num(sAgg.positive), neu = num(sAgg.neutral), neg = num(sAgg.negative);
      if (pos != null || neu != null || neg != null) {
        out.sentiment = {
          positive: Math.max(0, pos || 0), neutral: Math.max(0, neu || 0), negative: Math.max(0, neg || 0),
          label: sAgg.label || null, fromCount: (pos || 0) + (neu || 0) + (neg || 0), derived: false
        };
      } else if (sAgg.label || sAgg.score != null) {
        const sc = num(sAgg.score);
        const cls = sc != null ? (sc > 0.2 ? 'positive' : sc < -0.2 ? 'negative' : 'neutral')
          : String(sAgg.label).toLowerCase().indexOf('pos') !== -1 ? 'positive'
            : String(sAgg.label).toLowerCase().indexOf('neg') !== -1 ? 'negative' : 'neutral';
        out.sentiment = { positive: 0, neutral: 0, negative: 0, label: sAgg.label || null, derived: false, fromCount: 1 };
        out.sentiment[cls] = 1;
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
      const tot = s.positive + s.neutral + s.negative;
      if (tot > 0) {
        const rawPct = [s.positive / tot * 100, s.neutral / tot * 100, s.negative / tot * 100];
        const floors = rawPct.map(Math.floor);
        let rem = 100 - floors[0] - floors[1] - floors[2];
        const order = [0, 1, 2].sort((a, b) => (rawPct[b] - Math.floor(rawPct[b])) - (rawPct[a] - Math.floor(rawPct[a])));
        for (let i = 0; i < rem; i++) floors[order[i % 3]] += 1;
        s.positive = floors[0]; s.neutral = floors[1]; s.negative = floors[2];
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

    /* ---- locations (explicit + aggregated geo references) ---- */
    const NATIONAL = ['مصر', 'egypt', 'جمهورية مصر العربية', 'arab republic of egypt'];
    const locSeen = {};
    (Array.isArray(raw.topLocations) ? raw.topLocations : []).forEach((l) => {
      const name = String(pick(l, ['name', 'label', 'city', 'region'], '') || '').trim();
      if (!name) return;
      locSeen[name] = {
        name: name, score: num(pick(l, ['score'], null)),
        count: num(pick(l, ['vol', 'volume', 'count', 'mentions'], null)),
        delta: pick(l, ['delta', 'change'], null), up: pick(l, ['up', 'dir'], null),
        vol: pick(l, ['vol', 'volume', '24h'], null), w: num(pick(l, ['w', 'weight'], null))
      };
    });
    out.articles.forEach((a) => {
      const n = a.location ? String(a.location).trim() : '';
      if (!n) return;
      if (NATIONAL.indexOf(n.toLowerCase()) !== -1) { out.national = true; return; }
      if (locSeen[n]) { locSeen[n].count = locSeen[n].count == null ? 0 : locSeen[n].count + 1; return; }
      locSeen[n] = { name: n, score: null, count: 1, delta: null, up: null, vol: null, w: null };
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

    /* ---- influencers (explicit, else recurring sources) ---- */
    const infSeen = {};
    (Array.isArray(raw.topInfluencers) ? raw.topInfluencers : []).forEach((f, i) => {
      const name = String(pick(f, ['name', 'label', 'title', 'handle'], '') || '').trim();
      if (!name) return;
      infSeen[name] = {
        name: name, ini: pick(f, ['ini', 'initials'], null), hue: num(pick(f, ['hue', 'h'], null)),
        cat: pick(f, ['cat', 'desc', 'meta', 'category', 'handle'], null), score: pick(f, ['score', 'reach', 'value', 'rank'], null), order: i
      };
    });
    if (Object.keys(infSeen).length === 0) {
      const srcMap = {};
      out.articles.forEach((a) => {
        const key = a.source ? String(a.source).trim() : '';
        if (!key || isSrcTypeToken(key)) return;
        srcMap[key] = (srcMap[key] || 0) + 1;
      });
      Object.keys(srcMap).forEach((k) => {
        infSeen[k] = { name: k, ini: null, hue: null, cat: null, score: String(srcMap[k]), order: null };
      });
    }
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

    /* ---- timeline (explicit signalVolume, else real timestamps) ---- */
    if (Array.isArray(raw.signalVolume)) {
      const pts = [];
      raw.signalVolume.forEach((sv) => {
        if (sv && typeof sv === 'object') {
          const v = num(sv.value != null ? sv.value : sv.count);
          if (v == null) return;
          const ts = parseRangeTime(sv.time != null ? sv.time : sv.label);
          pts.push({ bucket: ts != null ? ts : pts.length, count: Math.max(0, Math.round(v)) });
        } else {
          const v = num(sv);
          if (v == null) return;
          pts.push({ bucket: pts.length, count: Math.max(0, Math.round(v)) });
        }
      });
      out.timeline = pts.length >= 2 ? pts : null;
    } else {
      out.timeline = deriveTimeline(out.articles);
    }

    out.sources = deriveSources(out.articles);
    out.categories = deriveCategories(out.articles);
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
    const mn = String(t).match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:[^0-9]{0,8}(\d{2,4}))?/);
    if (mn) {
      const mo = MONTHS[mn[1].slice(0, 3).toLowerCase()];
      if (mo != null) {
        const day = parseInt(mn[2], 10);
        const year = mn[3] != null ? parseInt(mn[3], 10) : new Date().getFullYear();
        const dd = new Date(year, mo, day);
        if (!isNaN(dd.getTime())) return dd.getTime();
      }
    }
    return null;
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
     name (BBC News, NPR, …); bare type tokens (news/web/…) map to the fixed
     card labels only when no publisher name exists for a record. */
  function deriveSources(items) {
    const TYPE_LABEL = {
      'news': 'News desks', 'newspaper': 'News desks', 'press': 'News desks', 'agency': 'News desks',
      'web': 'Web', 'website': 'Web',
      'x': 'X (Twitter)', 'twitter': 'X (Twitter)',
      'facebook': 'Facebook', 'fb': 'Facebook',
      'instagram': 'Instagram', 'ig': 'Instagram',
      'rss': 'RSS feeds', 'feed': 'RSS feeds',
      'google': 'Google Trends', 'trends': 'Google Trends'
    };
    const isToken = (v) => {
      if (v == null) return true;
      const s = String(v).toLowerCase().trim();
      return !!TYPE_LABEL[s] || /^(news|web|website|article|social|rss|feed|google|trends|youtube|twitter|facebook|instagram|press|newspaper|x)\b/i.test(s);
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
      map[key] = (map[key] || 0) + 1;
    });
    const tot = items && items.length ? items.length : 0;
    return Object.keys(map).map((k) => ({ label: k, count: map[k], pct: tot ? Math.round((map[k] / tot) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }

  /* Category mix (media-mix card) from real record categories. */
  function deriveCategories(items) {
    const MIX = { economy: 'Economy', business: 'Economy', politics: 'Politics', government: 'Politics', gov: 'Politics', sport: 'Sports', sports: 'Sports', culture: 'Culture', tech: 'Tech', technology: 'Tech', science: 'Tech', weather: 'Weather' };
    const map = {};
    (items || []).forEach((a) => {
      const c = a.category ? MIX[String(a.category).toLowerCase().trim()] : null;
      if (!c) return;
      map[c] = (map[c] || 0) + 1;
    });
    const tot = items && items.length ? items.length : 0;
    return Object.keys(map).map((k) => ({ label: k, count: map[k], pct: tot ? Math.round((map[k] / tot) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }

  /* Generate an AI brief from the ACTUAL normalized analysis — used only when
     n8n does not return a summary field. Every sentence is composed from real
     returned data; empty/missing sections are skipped, and mangled strings
     (literal '?' runs from backend encoding issues) are filtered out. */
  function buildBrief(r, lng) {
    const D = I18N[lng] || I18N.en || {};
    const F = (k) => (D[k] != null ? D[k] : (I18N.en[k] != null ? I18N.en[k] : k));
    const stats = (r && r.raw && r.raw.stats) || {};
    const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    const cleanNames = (arr, get) => (arr || []).map(get).map((s) => String(s == null ? '' : s).trim()).filter((s) => s && !/^[?]+$/.test(s));
    const parts = [];

    const total = num(stats.totalPosts);
    const srcN = Array.isArray(r.articles) ? r.articles.length : 0;
    if (total != null) {
      parts.push(srcN > 0
        ? F('ws.brief.total').split('{n}').join(total).split('{s}').join(srcN)
        : F('ws.brief.mentions').split('{n}').join(total));
    }

    const topics = cleanNames(r.topics, (t) => t.label).slice(0, 3);
    if (topics.length) parts.push(F('ws.brief.topics').split('{t}').join(topics.join(', ')));

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

    const locs = cleanNames(r.locations, (l) => l.name).slice(0, 3);
    if (locs.length) parts.push(F('ws.brief.locations').split('{l}').join(locs.join(', ')));

    const srcs = cleanNames(r.sources, (s) => s.label).slice(0, 3);
    if (srcs.length) parts.push(F('ws.brief.sources').split('{l}').join(srcs.join(', ')));

    const hlN = Array.isArray(r.highlights) ? r.highlights.length : 0;
    if (hlN > 0) parts.push(F('ws.brief.highlights').split('{n}').join(hlN));

    return parts;
  }

  /* ----------------------------------------------------------
     Frontend-only state: persist, read, migrate. The future n8n
     task swaps `fb.connect`/`fb.disconnect` with real OAuth calls —
     the rest of the app only consumes this module + change events.
     ---------------------------------------------------------- */
  const fb = {
    key: 'nabd-fb',
    read() {
      let raw = null;
      try { raw = localStorage.getItem(this.key); } catch (e) {}
      if (!raw) return { connected: false, accountName: '', connectedAt: 0 };
      try {
        const o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          const st = {
            connected: !!o.connected,
            accountName: String(o.accountName || ''),
            connectedAt: Number(o.connectedAt || 0)
          };
          ['facebookAccessToken', 'facebookUserId', 'facebookPageId', 'instagramBusinessId'].forEach((k) => {
            if (o[k]) st[k] = o[k];
          });
          return st;
        }
      } catch (e) { /* not JSON — legacy string below */ }
      return { connected: raw === 'connected', accountName: '', connectedAt: 0 };
    },
    write(state) {
      try { localStorage.setItem(this.key, JSON.stringify(state)); } catch (e) {}
    },
    connect(accountName) {
      let me = null;
      try { me = getUser ? getUser() : null; } catch (e) {}
      const name = (accountName || '').trim()
        || ((me && (me.first || me.last)) ? ((me.first || '') + ' ' + (me.last || '')).trim() : '')
        || 'Egypt Pulse — Page';
      const state = { connected: true, accountName: name, connectedAt: Date.now() };
      this.write(state);
      this.emit(state);
      return state;
    },
    disconnect() {
      const state = { connected: false, accountName: '', connectedAt: 0 };
      this.write(state);
      this.emit(state);
      return state;
    },
    emit(state) {
      try {
        document.dispatchEvent(new CustomEvent('nabd-fb-change', { detail: state }));
      } catch (e) {}
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
    buildBrief,
    toast,
    applyTheme,
    getUser,
    persistUser,
    clearUser,
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
