import { type ClassNameValue, twMerge } from 'tailwind-merge';

export const cn = (...classLists: ClassNameValue[]) => twMerge(classLists);
