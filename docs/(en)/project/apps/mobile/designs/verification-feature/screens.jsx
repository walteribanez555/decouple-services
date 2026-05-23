// screens.jsx — all 13 mobile screens for age verification
// Pure presentational; state is driven by props from app.jsx.

const T = {
  bg: '#F4F2EC',
  surface: '#FFFFFF',
  ink: '#14141A',
  ink2: '#3A3A42',
  muted: '#6A6A72',
  faint: '#A6A6AE',
  hairline: 'rgba(20,20,26,0.08)',
  fill: '#EFEDE6',
  fillStrong: '#E4E1D8',
  accent: '#5B47E8',
  accentInk: '#FFFFFF',
  accentSoft: '#EEEBFD',
  success: '#1E8A5C',
  successSoft: '#E4F3EC',
  error: '#D3463A',
  errorSoft: '#FBEAE7',
  warn: '#B8761B',
  warnSoft: '#FBEFD8',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
  display: '-apple-system, "SF Pro Display", system-ui, sans-serif',
};

// ── primitives ───────────────────────────────────────────────
function Stack({ children, gap = 0, style = {}, ...rest }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }} {...rest}>{children}</div>;
}
function Row({ children, gap = 0, align = 'center', style = {}, ...rest }) {
  return <div style={{ display: 'flex', alignItems: align, gap, ...style }} {...rest}>{children}</div>;
}

function StatusBar({ dark = false }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '21px 32px 0', position: 'relative', zIndex: 5,
      fontFamily: T.font,
    }}>
      <span style={{ fontWeight: 600, fontSize: 17, color: c, letterSpacing: -0.3 }}>9:41</span>
      <Row gap={6} style={{ paddingTop: 1 }}>
        <svg width="18" height="11" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c}/><rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c}/><rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c}/><rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c}/></svg>
        <svg width="16" height="11" viewBox="0 0 17 12"><path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c}/><path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c}/><circle cx="8.5" cy="10.5" r="1.5" fill={c}/></svg>
        <svg width="26" height="12" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="20" height="9" rx="2" fill={c}/><path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4"/></svg>
      </Row>
    </div>
  );
}

function HomeIndicator({ dark = false }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 34,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: 8, pointerEvents: 'none', zIndex: 60,
    }}>
      <div style={{
        width: 139, height: 5, borderRadius: 100,
        background: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.28)',
      }} />
    </div>
  );
}

function DynamicIsland() {
  return (
    <div style={{
      position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
      width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
    }} />
  );
}

// Screen shell — handles status bar, dynamic island, home indicator, bg
function Screen({ children, bg = T.bg, dark = false, padded = true }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg, position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: T.font, color: T.ink,
    }}>
      <DynamicIsland />
      <StatusBar dark={dark} />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: padded ? '24px 24px 100px' : 0,
        minHeight: 0, overflow: 'hidden',
      }}>{children}</div>
      <HomeIndicator dark={dark} />
    </div>
  );
}

// ── controls ─────────────────────────────────────────────────
function Button({ children, onClick, variant = 'primary', disabled = false, full = true, leading, style = {} }) {
  const palette = {
    primary: { bg: T.ink, color: '#fff' },
    accent:  { bg: T.accent, color: '#fff' },
    ghost:   { bg: 'transparent', color: T.ink, border: `1.5px solid ${T.hairline}` },
    soft:    { bg: T.fill, color: T.ink },
    danger:  { bg: T.error, color: '#fff' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? '100%' : 'auto',
      height: 56, borderRadius: 16, border: palette.border || 'none',
      background: palette.bg, color: palette.color,
      fontFamily: T.font, fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'transform .12s, opacity .12s',
      ...style,
    }}>
      {leading}{children}
    </button>
  );
}

function Pill({ children, tone = 'neutral' }) {
  const palette = {
    neutral: { bg: T.fill, color: T.ink2 },
    success: { bg: T.successSoft, color: T.success },
    error:   { bg: T.errorSoft, color: T.error },
    warn:    { bg: T.warnSoft, color: T.warn },
    accent:  { bg: T.accentSoft, color: T.accent },
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
      letterSpacing: 0.1, background: palette.bg, color: palette.color,
      textTransform: 'uppercase',
    }}>{children}</span>
  );
}

