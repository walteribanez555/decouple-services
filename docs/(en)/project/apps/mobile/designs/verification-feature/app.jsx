// app.jsx — Interactive prototype + design canvas of all states

const STAGES = [
  'intro',        // 0
  'docType',      // 1
  'tips',         // 2
  'capture',      // 3
  'review',      // 4
  'uploading',    // 5
  'verifying',    // 6
  'approved',     // 7
];

function PrototypeApp({ initial = 'intro', autoplay = false }) {
  const [stage, setStage] = React.useState(initial);
  const [docKind, setDocKind] = React.useState('license');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadStage, setUploadStage] = React.useState('presign');
  const [rejectKind, setRejectKind] = React.useState(null); // when set, render reject screen
  const [errorMode, setErrorMode] = React.useState(false);

  // Drive the uploading progress
  React.useEffect(() => {
    if (stage !== 'uploading') return;
    setUploadStage('presign');
    setUploadProgress(0);
    let p = 0;
    const t1 = setTimeout(() => { setUploadStage('upload'); }, 700);
    const id = setInterval(() => {
      p = Math.min(1, p + 0.06 + Math.random() * 0.04);
      setUploadProgress(p);
      if (p >= 1) {
        clearInterval(id);
        setUploadStage('done');
        setTimeout(() => setStage('verifying'), 500);
      }
    }, 180);
    return () => { clearTimeout(t1); clearInterval(id); };
  }, [stage]);

  // Drive verifying → result
  React.useEffect(() => {
    if (stage !== 'verifying') return;
    const t = setTimeout(() => {
      if (errorMode) { setStage('error'); return; }
      if (rejectKind) { setStage('rejected'); return; }
      setStage('approved');
    }, 2600);
    return () => clearTimeout(t);
  }, [stage, rejectKind, errorMode]);

  const reset = () => { setStage('intro'); setRejectKind(null); setErrorMode(false); };

  switch (stage) {
    case 'intro':
      return <ScreenIntro onStart={() => setStage('docType')} onSkip={reset} />;
    case 'docType':
      return <ScreenDocType selected={docKind} onPick={(k) => { setDocKind(k); setStage('tips'); }} onBack={() => setStage('intro')} />;
    case 'tips':
      return <ScreenTips onContinue={() => setStage('capture')} onBack={() => setStage('docType')} />;
    case 'capture':
      return <ScreenCapture detected onShoot={() => setStage('review')} onCancel={() => setStage('tips')} />;
    case 'review':
      return <ScreenReview onConfirm={() => setStage('uploading')} onRetake={() => setStage('capture')} onBack={() => setStage('tips')} />;
    case 'uploading':
      return <ScreenUploading progress={uploadProgress} stage={uploadStage} />;
    case 'verifying':
      return <ScreenVerifying />;
    case 'approved':
      return <ScreenApproved onDone={reset} />;
    case 'rejected':
      return <ScreenRejected kind={rejectKind} onRetry={() => setStage('capture')} onCancel={reset} />;
    case 'error':
      return <ScreenError onRetry={() => setStage('uploading')} onCancel={reset} code="NETWORK_ERROR" />;
    default:
      return <ScreenIntro onStart={() => setStage('docType')} />;
  }
}

// ── flow controller exposed at canvas level ─────────────────
function InteractiveProto() {
  const [outcome, setOutcome] = React.useState('approved');
  // outcome ∈ approved | underage | document_not_authentic | low_confidence | poor_image_quality | error
  const [key, setKey] = React.useState(0);

  // pre-stage rejectKind into a child via a context-style hack
  // simpler: re-mount with current outcome
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <ProtoDevice key={key} outcome={outcome} onRestart={() => setKey(k => k + 1)} />
      <OutcomeBar outcome={outcome} onChange={(v) => { setOutcome(v); setKey(k => k + 1); }} />
    </div>
  );
}

function ProtoDevice({ outcome, onRestart }) {
  return (
    <div style={{
      width: 402, height: 874, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: T.bg,
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: T.font,
    }}>
      <DrivenProto outcome={outcome} />
    </div>
  );
}

function DrivenProto({ outcome }) {
  // outcome drives the rejectKind / errorMode used by PrototypeApp.
  // Re-implement here so we can wire it cleanly.
  const [stage, setStage] = React.useState('intro');
  const [docKind, setDocKind] = React.useState('license');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadStage, setUploadStage] = React.useState('presign');

  React.useEffect(() => {
    if (stage !== 'uploading') return;
    setUploadStage('presign');
    setUploadProgress(0);
    let p = 0;
    const t1 = setTimeout(() => setUploadStage('upload'), 600);
    const id = setInterval(() => {
      p = Math.min(1, p + 0.07 + Math.random() * 0.04);
      setUploadProgress(p);
      if (p >= 1) {
        clearInterval(id);
        setUploadStage('done');
        setTimeout(() => setStage('verifying'), 450);
      }
    }, 160);
    return () => { clearTimeout(t1); clearInterval(id); };
  }, [stage]);

  React.useEffect(() => {
    if (stage !== 'verifying') return;
    const t = setTimeout(() => {
      if (outcome === 'approved') setStage('approved');
      else if (outcome === 'error') setStage('error');
      else setStage('rejected');
    }, 2400);
    return () => clearTimeout(t);
  }, [stage, outcome]);

  const reset = () => setStage('intro');

  switch (stage) {
    case 'intro':      return <ScreenIntro onStart={() => setStage('docType')} onSkip={reset} />;
    case 'docType':    return <ScreenDocType selected={docKind} onPick={(k) => { setDocKind(k); setStage('tips'); }} onBack={() => setStage('intro')} />;
    case 'tips':       return <ScreenTips onContinue={() => setStage('capture')} onBack={() => setStage('docType')} />;
    case 'capture':    return <ScreenCapture detected onShoot={() => setStage('review')} onCancel={() => setStage('tips')} />;
    case 'review':     return <ScreenReview onConfirm={() => setStage('uploading')} onRetake={() => setStage('capture')} onBack={() => setStage('tips')} />;
    case 'uploading':  return <ScreenUploading progress={uploadProgress} stage={uploadStage} />;
    case 'verifying':  return <ScreenVerifying />;
    case 'approved':   return <ScreenApproved onDone={reset} />;
    case 'rejected':   return <ScreenRejected kind={outcome} onRetry={() => setStage('capture')} onCancel={reset} />;
    case 'error':      return <ScreenError onRetry={() => setStage('uploading')} onCancel={reset} code="NETWORK_ERROR" />;
    default:           return <ScreenIntro onStart={() => setStage('docType')} />;
  }
}

function OutcomeBar({ outcome, onChange }) {
  const opts = [
    { id: 'approved',                label: 'Approved' },
    { id: 'underage',                label: 'Underage' },
    { id: 'document_not_authentic',  label: 'Not authentic' },
    { id: 'low_confidence',          label: 'Low confidence' },
    { id: 'poor_image_quality',      label: 'Poor quality' },
    { id: 'error',                   label: 'Network error' },
  ];
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8,
      background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
      fontFamily: T.font, maxWidth: 402,
    }}>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '6px 10px', width: '100%' }}>
        Simulate API outcome
      </div>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '7px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          background: o.id === outcome ? T.ink : T.fill,
          color: o.id === outcome ? '#fff' : T.ink, border: 'none',
          cursor: 'pointer', fontFamily: T.font,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, { PrototypeApp, InteractiveProto, ProtoDevice, DrivenProto, OutcomeBar });
