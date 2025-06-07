import React from 'react';

type VisualDotProps = {
  color: 'red' | 'green' | 'blue' | 'purple';
};

const VisualDot = React.memo(({ color }: VisualDotProps) => {
  const innerDotColor = `bg-${color}-500`;
  const outerDotColor = `${innerDotColor}/20`;

  return (
    <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${outerDotColor}`}>
      <div className={`h-2 w-2 rounded-full ${innerDotColor}`}></div>
    </div>
  );
});

VisualDot.displayName = 'VisualDot';

export default VisualDot;