// ── glyphs (tiny inline icons — only geometric primitives) ──
const I = {
  shield: (c = T.ink, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5 4 5v7c0 4.6 3.4 8.4 8 9.5 4.6-1.1 8-4.9 8-9.5V5l-8-2.5Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="m8.5 12 2.5 2.5L16 9.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  lock: (c = T.ink, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" stroke={c} strokeWidth="1.7"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={c} strokeWidth="1.7"/>
      <circle cx="12" cy="15.5" r="1.3" fill={c}/>
    </svg>
  ),
  eye: (c = T.ink, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2.5 12c2-4 5.5-6.5 9.5-6.5s7.5 2.5 9.5 6.5c-2 4-5.5 6.5-9.5 6.5S4.5 16 2.5 12Z" stroke={c} strokeWidth="1.7"/>
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.7"/>
    </svg>
  ),
  trash: (c = T.ink, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14M10 4h4m-7 3 1 13h8l1-13" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevR: (c = T.muted, size = 14) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M5 2.5 9.5 7 5 11.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevL: (c = T.ink, size = 18) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M11 3.5 5 9l6 5.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (c = T.ink, size = 18) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M4 4l10 10M14 4 4 14" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  check: (c = '#fff', size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="m5 12 5 5 9-10" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  passport: (c = T.ink, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="1.5" stroke={c} strokeWidth="1.6"/>
      <circle cx="12" cy="10" r="2.5" stroke={c} strokeWidth="1.6"/>
      <path d="M9 16h6M9 18.5h6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  card: (c = T.ink, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke={c} strokeWidth="1.6"/>
      <circle cx="7.5" cy="11" r="1.8" stroke={c} strokeWidth="1.4"/>
      <path d="M12 11h6M12 14.5h4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  license: (c = T.ink, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke={c} strokeWidth="1.6"/>
      <rect x="5" y="7" width="6" height="7" rx="0.8" stroke={c} strokeWidth="1.4"/>
      <path d="M13 8.5h6M13 11.5h6M13 14.5h4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  warn: (c = T.warn, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 2.5 20h19L12 3Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12 10v4.5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="12" cy="17.5" r="1.1" fill={c}/>
    </svg>
  ),
  sparkles: (c = T.accent, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  bolt: (c = T.ink, size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  retry: (c = '#fff', size = 20) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── 1. Intro ────────────────────────────────────────────────
function ScreenIntro({ onStart, onSkip }) {
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, letterSpacing: 1.5, color: T.muted, fontWeight: 600, textTransform: 'uppercase' }}>
          Step 1 of 3
        </div>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', color: T.muted, fontSize: 15,
          fontFamily: T.font, fontWeight: 500, cursor: 'pointer', padding: 0,
        }}>Cancel</button>
      </Row>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 20, paddingBottom: 20 }}>
        {/* Hero mark */}
        <div style={{
          width: 92, height: 92, borderRadius: 28, marginBottom: 32,
          background: T.ink, position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(20,20,26,0.18)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(120% 70% at 0% 0%, ${T.accent}55, transparent 60%)`,
          }} />
          <div style={{
            position: 'absolute', left: 28, top: 28,
          }}>{I.shield('#fff', 36)}</div>
        </div>

        <h1 style={{
          margin: 0, fontFamily: T.display, fontSize: 36, fontWeight: 700,
          letterSpacing: -1.2, lineHeight: 1.05, color: T.ink, textWrap: 'pretty',
        }}>Confirm you're<br/>over 18.</h1>
        <p style={{
          margin: '14px 0 0', fontSize: 16.5, lineHeight: 1.45, color: T.ink2,
          maxWidth: 320, textWrap: 'pretty',
        }}>
          We'll need a quick photo of a government-issued ID. It's encrypted, used once, then deleted.
        </p>

        <div style={{ height: 24 }} />

        <Stack gap={14}>
          <Bullet icon={I.lock(T.ink, 18)} text="End-to-end encrypted upload" />
          <Bullet icon={I.eye(T.ink, 18)} text="Reviewed by AI, not stored" />
          <Bullet icon={I.bolt(T.ink, 18)} text="Takes about 30 seconds" />
        </Stack>
      </div>

      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 50 }}>
        <Button variant="primary" onClick={onStart}>Get started</Button>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12.5, color: T.muted, lineHeight: 1.45 }}>
          By continuing you agree to our <u>Terms</u> and <u>Privacy Policy</u>.
        </div>
      </div>
    </Screen>
  );
}

function Bullet({ icon, text }) {
  return (
    <Row gap={12}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, background: T.fill,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <span style={{ fontSize: 15.5, color: T.ink2, fontWeight: 500 }}>{text}</span>
    </Row>
  );
}

// ── 2. Document type ────────────────────────────────────────
function ScreenDocType({ onPick, onBack, selected = 'license' }) {
  const [sel, setSel] = React.useState(selected);
  const docs = [
    { id: 'passport', label: 'Passport',         hint: 'Photo page',         icon: I.passport },
    { id: 'license',  label: "Driver's license", hint: 'Front side',         icon: I.license },
    { id: 'id',       label: 'National ID card', hint: 'Front side',         icon: I.card },
  ];
  return (
    <Screen>
      <NavTop label="Back" onBack={onBack} step="2 of 3" />
      <div style={{ marginTop: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>Pick your document</h2>
        <p style={{ margin: '8px 0 22px', color: T.muted, fontSize: 15, lineHeight: 1.4 }}>
          Choose one. We'll guide you through the photo.
        </p>
      </div>

      <Stack gap={10}>
        {docs.map(d => (
          <button key={d.id} onClick={() => setSel(d.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 18px', borderRadius: 18,
            background: T.surface,
            border: `1.5px solid ${sel === d.id ? T.ink : T.hairline}`,
            cursor: 'pointer', textAlign: 'left',
            transition: 'border-color .15s, transform .15s',
            fontFamily: T.font,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: T.fill,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{d.icon(T.ink, 24)}</div>
            <Stack style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 16.5, fontWeight: 600, color: T.ink }}>{d.label}</span>
              <span style={{ fontSize: 13.5, color: T.muted, marginTop: 2 }}>{d.hint}</span>
            </Stack>
            <Radio active={sel === d.id} />
          </button>
        ))}
      </Stack>

      <div style={{ flex: 1 }} />

      <div style={{
        background: T.fill, borderRadius: 14, padding: '14px 16px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        marginBottom: 16, marginTop: 16,
      }}>
        {I.lock(T.ink2, 18)}
        <span style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.4 }}>
          Accepted formats: JPEG, PNG, WebP — up to 5 MB.
        </span>
      </div>

      <Button onClick={() => onPick(sel)}>Continue</Button>
    </Screen>
  );
}

function Radio({ active }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 999,
      border: `1.5px solid ${active ? T.ink : T.hairline}`,
      background: active ? T.ink : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {active && <div style={{ width: 8, height: 8, borderRadius: 999, background: '#fff' }} />}
    </div>
  );
}

function NavTop({ onBack, step }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        width: 36, height: 36, borderRadius: 999, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>{I.chevL()}</button>
      {step && <div style={{ fontSize: 13, letterSpacing: 1.5, color: T.muted, fontWeight: 600, textTransform: 'uppercase' }}>Step {step}</div>}
      <div style={{ width: 36 }} />
    </Row>
  );
}

// ── 3. Tips ─────────────────────────────────────────────────
function ScreenTips({ onContinue, onBack }) {
  const tips = [
    { ok: true,  text: 'Flat on a dark surface' },
    { ok: true,  text: 'All four corners visible' },
    { ok: true,  text: 'Sharp focus, even lighting' },
    { ok: false, text: 'No glare or shadow' },
    { ok: false, text: 'No screen shots or copies' },
  ];
  return (
    <Screen>
      <NavTop onBack={onBack} step="3 of 3" />
      <div style={{ marginTop: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>Take a clear photo</h2>
        <p style={{ margin: '8px 0 18px', color: T.muted, fontSize: 15, lineHeight: 1.4 }}>
          Position the front of your ID inside the frame.
        </p>
      </div>

      {/* Illustration */}
      <div style={{
        background: T.ink, borderRadius: 22, padding: 24,
        position: 'relative', overflow: 'hidden', height: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(60% 100% at 70% 30%, ${T.accent}33, transparent 60%)`,
        }} />
        {/* mock card */}
        <div style={{
          width: 220, height: 138, borderRadius: 14, background: '#FAF8F2',
          boxShadow: '0 18px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
          padding: 12, display: 'flex', gap: 10,
          transform: 'rotate(-3deg)',
        }}>
          <div style={{ width: 56, height: '100%', borderRadius: 6, background: '#D9D3C2' }} />
          <Stack gap={4} style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ height: 6, background: '#3a3a42', borderRadius: 3, width: '70%' }} />
            <div style={{ height: 5, background: '#aaa', borderRadius: 3, width: '90%' }} />
            <div style={{ height: 5, background: '#aaa', borderRadius: 3, width: '60%' }} />
            <div style={{ height: 5, background: '#aaa', borderRadius: 3, width: '80%' }} />
            <div style={{ flex: 1 }} />
            <div style={{ height: 5, background: '#5B47E8', borderRadius: 3, width: '40%' }} />
          </Stack>
        </div>
        {/* corner brackets */}
        {[[0,0,'tl'],[100,0,'tr'],[0,100,'bl'],[100,100,'br']].map(([x,y,k]) => (
          <Corner key={k} x={x} y={y} />
        ))}
      </div>

      <Stack gap={12} style={{ marginTop: 22 }}>
        {tips.map((t, i) => (
          <Row key={i} gap={12}>
            <div style={{
              width: 24, height: 24, borderRadius: 999,
              background: t.ok ? T.successSoft : T.errorSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {t.ok
                ? I.check(T.success, 14)
                : <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3 3 9" stroke={T.error} strokeWidth="2" strokeLinecap="round"/></svg>
              }
            </div>
            <span style={{ fontSize: 15.5, color: T.ink2, fontWeight: 500 }}>{t.text}</span>
          </Row>
        ))}
      </Stack>

      <div style={{ flex: 1 }} />
      <Button onClick={onContinue}>I'm ready</Button>
    </Screen>
  );
}

