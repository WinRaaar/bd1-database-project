// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import RegistrarPedido from './tabs/registrarPedido';
import ConsultarStatus from './tabs/status';
import EmitirPedido from './tabs/emitir';
import Relatorios from './tabs/relatorios';
import ConsultarIngredientes from './tabs/ConsultarIngredientes';

import '../styles/landingPage.css';

export default function LandingPage() {
  const [selectedTab, setSelectedTab] = useState("registrar");

  const tabs = [
    { id: "registrar", label: "Registrar Pedidos" },
    { id: "status", label: "Consultar Status" },
    { id: "emitir", label: "Emitir Comanda / NF" },
    { id: "relatorios", label: "Relatórios e Gráficos" },
    { id: "estoque", label: "Consultar Estoque" },
  ];

  const renderContent = () => (
    <>
      <RegistrarPedido active={selectedTab === "registrar"} />
      <ConsultarStatus active={selectedTab === "status"} />
      <EmitirPedido active={selectedTab === "emitir"} />
      <Relatorios active={selectedTab === "relatorios"} />
      <ConsultarIngredientes active={selectedTab === "estoque"} />
    </>
  );

  return (
    <div className="layout">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <h2 className="sidebar-title">rEstAuranteCH</h2>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={selectedTab === tab.id ? "sidebar-button active" : "sidebar-button"}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      {/* CONTEÚDO CENTRAL */}
      <main className="content-area">{renderContent()}</main>
    </div>
  );
}
