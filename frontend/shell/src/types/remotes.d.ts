declare module "order_mfe/OrderSummary" {
  import type {
    ComponentType,
  } from "react";

  export type RemoteOrderItem = {
    productName: string;

    quantity: number;
  };

  export type RemoteOrderSummaryProps = {
    orderReference: string;

    customerName: string;

    fulfillmentZone: string;

    items: RemoteOrderItem[];
  };

  const OrderSummary:
    ComponentType<
      RemoteOrderSummaryProps
    >;

  export default OrderSummary;
}