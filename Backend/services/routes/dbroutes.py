from services.database.manager import DatabaseManager
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from flask import send_file
from decimal import Decimal




# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__)
db_manager = DatabaseManager()
CORS(app, origins="*")

@app.route('/', methods=['GET'])
def home():
    return {"message": "API de Gerenciamento da Pizzaria"}

@app.route('/restaurante', methods=['GET'])
def get_restaurante():
    id_restaurante = request.args.get('id_restaurante', type=int)
    if id_restaurante is None:
        result = db_manager.execute_select_all("SELECT * FROM restaurante;")
        return jsonify(result)
    result = db_manager.execute_select_one(f"SELECT * FROM restaurante WHERE id_restaurante = {id_restaurante};")
    if result is None:
        return jsonify({"error": "Restaurante não encontrado"}), 404
    return jsonify(result)

# Inserir novo pedido - CORRIGIDO
@app.route('/pedido', methods=['POST'])
def create_pedido():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "JSON body is required"}), 400

        id_cliente = data.get("id_cliente")
        id_restaurante = data.get("id_restaurante")
        id_funcionario = data.get("id_funcionario")
        taxa_entrega = data.get("taxa_entrega", 0)
        tipo = data.get("tipo")
        status = data.get("status", "pendente")
        n_mesa = data.get("n_mesa")
        cupom = data.get("cupom")
        endereco_entrega = data.get("endereco_entrega")
        itens = data.get("itens", [])

        if not id_cliente or not id_restaurante or not tipo:
            return jsonify({"error": "Campos obrigatórios ausentes (cliente, restaurante, tipo)"}), 400

        # Validações de tipo
        if tipo == 'delivery' and not endereco_entrega:
            return jsonify({"error": "Endereço de entrega é obrigatório para delivery"}), 400

        if tipo == 'mesa' and not n_mesa:
            return jsonify({"error": "Número da mesa é obrigatório para pedidos na mesa"}), 400

        if not itens or len(itens) == 0:
            return jsonify({"error": "Pedido precisa ter pelo menos um item"}), 400

        # Limpar transações pendentes
        try:
            db_manager.execute_query("ROLLBACK;")
        except:
            pass

        data_hora = datetime.now()
        valor_total = 0

        # Calcular valor total
        for item in itens:
            item_id = item.get("id_item")
            quantidade = item.get("quantidade", 1)
            
            preco_data = db_manager.execute_select_one(
                f"SELECT preco FROM item_cardapio WHERE id_item = {item_id}"
            )
            if preco_data:
                valor_total += float(preco_data["preco"]) * quantidade
            else:
                return jsonify({"error": f"Item {item_id} não encontrado no cardápio"}), 400

        # Tratar valores nulos para SQL
        sql_num_mesa = f"{n_mesa}" if n_mesa else "NULL"
        sql_id_funcionario = f"{id_funcionario}" if id_funcionario else "NULL"
        sql_endereco = f"'{endereco_entrega}'" if endereco_entrega else "NULL"

        # Iniciar transação explícita
        db_manager.execute_query("BEGIN;")

        # Inserir pedido - CORRIGIDO: num_mesa ao invés de n_mesa
        insert_pedido = f"""
            INSERT INTO pedido (taxa_entrega, data_hora, tipo, valor_total, status,
                                endereco_entrega, num_mesa, id_funcionario, id_cliente, id_restaurante)
            VALUES ({taxa_entrega}, '{data_hora}', '{tipo}', {valor_total}, '{status}',
                    {sql_endereco}, {sql_num_mesa}, {sql_id_funcionario}, {id_cliente}, {id_restaurante})
            RETURNING id_pedido;
        """

        pedido = db_manager.execute_select_one(insert_pedido)
        if not pedido:
            db_manager.execute_query("ROLLBACK;")
            return jsonify({"error": "Erro ao inserir pedido no banco"}), 500
        
        id_pedido = pedido["id_pedido"]

        # Inserir itens do pedido
        for item in itens:
            db_manager.execute_query(f"""
                INSERT INTO pedido_item (id_pedido, id_item, quantidade)
                VALUES ({id_pedido}, {item['id_item']}, {item.get('quantidade', 1)});
            """)

        # Deduzir ingredientes do estoque
        deduzir_ingredientes_pedido(id_pedido)

        # Confirmar transação
        db_manager.execute_query("COMMIT;")

        return jsonify({
            "message": "Pedido criado com sucesso!",
            "pedido_id": id_pedido,
            "valor_total": float(valor_total)
        }), 201
        
    except Exception as e:
        print(f"Erro no insert: {e}")
        try:
            db_manager.execute_query("ROLLBACK;")
        except:
            pass
        return jsonify({"error": str(e)}), 500


