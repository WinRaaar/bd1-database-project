from services.database.manager import DatabaseManager
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

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

# Inserir novo pedido
@app.route('/pedido', methods=['POST'])
def create_pedido():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON body is required"}), 400

    id_cliente = data.get("id_cliente")
    id_restaurante = data.get("id_restaurante")
    id_funcionario = data.get("id_funcionario")
    taxa_entrega = data.get("taxa_entrega", 0)
    tipo = data.get("tipo")
    status = data.get("status", "pendente")

    # Captura campos extras enviados pelo frontend
    n_mesa = data.get("n_mesa")
    cupom = data.get("cupom")

    # Nota: O frontend envia o ID da entrega no campo 'endereco_entrega' ou 'deliveryId'
    endereco_entrega = data.get("endereco_entrega")
    itens = data.get("itens", [])

    if not id_cliente or not id_restaurante or not tipo:
        return jsonify({"error": "Campos obrigatórios ausentes (cliente, restaurante, tipo)"}), 400

    # Validação simples para Delivery: precisa de endereço
    if tipo == 'delivery' and not endereco_entrega:
        return jsonify({"error": "Endereço de entrega é obrigatório para delivery"}), 400

    # Validação simples para Mesa: precisa do número da mesa
    if tipo == 'mesa' and not n_mesa:
        return jsonify({"error": "Número da mesa é obrigatório para pedidos na mesa"}), 400

    data_hora = datetime.now()
    valor_total = 0

    # Calcular valor total
    for item in itens:
        item_id = item.get("id_item")
        quantidade = item.get("quantidade", 1)
        # Busca o preço no banco (assume que id_item é valido)
        preco_data = db_manager.execute_select_one(
            f"SELECT preco FROM item_cardapio WHERE id_item = {item_id}"
        )
        if preco_data:
            valor_total += preco_data["preco"] * quantidade

    # Tratar valores nulos para SQL (n_mesa e funcionario podem ser vazios)
    sql_n_mesa = f"{n_mesa}" if n_mesa else "NULL"
    sql_id_funcionario = f"{id_funcionario}" if id_funcionario else "NULL"
    sql_endereco = f"'{endereco_entrega}'" if endereco_entrega else "NULL"

    # INSERÇÃO CORRIGIDA: Adicionado campo n_mesa
    insert_pedido = f"""
        INSERT INTO pedido (taxa_entrega, data_hora, tipo, valor_total, status,
                            endereco_entrega, n_mesa, id_funcionario, id_cliente, id_restaurante)
        VALUES ({taxa_entrega}, '{data_hora}', '{tipo}', {valor_total}, '{status}',
                {sql_endereco}, {sql_n_mesa}, {sql_id_funcionario}, {id_cliente}, {id_restaurante})
        RETURNING id_pedido;
    """

    try:
        pedido = db_manager.execute_select_one(insert_pedido)
        if not pedido:
             return jsonify({"error": "Erro ao inserir pedido no banco"}), 500
        id_pedido = pedido["id_pedido"]

        for item in itens:
            db_manager.execute_query(f"""
                INSERT INTO pedido_item (id_pedido, id_item, quantidade)
                VALUES ({id_pedido}, {item['id_item']}, {item.get('quantidade', 1)});
            """)

        return jsonify({
            "message": "Pedido criado com sucesso!",
            "pedido_id": id_pedido,
            "valor_total": valor_total
        }), 201
    except Exception as e:
        print(f"Erro no insert: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/pedidos', methods=['GET'])
def get_pedidos_restaurante():
    id_restaurante = request.args.get('id_restaurante', type=int)
    if id_restaurante is None:
        return jsonify({"error": "id_restaurante é obrigatório"}), 400

    query = f"""
        SELECT p.*, c.nome AS nome_cliente
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        WHERE p.id_restaurante = {id_restaurante};
    """
    pedidos = db_manager.execute_select_all(query)
    if pedidos is None:
        return jsonify({"error": "Nenhum pedido encontrado para este restaurante"}), 404
    return jsonify(pedidos)

# Rota para consultar status por MESA
@app.route('/pedido/status/mesa', methods=['GET'])
def status_pedido_mesa():
    n_mesa = request.args.get("n_mesa", type=int)
    if n_mesa is None:
        return jsonify({"error": "Número da mesa é obrigatório"}), 400

    query = f"""
        SELECT p.id_pedido, p.data_hora, p.status, p.valor_total
        FROM pedido p
        WHERE p.n_mesa = {n_mesa}
        ORDER BY p.data_hora DESC
        LIMIT 3;
    """
    pedidos = db_manager.execute_select_all(query)
    return jsonify(pedidos)

# NOVA ROTA: Consultar status por DELIVERY (ID da entrega/endereço)
@app.route('/pedido/status/delivery', methods=['GET'])
def status_pedido_delivery():
    id_entrega = request.args.get("id_entrega") # Frontend envia string
    if not id_entrega:
        return jsonify({"error": "ID da entrega (endereço) é obrigatório"}), 400

    # Assume-se que o frontend usa o 'deliveryId' como o endereço ou identificador gravado em 'endereco_entrega'
    query = f"""
        SELECT p.id_pedido, p.data_hora, p.status, p.valor_total
        FROM pedido p
        WHERE p.endereco_entrega = '{id_entrega}'
        ORDER BY p.data_hora DESC
        LIMIT 3;
    """
    pedidos = db_manager.execute_select_all(query)
    return jsonify(pedidos)

# Nota fiscal e comanda
@app.route('/pedido/emitir/<int:id_pedido>', methods=['GET'])
def emitir_pedido(id_pedido):
    # Buscar pedido
    pedido = db_manager.execute_select_one(f"""
        SELECT p.id_pedido, p.data_hora, p.tipo, p.status, p.valor_total, c.nome AS cliente
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        WHERE p.id_pedido = {id_pedido};
    """)

    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    # Buscar itens do pedido
    itens = db_manager.execute_select_all(f"""
        SELECT ic.nome, pi.quantidade, ic.preco
        FROM pedido_item pi
        JOIN item_cardapio ic ON pi.id_item = ic.id_item
        WHERE pi.id_pedido = {id_pedido};
    """)

    # Gerar comanda
    comanda = {
        "id_pedido": pedido["id_pedido"],
        "cliente": pedido["cliente"],
        "itens": itens,
        "tipo": pedido["tipo"]
    }

    # Gerar nota fiscal
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

    # Agrupa vendas por data (ignorando hora)
    query = f"""
        SELECT TO_CHAR(data_hora, 'DD/MM') as data,
               SUM(valor_total) as total_vendas,
               COUNT(id_pedido) as qtd_pedidos
        FROM pedido
        WHERE id_restaurante = {id_restaurante}
        GROUP BY TO_CHAR(data_hora, 'DD/MM'), DATE(data_hora)
        ORDER BY DATE(data_hora) ASC
        LIMIT 7; -- Últimos 7 dias com vendas
    """
    resultado = db_manager.execute_select_all(query)
    return jsonify(resultado)

# ROTA DE RELATÓRIOS: Itens mais populares (Gráfico de Pizza)
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
    resultado = db_manager.execute_select_all(query)
    return jsonify(resultado)

#rota cardapio

@app.route('/cardapio', methods=['GET'])
def get_cardapio():
    try:
        # Puxa todos os itens do cardápio
        query = "SELECT id_item, nome,preco FROM item_cardapio;"
        cardapio = db_manager.execute_select_all(query)
        return jsonify(cardapio)
    except Exception as e:
        return jsonify({"error": str(e)}), 500