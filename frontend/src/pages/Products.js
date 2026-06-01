import React, { useCallback, useEffect, useState } from 'react';
import { productsApi } from '../api/client';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatINR } from '../utils/currency';

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
};

function validateProductForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Product name is required';
  if (!form.sku.trim()) errors.sku = 'SKU is required';
  if (!form.price || Number(form.price) <= 0) errors.price = 'Price must be greater than 0';
  if (form.quantity_in_stock === '' || Number(form.quantity_in_stock) < 0) {
    errors.quantity_in_stock = 'Quantity cannot be negative';
  } else if (!Number.isInteger(Number(form.quantity_in_stock))) {
    errors.quantity_in_stock = 'Quantity must be a whole number';
  }
  return errors;
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list();
      setProducts(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity_in_stock: String(product.quantity_in_stock),
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateProductForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };

    setSubmitting(true);
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        showToast('Product updated successfully');
      } else {
        await productsApi.create(payload);
        showToast('Product created successfully');
      }
      closeModal();
      loadProducts();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await productsApi.delete(product.id);
      showToast('Product deleted successfully');
      loadProducts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'price',
      label: 'Price (INR)',
      render: (row) => formatINR(row.price),
    },
    {
      key: 'quantity_in_stock',
      label: 'Stock',
      render: (row) => (
        <span className={row.quantity_in_stock <= 10 ? 'badge badge-warning' : 'badge badge-success'}>
          {row.quantity_in_stock}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="action-buttons">
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEditModal(row)}>
            Edit
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Products</h1>
          <p className="page-subtitle">Manage your product catalog and inventory</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          Add Product
        </button>
      </div>

      <section className="card">
        {loading ? (
          <div className="page-loading">Loading products...</div>
        ) : (
          <DataTable columns={columns} data={products} emptyMessage="No products yet. Add your first product." />
        )}
      </section>

      <Modal
        isOpen={modalOpen}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="form">
          <FormField
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="e.g. Wireless Mouse"
          />
          <FormField
            label="SKU / Code"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            error={errors.sku}
            required
            placeholder="e.g. WM-001"
          />
          <FormField
            label="Price (INR)"
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            error={errors.price}
            required
            placeholder="999.00"
          />
          <FormField
            label="Quantity in Stock"
            name="quantity_in_stock"
            type="number"
            min="0"
            step="1"
            value={form.quantity_in_stock}
            onChange={handleChange}
            error={errors.quantity_in_stock}
            required
            placeholder="0"
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Products;
