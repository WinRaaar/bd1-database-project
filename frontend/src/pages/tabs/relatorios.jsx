import React from 'react';
import useRelatorios from '../hooks/useRelatorios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Relatorios() {
  const { dadosVendas, itensPopulares } = useRelatorios();

  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <section className="text-block">
      <h2 className="section-title">Dashboard de Relatórios</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Gráfico 1: Vendas por Dia */}
        <div className="chart-container">
          <h3>Faturamento Diário (Últimos 7 dias)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dadosVendas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_vendas" name="Faturamento (R$)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Itens Populares */}
        <div className="chart-container">
          <h3>Top 5 Itens Mais Vendidos</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={itensPopulares}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_vendido"
                >
                  {itensPopulares.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}