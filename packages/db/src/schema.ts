import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from 'drizzle-orm/sqlite-core';

/** 官网页面路由与 SEO */
export const pages = sqliteTable(
  'pages',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    metaDescription: text('meta_description'),
    isPublished: integer('is_published').default(1),
    locale: text('locale').default('zh-CN'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('idx_pages_slug').on(t.slug), index('idx_pages_published').on(t.isPublished)],
);

/** 官网页面动态内容区块 */
export const pageBlocks = sqliteTable(
  'page_blocks',
  {
    id: text('id').primaryKey(),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    blockType: text('block_type').notNull(),
    sortOrder: integer('sort_order').default(0),
    contentJson: text('content_json').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('idx_blocks_page').on(t.pageId, t.sortOrder)],
);

/** CRM 客户与线索（合一模型） */
export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    companyName: text('company_name'),
    source: text('source').notNull(),
    status: text('status').default('new'), // new / contacting / qualified / lost / won
    dealValue: real('deal_value').default(0),
    assignedTo: text('assigned_to'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('idx_leads_status').on(t.status),
    index('idx_leads_assigned').on(t.assignedTo),
    index('idx_leads_created').on(t.createdAt),
  ],
);

/** CRM 跟进活动记录 */
export const leadActivities = sqliteTable(
  'lead_activities',
  {
    id: text('id').primaryKey(),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    createdBy: text('created_by').notNull(),
    activityType: text('activity_type').notNull(), // call / email / meeting / note
    note: text('note').notNull(),
    nextFollowUp: integer('next_follow_up'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('idx_activities_lead').on(t.leadId, t.createdAt),
    index('idx_activities_next').on(t.nextFollowUp),
  ],
);

/** 官网表单原始归档（审计防漏） */
export const formSubmissions = sqliteTable(
  'form_submissions',
  {
    id: text('id').primaryKey(),
    formId: text('form_id').notNull(),
    payloadJson: text('payload_json').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('idx_submissions_form').on(t.formId, t.createdAt)],
);

export type Page = typeof pages.$inferSelect;
export type PageBlock = typeof pageBlocks.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
