export interface LogPushProps {
  maxFooBar: string;
}

export function camelToSnakeObjectDeep<T extends object | undefined>(
  obj: T,
): T extends undefined ? undefined : CamelToSnake<T> {
  return (
    obj
      ? Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [
            key
              .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2") // Handle consecutive capitals: "FOOBar" -> "FOO_Bar"
              .replace(/([a-z])([A-Z])/g, "$1_$2") // Handle normal camelCase: "fooBar" -> "foo_Bar"
              .toLowerCase(),
            Array.isArray(value)
              ? value.map(camelToSnakeObjectDeep)
              : typeof value === "object" && value !== null
                ? camelToSnakeObjectDeep(value)
                : value,
          ]),
        )
      : undefined
  ) as T extends undefined ? undefined : CamelToSnake<T>;
}

// Helper to check if a character is uppercase
type IsUpper<C extends string> = C extends Uppercase<C>
  ? C extends Lowercase<C>
    ? false // Not a letter
    : true // Uppercase letter
  : false;

// Helper to check if a character is lowercase
type IsLower<C extends string> = C extends Lowercase<C>
  ? C extends Uppercase<C>
    ? false // Not a letter
    : true // Lowercase letter
  : false;

// Convert a camelCase string to snake_case at the type level
type CamelToSnakeString<
  S extends string,
  Acc extends string = "",
> = S extends `${infer First}${infer Second}${infer Rest}`
  ? IsUpper<First> extends true
    ? IsUpper<Second> extends true
      ? // FOO... pattern - check if next char is lowercase
        Rest extends `${infer Third}${infer _}`
        ? IsLower<Third> extends true
          ? // FOOBar -> add First, add _, add Second lowercase, continue with Rest
            CamelToSnakeString<
              Rest,
              `${Acc}${Lowercase<First>}_${Lowercase<Second>}`
            >
          : // FOO -> continue
            CamelToSnakeString<`${Second}${Rest}`, `${Acc}${Lowercase<First>}`>
        : // Only two chars left, both upper
          CamelToSnakeString<`${Second}${Rest}`, `${Acc}${Lowercase<First>}`>
      : // FooBar or Foo - add underscore before uppercase if not at start
        CamelToSnakeString<
          `${Second}${Rest}`,
          Acc extends "" ? `${Lowercase<First>}` : `${Acc}_${Lowercase<First>}`
        >
    : IsLower<First> extends true
      ? IsUpper<Second> extends true
        ? // fooBar -> just add the lowercase char, underscore will be added when processing uppercase
          CamelToSnakeString<`${Second}${Rest}`, `${Acc}${First}`>
        : // foobar -> continue
          CamelToSnakeString<`${Second}${Rest}`, `${Acc}${First}`>
      : // Number or special char
        CamelToSnakeString<`${Second}${Rest}`, `${Acc}${First}`>
  : S extends `${infer Last}`
    ? `${Acc}${Lowercase<Last>}`
    : Acc;

// Deep transformation for objects
type CamelToSnake<T> = T extends object
  ? T extends Array<infer U>
    ? Array<CamelToSnake<U>>
    : T extends Date | RegExp | Function
      ? T // Don't transform special object types
      : {
          [K in keyof T as K extends string
            ? CamelToSnakeString<K>
            : K]: CamelToSnake<T[K]>;
        }
  : T;
