# Projeto de Banco de Dados 1 - Restaurante

Este projeto consiste em uma aplicação web com Backend em Python (Flask) e Frontend em React (Vite), integrada a um banco de dados PostgreSQL.

## Pré-requisitos

* **Python** (3.x ou superior)
* **Node.js** e **npm**
* **PostgreSQL** instalado e rodando

---

## 1. Configuração do Banco de Dados

Antes de iniciar, certifique-se de que o PostgreSQL esteja rodando e crie um banco de dados para o projeto.

1.  Navegue até a pasta `Backend`.
2.  Edite (ou crie) o arquivo `.env` com as suas credenciais locais do PostgreSQL:

```env
DB_HOST=localhost
DB_NAME=nome_do_seu_banco
```
## 2. Rodando o Backend (API)
O Backend é construído com Python e Flask. Ele se comunica com o banco de dados PostgreSQL.

Abra um terminal na pasta raiz do projeto e siga os passos:

Acesse a pasta do servidor:
```
Bash

cd Backend
(Recomendado) Crie e ative o ambiente virtual para isolar as dependências.
```
Windows:
```
Bash

python -m venv venv
.\venv\Scripts\activate
```

Linux/Mac:
```
Bash

python3 -m venv venv
source venv/bin/activate
```
Instale as dependências listadas no requirements.txt:
```
Bash

pip install -r requirements.txt
```
Inicie o servidor Flask:
```
Bash

python main.py
A API estará rodando em http://localhost:5000 (ou a porta exibida no terminal).
```
## 3. Rodando o Frontend (Interface)

O Frontend é uma aplicação React configurada com Vite.

Abra um novo terminal (mantendo o Backend rodando) e siga os passos:

Acesse a pasta do frontend:
```
Bash

cd frontend
```
Instale as dependências do Node:
```
Bash

npm install
```
Inicie a aplicação de desenvolvimento:
```
Bash

npm run dev
```
O Frontend estará acessível no endereço que aparecer no terminal (ex: http://localhost:5173).

## Observação Importante:
Ambos, Backend e Frontend, devem estar rodando simultaneamente para que a aplicação funcione corretamente.
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_PORT=5432
