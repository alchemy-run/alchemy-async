import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";
export interface ReactRouterProps<B extends Bindings> extends ViteProps<B> {
    /**
     * @default workers/app.ts
     */
    main?: string;
}
export type ReactRouter<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
export declare function ReactRouter<B extends Bindings>(id: string, props?: ReactRouterProps<B>): Promise<ReactRouter<B>>;
//# sourceMappingURL=react-router.d.ts.map