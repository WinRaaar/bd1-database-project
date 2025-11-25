// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import RegistrarPedido from './tabs/registrarPedido';
import ConsultarStatus from './tabs/status';
import EmitirPedido from './tabs/emitir';
import Relatorios from './tabs/relatorios';

import '../styles/landingPage.css';

export default function LandingPage() {
  
  const [selectedTab, setSelectedTab] = useState("registrar");

  const tabs = [
    { id: "registrar", label: "Registrar Pedidos" },
    { id: "status", label: "Consultar Status" },
    { id: "emitir", label: "Emitir Comanda / NF" },
    { id: "relatorios", label: "Relatórios e Gráficos" },
    { id: "entrega", label: "Consultar Entregas" },
  ];

  

 

  const renderContent = () => {
  switch (selectedTab) {

    case "registrar":
      return <RegistrarPedido />;


    case "status":
      return <ConsultarStatus />;

    case "emitir":
      return <EmitirPedido />;

    case "relatorios":
      return <Relatorios />;

    case "entrega":
      return (
        <section className="text-block">
          <h2 className="section-title">Consultar Entregas</h2>
          <p className="section-text">
            Consulte o status de pedidos realizados via delivery, atualizado em tempo real.
          </p>
        </section>
      );

    default:
      return null;
  }
};


  return (
    <div className="layout">

      {/* MENU LATERAL */}
      <aside className="sidebar">
        <h2 className="sidebar-title">Nome Franquia</h2>

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
