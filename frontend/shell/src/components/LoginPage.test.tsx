import {
  render,
  screen,
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

import {
  InteractionStatus,
} from "@azure/msal-browser";

import LoginPage
  from "./LoginPage";

const loginRedirectMock =
  vi.fn();

let currentInteractionStatus =
  InteractionStatus.None;

vi.mock(
  "@azure/msal-react",
  () => ({
    useMsal:
      () => ({
        instance: {
          loginRedirect:
            loginRedirectMock,
        },

        inProgress:
          currentInteractionStatus,

        accounts:
          [],
      }),
  })
);

describe(
  "LoginPage",
  () => {
    beforeEach(
      () => {
        loginRedirectMock
          .mockReset();

        loginRedirectMock
          .mockResolvedValue(
            undefined
          );

        currentInteractionStatus =
          InteractionStatus.None;
      }
    );

    it(
      "shows the Microsoft sign-in interface",
      () => {
        render(
          <LoginPage />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "FulfillIQ",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Intelligent fulfillment decisions",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /sign in with microsoft to access deterministic fulfillment scoring/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /complete-basket eligibility/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /distance, workload and capacity scoring/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /azure gpt-5-mini explanations/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /microsoft entra role authorization/i
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                /sign in with microsoft/i,
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            /fulfillment manager or admin role/i
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "starts Microsoft login when the sign-in button is clicked",
      async () => {
        const user =
          userEvent.setup();

        render(
          <LoginPage />
        );

        const signInButton =
          screen.getByRole(
            "button",
            {
              name:
                /sign in with microsoft/i,
            }
          );

        await user.click(
          signInButton
        );

        expect(
          loginRedirectMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          loginRedirectMock
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            scopes:
              expect.arrayContaining([
                "openid",
                "profile",
                "email",
              ]),
          })
        );
      }
    );
  }
);