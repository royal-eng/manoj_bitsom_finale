"use client";
import { useEffect, useRef, useState } from "react";
import {
  FileImage,
  Link2,
  Upload,
  ScanLine,
  ArrowRight,
  LoaderCircle,
  Check,
  Trash2,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { Artifact, inspectPayload } from "@/lib/artifacts";
import { prepareImage } from "@/lib/image-input";
export function AttachmentPanel({
  artifacts,
  onAdd,
  onRemove,
  disabled,
}: {
  artifacts: Artifact[];
  onAdd: (a: Artifact) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const [tab, setTab] = useState<"image" | "text">("image"),
    [image, setImage] = useState(""),
    [payload, setPayload] = useState(""),
    [text, setText] = useState(""),
    [filename, setFilename] = useState(""),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false),
    [notice, setNotice] = useState("");
  const generation = useRef(0),
    request = useRef<AbortController | null>(null),
    fileRef = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      generation.current++;
      request.current?.abort();
    },
    [],
  );
  function clear() {
    generation.current++;
    request.current?.abort();
    setImage("");
    setPayload("");
    setText("");
    setFilename("");
    setConsent(false);
    setNotice("");
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  async function select(file?: File) {
    if (!file) return;
    clear();
    const id = generation.current;
    setBusy(true);
    try {
      const result = await prepareImage(file);
      if (id !== generation.current) return;
      setImage(result.image);
      setPayload(result.qrPayload);
      setFilename(file.name);
      if (result.qrPayload) {
        setText(result.qrPayload);
        setNotice(
          "QR decoded on your device. Review the observed content before adding it.",
        );
      } else
        setNotice(
          "No QR detected. Read the screenshot with AI, or enter its text below.",
        );
    } catch (e) {
      if (id === generation.current)
        setNotice(e instanceof Error ? e.message : "Could not read the image.");
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  async function extract() {
    const id = ++generation.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setNotice("Reading visible text…");
    try {
      const r = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, consent }),
        signal: controller.signal,
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      if (id !== generation.current) return;
      setText(data.text);
      setNotice(
        data.uncertainty ||
          "AI-extracted text. Check and correct it before adding.",
      );
    } catch (e) {
      if (id === generation.current && !controller.signal.aborted)
        setNotice(
          e instanceof Error
            ? e.message
            : "Image reading unavailable. Paste the text instead.",
        );
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  function add() {
    if (!text.trim() || disabled) return;
    const typed = text.trim();
    const actualPayload =
      payload && typed === payload
        ? payload
        : typed.startsWith("upi:")
          ? typed
          : undefined;
    const link = /^https?:\/\/\S+$/.test(typed);
    onAdd({
      id: crypto.randomUUID(),
      name: filename || (link ? "Pasted link" : "Pasted message"),
      kind: actualPayload ? "qr" : image ? "image" : link ? "link" : "message",
      text: typed.slice(0, 5000),
      ...(actualPayload ? { qrPayload: actualPayload } : {}),
      confirmed: true,
    });
    clear();
  }
  return (
    <section className="card attachment-card">
      <div className="card-title">
        <span className="icon-tile sand">
          <ScanLine size={19} />
        </span>
        <div>
          <h2>What did they send?</h2>
          <p>A message, screenshot, link, or QR.</p>
        </div>
        <span className="tiny-label">CONNECT THE DOTS</span>
      </div>
      <div className="segmented" aria-label="Attachment input">
        <button
          disabled={disabled || busy}
          className={tab === "image" ? "selected" : ""}
          onClick={() => {
            clear();
            setTab("image");
          }}
        >
          <FileImage size={15} /> Screenshot / QR
        </button>
        <button
          disabled={disabled || busy}
          className={tab === "text" ? "selected" : ""}
          onClick={() => {
            clear();
            setTab("text");
          }}
        >
          <Link2 size={15} /> Paste text / link
        </button>
      </div>
      {disabled ? (
        <div className="demo-attachment-note">
          Sample evidence appears here during the demo. Exit demo to add your
          own.
        </div>
      ) : (
        <>
          {tab === "image" && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                id="evidence-file"
                className="sr-only"
                onChange={(e) => void select(e.target.files?.[0])}
                disabled={busy}
              />
              {!image ? (
                <label
                  htmlFor="evidence-file"
                  className={"upload-zone " + (busy ? "disabled" : "")}
                >
                  <span>
                    <Upload size={22} />
                  </span>
                  <strong>
                    {busy ? "Preparing image…" : "Choose a screenshot or QR"}
                  </strong>
                  <small>PNG, JPG or WebP · up to 8 MB</small>
                </label>
              ) : (
                <div className="image-review">
                  <Image
                    src={image}
                    unoptimized
                    width={100}
                    height={100}
                    alt="Selected attachment for review"
                  />
                  <div>
                    <strong>{filename}</strong>
                    <span>
                      {payload
                        ? "Decoded on device"
                        : "Ready for text extraction"}
                    </span>
                    <button className="text-button" onClick={clear}>
                      Choose another
                    </button>
                  </div>
                </div>
              )}
              {image && !payload && (
                <>
                  <label className="consent-check">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      disabled={busy}
                    />{" "}
                    <span>
                      Send this image to Gemini to read its text. I’ve cropped
                      out private details. Images are not stored by ScamShield.
                    </span>
                  </label>
                  <button
                    className="button secondary small"
                    disabled={!consent || busy}
                    onClick={() => void extract()}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <Eye size={15} />
                    )}{" "}
                    Read screenshot
                  </button>
                </>
              )}
            </>
          )}
          {(tab === "text" || image) && (
            <>
              <label className="field-label" htmlFor="attachment-text">
                {image
                  ? "Review and correct the observed text"
                  : "Paste the message, URL or UPI payload"}
              </label>
              <textarea
                id="attachment-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={5000}
                placeholder="Paste exactly what they sent…"
                rows={4}
              />
              <p className="fine-print">
                Confirm only text you can observe. Links are inspected, never
                opened.
              </p>
              <button
                className="button secondary wide"
                disabled={!text.trim() || busy || artifacts.length >= 3}
                onClick={add}
              >
                <Check size={16} /> Confirm & connect evidence{" "}
                <ArrowRight size={16} />
              </button>
            </>
          )}
          {notice && (
            <p className="inline-notice" role="status">
              {notice}
            </p>
          )}
        </>
      )}
      {artifacts.length > 0 && (
        <div className="attached-list">
          {artifacts.map((a) => (
            <article key={a.id}>
              <div className="attached-heading">
                <ScanLine size={16} />
                <strong>{a.name}</strong>
                {!disabled && (
                  <button
                    aria-label={"Remove " + a.name}
                    onClick={() => onRemove(a.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {a.demo && (
                <span className="sample-stamp">
                  SYNTHETIC SAMPLE · NOT A REAL PAYEE
                </span>
              )}
              {a.kind === "qr" && a.demo && (
                <Image
                  className="sample-qr"
                  src="/demo-qr.png"
                  width={100}
                  height={100}
                  alt="Synthetic demo payment QR; do not pay"
                />
              )}
              {a.qrPayload ? (
                <>
                  <ul>
                    {inspectPayload(a.qrPayload).facts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <p className="fine-print">
                    {inspectPayload(a.qrPayload).limitation}
                  </p>
                </>
              ) : (
                <>
                  <p className="attachment-excerpt">{a.text}</p>
                  {a.kind === "link" && (
                    <ul>
                      {inspectPayload(a.text).facts.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="card-foot">
        <ScanLine size={13} /> QR decoded locally · Screenshots reviewed before
        use
      </div>
    </section>
  );
}
