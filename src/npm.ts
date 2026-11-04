/**
 * The caret range of the latest version of a package on npm, for example
 * `^0.15.1`. `latest` when npm does not answer.
 */
export async function latestRange(
  name: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  try {
    const response = await fetchImpl(
      `https://registry.npmjs.org/${name}/latest`
    )
    if (!response.ok) {
      return 'latest'
    }
    const data = (await response.json()) as { version?: unknown }
    return typeof data.version === 'string' ? `^${data.version}` : 'latest'
  } catch {
    return 'latest'
  }
}
