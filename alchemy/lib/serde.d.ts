import { type Scope } from "./scope.ts";
import { Secret } from "./secret.ts";
import type { Type } from "arktype";
export type Serialized<T> = T extends undefined | null | boolean | number | string | bigint ? T : T extends Type<any, any> ? {
    "@schema": string;
} : T extends Secret<string> ? {
    "@secret": string;
} : T extends Secret<any> ? {
    "@secret": {
        object: string;
    };
} : T extends Date ? {
    "@date": string;
} : T extends Symbol ? {
    "@symbol": string;
} : T extends Scope ? {
    "@scope": null;
} : T extends Function ? undefined : T extends Array<infer U> ? Array<Serialized<U>> : T extends object ? {
    [K in keyof T as K extends symbol ? string : K]: Serialized<T[K]>;
} : T;
export declare function serialize(scope: Scope, value: any, options?: {
    encrypt?: boolean;
    transform?: (value: any) => any;
}): Promise<any>;
export declare function deserialize(scope: Scope, value: any, options?: {
    transform?: (value: any) => undefined | {
        value: any;
    };
}): Promise<any>;
export declare const isBinary: (value: any) => value is Buffer | Uint8Array | ArrayBuffer | Blob | ReadableStream;
export declare const serializeBinary: (value: Buffer | Uint8Array | ArrayBuffer | Blob | ReadableStream) => Promise<string>;
export declare function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer>;
//# sourceMappingURL=serde.d.ts.map