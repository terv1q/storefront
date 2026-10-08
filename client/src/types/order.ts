/**
 * Order and checkout shapes. Dates are ISO 8601 strings.
 *
 * Money fields (`unitPrice`, `lineTotal`, `subtotal`, `discountTotal`,
 * `shippingTotal`, `total`) are integers in minor units (tiyin).
 *
 * An order keeps its own copy of the customer and address fields, because the
 * order must stay readable after the account or the address changes. The
 * `OrderItem` name and price are snapshots taken at checkout for the same
 * reason.
 */

/** Values stored in the order status enum. */
export type OrderStatus =
  'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/** Values stored in the payment status enum. */
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

/** Payment is simulated in the first version, so the list stays short. */
export type PaymentMethod = 'CARD' | 'CASH';

export type DeliveryMethod = 'COURIER' | 'PICKUP';

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  /** Product name at the time of the order. */
  name: string;
  /** Minor units at the time of the order. */
  unitPrice: number;
  quantity: number;
  /** Minor units, `unitPrice * quantity`. */
  lineTotal: number;
  /** Added by the API so the order list can show a thumbnail and a link. */
  productSlug?: string;
  imageUrl?: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  /** Minor units. */
  subtotal: number;
  /**
   * What the order saved against the compare-at prices of the day. A record of
   * a saving, not a deduction: `subtotal` already holds the prices charged.
   */
  discountTotal: number;
  /** The promo code that was applied, or `null`. */
  promoCode: string | null;
  /** Minor units the code took off the subtotal. */
  promoDiscount: number;
  shippingTotal: number;
  /** `subtotal - promoDiscount + shippingTotal`, as the server computed it. */
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCountry: string;
  shippingCity: string;
  shippingStreet: string;
  shippingPostalCode: string | null;
  notes: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  /** Present on the order detail endpoint. */
  items?: OrderItem[];
};

/** One line of a checkout payload. Prices are never sent: the server recomputes them. */
export type CheckoutItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type CheckoutInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  city: string;
  street: string;
  postalCode?: string | null;
  notes?: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  /**
   * The code the shopper applied in the cart, if any. Only the code travels:
   * what it is worth is read from the database inside the checkout transaction,
   * and an expired or switched-off code is refused there with a message under
   * this field.
   */
  promoCode?: string | null;
  items: CheckoutItemInput[];
};
