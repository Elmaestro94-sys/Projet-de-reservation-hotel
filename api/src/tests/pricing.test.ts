import { describe, it, expect } from 'vitest';
import { calculateNights, calculateBookingPrice } from '../utils/pricing';

describe('calculateNights', () => {
  it('returns correct number of nights', () => {
    const checkIn = new Date('2025-07-01');
    const checkOut = new Date('2025-07-05');
    expect(calculateNights(checkIn, checkOut)).toBe(4);
  });

  it('returns 1 for single-night stay', () => {
    const checkIn = new Date('2025-08-10');
    const checkOut = new Date('2025-08-11');
    expect(calculateNights(checkIn, checkOut)).toBe(1);
  });

  it('returns negative or 0 for reversed dates', () => {
    const checkIn = new Date('2025-08-11');
    const checkOut = new Date('2025-08-10');
    expect(calculateNights(checkIn, checkOut)).toBeLessThanOrEqual(0);
  });
});

describe('calculateBookingPrice', () => {
  const baseInput = {
    pricePerNight: 50000,
    cleaningFee: 10000,
    serviceFee: 5000,
    checkIn: new Date('2025-07-01'),
    checkOut: new Date('2025-07-04'),
  };

  it('calculates total correctly for 3 nights', () => {
    const result = calculateBookingPrice(baseInput);
    expect(result).not.toBeNull();
    expect(result!.nights).toBe(3);
    expect(result!.subTotal).toBe(150000);
    expect(result!.totalAmount).toBe(165000); // 150000 + 10000 + 5000
  });

  it('applies 10% platform commission by default', () => {
    const result = calculateBookingPrice(baseInput);
    expect(result!.commissionRate).toBe(0.10);
    expect(result!.commissionAmount).toBe(16500);
    expect(result!.ownerAmount).toBe(148500);
  });

  it('applies promotion discount correctly', () => {
    const result = calculateBookingPrice({ ...baseInput, promotionDiscount: 10 });
    expect(result!.promotionDiscount).toBe(15000); // 10% of 150000
    expect(result!.totalAmount).toBe(150000); // 150000 - 15000 + 10000 + 5000
  });

  it('applies custom commission rate', () => {
    const result = calculateBookingPrice({ ...baseInput, commissionRate: 0.15 });
    expect(result!.commissionRate).toBe(0.15);
    expect(result!.commissionAmount).toBe(24750);
  });

  it('returns null for invalid dates (checkout before checkin)', () => {
    const result = calculateBookingPrice({
      ...baseInput,
      checkIn: new Date('2025-07-05'),
      checkOut: new Date('2025-07-01'),
    });
    expect(result).toBeNull();
  });

  it('owner receives total minus commission', () => {
    const result = calculateBookingPrice(baseInput);
    expect(result!.ownerAmount).toBe(result!.totalAmount - result!.commissionAmount);
  });
});

describe('booking rules', () => {
  it('total = subTotal + cleaningFee + serviceFee - discount', () => {
    const result = calculateBookingPrice({
      pricePerNight: 100000,
      cleaningFee: 20000,
      serviceFee: 0,
      checkIn: new Date('2025-09-01'),
      checkOut: new Date('2025-09-03'),
      promotionDiscount: 0,
    });
    expect(result!.totalAmount).toBe(result!.subTotal + result!.cleaningFee + result!.serviceFee);
  });
});
