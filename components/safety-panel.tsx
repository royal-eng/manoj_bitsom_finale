"use client";
import { useEffect, useRef, useState } from "react";
import {
  X,
  ShieldCheck,
  Copy,
  Download,
  ExternalLink,
  Phone,
  Check,
} from "lucide-react";
import { Language } from "@/lib/analysis";
import { references, safetySteps, SafetyStage } from "@/lib/safety";
export function SafetyPanel({
  language,
  onClose,
  onSave,
  onStop,
  active,
}: {
  language: Language;
  onClose: () => void;
  onSave: (stage: SafetyStage) => void;
  onStop: () => void;
  active: boolean;
}) {
  const [stage, setStage] = useState<SafetyStage>("paused"),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.activeElement;
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="safety-title"
      className="safety-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="dialog-content">
        <button
          className="close-button"
          aria-label="Close safety guidance"
          onClick={onClose}
        >
          <X size={22} />
        </button>
        <span className="icon-tile large">
          <ShieldCheck size={29} />
        </span>
        <span className="eyebrow">YOUR NEXT STEP</span>
        <h2 id="safety-title">
          Take a pause.
          <br />
          <em>Take back control.</em>
        </h2>
        <p>
          There’s no judgement here. Choose what happened so we can help you
          take the next step.
        </p>
        <div className="safety-choices">
          {(
            [
              ["paused", "I haven’t acted"],
              ["shared", "I shared information"],
              ["paid", "I sent money"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={stage === key ? "selected" : ""}
              aria-pressed={stage === key}
              onClick={() => {
                setStage(key);
                setCopied(false);
              }}
            >
              {label}
              {stage === key && <Check size={15} />}
            </button>
          ))}
        </div>
        <ol className="safety-steps" lang={language}>
          {safetySteps[stage][language].map((step, i) => (
            <li key={step}>
              <span>{i + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        {stage === "paid" && (
          <div className="report-links">
            <a className="button primary" href="tel:1930">
              <Phone size={16} /> Call 1930 (India)
            </a>
            <a
              className="button secondary"
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noreferrer"
            >
              Official reporting portal <ExternalLink size={15} />
            </a>
          </div>
        )}
        <div className="dialog-actions">
          <button
            className="button secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  safetySteps[stage][language].join("\n\n"),
                );
                setCopied(true);
              } catch {
                setError(
                  "Clipboard unavailable. Select and copy the visible advice.",
                );
              }
            }}
          >
            <Copy size={15} />
            {copied ? "Copied" : "Copy steps"}
          </button>
          <button className="button secondary" onClick={() => onSave(stage)}>
            <Download size={15} /> Save personal report
          </button>
        </div>
        {error && <p role="status">{error}</p>}
        <div className="reference-box">
          <strong>Guidance grounded in official sources</strong>
          {references.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer">
              {r.title}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
        <p className="fine-print">
          ScamShield does not contact your bank, file a report, or guarantee
          recovery. These actions remain yours.
        </p>
        <div className="dialog-actions">
          <button className="button primary" onClick={onClose}>
            Return to session
          </button>
          {active && (
            <button
              className="text-button"
              onClick={() => {
                onStop();
                onClose();
              }}
            >
              Stop microphone
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
