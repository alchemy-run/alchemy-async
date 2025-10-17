import { mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";

export const sampleTable = mysqlTable("sample_table", {
  id: serial("id").primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
});
