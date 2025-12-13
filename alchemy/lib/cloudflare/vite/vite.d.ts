import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { type WebsiteProps } from "../website.ts";
import type { Worker } from "../worker.ts";
export interface ViteProps<B extends Bindings> extends WebsiteProps<B> {
}
export type Vite<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
export declare function Vite<B extends Bindings>(id: string, props: ViteProps<B>): Promise<Vite<B>>;
//# sourceMappingURL=vite.d.ts.map