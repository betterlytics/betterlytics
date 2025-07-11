'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { addTFunction, BADictionary, RawDictionary, loadDictionary, SupportedLanguages } from '@/dictionaries/dictionaries';

interface DictionaryContextValue {
  dictionary: BADictionary;
  currentLanguage: SupportedLanguages;
  changeLanguage: (language: SupportedLanguages) => Promise<void>;
  isLoading: boolean;
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

type DictionaryProviderProps = {
  dictionary: RawDictionary;
  initialLanguage: SupportedLanguages;
  children: React.ReactNode;
};

export default function DictionaryProvider({
  dictionary: initialDictionary,
  initialLanguage,
  children,
}: DictionaryProviderProps) {
  const [dictionary, setDictionary] = useState(() => addTFunction(initialDictionary));
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [isLoading, setIsLoading] = useState(false);

  const changeLanguage = useCallback(
    async (language: SupportedLanguages) => {
      if (language === currentLanguage) return;

      setIsLoading(true);
      try {
        const newDictionary = await loadDictionary(language);
        setDictionary(newDictionary);
        setCurrentLanguage(language);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage],
  );

  return (
    <DictionaryContext.Provider
      value={{
        dictionary,
        currentLanguage,
        changeLanguage,
        isLoading,
      }}
    >
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (context === null) {
    throw new Error('useDictionary hook must be used within DictionaryProvider');
  }
  return context;
}
