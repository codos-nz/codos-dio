/// <reference types="astro/astro-jsx" />

export const keyBy = (key, array, selectValue) =>
  (array &&
    array.reduce(
      (current, incoming) =>
        Object.assign(current, {
          [incoming[key]]: selectValue ? selectValue(incoming) : incoming,
        }),
      {},
    )) ||
  null;

export interface GetPictureResultInterface {
  image: astroHTML.JSX.HTMLAttributes;
  sources: {
    type: string;
    srcset: string;
  }[];
}

export type GetPictureResultSourcesType = GetPictureResultInterface["sources"];
