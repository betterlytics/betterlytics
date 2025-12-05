'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEmailPreview } from '@/app/actions/system/email';
import { EMAIL_TEMPLATES, EmailTemplateType } from '@/constants/emailTemplateConst';

interface EmailPreviewCardProps {
  initialTemplate?: EmailTemplateType;
}

export function EmailPreviewCard({ initialTemplate = 'welcome' }: EmailPreviewCardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPending, startTransition] = useTransition();

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

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Email Preview</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className='relative overflow-hidden rounded-lg border bg-white' style={{ height: '500px' }}>
          {isPending && <span>Loading preview...</span>}
          <div className='h-full w-full overflow-auto p-4' dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </CardContent>
    </Card>
  );
}
