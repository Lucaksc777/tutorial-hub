const axios = require('axios');

const mockData = {
    titulo: "Tutorial de Teste",
    resumo_ia: "Este é um resumo gerado para testar a conexão do webhook.",
    link_iframe: "https://drive.google.com/file/d/12345/preview",
    drive_id: "test_" + Date.now(),
    tags: ["teste", "automação", "n8n"],
    duracao: "05:15"
};

axios.post('http://localhost:3000/api/webhook/video', mockData)
    .then(res => {
        console.log('✅ Sucesso!', res.data);
    })
    .catch(err => {
        console.error('❌ Erro no webhook:', err.response ? err.response.data : err.message);
    });
