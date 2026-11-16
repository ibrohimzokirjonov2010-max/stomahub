/** JS-dagi qo‘lda tekshirilgan qatorlar. catalog_items bo‘sh bo‘lsa ham o‘chirilmasin. */
export const CURATED_SOURCE = 'stomahub-curated'

export function mergeCatalogList(list, fromDb) {
  const curated = (list || []).filter((item) => item?.source === CURATED_SOURCE)
  if (!curated.length) return fromDb || []
  const curatedIds = new Set(curated.map((item) => item?.id))
  return [...curated, ...(fromDb || []).filter((item) => !curatedIds.has(item?.id))]
}
