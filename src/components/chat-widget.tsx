import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Mic, MicOff, Send, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { askAssistant, type ChatMessage } from "@/lib/chat.functions";
import { cn } from "@/lib/utils";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  return ctor ? new ctor() : null;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm Sateesh's AI assistant. Ask me about his experience, skills, availability or contact details.",
};

export function ChatWidget() {
  const ask = useServerFn(askAssistant);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    setVoiceSupported(getRecognition() !== null);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch {
      /* voice output unsupported — text still shown */
    }
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sendingRef.current) return;
      sendingRef.current = true;
      setLoading(true);
      setError(null);
      setInput("");

      const history = [...messages.filter((m) => m !== GREETING), { role: "user" as const, content: text }];
      setMessages((prev) => [...prev, { role: "user", content: text }]);

      try {
        const result = await ask({ data: { messages: history.slice(-20) } });
        if (result.ok) {
          setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
          if (voiceOn) speak(result.reply);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        sendingRef.current = false;
        setLoading(false);
      }
    },
    [ask, messages, speak, voiceOn],
  );

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = getRecognition();
    if (!recognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) void send(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. Please allow access and try again."
          : "Could not capture your voice. Please try again or type your question.",
      );
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
      setError(null);
    } catch {
      setListening(false);
      setError("Could not start the microphone.");
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen((value) => !value)}
        size="icon"
        className="fixed bottom-20 right-5 z-40 size-12 rounded-full shadow-lg sm:bottom-5 sm:right-44"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <X /> : <Bot />}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="AI assistant"
          className="fixed inset-x-3 bottom-36 z-40 flex h-[min(70dvh,520px)] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl sm:inset-x-auto sm:bottom-20 sm:right-5 sm:w-[380px]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <p className="text-sm font-semibold">Ask about Sateesh</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = !voiceOn;
                setVoiceOn(next);
                if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
              }}
              aria-label={voiceOn ? "Turn off voice replies" : "Turn on voice replies"}
            >
              {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-6",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground",
                )}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <Button
              type="button"
              variant={listening ? "default" : "outline"}
              size="icon"
              onClick={toggleMic}
              disabled={!voiceSupported}
              aria-label={listening ? "Stop listening" : "Start voice input"}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={listening ? "Listening…" : "Type your question…"}
              aria-label="Message"
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
