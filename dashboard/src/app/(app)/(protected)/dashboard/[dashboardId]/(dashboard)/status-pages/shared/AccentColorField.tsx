'use client';

import { useTranslations } from 'next-intl';
import { ColorPickerPopover } from '@/components/ColorPickerPopover';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { ACCENT_PRESETS } from './constants';

type AccentColorFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function AccentColorField({ value, onChange }: AccentColorFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <ColorSwatchPicker
      label={t('accentColor')}
      options={ACCENT_PRESETS.map((preset) => ({ value: preset, hex: preset }))}
      value={value}
      onChange={onChange}
    >
      <ColorPickerPopover
        value={value}
        onChange={onChange}
        selected={!ACCENT_PRESETS.includes(value)}
        ariaLabel={t('accentColor')}
      />
    </ColorSwatchPicker>
  );
}
