import { useState } from 'react';

export default function useConsultarStatus() {
  const [statusType, setStatusType] = useState("");
  const [mesaNumber, setMesaNumber] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchRecentPedidos = async () => {
    if (statusType === "mesa" && !mesaNumber) return alert("Digite o número da mesa");
    if (statusType === "delivery" && !deliveryId) return alert("Digite o ID da entrega");

    let url = "";
    if (statusType === "mesa") {
      url = `http://127.0.0.1:8000/pedido/status/mesa?n_mesa=${mesaNumber}`;
    } else {
      url = `http://127.0.0.1:8000/pedido/status/delivery?id_entrega=${deliveryId}`;
    }

    try {
      const response = await fetch(url);
      const result = await response.json();
      if (response.ok) {
        setRecentOrders(result);
      } else {
        alert("Erro ao buscar pedidos: " + result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  };

  return {
    statusType, setStatusType,
    mesaNumber, setMesaNumber,
    deliveryId, setDeliveryId,
    recentOrders, fetchRecentPedidos
  };
}
