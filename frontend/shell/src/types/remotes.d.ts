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

declare module "manager_mfe/ManagerWorkspace" {
  import type {
    ComponentType,
  } from "react";

  import type {
    CandidateScore,
    FulfillmentDecision,
  } from "./fulfillment";

  export type ManagerSimulationUpdate = {
    title: string;

    cause: string;
  };

  export type ManagerSimulationChange = {
    title: string;

    cause: string;

    previousLocationCode:
      string | null;

    previousLocationName:
      string | null;

    previousScore:
      number | null;

    newLocationCode:
      string | null;

    newLocationName:
      string | null;

    newScore:
      number | null;

    recommendationChanged:
      boolean;
  };

  export type ManagerAiRequest = {
    orderReference: string;

    recommendedLocationCode:
      string | null;

    recommendedLocationName:
      string | null;

    winningScore:
      number | null;

    deterministicExplanation:
      string;

    question:
      string | null;

    candidates:
      CandidateScore[];
  };

  export type ManagerAiResponse = {
    explanation: string;

    primaryReason: string;

    supportingReasons: string[];

    answer:
      string | null;

    aiUsed: boolean;

    fallbackUsed: boolean;

    provider: string;

    model: string;

    generatedAtUtc: string;

    durationMilliseconds: number;
  };

  export type ManagerWorkspaceRemoteProps = {
    decision:
      FulfillmentDecision;

    simulationChange:
      ManagerSimulationChange |
      null;

    resetVersion:
      number;

    workloadLocationCode:
      string;

    workloadLocationName:
      string;

    currentWorkload:
      number;

    stockProductId:
      string;

    stockProductName:
      string;

    stockLocationCode:
      string;

    stockLocationName:
      string;

    initialAvailableQuantity:
      number;

    initialReservedQuantity:
      number;

    initialReorderLevel:
      number;

    onUpdateWorkload: (
      locationCode: string,
      workloadPercent: number,
      update: ManagerSimulationUpdate
    ) => Promise<void>;

    onUpdateStock: (
      productId: string,
      locationCode: string,
      availableQuantity: number,
      reservedQuantity: number,
      reorderLevel: number,
      update: ManagerSimulationUpdate
    ) => Promise<void>;

    onAskAi: (
      request: ManagerAiRequest
    ) => Promise<ManagerAiResponse>;

    onDismissChange:
      () => void;
  };

  const ManagerWorkspace:
    ComponentType<
      ManagerWorkspaceRemoteProps
    >;

  export default ManagerWorkspace;
}