function Corner({ x, y }) {
  const isR = x > 50, isB = y > 50;
  return (
    <div style={{
      position: 'absolute',
      left: isR ? 'auto' : 18, right: isR ? 18 : 'auto',
      top: isB ? 'auto' : 18, bottom: isB ? 18 : 'auto',
      width: 22, height: 22,
      borderTop: !isB ? `2px solid ${T.accent}` : 'none',
      borderBottom: isB ? `2px solid ${T.accent}` : 'none',
      borderLeft: !isR ? `2px solid ${T.accent}` : 'none',
      borderRight: isR ? `2px solid ${T.accent}` : 'none',
      borderTopLeftRadius: !isR && !isB ? 6 : 0,
      borderTopRightRadius: isR && !isB ? 6 : 0,
      borderBottomLeftRadius: !isR && isB ? 6 : 0,
      borderBottomRightRadius: isR && isB ? 6 : 0,
    }} />
  );
}

// ── 4. Capture (camera viewfinder) ──────────────────────────
function ScreenCapture({ onShoot, onCancel, detected = true }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#0A0A0D', position: 'relative',
      overflow: 'hidden', fontFamily: T.font, color: '#fff',
    }}>
      <DynamicIsland />
      <StatusBar dark />

      {/* simulated camera feed */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 50% 20%, #2a2a30 0%, #0a0a0d 70%)',
      }} />
      {/* subtle texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 5px)`,
      }} />

      {/* top bar */}
      <Row style={{
        position: 'absolute', top: 64, left: 0, right: 0, padding: '0 18px',
        justifyContent: 'space-between', zIndex: 5,
      }}>
        <button onClick={onCancel} style={{
          background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: 999,
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(20px)',
        }}>{I.close('#fff')}</button>
        <div style={{
          padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
          letterSpacing: 0.2,
        }}>Driver's license · Front</div>
        <button style={{
          background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: 999,
          width: 40, height: 40, fontSize: 11, color: '#fff', fontWeight: 700,
          cursor: 'pointer', backdropFilter: 'blur(20px)',
        }}>HDR</button>
      </Row>

      {/* viewfinder frame */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -55%)',
        width: 320, height: 200, borderRadius: 18,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        border: detected ? `2.5px solid ${T.accent}` : '2px solid rgba(255,255,255,0.4)',
        transition: 'border-color .2s',
      }}>
        {/* corner accents */}
        {[[0,0,1,1],[1,0,0,1],[0,1,1,0],[1,1,0,0]].map(([r,b],i) => (
          <div key={i} style={{
            position: 'absolute',
            left: r ? 'auto' : -2, right: r ? -2 : 'auto',
            top: b ? 'auto' : -2, bottom: b ? -2 : 'auto',
            width: 28, height: 28,
            borderTop: !b ? `4px solid ${detected ? T.accent : '#fff'}` : 'none',
            borderBottom: b ? `4px solid ${detected ? T.accent : '#fff'}` : 'none',
            borderLeft: !r ? `4px solid ${detected ? T.accent : '#fff'}` : 'none',
            borderRight: r ? `4px solid ${detected ? T.accent : '#fff'}` : 'none',
            borderRadius: 8,
          }} />
        ))}

        {/* ID card silhouette inside viewfinder */}
        <div style={{
          position: 'absolute', inset: 24, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(91,71,232,0.06))',
          border: '1px dashed rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
        }}>
          ALIGN ID HERE
        </div>
      </div>

      {/* status text */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 'calc(50% + 70px)',
        textAlign: 'center', zIndex: 5,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 999,
          background: detected ? T.successSoft : 'rgba(0,0,0,0.5)',
          color: detected ? T.success : '#fff',
          backdropFilter: 'blur(12px)',
          fontSize: 13.5, fontWeight: 600,
        }}>
          {detected
            ? <><div style={{ width: 6, height: 6, borderRadius: 999, background: T.success }} />Document detected — hold still</>
            : <>Position your ID inside the frame</>
          }
        </div>
      </div>

      {/* shutter cluster */}
      <Row style={{
        position: 'absolute', bottom: 60, left: 0, right: 0, padding: '0 36px',
        justifyContent: 'space-between', zIndex: 5,
      }}>
        <button style={{
          width: 56, height: 56, borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="14" height="14" rx="2" stroke="#fff" strokeWidth="1.7"/>
            <path d="M7 6V4h6v2M17 9h4v8" stroke="#fff" strokeWidth="1.7"/>
          </svg>
        </button>
        <button onClick={onShoot} style={{
          width: 76, height: 76, borderRadius: 999,
          background: '#fff', border: '4px solid rgba(255,255,255,0.3)',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
          cursor: 'pointer', padding: 0,
        }} />
        <button style={{
          width: 56, height: 56, borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 16V8h4l2-3h4l2 3h4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="3.2" stroke="#fff" strokeWidth="1.7"/>
          </svg>
        </button>
      </Row>

      <HomeIndicator dark />
    </div>
  );
}

// ── 5. Review ────────────────────────────────────────────────
function ScreenReview({ onRetake, onConfirm, onBack }) {
  return (
    <Screen>
      <NavTop onBack={onBack} step="3 of 3" />
      <div style={{ marginTop: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>Looks good?</h2>
        <p style={{ margin: '8px 0 18px', color: T.muted, fontSize: 15, lineHeight: 1.4 }}>
          Make sure every line of text is readable.
        </p>
      </div>

      {/* photo preview */}
      <div style={{
        borderRadius: 22, overflow: 'hidden', background: T.ink,
        aspectRatio: '4/3', position: 'relative',
      }}>
        <MockIDPhoto />
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: T.successSoft, color: T.success, padding: '6px 10px',
          borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {I.check(T.success, 14)} Captured
        </div>
      </div>

      {/* meta */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: T.surface, borderRadius: 14, border: `1px solid ${T.hairline}` }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.muted }}>Format</span>
          <span style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>JPEG · 1.2 MB</span>
        </Row>
        <div style={{ height: 1, background: T.hairline, margin: '10px 0' }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.muted }}>Resolution</span>
          <span style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>2048 × 1365</span>
        </Row>
      </div>

      <div style={{ flex: 1 }} />

      <Stack gap={10}>
        <Button onClick={onConfirm}>Use this photo</Button>
        <Button variant="ghost" onClick={onRetake}>Retake</Button>
      </Stack>
    </Screen>
  );
}

function MockIDPhoto({ scale = 1 }) {
  // A stylized rendering of an ID — original, not branded.
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, #1a1d24 0%, #0a0a0d 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: `${82 * scale}%`, aspectRatio: '1.586/1',
        background: 'linear-gradient(135deg, #F4EEDC 0%, #E8DEC2 100%)',
        borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transform: 'rotate(-1.2deg)', position: 'relative', overflow: 'hidden',
      }}>
        {/* watermark gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(70% 80% at 80% 100%, ${T.accent}22, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        {/* photo */}
        <div style={{
          width: '32%', aspectRatio: '3/4', borderRadius: 6, flexShrink: 0,
          background: 'linear-gradient(160deg, #8a7a65 0%, #5a4a3a 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '70%', height: '55%', borderRadius: '40% 40% 12% 12%',
            background: '#3a2e22',
          }} />
          <div style={{
            position: 'absolute', top: '24%', left: '50%', transform: 'translateX(-50%)',
            width: '50%', aspectRatio: 1, borderRadius: 999,
            background: '#c2a07d',
          }} />
        </div>
        {/* text */}
        <div style={{ flex: 1, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 7, color: '#6a5430', letterSpacing: 1.5, fontWeight: 700 }}>IDENTIFICATION</div>
          <div style={{ height: 8, background: '#3a2e22', borderRadius: 2, width: '75%' }} />
          <div style={{ height: 5, background: '#6a5430', borderRadius: 2, width: '55%' }} />
          <div style={{ height: 4, background: '#a08866', borderRadius: 2, width: '85%' }} />
          <div style={{ height: 4, background: '#a08866', borderRadius: 2, width: '65%' }} />
          <div style={{ flex: 1 }} />
          <Row gap={6}>
            <div style={{ height: 4, background: '#a08866', borderRadius: 2, flex: 1 }} />
            <div style={{ height: 4, background: '#a08866', borderRadius: 2, flex: 0.6 }} />
          </Row>
        </div>
      </div>
    </div>
  );
}

