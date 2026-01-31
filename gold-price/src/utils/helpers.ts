import { UNIT_CONVERSION, GOLD_UNITS } from '../config/constants';

export function convertGoldUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string = GOLD_UNITS.GRAM
): number {
  if (fromUnit === toUnit) return quantity;

  // Convert to grams first
  let grams: number;
  switch (fromUnit) {
    case GOLD_UNITS.CHI:
      grams = quantity * UNIT_CONVERSION.CHI_TO_GRAM;
      break;
    case GOLD_UNITS.LUONG:
      grams = quantity * UNIT_CONVERSION.LUONG_TO_GRAM;
      break;
    case GOLD_UNITS.OZ:
      grams = quantity * UNIT_CONVERSION.OZ_TO_GRAM;
      break;
    case GOLD_UNITS.GRAM:
      grams = quantity;
      break;
    default:
      throw new Error(`Unknown unit: ${fromUnit}`);
  }

  // Convert from grams to target unit
  switch (toUnit) {
    case GOLD_UNITS.CHI:
      return grams / UNIT_CONVERSION.CHI_TO_GRAM;
    case GOLD_UNITS.LUONG:
      return grams / UNIT_CONVERSION.LUONG_TO_GRAM;
    case GOLD_UNITS.OZ:
      return grams / UNIT_CONVERSION.OZ_TO_GRAM;
    case GOLD_UNITS.GRAM:
      return grams;
    default:
      throw new Error(`Unknown unit: ${toUnit}`);
  }
}

export function formatCurrency(
  amount: number,
  currency: 'VND' | 'USD'
): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

export function formatDate(date: Date, format: 'date' | 'datetime' = 'datetime'): string {
  if (format === 'date') {
    return date.toISOString().split('T')[0];
  }
  return date.toISOString();
}
