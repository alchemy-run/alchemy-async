export type type<T> = typeof type<T>;
/**
 * Used to construct type-level alias information.
 */
export declare const type: (<T>() => T) & (new <T>() => T);
//# sourceMappingURL=type.d.ts.map