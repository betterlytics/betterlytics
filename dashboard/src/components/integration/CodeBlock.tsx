"use client";

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // This provides dark-themed background for code blocks
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';

interface CodeBlockProps {
  code: string;
  language: 'html' | 'javascript';
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <pre ref={codeRef} className={`language-${language} bg-neutral-900 p-4 rounded-md overflow-x-auto text-sm`}>
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
} 