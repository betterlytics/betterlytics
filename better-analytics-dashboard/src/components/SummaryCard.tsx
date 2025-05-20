import React from "react";

interface SummaryCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  changeText: React.ReactNode;
  changeColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, changeText, changeColor = "text-muted-foreground" }) => (
  <div className="bg-card text-card-foreground rounded-lg p-4 shadow border border-border flex flex-col">
    <span className="text-sm text-muted-foreground">{title}</span>
    <span className="text-2xl font-bold text-foreground mt-2">{value}</span>
    <span className={`text-xs mt-1 ${changeColor}`}>{changeText}</span>
  </div>
);

export default SummaryCard; 