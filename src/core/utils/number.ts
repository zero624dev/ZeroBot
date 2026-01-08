/**
 * 숫자를 4자리씩 쪼개서 유니코드 문자로 인코딩합니다.
 * @param decimal 인코딩할 숫자
 * @returns 인코딩된 유니코드 문자열
 * @example
 * ```ts
 * encodeDecimalToUnicode(1234567890) 
 * => // "\u{41234}\u{45678}\u{20090}"
 * ```
 */
export function encodeDecimalToUnicode(decimal: number | bigint): string {
  const string = String(decimal);
  const parts = [];
  for (let i = 0; i < string.length; i += 4) {
    const chunk = string.slice(i, i + 4);
    parts.push(Number(chunk) + (chunk.length * 10000));
  }
  return String.fromCodePoint(...parts);
}

/**
 * 유니코드 문자로 인코딩된 숫자를 디코딩합니다.
 * @param encoded 디코딩할 유니코드 문자열
 * @returns 디코딩된 숫자
 * @example
 * ```ts
 * decodeUnicodeToDecimal("\u{41234}\u{45678}\u{20090}") 
 * => // 1234567890n
 * ```
 */
export function decodeUnicodeToDecimal(encoded: string): bigint {
  let result = "";
  for (const char of encoded) {
    const code = char.codePointAt(0)!;
    const digitCount = ~~(code / 10000);
    const chunk = String(code - digitCount * 10000).padStart(digitCount, '0');
    result += chunk;
  }
  return BigInt(result);
}

/**
 * 유니코드 문자로 인코딩된 숫자를 디코딩하여 문자열로 반환합니다.
 * @param encoded 디코딩할 유니코드 문자열
 * @returns 디코딩된 숫자 문자열
 * @example
 * ```ts
 * decodeUnicodeToDecimalButString("\u{41234}\u{45678}\u{20090}") 
 * => // "1234567890"
 * ```
 */
export function decodeUnicodeToDecimalButString(encoded: string): string {
  let result = "";
  for (const char of encoded) {
    const code = char.codePointAt(0)!;
    const digitCount = ~~(code / 10000);
    const chunk = String(code - digitCount * 10000).padStart(digitCount, '0');
    result += chunk;
  }
  return result;
}