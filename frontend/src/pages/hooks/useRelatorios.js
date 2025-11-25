import { useState, useEffect } from 'react';

export default function useRelatorios() {
  const [dadosVendas, setDadosVendas] = useState([]);
  const [itensPopulares, setItensPopulares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const idRestaurante = 1;

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar Vendas
      const resVendas = await fetch(
        `http://127.0.0.1:8000/relatorio/vendas?id_restaurante=${idRestaurante}`
      );
      const jsonVendas = await resVendas.json();
      if (resVendas.ok && Array.isArray(jsonVendas)) {
        setDadosVendas(
          jsonVendas.map(item => ({
            ...item,
            total_vendas: Number(item.total_vendas) || 0, // garante número
            qtd_pedidos: Number(item.qtd_pedidos) || 0
          }))
        );
      }

      // Buscar Itens Populares
      const resItens = await fetch(
        `http://127.0.0.1:8000/relatorio/itens-populares?id_restaurante=${idRestaurante}`
      );
      const jsonItens = await resItens.json();
      if (resItens.ok && Array.isArray(jsonItens)) {
        setItensPopulares(
          jsonItens.map(item => ({
            ...item,
            total_vendido: Number(item.total_vendido) || 0 // garante número
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { dadosVendas, itensPopulares, loading, error };
}
