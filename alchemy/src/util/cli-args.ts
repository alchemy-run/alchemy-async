export const cliArgs = process.argv.slice(2);

export function parseOption<D extends string | undefined>(
  option: string,
  defaultValue?: D,
): D {
  const i = cliArgs.indexOf(option);
  return (
    i !== -1 && i + 1 < cliArgs.length ? cliArgs[i + 1] : defaultValue
  ) as D;
}
