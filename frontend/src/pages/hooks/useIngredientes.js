import { useState } from 'react';

export default function useIngredientes() {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIngredientes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/ingredientes');
      const data = await response.json();
      if (response.ok) {
        setIngredientes(data); 
      } else {
        alert('Erro ao buscar ingredientes: ' + data.error);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  return { ingredientes, loading, fetchIngredientes };
}
