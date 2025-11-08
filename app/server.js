// server.js
const express = require("express");
const client = require("prom-client"); 
const fs = require("fs").promises;
const path = require("path");

const collectDefaultMetrics = client.collectDefaultMetrics;

const app = express();

// Coleta as métricas padrões do Node.js (CPU, memória, etc.)
collectDefaultMetrics(); 

// Métrica existente: Contador de requisições gerais (no endpoint '/')
const counter = new client.Counter({
  name: 'meu_contador',
  help: 'Contador de requisições'
});

// 📌 NOVA Métrica: Contador de Cliques na Tela
const cliquesCounter = new client.Counter({
  name: 'cliques_tela_total',
  help: 'Total de cliques rastreados na tela.'
});


const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configura a pasta 'public' para arquivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname, "public")));
// Onde o index.html está
const VIEWS_PATH = path.join(__dirname, "views"); 

// --- Configuração das Rotas de Métricas e Páginas ---

// Rota principal (incrementa o contador geral)
app.get('/',(req,res)=>{
  counter.inc();
  res.sendFile(path.join(VIEWS_PATH, "index.html")); // Retorna a página inicial
});

// Endpoint para o Prometheus raspar as métricas
app.get('/metrics',async(req,res)=>{
  res.set('Content-type', client.register.contentType);
  res.end(await client.register.metrics());
});

// 📌 NOVO ENDPOINT: Rota para Registrar o Clique (chamado pelo frontend)
app.post('/registrar-clique', (req, res) => {
  cliquesCounter.inc(); // Incrementa a nova métrica
  res.json({ ok: true, message: 'Clique registrado' });
});

// --- Utilidades para ler/gravar db.json ---

async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    // Se arquivo não existir ou estiver vazio, retornar array vazio
    return [];
  }
}

async function writeDB(arr) {
  await fs.writeFile(DB_PATH, JSON.stringify(arr, null, 2), "utf8");
}

// Rota para salvar - aceita JSON (fetch) ou form-urlencoded
app.post("/salvar", async (req, res) => {
  const { nome, sobrenome, idade } = req.body;

  // Validação simples no backend também
  const errors = {};
  if (!nome || String(nome).trim() === "") errors.nome = "Nome é obrigatório";
  if (!sobrenome || String(sobrenome).trim() === "") errors.sobrenome = "Sobrenome é obrigatório";
  if (!idade || Number(idade) <= 0) errors.idade = "Idade deve ser maior que 0";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  const users = await readDB();
  const novo = {
    id: Date.now(), // id simples baseado em timestamp
    nome: String(nome).trim(),
    sobrenome: String(sobrenome).trim(),
    idade: Number(idade)
  };
  users.push(novo);
  await writeDB(users);

  res.json({ ok: true, user: novo });
});

// Página de listagem (HTML gerado dinamicamente)
app.get("/lista", async (req, res) => {
  const users = await readDB();
  let html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Lista de Usuários</title>
      <link rel="stylesheet" href="/style.css">
      <style>
        body{font-family: Arial, sans-serif; padding:20px}
        .card{border:1px solid #ddd;padding:12px;margin-bottom:10px;border-radius:6px}
        .btn-remover{display:inline-block;margin-top:8px;padding:6px 10px;border:none;border-radius:4px;background:#e74c3c;color:#fff;cursor:pointer}
        a.back{display:inline-block;margin-top:16px}
      </style>
    </head>
    <body>
      <h1>Usuários Cadastrados</h1>
      <a href="/" class="back">Voltar para formulário</a>
      <div style="margin-top:18px">
  `;

  if (users.length === 0) {
    html += `<p>Nenhum usuário cadastrado ainda.</p>`;
  } else {
    users.forEach(u => {
      html += `
        <div class="card">
          <div><strong>${u.nome} ${u.sobrenome}</strong></div>
          <div>Idade: ${u.idade}</div>
          <form method="POST" action="/remover" style="margin-top:8px">
            <input type="hidden" name="id" value="${u.id}">
            <button type="submit" class="btn-remover">Remover</button>
          </form>
        </div>
      `;
    });
  }

  html += `
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Remover usuário (via POST de formulário)
app.post("/remover", async (req, res) => {
  const id = req.body.id;
  if (!id) return res.status(400).send("ID ausente");

  const users = await readDB();
  const filtered = users.filter(u => String(u.id) !== String(id));
  await writeDB(filtered);
  // Redireciona de volta para /lista
  res.redirect("/lista");
});

// Start
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));