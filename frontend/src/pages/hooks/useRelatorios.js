// useRelatorios.js - Versão CORRIGIDA
import { useState } from 'react';

export default function useRelatorios() {
  // ... (estados inalterados)
  const [dadosVendas, setDadosVendas] = useState([]);
  const [itensPopulares, setItensPopulares] = useState([]);
  const [vendasPorUnidade, setVendasPorUnidade] = useState([]);
  const [itensGerais, setItensGerais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para carregar dados de UM restaurante
  const carregarRelatoriosEspecificos = async (idRestaurante) => {
    setLoading(true);
    setError(null);
    let hasError = false;

    try {
      // 1. Requisição de Vendas
      const resVendas = await fetch(`http://127.0.0.1:8000/relatorio/vendas?id_restaurante=${idRestaurante}`);
      if (!resVendas.ok) {
        hasError = true;
        setDadosVendas([]); // Garante array vazio em caso de falha
        console.error('Falha ao buscar dados de vendas.');
      } else {
        setDadosVendas(await resVendas.json());
      }

      // 2. Requisição de Itens Populares
      const resItens = await fetch(`http://127.0.0.1:8000/relatorio/itens-populares?id_restaurante=${idRestaurante}`);
      if (!resItens.ok) {
        hasError = true;
        setItensPopulares([]); // Garante array vazio em caso de falha
        console.error('Falha ao buscar itens populares.');
      } else {
        setItensPopulares(await resItens.json());
      }
      
      if (hasError) {
          setError('Alguns dados não puderam ser carregados. Verifique o console.');
      }

    } catch (err) {
      // Captura erros de rede/conexão
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados GERAIS (Todas as unidades)
  const carregarRelatoriosGerais = async () => {
    setLoading(true);
    setError(null);
    let hasError = false;

    try {
        // 1. Requisição de Vendas por Unidade
        const resUnidades = await fetch(`http://127.0.0.1:8000/relatorio/geral/vendas-por-unidade`);
        if (!resUnidades.ok) {
            hasError = true;
            setVendasPorUnidade([]);
            console.error('Falha ao buscar vendas por unidade.');
        } else {
            setVendasPorUnidade(await resUnidades.json());
        }

        // 2. Requisição de Itens Gerais
        const resItens = await fetch(`http://127.0.0.1:8000/relatorio/geral/itens-populares`);
        if (!resItens.ok) {
            hasError = true;
            setItensGerais([]);
            console.error('Falha ao buscar itens gerais.');
        } else {
            setItensGerais(await resItens.json());
        }

        if (hasError) {
            setError('Alguns dados gerais não puderam ser carregados. Verifique o console.');
        }

    } catch (err) {
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { 
    dadosVendas, 
    itensPopulares, 
    carregarRelatoriosEspecificos,
    vendasPorUnidade,
    itensGerais,
    carregarRelatoriosGerais,
    loading, 
    error 
  };
}