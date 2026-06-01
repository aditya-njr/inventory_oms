import React from 'react';

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent ? `stat-card-${accent}` : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default StatCard;
