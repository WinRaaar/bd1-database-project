import React, { useEffect } from 'react';
import useRegistrarPedido from '../hooks/UseregistrarPedido';

export default function RegistrarPedido({ active }) {
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

  // 🚫 Se a aba não está ativa, não renderiza o conteúdo,
  // mas o estado continua preservado!
  if (!active) return null;

  const adicionarItem = () => {
    if (!selectedItem) return alert("Selecione um item!");
    if (quantity < 1) return alert("Quantidade inválida!");

    if (!Array.isArray(cardapio)) {
      console.error("Cardápio não é array:", cardapio);
      return alert("Erro ao carregar cardápio. Recarregue a página.");
    }

    const itemSelecionado = cardapio.find(
      (i) => i.id_item === Number(selectedItem)
    );

    if (!itemSelecionado) {
      console.error("Item não encontrado");
      return alert("Item inválido!");
    }

    setOrderItems([
      ...orderItems,
      {
        id_item: itemSelecionado.id_item,
        nome: itemSelecionado.nome,
        quantity,
        preco: Number(itemSelecionado.preco),
      },
    ]);

    setSelectedItem("");
    setQuantity(1);
  };

  const calcularTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + item.preco * item.quantity;
    }, 0);
  };

  return (
    <section className="text-block">
      <h2 className="section-title">Registrar Pedidos</h2>

      <form className="pedido-form" onSubmit={(e) => e.preventDefault()}>

        {/* Item */}
        <label className="form-label">Item do Cardápio</label>
        <select
          className="form-input"
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
        >
          <option value="">Selecione um item...</option>
          {Array.isArray(cardapio) &&
            cardapio.map((item) => (
              <option key={item.id_item} value={item.id_item}>
                {item.nome}
              </option>
            ))}
        </select>

        {/* Quantidade */}
        <label className="form-label">Quantidade</label>
        <input
          type="number"
          min="1"
          className="form-input"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        {/* Botão adicionar item */}
        <button
          type="button"
          className="submit-button"
          onClick={adicionarItem}
          disabled={!Array.isArray(cardapio) || cardapio.length === 0}
        >
          Adicionar Item
        </button>

        {/* Lista de itens */}
        {orderItems.length > 0 && (
          <div className="pedido-itens-box">
            <h3>Itens adicionados:</h3>

            {orderItems.map((it, i) => (
              <div key={i} className="pedido-item">
                <span>
                  {it.nome} x {it.quantity} (R$ {it.preco.toFixed(2)} un)
                </span>
                <span>R$ {(it.preco * it.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div className="pedido-total">
              <span>Total:</span>
              <span>R$ {calcularTotal().toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Tipo do pedido */}
        <label className="form-label">Tipo do Pedido</label>
        <select
          className="form-input"
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
        >
          <option value="">Selecione...</option>
          <option value="mesa">Mesa</option>
          <option value="delivery">Delivery</option>
        </select>

        {orderType === "mesa" && (
          <input
            type="number"
            placeholder="Número da Mesa"
            className="form-input"
            value={mesaNumber}
            onChange={(e) => setMesaNumber(e.target.value)}
          />
        )}

        {orderType === "delivery" && (
          <input
            type="text"
            placeholder="ID da Entrega"
            className="form-input"
            value={deliveryId}
            onChange={(e) => setDeliveryId(e.target.value)}
          />
        )}

        {/* Cupom */}
        <label className="form-label">Cupom</label>
        <input
          type="text"
          className="form-input"
          placeholder="Cupom de Desconto"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />

        {/* Funcionário */}
        <label className="form-label">Funcionário Responsável</label>
        <input
          type="text"
          className="form-input"
          placeholder="ID Funcionário"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
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
