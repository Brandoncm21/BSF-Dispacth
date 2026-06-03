export function calculateDispatchFee(rate: number, dispatchFeePct: number): number {
  return (rate * dispatchFeePct) / 100;
}

export function calculateNetProfit(rate: number, dispatchFee: number): number {
  return rate - dispatchFee;
}
