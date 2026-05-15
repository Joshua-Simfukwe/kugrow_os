import { useEffect, useMemo, useRef, useState } from "react";

import { apiClient } from "../lib/api";
import AppHeader from "../shared/components/AppHeader";

function formatMoney(value) {
  const numericValue = Number(value ?? 0);
  return `ZMW ${numericValue.toFixed(2)}`;
}

function EmptyPanel({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lastSale, setLastSale] = useState(null);

  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");
  const [saleError, setSaleError] = useState("");

  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.quantity * Number(item.selling_price),
        0,
      ),
    [cart],
  );

  const change = amountPaid === "" ? 0 : Number(amountPaid) - total;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const haystack = `${product.name} ${product.sku ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [products, search]);

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadWorkspaceData() {
      setIsLoadingProducts(true);
      setProductError("");

      try {
        const [productResponse, salesResponse] = await Promise.all([
          apiClient.get("/inventory/products/"),
          apiClient.get("/sales/"),
        ]);

        if (!isActive) {
          return;
        }

        setProducts(productResponse.data);
        setRecentSales(salesResponse.data.slice(0, 6));
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setProductError(
          requestError.response?.data?.detail ??
            requestError.response?.data?.organization?.[0] ??
            "We could not load products for the active organization.",
        );
      } finally {
        if (isActive) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadWorkspaceData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

      if (event.key === "Escape") {
        setShowPayment(false);
        setShowReceipt(false);
        setSaleError("");
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === "Enter" && cart.length > 0) {
        setShowPayment(true);
      }

      if (event.ctrlKey && event.key === "Backspace") {
        setCart([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length]);

  function addToCart(product) {
    setCart((previousCart) => {
      const existingItem = previousCart.find((item) => item.id === product.id);
      if (!existingItem) {
        return [...previousCart, { ...product, quantity: 1 }];
      }

      return previousCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      setCart((previousCart) => previousCart.filter((item) => item.id !== productId));
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function resetCheckoutState() {
    setAmountPaid("");
    setCustomerName("");
    setNotes("");
    setPaymentMethod("CASH");
    setSaleError("");
  }

  async function completeSale() {
    if (!cart.length || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSaleError("");

    const payload = {
      items_data: cart.map((item) => ({
        product: item.id,
        quantity: item.quantity,
        price: item.selling_price,
      })),
      payment_method: paymentMethod,
      customer_name: customerName.trim() || null,
      notes: notes.trim() || null,
    };

    if (amountPaid !== "") {
      payload.amount_paid = amountPaid;
    }

    try {
      const response = await apiClient.post("/sales/", payload);
      const nextSale = response.data;

      setLastSale(nextSale);
      setRecentSales((previousSales) => [nextSale, ...previousSales].slice(0, 6));
      setCart([]);
      setShowPayment(false);
      setShowReceipt(true);
      resetCheckoutState();
      const refreshedProducts = await apiClient.get("/inventory/products/");
      setProducts(refreshedProducts.data);
    } catch (requestError) {
      setSaleError(
        requestError.response?.data?.non_field_errors?.[0] ??
          requestError.response?.data?.detail ??
          requestError.response?.data?.items_data?.[0]?.quantity?.[0] ??
          "We could not complete that sale.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AppHeader
        title="Point of Sale"
        subtitle="Fast checkout, scoped to your active organization and branch"
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Products</h2>
              <p className="text-sm text-slate-500">Tap a product to add it to the cart.</p>
            </div>

            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:max-w-xs"
            />
          </div>

          {isLoadingProducts ? (
            <EmptyPanel
              title="Loading products"
              description="Your active organization inventory is being prepared."
            />
          ) : productError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {productError}
            </div>
          ) : filteredProducts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {product.sku}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      Stock {product.branch_stock}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-base font-bold text-blue-700">
                      {formatMoney(product.selling_price)}
                    </p>
                    <p className="text-xs text-slate-500">{product.category_name ?? "Uncategorized"}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No matching products"
              description="Try a different search term or add stock for this organization."
            />
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Current Cart</h2>
                <p className="text-sm text-slate-500">Review items before payment.</p>
              </div>
              <button
                type="button"
                onClick={() => setCart([])}
                disabled={!cart.length}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            {cart.length ? (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatMoney(item.selling_price)} each
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatMoney(item.quantity * Number(item.selling_price))}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-9 w-9 rounded-xl border border-slate-200 text-lg text-slate-700 transition hover:bg-white"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-9 w-9 rounded-xl border border-slate-200 text-lg text-slate-700 transition hover:bg-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="Your cart is empty"
                description="Add products from the left to start a sale."
              />
            )}

            <div className="mt-6 rounded-2xl bg-slate-900 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Total</p>
              <p className="mt-2 text-3xl font-bold">{formatMoney(total)}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowPayment(true)}
              disabled={!cart.length}
              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              Open Payment
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Recent Sales</h2>
              <p className="text-sm text-slate-500">Quick visibility into the latest receipts.</p>
            </div>

            {recentSales.length ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sale.receipt_number}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sale.customer_name || "Walk-in customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMoney(sale.total_amount)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {sale.payment_status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="No sales yet"
                description="Completed sales will appear here once you start trading."
              />
            )}
          </div>
        </section>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Complete Sale</h2>
              <p className="mt-2 text-sm text-slate-500">
                Leave amount paid empty to record a fully paid sale automatically.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="CASH">Cash</option>
                  <option value="AIRTEL">Airtel Money</option>
                  <option value="MTN">MTN Money</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount paid
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  placeholder={total ? total.toFixed(2) : "0.00"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use `0` for unpaid sales or enter a partial amount to track a balance.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional reference or delivery note"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Total due</span>
                  <span className="font-semibold text-slate-900">{formatMoney(total)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Change</span>
                  <span className="font-semibold text-slate-900">{formatMoney(change > 0 ? change : 0)}</span>
                </div>
              </div>

              {saleError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {saleError}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={completeSale}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {isSubmitting ? "Processing..." : "Complete Sale"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPayment(false);
                  setSaleError("");
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Sale Complete</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Receipt {lastSale.receipt_number} has been recorded successfully.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {lastSale.payment_status}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">Kugrow OS Receipt</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {lastSale.receipt_number}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {lastSale.items.map((item) => (
                  <div
                    key={`${lastSale.id}-${item.product}-${item.quantity}`}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      <p className="mt-1 text-slate-500">
                        {item.quantity} x {formatMoney(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatMoney(item.quantity * Number(item.price))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(lastSale.total_amount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(lastSale.amount_paid)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(lastSale.balance_due)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition hover:bg-blue-700"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