# Função auxiliar para deduzir ingredientes
def deduzir_ingredientes_pedido(id_pedido):
    """
    Deduz os ingredientes do estoque baseado nos itens do pedido
    """
    # Buscar todos os itens do pedido
    itens_pedido = db_manager.execute_select_all(f"""
        SELECT pi.id_item, pi.quantidade
        FROM pedido_item pi
        WHERE pi.id_pedido = {id_pedido};
    """)

    if not itens_pedido:
        return

    for item in itens_pedido:
        id_item = item["id_item"]
        quantidade_pedido = item["quantidade"]

        # Buscar os ingredientes necessários para este item
        ingredientes = db_manager.execute_select_all(f"""
            SELECT id_ingrediente, quantidade_necessaria
            FROM item_ingrediente
            WHERE id_item = {id_item};
        """)

        if not ingredientes:
            continue

        # Deduzir cada ingrediente do estoque
        for ing in ingredientes:
            id_ingrediente = ing["id_ingrediente"]
            qtd_necessaria = float(ing["quantidade_necessaria"]) * quantidade_pedido

            # Atualizar estoque
            db_manager.execute_query(f"""
                UPDATE ingrediente
                SET quantidade_estoque = quantidade_estoque - {qtd_necessaria}
                WHERE id_ingrediente = {id_ingrediente};
            """)


# NOVO ENDPOINT: Deduzir ingredientes manualmente
@app.route('/pedido/<int:id_pedido>/deduzir-ingredientes', methods=['POST'])
def deduzir_ingredientes_endpoint(id_pedido):
    """
    Endpoint para deduzir ingredientes de um pedido específico
    """
    try:
        # Verificar se o pedido existe
        pedido = db_manager.execute_select_one(f"""
            SELECT id_pedido FROM pedido WHERE id_pedido = {id_pedido};
        """)

        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404

        deduzir_ingredientes_pedido(id_pedido)

        return jsonify({
            "message": "Ingredientes deduzidos com sucesso!",
            "pedido_id": id_pedido
        }), 200

    except Exception as e:
        print(f"Erro ao deduzir ingredientes: {e}")
        return jsonify({"error": str(e)}), 500


# NOVO ENDPOINT: Verificar estoque disponível
@app.route('/estoque/verificar', methods=['POST'])
def verificar_estoque():
    """
    Verifica se há estoque suficiente para um pedido antes de criá-lo
    """
    data = request.get_json()
    itens = data.get("itens", [])

    if not itens:
        return jsonify({"error": "Lista de itens é obrigatória"}), 400

    itens_insuficientes = []

    for item in itens:
        id_item = item.get("id_item")
        quantidade = item.get("quantidade", 1)

        # Buscar ingredientes necessários
        ingredientes = db_manager.execute_select_all(f"""
            SELECT i.nome, ii.quantidade_necessaria, i.quantidade_estoque
            FROM item_ingrediente ii
            JOIN ingrediente i ON ii.id_ingrediente = i.id_ingrediente
            WHERE ii.id_item = {id_item};
        """)

        for ing in ingredientes:
            qtd_necessaria = float(ing["quantidade_necessaria"]) * quantidade
            qtd_estoque = float(ing["quantidade_estoque"])

            if qtd_estoque < qtd_necessaria:
                itens_insuficientes.append({
                    "ingrediente": ing["nome"],
                    "necessario": qtd_necessaria,
                    "disponivel": qtd_estoque
                })

    if itens_insuficientes:
        return jsonify({
            "estoque_suficiente": False,
            "itens_insuficientes": itens_insuficientes
        }), 200
    
    return jsonify({"estoque_suficiente": True}), 200


