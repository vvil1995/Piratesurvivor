// Segundos de simulación: pausa, menús y travesías no adelantan estas ventanas.
export const MORGAN_ROUTE = {
  availableAt: 300, firstDelay: 45, retryMin: 45, retryExtra: 45,
  signalLife: 90, radius: 24, distanceMin: 180, distanceExtra: 120,
  voyageSeconds: 3, recoveryHp: 25, recoveryGrace: 2.5,
} as const;
