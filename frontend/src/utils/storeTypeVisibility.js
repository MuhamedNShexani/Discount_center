/** Store types shown in the homepage / store-types categories browse lists. */
export function isStoreTypeShownOnCategoriesList(storeType) {
  return storeType?.showOnCategoriesList !== false;
}
