import algoliasearch from 'algoliasearch/lite';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;

export const isAlgoliaConfigured = !!(appId && apiKey && indexName);

if (!isAlgoliaConfigured) {
  console.warn('Algolia environment variables are not set. Search functionality will be disabled. Please set NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY, and NEXT_PUBLIC_ALGOLIA_INDEX_NAME.');
}

export const searchClient = isAlgoliaConfigured ? algoliasearch(appId, apiKey) : null;
export const searchIndex = searchClient && indexName ? searchClient.initIndex(indexName) : null;
