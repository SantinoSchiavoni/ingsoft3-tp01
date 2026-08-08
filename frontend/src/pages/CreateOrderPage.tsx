import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CreateOrderItemInput, Product } from '../types';

interface OrderLineItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [items, setItems] = useState<OrderLineItem[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProducts()
      .then((data) => setProducts(data.filter((p) => p.active)))
      .catch((err) => setError(err.message));
  }, []);

  const handleAddItem = (): void => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) return;

    if (items.some((i) => i.productId === product.id)) {
      setError(`El producto "${product.name}" ya se encuentra agregado al pedido.`);
      return;
    }

    if (selectedQuantity < 1) {
      setError('La cantidad debe ser mayor o igual a 1');
      return;
    }

    setError(null);
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: selectedQuantity,
      },
    ]);

    setSelectedProductId('');
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (productId: number): void => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleQuantityChange = (productId: number, newQty: number): void => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  // Frontend recalculates preview total
  const calculatedTotal = items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );

  // Frontend validation checks for submit button disabled state
  const isCustomerNameValid = customerName.trim().length >= 2 && customerName.trim().length <= 100;
  const isItemsValid = items.length > 0 && items.every((i) => i.quantity >= 1);
  const isFormValid = isCustomerNameValid && isItemsValid;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      setError(null);
      const payloadItems: CreateOrderItemInput[] = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const created = await api.createOrder({
        customerName: customerName.trim(),
        items: payloadItems,
      });

      navigate(`/orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Crear Nuevo Pedido</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Complete la información del cliente y agregue los productos
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Datos del Cliente</h3>
          <div className="form-group">
            <label className="form-label">Nombre del Cliente *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Juan Pérez"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            {customerName && !isCustomerNameValid && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                El nombre debe contener entre 2 y 100 caracteres.
              </span>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Agregar Productos</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: '200px', margin: 0 }}>
              <label className="form-label">Producto Activo</label>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
              >
                <option value="">Seleccione un producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.price.toFixed(2)} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '100px', margin: 0 }}>
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddItem}
              disabled={!selectedProductId || selectedQuantity < 1}
            >
              + Agregar Item
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Resumen de Items</h3>

          {items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No se han agregado productos al pedido.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unit.</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td style={{ fontWeight: 600 }}>{item.productName}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ width: '80px', padding: '0.3rem 0.5rem' }}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.productId,
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          Quitar
                        </button>
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
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Estimado:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  ${calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/orders')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid || loading}
          >
            {loading ? 'Creando...' : 'Crear Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};
