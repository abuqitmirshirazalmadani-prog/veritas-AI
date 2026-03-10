'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Loader2, Trash2, Download } from 'lucide-react';

interface AudioRecorderProps {
  onRecordComplete: (base64: string, mimeType: string) => void;
}

export default function AudioRecorder({ onRecordComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      
      const options: MediaRecorderOptions = {};
      
      mediaRecorderRef.current = new MediaRecorder(mediaStream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onRecordComplete(base64data, mimeType);
        };
      };

      mediaRecorderRef.current.start(); // Start without timeslice for better cross-browser compatibility
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Stop all tracks to release microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('aac') ? 'aac' : 'webm';
    a.download = `voice-recording-${new Date().getTime()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center gap-6">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors relative"
          >
            <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-50"></span>
            <Square className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-16 h-16 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-2xl font-light tracking-wider text-zinc-100">
          {formatTime(recordingTime)}
        </span>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
          {isRecording ? 'Recording...' : audioUrl ? 'Recording Complete' : 'Ready to Record'}
        </span>
      </div>

      {audioUrl && !isRecording && (
        <div className="mt-4 w-full flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
          <audio src={audioUrl} controls className="flex-1 h-10" />
          <button
            onClick={handleDownload}
            className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
            title="Download recording"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setAudioUrl(null);
              setRecordingTime(0);
            }}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Delete recording"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
