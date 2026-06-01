import React from 'react';

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  min,
  step,
  as = 'input',
  options = [],
}) {
  const inputId = `field-${name}`;

  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={inputId}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {as === 'select' ? (
        <select id={inputId} name={name} value={value} onChange={onChange} required={required}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          min={min}
          step={step}
        />
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default FormField;
