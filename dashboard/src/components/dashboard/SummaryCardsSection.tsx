import { ReactNode } from 'react';
import SummaryCard from '@/components/SummaryCard';

export interface SummaryCardData {
  title: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  rawChartData?: any[];
  valueField?: string;
  comparePercentage?: number | null;
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
    <div className={`sm:gap-section grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {cards.map((card, index) => (
        <SummaryCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          footer={card.footer}
          comparePercentage={card.comparePercentage}
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
