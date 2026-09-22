import React, { useState } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Wrench,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Plot, UserIntent, ConversationalChatResponse } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../locales/LanguageContext';

interface AssistantChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: Plot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  intent?: UserIntent;
  intentConfidence?: number;
  toolsUsed?: string[];
  source?: string;
  dataSource?: string;
  timestamp: string;
  warningOrUncertainty?: string;
  safetyLevel?: string;
  decision?: {
    recommendation?: string;
    priority?: string;
    confidence?: number;
    reason?: string;
  };
}

export const AssistantChatModal: React.FC<AssistantChatModalProps> = ({
  isOpen,
  onClose,
  plots,
  selectedPlotId,
  onSelectPlot,
}) => {
  const { language, t } = useTranslation();
  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionContext, setSessionContext] = useState<{
    plotId?: string;
    crop?: string;
    growthStage?: string;
    location?: string;
  }>({
    plotId: activePlot?.id,
    crop: activePlot?.cropType,
    growthStage: activePlot?.growthStage,
  });

  const getInitialGreeting = () => {
    if (language === 'hi') {
      return `नमस्ते! मैं आपका एग्रोजेनेसिस (AgroGenesis) कृषि एआई सहायक हूँ। मेरे पास आपके खेत के वास्तविक समय के सेंसर डेटा, ICAR फसल मानकों और IMD मान्सून पूर्वानुमान की सीधी पहुँच है। आप मुझसे खेत की स्थिति, सिंचाई निर्णय, मृदा परीक्षण (NPK) या एजेंट की कार्यप्रणाली के बारे में पूछ सकते हैं।`;
    }
    if (language === 'mr') {
      return `नमस्कार! मी आपला अ‍ॅग्रोजेनेसिस (AgroGenesis) शेती एआय मार्गदर्शक आहे. माझ्याकडे आपल्या शेतातील सर्व पीक विभागांचा थेट सेन्सर डेटा, आयसीएआर (ICAR) मानके आणि हवामान अंदाजाची अचूक माहिती आहे. आज मी आपल्याला कशी मदत करू?`;
    }
    return `Hello! I am your AgroGenesis Agricultural AI Copilot. I have real-time perceptual access to your farm's in-situ sensor telemetry, ICAR crop models, and IMD monsoon forecasts. Feel free to ask about your farm's condition, irrigation decisions, soil NPK testing, sensor diagnostics, or my autonomous architecture.`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'agent',
      text: getInitialGreeting(),
      intent: 'GENERAL_AGENT_INFO',
      intentConfidence: 1.0,
      toolsUsed: [],
      source: 'AgroGenesis AI Core',
      dataSource: 'Autonomous Knowledge Base',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([
    'What is your role as an agriculture AI agent?',
    'What is the current condition of my farm?',
    'What is the current soil moisture?',
    'Should I irrigate my rice crop?',
    'What is the weather at my farm?',
    'What was my last irrigation action?',
    'What is the NPK condition of my soil?',
    'How does your agent work?',
    'What happens if my soil sensor stops working?',
    'Explain the difference between simulation and real sensor data.',
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const response: ConversationalChatResponse = await api.sendChat(
        text,
        activePlot ? activePlot.id : 'plot-1',
        language,
        historyPayload,
        sessionContext
      );

      const agentMsg: ChatMessage = {
        sender: 'agent',
        text: response.reply,
        intent: response.intent,
        intentConfidence: response.intentConfidence,
        toolsUsed: response.toolsUsed,
        source: response.source,
        dataSource: response.dataSource,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        decision: response.decision,
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (response.conversationContext) {
        setSessionContext((prev) => ({
          ...prev,
          ...response.conversationContext,
        }));
      }

      if (response.suggestedQuestions && response.suggestedQuestions.length > 0) {
        setDynamicPrompts(response.suggestedQuestions);
      }
    } catch (e) {
      console.error('Chat send error:', e);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text:
            language === 'hi'
              ? 'क्षमा करें, कृषि एआई मॉडल सर्वर से संपर्क करने में अस्थायी समस्या उत्पन्न हुई।'
              : language === 'mr'
              ? 'क्षमस्व, शेती एआय सर्व्हरशी संपर्क साधताना तात्पुरती समस्या आली आहे.'
              : 'Apologies, I encountered a temporary connection issue communicating with the agricultural model server.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntentBadgeStyle = (intent?: UserIntent) => {
    switch (intent) {
      case 'IRRIGATION_DECISION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FERTILIZATION_ANALYSIS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WEATHER_QUERY':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'SENSOR_ANALYSIS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FARM_STATUS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ACTION_HISTORY':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'MEMORY_QUERY':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'GENERAL_AGENT_INFO':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      case 'CROP_HEALTH':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'SIMULATION_ACTION':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const formatIntentLabel = (intent?: UserIntent) => {
    if (!intent) return 'GENERAL_INFO';
    return intent.replace(/_/g, ' ');
  };

  return (
    <div
      id="assistant-chat-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="flex h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 p-4 bg-stone-50/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  AgroGenesis AI Copilot
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {language.toUpperCase()} • Grounded Reasoning
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Active Farm Context:{' '}
                <span className="font-semibold text-stone-700">{activePlot?.name}</span> (
                {activePlot?.cropType}, {activePlot?.currentMoisture.toFixed(1)}% Moisture)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Guardrail Banner */}
        <div className="bg-amber-500/10 px-4 py-2.5 text-[11px] text-amber-800 dark:text-amber-200 border-b border-amber-500/20 flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-900 dark:text-amber-100">Intent-Driven & Zero-Fabrication Guardrail:</strong> Responses answer your specific inquiry directly using allowlisted tools. Chemical recommendations are strictly withheld unless verified by KVK Soil Health Cards.
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700/60 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line font-sans">{m.text}</div>

                {/* Intent & Tool Execution Footer (for Agent responses) */}
                {m.sender === 'agent' && (m.intent || (m.toolsUsed && m.toolsUsed.length > 0)) && (
                  <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-1.5 text-[11px]">
                    {/* Intent Badge */}
                    {m.intent && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-stone-500 font-medium">Intent:</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] border ${getIntentBadgeStyle(
                            m.intent
                          )}`}
                        >
                          {formatIntentLabel(m.intent)}
                          {m.intentConfidence !== undefined && (
                            <span className="ml-1 opacity-75 font-normal">
                              ({Math.round(m.intentConfidence * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Tools Used */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-stone-500 font-medium flex items-center space-x-1">
                        <Wrench className="h-3 w-3" />
                        <span>Tools:</span>
                      </span>
                      {m.toolsUsed && m.toolsUsed.length > 0 ? (
                        m.toolsUsed.map((tName, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono"
                          >
                            {tName}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400 italic text-[10px]">
                          None (Direct Agronomic Knowledge)
                        </span>
                      )}
                    </div>

                    {/* Data Source */}
                    {m.dataSource && (
                      <div className="flex items-center space-x-1.5 text-stone-500 text-[10px]">
                        <Database className="h-3 w-3 text-stone-400" />
                        <span>
                          Source: <strong className="text-stone-700">{m.dataSource}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp & Source Pill */}
              <div className="mt-1 flex items-center space-x-2 text-[10px] text-stone-500 px-2">
                <span>{m.timestamp}</span>
                {m.source && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-emerald-800 flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{m.source}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-stone-600 italic p-3 bg-stone-50 rounded-xl border border-stone-200 max-w-md">
              <Sparkles className="h-4 w-4 animate-spin text-emerald-700 shrink-0" />
              <span>
                Classifying intent, selecting allowlisted tools, and formulating grounded response...
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Quick Questions */}
        <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/90 p-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-1.5 px-1">
            Test Inquiries & Suggested Questions:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {dynamicPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="rounded-lg border border-stone-200 dark:border-stone-700/70 bg-white dark:bg-stone-800 px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-900 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-stone-200 dark:border-stone-800 p-3 bg-white dark:bg-stone-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === 'hi'
                  ? `अपनी कृषि समस्या या प्रश्न दर्ज करें (उदा. 'धान में सिंचाई करनी चाहिए?')...`
                  : language === 'mr'
                  ? `आपला शेतीविषयक प्रश्न विचारा (उदा. 'सध्या पिकाला पाणी द्यावे का?')...`
                  : `Ask any farm question (e.g. 'What is your role?', 'What is current soil moisture?')...`
              }
              className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/80 p-3 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-emerald-700 focus:outline-hidden shadow-2xs"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="rounded-xl bg-emerald-800 px-4 py-3 text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
