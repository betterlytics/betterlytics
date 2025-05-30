'use client';

import { createContext, useContext } from 'react';
import { BADictionary } from '@/dictionaries/dictionaries';

const DictionaryContext = createContext<BADictionary | null>(null);

type DictionaryProviderProps = {
  dictionary: BADictionary;
  children: React.ReactNode;
};

export default function DictionaryProvider({ dictionary, children }: DictionaryProviderProps) {
  return <DictionaryContext.Provider value={dictionary}>{children}</DictionaryContext.Provider>;
}

export function useDictionary() {
  const dictionary = useContext(DictionaryContext);
  if (dictionary === null) {
    throw new Error('useDictionary hook must be used within DictionaryProvider');
  }

  return dictionary;
}
