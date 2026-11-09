function OrderSummary() {
  return (
    <section className="order-summary">
      <div>
        <span className="section-label">
          Synthetic Order
        </span>

        <h2>SYN-1001</h2>

        <p>Customer Zone: ZONE-HYD-03</p>
      </div>

      <div className="order-items">
        <div>
          <span>Nike Black Performance Running Shoe</span>
          <strong>× 2</strong>
        </div>

        <div>
          <span>Reebok Grey Clothing 24</span>
          <strong>× 1</strong>
        </div>

        <div>
          <span>RetailIQ Red Electronics 25</span>
          <strong>× 1</strong>
        </div>
      </div>
    </section>
  );
}

export default OrderSummary;