declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(value: unknown): {
    toBe(expected: unknown): void;
    toBeArray(): void;
    toBeString(): void;
    toBeDefined(): void;
    toBeGreaterThan(value: number): void;
    toHaveBeenCalledTimes(count: number): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
  };
}
