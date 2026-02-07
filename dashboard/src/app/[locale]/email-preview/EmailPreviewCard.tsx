'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getEmailPreview } from '@/app/actions/system/email.action';
import { EMAIL_TEMPLATES, EmailTemplateType } from '@/constants/emailTemplateConst';
import { Copy, Check } from 'lucide-react';

interface EmailPreviewCardProps {
  initialTemplate?: EmailTemplateType;
}

export function EmailPreviewCard({ initialTemplate = 'welcome' }: EmailPreviewCardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const loadPreview = (template: EmailTemplateType) => {
    startTransition(async () => {
      try {
        const html = await getEmailPreview(template);
        setPreviewHtml(html);
      } catch (error) {
        console.error('Error loading email preview:', error);
        setPreviewHtml('<p>Failed to load email preview</p>');
      }
    });
  };

  useEffect(() => {
    loadPreview(selectedTemplate as EmailTemplateType);
  }, [selectedTemplate]);

  const handleTemplateChange = (template: EmailTemplateType) => {
    setSelectedTemplate(template);
  };

  const copyHtml = async () => {
    await navigator.clipboard.writeText(previewHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Email Preview</CardTitle>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={copyHtml} disabled={!previewHtml || isPending}>
              {copied ? <Check className='mr-1 h-4 w-4' /> : <Copy className='mr-1 h-4 w-4' />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </Button>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Select template' />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template} value={template}>
                    {template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='relative overflow-hidden rounded-lg border bg-white' style={{ height: '600px' }}>
          {isPending && <span>Loading preview...</span>}
          <iframe srcDoc={previewHtml} className='h-full w-full' title='Email Preview' />
        </div>
      </CardContent>
    </Card>
  );
}
