"use client";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Download,
  AudioLines,
  MessageSquare,
  ScanLine,
  Clock3,
  Info,
  Link2,
  ChevronDown,
  LoaderCircle,
  HeartHandshake,
  LockKeyhole,
  Sparkles,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "@/hooks/use-session";
import { Waveform } from "@/components/waveform";
import { AttachmentPanel } from "@/components/attachment-panel";
import { SafetyPanel } from "@/components/safety-panel";
import { Language } from "@/lib/analysis";
import { DemoScenario, demoScenarios } from "@/lib/demo";
import { references, safetySteps, SafetyStage } from "@/lib/safety";
const labels = {
  en: {
    title: "A second opinion.",
    accent: "Before the next step.",
    idle: "A little space to think clearly.",
    low: "Nothing worrying so far",
    watch: "Something feels off. Let’s check.",
    high: "Pause. This could be a scam.",
    start: "Start listening",
    stop: "Stop listening",
    help: "Help me stay safe",
  },
  hi: {
    title: "एक दूसरी राय।",
    accent: "अगला कदम उठाने से पहले।",
    idle: "सोचने के लिए थोड़ा समय लें।",
    low: "अभी तक कोई चिंताजनक संकेत नहीं",
    watch: "कुछ ठीक नहीं लग रहा। जाँचें।",
    high: "रुकिए। यह धोखाधड़ी हो सकती है।",
    start: "सुनना शुरू करें",
    stop: "सुनना बंद करें",
    help: "सुरक्षित रहने में मदद करें",
  },
  te: {
    title: "మరో అభిప్రాయం.",
    accent: "తదుపరి అడుగు ముందు.",
    idle: "ప్రశాంతంగా ఆలోచించేందుకు సమయం.",
    low: "ఇప్పటివరకు ఆందోళనకరమైన సంకేతాలు లేవు",
    watch: "ఏదో తేడాగా ఉంది. పరిశీలిద్దాం.",
    high: "ఆగండి. ఇది మోసం కావచ్చు.",
    start: "వినడం ప్రారంభించండి",
    stop: "వినడం ఆపండి",
    help: "సురక్షితంగా ఉండటానికి సహాయం",
  },
};
const signalLabels: Record<string, string> = {
  authority: "An identity claim",
  urgency: "Pressure to act",
  isolation: "A request for secrecy",
  credential_request: "A private code requested",
  payment_request: "A payment request",
  remote_access: "Access to your device",
  suspicious_link: "An unexpected link",
};
export default function Home() {
  const [locale, setLocale] = useState("en"),
    [closest, setClosest] = useState<Language>("hi");
  const language: Language = locale === "auto" ? closest : (locale as Language);
  const t = labels[language];
  const session = useSession(language);
  const [draft, setDraft] = useState(""),
    [inputMode, setInputMode] = useState<"voice" | "text">("voice"),
    [scenario, setScenario] = useState<DemoScenario>("qr"),
    [safety, setSafety] = useState(false),
    [showHow, setShowHow] = useState(false),
    [panelTab, setPanelTab] = useState<"timeline" | "transcript">("timeline");
  const reduced = useReducedMotion(),
    workspace = useRef<HTMLElement>(null),
    transcriptEnd = useRef<HTMLDivElement>(null);
  const { analysis, demo, active, checking, artifacts, history, segments } =
    session;
  const level = analysis?.level || (session.cue ? "watch" : "low");
  useEffect(() => {
    if (panelTab === "transcript")
      transcriptEnd.current?.scrollIntoView({
        block: "nearest",
        behavior: "auto",
      });
  }, [segments.length, session.interim, panelTab]);
  function reset() {
    session.reset();
    setDraft("");
    setInputMode("voice");
  }
  function startDemo() {
    setDraft("");
    setInputMode("voice");
    setPanelTab("timeline");
    void session.startDemo(scenario);
    workspace.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }
  function save(stage: SafetyStage = "paused") {
    const report = {
      product: "ScamShield",
      version: 2,
      sessionType: demo ? "SAMPLE CONVERSATION — NOT LIVE" : "user session",
      createdAt: new Date().toISOString(),
      locale,
      recognitionLanguage: language,
      transcript: segments,
      attachments: artifacts,
      assessment: analysis ?? "unknown",
      evidenceTimeline: history,
      latestCheckSource: session.lastSource ?? "unknown",
      earlierWarningRetained: session.held,
      nextSteps: safetySteps[stage][language],
      references,
      note: "Personal record only. Not submitted to a bank or authority. Attachment text is user-confirmed; payee identity is unknown.",
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `scamshield-${demo ? "SAMPLE-" : ""}${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return (
    <main className={`app risk-${level}`}>
      <header className="nav">
        <a href="/" className="brand">
          <span className="brand-mark">
            <ShieldCheck size={25} />
          </span>
          ScamShield<span className="version-badge">02</span>
        </a>
        <div className="nav-links">
          <span className="privacy-tag">
            <LockKeyhole size={13} /> Private by choice.
          </span>
          <button className="text-button" onClick={() => setShowHow((v) => !v)}>
            How it works <ArrowUpRight size={15} />
          </button>
          <button
            className="nav-demo"
            onClick={startDemo}
            disabled={!!demo?.running}
          >
            <Play size={13} fill="currentColor" /> Try a demo
          </button>
        </div>
      </header>
      {showHow && (
        <section className="how-panel">
          <div>
            <strong>01 · Listen with permission</strong>
            <p>
              Speak near the microphone or type a conversation. Browser speech
              recognition may use your browser vendor’s service.
            </p>
          </div>
          <div>
            <strong>02 · Connect the evidence</strong>
            <p>
              Confirm screenshot text or decode a QR on-device. Transcript and
              confirmed text go to Gemini/Groq; screenshots go to Gemini only
              with consent.
            </p>
          </div>
          <div>
            <strong>03 · Choose your next step</strong>
            <p>
              Review the evidence and guidance. We don’t intercept cellular
              calls, verify payees, save audio, or contact anyone for you.
            </p>
          </div>
        </section>
      )}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot" /> YOUR CALM IN A CONCERNING CONVERSATION
          </div>
          <h1 lang={language}>
            {t.title}
            <br />
            <em>{t.accent}</em>
          </h1>
          <p>
            When a call feels urgent, you deserve a moment of clarity.
            <br className="desktop-break" /> Listen, check what they sent, and
            decide with confidence.
          </p>
          <div className="hero-pills">
            <span>
              <AudioLines size={13} /> Voice
            </span>
            <span>
              <ScanLine size={13} /> Messages & QR
            </span>
            <span>अ · తెలుగు · English</span>
          </div>
        </div>
        <div className="demo-invite">
          <div className="demo-invite-top">
            <span className="sun-icon">
              <Sparkles size={19} />
            </span>
            <span className="eyebrow">SEE THE MOMENT IT CLICKS</span>
            <span className="duration">~30s</span>
          </div>
          <h2>
            A harmless call.{" "}
            <br />
            An unexpected turn.
          </h2>
          <p>
            Watch ScamShield connect a caller’s words with what they actually
            ask you to do.
          </p>
          <div className="demo-picker">
            <select
              aria-label="Demo scenario"
              value={scenario}
              disabled={!!demo?.running}
              onChange={(e) => setScenario(e.target.value as DemoScenario)}
            >
              {Object.entries(demoScenarios).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
          <button
            className="demo-launch"
            disabled={!!demo?.running}
            onClick={startDemo}
          >
            <span className="play-circle">
              <Play size={13} fill="currentColor" />
            </span>
            {demo?.running ? "Demo in progress…" : "Play the guided demo"}
            <ArrowRight size={16} />
          </button>
          <small>Synthetic conversation. Real analysis. No microphone.</small>
        </div>
      </section>
      <div className="journey">
        <span>
          <i>01</i> Listen to the conversation
        </span>
        <ArrowRight size={15} />
        <span>
          <i>02</i> Connect the evidence
        </span>
        <ArrowRight size={15} />
        <span>
          <i>03</i> Take a safer next step
        </span>
      </div>
      <section className="workspace" ref={workspace}>
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">YOUR LISTENING SPACE</span>
            <h2>A clearer picture, as it happens.</h2>
          </div>
          <div className="workspace-settings">
            <label>
              <span className="language-symbol">अ</span>
              <select
                aria-label="Conversation language"
                disabled={active || session.starting || !!demo}
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
              >
                <option value="en">English (India)</option>
                <option value="hi">हिन्दी</option>
                <option value="te">తెలుగు</option>
                <option value="auto">Auto / mixed</option>
              </select>
            </label>
            <button
              className="voice-switch"
              aria-pressed={session.voice}
              onClick={session.toggleVoice}
            >
              {session.voice ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>Voice {session.voice ? "on" : "off"}</span>
              <i className={session.voice ? "on" : ""} />
            </button>
            <button
              className="icon-button"
              aria-label="New session"
              onClick={reset}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        {locale === "auto" && (
          <div className="notice neutral">
            <Info size={16} />
            <span>
              Mixed-language analysis is supported. Choose the closest language
              for browser speech recognition:
            </span>
            <select
              aria-label="Closest speech language"
              disabled={active || !!demo}
              value={closest}
              onChange={(e) => setClosest(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </div>
        )}
        {session.voice &&
          session.voices.length > 0 &&
          !session.supportedVoice && (
            <div className="notice neutral">
              <VolumeX size={16} />
              <span>
                No{" "}
                {language === "te"
                  ? "Telugu"
                  : language === "hi"
                    ? "Hindi"
                    : "English"}{" "}
                voice is installed. The warning remains visible.
              </span>
              <button onClick={() => session.setVoiceLanguage("en")}>
                Use English voice
              </button>
            </div>
          )}
        {session.voiceLanguage && session.voiceLanguage !== language && (
          <div className="small-notice">
            Voice warnings use English; on-screen assessment follows your
            selected language.{" "}
            <button onClick={() => session.setVoiceLanguage(null)}>
              Reset voice language
            </button>
          </div>
        )}
        {demo && (
          <div className="demo-banner" role="status">
            <span className="sample-stamp">SAMPLE CONVERSATION — NOT LIVE</span>
            <span>
              {demoScenarios[demo.scenario].title} ·{" "}
              {demo.running
                ? `Step ${demo.step} of ${demo.scenario === "qr" ? 4 : 3}`
                : "Demo stopped / complete"}
            </span>
            <div>
              {demo.running ? (
                <button onClick={session.pauseDemo}>
                  <Square size={13} /> Stop demo
                </button>
              ) : (
                <button onClick={() => void session.startDemo(demo.scenario)}>
                  <RotateCcw size={13} /> Replay
                </button>
              )}
              <button onClick={reset}>
                Exit demo <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        )}
        <div className="workspace-grid">
          <div className="session-column">
            <section className="card listening-card">
              <div className="listening-top">
                <span className="live-chip">
                  <span className="dot" />
                  {session.speaking
                    ? "SPEAKING A WARNING"
                    : demo
                      ? "SAMPLE INPUT"
                      : active
                        ? "MICROPHONE LIVE"
                        : "READY WHEN YOU ARE"}
                </span>
                <span className="session-time">
                  <Clock3 size={12} />
                  {String(Math.floor(session.elapsed / 60)).padStart(2, "0")}:
                  {String(session.elapsed % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="wave-stage">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="wave-symbol">
                  <AudioLines size={26} />
                </span>
                <Waveform
                  analyser={session.analyser}
                  level={level}
                  active={active}
                />
                <span className="wave-subtitle">
                  {demo
                    ? "Sample text · microphone is off"
                    : active
                      ? "Your voice. A little more clarity."
                      : "Space to listen. Room to breathe."}
                </span>
              </div>
              <div className="assessment" aria-live="polite">
                <span className="assessment-tag">
                  <span className="dot" />
                  {analysis
                    ? level === "high"
                      ? "PLEASE PAUSE"
                      : level === "watch"
                        ? "WORTH A CLOSER LOOK"
                        : "NO STRONG SIGNALS"
                    : "HERE WITH YOU"}
                </span>
                <h2 lang={language}>
                  {analysis
                    ? t[level as keyof Pick<typeof t, "low" | "watch" | "high">]
                    : t.idle}
                </h2>
                <p lang={analysis?.outputLanguage || "en"}>
                  {analysis?.explanation ||
                    (session.cue
                      ? "A potential cue appeared. Waiting for a complete, finalized statement."
                      : "We look for pressure and unusual requests, not just suspicious words.")}
                </p>
                {session.held && (
                  <small>
                    An earlier high-risk warning is retained until a new
                    session.
                  </small>
                )}
              </div>
              {!demo && (
                <>
                  <div className="input-tabs">
                    <button
                      className={inputMode === "voice" ? "selected" : ""}
                      onClick={() => setInputMode("voice")}
                    >
                      <Mic size={14} /> Listen live
                    </button>
                    <button
                      className={inputMode === "text" ? "selected" : ""}
                      onClick={() => {
                        session.stop();
                        setInputMode("text");
                      }}
                    >
                      <MessageSquare size={14} /> Type a conversation
                    </button>
                  </div>
                  {inputMode === "voice" ? (
                    <div className="listen-actions">
                      <button
                        className="button primary"
                        onClick={active ? session.stop : session.start}
                        disabled={
                          session.starting || (!active && session.speaking)
                        }
                      >
                        {active ? (
                          <MicOff size={17} />
                        ) : session.starting ? (
                          <LoaderCircle size={17} className="spin" />
                        ) : (
                          <Mic size={17} />
                        )}{" "}
                        {session.starting
                          ? "Connecting…"
                          : active
                            ? t.stop
                            : t.start}
                        {!active && <ArrowRight size={16} />}
                      </button>
                      {session.starting && (
                        <button className="text-button" onClick={session.stop}>
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <form
                      className="typed-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        session.addText(draft);
                        setDraft("");
                        setPanelTab("transcript");
                      }}
                    >
                      <label
                        className="field-label"
                        htmlFor="conversation-input"
                      >
                        Type exactly what was said
                      </label>
                      <textarea
                        id="conversation-input"
                        placeholder="For example, ‘They said my account would be blocked…’"
                        value={draft}
                        maxLength={4000}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                      />
                      <button
                        className="button primary"
                        disabled={!draft.trim()}
                      >
                        Check these words <ArrowRight size={16} />
                      </button>
                    </form>
                  )}
                </>
              )}
              {demo && (
                <div className="demo-progress">
                  <div>
                    {Array.from(
                      { length: demo.scenario === "qr" ? 4 : 3 },
                      (_, i) => (
                        <span
                          key={i}
                          className={i < demo.step ? "complete" : ""}
                        />
                      ),
                    )}
                  </div>
                  <p>
                    {checking
                      ? "The model is checking the observed evidence…"
                      : demo.running
                        ? "The next sample is coming…"
                        : "Try another scenario, or exit to use your own conversation."}
                  </p>
                </div>
              )}
              <div className="listening-consent">
                <LockKeyhole size={12} />
                <span>
                  Audio is not saved by ScamShield. Finalized words are sent for
                  analysis. Listening is always your choice.
                </span>
              </div>
              <div className="session-mode">
                <span>
                  {checking ? (
                    <LoaderCircle size={13} className="spin" />
                  ) : (
                    <span className="dot" />
                  )}
                  {checking
                    ? "Checking the evidence…"
                    : session.lastSource === "local_rules"
                      ? "Basic protection · AI unavailable"
                      : session.lastSource
                        ? `${session.lastSource === "gemini" ? "Gemini" : "Groq"} · latest AI check`
                        : "Ready for your first words"}
                </span>
                {session.latency !== null && (
                  <span>{(session.latency / 1000).toFixed(1)}s last check</span>
                )}
              </div>
            </section>
            {analysis?.interventionRequired && (
              <motion.section
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="intervention"
                role="alert"
              >
                <span className="icon-tile">
                  <ShieldCheck size={23} />
                </span>
                <div>
                  <span className="eyebrow">A MOMENT TO PAUSE</span>
                  <p lang={language}>{analysis.warningText}</p>
                  <div>
                    <button
                      className="button primary"
                      onClick={() => setSafety(true)}
                    >
                      {t.help}
                      <ArrowRight size={15} />
                    </button>
                    <button
                      className="text-button"
                      disabled={!session.voice}
                      onClick={() => session.speak()}
                    >
                      <Volume2 size={15} /> Replay warning
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
            <section className="card evidence-card">
              <div className="evidence-header">
                <div className="segmented">
                  <button
                    className={panelTab === "timeline" ? "selected" : ""}
                    onClick={() => setPanelTab("timeline")}
                  >
                    <GitBranch size={15} /> Evidence timeline{" "}
                    <span>{history.length}</span>
                  </button>
                  <button
                    className={panelTab === "transcript" ? "selected" : ""}
                    onClick={() => setPanelTab("transcript")}
                  >
                    <MessageSquare size={15} /> Conversation{" "}
                    <span>{segments.length}</span>
                  </button>
                </div>
              </div>
              {panelTab === "timeline" ? (
                <div className="timeline" aria-live="polite">
                  {history.length === 0 ? (
                    <div className="empty-state">
                      <span className="icon-tile">
                        <GitBranch size={22} />
                      </span>
                      <h3>The story, not just a score.</h3>
                      <p>
                        As the conversation develops, important requests and
                        their exact words will appear here.
                      </p>
                      <div className="empty-timeline">
                        <span />
                        <i />
                        <span />
                        <i />
                        <span />
                      </div>
                    </div>
                  ) : (
                    history.map((e, i) => (
                      <article className="timeline-event" key={e.id}>
                        <span className="timeline-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="event-meta">
                            <strong>{signalLabels[e.signal]}</strong>
                            <span>
                              {e.origin === "attachment"
                                ? "ATTACHMENT"
                                : "CONVERSATION"}{" "}
                              ·{" "}
                              {new Date(e.at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <blockquote lang={language}>“{e.quote}”</blockquote>
                          <p>
                            <span>
                              {e.source === "local_rules"
                                ? "Rule interpretation"
                                : "AI interpretation"}
                            </span>
                            {e.why}
                          </p>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              ) : (
                <div
                  className="transcript"
                  role="log"
                  aria-label="Conversation transcript"
                >
                  {!segments.length && !session.interim ? (
                    <div className="empty-state">
                      <span className="icon-tile">
                        <MessageSquare size={22} />
                      </span>
                      <h3>Every word adds context.</h3>
                      <p>
                        Start listening or type a conversation. Only finalized
                        words become evidence.
                      </p>
                    </div>
                  ) : (
                    segments.map((s) => (
                      <article
                        className={
                          "transcript-segment " +
                          (s.mode === "sample" ? "sample" : "")
                        }
                        key={s.id}
                      >
                        <div>
                          <span>
                            {s.mode === "sample"
                              ? "SYNTHETIC SAMPLE"
                              : s.mode === "typed"
                                ? "TYPED INPUT"
                                : "HEARD NEAR YOUR MICROPHONE"}
                          </span>
                          <time>
                            {new Date(s.at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                        <p lang={language}>{s.text}</p>
                        {s.uncertain && (
                          <small>
                            Recognition confidence was low. Please verify what
                            was heard.
                          </small>
                        )}
                      </article>
                    ))
                  )}
                  {session.interim && (
                    <p className="interim">
                      {session.interim}
                      <small>Provisional · not yet evidence</small>
                    </p>
                  )}
                  <div ref={transcriptEnd} />
                </div>
              )}
              <div className="card-foot">
                <Info size={13} /> Timeline shows first observation.
                Interpretations may change as context grows.
              </div>
            </section>
          </div>
          <aside className="evidence-column">
            <AttachmentPanel
              key={`${demo ? "demo" : "live"}-${session.sessionId}`}
              artifacts={artifacts}
              onAdd={session.addArtifact}
              onRemove={session.removeArtifact}
              disabled={!!demo}
            />
            <section
              className={
                "card connections-card " +
                (analysis?.connections.length ? "has-connections" : "")
              }
            >
              <div className="card-title">
                <span className="icon-tile">
                  <Link2 size={18} />
                </span>
                <div>
                  <h2>Connecting the dots</h2>
                  <p>What was said. What was sent.</p>
                </div>
              </div>
              {analysis?.connections.length ? (
                analysis.connections.map((c, i) => (
                  <div className="connection" key={i}>
                    <span className="field-label">THE CALLER SAID</span>
                    <blockquote>“{c.conversationQuote}”</blockquote>
                    <div className="connection-thread">
                      <span />
                      <Link2 size={14} />
                      <span />
                    </div>
                    <span className="field-label">THE ATTACHMENT SHOWS</span>
                    <blockquote>“{c.artifactQuote}”</blockquote>
                    <p>
                      <Sparkles size={15} />
                      {c.explanation}
                    </p>
                    <small>
                      AI interpretation · both quotes matched to supplied
                      evidence
                    </small>
                  </div>
                ))
              ) : (
                <div className="connection-empty">
                  <div>
                    <MessageSquare size={18} />
                    <span />
                    <ScanLine size={18} />
                  </div>
                  <p>
                    {artifacts.length
                      ? "No supported cross-source connection yet. More context may be needed."
                      : "Add what they sent. We’ll check it alongside the conversation."}
                  </p>
                </div>
              )}
              {analysis?.uncertainties.length ? (
                <div className="uncertainties">
                  <strong>
                    <Info size={13} /> What we don’t know
                  </strong>
                  {analysis.uncertainties.map((u, i) => (
                    <p key={i}>{u}</p>
                  ))}
                </div>
              ) : null}
            </section>
            <section className="reference-card">
              <span className="eyebrow">A USEFUL REMINDER</span>
              <p>
                Receiving money should not require you to share an OTP or enter
                your PIN.
              </p>
              <a href={references[1].url} target="_blank" rel="noreferrer">
                Read the RBI guidance <ExternalLink size={12} />
              </a>
            </section>
          </aside>
        </div>
        {session.notice && (
          <div className="notice" role="status">
            <Info size={17} />
            <span>{session.notice}</span>
            <button
              aria-label="Dismiss notice"
              onClick={() => session.setNotice("")}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="workspace-footer">
          <span>
            <LockKeyhole size={13} /> Session stays in memory. Save only if you
            choose.
          </span>
          <button
            onClick={() => save()}
            disabled={!segments.length && !artifacts.length}
          >
            <Download size={14} /> Save what happened
          </button>
        </div>
      </section>
      <section className="reassurance">
        <div className="icon-tile large">
          <HeartHandshake size={27} />
        </div>
        <div>
          <h2>You don’t have to decide under pressure.</h2>
          <p>It’s always okay to pause, hang up, and double-check.</p>
        </div>
        <button className="button secondary" onClick={() => setSafety(true)}>
          {t.help}
          <ArrowUpRight size={16} />
        </button>
      </section>
      <footer className="page-footer">
        <span>
          <ShieldCheck size={14} /> BUILT FOR REAL CONVERSATIONS.
        </span>
        <span>A little pause. A lot of protection.</span>
        <a
          href="https://github.com/royal-eng/manoj_bitsom"
          target="_blank"
          rel="noreferrer"
        >
          Open source <ArrowUpRight size={12} />
        </a>
      </footer>
      {safety && (
        <SafetyPanel
          language={language}
          onClose={() => setSafety(false)}
          onSave={save}
          onStop={session.stop}
          active={active}
        />
      )}
    </main>
  );
}
