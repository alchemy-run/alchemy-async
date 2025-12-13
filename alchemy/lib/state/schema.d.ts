import type { Resource as AlchemyResource, ResourceProps } from "../resource.ts";
export declare const resources: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "resources";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "resources";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        scope: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "scope";
            tableName: "resources";
            dataType: "json";
            columnType: "SQLiteTextJson";
            data: string[];
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: string[];
        }>;
        status: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "status";
            tableName: "resources";
            dataType: "string";
            columnType: "SQLiteText";
            data: "creating" | "created" | "updating" | "updated" | "deleting" | "deleted";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["creating", "created", "updating", "updated", "deleting", "deleted"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        kind: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "kind";
            tableName: "resources";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        fqn: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "fqn";
            tableName: "resources";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        seq: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "seq";
            tableName: "resources";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        data: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "data";
            tableName: "resources";
            dataType: "json";
            columnType: "SQLiteTextJson";
            data: Record<string, any>;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: Record<string, any>;
        }>;
        props: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "props";
            tableName: "resources";
            dataType: "json";
            columnType: "SQLiteTextJson";
            data: ResourceProps;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: ResourceProps;
        }>;
        oldProps: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "oldProps";
            tableName: "resources";
            dataType: "json";
            columnType: "SQLiteTextJson";
            data: ResourceProps;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: ResourceProps;
        }>;
        output: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "output";
            tableName: "resources";
            dataType: "json";
            columnType: "SQLiteTextJson";
            data: AlchemyResource<string>;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: AlchemyResource<string>;
        }>;
    };
    dialect: "sqlite";
}>;
export type Resource = typeof resources.$inferSelect;
//# sourceMappingURL=schema.d.ts.map