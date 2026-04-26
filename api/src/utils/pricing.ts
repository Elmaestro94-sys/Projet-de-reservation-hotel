export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  subTotal: number;
  cleaningFee: number;
  serviceFee: number;
  promotionDiscount: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  ownerAmount: number;
}

export interface PricingInput {
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  checkIn: Date;
  checkOut: Date;
  commissionRate?: number;
  promotionDiscount?: number;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / msPerDay);
}

export function calculateBookingPrice(input: PricingInput): PriceBreakdown | null {
  const nights = calculateNights(input.checkIn, input.checkOut);
  if (nights <= 0) return null;

  const commissionRate = input.commissionRate ?? 0.10;
  const promotionDiscount = input.promotionDiscount ?? 0;

  const subTotal = input.pricePerNight * nights;
  const discountAmount = subTotal * (promotionDiscount / 100);
  const totalAmount = subTotal - discountAmount + input.cleaningFee + input.serviceFee;
  const commissionAmount = totalAmount * commissionRate;
  const ownerAmount = totalAmount - commissionAmount;

  return {
    nights,
    pricePerNight: input.pricePerNight,
    subTotal,
    cleaningFee: input.cleaningFee,
    serviceFee: input.serviceFee,
    promotionDiscount: discountAmount,
    totalAmount,
    commissionRate,
    commissionAmount,
    ownerAmount,
  };
}
