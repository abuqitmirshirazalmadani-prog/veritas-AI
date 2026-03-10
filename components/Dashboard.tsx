'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Mic, Camera, Upload, Activity, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import AnalysisResult from './AnalysisResult';
import FileUploader from './FileUploader';
import AudioRecorder from './AudioRecorder';
import VideoRecorder from './VideoRecorder';

type Tab = 'text' | 'voice' | 'face';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (data: { type: 'text' | 'audio' | 'image' | 'video', content: string | File, mimeType?: string }) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Please configure it in the settings.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      let contents: any;
      let model = 'gemini-3-flash-preview';

      if (data.type === 'text') {
        contents = `Analyze the following communication for signs of deception, stress, or evasiveness. Provide a Truth Probability Score (0-100) and a breakdown. Text: "${data.content}"`;
      } else if (data.type === 'image' || data.type === 'audio' || data.type === 'video') {
        // For image/audio/video, content is a base64 string
        const base64Data = (data.content as string).split(',')[1];
        
        if (!base64Data || base64Data.length < 100) {
          throw new Error('Media file is empty or corrupted. Please try again.');
        }
        
        // Gemini API has a 20MB limit for inline data. Base64 adds ~33% overhead.
        // We limit to ~15MB actual file size (approx 20MB base64 string length).
        if (base64Data.length > 20 * 1024 * 1024) {
          throw new Error('Media file is too large. Please use a shorter recording or smaller file (max 15MB).');
        }
        
        // Gemini API expects clean mime types without codecs (e.g., 'video/webm' instead of 'video/webm;codecs=vp8')
        let cleanMimeType = data.mimeType?.split(';')[0];
        
        // Map unsupported or experimental mime types to officially supported ones
        if (cleanMimeType === 'video/x-matroska') cleanMimeType = 'video/webm';
        if (cleanMimeType === 'audio/webm') cleanMimeType = 'video/webm';
        if (cleanMimeType === 'audio/mp4') cleanMimeType = 'video/mp4';
        if (cleanMimeType === 'video/quicktime') cleanMimeType = 'video/mov';
        if (cleanMimeType === 'audio/x-m4a' || cleanMimeType === 'audio/m4a') cleanMimeType = 'audio/aac';
        if (cleanMimeType === 'audio/mpeg3') cleanMimeType = 'audio/mp3';
        
        // Fallback mime types if not provided
        if (!cleanMimeType) {
          if (data.type === 'image') cleanMimeType = 'image/jpeg';
          else if (data.type === 'video') cleanMimeType = 'video/webm';
          else cleanMimeType = 'audio/mpeg';
        }

        contents = [{
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: cleanMimeType,
              }
            },
            {
              text: `Analyze this ${data.type} for signs of stress, cognitive load, micro-expressions (if visual), or voice stress (if audio). Estimate a Truth Probability Score (0-100) and provide a breakdown.`
            }
          ]
        }];
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              truthScore: {
                type: Type.NUMBER,
                description: 'Truth Probability Score from 0 to 100, where 100 is completely truthful.',
              },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  voiceStress: { type: Type.NUMBER, description: '0-100 score indicating stress level, where 100 is extremely stressed. Return 0 if not applicable.' },
                  facialExpressions: { type: Type.NUMBER, description: '0-100 score indicating deceptive micro-expressions, where 100 is highly deceptive. Return 0 if not applicable.' },
                  languagePatterns: { type: Type.NUMBER, description: '0-100 score indicating evasive language, where 100 is highly evasive. Return 0 if not applicable.' },
                }
              },
              detailedReport: {
                type: Type.STRING,
                description: 'A detailed 2-3 paragraph report explaining the reasoning behind the scores.',
              },
              keyIndicators: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of 3-5 key indicators (e.g., "Hesitation in speech", "Consistent eye contact").'
              }
            },
            required: ['truthScore', 'breakdown', 'detailedReport', 'keyIndicators']
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        setResult(parsed);
      } else {
        throw new Error('Failed to generate analysis.');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Header with tests remaining */}
        <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-zinc-300">Free Tier Active</span>
          </div>
          <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
            <span className="text-emerald-400 font-bold">3</span> tests remaining today
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'text' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat / Text
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'voice' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
          <button
            onClick={() => setActiveTab('face')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'face' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Camera className="w-4 h-4" />
            Face / Video
          </button>
        </div>

        {/* Input Area */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-400">Paste Chat Text</label>
                  <textarea
                    id="text-input"
                    className="w-full h-32 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder="Paste the conversation here..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-800"></div>
                  <span className="text-xs font-mono text-zinc-500 uppercase">OR</span>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>
                <FileUploader 
                  accept="image/*" 
                  label="Upload Chat Screenshot" 
                  onUpload={(file, base64) => handleAnalyze({ type: 'image', content: base64, mimeType: file.type })} 
                />
                <button 
                  onClick={() => {
                    const text = (document.getElementById('text-input') as HTMLTextAreaElement).value;
                    if (text) handleAnalyze({ type: 'text', content: text });
                  }}
                  disabled={isAnalyzing}
                  className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
                </button>
              </motion.div>
            )}

            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">Live Call Analysis</span>
                    <span className="text-xs text-zinc-500">Real-time stress detection (Pro)</span>
                  </div>
                  <button className="w-10 h-6 bg-zinc-800 rounded-full flex items-center p-1 cursor-not-allowed opacity-50">
                    <div className="w-4 h-4 bg-zinc-500 rounded-full"></div>
                  </button>
                </div>
                <AudioRecorder onRecordComplete={(base64, mimeType) => handleAnalyze({ type: 'audio', content: base64, mimeType })} />
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-800"></div>
                  <span className="text-xs font-mono text-zinc-500 uppercase">OR</span>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>
                <FileUploader 
                  accept="audio/*" 
                  label="Upload Audio File" 
                  onUpload={(file, base64) => handleAnalyze({ type: 'audio', content: base64, mimeType: file.type })} 
                />
              </motion.div>
            )}

            {activeTab === 'face' && (
              <motion.div
                key="face"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">Live Video Analysis</span>
                    <span className="text-xs text-zinc-500">Real-time micro-expression tracking (Pro)</span>
                  </div>
                  <button className="w-10 h-6 bg-zinc-800 rounded-full flex items-center p-1 cursor-not-allowed opacity-50">
                    <div className="w-4 h-4 bg-zinc-500 rounded-full"></div>
                  </button>
                </div>
                <VideoRecorder onRecordComplete={(base64, mimeType) => handleAnalyze({ type: 'video', content: base64, mimeType })} />
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-800"></div>
                  <span className="text-xs font-mono text-zinc-500 uppercase">OR</span>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>
                <FileUploader 
                  accept="image/*,video/*" 
                  label="Upload Photo/Video" 
                  onUpload={(file, base64) => handleAnalyze({ type: file.type.startsWith('video/') ? 'video' : 'image', content: base64, mimeType: file.type })} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="lg:col-span-7">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isAnalyzing ? (
          <div className="h-[500px] bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-zinc-800 border-t-emerald-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-zinc-200">Analyzing Patterns</h3>
              <p className="text-sm text-zinc-500 mt-1 font-mono">Processing neural indicators...</p>
            </div>
          </div>
        ) : result ? (
          <AnalysisResult result={result} />
        ) : (
          <div className="h-[500px] bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center gap-4 text-zinc-500">
            <Activity className="w-12 h-12 opacity-20" />
            <p className="text-sm">Upload media to begin analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
