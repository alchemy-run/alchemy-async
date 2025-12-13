import type { Assets } from "./assets.ts";
import type { Bindings } from "./bindings.ts";
import { type WebsiteProps } from "./website.ts";
import type { Worker } from "./worker.ts";
export interface NextjsProps<B extends Bindings> extends WebsiteProps<B> {
}
export type Nextjs<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
export declare function Nextjs<const B extends Bindings>(id: string, props?: NextjsProps<B>): Promise<Nextjs<B>>;
//# sourceMappingURL=next.d.ts.map