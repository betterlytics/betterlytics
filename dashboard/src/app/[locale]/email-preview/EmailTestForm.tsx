'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendTestEmail } from '@/app/actions/system/email.action';
import { EMAIL_TEMPLATES, EmailTemplateType } from '@/constants/emailTemplateConst';

export function EmailTestForm() {
  const [email, setEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendTestEmail = () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        await sendTestEmail(email, selectedTemplate as EmailTemplateType);
        setMessage({
          type: 'success',
          text: `Test ${EMAIL_TEMPLATES.find((t) => t === selectedTemplate) || 'email'} sent successfully!`,
        });
        setEmail('');
      } catch (error) {
        console.error('Error sending test email:', error);
        setMessage({
          type: 'error',
          text: 'Failed to send test email. Please check your configuration.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Test Email</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='template'>Email Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder='Select email template' />
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

        <div className='space-y-2'>
          <Label htmlFor='email'>Email Address</Label>
          <Input
            id='email'
            type='email'
            placeholder='test@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>

        <Button onClick={handleSendTestEmail} className='w-full' disabled={isPending}>
          {isPending
            ? 'Sending...'
            : `Send Test ${EMAIL_TEMPLATES.find((t) => t === selectedTemplate) || 'Email'}`}
        </Button>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
