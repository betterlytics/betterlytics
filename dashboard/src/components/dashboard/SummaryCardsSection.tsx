import { ReactNode } from 'react';
import SummaryCard from '@/components/SummaryCard';

export interface SummaryCardData {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  rawChartData?: any[];
  valueField?: string;
  chartColor?: string;
  isActive?: boolean;
  onClick?: () => void;
}

type SummaryCardsSectionProps = {
  cards: SummaryCardData[];
  className?: string;
};

export default function SummaryCardsSection({ cards, className }: SummaryCardsSectionProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {cards.map((card, index) => (
        <SummaryCard
          key={`${card.title}-${index}`}
          title={card.title}
          value={card.value}
          icon={card.icon}
          rawChartData={card.rawChartData}
          valueField={card.valueField}
          chartColor={card.chartColor}
          isActive={card.isActive}
          onClick={card.onClick}
        />
      ))}
    </div>
  );
}