// ── 6. Uploading ─────────────────────────────────────────────
function ScreenUploading({ progress = 0.42, stage = 'upload' }) {
  // stages: 'presign' | 'upload' | 'done'
  const labels = {
    presign:  'Requesting secure upload link…',
    upload:   'Uploading encrypted image…',
    done:     'Upload complete',
  };
  return (
    <Screen>
      <div style={{ marginTop: 60 }}>
        <Pill tone="accent">●  Securely sending</Pill>
      </div>

      <div style={{ marginTop: 22 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>
          {labels[stage]}
        </h2>
        <p style={{ margin: '10px 0 0', color: T.muted, fontSize: 15, lineHeight: 1.4 }}>
          Your photo is being uploaded directly to a secure storage bucket. We never see the bytes.
        </p>
      </div>

      {/* big progress */}
      <div style={{ marginTop: 36 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Progress</span>
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 14, color: T.ink, fontWeight: 600 }}>
            {Math.round(progress * 100)}%
          </span>
        </Row>
        <div style={{ height: 8, background: T.fillStrong, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: T.ink, borderRadius: 999, transition: 'width .3s',
          }} />
        </div>
      </div>

      {/* checklist */}
      <Stack gap={10} style={{ marginTop: 32 }}>
        <StepRow done label="Photo captured" />
        <StepRow done={stage !== 'presign'} active={stage === 'presign'} label="Encrypted upload link" />
        <StepRow done={stage === 'done'} active={stage === 'upload'} label="Image transferred" />
        <StepRow pending label="Verification" />
      </Stack>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 12, color: T.faint, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {I.lock(T.faint, 12)} TLS 1.3 · AES-256
      </div>
    </Screen>
  );
}

function StepRow({ done, active, pending, label }) {
  let dot;
  if (done) {
    dot = (
      <div style={{ width: 22, height: 22, borderRadius: 999, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {I.check('#fff', 14)}
      </div>
    );
  } else if (active) {
    dot = (
      <div style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${T.ink}`, position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 999,
          border: `2px solid ${T.ink}`, borderTopColor: 'transparent',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    );
  } else {
    dot = (
      <div style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${T.hairline}` }} />
    );
  }
  return (
    <Row gap={12}>
      {dot}
      <span style={{ fontSize: 15.5, fontWeight: 500, color: pending ? T.faint : T.ink }}>{label}</span>
    </Row>
  );
}

// ── 7. Verifying ─────────────────────────────────────────────
function ScreenVerifying() {
  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* radar-style animation */}
        <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 36 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: 0, borderRadius: 999,
              border: `1.5px solid ${T.accent}`,
              animation: `pulse 2.4s ease-out ${i * 0.8}s infinite`,
              opacity: 0,
            }} />
          ))}
          <div style={{
            position: 'absolute', inset: 50, borderRadius: 999,
            background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 36px rgba(20,20,26,0.25)',
          }}>{I.sparkles('#fff', 36)}</div>
        </div>

        <div style={{ fontSize: 13, letterSpacing: 1.5, color: T.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
          Step 3 of 3
        </div>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.8, textAlign: 'center' }}>
          Verifying your ID
        </h2>
        <p style={{ margin: '10px 0 0', color: T.muted, fontSize: 15, lineHeight: 1.4, textAlign: 'center', maxWidth: 280 }}>
          Reading the document and checking authenticity. This usually takes 5 – 10 seconds.
        </p>

        <Row gap={6} style={{ marginTop: 28 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 999, background: T.ink,
              animation: `bob 1.2s ease-in-out ${i * 0.15}s infinite`,
              opacity: 0.3,
            }} />
          ))}
        </Row>
      </div>
    </Screen>
  );
}

