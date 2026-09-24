// No GitHub Actions o aviso vira anotação no PR; localmente, uma linha no terminal
export function reportWarning(message: string): void {
  console.warn(process.env['GITHUB_ACTIONS'] ? `::warning::${message}` : `aviso: ${message}`);
}

export function reportFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(process.env['GITHUB_ACTIONS'] ? `::error::${message.replaceAll('\n', '%0A')}` : message);
  process.exitCode = 1;
}
