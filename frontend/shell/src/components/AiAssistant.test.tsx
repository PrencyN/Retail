import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent
  from "@testing-library/user-event";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AiAssistant
  from "./AiAssistant";

import {
  explainDecision,
} from "../services/aiApi";

import {
  fulfilledDecision,
} from "../test/mockData";

vi.mock(
  "../services/aiApi",
  () => ({
    explainDecision:
      vi.fn(),
  })
);

const mockedExplainDecision =
  vi.mocked(
    explainDecision
  );

describe(
  "AiAssistant",
  () => {
    beforeEach(
      () => {
        mockedExplainDecision
          .mockReset();
      }
    );

    it(
      "shows suggested manager questions",
      () => {
        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Ask FulfillIQ AI",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Why was the nearest store not selected?",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Why is HYD-01 ineligible?",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Which factor influenced the result most?",
            }
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "sends a manager question to the AI API",
      async () => {
        const user =
          userEvent.setup();

        mockedExplainDecision
          .mockResolvedValue({
            explanation:
              "Kukatpally had the best overall balance.",

            primaryReason:
              "Kukatpally achieved the highest score.",

            supportingReasons: [
              "Workload was 25%.",
              "Remaining capacity was 90.",
            ],

            answer:
              "Hitech City was closer, but Kukatpally had lower workload and more capacity.",

            aiUsed:
              true,

            fallbackUsed:
              false,

            provider:
              "Azure OpenAI",

            model:
              "fulfilliq-gpt5-mini",

            generatedAtUtc:
              "2026-11-09T05:30:00Z",

            durationMilliseconds:
              4100,
          });

        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
          />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Ask AI",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              mockedExplainDecision
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          mockedExplainDecision
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            orderReference:
              "SYN-1001",

            recommendedLocationCode:
              "HYD-03",

            winningScore:
              69.64,

            question:
              "Why was the nearest store not selected?",
          })
        );
      }
    );

    it(
      "shows the Azure AI answer and supporting evidence",
      async () => {
        const user =
          userEvent.setup();

        mockedExplainDecision
          .mockResolvedValue({
            explanation:
              "Kukatpally had the best overall balance.",

            primaryReason:
              "Kukatpally Store achieved the highest deterministic score.",

            supportingReasons: [
              "Complete basket was available.",
              "Workload was 25%.",
              "Remaining capacity was 90.",
            ],

            answer:
              "Hitech City was closer, but its high workload and low remaining capacity reduced its total score.",

            aiUsed:
              true,

            fallbackUsed:
              false,

            provider:
              "Azure OpenAI",

            model:
              "fulfilliq-gpt5-mini",

            generatedAtUtc:
              "2026-11-09T05:30:00Z",

            durationMilliseconds:
              4177,
          });

        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
          />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Ask AI",
            }
          )
        );

        expect(
          await screen.findByText(
            /its high workload and low remaining capacity/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Azure AI"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /azure openai.*fulfilliq-gpt5-mini/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Complete basket was available."
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Remaining capacity was 90."
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows an error when the AI request fails",
      async () => {
        const user =
          userEvent.setup();

        mockedExplainDecision
          .mockRejectedValue(
            new Error(
              "AIService is unavailable."
            )
          );

        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
          />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Ask AI",
            }
          )
        );

        expect(
          await screen.findByText(
            "AIService is unavailable."
          )
        ).toBeInTheDocument();
      }
    );
  }
);