export type WorkerMigrations = SingleStepMigration | MultiStepMigration;
export declare function isSingleStepMigration(migration: WorkerMigrations): migration is SingleStepMigration;
export interface SingleStepMigration {
    /**
     * A list of classes to delete Durable Object namespaces from
     */
    deleted_classes?: string[];
    /**
     * A list of classes to create Durable Object namespaces from
     */
    new_classes?: string[];
    /**
     * A list of classes to create Durable Object namespaces with SQLite from
     */
    new_sqlite_classes?: string[];
    /**
     * Tag to set as the latest migration tag
     */
    new_tag?: string;
    /**
     * Tag used to verify against the latest migration tag for this Worker.
     * If they don't match, the upload is rejected.
     */
    old_tag?: string;
    /**
     * A list of classes with Durable Object namespaces that were renamed
     */
    renamed_classes?: RenamedClass[];
    /**
     * A list of transfers for Durable Object namespaces from a different Worker
     * and class to a class defined in this Worker
     */
    transferred_classes?: TransferredClass[];
}
/**
 * Represents a renamed class in a Durable Object migration
 */
export interface RenamedClass {
    /**
     * Original class name
     */
    from: string;
    /**
     * New class name
     */
    to: string;
}
/**
 * Represents a transferred class in a Durable Object migration
 */
export interface TransferredClass {
    /**
     * Original class name
     */
    from: string;
    /**
     * Original script name
     */
    from_script: string;
    /**
     * New class name in this Worker
     */
    to: string;
}
export declare function isMultiStepMigration(migration: WorkerMigrations): migration is MultiStepMigration;
/**
 * Represents a multi-step migration for Durable Objects
 */
export interface MultiStepMigration {
    /**
     * Tag to set as the latest migration tag
     */
    new_tag?: string;
    /**
     * Tag used to verify against the latest migration tag for this Worker.
     * If they don't match, the upload is rejected.
     */
    old_tag?: string;
    /**
     * Migrations to apply in order
     */
    steps: MigrationStep[];
}
/**
 * Represents a single step in a Durable Object migration
 */
export interface MigrationStep {
    /**
     * A list of classes to delete Durable Object namespaces from
     */
    deleted_classes?: string[];
    /**
     * A list of classes to create Durable Object namespaces from
     */
    new_classes?: string[];
    /**
     * A list of classes to create Durable Object namespaces with SQLite from
     */
    new_sqlite_classes?: string[];
    /**
     * A list of classes with Durable Object namespaces that were renamed
     */
    renamed_classes?: RenamedClass[];
    /**
     * A list of transfers for Durable Object namespaces from a different Worker
     * and class to a class defined in this Worker
     */
    transferred_classes?: TransferredClass[];
}
//# sourceMappingURL=worker-migration.d.ts.map