interface IntegrationIconProps {
  iconSrc: string;
  name: string;
}

export function IntegrationIcon({ iconSrc, name }: IntegrationIconProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-16">
      <img
        src={iconSrc}
        alt={name}
        className="w-10 h-10 object-contain"
      />
      <span className="text-sm text-[color:var(--muted-foreground)]">
        {name}
      </span>
    </div>
  );
}
