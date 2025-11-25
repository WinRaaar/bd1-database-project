import { useState } from 'react';

export default function useConsultarStatus() {
  const [pedidoId, setPedidoId] = useState("");
  const [pedidoStatus, setPedidoStatus] = useState(null);

  const fetchPedidoStatus = async () => {
    if (!pedidoId) return alert("Digite o ID do pedido!");

    try {
      const response = await fetch(`http://127.0.0.1:8000/pedido/status/${pedidoId}`);
      const result = await response.json();

      if (response.ok) {
        setPedidoStatus(result);
      } else {
        alert("Erro ao buscar pedido: " + result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  };

  return { pedidoId, setPedidoId, pedidoStatus, fetchPedidoStatus };
}
