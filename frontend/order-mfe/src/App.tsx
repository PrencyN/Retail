import OrderSummaryRemote
  from "./OrderSummaryRemote";

import "./App.css";

function App() {
  return (
    <main className="order-mfe-preview">
      <header>
        <span>
          FulfillIQ Micro-Frontend
        </span>

        <h1>
          Order MFE
        </h1>

        <p>
          Independent preview of the
          Federated Order Summary module.
        </p>
      </header>

      <OrderSummaryRemote
        orderReference={
          "SYN-1001"
        }
        customerName={
          "Synthetic Customer"
        }
        fulfillmentZone={
          "Hyderabad"
        }
        items={[
          {
            productName:
              "Nike Black Performance Running Shoe",

            quantity:
              2,
          },

          {
            productName:
              "Reebok Grey Clothing 24",

            quantity:
              1,
          },

          {
            productName:
              "RetailIQ Red Electronics 25",

            quantity:
              1,
          },
        ]}
      />
    </main>
  );
}

export default App;