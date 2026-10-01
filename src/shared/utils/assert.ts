/** Exhaustiveness guard for discriminated unions in `switch` statements. */
export const assertNever = (value: never, message = 'Unexpected value'): never => {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
};
