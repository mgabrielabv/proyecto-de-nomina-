export function randomLatency(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function withLatency<T>(value: T, min: number, max: number): Promise<T> {
  await delay(randomLatency(min, max));
  return value;
}
