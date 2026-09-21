"use client";

/* ------------------------------------------------------------------ */
/* EvalixAI — Candidate AI Interview Video & Voice UI Room             */
/* Route: /interview/[sessionId]                                      */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  AudioWaveform,
  User,
  Bot,
} from "lucide-react";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { ScoreRing } from "@/components/dashboard/charts";

type InterviewState =
  | "PERMISSION_CHECK"
  | "CONNECTING"
  | "READY"
  | "AI_SPEAKING"
  | "LISTENING"
  | "THINKING"
  | "COMPLETED";

interface TranscriptMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

interface Scorecard {
  overall_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  verdict: string;
  recommendation: string;
  strengths: string[];
  improvements: string[];
  quote: string;
  minutes: number;
}

export default function InterviewRoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();

  // State machine
  const [state, setState] = useState<InterviewState>("PERMISSION_CHECK");
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Session info
  const [session, setSession] = useState<any>(null);
  const [candidateName, setCandidateName] = useState("Candidate");
  const [roleTitle, setRoleTitle] = useState("Software Engineer");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);

  // Media Controls
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Audio frequency visualization levels
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(12));

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Session timer
  useEffect(() => {
    if (state === "PERMISSION_CHECK" || state === "CONNECTING" || state === "COMPLETED") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Format timer MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [elapsedSeconds]);

  // 1. Initial Permission Flow
  const requestMediaPermissions = async () => {
    setPermissionError(null);
    setState("PERMISSION_CHECK");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize real Web Audio API frequency analysis
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateAudioData = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Subsample to 16 bars
          const sampled: number[] = [];
          for (let i = 0; i < 16; i++) {
            const val = dataArray[i * 2] || 0;
            // Height between 10% and 100%
            sampled.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
          }
          setAudioLevels(sampled);
          animationFrameRef.current = requestAnimationFrame(updateAudioData);
        };
        updateAudioData();
      } catch (audioErr) {
        console.warn("AudioContext visualizer initialization fallback:", audioErr);
      }

      // Load session from backend
      await loadSessionData();
    } catch (err: any) {
      console.error("Camera/Microphone access rejected:", err);
      setPermissionError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera or microphone access was denied. Please allow camera and microphone access in your browser settings to proceed."
          : "Could not access media devices. Please verify your camera and microphone are connected."
      );
    }
  };

  // 2. Load Session Info
  const loadSessionData = async () => {
    setState("CONNECTING");
    try {
      const res = await apiFetch(`/api/v1/interviews/${sessionId}`);
      if (!res.ok) {
        throw new Error("Interview session not found");
      }
      const data = await res.json();
      const sess = data.session;
      setSession(sess);
      setCandidateName(sess.candidate_name || "Candidate");
      setRoleTitle(sess.role_title || "Software Engineer");

      if (sess.status === "COMPLETED" && sess.scorecard) {
        setScorecard(sess.scorecard);
        setTranscript(sess.transcript || []);
        setState("COMPLETED");
        return;
      }

      // Start interview
      const startRes = await apiFetch(`/api/v1/interviews/${sessionId}/start`, {
        method: "POST",
      });
      if (startRes.ok) {
        const startData = await startRes.json();
        setTranscript(startData.transcript || []);
        setCurrentQuestion(startData.ai_message || "");
        setState("AI_SPEAKING");
        speakText(startData.ai_message);
      } else {
        setState("READY");
      }
    } catch (err) {
      console.error("Failed to load interview session:", err);
      setState("READY");
    }
  };

  // 3. Speech Synthesis (AI Speaking)
  const speakText = (text: string) => {
    if (!speakerEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTimeout(() => setState("LISTENING"), 1800);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]+>/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setState("AI_SPEAKING");
    utterance.onend = () => {
      setState("LISTENING");
      startVoiceRecognition();
    };
    utterance.onerror = () => {
      setState("LISTENING");
      startVoiceRecognition();
    };

    window.speechSynthesis.speak(utterance);
  };

  // 4. Speech Recognition (Candidate Answering)
  const startVoiceRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcriptText = "";
        for (let i = 0; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript + " ";
        }
        setAnswerInput(transcriptText.trim());
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition notice:", e.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (recErr) {
      console.warn("Voice recognition could not be started:", recErr);
    }
  };

  // 5. Submit Candidate Answer
  const submitAnswer = async () => {
    if (!answerInput.trim() || isSubmittingAnswer) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const currentAnswer = answerInput.trim();
    setAnswerInput("");
    setIsSubmittingAnswer(true);
    setState("THINKING");

    try {
      const res = await apiFetch(`/api/v1/interviews/${sessionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentAnswer }),
      });

      if (!res.ok) throw new Error("Failed to process answer");
      const data = await res.json();
      setTranscript(data.transcript || []);
      setCurrentQuestion(data.ai_message || "");

      if (data.is_complete) {
        // All questions answered -> complete interview
        await handleEndInterview();
      } else {
        setState("AI_SPEAKING");
        speakText(data.ai_message);
      }
    } catch (err) {
      console.error("Error submitting response:", err);
      setState("LISTENING");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // 6. Complete Interview
  const handleEndInterview = async () => {
    setShowEndModal(false);
    setState("THINKING");

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Stop camera and mic tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    try {
      const res = await apiFetch(`/api/v1/interviews/${sessionId}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to finalize interview");
      const data = await res.json();
      setScorecard(data.scorecard);
      setTranscript(data.transcript || []);
      setState("COMPLETED");
    } catch (err) {
      console.error("Failed to complete interview:", err);
      setState("COMPLETED");
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle Speaker
  const toggleSpeaker = () => {
    setSpeakerEnabled((prev) => {
      if (prev && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return !prev;
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-[#f4f2ea] text-[#1d1b15] select-none font-sans overflow-hidden">
      {/* ---------------- Top Navigation Bar ---------------- */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e2d2] bg-[#fffdf7] px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#1d1b15] text-[13px] font-bold text-[#f4f2ea]">
              E
            </span>
            <span className="font-serif-display text-[19px] tracking-tight text-[#1d1b15]">
              EvalixAI
            </span>
          </Link>
          <span className="text-[#d5d1c0]">/</span>
          <span className="text-[13px] font-medium text-[#55524a]">
            AI Technical Interview
          </span>
          <span className="rounded-full bg-[#dde0b8] px-2.5 py-0.5 text-[11px] font-semibold text-[#454e1e]">
            {roleTitle}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 rounded-full bg-[#eeece1] px-3 py-1 text-[12px] font-medium text-[#55524a]">
            <span
              className={cn(
                "size-2 rounded-full",
                state === "AI_SPEAKING"
                  ? "bg-[#6f7c3d] animate-pulse"
                  : state === "LISTENING"
                  ? "bg-[#3b82f6] animate-pulse"
                  : state === "THINKING"
                  ? "bg-[#d97706] animate-pulse"
                  : state === "COMPLETED"
                  ? "bg-[#1d1b15]"
                  : "bg-[#8a8578]"
              )}
            />
            <span>
              {state === "PERMISSION_CHECK"
                ? "Setup"
                : state === "CONNECTING"
                ? "Connecting"
                : state === "AI_SPEAKING"
                ? "AI Interviewer Speaking"
                : state === "LISTENING"
                ? "Listening to You"
                : state === "THINKING"
                ? "Evaluating Response"
                : state === "COMPLETED"
                ? "Interview Finished"
                : "Ready"}
            </span>
          </div>

          {/* Duration Timer */}
          {state !== "PERMISSION_CHECK" && state !== "COMPLETED" && (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-[#1d1b15]">
              <Clock className="size-4 text-[#8a8578]" />
              {formattedTime}
            </div>
          )}

          {/* End Button */}
          {state !== "PERMISSION_CHECK" && state !== "COMPLETED" && (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#a15b48] px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <PhoneOff className="size-3.5" />
              End Interview
            </button>
          )}
        </div>
      </header>

      {/* ---------------- Main View Area ---------------- */}
      <main className="relative flex flex-1 overflow-hidden">
        {/* State 1: Permission Flow Screen */}
        {state === "PERMISSION_CHECK" && (
          <div className="flex flex-1 items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="w-full max-w-lg rounded-3xl border border-[#e5e2d2] bg-[#fffdf7] p-8 shadow-[0_16px_50px_rgba(29,27,21,0.08)] text-center"
            >
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#eeece1] text-[#6f7c3d]">
                <ShieldCheck className="size-8" />
              </div>
              <h2 className="mt-4 font-serif-display text-[26px] text-[#1d1b15]">
                Ready for your AI Interview?
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#55524a]">
                You will be speaking with EvalixAI's conversational technical interviewer for the{" "}
                <span className="font-semibold text-[#1d1b15]">{roleTitle}</span> position.
                Camera and microphone permissions are required for voice interaction and proctoring.
              </p>

              {permissionError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#f2e2da] bg-[#fbf4f1] p-4 text-left text-[13px] text-[#a15b48]">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <p>{permissionError}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={requestMediaPermissions}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6f7c3d] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#5a662f]"
                >
                  <VideoIcon className="size-4" /> Allow Camera & Microphone
                </button>
                <Link
                  href="/dashboard"
                  className="text-[13px] text-[#8a8578] transition-colors hover:text-[#1d1b15]"
                >
                  Cancel and return to dashboard
                </Link>
              </div>
            </motion.div>
          </div>
        )}

        {/* State 2: Active Interview Room */}
        {state !== "PERMISSION_CHECK" && state !== "COMPLETED" && (
          <div className="flex flex-1 gap-4 p-4 overflow-hidden">
            {/* Left Column: Media Stage (Candidate Video + AI Interviewer) */}
            <div className="flex flex-1 flex-col gap-4 overflow-hidden">
              <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Interviewer Stage */}
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#1d1b15] p-6 shadow-inner text-center">
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-medium text-[#f4f2ea] backdrop-blur-md">
                    <Bot className="size-3.5 text-[#dde0b8]" />
                    EvalixAI Interviewer
                  </div>

                  {/* AI Glowing Orb Visualizer */}
                  <div className="relative my-auto grid size-44 place-items-center">
                    {/* Concentric animated pulse rings */}
                    <motion.div
                      animate={{
                        scale: state === "AI_SPEAKING" ? [1, 1.25, 1] : state === "LISTENING" ? [1, 1.1, 1] : 1,
                        opacity: state === "AI_SPEAKING" ? [0.4, 0.8, 0.4] : 0.2,
                      }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-[#6f7c3d]/20 blur-xl"
                    />
                    <motion.div
                      animate={{
                        scale: state === "AI_SPEAKING" ? [1, 1.15, 1] : 1,
                        rotate: state === "THINKING" ? 360 : 0,
                      }}
                      transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
                      }}
                      className={cn(
                        "size-32 rounded-full border-2 border-dashed transition-colors",
                        state === "AI_SPEAKING"
                          ? "border-[#dde0b8]"
                          : state === "THINKING"
                          ? "border-[#d97706]"
                          : "border-white/20"
                      )}
                    />
                    <div
                      className={cn(
                        "grid size-24 place-items-center rounded-full shadow-2xl transition-all duration-300",
                        state === "AI_SPEAKING"
                          ? "bg-gradient-to-tr from-[#6f7c3d] to-[#dde0b8] text-[#1d1b15]"
                          : state === "THINKING"
                          ? "bg-gradient-to-tr from-[#d97706] to-[#fde68a] text-[#1d1b15]"
                          : "bg-gradient-to-tr from-[#2d2a22] to-[#454238] text-[#f4f2ea]"
                      )}
                    >
                      <Sparkles className="size-9 animate-pulse" />
                    </div>
                  </div>

                  {/* Live AI Status Caption */}
                  <div className="mt-auto max-w-sm">
                    <p className="text-[13px] font-medium text-[#f4f2ea]">
                      {state === "AI_SPEAKING"
                        ? "Asking technical question..."
                        : state === "LISTENING"
                        ? "Listening to your answer..."
                        : state === "THINKING"
                        ? "Processing technical response..."
                        : "Ready for your answer"}
                    </p>
                  </div>
                </div>

                {/* Candidate Video Stage */}
                <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#1d1b15] shadow-inner">
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11.5px] font-medium text-[#f4f2ea] backdrop-blur-md">
                    <User className="size-3.5 text-[#dde0b8]" />
                    {candidateName}
                  </div>

                  {/* Webcam video element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "h-full w-full object-cover transition-opacity duration-300",
                      cameraEnabled ? "opacity-100" : "opacity-0"
                    )}
                  />

                  {!cameraEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#8a8578]">
                      <VideoOff className="size-10" />
                      <p className="text-[13px]">Camera disabled</p>
                    </div>
                  )}

                  {/* Real-time Frequency Audio Waveform Indicator */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-xl bg-black/50 px-4 py-2.5 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-[12px] text-[#f4f2ea]">
                      <AudioWaveform className="size-4 text-[#6f7c3d]" />
                      <span>{micEnabled ? "Microphone active" : "Microphone muted"}</span>
                    </div>

                    {/* 16 Reactive Wave Bars */}
                    <div className="flex items-center gap-1">
                      {audioLevels.map((lvl, idx) => (
                        <motion.span
                          key={idx}
                          style={{ height: `${micEnabled ? lvl : 12}%` }}
                          className={cn(
                            "w-1 rounded-full transition-all duration-75",
                            lvl > 50 ? "bg-[#dde0b8]" : "bg-[#6f7c3d]"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="flex h-16 shrink-0 items-center justify-between rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] px-6 shadow-sm">
                <div className="flex items-center gap-2">
                  {/* Mic Toggle */}
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={cn(
                      "grid size-10 place-items-center rounded-full transition-colors",
                      micEnabled
                        ? "bg-[#eeece1] text-[#1d1b15] hover:bg-[#e2dfd2]"
                        : "bg-[#f2e2da] text-[#a15b48]"
                    )}
                    title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {micEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={cn(
                      "grid size-10 place-items-center rounded-full transition-colors",
                      cameraEnabled
                        ? "bg-[#eeece1] text-[#1d1b15] hover:bg-[#e2dfd2]"
                        : "bg-[#f2e2da] text-[#a15b48]"
                    )}
                    title={cameraEnabled ? "Disable Camera" : "Enable Camera"}
                  >
                    {cameraEnabled ? <VideoIcon className="size-5" /> : <VideoOff className="size-5" />}
                  </button>

                  {/* Speaker Toggle */}
                  <button
                    type="button"
                    onClick={toggleSpeaker}
                    className={cn(
                      "grid size-10 place-items-center rounded-full transition-colors",
                      speakerEnabled
                        ? "bg-[#eeece1] text-[#1d1b15] hover:bg-[#e2dfd2]"
                        : "bg-[#f2e2da] text-[#a15b48]"
                    )}
                    title={speakerEnabled ? "Mute AI Speaker" : "Unmute AI Speaker"}
                  >
                    {speakerEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                  </button>
                </div>

                {/* Candidate Speech Text Input fallback */}
                <div className="flex flex-1 max-w-md items-center gap-2 mx-4">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                    placeholder={
                      state === "AI_SPEAKING"
                        ? "Listening to interviewer..."
                        : "Speak or type your answer here..."
                    }
                    className="h-10 flex-1 rounded-full border border-[#e5e2d2] bg-[#f4f2ea] px-4 text-[13px] text-[#1d1b15] placeholder:text-[#8a8578] focus:border-[#6f7c3d] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={!answerInput.trim() || isSubmittingAnswer}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-[#6f7c3d] text-white transition-opacity disabled:opacity-40 hover:bg-[#5a662f]"
                  >
                    {isSubmittingAnswer ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Transcript Drawer Toggle */}
                  <button
                    type="button"
                    onClick={() => setTranscriptOpen(!transcriptOpen)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors",
                      transcriptOpen
                        ? "bg-[#dde0b8] text-[#454e1e]"
                        : "bg-[#eeece1] text-[#55524a] hover:bg-[#e2dfd2]"
                    )}
                  >
                    <MessageSquare className="size-4" />
                    Transcript
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Transcript Panel */}
            <AnimatePresence>
              {transcriptOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 380 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-[#e5e2d2] p-4">
                    <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6f7c3d]">
                      <MessageSquare className="size-4" /> Live Transcript
                    </p>
                    <span className="text-[11px] text-[#8a8578]">Auto-scrolling</span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 nota-scroll">
                    {transcript.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl p-3.5 text-[13px]",
                          msg.role === "assistant"
                            ? "bg-[#f4f2ea] text-[#1d1b15]"
                            : "bg-[#dde0b8]/30 border border-[#dde0b8] text-[#1d1b15] ml-4"
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span
                            className={
                              msg.role === "assistant" ? "text-[#6f7c3d]" : "text-[#454e1e]"
                            }
                          >
                            {msg.role === "assistant" ? "EvalixAI Interviewer" : candidateName}
                          </span>
                          <span className="text-[#8a8578]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* State 3: Completed Scorecard Results View */}
        {state === "COMPLETED" && (
          <div className="flex flex-1 overflow-y-auto p-8 justify-center nota-scroll">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="w-full max-w-3xl space-y-6"
            >
              {/* Header Card */}
              <div className="rounded-3xl border border-[#e5e2d2] bg-[#fffdf7] p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dde0b8] px-3 py-1 text-[12px] font-semibold text-[#454e1e]">
                      <CheckCircle2 className="size-3.5" /> Technical Interview Completed
                    </span>
                    <h1 className="mt-3 font-serif-display text-[32px] text-[#1d1b15]">
                      {candidateName}
                    </h1>
                    <p className="text-[14px] text-[#55524a]">{roleTitle}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <ScoreRing value={scorecard?.overall_score || 85} size={76} stroke={6} />
                    <div className="text-right">
                      <span className="block font-serif-display text-[26px] text-[#6f7c3d]">
                        {scorecard?.overall_score || 85}%
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8578]">
                        {scorecard?.verdict || "Hire"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#e5e2d2] pt-6">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a8578]">
                    EvalixAI Executive Verdict
                  </p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#1d1b15]">
                    {scorecard?.recommendation ||
                      "Solid performance across technical architecture and communication competencies."}
                  </p>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5">
                  <p className="text-[11.5px] font-semibold uppercase text-[#8a8578]">
                    Technical Depth
                  </p>
                  <p className="mt-2 font-serif-display text-[28px] text-[#6f7c3d]">
                    {scorecard?.technical_score || 85}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8a8578]">
                    Architecture & system design
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5">
                  <p className="text-[11.5px] font-semibold uppercase text-[#8a8578]">
                    Communication
                  </p>
                  <p className="mt-2 font-serif-display text-[28px] text-[#6f7c3d]">
                    {scorecard?.communication_score || 88}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8a8578]">Clarity & articulation</p>
                </div>
                <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5">
                  <p className="text-[11.5px] font-semibold uppercase text-[#8a8578]">
                    Problem Solving
                  </p>
                  <p className="mt-2 font-serif-display text-[28px] text-[#6f7c3d]">
                    {scorecard?.problem_solving_score || 86}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8a8578]">Trade-off reasoning</p>
                </div>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[#454e1e]">
                    Demonstrated Strengths
                  </p>
                  <ul className="mt-3 space-y-2 text-[13.5px] text-[#55524a]">
                    {(scorecard?.strengths || [
                      "Crisp technical communication",
                      "Strong architectural trade-off awareness",
                    ]).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-[#6f7c3d] mt-2 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[#a15b48]">
                    Areas for Growth
                  </p>
                  <ul className="mt-3 space-y-2 text-[13.5px] text-[#55524a]">
                    {(scorecard?.improvements || [
                      "Could provide more quantified production metrics",
                    ]).map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-[#a15b48] mt-2 shrink-0" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 pb-8">
                <Link
                  href="/dashboard/candidates"
                  className="inline-flex items-center gap-2 rounded-full bg-[#6f7c3d] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#5a662f]"
                >
                  View in Candidates Pipeline <ChevronRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="text-[13.5px] font-medium text-[#8a8578] transition-colors hover:text-[#1d1b15]"
                >
                  Return to Dashboard Overview
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* ---------------- End Interview Confirmation Modal ---------------- */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[#1d1b15]/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-md rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-2xl"
            >
              <h3 className="font-serif-display text-[20px] text-[#1d1b15]">
                End the interview session?
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#55524a]">
                Ending the interview will disconnect your camera and microphone, finalize your
                transcript, and submit your responses for automated evaluation.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-[#55524a] hover:bg-[#eeece1]"
                >
                  Continue Interview
                </button>
                <button
                  type="button"
                  onClick={handleEndInterview}
                  className="rounded-full bg-[#a15b48] px-5 py-2 text-[13px] font-medium text-white hover:opacity-90"
                >
                  Confirm & Finish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
