import prisma from '../lib/prisma.js';

// ─── Asset Tag Generator ──────────────────────────────────────────────────────
//
// BUSINESS RULE: Tags are generated from a Postgres SEQUENCE — never by
// regex-parsing the last tag in the table. This guarantees uniqueness under
// concurrent inserts.
//
// Format: AF-NNNN  (e.g. AF-0001, AF-0042, AF-1000)
// The sequence is created by the seed script if it doesn't exist.

/**
 * Generate the next asset tag using the Postgres sequence.
 * @returns {Promise<string>} e.g. "AF-0001"
 */
export const generateAssetTag = async () => {
  const result = await prisma.$queryRaw`SELECT nextval('asset_tag_seq') AS seq`;
  const num = Number(result[0].seq);
  return `AF-${String(num).padStart(4, '0')}`;
};

/**
 * Ensure the asset_tag_seq sequence exists in the database.
 * Called once during seeding / server startup.
 */
export const ensureAssetTagSequence = async () => {
  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 1 INCREMENT 1 MINVALUE 1 NO MAXVALUE CACHE 1;`
  );
  
  // Update sequence to the maximum existing asset tag to avoid unique constraint failures
  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval('asset_tag_seq', COALESCE((SELECT MAX(CAST(SUBSTRING("assetTag" FROM 4) AS INTEGER)) FROM "Asset" WHERE "assetTag" LIKE 'AF-%'), 0) + 1, false);`
    );
  } catch (err) {
    console.error('Failed to sync asset_tag_seq', err);
  }
};
