import React, { useEffect } from 'react';
import useIngredientes from '../hooks/useIngredientes';
import '../../styles/ingredientes.css';

export default function ConsultarIngredientes({ active }) {

  const { ingredientes, loading, fetchIngredientes } = useIngredientes();

  // Carrega somente quando a aba fica ativa
  useEffect(() => {
    if (active) {
      fetchIngredientes();
    }
  }, [active]);

  // Se não está ativa, não renderiza nada (mas também não desmonta o hook)
  if (!active) return null;

  return (
    <section className="text-block">
      <h2 className="section-title">Estoque de Ingredientes</h2>

      <button className="submit-button" onClick={fetchIngredientes}>
        Atualizar Estoque
      </button>

      {loading ? (
        <p>Carregando ingredientes...</p>
      ) : (
        <table className="ingredientes-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Quantidade em Estoque</th>
              <th>Unidade</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((ing) => (
              <tr key={ing.id_ingrediente}>
                <td>{ing.nome}</td>
                <td>{ing.quantidade_estoque}</td>
                <td>{ing.unidade_medida}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
