import { pathToFileURL } from "node:url";

export function isDirectRun(metaUrl: string): boolean {
  const entry = process.argv[1];
  return entry ? metaUrl === pathToFileURL(entry).href : false;
}

export async function runMain(action: () => Promise<unknown>): Promise<void> {
  try {
    const result = await action();
    if (result !== undefined) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
