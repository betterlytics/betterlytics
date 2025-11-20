import type { FC } from 'react';

type ConnectorProps = {
	ariaLabel?: string;
};

// A simple horizontal dashed connector with an arrowhead
export const Connector: FC<ConnectorProps> = ({ ariaLabel }) => {
	return (
		<div className='flex min-w-16 items-center justify-center' aria-hidden={ariaLabel ? undefined : true} aria-label={ariaLabel}>
			<svg
				className='text-muted-foreground h-6 w-full'
				viewBox='0 0 100 12'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'
				role='img'
				aria-hidden='true'
			>
				<line x1='0' y1='6' x2='92' y2='6' stroke='currentColor' strokeWidth='2' strokeDasharray='4 4' />
				<polygon points='92,2 100,6 92,10' fill='currentColor' />
			</svg>
		</div>
	);
};

export default Connector;



