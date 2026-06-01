import React, { useCallback, useEffect, useState } from "react";
import { customersApi } from "../api/client";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
};

function validateCustomerForm(form) {
  const errors = {};
  const fullName = form.full_name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = phone.replace(/\D/g, "");

  if (!fullName) {
    errors.full_name = "Full name is required";
  } else if (!namePattern.test(fullName)) {
    errors.full_name = "Enter a valid full name";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!emailPattern.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!phone) {
    errors.phone = "Phone number is required";
  } else if (phoneDigits.length !== 10 || !/^[6789]/.test(phoneDigits)) {
    errors.phone = "Please enter valid phone number";
  }

  return errors;
}

function validateCustomerField(name, value) {
  const trimmed = value.trim();
  const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const digits = trimmed.replace(/\D/g, "");

  switch (name) {
    case "full_name":
      if (!trimmed) return "Full name is required";
      if (!namePattern.test(trimmed)) return "Enter a valid full name";
      return undefined;
    case "email":
      if (!trimmed) return "Email is required";
      if (!emailPattern.test(trimmed)) return "Enter a valid email address";
      return undefined;
    case "phone":
      if (!trimmed) return "Phone number is required";
      if (digits.length !== 10 || !/^[6789]/.test(digits)) {
        return "Please enter valid phone number";
      }
      return undefined;
    default:
      return undefined;
  }
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.list();
      setCustomers(data);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));

    const fieldError = validateCustomerField(name, nextValue);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateCustomerForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await customersApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      showToast("Customer created successfully");
      closeModal();
      loadCustomers();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.full_name}"?`)) return;
    try {
      await customersApi.delete(customer.id);
      showToast("Customer deleted successfully");
      loadCustomers();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => handleDelete(row)}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Customers</h1>
          <p className="page-subtitle">Manage customer records</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Add Customer
        </button>
      </div>

      <section className="card">
        {loading ? (
          <div className="page-loading">Loading customers...</div>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            emptyMessage="No customers yet. Add your first customer."
          />
        )}
      </section>

      <Modal isOpen={modalOpen} title="Add Customer" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="form">
          <FormField
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            error={errors.full_name}
            required
            placeholder="Jane Doe"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="jane@example.com"
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            placeholder="9876543210"
            maxLength={10}
          />
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Customers;
