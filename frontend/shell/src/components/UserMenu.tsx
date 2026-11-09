import {
  useMsal,
} from "@azure/msal-react";

import {
  getActiveAccount,
} from "../auth/msalInstance";

function UserMenu() {
  const {
    instance,
  } = useMsal();

  const account =
    getActiveAccount();

  const displayName =
    account?.name ??
    account?.username ??
    "Signed-in user";

  const username =
    account?.username ??
    "";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(value =>
        value
          .charAt(0)
          .toUpperCase()
      )
      .join("");

  async function handleLogout():
    Promise<void> {
    await instance.logoutRedirect({
      account:
        account ?? undefined,

      postLogoutRedirectUri:
        window.location.origin,
    });
  }

  return (
    <div className="user-menu">
      <div className="user-avatar">
        {initials || "U"}
      </div>

      <div className="user-details">
        <strong>
          {displayName}
        </strong>

        <span>
          {username}
        </span>
      </div>

      <button
        type="button"
        className="sign-out-button"
        onClick={
          handleLogout
        }
      >
        Sign out
      </button>
    </div>
  );
}

export default UserMenu;