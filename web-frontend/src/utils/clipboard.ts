export async function copyToClipboard(value: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('当前浏览器不支持剪贴板');
  }

  await navigator.clipboard.writeText(value);
}
