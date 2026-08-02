import { Braces as BracesIcon, TagsIcon } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';

export const PROPERTY_SOURCE_ICONS: Record<PropertySourceKind, ReactElement> = {
  gp: <TagsIcon />,
  cep: <BracesIcon />,
};
