export interface LogPushProps {
    maxFooBar: string;
}
export declare function camelToSnakeObjectDeep<T>(obj: T): T extends undefined ? undefined : T extends object ? CamelToSnake<T> : T;
type IsUpper<C extends string> = C extends Uppercase<C> ? C extends Lowercase<C> ? false : true : false;
type IsLower<C extends string> = C extends Lowercase<C> ? C extends Uppercase<C> ? false : true : false;
type CamelToSnakeString<S extends string, Acc extends string = ""> = S extends `${infer First}${infer Second}${infer Rest}` ? IsUpper<First> extends true ? IsUpper<Second> extends true ? Rest extends `${infer Third}${infer _}` ? IsLower<Third> extends true ? CamelToSnakeString<Rest, `${Acc}${Lowercase<First>}_${Lowercase<Second>}`> : CamelToSnakeString<`${Second}${Rest}`, `${Acc}${Lowercase<First>}`> : CamelToSnakeString<`${Second}${Rest}`, `${Acc}${Lowercase<First>}`> : CamelToSnakeString<`${Second}${Rest}`, Acc extends "" ? `${Lowercase<First>}` : `${Acc}_${Lowercase<First>}`> : IsLower<First> extends true ? IsUpper<Second> extends true ? CamelToSnakeString<`${Second}${Rest}`, `${Acc}${First}`> : CamelToSnakeString<`${Second}${Rest}`, `${Acc}${First}`> : CamelToSnakeString<`${Second}${Rest}`, `${Acc}${First}`> : S extends `${infer Last}` ? `${Acc}${Lowercase<Last>}` : Acc;
type CamelToSnake<T> = T extends object ? T extends Array<infer U> ? Array<CamelToSnake<U>> : T extends Date | RegExp | Function ? T : {
    [K in keyof T as K extends string ? CamelToSnakeString<K> : K]: CamelToSnake<T[K]>;
} : T;
export {};
//# sourceMappingURL=camel-to-snake.d.ts.map