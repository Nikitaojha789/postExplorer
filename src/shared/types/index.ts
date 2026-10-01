/** Nominal typing helper: `type UserId = Brand<string, 'UserId'>`. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** Makes selected keys required. */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/** Paginated envelope shared by list endpoints. Adjust to your backend contract. */
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
