/**
 * Joins class names into one string, dropping anything absent.
 *
 * It exists for one narrow reason: this project builds with
 * noUncheckedIndexedAccess, and a CSS module's generated type is an index
 * signature, so every `styles.foo` is `string | undefined` to the compiler. With
 * exactOptionalPropertyTypes on as well, handing one straight to a `className?:
 * string` prop is a type error. The alternatives were a non-null assertion,
 * which biome forbids here, or widening the props of components another
 * workstream owns.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