// ── 8. Approved ──────────────────────────────────────────────
function ScreenApproved({ onDone, details }) {
  const d = details || { isAdult: true, appearsAuthentic: true, imageQuality: 'good', confidence: 0.96, dob: '1995-04-10' };
  const age = computeAge(d.dob);
  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* hero */}
        <div style={{ paddingTop: 28 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22, background: T.success,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 12px 32px ${T.success}55`,
          }}>{I.check('#fff', 38)}</div>

          <h1 style={{ margin: '24px 0 0', fontSize: 34, fontWeight: 700, letterSpacing: -1.1, lineHeight: 1.05 }}>
            You're verified.
          </h1>
          <p style={{ margin: '10px 0 0', color: T.ink2, fontSize: 16, lineHeight: 1.45, maxWidth: 320 }}>
            Welcome — your access is now unlocked.
          </p>
        </div>

        {/* receipt card */}
        <div style={{
          marginTop: 32, background: T.surface, borderRadius: 20,
          border: `1px solid ${T.hairline}`, padding: '18px 18px 14px',
        }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: T.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Verification</span>
            <Pill tone="success">Approved</Pill>
          </Row>

          <ReceiptRow label="Age" value={`${age} years (adult)`} />
          <ReceiptRow label="Document" value="Driver's license" />
          <ReceiptRow label="Authenticity" value="Genuine" />
          <ReceiptRow label="Image quality" value={cap(d.imageQuality)} />
          <ReceiptRow label="Model confidence" value={
            <Row gap={8}>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{(d.confidence * 100).toFixed(1)}%</span>
              <Confidence value={d.confidence} />
            </Row>
          } />

          <div style={{ height: 1, background: T.hairline, margin: '12px -2px 10px' }} />
          <Row style={{ justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: T.faint, fontFamily: 'ui-monospace, monospace' }}>
              SID · 550e8400…40000
            </span>
            <span style={{ fontSize: 11, color: T.faint }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </Row>
        </div>

        <div style={{ marginTop: 16, padding: '12px 14px', background: T.successSoft, borderRadius: 12,
          display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {I.trash(T.success, 18)}
          <span style={{ fontSize: 13, color: T.success, lineHeight: 1.4, fontWeight: 500 }}>
            Your photo has been deleted from our servers.
          </span>
        </div>
      </div>

      <Button variant="primary" onClick={onDone}>Continue</Button>
    </Screen>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <Row style={{ justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontSize: 14, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{value}</span>
    </Row>
  );
}

function Confidence({ value }) {
  return (
    <Row gap={2}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width: 4, height: 12, borderRadius: 2,
          background: i < Math.round(value * 5) ? T.success : T.hairline,
        }} />
      ))}
    </Row>
  );
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function computeAge(dob) {
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

// ── 9–12. Rejected variants ──────────────────────────────────
function ScreenRejected({ kind, onRetry, onCancel, details }) {
  const meta = {
    underage: {
      title: "We can't verify you.",
      sub: "The document shows you're under 18. Access requires adult age.",
      icon: I.warn(T.error, 32),
      tone: 'error',
      hint: 'If this is wrong, please contact support.',
      primary: { label: 'Contact support', variant: 'primary' },
      secondary: null,
    },
    document_not_authentic: {
      title: "We couldn't trust this document.",
      sub: "The image shows signs of editing or doesn't match an expected ID format.",
      icon: I.warn(T.error, 32),
      tone: 'error',
      hint: 'Please retry with a clean, unedited photo of an original ID.',
      primary: { label: 'Try again', variant: 'primary' },
      secondary: { label: 'Contact support', variant: 'ghost' },
    },
    low_confidence: {
      title: 'Almost there.',
      sub: "We weren't quite sure about the result. A clearer photo usually fixes it.",
      icon: I.warn(T.warn, 32),
      tone: 'warn',
      hint: 'Confidence threshold: 85%.',
      primary: { label: 'Retake photo', variant: 'primary' },
      secondary: { label: 'Cancel', variant: 'ghost' },
    },
    poor_image_quality: {
      title: 'Photo is too unclear.',
      sub: 'The image is blurry, dark, or hard to read. Try again with better lighting.',
      icon: I.warn(T.warn, 32),
      tone: 'warn',
      hint: 'Tip: place the ID on a dark surface in even light.',
      primary: { label: 'Retake photo', variant: 'primary' },
      secondary: { label: 'Cancel', variant: 'ghost' },
    },
  }[kind];

  const d = details || { isAdult: false, appearsAuthentic: kind !== 'document_not_authentic', imageQuality: kind === 'poor_image_quality' ? 'poor' : 'good', confidence: kind === 'low_confidence' ? 0.71 : 0.94, dob: kind === 'underage' ? '2010-11-03' : '1995-04-10' };

  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingTop: 28 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22,
            background: meta.tone === 'error' ? T.errorSoft : T.warnSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{meta.icon}</div>

          <h1 style={{ margin: '24px 0 0', fontSize: 34, fontWeight: 700, letterSpacing: -1.1, lineHeight: 1.05 }}>
            {meta.title}
          </h1>
          <p style={{ margin: '10px 0 0', color: T.ink2, fontSize: 16, lineHeight: 1.45, maxWidth: 320, textWrap: 'pretty' }}>
            {meta.sub}
          </p>
        </div>

        {/* diagnostics */}
        <div style={{
          marginTop: 24, background: T.surface, borderRadius: 20,
          border: `1px solid ${T.hairline}`, padding: '14px 18px',
        }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: T.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>What we found</span>
            <Pill tone={meta.tone}>{kind.replace(/_/g, ' ')}</Pill>
          </Row>

          <DiagRow label="Adult (18+)"   ok={d.isAdult} />
          <DiagRow label="Authentic"     ok={d.appearsAuthentic} />
          <DiagRow label="Image quality" status={d.imageQuality} />
          <DiagRow label="Confidence"    status={d.confidence >= 0.85 ? 'good' : 'low'} value={`${(d.confidence * 100).toFixed(0)}%`} />
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
          {meta.hint}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <Stack gap={10}>
        <Button variant={meta.primary.variant} onClick={onRetry}>{meta.primary.label}</Button>
        {meta.secondary && (
          <Button variant={meta.secondary.variant} onClick={onCancel}>{meta.secondary.label}</Button>
        )}
      </Stack>
    </Screen>
  );
}

function DiagRow({ label, ok, status, value }) {
  let display, color;
  if (typeof ok === 'boolean') {
    display = ok ? 'Yes' : 'No'; color = ok ? T.success : T.error;
  } else if (status === 'good' || status === 'acceptable') {
    display = cap(status); color = T.success;
  } else if (status === 'poor' || status === 'low') {
    display = cap(status); color = T.error;
  } else {
    display = status; color = T.ink;
  }
  return (
    <Row style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.hairline}` }}>
      <span style={{ fontSize: 14, color: T.muted }}>{label}</span>
      <Row gap={8}>
        {value && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, color: T.ink2 }}>{value}</span>}
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{display}</span>
      </Row>
    </Row>
  );
}

