let source: () => Date = () => new Date();

/** The single time seam for security records; tests may replace it if needed. */
export function now(): Date {
  return source();
}

export function setClockForTests(next: (() => Date) | undefined): void {
  source = next ?? (() => new Date());
}
