import React, { useCallback, useEffect, useState } from "react";
import { customersApi, ordersApi, productsApi } from "../api/client";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { formatINR } from "../utils/currency";
import { formatDateTime } from "../utils/date";

const emptyLineItem = { product_id: "", quantity: "1" };

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [lineItems, setLineItems] = useState([emptyLineItem]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        ordersApi.list(),
        customersApi.list(),
        productsApi.list(),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshProducts = useCallback(async () => {
    try {
      const { data } = await productsApi.list();
      setProducts(data);
      return data;
    } catch (error) {
      showToast(error.message, "error");
      return products;
    }
  }, [products, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const inStockProducts = products.filter((p) => p.quantity_in_stock > 0);

  const getSelectedProductIds = (excludeIndex = -1) =>
    lineItems
      .filter((_, i) => i !== excludeIndex)
      .map((item) => item.product_id)
      .filter(Boolean);

  const getProductOptionsForRow = (rowIndex) => {
    const selectedElsewhere = getSelectedProductIds(rowIndex);
    const options = [{ value: "", label: "Select product" }];

    products.forEach((p) => {
      const isSelectedElsewhere = selectedElsewhere.includes(String(p.id));
      const isOutOfStock = p.quantity_in_stock <= 0;

      if (isSelectedElsewhere) return;

      options.push({
        value: String(p.id),
        label: isOutOfStock
          ? `${p.name} (${p.sku}) — Out of stock`
          : `${p.name} (${p.sku})`,
        disabled: isOutOfStock,
      });
    });

    return options;
  };

  const getProductById = (productId) =>
    products.find((p) => p.id === Number(productId));

  const getMaxQuantity = (productId) => {
    const product = getProductById(productId);
    return product ? product.quantity_in_stock : 0;
  };

  const openCreateModal = async () => {
    const latestProducts = await refreshProducts();
    const available = latestProducts.filter((p) => p.quantity_in_stock > 0);

    if (available.length === 0) {
      showToast("No products with available stock to order", "error");
      return;
    }

    setCustomerId(customers[0]?.id ? String(customers[0].id) : "");
    setLineItems([{ ...emptyLineItem }]);
    setErrors({});
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCustomerId("");
    setLineItems([{ ...emptyLineItem }]);
    setErrors({});
  };

  const openDetailModal = async (order) => {
    try {
      const { data } = await ordersApi.get(order.id);
      setSelectedOrder(data);
      setDetailModalOpen(true);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (field === "product_id") {
          const product = getProductById(value);
          if (product && product.quantity_in_stock <= 0) {
            return item;
          }
          const maxQty = product ? product.quantity_in_stock : 1;
          const currentQty = Number(item.quantity) || 1;
          return {
            ...item,
            product_id: value,
            quantity: String(Math.min(Math.max(currentQty, 1), maxQty)),
          };
        }

        if (field === "quantity") {
          const maxQty = getMaxQuantity(item.product_id);
          const parsed =
            value === ""
              ? ""
              : String(Math.max(1, Math.min(Number(value), maxQty || 1)));
          return { ...item, quantity: parsed };
        }

        return { ...item, [field]: value };
      }),
    );
    setErrors((prev) => ({
      ...prev,
      items: undefined,
      [`quantity_${index}`]: undefined,
    }));
  };

  const addLineItem = () => {
    const selectedIds = getSelectedProductIds();
    const remaining = inStockProducts.filter(
      (p) => !selectedIds.includes(String(p.id)),
    );
    if (remaining.length === 0) {
      showToast("All available products have already been added", "error");
      return;
    }
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateOrderForm = () => {
    const newErrors = {};
    if (!customerId) newErrors.customerId = "Select a customer";

    const validItems = lineItems.filter(
      (item) => item.product_id && Number(item.quantity) > 0,
    );
    if (validItems.length === 0) {
      newErrors.items = "Add at least one product with quantity";
    } else {
      const productIds = validItems.map((item) => item.product_id);
      if (new Set(productIds).size !== productIds.length) {
        newErrors.items = "Each product can only be added once per order";
      }

      validItems.forEach((item, index) => {
        const product = getProductById(item.product_id);
        if (!product) {
          newErrors.items = "One or more selected products are invalid";
          return;
        }
        if (product.quantity_in_stock <= 0) {
          newErrors.items = `${product.name} is out of stock`;
        } else if (product.quantity_in_stock < Number(item.quantity)) {
          newErrors.items = `Insufficient stock for ${product.name}. Available: ${product.quantity_in_stock}`;
        }
        if (Number(item.quantity) <= 0) {
          newErrors[`quantity_${index}`] = "Quantity must be greater than 0";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!validateOrderForm()) return;

    const latestProducts = await refreshProducts();
    const productMap = new Map(latestProducts.map((p) => [p.id, p]));

    const payloadItems = lineItems
      .filter((item) => item.product_id && Number(item.quantity) > 0)
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }));

    for (const item of payloadItems) {
      const product = productMap.get(item.product_id);
      if (!product) {
        showToast(
          "One or more selected products are no longer available",
          "error",
        );
        return;
      }
      if (product.quantity_in_stock <= 0) {
        showToast(`${product.name} is out of stock`, "error");
        return;
      }
      if (product.quantity_in_stock < item.quantity) {
        showToast(
          `Insufficient stock for ${product.name}. Available: ${product.quantity_in_stock}`,
          "error",
        );
        return;
      }
    }

    const payload = {
      customer_id: Number(customerId),
      items: payloadItems,
    };

    setSubmitting(true);
    try {
      await ordersApi.create(payload);
      showToast("Order created successfully");
      closeCreateModal();
      loadData();
    } catch (error) {
      showToast(error.message, "error");
      refreshProducts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}? Stock will be restored.`))
      return;
    try {
      await ordersApi.delete(order.id);
      showToast("Order cancelled successfully");
      loadData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const selectedCount = getSelectedProductIds().length;
  const canAddMoreItems = selectedCount < inStockProducts.length;

  const customerOptions = [
    { value: "", label: "Select customer" },
    ...customers.map((c) => ({
      value: String(c.id),
      label: `${c.full_name} (${c.email})`,
    })),
  ];

  const columns = [
    { key: "id", label: "Order #" },
    {
      key: "customer_name",
      label: "Customer",
      render: (row) => row.customer_name || `Customer #${row.customer_id}`,
    },
    {
      key: "total_amount",
      label: "Total",
      render: (row) => formatINR(row.total_amount),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: "items",
      label: "Items",
      render: (row) => `${row.items?.length ?? 0} item(s)`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => openDetailModal(row)}
          >
            View
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => handleCancelOrder(row)}
          >
            Cancel
          </button>
        </div>
      ),
    },
  ];

  const detailColumns = [
    { key: "product_name", label: "Product" },
    { key: "product_sku", label: "SKU" },
    { key: "quantity", label: "Qty" },
    {
      key: "unit_price",
      label: "Unit Price",
      render: (row) => formatINR(row.unit_price),
    },
    {
      key: "line_total",
      label: "Line Total",
      render: (row) => formatINR(row.quantity * row.unit_price),
    },
  ];

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Orders</h1>
          <p className="page-subtitle">Create and manage customer orders</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={customers.length === 0 || inStockProducts.length === 0}
        >
          Create Order
        </button>
      </div>

      {customers.length === 0 && (
        <div className="alert alert-info">
          Add at least one customer before creating orders.
        </div>
      )}
      {customers.length > 0 && inStockProducts.length === 0 && (
        <div className="alert alert-info">
          No products with available stock. Restock products to create orders.
        </div>
      )}

      <section className="card">
        {loading ? (
          <div className="page-loading">Loading orders...</div>
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            emptyMessage="No orders yet. Create your first order."
          />
        )}
      </section>

      <Modal
        isOpen={createModalOpen}
        title="Create Order"
        onClose={closeCreateModal}
        size="xl"
      >
        <form onSubmit={handleCreateOrder} className="form">
          <FormField
            label="Customer"
            name="customer_id"
            as="select"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setErrors((prev) => ({ ...prev, customerId: undefined }));
            }}
            error={errors.customerId}
            required
            options={customerOptions}
          />

          <div className="line-items-section">
            <div className="line-items-header">
              <h3>Order Items</h3>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={addLineItem}
                disabled={!canAddMoreItems}
              >
                + Add Item
              </button>
            </div>
            {errors.items && (
              <span className="field-error block-error">{errors.items}</span>
            )}

            {lineItems.map((item, index) => {
              const maxQty = getMaxQuantity(item.product_id);
              const selectedProduct = getProductById(item.product_id);
              return (
                <div key={index} className="line-item-row">
                  <div className="line-item-header">
                    <span>Item {index + 1}</span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeLineItem(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <FormField
                    label="Product"
                    name={`product_${index}`}
                    as="select"
                    value={item.product_id}
                    onChange={(e) =>
                      handleLineItemChange(index, "product_id", e.target.value)
                    }
                    options={getProductOptionsForRow(index)}
                    required
                  />
                  {selectedProduct && (
                    <p className="line-item-meta">
                      Stock: {selectedProduct.quantity_in_stock} · Price:{" "}
                      {formatINR(selectedProduct.price)}
                    </p>
                  )}
                  <div className="line-item-controls">
                    <FormField
                      label={
                        item.product_id
                          ? `Quantity (max ${maxQty})`
                          : "Quantity"
                      }
                      name={`quantity_${index}`}
                      type="number"
                      min="1"
                      max={maxQty || undefined}
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(index, "quantity", e.target.value)
                      }
                      error={errors[`quantity_${index}`]}
                      required
                      disabled={!item.product_id}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeCreateModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        title={`Order #${selectedOrder?.id}`}
        onClose={closeDetailModal}
        size="lg"
      >
        {selectedOrder && (
          <div className="order-detail">
            <div className="order-detail-meta">
              <p>
                <strong>Customer:</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {formatDateTime(selectedOrder.created_at)}
              </p>
              <p>
                <strong>Total:</strong> {formatINR(selectedOrder.total_amount)}
              </p>
            </div>
            <DataTable columns={detailColumns} data={selectedOrder.items} />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Orders;
