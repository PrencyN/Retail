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

declare module "fulfillment_mfe/FulfillmentAnalysis" {
  import type {
    ComponentType,
  } from "react";

  import type {
    FulfillmentDecision,
  } from "./fulfillment";

  export type FulfillmentAnalysisRemoteProps = {
    decision:
      FulfillmentDecision;
  };

  const FulfillmentAnalysis:
    ComponentType<
      FulfillmentAnalysisRemoteProps
    >;

  export default FulfillmentAnalysis;
}