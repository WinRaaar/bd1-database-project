import { useState, useEffect } from "react";

export default function useRegistrarPedido() {
  const [orderType, setOrderType] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [mesaNumber, setMesaNumber] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [cardapio, setCardapio] = useState([]); // <-- lista de itens do cardápio

  // Puxar cardápio do backend
  useEffect(() => {
    const fetchCardapio = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/cardapio"); // endpoint do backend
        const data = await response.json();
        setCardapio(data); // assume que data é array de { id_item, nome }
      } catch (error) {
        console.error("Erro ao buscar cardápio:", error);
      }
    };

    fetchCardapio();
  }, []);

  const handleRegisterPedido = async () => {
    if (orderItems.length === 0) {
      alert("Adicione pelo menos um item!");
      return;
    }

    const data = {
      id_cliente: 1,
      id_restaurante: 1,
      id_funcionario: employeeId || null,
      taxa_entrega: orderType === "delivery" ? 5 : 0,
      tipo: orderType,
      n_mesa: orderType === "mesa" ? mesaNumber : null,
      endereco_entrega: orderType === "delivery" ? deliveryId : "",
      itens: orderItems.map((item) => ({
        id_item: item.id_item,
        quantidade: item.quantity,
      })),
      cupom: couponCode
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Pedido registrado! ID: ${result.pedido_id}, Valor total: R$${result.valor_total}`);
        setOrderItems([]);
        setEmployeeId("");
        setCouponCode("");
      } else {
        alert("Erro ao registrar pedido: " + result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  };

  return {
    orderType, setOrderType,
    selectedItem, setSelectedItem,
    quantity, setQuantity,
    orderItems, setOrderItems,
    couponCode, setCouponCode,
    employeeId, setEmployeeId,
    mesaNumber, setMesaNumber,
    deliveryId, setDeliveryId,
    handleRegisterPedido,
    cardapio, // exportando cardápio
  };
}
