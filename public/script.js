// public/script.js

// Função para enviar o evento de clique para o backend (para Prometheus)
function registrarClique(tipo) {
    // Envia um POST para o novo endpoint de métricas
    fetch('/registrar-clique', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // O corpo da requisição é opcional, mas pode ser útil para debug/labels
        body: JSON.stringify({ event: tipo })
    })
    .then(response => {
        // Ignora a resposta, já que é apenas para métricas
        if (!response.ok) {
            console.warn("Métrica de clique não registrada (Status:", response.status, ")");
        }
    })
    .catch(error => {
        console.error("Erro ao tentar registrar métrica de clique:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroForm');
    const btnSalvar = document.getElementById('btn-salvar');

    if (btnSalvar) {
        // Rastreia o clique no botão Salvar
        btnSalvar.addEventListener('click', () => {
             // 🎯 Chamada principal para registrar a métrica 🎯
            registrarClique('salvar_usuario');
        });
    }

    // Você pode adicionar um listener para um clique genérico no corpo
    // document.body.addEventListener('click', () => {
    //     registrarClique('body_click');
    // });
    
    // (Opcional) Implementação do fetch para o submit do formulário,
    // já que o `server.js` espera JSON ou urlencoded para /salvar
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/salvar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.ok) {
                    alert('Usuário salvo com sucesso!');
                    form.reset(); // Limpa o formulário
                } else {
                    alert('Erro ao salvar usuário: ' + JSON.stringify(result.errors));
                }
            } catch (error) {
                alert('Erro de conexão ao salvar usuário.');
                console.error(error);
            }
        });
    }

});