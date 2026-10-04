'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // This provides dark-themed background for code blocks
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-bash';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/hooks/use-copy';

interface CodeBlockProps {
  code: string;
  language: 'html' | 'javascript' | 'bash';
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <div className='relative min-w-0 overflow-hidden'>
      <Button
        variant='ghost'
        size='icon'
        className='text-muted-foreground hover:text-foreground absolute top-2 right-2 h-8 w-8'
        onClick={() => copy(code)}
        aria-label='Copy code'
      >
        {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
      </Button>
      <pre
        ref={codeRef}
        className={`language-${language} dark:bg-input/30 overflow-x-auto rounded-md bg-transparent p-4 pr-12 text-sm`}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
