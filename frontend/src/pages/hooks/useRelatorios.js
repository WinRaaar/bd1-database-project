import { useState, useEffect } from 'react';

export default function useRelatorios() {
  const [dadosVendas, setDadosVendas] = useState([]);
  const [itensPopulares, setItensPopulares] = useState([]);

  // ID fixo do restaurante para exemplo (pode vir de contexto/login futuramente)
  const idRestaurante = 1; 

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      // Buscar Vendas
      const resVendas = await fetch(`http://127.0.0.1:8000/relatorio/vendas?id_restaurante=${idRestaurante}`);
      const jsonVendas = await resVendas.json();
      if (resVendas.ok) setDadosVendas(jsonVendas);

      // Buscar Itens Populares
      const resItens = await fetch(`http://127.0.0.1:8000/relatorio/itens-populares?id_restaurante=${idRestaurante}`);
      const jsonItens = await resItens.json();
      if (resItens.ok) setItensPopulares(jsonItens);

    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
    }
  };

  return { dadosVendas, itensPopulares };
}