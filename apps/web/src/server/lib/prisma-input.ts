type WithoutUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? K : K]: Exclude<T[K], undefined>;
};

export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): WithoutUndefined<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as WithoutUndefined<T>;
}
