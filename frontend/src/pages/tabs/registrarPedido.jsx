import React from 'react';
import useRegistrarPedido from '../hooks/UseregistrarPedido';
//import '../styles/landingPage.css';

export default function RegistrarPedido() {
  const {
    orderType, setOrderType,
    selectedItem, setSelectedItem,
    quantity, setQuantity,
    orderItems, setOrderItems,
    couponCode, setCouponCode,
    employeeId, setEmployeeId,
    mesaNumber, setMesaNumber,
    deliveryId, setDeliveryId,
    handleRegisterPedido,
    cardapio 
  } = useRegistrarPedido();

  const adicionarItem = () => {
    if (!selectedItem) return alert("Selecione um item!");
    if (quantity < 1) return alert("Quantidade inválida!");

    const itemSelecionado = cardapio.find(i => i.id_item === Number(selectedItem));
    if (!itemSelecionado) return alert("Item inválido!");

    setOrderItems([
        ...orderItems,
        {
          id_item: itemSelecionado.id_item,
          nome: itemSelecionado.nome,
          quantity,
          preco: itemSelecionado.preco
        }
    ]);

    setSelectedItem("");
    setQuantity(1);
  };

  return (
    <section className="text-block">
      <h2 className="section-title">Registrar Pedidos</h2>
      <form className="pedido-form" onSubmit={e => e.preventDefault()}>

        {/* Item do Cardápio */}
        <label className="form-label">Item do Cardápio</label>
        <select
          className="form-input"
          value={selectedItem}
          onChange={e => setSelectedItem(e.target.value)}
        >
          <option value="">Selecione um item...</option>
          {cardapio.map(item => (
            <option key={item.id_item} value={item.id_item}>{item.nome}</option>
          ))}
        </select>

        {/* Quantidade */}
        <label className="form-label">Quantidade</label>
        <input
          type="number"
          min="1"
          className="form-input"
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
        />

        {/* Adicionar Item */}
        <button
          type="button"
          className="submit-button"
          onClick={adicionarItem}
          disabled={cardapio.length === 0}
        >
          Adicionar Item
        </button>

        {/* Lista de itens */}
        {orderItems.length > 0 && (
          <div>
            <h3>Itens adicionados:</h3>
            {orderItems.map((it, i) => (
              <div key={i}>{it.nome} x {it.quantity}</div>
            ))}
          </div>
        )}

        {/* Tipo de pedido */}
        <label className="form-label">Tipo do Pedido</label>
        <select
          className="form-input"
          value={orderType}
          onChange={e => setOrderType(e.target.value)}
        >
          <option value="">Selecione...</option>
          <option value="mesa">Mesa</option>
          <option value="delivery">Delivery</option>
        </select>

        {orderType === "mesa" && (
          <input
            type="number"
            placeholder="Número da Mesa"
            value={mesaNumber}
            onChange={e => setMesaNumber(e.target.value)}
          />
        )}

        {orderType === "delivery" && (
          <input
            type="text"
            placeholder="ID da Entrega"
            value={deliveryId}
            onChange={e => setDeliveryId(e.target.value)}
          />
        )}

        {/* Cupom */}
        <label className="form-label">Cupom</label>
        <input
          type="text"
          className="form-input"
          placeholder="Cupom de Desconto, se houver"
          value={couponCode}
          onChange={e => setCouponCode(e.target.value)}
        />

        {/* Funcionário */}
        <label className="form-label">Funcionário Responsável</label>
        <input
          type="text"
          className="form-input"
          placeholder="ID Funcionário"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
        />

        <button
          type="button"
          className="registrar-button"
          onClick={handleRegisterPedido}
        >
          Registrar Pedido
        </button>

      </form>
    </section>
  );
}
