import "./App.css";

import AuthGuard
  from "./auth/AuthGuard";

import FulfillmentPage
  from "./pages/FulfillmentPage";

function App() {
  return (
    <AuthGuard>
      <FulfillmentPage />
    </AuthGuard>
  );
}

export default App;