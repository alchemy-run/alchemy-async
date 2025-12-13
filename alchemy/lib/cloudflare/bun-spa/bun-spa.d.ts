import type { Bindings } from "../bindings.ts";
import { Website, type WebsiteProps } from "../website.ts";
export interface BunSPAProps<B extends Bindings> extends WebsiteProps<B> {
    /**
     * The path to the frontend entrypoints that bun should bundle for deployment & serve in dev mode.
     * These are usually html files. Glob patterns are supported.
     * Typically set to src/index.html
     */
    frontend: string | string[];
    outDir?: string;
}
export type BunSPA<B extends Bindings> = Website<B> & {
    apiUrl: string;
};
export declare function BunSPA<B extends Bindings>(id: string, props: BunSPAProps<B>): Promise<BunSPA<B> & {
    apiUrl: string;
}>;
//# sourceMappingURL=bun-spa.d.ts.map