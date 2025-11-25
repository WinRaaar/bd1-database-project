import React from 'react';
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
  const { dadosVendas, itensPopulares, loading, error } = useRelatorios();

  // Se a aba não está ativa, não renderiza — mas o hook permanece vivo!
  if (!active) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <p>Carregando gráficos...</p>;
  if (error) return <p>Erro ao carregar os relatórios. Tente novamente.</p>;

  return (
    <section className="text-block">
      <h2 className="section-title">Dashboard de Relatórios</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* Gráfico: Vendas por dia */}
        <div className="chart-container">
          <h3>Faturamento Diário (Últimos 7 dias)</h3>
          <div style={{ width: '100%', height: 300 }}>
            {dadosVendas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosVendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis domain={[0, (dataMax) => Math.max(400, dataMax)]} />
                  <Tooltip 
                    formatter={(value) => 
                      Number(value).toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                      })
                    } 
                  />
                  <Legend />
                  <Bar dataKey="total_vendas" name="Faturamento (R$)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>Nenhum dado de vendas disponível.</p>
            )}
          </div>
        </div>

        {/* Gráfico: Top itens */}
        <div className="chart-container">
          <h3>Top 5 Itens Mais Vendidos</h3>
          <div style={{ width: '100%', height: 300 }}>
            {itensPopulares.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={itensPopulares}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${isNaN(percent) ? 0 : (percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    dataKey="total_vendido"
                  >
                    {itensPopulares.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>Nenhum dado de itens populares disponível.</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
