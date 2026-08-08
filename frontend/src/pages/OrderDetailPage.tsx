import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { Order, OrderItem, OrderStatus } from '../types';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async (): Promise<void> => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getOrderById(Number(id));
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el detalle del pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleAction = async (
    actionFn: (orderId: number) => Promise<Order>,
    successMsg: string,
  ): Promise<void> => {
    if (!order) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      const updated = await actionFn(order.id);
      setOrder(updated);
      setSuccessMessage(successMsg);
    } catch (err) {
      // Show backend error cleanly in UI
      setError(err instanceof Error ? err.message : 'Error al ejecutar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando detalle...</p>;
  }

  if (!order) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Pedido no encontrado</h2>
        <button className="btn btn-primary" onClick={() => navigate('/orders')} style={{ marginTop: '1rem' }}>
          Volver a Pedidos
        </button>
      </div>
    );
  }

  const customerName = order.customerName || (order as unknown as Record<string, unknown>)._customerName as string || 'Cliente';
  const status = order.status || (order as unknown as Record<string, unknown>)._status as OrderStatus || 'PENDING';
  const itemsList = order.items || (order as unknown as Record<string, unknown>)._items as OrderItem[] || [];
  const rawTotal = order.total ?? (order as unknown as Record<string, unknown>)._total ?? 0;
  const total = typeof rawTotal === 'number' ? rawTotal : Number(rawTotal) || 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedido #{String(order.id).padStart(5, '0')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Fecha de Creación: {order.createdAt ? new Date(order.createdAt).toLocaleString('es-AR') : '-'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
          ← Volver al listado
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* State timeline */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estado Actual: </span>
            <StatusBadge status={status} />
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente: </span>
            <strong style={{ fontSize: '1.05rem' }}>{customerName}</strong>
          </div>
        </div>

        <div className="timeline">
          <div className={`timeline-step ${['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERED'].includes(status) ? 'active' : ''}`}>
            1. PENDIENTE
          </div>
          <div className={`timeline-step ${['CONFIRMED', 'PREPARING', 'DELIVERED'].includes(status) ? 'active' : ''}`}>
            2. CONFIRMADO
          </div>
          <div className={`timeline-step ${['PREPARING', 'DELIVERED'].includes(status) ? 'active' : ''}`}>
            3. EN PREPARACIÓN
          </div>
          <div className={`timeline-step ${status === 'DELIVERED' ? 'active' : ''}`}>
            4. ENTREGADO
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Detalle de Productos (Snapshot de Precios)</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio Unit. Snapshot</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ fontWeight: 600 }}>{item.productName}</td>
                  <td>${(item.unitPrice || 0).toFixed(2)}</td>
                  <td>x{item.quantity}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                    ${(item.subtotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Total Final:</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons dependent on state */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Acciones Disponibles</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {status === 'PENDING' && (
            <>
              <button
                className="btn btn-success"
                disabled={actionLoading}
                onClick={() =>
                  handleAction(
                    (id) => api.confirmOrder(id),
                    '¡Pedido confirmado con éxito! Stock descontado.',
                  )
                }
              >
                Confirmar Pedido
              </button>
              <button
                className="btn btn-danger"
                disabled={actionLoading}
                onClick={() =>
                  handleAction(
                    (id) => api.cancelOrder(id),
                    'Pedido cancelado correctamente.',
                  )
                }
              >
                Cancelar Pedido
              </button>
            </>
          )}

          {status === 'CONFIRMED' && (
            <>
              <button
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={() =>
                  handleAction(
                    (id) => api.startPreparingOrder(id),
                    'El pedido ha entrado en preparación.',
                  )
                }
              >
                Comenzar Preparación
              </button>
              <button
                className="btn btn-danger"
                disabled={actionLoading}
                onClick={() =>
                  handleAction(
                    (id) => api.cancelOrder(id),
                    'Pedido cancelado y stock restaurado exitosamente.',
                  )
                }
              >
                Cancelar Pedido (Restaura Stock)
              </button>
            </>
          )}

          {status === 'PREPARING' && (
            <button
              className="btn btn-success"
              disabled={actionLoading}
              onClick={() =>
                handleAction(
                  (id) => api.deliverOrder(id),
                  'El pedido se ha marcado como Entregado.',
                )
              }
            >
              Marcar como Entregado
            </button>
          )}

          {status === 'DELIVERED' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              🔒 Este pedido ha sido entregado y se encuentra en estado inmutable. No se pueden realizar acciones sobre él.
            </p>
          )}

          {status === 'CANCELLED' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              🚫 Este pedido ha sido cancelado y se encuentra en estado final.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
