'use client';

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Provider = 'groq' | 'openai' | 'anthropic';

interface ProKeyInputProps {
  onKeySet?: (key: string, provider: Provider) => void;
}

const PROVIDERS: { id: Provider; name: string; tip: string; keyPrefix: string; freeLink: string }[] = [
  {
    id: 'groq',
    name: 'Groq (Recommended Free)',
    tip: 'Free tier: 30 req/min. Fastest inference. Models: Llama 3, Mixtral.',
    keyPrefix: 'gsk_',
    freeLink: 'https://console.groq.com',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tip: 'Uses GPT-4o. Best quality rewrites. Requires billing.',
    keyPrefix: 'sk-',
    freeLink: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tip: 'Uses Claude Haiku/Sonnet. Great quality. Requires billing.',
    keyPrefix: 'sk-ant-',
    freeLink: 'https://console.anthropic.com',
  },
];

export function ProKeyInput({ onKeySet }: ProKeyInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [provider, setProvider] = useState<Provider>('groq');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pro-api-key');
    const storedProvider = localStorage.getItem('pro-api-provider') as Provider;
    if (stored && storedProvider) {
      setKey(stored);
      setProvider(storedProvider);
      setHasKey(true);
    }
  }, []);

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    localStorage.setItem('pro-api-key', trimmed);
    localStorage.setItem('pro-api-provider', provider);
    setSaved(true);
    setHasKey(true);
    onKeySet?.(trimmed, provider);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem('pro-api-key');
    localStorage.removeItem('pro-api-provider');
    setKey('');
    setHasKey(false);
  };

  const selectedProvider = PROVIDERS.find(p => p.id === provider)!;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
          hasKey ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'
        )}>
          {hasKey ? (
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          ) : (
            <Key className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Pro AI Features {hasKey ? '(Active)' : '(Optional)'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {hasKey ? `Using ${provider} for AI rewrites` : 'Add API key for AI-powered bullet rewrites'}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">What Pro unlocks:</p>
            <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-0.5">
              <li>• AI-powered bullet point rewrites with keywords</li>
              <li>• Professional summary generation from scratch</li>
              <li>• Cover letter generation matching the JD</li>
              <li>• Tone/style adjustment per company culture</li>
            </ul>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Provider</label>
            <div className="space-y-1.5">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2 transition-all',
                    provider === p.id
                      ? 'border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-3.5 w-3.5 rounded-full border-2 shrink-0',
                      provider === p.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-gray-600'
                    )} />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{p.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-5">{p.tip}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {selectedProvider.name} API Key
              </label>
              <a
                href={selectedProvider.freeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                Get free key →
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder={`${selectedProvider.keyPrefix}...`}
                  className="pr-9 text-sm font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={!key.trim()}
                className="gap-1.5 shrink-0 bg-purple-600 hover:bg-purple-700"
              >
                {saved ? <CheckCircle className="h-3.5 w-3.5" /> : <Key className="h-3.5 w-3.5" />}
                {saved ? 'Saved' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-gray-400 flex gap-1 items-start">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              Key stored only in your browser localStorage. Never sent to our servers.
            </p>
          </div>

          {hasKey && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 w-full">
              Remove saved API key
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
