export function chunk<T>(arr: T[], size: number): T[][] {
  return arr.reduce(
    (newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]),
    [] as T[][]
  )
};

export const omitText = (text: string, maxLength: number, ellipsis: string = "...") => {
  return text.length >= maxLength
    ? text.slice(0, maxLength - ellipsis.length) + ellipsis
    : text
}