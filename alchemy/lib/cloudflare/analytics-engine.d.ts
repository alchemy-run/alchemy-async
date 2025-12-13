export interface AnalyticsEngineDatasetProps {
    /**
     * The name of the dataset to bind to -
     * becomes the table name to query via the api in the FROM clause
     */
    dataset: string;
}
export type AnalyticsEngineDataset = {
    type: "analytics_engine";
    id: string;
    dataset: string;
};
/**
 * Creates a binding for an Analytics Engine dataset.
 *
 * @example
 * ```ts
 * // Create a binding for an Analytics Engine dataset
 * const dataset = AnalyticsEngineDataset("ae-dataset", {
 *   dataset: "WEATHER",
 * });
 * ```
 */
export declare function AnalyticsEngineDataset(id: string, props: AnalyticsEngineDatasetProps): AnalyticsEngineDataset;
//# sourceMappingURL=analytics-engine.d.ts.map