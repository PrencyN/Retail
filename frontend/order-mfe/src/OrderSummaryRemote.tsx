import "./order-summary.css";

export type OrderItem = {
  productName: string;

  quantity: number;
};

export type OrderSummaryRemoteProps = {
  orderReference: string;

  customerName: string;

  fulfillmentZone: string;

  items: OrderItem[];
};

function OrderSummaryRemote({
  orderReference,
  customerName,
  fulfillmentZone,
  items,
}: OrderSummaryRemoteProps) {
  return (
    <section className="remote-order-summary">
      <div className="remote-order-heading">
        <div>
          <span className="remote-order-label">
            Synthetic Order
          </span>

          <h2>
            {orderReference}
          </h2>

          <p>
            Customer: {customerName}
          </p>

          <p>
            Zone: {fulfillmentZone}
          </p>
        </div>

        <span className="remote-badge">
          order-mfe
        </span>
      </div>

      <div className="remote-order-items">
        {items.map(
          item => (
            <div
              key={
                item.productName
              }
              className="remote-order-item"
            >
              <span>
                {item.productName}
              </span>

              <strong>
                × {item.quantity}
              </strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default OrderSummaryRemote;