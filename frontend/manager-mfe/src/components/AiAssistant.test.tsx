import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent
  from "@testing-library/user-event";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AiAssistant
  from "./AiAssistant";

import {
  aiResponse,
  fulfilledDecision,
} from "../test/mockData";

describe(
  "AiAssistant",
  () => {
    it(
      "shows suggested questions",
      () => {
        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
            onAskAi={
              vi.fn()
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
                "Why did the recommendation change?",
            }
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "calls the AI callback",
      async () => {
        const user =
          userEvent.setup();

        const callback =
          vi.fn().mockResolvedValue(
            aiResponse
          );

        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
            onAskAi={
              callback
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
              callback
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          callback
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
      "shows the Azure AI answer",
      async () => {
        const user =
          userEvent.setup();

        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
            onAskAi={
              vi.fn().mockResolvedValue(
                aiResponse
              )
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
            /hitech city store was closer/i
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
            "Remaining capacity was 90."
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows deterministic authority",
      () => {
        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
            onAskAi={
              vi.fn()
            }
          />
        );

        expect(
          screen.getByText(
            "Deterministic authority"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /winner:\s*HYD-03/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /score:\s*69\.64/i
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows an AI failure",
      async () => {
        const user =
          userEvent.setup();

        render(
          <AiAssistant
            decision={
              fulfilledDecision
            }
            onAskAi={
              vi.fn().mockRejectedValue(
                new Error(
                  "AIService is unavailable."
                )
              )
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
          await screen.findByRole(
            "alert"
          )
        ).toHaveTextContent(
          "AIService is unavailable."
        );
      }
    );
  }
);