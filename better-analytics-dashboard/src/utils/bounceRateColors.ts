/*
* Can be used to assign cell colors based on bounce rate
*/
export const getBounceRateColor = (bounceRate: number): string => {
  if (bounceRate < 40) return 'bg-green-100 text-green-800';
  if (bounceRate <= 70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};