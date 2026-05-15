import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { apiClient } from "../lib/api";
import AppHeader from "../shared/components/AppHeader";

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}

function InventoryModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(searchParams.get("action") || "");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("IN");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReference, setAdjustmentReference] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    selling_price: "",
    cost_price: "",
    opening_stock: "",
    reorder_level: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function loadInventory() {
    setIsLoading(true);
    setError("");

    try {
      const [productResponse, transactionResponse] = await Promise.all([
        apiClient.get("/inventory/products/"),
        apiClient.get("/inventory/transactions/"),
      ]);
      setProducts(productResponse.data);
      setTransactions(transactionResponse.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ??
          "We could not load inventory for the active organization.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    Promise.all([
      apiClient.get("/inventory/products/"),
      apiClient.get("/inventory/transactions/"),
    ])
      .then(([productResponse, transactionResponse]) => {
        if (!isActive) {
          return;
        }
        setProducts(productResponse.data);
        setTransactions(transactionResponse.data);
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }
        setError(
          requestError.response?.data?.detail ??
            "We could not load inventory for the active organization.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(query),
    );
  }, [products, search]);

  const lowStockCount = products.filter(
    (product) => Number(product.branch_stock) <= Number(product.reorder_level),
  ).length;

  function closeModal() {
    setActiveModal("");
    setSearchParams({});
    setSubmitError("");
    setSelectedProductId("");
    setAdjustmentQuantity("");
    setAdjustmentReference("");
    setAdjustmentNote("");
    setAdjustmentType("IN");
    setProductForm({
      name: "",
      sku: "",
      selling_price: "",
      cost_price: "",
      opening_stock: "",
      reorder_level: "",
    });
  }

  async function handleAdjustmentSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await apiClient.post("/inventory/adjustments/", {
        product_id: Number(selectedProductId),
        transaction_type: adjustmentType,
        quantity: Number(adjustmentQuantity),
        reference: adjustmentReference || null,
        note: adjustmentNote || null,
      });
      await loadInventory();
      closeModal();
    } catch (requestError) {
      setSubmitError(
        requestError.response?.data?.quantity?.[0] ??
          requestError.response?.data?.product_id?.[0] ??
          requestError.response?.data?.detail ??
          "We could not save that stock adjustment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await apiClient.post("/inventory/products/", {
        ...productForm,
        selling_price: Number(productForm.selling_price),
        cost_price: Number(productForm.cost_price || 0),
        opening_stock: Number(productForm.opening_stock || 0),
        reorder_level: Number(productForm.reorder_level || 0),
      });
      await loadInventory();
      closeModal();
    } catch (requestError) {
      setSubmitError(
        requestError.response?.data?.sku?.[0] ??
          requestError.response?.data?.name?.[0] ??
          requestError.response?.data?.detail ??
          "We could not create that product.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Inventory" subtitle="View stock and make fast adjustments" />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Products</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{products.length}</p>
        </div>
        <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Low Stock</p>
          <p className="mt-3 text-4xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveModal("new-product")}
          className="rounded-[1.8rem] bg-blue-600 px-5 py-5 text-lg font-semibold text-white shadow-[0_12px_26px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
        >
          New Product
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("add-stock")}
          className="rounded-[1.8rem] border border-blue-300 bg-white px-5 py-5 text-lg font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          Add Stock
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Stock List</h2>
              <p className="text-sm text-slate-500">Monitor inventory levels and pricing.</p>
            </div>
            <input
              type="text"
              placeholder="Search by name or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:max-w-xs"
            />
          </div>

          {isLoading ? (
            <EmptyState title="Loading inventory" description="Stock records are being prepared." />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : filteredProducts.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm uppercase tracking-[0.16em] text-slate-400">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Sell Price</th>
                    <th className="pb-3">Reorder</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 text-sm text-slate-700">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category_name || "Uncategorized"}</p>
                        </div>
                      </td>
                      <td className="py-4">{product.sku}</td>
                      <td className="py-4 font-semibold">
                        <span className={Number(product.branch_stock) <= Number(product.reorder_level) ? "text-amber-600" : "text-slate-900"}>
                          {product.branch_stock}
                        </span>
                      </td>
                      <td className="py-4">ZMW {Number(product.selling_price).toFixed(2)}</td>
                      <td className="py-4">{product.reorder_level}</td>
                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductId(String(product.id));
                            setActiveModal("adjust-stock");
                          }}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No matching stock" description="Try a different search or add a product." />
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-3xl font-semibold text-slate-900">Recent Adjustments</h2>
            <p className="text-sm text-slate-500">Latest stock changes in the active branch.</p>
          </div>

          {transactions.length ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.product_name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {transaction.transaction_type} - {transaction.branch_name}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{transaction.quantity}</p>
                  </div>
                  {(transaction.reference || transaction.note) && (
                    <p className="mt-2 text-sm text-slate-500">
                      {transaction.reference || transaction.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No adjustments yet" description="Stock changes will appear here." />
          )}
        </section>
      </div>

      {(activeModal === "add-stock" || activeModal === "adjust-stock") && (
        <InventoryModal
          title={activeModal === "add-stock" ? "Add Stock" : "Adjust Inventory"}
          onClose={closeModal}
        >
          <form className="space-y-4" onSubmit={handleAdjustmentSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Product</label>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Adjustment Type</label>
                <select
                  value={adjustmentType}
                  onChange={(event) => setAdjustmentType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="IN">Add Stock</option>
                  <option value="ADJUST">Set Exact Stock</option>
                  <option value="DAMAGED">Mark Damaged</option>
                  <option value="MISSING">Mark Missing</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(event) => setAdjustmentQuantity(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Reference"
              value={adjustmentReference}
              onChange={(event) => setAdjustmentReference(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <textarea
              rows={3}
              placeholder="Note"
              value={adjustmentNote}
              onChange={(event) => setAdjustmentNote(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            {submitError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isSubmitting ? "Saving..." : "Save Adjustment"}
            </button>
          </form>
        </InventoryModal>
      )}

      {activeModal === "new-product" && (
        <InventoryModal title="Create Product" onClose={closeModal}>
          <form className="space-y-4" onSubmit={handleProductSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Product name"
                value={productForm.name}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
              <input
                type="text"
                placeholder="SKU"
                value={productForm.sku}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, sku: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Selling price"
                value={productForm.selling_price}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    selling_price: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Cost price"
                value={productForm.cost_price}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    cost_price: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="number"
                min="0"
                placeholder="Opening stock"
                value={productForm.opening_stock}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    opening_stock: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="number"
                min="0"
                placeholder="Reorder level"
                value={productForm.reorder_level}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    reorder_level: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            {submitError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isSubmitting ? "Creating..." : "Create Product"}
            </button>
          </form>
        </InventoryModal>
      )}
    </div>
  );
}
