import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";
export interface TanStackStartProps<B extends Bindings> extends ViteProps<B> {
}
export type TanStackStart<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
export declare function TanStackStart<B extends Bindings>(id: string, props?: Partial<TanStackStartProps<B>>): Promise<TanStackStart<B>>;
//# sourceMappingURL=tanstack-start.d.ts.map