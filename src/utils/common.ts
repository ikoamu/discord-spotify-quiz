export function chunk<T>(arr: T[], size: number): T[][] {
  return arr.reduce(
    (newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]),
    [] as T[][]
  )
};

export const omitText = (
  text: string,
  suffix: string,
  maxLength: number,
  ellipsis: string = "..."
) => {
  const allText = text + suffix;
  if (allText.length > maxLength) {
    return text.slice(0, maxLength - suffix.length - ellipsis.length) + ellipsis + suffix;
  }

  return text + suffix;
}