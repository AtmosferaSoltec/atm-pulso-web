/** What a voucher proves: the payment of a receipt, a product sale paid on the spot, or a collection of pending sales. */
export type VoucherOwner = { kind: 'receipt'; id: string } | { kind: 'sale'; id: string } | { kind: 'collection'; id: string };

/** The API path of an owner's vouchers (list and upload). */
export function voucherPath(owner: VoucherOwner): string {
  switch (owner.kind) {
    case 'sale':
      return `/sales/${owner.id}/vouchers`;
    case 'collection':
      return `/sales/collections/${owner.id}/vouchers`;
    default:
      return `/receipts/${owner.id}/vouchers`;
  }
}
