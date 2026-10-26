/** Ги заштитува специјалните знаци на LIKE (\ % _), за посетителот да не пребарува со џокери. */
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

/** Шаблон „содржи“ за LIKE, на пр. "паста" → "%паста%". */
export const containsPattern = (text: string) => `%${escapeLike(text.trim())}%`;
