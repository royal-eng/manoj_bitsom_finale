"use client";
import { useEffect, useRef, useState } from "react";
import {
  Analysis,
  Language,
  analysisSchema,
  contextualWarning,
  localAnalysis,
} from "@/lib/analysis";
import { Artifact, artifactContext, inspectPayload } from "@/lib/artifacts";
import { DemoScenario, demoScenarios } from "@/lib/demo";
import { prepareImage } from "@/lib/image-input";
export type Segment = {
  id: string;
  text: string;
  at: string;
  mode: "typed" | "microphone" | "sample";
  uncertain?: boolean;
};
export type EvidenceEvent = Analysis["evidence"][number] & {
  id: string;
  at: string;
  source: Analysis["source"];
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: {
          length: number;
          [n: number]: {
            isFinal: boolean;
            [n: number]: { transcript: string; confidence: number };
          };
        };
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
export function useSession(language: Language) {
  const [segments, setSegments] = useState<Segment[]>([]),
    [artifacts, setArtifacts] = useState<Artifact[]>([]),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [history, setHistory] = useState<EvidenceEvent[]>([]),
    [lastSource, setLastSource] = useState<Analysis["source"] | null>(null),
    [held, setHeld] = useState(false),
    [checking, setChecking] = useState(false),
    [latency, setLatency] = useState<number | null>(null);
  const [active, setActive] = useState(false),
    [starting, setStarting] = useState(false),
    [interim, setInterim] = useState(""),
    [notice, setNotice] = useState(""),
    [voice, setVoice] = useState(true),
    [voiceLanguage, setVoiceLanguage] = useState<Language | null>(null),
    [speaking, setSpeaking] = useState(false),
    [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [elapsed, setElapsed] = useState(0);
  const [demo, setDemo] = useState<{
    scenario: DemoScenario;
    step: number;
    running: boolean;
  } | null>(null);
  const analyser = useRef<AnalyserNode | null>(null),
    context = useRef<AudioContext | null>(null),
    stream = useRef<MediaStream | null>(null),
    recognition = useRef<Recognition | null>(null),
    wanted = useRef(false),
    talking = useRef(false),
    restart = useRef<ReturnType<typeof setTimeout> | null>(null),
    speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    restartCount = useRef(0),
    startToken = useRef(0),
    epoch = useRef(0),
    seq = useRef(0),
    request = useRef<AbortController | null>(null),
    warned = useRef(false),
    demoMode = useRef(false),
    lastRequest = useRef(0),
    evidenceRef = useRef<EvidenceEvent[]>([]),
    analysisRef = useRef<Analysis|null>(null),
    speechToken = useRef(0);
  const actualVoiceLanguage = voiceLanguage || language;
  const supportedVoice = voices.find((v) =>
    v.lang.toLowerCase().startsWith(actualVoiceLanguage),
  );
  const text = segments.map((s) => s.text).join("\n");
  function stop() {
    wanted.current = false;
    startToken.current++;
    if (restart.current) clearTimeout(restart.current);
    const r = recognition.current;
    recognition.current = null;
    r?.abort();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void context.current?.close();
    context.current = null;
    analyser.current = null;
    setActive(false);
    setStarting(false);
    setInterim("");
  }
  function cancelSpeech() {
    speechToken.current++;
    if (speechTimer.current) clearTimeout(speechTimer.current);
    window.speechSynthesis?.cancel();
    talking.current = false;
    setSpeaking(false);
  }
  function reset() {
    analysisRef.current=null;
    epoch.current++;
    seq.current++;
    demoMode.current = false;
    request.current?.abort();
    stop();
    cancelSpeech();
    setDemo(null);
    setSegments([]);
    setArtifacts([]);
    setAnalysis(null);
    setHistory([]);
    evidenceRef.current = [];
    setLastSource(null);
    setHeld(false);
    setChecking(false);
    setNotice("");
    setElapsed(0);
    setLatency(null);
    warned.current = false;
  }
  function speak(result = analysis) {
    if (!voice || !result?.interventionRequired) return;
    const synth = window.speechSynthesis;
    if (!synth) {
      setNotice("Voice playback is unavailable. Read the warning below.");
      return;
    }
    const v = synth
      .getVoices()
      .find((v) => v.lang.startsWith(actualVoiceLanguage));
    if (!v) {
      setNotice(
        "No voice for the selected language is installed. Choose the English voice option or read the warning.",
      );
      return;
    }
    cancelSpeech();
    const token = ++speechToken.current;
    talking.current = true;
    setSpeaking(true);
    if (restart.current) clearTimeout(restart.current);
    recognition.current?.abort();
    const utterance = new SpeechSynthesisUtterance(
      contextualWarning(result.signals, actualVoiceLanguage),
    );
    utterance.voice = v;
    utterance.lang = v.lang;
    utterance.rate = 0.93;
    const finish = () => {
      if (token !== speechToken.current) return;
      speechToken.current++;
      if (speechTimer.current) clearTimeout(speechTimer.current);
      talking.current = false;
      setSpeaking(false);
      if (wanted.current)
        restart.current = setTimeout(() => {
          if (wanted.current && !talking.current)
            try {
              recognition.current?.start();
            } catch {
              setNotice("Please restart listening.");
            }
        }, 600);
    };
    utterance.onend = finish;
    utterance.onerror = () => {
      setNotice(
        "Voice playback did not complete. The warning remains visible.",
      );
      finish();
    };
    speechTimer.current = setTimeout(() => {
      synth.cancel();
      finish();
    }, 25000);
    synth.speak(utterance);
  }
  function toggleVoice() {
    if (voice) {
      cancelSpeech();
      if (wanted.current)
        restart.current = setTimeout(() => {
          if (wanted.current)
            try {
              recognition.current?.start();
            } catch {}
        }, 500);
    }
    setVoice((v) => !v);
  }
  useEffect(() => {
    const update = () => setVoices(window.speechSynthesis?.getVoices() || []);
    update();
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    return () => {
      epoch.current++;
      seq.current++;
      stop();
      request.current?.abort();
      cancelSpeech();
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [active]);
  useEffect(() => {
    if (analysis?.interventionRequired && !warned.current) {
      warned.current = true;
      speak(analysis);
    }
  }, [analysis]);
  function accept(result: Analysis) {
    setLastSource(result.source);
    const retain=analysisRef.current?.level==='high'&&result.level!=='high';
    setHeld(retain);
    if(!retain){analysisRef.current=result;setAnalysis(result)}
      const next = [...evidenceRef.current];
      for (const e of result.evidence) {
        const id = `${e.origin || "conversation"}:${e.signal}:${e.quote.toLowerCase()}`;
        if (!next.some((p) => p.id === id))
          next.push({
            ...e,
            id,
            at: new Date().toISOString(),
            source: result.source,
          });
      }
      evidenceRef.current = next.slice(-40);
      setHistory(evidenceRef.current);
  }
  async function perform(
    words: string,
    attachments: Artifact[],
    currentEpoch = epoch.current,
  ) {
    const id = ++seq.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setChecking(true);
    const began = performance.now();
    lastRequest.current = Date.now();
    const earlier = evidenceRef.current
      .filter((e) => e.origin !== "attachment")
      .map((e) => {
        const at = words.toLowerCase().indexOf(e.quote.toLowerCase());
        return at < 0
          ? ""
          : words.slice(
              Math.max(0, at - 100),
              Math.min(words.length, at + e.quote.length + 180),
            );
      })
      .join("\n")
      .slice(0, 3500);
    const bounded =
      words.length > 13000 ? earlier + "\n" + words.slice(-9000) : words;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: bounded,
          artifacts: attachments,
          language,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Analysis unavailable");
      const result = analysisSchema.parse(data);
      if (id === seq.current && currentEpoch === epoch.current) {
        accept(result);
        setLatency(Math.round(performance.now() - began));
      }
    } catch (e) {
      if (
        !controller.signal.aborted &&
        id === seq.current &&
        currentEpoch === epoch.current
      ) {
        const local = localAnalysis(
          words + "\n" + artifactContext(attachments),
          language,
        );
        local.evidence = local.evidence.map((e) => ({
          ...e,
          origin: words.toLowerCase().includes(e.quote.toLowerCase())
            ? "conversation"
            : "attachment",
        }));
        accept(local);
        setNotice(
          e instanceof Error
            ? e.message
            : "Live AI check unavailable. Basic protection is on.",
        );
      }
    } finally {
      if (id === seq.current && currentEpoch === epoch.current)
        setChecking(false);
    }
  }
  useEffect(() => {
    if (demoMode.current) return;
    seq.current++;
    request.current?.abort();
    setChecking(false);
    if (!text.trim() && !artifacts.length) return;
    // Immediate local cue remains provisional; only finalized text reaches analysis.
    const timer = setTimeout(
      () => void perform(text, artifacts),
      Math.max(2300, 4000 - (Date.now() - lastRequest.current)),
    );
    return () => {
      clearTimeout(timer);
      request.current?.abort();
    };
  }, [text, artifacts, language]);
  function addText(words: string) {
    if (!words.trim() || demoMode.current) return;
    setSegments((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        text: words.trim(),
        at: new Date().toISOString(),
        mode: "typed",
      },
    ]);
  }
  function addArtifact(artifact: Artifact) {
    if (demoMode.current) return;
    setArtifacts((a) => [...a.slice(-2), artifact]);
    setNotice("Attachment added. Checking it with the conversation…");
  }
  function removeArtifact(id: string) {
    analysisRef.current=null;
    seq.current++;
    request.current?.abort();
    setArtifacts((a) => a.filter((x) => x.id !== id));
    setAnalysis(null);
    setHeld(false);
    setHistory([]);
    evidenceRef.current = [];
  }
  async function start() {
    if (starting || talking.current || demoMode.current) return;
    setStarting(true);
    setNotice("");
    const token = ++startToken.current;
    try {
      const SR = window as unknown as {
        SpeechRecognition?: new () => Recognition;
        webkitSpeechRecognition?: new () => Recognition;
      };
      const Constructor = SR.SpeechRecognition || SR.webkitSpeechRecognition;
      if (!Constructor)
        throw Error(
          "Live transcription is unavailable here. Use Chrome or Edge, or type the conversation.",
        );
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error(
          "Microphone access needs HTTPS. You can still type the conversation.",
        );
      const captured = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (token !== startToken.current) {
        captured.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = captured;
      context.current = new AudioContext();
      await context.current.resume();
      if (token !== startToken.current) return;
      analyser.current = context.current.createAnalyser();
      analyser.current.fftSize = 256;
      context.current
        .createMediaStreamSource(captured)
        .connect(analyser.current);
      const r = new Constructor();
      recognition.current = r;
      r.lang = { en: "en-IN", hi: "hi-IN", te: "te-IN" }[language];
      r.continuous = true;
      r.interimResults = true;
      let committed = new Set<number>();
      r.onresult = (e) => {
        if (!wanted.current || talking.current) return;
        restartCount.current = 0;
        let provisional = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const row = e.results[i];
          if (row.isFinal && !committed.has(i)) {
            committed.add(i);
            const words = row[0].transcript.trim();
            if (words)
              setSegments((s) => [
                ...s,
                {
                  id: crypto.randomUUID(),
                  text: words,
                  at: new Date().toISOString(),
                  mode: "microphone",
                  uncertain: row[0].confidence > 0 && row[0].confidence < 0.65,
                },
              ]);
          } else if (!row.isFinal) provisional += row[0].transcript;
        }
        setInterim(provisional);
      };
      r.onend = () => {
        committed = new Set();
        setInterim("");
        if (wanted.current && !talking.current) {
          if (restartCount.current++ >= 4) {
            stop();
            setNotice(
              "Transcription stopped repeatedly. Try again or use typed input.",
            );
            return;
          }
          restart.current = setTimeout(() => {
            if (wanted.current && !talking.current)
              try {
                r.start();
              } catch {
                stop();
                setNotice("Please restart listening.");
              }
          }, 800);
        }
      };
      r.onerror = (e) => {
        if (
          [
            "not-allowed",
            "service-not-allowed",
            "language-not-supported",
            "audio-capture",
          ].includes(e.error)
        ) {
          stop();
          setNotice(
            `Speech recognition unavailable (${e.error}). Try typed input.`,
          );
        } else if (e.error === "network")
          setNotice(
            "Speech recognition lost its connection. Trying to reconnect…",
          );
      };
      wanted.current = true;
      restartCount.current = 0;
      r.start();
      setActive(true);
    } catch (e) {
      stop();
      setNotice(
        e instanceof Error && e.name !== "NotAllowedError"
          ? e.message
          : "We need microphone access to listen. You can still type a conversation.",
      );
    } finally {
      setStarting(false);
    }
  }
  async function startDemo(scenario: DemoScenario) {
    reset();
    demoMode.current = true;
    const currentEpoch = epoch.current;
    setDemo({ scenario, step: 0, running: true });
    const words: Segment[] = [];
    const steps = demoScenarios[scenario].steps[language];
    for (let i = 0; i < steps.length; i++) {
      if (currentEpoch !== epoch.current) return;
      words.push({
        id: crypto.randomUUID(),
        text: steps[i],
        mode: "sample",
        at: new Date().toISOString(),
      });
      setSegments([...words]);
      setDemo({ scenario, step: i + 1, running: true });
      await perform(words.map((w) => w.text).join("\n"), [], currentEpoch);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    if (currentEpoch !== epoch.current) return;
    if (scenario === "qr") {
      setDemo({ scenario, step: 4, running: true });
      try {
        const response = await fetch("/demo-qr.png");
        const blob = await response.blob();
        const image = await prepareImage(
          new File([blob], "demo-qr.png", { type: "image/png" }),
        );
        if (currentEpoch !== epoch.current) return;
        if (!image.qrPayload) throw Error("Could not decode the demo QR.");
        const observed = inspectPayload(image.qrPayload);
        const a: Artifact = {
          id: "sample-qr",
          name: "Synthetic verification QR",
          kind: "qr",
          text: observed.facts.join("\n"),
          qrPayload: image.qrPayload,
          confirmed: true,
          demo: true,
        };
        setArtifacts([a]);
        await perform(words.map((w) => w.text).join("\n"), [a], currentEpoch);
      } catch {
        if (currentEpoch === epoch.current)
          setNotice(
            "Demo QR could not be loaded. The conversation assessment remains available.",
          );
      }
    }
    if (currentEpoch === epoch.current)
      setDemo({ scenario, step: scenario === "qr" ? 4 : 3, running: false });
  }
  function pauseDemo() {
    epoch.current++;
    seq.current++;
    request.current?.abort();
    setChecking(false);
    cancelSpeech();
    setDemo((d) => (d ? { ...d, running: false } : d));
  }
  const cue =
    localAnalysis(interim || segments.at(-1)?.text || "", language).signals
      .length > 0;
  return {
    sessionId:epoch.current,
    segments,
    artifacts,
    analysis,
    history,
    lastSource,
    held,
    checking,
    latency,
    active,
    starting,
    interim,
    notice,
    setNotice,
    voice,
    toggleVoice,
    voiceLanguage,
    setVoiceLanguage,
    speaking,
    supportedVoice,
    voices,
    elapsed,
    demo,
    analyser,
    text,
    cue,
    start,
    stop,
    reset,
    speak,
    addText,
    addArtifact,
    removeArtifact,
    startDemo,
    pauseDemo,
  };
}
