import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const notes=sqliteTable('notes',{
  id:text('id').primaryKey(),
  day:integer('day').notNull(),
  author:text('author').notNull(),
  text:text('text').notNull(),
  createdAt:text('created_at').notNull(),
},table=>[index('notes_day_created').on(table.day,table.createdAt)]);