// ── 13. Network error ───────────────────────────────────────
function ScreenError({ onRetry, onCancel, code = 'NETWORK_ERROR' }) {
  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingTop: 28 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22, background: T.fill,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M3 8.5C5.5 6 8.6 4.5 12 4.5s6.5 1.5 9 4M6 12.5c1.7-1.7 3.7-2.6 6-2.6s4.3.9 6 2.6M9 16c.9-.9 1.9-1.4 3-1.4s2.1.5 3 1.4" stroke={T.ink} strokeWidth="1.7" strokeLinecap="round"/>
              <circle cx="12" cy="19.5" r="1.2" fill={T.ink}/>
              <path d="M3 3l18 18" stroke={T.error} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 style={{ margin: '24px 0 0', fontSize: 34, fontWeight: 700, letterSpacing: -1.1, lineHeight: 1.05 }}>
            Connection lost.
          </h1>
          <p style={{ margin: '10px 0 0', color: T.ink2, fontSize: 16, lineHeight: 1.45, maxWidth: 320 }}>
            Something went wrong while reaching the verification service. Check your connection and try again.
          </p>
        </div>

        <div style={{
          marginTop: 24, background: T.surface, borderRadius: 16,
          border: `1px solid ${T.hairline}`, padding: '12px 14px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12.5,
          color: T.muted, lineHeight: 1.6,
        }}>
          <div>error: <span style={{ color: T.error }}>"Verification error"</span></div>
          <div>code: <span style={{ color: T.ink }}>"{code}"</span></div>
          <div>session: <span style={{ color: T.ink }}>"550e8400-…-440000"</span></div>
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <Stack gap={10}>
        <Button onClick={onRetry} leading={I.retry('#fff', 18)}>Try again</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel verification</Button>
      </Stack>
    </Screen>
  );
}

// Expose
Object.assign(window, {
  T, Screen, Button, Pill, I,
  ScreenIntro, ScreenDocType, ScreenTips, ScreenCapture, ScreenReview,
  ScreenUploading, ScreenVerifying, ScreenApproved, ScreenRejected, ScreenError,
  MockIDPhoto,
});
