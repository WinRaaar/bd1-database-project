import React, { useEffect, useState } from 'react';
import useRelatorios from '../hooks/useRelatorios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

  // Carrega SOMENTE quando a aba fica ativa
  useEffect(() => {
    if (!active) return;

    if (modoAcesso === 'GERAL') {
      carregarRelatoriosGerais();
    } else if (modoAcesso === 'RESTAURANTE' && inputId) {
      carregarRelatoriosEspecificos(inputId);
    }

  }, [active]); // dispara somente quando vira ativa

  // Se a aba não está ativa → não renderiza nada
  if (!active) return null;

  const handleAcessar = e => {
    e.preventDefault();
    setMsgErro('');

    if (inputId.toUpperCase() === 'TODOS' && inputKey === CHAVE_GERAL) {
      setModoAcesso('GERAL');
      carregarRelatoriosGerais();
      return;
    }

    if (inputKey === CHAVE_RESTAURANTE && !isNaN(inputId)) {
      setModoAcesso('RESTAURANTE');
      carregarRelatoriosEspecificos(inputId);
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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

            <button className="submit-button" type="submit">
              Entrar
            </button>
          </form>

          <p className="login-tip">
            Use ID + chave **123** para restaurante.<br />
            Use **TODOS** + chave **ADMIN** para visão geral.
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

        <button className="logout-button" onClick={handleSair}>
          Sair
        </button>
      </div>

      {loading && <p>Carregando dados...</p>}
      {error && <p className="error-msg">{error}</p>}

      {/* ------------------------------------------- */}
      {/* VISÃO GERAL */}
      {/* ------------------------------------------- */}
      {modoAcesso === 'GERAL' && (
        <div className="charts-wrapper">

          <div className="chart-container">
            <h3>Pedidos por Unidade</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={vendasPorUnidade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_pedidos" name="Pedidos" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <h3>Faturamento (R$)</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={vendasPorUnidade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="total_faturamento" name="Faturamento" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <h3>Top 5 Itens - Rede</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={itensGerais}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                    dataKey="total_vendido"
                  >
                    {itensGerais.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------- */}
      {/* VISÃO INDIVIDUAL */}
      {/* ------------------------------------------- */}
      {modoAcesso === 'RESTAURANTE' && (
        <div className="charts-wrapper">

          <div className="chart-container">
            <h3>Faturamento Diário</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={dadosVendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="total_vendas" name="Vendas (R$)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <h3>Itens Mais Vendidos</h3>
            <div className="chart-box">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={itensPopulares}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                    dataKey="total_vendido"
                  >
                    {itensPopulares.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </section>
  );
}
