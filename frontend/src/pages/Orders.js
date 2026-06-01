import React, { useCallback, useEffect, useState } from 'react';
import { customersApi, ordersApi, productsApi } from '../api/client';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const emptyLineItem = { product_id: '', quantity: '1' };

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerId, setCustomerId] = useState('');
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
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setCustomerId(customers[0]?.id ? String(customers[0].id) : '');
    setLineItems([{ ...emptyLineItem }]);
    setErrors({});
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCustomerId('');
    setLineItems([{ ...emptyLineItem }]);
    setErrors({});
  };

  const openDetailModal = async (order) => {
    try {
      const { data } = await ordersApi.get(order.id);
      setSelectedOrder(data);
      setDetailModalOpen(true);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setErrors((prev) => ({ ...prev, items: undefined }));
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateOrderForm = () => {
    const newErrors = {};
    if (!customerId) newErrors.customerId = 'Select a customer';

    const validItems = lineItems.filter((item) => item.product_id && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      newErrors.items = 'Add at least one product with quantity';
    } else {
      const productIds = validItems.map((item) => item.product_id);
      if (new Set(productIds).size !== productIds.length) {
        newErrors.items = 'Duplicate products are not allowed';
      }
      validItems.forEach((item, index) => {
        const product = products.find((p) => p.id === Number(item.product_id));
        if (product && product.quantity_in_stock < Number(item.quantity)) {
          newErrors.items = `Insufficient stock for ${product.name}`;
        }
        if (Number(item.quantity) <= 0) {
          newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!validateOrderForm()) return;

    const payload = {
      customer_id: Number(customerId),
      items: lineItems
        .filter((item) => item.product_id && Number(item.quantity) > 0)
        .map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
    };

    setSubmitting(true);
    try {
      await ordersApi.create(payload);
      showToast('Order created successfully');
      closeCreateModal();
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}? Stock will be restored.`)) return;
    try {
      await ordersApi.delete(order.id);
      showToast('Order cancelled successfully');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const productOptions = [
    { value: '', label: 'Select product' },
    ...products.map((p) => ({
      value: String(p.id),
      label: `${p.name} (${p.sku}) - Stock: ${p.quantity_in_stock} - $${p.price.toFixed(2)}`,
    })),
  ];

  const customerOptions = [
    { value: '', label: 'Select customer' },
    ...customers.map((c) => ({
      value: String(c.id),
      label: `${c.full_name} (${c.email})`,
    })),
  ];

  const columns = [
    { key: 'id', label: 'Order #' },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (row) => row.customer_name || `Customer #${row.customer_id}`,
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (row) => `$${Number(row.total_amount).toFixed(2)}`,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => `${row.items?.length ?? 0} item(s)`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="action-buttons">
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => openDetailModal(row)}>
            View
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleCancelOrder(row)}>
            Cancel
          </button>
        </div>
      ),
    },
  ];

  const detailColumns = [
    { key: 'product_name', label: 'Product' },
    { key: 'product_sku', label: 'SKU' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'unit_price',
      label: 'Unit Price',
      render: (row) => `$${Number(row.unit_price).toFixed(2)}`,
    },
    {
      key: 'line_total',
      label: 'Line Total',
      render: (row) => `$${(row.quantity * row.unit_price).toFixed(2)}`,
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
          disabled={customers.length === 0 || products.length === 0}
        >
          Create Order
        </button>
      </div>

      {(customers.length === 0 || products.length === 0) && (
        <div className="alert alert-info">
          Add at least one customer and one product before creating orders.
        </div>
      )}

      <section className="card">
        {loading ? (
          <div className="page-loading">Loading orders...</div>
        ) : (
          <DataTable columns={columns} data={orders} emptyMessage="No orders yet. Create your first order." />
        )}
      </section>

      <Modal isOpen={createModalOpen} title="Create Order" onClose={closeCreateModal} size="lg">
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
              <button type="button" className="btn btn-sm btn-secondary" onClick={addLineItem}>
                + Add Item
              </button>
            </div>
            {errors.items && <span className="field-error block-error">{errors.items}</span>}

            {lineItems.map((item, index) => (
              <div key={index} className="line-item-row">
                <FormField
                  label={`Product ${index + 1}`}
                  name={`product_${index}`}
                  as="select"
                  value={item.product_id}
                  onChange={(e) => handleLineItemChange(index, 'product_id', e.target.value)}
                  options={productOptions}
                />
                <FormField
                  label="Quantity"
                  name={`quantity_${index}`}
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                  error={errors[`quantity_${index}`]}
                />
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger line-item-remove"
                    onClick={() => removeLineItem(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModalOpen} title={`Order #${selectedOrder?.id}`} onClose={closeDetailModal} size="lg">
        {selectedOrder && (
          <div className="order-detail">
            <div className="order-detail-meta">
              <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
              <p><strong>Date:</strong> {formatDate(selectedOrder.created_at)}</p>
              <p><strong>Total:</strong> ${Number(selectedOrder.total_amount).toFixed(2)}</p>
            </div>
            <DataTable columns={detailColumns} data={selectedOrder.items} />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Orders;
