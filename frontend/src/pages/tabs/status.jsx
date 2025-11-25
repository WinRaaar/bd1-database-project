import React, { useEffect } from 'react';
import useConsultarStatus from '../hooks/useStatus';
import '../../styles/Status.css';

export default function ConsultarStatus({ active }) {
  const { pedidoId, setPedidoId, pedidoStatus, fetchPedidoStatus } = useConsultarStatus();

  // 🔥 Caso queira carregar automaticamente usando pedidoId preenchido, pode colocar aqui.
  useEffect(() => {
    if (active && pedidoId) {
      fetchPedidoStatus();
    }
  }, [active]);

  // 🚫 Se não estiver ativa, não renderiza (mas estado do hook permanece!)
  if (!active) return null;

  // Cores e labels para o status
  const getStatusStyle = (status) => {
    if (!status) return { color: '#000', label: '' };

    switch (status.toLowerCase()) {
      case 'pendente':
        return { color: '#FFA500', label: 'Pendente ⏳' };
      case 'em preparo':
      case 'em preparação':
        return { color: '#1E90FF', label: 'Em Preparação 🔧' };
      case 'pronto':
        return { color: '#32CD32', label: 'Pronto ✅' };
      case 'entregue':
        return { color: '#008000', label: 'Entregue 🚚' };
      case 'cancelado':
        return { color: '#FF0000', label: 'Cancelado ❌' };
      default:
        return { color: '#000000', label: status };
    }
  };

  return (
    <section className="text-block">
      <h2 className="section-title">Consultar Status do Pedido</h2>

      <div className="form-group">
        <label className="form-label">ID do Pedido</label>
        <input
          type="number"
          className="form-input"
          value={pedidoId}
          onChange={(e) => setPedidoId(e.target.value)}
          placeholder="Digite o ID do pedido"
        />
      </div>

      <button
        type="button"
        className="submit-button"
        onClick={fetchPedidoStatus}
      >
        Consultar Status
      </button>

      {pedidoStatus && (
        <div className="pedido-status-card">
          <h3>Status do Pedido</h3>

          <p><strong>ID do Pedido:</strong> {pedidoStatus.id_pedido}</p>
          <p><strong>Tipo:</strong> {pedidoStatus.tipo}</p>

          <p>
            <strong>Status:</strong>{' '}
            <span
              style={{
                color: getStatusStyle(pedidoStatus.status).color,
                fontWeight: 'bold'
              }}
            >
              {getStatusStyle(pedidoStatus.status).label}
            </span>
          </p>

          <p><strong>Valor Total:</strong> R$ {pedidoStatus.valor_total}</p>
          <p><strong>Data/Hora:</strong> {new Date(pedidoStatus.data_hora).toLocaleString()}</p>
        </div>
      )}
    </section>
  );
}
