'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Square, Trash2, Download } from 'lucide-react';

interface VideoRecorderProps {
  onRecordComplete: (base64: string, mimeType: string) => void;
}

export default function VideoRecorder({ onRecordComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
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

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      streamRef.current = mediaStream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please ensure permissions are granted.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    // Let the browser choose its default supported mimeType
    const options: MediaRecorderOptions = {};
    
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    videoChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        videoChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
      const videoBlob = new Blob(videoChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      
      // Stop camera tracks to turn off webcam light
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
      }

      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
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
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    // Determine extension based on mimeType
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `recording-${new Date().getTime()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
      {!videoUrl ? (
        <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center">
          {stream ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <button 
              onClick={startCamera}
              className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">Click to enable camera</span>
            </button>
          )}
          
          {stream && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              {isRecording ? (
                <div className="flex items-center gap-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <span className="font-mono text-red-500">{formatTime(recordingTime)}</span>
                  <button
                    onClick={stopRecording}
                    className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-12 h-12 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center hover:bg-emerald-400 transition-colors border-4 border-white/20"
                >
                  <div className="w-4 h-4 bg-zinc-950 rounded-full"></div>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          <video src={videoUrl} controls className="w-full aspect-video rounded-lg bg-black object-contain" />
          <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 px-2">{formatTime(recordingTime)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                title="Download recording"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setVideoUrl(null);
                  setRecordingTime(0);
                  startCamera();
                }}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete recording"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
