export function shouldShowScrollTop(scrollY: number, viewportHeight: number): boolean {
  if (viewportHeight <= 0) return false;
  return scrollY >= viewportHeight;
}
