/// <reference types="astro/astro-jsx" />
import { nanoid } from 'nanoid/non-secure'
export const keyBy = (key, array, selectValue) =>
  (array &&
    array.reduce(
      (current, incoming) =>
        Object.assign(current, {
          [incoming[key]]: selectValue ? selectValue(incoming) : incoming,
        }),
      {}
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

export function uuid() {
  return nanoid();
}
