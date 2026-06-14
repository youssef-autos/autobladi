/**
 * Discount percentage derived from a plan's original ("compare-at") price and
 * its actual package price. Returns 0 when there's no genuine discount.
 */
export function planDiscountPercent(
  originalPrice: number,
  price: number,
): number {
  if (originalPrice > price && originalPrice > 0) {
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }
  return 0
}
