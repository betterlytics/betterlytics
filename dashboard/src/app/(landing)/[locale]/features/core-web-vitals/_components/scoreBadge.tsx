import { useLocale, useTranslations } from 'next-intl';
import { getPerformanceGrade } from '@/utils/coreWebVitals';
import levels from '@/landing/components/ui/vitalLevels.module.css';

export function ScoreBadge({ score }: { score: number }) {
  const t = useTranslations('landing.vitals.breakdown.badges');
  const locale = useLocale();
  const grade = getPerformanceGrade(score);
  const decimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <span className={levels.badge} data-grade={grade}>
      {t(grade)} {decimal.format(score)}
    </span>
  );
}
