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

  // Load products
  useEffect(() => {
    axios.get("http://localhost:8000/api/products/")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

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

  const updateQuantity = (index, qty) => {
    if (qty < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = qty;
    setCart(newCart);
  };

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.selling_price,
    0
  );

  const change = amountReceived
    ? (amountReceived - total).toFixed(2)
    : 0;

  // FINAL CHECKOUT (BACKEND)
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
    <div style={{ padding: 20, background: "#1e1e1e", color: "white", minHeight: "100vh" }}>

      <h1>KUGROW POS</h1>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* PRODUCTS */}
        <div>
          <h2>Products</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {products.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  background: "#333",
                  padding: 20,
                  borderRadius: 10,
                  cursor: "pointer"
                }}
              >
                <div>{p.name}</div>
                <div>ZMW {p.selling_price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CART */}
        <div style={{ background: "#2b2b2b", padding: 15, borderRadius: 10 }}>
          <h2>Cart</h2>

          {cart.length === 0 ? (
            <p>No items</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span>{item.name}</span>

                <div>
                  <button onClick={() => updateQuantity(i, item.quantity - 1)}>-</button>
                  <span style={{ margin: "0 10px" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(i, item.quantity + 1)}>+</button>
                </div>

                <span>{item.quantity * item.selling_price}</span>
              </div>
            ))
          )}

          <h3>Total: ZMW {total}</h3>

          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            style={{
              width: "100%",
              padding: 10,
              background: "green",
              color: "white",
              border: "none",
              marginTop: 10
            }}
          >
            PAY
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPayment && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h2>Payment</h2>

            <h1>ZMW {total}</h1>

            <select onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="AIRTEL">Airtel</option>
              <option value="MTN">MTN</option>
            </select>

            <input
              type="number"
              placeholder="Amount received"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
            />

            <h3>Change: ZMW {change}</h3>

            <button onClick={completeSale} disabled={loading}>
              {loading ? "Processing..." : "Complete Sale"}
            </button>

            <button onClick={() => setShowPayment(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && lastSale && (
        <div style={modalStyle}>
          <div style={modalContent}>

            <h2>Sale Complete</h2>

            <div className="receipt" id="receipt">

              <div style={{ textAlign: "center" }}>
                <b>KUGROW STORE</b>
                <div>Kasama, Zambia</div>
              </div>

              <div>Receipt #: {lastSale.id}</div>
              <div>{new Date(lastSale.created_at).toLocaleString()}</div>

              <hr />

              {lastSale.items.map((item, i) => (
                <div key={i}>
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

            <button onClick={() => window.print()}>
              Print Receipt
            </button>

            <button onClick={() => setShowReceipt(false)}>
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const modalContent = {
  background: "white",
  color: "black",
  padding: 20,
  borderRadius: 10,
  width: "300px"
};