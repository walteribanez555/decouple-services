// canvas.jsx — Lays out the prototype + every static screen state.

const DEVICE_W = 402;
const DEVICE_H = 874;

function FramedScreen({ children }) {
  return (
    <div style={{
      width: DEVICE_W, height: DEVICE_H, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: T.bg,
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: T.font,
    }}>{children}</div>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="flow" title="Age verification — interactive prototype" subtitle="Tap through the full flow. Switch the simulated API outcome with the buttons below the phone.">
        <DCArtboard id="proto" label="Live prototype" width={460} height={970}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 16, padding: '0 0 20px' }}>
            <InteractiveProto />
          </div>
        </DCArtboard>
      </DCSection>

      <DCSection id="onboarding" title="Onboarding" subtitle="Pre-capture — explainer, document pick, photo tips">
        <DCArtboard id="s-intro" label="01 · Intro" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenIntro onStart={() => {}} onSkip={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-doctype" label="02 · Document type" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenDocType selected="license" onPick={() => {}} onBack={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-tips" label="03 · Photo tips" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenTips onContinue={() => {}} onBack={() => {}} /></FramedScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="capture" title="Capture" subtitle="Camera viewfinder + photo review">
        <DCArtboard id="s-capture" label="04 · Camera (detected)" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenCapture detected /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-capture-empty" label="04b · Camera (searching)" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenCapture detected={false} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-review" label="05 · Review photo" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenReview onConfirm={() => {}} onRetake={() => {}} onBack={() => {}} /></FramedScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="loading" title="Upload + verify" subtitle="The two-step S3 → /verify pattern">
        <DCArtboard id="s-presign" label="06 · Presign request" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenUploading progress={0.05} stage="presign" /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-upload" label="07 · S3 upload" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenUploading progress={0.62} stage="upload" /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-verify" label="08 · Verifying" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenVerifying /></FramedScreen>
        </DCArtboard>
      </DCSection>

      <DCSection id="results" title="Results" subtitle="200 Approved · 422 Rejected (4 reason codes) · 5xx Error">
        <DCArtboard id="s-approved" label="09 · Approved (200)" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenApproved onDone={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-underage" label="10 · Underage" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenRejected kind="underage" onRetry={() => {}} onCancel={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-notauth" label="11 · Not authentic" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenRejected kind="document_not_authentic" onRetry={() => {}} onCancel={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-lowconf" label="12 · Low confidence" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenRejected kind="low_confidence" onRetry={() => {}} onCancel={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-poorquality" label="13 · Poor image quality" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenRejected kind="poor_image_quality" onRetry={() => {}} onCancel={() => {}} /></FramedScreen>
        </DCArtboard>
        <DCArtboard id="s-error" label="14 · Network error" width={DEVICE_W} height={DEVICE_H}>
          <FramedScreen><ScreenError onRetry={() => {}} onCancel={() => {}} code="NETWORK_ERROR" /></FramedScreen>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
