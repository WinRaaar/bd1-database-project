import React, { useEffect, useState } from 'react';
import useEmitirPedido from '../hooks/useEmitir';

export default function EmitirPedido({ active }) {
  const { pedidoId, setPedidoId, pedidoEmitido, emitirPedido } = useEmitirPedido();

  const [downloading, setDownloading] = useState(false);

  // Executa automaticamente quando a aba é aberta e já havia um ID preenchido
  useEffect(() => {
    if (active && pedidoId) {
      emitirPedido(pedidoId);
    }
  }, [active]);

  // Se aba não está ativa → não renderiza nada
  if (!active) return null;

  // -------------------------------------------------------
  // DOWNLOAD DO PDF
  // -------------------------------------------------------
  const handleDownloadPdf = async () => {
    if (!pedidoId) return;

    setDownloading(true);

    try {
      const response = await fetch(`http://localhost:8000/gerar-nota/${pedidoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar o PDF. Verifique se o pedido existe.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      a.download = `nota_fiscal_pedido_${pedidoId}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro no download:", error);
      alert("Não foi possível baixar a nota fiscal.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="text-block">
      <h2 className="section-title">Emitir Comanda e Nota Fiscal</h2>

      <label className="form-label">ID do Pedido</label>
      <input
        type="number"
        className="form-input"
        value={pedidoId}
        onChange={e => setPedidoId(e.target.value)}
        placeholder="Ex: 1"
      />

      {/* Botão para consultar os dados na tela */}
      <button
        type="button"
        className="submit-button"
        onClick={() => emitirPedido(pedidoId)}
      >
        Consultar Pedido
      </button>

      {/* ------------------------------------------------------- */}
      {/* RESULTADO DO PEDIDO                                    */}
      {/* ------------------------------------------------------- */}
      {pedidoEmitido && (
        <div className="pedido-emitido" style={{ marginTop: '20px' }}>

          {/* Comanda */}
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>🧑‍🍳 Comanda (Cozinha)</h3>
            <p><strong>Pedido:</strong> {pedidoEmitido.comanda.id_pedido}</p>
            <p><strong>Cliente:</strong> {pedidoEmitido.comanda.cliente}</p>

            <ul>
              {pedidoEmitido.comanda.itens.map((item, i) => (
                <li key={i}>
                  {item.quantidade}x {item.nome}
                </li>
              ))}
            </ul>
          </div>

          {/* Nota Fiscal */}
          <div style={{ padding: '10px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <h3>🧾 Nota Fiscal</h3>
            <p><strong>Valor total:</strong> R$ {pedidoEmitido.nota_fiscal.valor_total}</p>
            <p><strong>Data:</strong> {pedidoEmitido.nota_fiscal.data_hora}</p>

            {/* Botão de download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="submit-button"
              style={{
                marginTop: '10px',
                backgroundColor: downloading ? '#ccc' : '#28a745'
              }}
            >
              {downloading ? 'Gerando PDF...' : 'Baixar PDF da Nota Fiscal'}
            </button>
          </div>

        </div>
      )}
    </section>
  );
}
