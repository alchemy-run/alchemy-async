export type AccountId = string & {
    readonly __brand: "AccountId";
};
/**
 * Helper to get the current AWS account ID
 */
export declare function AccountId(): Promise<AccountId>;
//# sourceMappingURL=account-id.d.ts.map