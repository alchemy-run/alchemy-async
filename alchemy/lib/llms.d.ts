export interface AlchemyRule {
    name: string;
    rule: string;
    description?: string;
    alwaysApply?: boolean;
    globs?: string | string[];
}
declare const alchemyRules: AlchemyRule[];
export default alchemyRules;
//# sourceMappingURL=llms.d.ts.map