/**
   * Returns a random number between min and max (inclusive)
   * @example
   * ```ts
   * randomRange(1, 5);
   * => // 3
   *
   * randomRange(1, 10, true);
   * => // 3.845013878893512
   * ```
   */
export function randomRange(min: number, max: number, allValues = false) {
  const randomValue = Math.random() * (max - min + 1) + min;
  return allValues ? randomValue : Math.floor(randomValue);
}

/**
  * Returns a random element from an array
  * @example
  * ```ts
  * randomArray([1, 2, 3, 4, 5]);
  * => // 2
  *
  * randomArray(["a", "b", "c", "d", "e"]);
  * => // "d"
  *
  * randomArray([{ a: 1 }, { b: 2 }, { c: 3 }]);
  * => // {c: 3}
  * ```
  */
export function randomArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random boolean
 * @example
 * ```ts
 * randomBoolean();
 * => // true
 * ```
 */
export function randomBoolean() {
  return Math.random() < 0.5;
}

/**
 * Returns the average of an array of numbers
 * @example
 * ```ts
 * averageArray([1, 2, 3, 4, 5, 6]);
 * => // 3.5
 * ```
 */
export function averageArray(arr: number[]) {
  return arr.reduce((a, b) => {
    return a + b;
  }, 0) / arr.length;
}

/**
 * Shuffles the array
 * @example
 * ```ts
 * const arr = [1, 2, 3, 4, 5, 6];
 * shuffleArray(arr);
 * arr => // [3, 1, 5, 2, 6, 4]
 * ```
 */
export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Returns the factorial of a number
 * @example
 * ```ts
 * factorial(5);
 * => // 120
 * ```
 */
export function factorial(n: number): number {
  return n == 0 ? 1 : n * factorial(n - 1);
}

/**
 * Returns a percentage value with a certain amount of decimal places
 * @example
 * ```ts
 * percentage(3, 28);
 * => // 11
 *
 * percentage(3, 28, 2);
 * => // 10.71
 * ```
 */
export function percentage(n: number, total: number, precision = 0) {
  return (n / total * 100 || 0).toFixed(precision);
}

/**
 * Checks if a number is even
 * @example
 * ```ts
 * isEven(2);
 * => // true
 *
 * isEven(3);
 * => // false
 * ```
 */
export function isEven(n: number) {
  return n % 2 == 0;
}

/**
 * Checks if a number is odd
 * @example
 * ```ts
 * isOdd(2);
 * => // false
 *
 * isOdd(3);
 * => // true
 * ```
 */
export function isOdd(n: number) {
  return Math.abs(n % 2) == 1;
}

/**
 * Returns a number clamped between the minimum and maximum values.
 * @example
 * ```ts
 * clamp(11, 1, 10);
 * => // 10
 *
 * clamp(5, 1, 10);
 * => // 5
 * ```
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}
