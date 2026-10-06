import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const workspace=sqliteTable('workspace',{id:text('id').primaryKey(),revision:integer('revision').notNull().default(1),data:text('data').notNull()});