@app.route('/pedidos', methods=['GET'])
def get_pedidos_restaurante():
    id_restaurante = request.args.get('id_restaurante', type=int)
    if id_restaurante is None:
        return jsonify({"error": "id_restaurante é obrigatório"}), 400

    query = f"""
        SELECT p.*, c.nome AS nome_cliente
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        WHERE p.id_restaurante = {id_restaurante}
        ORDER BY p.data_hora DESC;
    """
    pedidos = db_manager.execute_select_all(query)
    if pedidos is None:
        return jsonify({"error": "Nenhum pedido encontrado para este restaurante"}), 404
    return jsonify(pedidos)


@app.route('/pedido/status/<int:id_pedido>', methods=['GET'])
def status_pedido(id_pedido):
    """
    Retorna o status de um pedido específico pelo ID
    """
    try:
        pedido = db_manager.execute_select_one(f"""
            SELECT id_pedido, tipo, status, valor_total, data_hora
            FROM pedido
            WHERE id_pedido = {id_pedido};
        """)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404

        return jsonify(pedido)

    except Exception as e:
        print(f"Erro ao consultar status do pedido: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/pedido/emitir/<int:id_pedido>', methods=['GET'])
def emitir_pedido(id_pedido):
    pedido = db_manager.execute_select_one(f"""
        SELECT p.id_pedido, p.data_hora, p.tipo, p.status, p.valor_total, c.nome AS cliente
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        WHERE p.id_pedido = {id_pedido};
    """)

    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    itens = db_manager.execute_select_all(f"""
        SELECT ic.nome, pi.quantidade, ic.preco
        FROM pedido_item pi
        JOIN item_cardapio ic ON pi.id_item = ic.id_item
        WHERE pi.id_pedido = {id_pedido};
    """)

    comanda = {
        "id_pedido": pedido["id_pedido"],
        "cliente": pedido["cliente"],
        "itens": itens,
        "tipo": pedido["tipo"]
    }

    nota_fiscal = {
        "id_pedido": pedido["id_pedido"],
        "cliente": pedido["cliente"],
        "valor_total": pedido["valor_total"],
        "itens": itens,
        "data_hora": str(pedido["data_hora"])
    }

    return jsonify({
        "comanda": comanda,
        "nota_fiscal": nota_fiscal
    })


@app.route('/relatorio/vendas', methods=['GET'])
def relatorio_vendas():
    id_restaurante = request.args.get('id_restaurante', type=int)
    if id_restaurante is None:
        return jsonify({"error": "id_restaurante é obrigatório"}), 400

    # Query corrigida e otimizada
    query = f"""
        SELECT TO_CHAR(data_hora, 'DD/MM') as data,
               SUM(valor_total) as total_vendas,
               COUNT(id_pedido) as qtd_pedidos
        FROM pedido
        WHERE id_restaurante = {id_restaurante}
        GROUP BY TO_CHAR(data_hora, 'DD/MM'), DATE(data_hora)
        ORDER BY DATE(data_hora) ASC
        LIMIT 7;
    """
    try:
        resultado = db_manager.execute_select_all(query)
        
        # CORREÇÃO DE ERRO: Converter Decimal para float para o JSON funcionar
        dados_formatados = []
        for linha in resultado:
            nova_linha = dict(linha)
            if isinstance(nova_linha.get('total_vendas'), (Decimal, int, str)):
                 nova_linha['total_vendas'] = float(nova_linha['total_vendas']) if nova_linha['total_vendas'] else 0.0
            dados_formatados.append(nova_linha)
            
        return jsonify(dados_formatados)
    except Exception as e:
        print(f"Erro relatório vendas: {e}")
        return jsonify({"error": "Erro ao gerar relatório"}), 500


@app.route('/relatorio/itens-populares', methods=['GET'])
def relatorio_itens():
    id_restaurante = request.args.get('id_restaurante', type=int)
    if id_restaurante is None:
        return jsonify({"error": "id_restaurante é obrigatório"}), 400

    query = f"""
        SELECT ic.nome, SUM(pi.quantidade) as total_vendido
        FROM pedido_item pi
        JOIN item_cardapio ic ON pi.id_item = ic.id_item
        JOIN pedido p ON pi.id_pedido = p.id_pedido
        WHERE p.id_restaurante = {id_restaurante}
        GROUP BY ic.nome
        ORDER BY total_vendido DESC
        LIMIT 5;
    """
    try:
        resultado = db_manager.execute_select_all(query)
        
        # Conversão de segurança
        dados_formatados = []
        for linha in resultado:
            nova_linha = dict(linha)
            if nova_linha.get('total_vendido'):
                nova_linha['total_vendido'] = int(nova_linha['total_vendido'])
            dados_formatados.append(nova_linha)

        return jsonify(dados_formatados)
    except Exception as e:
        print(f"Erro itens populares: {e}")
        return jsonify({"error": str(e)}), 500

# --- ROTAS DE RELATÓRIO GERAL (ADMIN) ---

@app.route('/relatorio/geral/vendas-por-unidade', methods=['GET'])
def relatorio_geral_unidades():
    """
    Compara o número total de pedidos por restaurante
    """
    query = """
        SELECT r.nome, COUNT(p.id_pedido) as total_pedidos, SUM(p.valor_total) as total_faturamento
        FROM pedido p
        JOIN restaurante r ON p.id_restaurante = r.id_restaurante
        GROUP BY r.nome
        ORDER BY total_pedidos DESC;
    """
    try:
        resultado = db_manager.execute_select_all(query)
        
        # Converter Decimals
        dados_formatados = []
        for linha in resultado:
            nova_linha = dict(linha)
            if nova_linha.get('total_faturamento'):
                nova_linha['total_faturamento'] = float(nova_linha['total_faturamento'])
            dados_formatados.append(nova_linha)
            
        return jsonify(dados_formatados)
    except Exception as e:
        print(f"Erro relatorio geral unidades: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/relatorio/geral/itens-populares', methods=['GET'])
def relatorio_geral_itens():
    """
    Itens mais populares somando TODAS as unidades
    """
    query = """
        SELECT ic.nome, SUM(pi.quantidade) as total_vendido
        FROM pedido_item pi
        JOIN item_cardapio ic ON pi.id_item = ic.id_item
        GROUP BY ic.nome
        ORDER BY total_vendido DESC
        LIMIT 5;
    """
    try:
        resultado = db_manager.execute_select_all(query)
        
        # Conversão simples
        dados_formatados = []
        for linha in resultado:
            nova_linha = dict(linha)
            if nova_linha.get('total_vendido'):
                nova_linha['total_vendido'] = int(nova_linha['total_vendido'])
            dados_formatados.append(nova_linha)

        return jsonify(dados_formatados)
    except Exception as e:
        print(f"Erro relatorio geral itens: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/cardapio', methods=['GET'])
def get_cardapio():
    try:
        print("=== Iniciando busca de cardápio ===")
        
        # Garantir que não há transação pendente
        try:
            db_manager.execute_query("ROLLBACK;")
            print("ROLLBACK executado com sucesso")
        except Exception as e:
            print(f"Aviso ao fazer ROLLBACK: {e}")
        
        query = "SELECT id_item, nome, preco FROM item_cardapio;"
        print(f"Executando query: {query}")
        
        cardapio = db_manager.execute_select_all(query)
        print(f"Resultado da query: {cardapio}")
        print(f"Tipo do resultado: {type(cardapio)}")
        
        if cardapio is None:
            print("Cardápio é None, retornando array vazio")
            return jsonify([]), 200
        
        print(f"Retornando {len(cardapio)} itens")
        return jsonify(cardapio), 200
        
    except Exception as e:
        print(f"ERRO ao buscar cardápio: {e}")
        print(f"Tipo do erro: {type(e)}")
        import traceback
        traceback.print_exc()
        
        # Tentar rollback em caso de erro
        try:
            db_manager.execute_query("ROLLBACK;")
        except Exception as e2:
            print(f"Erro ao fazer ROLLBACK: {e2}")
            
        return jsonify({"error": str(e)}), 500
    
@app.route('/ingredientes', methods=['GET'])
def get_ingredientes():
    query = "SELECT id_ingrediente, nome, quantidade_estoque, unidade_medida FROM ingrediente;"
    ingredientes = db_manager.execute_select_all(query)
    return jsonify(ingredientes)

@app.route('/gerar-nota/<int:id_pedido>', methods=['GET'])
def gerar_nota_pdf(id_pedido):
    print(f"=== Iniciando PDF para Pedido: {id_pedido} ===") 
    
    try:
        try:
            db_manager.execute_query("ROLLBACK;")
        except Exception as e:
            print(f"Aviso de rollback: {e}")

        query_pedido = f"""
            SELECT p.id_pedido, p.data_hora, p.valor_total, c.nome AS cliente, 
                   p.taxa_entrega
            FROM pedido p
            JOIN cliente c ON p.id_cliente = c.id_cliente
            WHERE p.id_pedido = {id_pedido};
        """
        print(f"Executando query: {query_pedido}")
        
        pedido = db_manager.execute_select_one(query_pedido)

        if not pedido:
            print("ERRO: Query retornou vazio (None).")
            return jsonify({"error": "Pedido não encontrado"}), 404

        print(f"Pedido encontrado: {pedido['cliente']}")

        query_itens = f"""
            SELECT ic.nome, pi.quantidade, ic.preco
            FROM pedido_item pi
            JOIN item_cardapio ic ON pi.id_item = ic.id_item
            WHERE pi.id_pedido = {id_pedido};
        """
        itens = db_manager.execute_select_all(query_itens)

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, 800, "PIZZARIA DO SISTEMA")
        p.setFont("Helvetica", 10)
        p.drawString(50, 785, "CNPJ: 00.000.000/0001-00")
        
        p.line(50, 760, 550, 760)

        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, 740, f"NOTA FISCAL - PEDIDO #{pedido['id_pedido']}")
        p.setFont("Helvetica", 11)
        p.drawString(50, 720, f"Cliente: {pedido['cliente']}")
        p.drawString(350, 720, f"Data: {pedido['data_hora']}")

        p.line(50, 690, 550, 690)

        y = 670
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "ITEM")
        p.drawString(350, y, "QTD")
        p.drawString(480, y, "TOTAL")
        y -= 20

        p.setFont("Helvetica", 10)
        if itens: 
            for item in itens:
                nome = item['nome']
                qtd = item['quantidade'] if item['quantidade'] else 0
                preco = float(item['preco']) if item['preco'] else 0.0
                total_item = qtd * preco
                
                p.drawString(50, y, f"{nome}")
                p.drawString(350, y, f"{qtd}")
                p.drawString(480, y, f"R$ {total_item:.2f}")
                y -= 15
        
        y -= 20
        p.line(50, y, 550, y)
        y -= 20

        val_total = float(pedido['valor_total']) if pedido['valor_total'] else 0.0
        val_taxa = float(pedido['taxa_entrega']) if pedido['taxa_entrega'] else 0.0

        p.setFont("Helvetica-Bold", 12)
        p.drawString(350, y, f"Taxa Entrega: R$ {val_taxa:.2f}")
        y -= 20
        p.drawString(350, y, f"TOTAL: R$ {val_total:.2f}")

        p.showPage()
        p.save()
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"nota_fiscal_{id_pedido}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"ERRO CRÍTICO ao gerar PDF: {e}")
        import traceback
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)