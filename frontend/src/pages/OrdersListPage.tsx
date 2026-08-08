import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { Order, OrderItem, OrderStatus } from '../types';

export const OrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getOrders({
          status: statusFilter ? (statusFilter as OrderStatus) : undefined,
          customerName: customerFilter ? customerFilter : undefined,
        });
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, customerFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Pedidos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Listado y administración de pedidos en tiempo real
          </p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          + Nuevo Pedido
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <label className="form-label">Filtrar por Estado</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="PREPARING">En Preparación</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <label className="form-label">Buscar Cliente</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nombre del cliente..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron pedidos.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Pedido #</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  // Safe accessors supporting both domain getters and direct fields
                  const customerName = order.customerName || (order as unknown as Record<string, unknown>)._customerName as string || 'Cliente';
                  const status = order.status || (order as unknown as Record<string, unknown>)._status as OrderStatus || 'PENDING';
                  const itemsList = order.items || (order as unknown as Record<string, unknown>)._items as OrderItem[] || [];
                  const rawTotal = order.total ?? (order as unknown as Record<string, unknown>)._total ?? 0;
                  const total = typeof rawTotal === 'number' ? rawTotal : Number(rawTotal) || 0;

                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{String(order.id).padStart(5, '0')}</td>
                      <td>{customerName}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : '-'}</td>
                      <td>{itemsList.length} prod.</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        ${total.toFixed(2)}
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td>
                        <Link to={`/orders/${order.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                          Ver Detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
