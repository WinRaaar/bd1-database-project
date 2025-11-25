import React from 'react';
import useConsultarStatus from '../hooks/useStatus';
//import '../styles/landingPage.css';

export default function ConsultarStatus() {
  const {
    statusType, setStatusType,
    mesaNumber, setMesaNumber,
    deliveryId, setDeliveryId,
    recentOrders, fetchRecentPedidos
  } = useConsultarStatus();

  return (
    <section className="text-block">
      <h2 className="section-title">Consultar Status do Pedido</h2>

      <form className="pedido-form" onSubmit={(e) => e.preventDefault()}>
        <label className="form-label">Tipo do Pedido</label>
        <select className="form-input" value={statusType} onChange={e => setStatusType(e.target.value)}>
          <option value="">Selecione...</option>
          <option value="mesa">Mesa</option>
          <option value="delivery">Delivery</option>
        </select>

        {statusType === "mesa" && (
          <>
            <label className="form-label">Número da Mesa</label>
            <input type="number" className="form-input" placeholder="Digite o número da mesa"
              value={mesaNumber} onChange={e => setMesaNumber(e.target.value)} />
          </>
        )}

        {statusType === "delivery" && (
          <>
            <label className="form-label">ID da Entrega</label>
            <input type="text" className="form-input" placeholder="Digite o ID da entrega"
              value={deliveryId} onChange={e => setDeliveryId(e.target.value)} />
          </>
        )}

        <button type="button" className="submit-button" onClick={fetchRecentPedidos}>
          Consultar Últimos Pedidos
        </button>
      </form>

      {recentOrders.length > 0 && (
        <div className="items-list">
          <h3>Últimos pedidos {statusType === "mesa" ? `da mesa ${mesaNumber}` : ""}:</h3>
          {recentOrders.map(pedido => (
            <div key={pedido.id_pedido} className="item-line">
              <span>ID Pedido: {pedido.id_pedido}</span>
              <span>Status: {pedido.status}</span>
              <span>Data/Hora: {new Date(pedido.data_hora).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
