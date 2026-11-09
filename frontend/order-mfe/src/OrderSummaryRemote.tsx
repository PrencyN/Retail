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
    <section
      className="remote-order-summary"
      aria-labelledby="order-summary-heading"
    >
      <div className="remote-order-heading">
        <div>
          <span className="remote-order-label">
            Synthetic Order
          </span>

          <h2 id="order-summary-heading">
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

      <div
        className="remote-order-items"
        aria-label="Order items"
      >
        {items.length > 0 ? (
          items.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  `${item.productName}-${index}`
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
          )
        ) : (
          <p className="remote-empty-order">
            No items are available for this order.
          </p>
        )}
      </div>
    </section>
  );
}

export default OrderSummaryRemote;