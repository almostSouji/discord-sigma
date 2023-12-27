import kleur from "kleur";

kleur.enabled = true;

type IPredicate<T> = (...args: T[]) => boolean;

type PredicateEntry<T> = {
  color(a0: number | string): string;
  predicate: IPredicate<T>;
};

/**
 * Color a string derived from a determinant based on prediactes of said determinant
 *
 * @param determinant - The structure to determine color and return string by
 * @param stringExtractor - Function to derive the return string from
 * @param predicates  - Predicate structure to determine color by
 * @returns The colored string
 */
export function colorBasedOnDeterminant<T>(
  determinant: T,
  stringExtractor: (a0: T) => string,
  predicates: PredicateEntry<T>[]
): string {
  const res = stringExtractor(determinant);
  for (const { color, predicate } of predicates) {
    if (predicate(determinant)) {
      return color(res);
    }
  }

  return res;
}

/**
 * Color a string based on timestamp difference. red: \< 1 week, yellow: \< 4 weeks
 *
 * @param diff - The  difference to determine color by
 * @param colorString - The string to color
 * @returns Colored string
 */
export function colorBasedOnDifference(diff: number, colorString: string) {
  return colorBasedOnDeterminant<number>(diff, () => colorString, [
    {
      color: kleur.red,
      predicate: () => diff < 1_000 * 60 * 60 * 24 * 7 * 1,
    },
    {
      color: kleur.yellow,
      predicate: () => diff < 1_000 * 60 * 60 * 24 * 7 * 4,
    },
  ]);
}
