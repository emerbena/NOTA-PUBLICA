import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const created = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const user = pgTable('np_user', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: created(),
  updatedAt: updated(),
});
export const session = pgTable(
  'np_session',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index('np_session_user').on(t.userId)],
);
export const account = pgTable(
  'np_account',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex('np_account_provider').on(t.providerId, t.accountId)],
);
export const verification = pgTable('np_verification', {
  id: id(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: updated(),
});
export const role = pgTable('np_role', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});
export const permission = pgTable('np_permission', { id: text('id').primaryKey() });
export const rolePermission = pgTable(
  'np_role_permission',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => role.id),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permission.id),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);
export const staff = pgTable('np_staff', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id),
  roleId: text('role_id')
    .notNull()
    .references(() => role.id),
  active: boolean('active').notNull().default(true),
  canApprove: boolean('can_approve').notNull().default(false),
  updatedAt: updated(),
});
export const authors = pgTable('np_author', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  bio: text('bio').notNull().default(''),
  specialty: text('specialty').notNull().default(''),
  photo: text('photo').notNull().default(''),
  active: boolean('active').notNull().default(true),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: created(),
});
export const categories = pgTable('np_category', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  createdAt: created(),
});
export const media = pgTable('np_media', {
  id: id(),
  url: text('url').notNull(),
  pathname: text('pathname').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  alt: text('alt').notNull(),
  createdBy: text('created_by').references(() => user.id),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: created(),
});
export const articles = pgTable(
  'np_article',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id),
    state: text('state').notNull().default('draft'),
    currentVersion: integer('current_version').notNull().default(1),
    approvedVersion: integer('approved_version'),
    publishedVersion: integer('published_version'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    isDemo: boolean('is_demo').notNull().default(false),
    featured: integer('featured').notNull().default(0),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    index('np_article_queue').on(t.state, t.scheduledAt),
    index('np_article_public').on(t.isDemo, t.publishedAt),
    check(
      'np_article_state',
      sql`${t.state} in ('draft','review','changes','approved','scheduled','published','rejected','archived')`,
    ),
  ],
);
export const revisions = pgTable(
  'np_revision',
  {
    id: id(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id),
    version: integer('version').notNull(),
    title: text('title').notNull(),
    kicker: text('kicker').notNull().default(''),
    summary: text('summary').notNull(),
    body: text('body').notNull(),
    cover: text('cover').notNull().default(''),
    coverAlt: text('cover_alt').notNull().default(''),
    caption: text('caption').notNull().default(''),
    kind: text('kind').notNull().default('news'),
    authorId: text('author_id')
      .notNull()
      .references(() => authors.id),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    editorId: text('editor_id')
      .notNull()
      .references(() => user.id),
    changeNote: text('change_note').notNull().default(''),
    createdAt: created(),
  },
  (t) => [uniqueIndex('np_revision_number').on(t.articleId, t.version)],
);
export const tags = pgTable('np_tag', { id: id(), name: text('name').notNull().unique() });
export const revisionTags = pgTable(
  'np_revision_tag',
  {
    revisionId: text('revision_id')
      .notNull()
      .references(() => revisions.id),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.revisionId, t.tagId] })],
);
export const sources = pgTable('np_source', {
  id: id(),
  url: text('url').notNull().unique(),
  name: text('name').notNull(),
  createdAt: created(),
});
export const revisionSources = pgTable(
  'np_revision_source',
  {
    revisionId: text('revision_id')
      .notNull()
      .references(() => revisions.id),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
  },
  (t) => [primaryKey({ columns: [t.revisionId, t.sourceId] })],
);
export const revisionMedia = pgTable(
  'np_revision_media',
  {
    revisionId: text('revision_id')
      .notNull()
      .references(() => revisions.id),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id),
  },
  (t) => [primaryKey({ columns: [t.revisionId, t.mediaId] })],
);
export const reviews = pgTable('np_review', {
  id: id(),
  articleId: text('article_id')
    .notNull()
    .references(() => articles.id),
  revisionId: text('revision_id')
    .notNull()
    .references(() => revisions.id),
  actorId: text('actor_id')
    .notNull()
    .references(() => user.id),
  decision: text('decision').notNull(),
  comment: text('comment').notNull().default(''),
  createdAt: created(),
});
export const audit = pgTable(
  'np_audit',
  {
    id: id(),
    actorId: text('actor_id').references(() => user.id),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    details: jsonb('details').notNull().default({}),
    createdAt: created(),
  },
  (t) => [index('np_audit_date').on(t.createdAt)],
);
export const calendar = pgTable('np_calendar', {
  id: id(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  assigneeId: text('assignee_id').references(() => user.id),
  articleId: text('article_id').references(() => articles.id),
  createdAt: created(),
});
export const rankings = pgTable(
  'np_ranking',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    method: text('method').notNull(),
    published: boolean('published').notNull().default(false),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [check('np_ranking_method', sql`${t.method} in ('editorial','votes','criteria')`)],
);
export const rankingEntries = pgTable(
  'np_ranking_entry',
  {
    id: id(),
    rankingId: text('ranking_id')
      .notNull()
      .references(() => rankings.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    position: integer('position').notNull(),
    score: integer('score').notNull().default(0),
  },
  (t) => [
    uniqueIndex('np_ranking_position').on(t.rankingId, t.position),
    check('np_positive_position', sql`${t.position}>0`),
  ],
);
export const rankingCriteria = pgTable('np_ranking_criterion', {
  id: id(),
  rankingId: text('ranking_id')
    .notNull()
    .references(() => rankings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
});
export const polls = pgTable(
  'np_poll',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    question: text('question').notNull(),
    scope: text('scope').notNull(),
    status: text('status').notNull().default('draft'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: created(),
  },
  (t) => [
    check('np_poll_dates', sql`${t.endsAt}>${t.startsAt}`),
    check('np_poll_status', sql`${t.status} in ('draft','active','closed')`),
  ],
);
export const pollOptions = pgTable('np_poll_option', {
  id: id(),
  pollId: text('poll_id')
    .notNull()
    .references(() => polls.id),
  label: text('label').notNull(),
});
export const votes = pgTable(
  'np_vote',
  {
    id: id(),
    pollId: text('poll_id')
      .notNull()
      .references(() => polls.id),
    optionId: text('option_id')
      .notNull()
      .references(() => pollOptions.id),
    voterHash: text('voter_hash').notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex('np_vote_once').on(t.pollId, t.voterHash)],
);
export const rankingVotes = pgTable(
  'np_ranking_vote',
  {
    id: id(),
    rankingId: text('ranking_id')
      .notNull()
      .references(() => rankings.id),
    entryId: text('entry_id')
      .notNull()
      .references(() => rankingEntries.id),
    voterHash: text('voter_hash').notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex('np_ranking_vote_once').on(t.rankingId, t.voterHash)],
);
export const awards = pgTable('np_award', {
  id: id(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  description: text('description').notNull(),
  published: boolean('published').notNull().default(false),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: created(),
});
export const nominations = pgTable('np_nomination', {
  id: id(),
  awardId: text('award_id')
    .notNull()
    .references(() => awards.id),
  category: text('category').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  winner: boolean('winner').notNull().default(false),
});
export const distribution = pgTable(
  'np_distribution',
  {
    id: id(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id),
    revisionId: text('revision_id')
      .notNull()
      .references(() => revisions.id),
    platform: text('platform').notNull(),
    state: text('state').notNull().default('draft'),
    text: text('text').notNull().default(''),
    remoteId: text('remote_id'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: created(),
  },
  (t) => [uniqueIndex('np_distribution_target').on(t.revisionId, t.platform)],
);
export const aiRuns = pgTable('np_ai_run', {
  id: id(),
  task: text('task').notNull(),
  state: text('state').notNull(),
  provenance: jsonb('provenance').notNull().default([]),
  proposal: jsonb('proposal'),
  createdAt: created(),
});
export const rateLimits = pgTable('np_rate_limit', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const subscribers = pgTable('np_subscriber', {
  id: id(),
  email: text('email').notNull().unique(),
  consentAt: created(),
  unsubscribeHash: text('unsubscribe_hash').notNull(),
  active: boolean('active').notNull().default(true),
});
export const authRateLimit = pgTable('np_auth_rate_limit', {
  id: id(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
