import { useState, useEffect } from "react";
import axios from "axios";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastSale, setLastSale] = useState(null);

  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  // Load products
  useEffect(() => {
    axios.get("http://localhost:8000/api/products/")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  // Add to cart
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Update quantity
  const updateQuantity = (index, qty) => {
    if (qty < 1) return;

    const newCart = [...cart];
    newCart[index].quantity = qty;
    setCart(newCart);
  };

  // Calculate total
  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.selling_price,
    0
  );

  const change = amountReceived
    ? (amountReceived - total).toFixed(2)
    : 0;
  
  //filteredProducts
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Complete sale
  const completeSale = async () => {
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/sales/", {
        items_data: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.selling_price
        })),
        payment_method: paymentMethod
      });

      setLastSale(res.data);
      setCart([]);
      setShowPayment(false);
      setShowReceipt(true);
      setAmountReceived("");

    } catch (err) {
      console.error(err);
      alert("Error completing sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      <h1>KUGROW POS</h1>

      <div className="layout">

        {/* PRODUCTS */}
        <div>
          <h2>Products</h2>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "6px",
              border: "1px solid #444",
              background: "#2f2f2f",
              color: "white"
            }}
          />          

          <div className="products-grid">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                className="product-card"
                onClick={() => addToCart(p)}
              >
                <div className="product-name">{p.name}</div>
                <div className="product-price">ZMW {p.selling_price}</div>
              </div>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <p style={{ marginTop: "10px" }}>No products found</p>
        )}

        {/* CART */}
        <div className="cart">
          <h2>Cart</h2>

          <div className="cart-items">
            {cart.length === 0 ? (
              <p>No items</p>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="cart-item">
                  <span>{item.name}</span>

                  <div className="qty-controls">
                    <button onClick={() => updateQuantity(i, item.quantity - 1)}>-</button>
                    {item.quantity}
                    <button onClick={() => updateQuantity(i, item.quantity + 1)}>+</button>
                  </div>

                  <span>{item.quantity * item.selling_price}</span>
                </div>
              ))
            )}
          </div>

          <div className="total">
            ZMW {total}
          </div>

          <button
            className="button button-primary"
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
          >
            PAY
          </button>

          <button
            className="button button-secondary"
            onClick={() => setCart([])}
          >
            CLEAR
          </button>
        </div>

      </div>

      {/* PAYMENT MODAL */}
      {showPayment && (
        <div className="modal">
          <div className="modal-content">

            <h2>Payment</h2>

            <h1>ZMW {total}</h1>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            >
              <option value="CASH">Cash</option>
              <option value="AIRTEL">Airtel Money</option>
              <option value="MTN">MTN Money</option>
              <option value="BANK">Bank Transfer</option>
            </select>

            {paymentMethod === "CASH" && (
              <>
                <input
                  type="number"
                  placeholder="Amount received"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  style={{ width: "100%", padding: "8px" }}
                />

                <h3>Change: ZMW {change}</h3>
              </>
            )}

            <button
              className="button button-primary"
              onClick={completeSale}
              disabled={loading}
            >
              {loading ? "Processing..." : "Complete Sale"}
            </button>

            <button
              className="button button-secondary"
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </button>

          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && lastSale && (
        <div className="modal">
          <div className="modal-content">

            <h2>Sale Complete</h2>

            <div className="receipt">

              <div style={{ textAlign: "center" }}>
                <b>KUGROW STORE</b>
                <div>Kasama, Zambia</div>
              </div>

              <div>Receipt #: {lastSale.id}</div>
              <div>{new Date(lastSale.created_at).toLocaleString()}</div>

              <hr />

              {lastSale.items.map((item, i) => (
                <div key={i} style={{ marginBottom: "5px" }}>
                  <div>{item.product_name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{item.quantity} x {item.price}</span>
                    <span>{item.quantity * item.price}</span>
                  </div>
                </div>
              ))}

              <hr />

              <b>Total: ZMW {lastSale.total_amount}</b>

            </div>

            <button
              className="button button-primary"
              onClick={() => window.print()}
            >
              Print Receipt
            </button>

            <button
              className="button button-secondary"
              onClick={() => setShowReceipt(false)}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}