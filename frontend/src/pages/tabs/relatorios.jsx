import React, { useEffect, useState } from 'react';
import useRelatorios from '../hooks/useRelatorios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Relatorios({ active }) {
  const {
    dadosVendas, itensPopulares, carregarRelatoriosEspecificos,
    vendasPorUnidade, itensGerais, carregarRelatoriosGerais,
    loading, error
  } = useRelatorios();

  // Controle de acesso
  const [modoAcesso, setModoAcesso] = useState(null);
  const [inputId, setInputId] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [msgErro, setMsgErro] = useState('');

  const CHAVE_RESTAURANTE = "123";
  const CHAVE_GERAL = "ADMIN";

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

  // Carrega dados automaticamente quando a aba fica ativa ou quando o modoAcesso/inputId mudam
  useEffect(() => {
    if (!active || loading) return;

    if (modoAcesso === 'GERAL') {
      carregarRelatoriosGerais();
    } else if (modoAcesso === 'RESTAURANTE' && inputId) {
      carregarRelatoriosEspecificos(inputId);
    }
  }, [active, modoAcesso, inputId]); // Removi 'loading' e as funções de carregamento do array de dependências para evitar loop infinito

  const handleAcessar = e => {
    e.preventDefault();
    setMsgErro('');

    if (inputId.toUpperCase() === 'TODOS' && inputKey === CHAVE_GERAL) {
      // Garante que o inputId é formatado como 'TODOS' para a exibição no título
      setInputId('TODOS');
      setModoAcesso('GERAL');  // useEffect cuidará do carregamento
      return;
    }

    if (inputKey === CHAVE_RESTAURANTE && !isNaN(parseInt(inputId)) && parseInt(inputId) > 0) {
      // Garante que o ID é um número válido (assumindo IDs maiores que 0)
      setInputId(parseInt(inputId).toString()); // Normaliza o inputId para o número
      setModoAcesso('RESTAURANTE'); // useEffect cuidará do carregamento
      return;
    }

    setMsgErro('Credenciais inválidas.');
  };

  const handleSair = () => {
    setModoAcesso(null);
    setInputId('');
    setInputKey('');
    setMsgErro('');
  };

  if (!active) return null;

  // ----------------------------
  // Tela de Login
  // ----------------------------
  if (!modoAcesso) {
    return (
      <section className="text-block">
        <h2 className="section-title">Acesso aos Relatórios</h2>

        <div className="login-box">
          <form className="login-form" onSubmit={handleAcessar}>
            <div className="form-group">
              <label className="form-label">ID ou "TODOS"</label>
              <input
                type="text"
                className="form-input"
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                placeholder="Ex: 1 ou TODOS"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chave de Acesso</label>
              <input
                type="password"
                className="form-input"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="Digite a chave..."
              />
            </div>

            {msgErro && <p className="error-msg">{msgErro}</p>}

            <button className="submit-button" type="submit">Entrar</button>
          </form>

          <p className="login-tip">
            Use ID + chave <strong>123</strong> para restaurante.<br />
            Use <strong>TODOS</strong> + chave <strong>ADMIN</strong> para visão geral.
          </p>
        </div>
      </section>
    );
  }

  // ----------------------------
  // Dashboard
  // ----------------------------
  return (
    <section className="text-block">
      <div className="dashboard-header">
        <h2 className="section-title">
          {modoAcesso === 'GERAL'
            ? 'Visão Geral (Todas as Unidades)'
            : `Dashboard - Restaurante #${inputId}`}
        </h2>
        <button className="logout-button" onClick={handleSair}>Sair</button>
      </div>

      {loading && <p>Carregando dados...</p>}
      {error && <p className="error-msg">Erro: {error}</p>}
      
      {/* Verifica se não está carregando E não há erro para exibir o conteúdo */}
      {!loading && !error && (
        <>
          {/* VISÃO GERAL */}
          {modoAcesso === 'GERAL' && (
            <div className="charts-wrapper">
              
              {/* Pedidos por Unidade */}
              <div className="chart-container">
                <h3>Pedidos por Unidade</h3>
                <div className="chart-box" style={{ height: '300px' }}>
                  {vendasPorUnidade.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendasPorUnidade} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nome" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_pedidos" name="Pedidos" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="no-data">Nenhum dado de pedidos por unidade encontrado.</p>}
                </div>
              </div>

              {/* Faturamento (R$) */}
              <div className="chart-container">
                <h3>Faturamento (R$)</h3>
                <div className="chart-box" style={{ height: '300px' }}>
                  {vendasPorUnidade.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendasPorUnidade} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" angle={-15} textAnchor="end" height={40} />
                        <YAxis />
                        <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="total_faturamento" name="Faturamento" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="no-data">Nenhum dado de faturamento encontrado.</p>}
                </div>
              </div>

              {/* Top 5 Itens - Rede */}
              <div className="chart-container">
                <h3>Top 5 Itens - Rede</h3>
                <div className="chart-box" style={{ height: '300px' }}>
                  {itensGerais.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 5, bottom: 5 }}>
                        <Pie
                          data={itensGerais}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          labelLine={false}
                          label={({ nome_item, percent }) => `${nome_item} (${(percent * 100).toFixed(0)}%)`}
                          dataKey="total_vendido"
                          nameKey="nome_item" // ASSUME que o nome do item está nesta chave
                        >
                          {itensGerais.map((_, i) => (
                            <Cell key={`cell-geral-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="no-data">Nenhum item popular geral encontrado.</p>}
                </div>
              </div>
            </div>
          )}

          {/* VISÃO RESTAURANTE */}
          {modoAcesso === 'RESTAURANTE' && (
            <div className="charts-wrapper">
              
              {/* Faturamento Diário */}
              <div className="chart-container">
                <h3>Faturamento Diário</h3>
                <div className="chart-box" style={{ height: '300px' }}>
                  {dadosVendas.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosVendas} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" angle={-15} textAnchor="end" height={40} />
                        <YAxis />
                        <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="total_vendas" name="Vendas (R$)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="no-data">Nenhum dado de faturamento diário encontrado.</p>}
                </div>
              </div>

              {/* Itens Mais Vendidos */}
              <div className="chart-container">
                <h3>Itens Mais Vendidos</h3>
                <div className="chart-box" style={{ height: '300px' }}>
                  {itensPopulares.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 5, bottom: 5 }}>
                        <Pie
                          data={itensPopulares}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          labelLine={false}
                          label={({ nome_item, percent }) => `${nome_item} (${(percent * 100).toFixed(0)}%)`}
                          dataKey="total_vendido"
                          nameKey="nome_item" // ASSUME que o nome do item está nesta chave
                        >
                          {itensPopulares.map((_, i) => (
                            <Cell key={`cell-pop-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="no-data">Nenhum item popular encontrado para este restaurante.</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}