const http = require('http');

const data = JSON.stringify({
    titulo: "Tutorial de Teste",
    resumo_ia: "Este é um resumo gerado para testar.",
    link_iframe: "https://drive.google.com/file/d/123/preview",
    drive_id: "test_" + Date.now(),
    tags: ["teste", "n8n"],
    duracao: "01:00"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhook/video',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let response = '';
    res.on('data', (chunk) => { response += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', response);

        // After success, check DB
        const { Video } = require('./models');
        Video.findAll().then(videos => {
            console.log('DB_COUNT:', videos.length);
            process.exit(0);
        });
    });
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
});

req.write(data);
req.end();
