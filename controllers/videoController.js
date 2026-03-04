const { Video, Tag } = require('../models');

const fs = require('fs');
const path = require('path');

// O n8n vai bater nessa rota com title, resumo_ia, link_iframe, duracao, e um array de nomes de tags.
exports.webhookN8n = async (req, res) => {
    try {
        const { titulo, resumo_ia, link_iframe, tags, duracao } = req.body;

        // Formatar data
        const dateObj = new Date();
        const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        const safeIframeLink = link_iframe ? link_iframe.replace(/\/view.*$/, '/preview') : '';
        const duracaoStr = duracao ? duracao : '15:30';

        // Gerar o HTML das tags
        let tagsHtml = '';
        if (tags && Array.isArray(tags)) {
            tags.slice(0, 3).forEach(tag => {
                const tagName = tag.nome ? tag.nome : tag;
                let extraClass = '';
                if (['n8n', 'automação'].includes(tagName.toLowerCase())) extraClass = 'tag-n8n';
                if (['ia', 'openai', 'gpt-4'].includes(tagName.toLowerCase())) extraClass = 'tag-ia';
                tagsHtml += `<span class="tag-badge ${extraClass}">${tagName}</span>`;
            });
            if (tags.length > 3) {
                tagsHtml += `<span class="tag-badge more-tag">+${tags.length - 3}</span>`;
            }
        }

        // Montar o Card HTML
        // O id aleatório garante que o modal funcione unicamente (caso reintegremos JS para o modal)
        const videoId = 'vid_' + Math.random().toString(36).substr(2, 9);
        const cardHtml = `
            <div class="video-card">
                <div class="card-thumbnail" onclick="alert('Funcionalidade de modal requer JavaScript configurado para IDs fixos. Vídeo: ${safeIframeLink}')">
                    <div class="play-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                    <div class="duration-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${duracaoStr}
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${titulo}</h3>
                    <div class="tags-container">
                        ${tagsHtml}
                    </div>
                    <p class="card-summary">${resumo_ia || 'Nenhum resumo disponível.'}</p>
                    <div class="card-footer">
                        <span class="card-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            ${dateStr}
                        </span>
                        <a href="${safeIframeLink}" target="_blank" class="ver-mais-btn" style="text-decoration:none;">
                            Abrir
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </a>
                    </div>
                </div>
            </div>`;

        // Ler o index.html atual
        const indexPath = path.join(__dirname, '../public/index.html');
        let indexHtml = fs.readFileSync(indexPath, 'utf8');

        // Inserir ANTES do marcador
        const marker = '<!-- NOVOS_CARDS_AQUI -->';
        if (indexHtml.includes(marker)) {
            indexHtml = indexHtml.replace(marker, cardHtml + '\n                ' + marker);
            fs.writeFileSync(indexPath, indexHtml, 'utf8');
            console.log('✅ Novo card injetado no index.html!');
        } else {
            console.error('Marcador <!-- NOVOS_CARDS_AQUI --> não encontrado no index.html.');
            return res.status(500).json({ error: 'Marcador não encontrado no HTML.' });
        }

        res.status(200).json({ msg: 'HTML gerado e injetado com sucesso no arquivo estático!' });
    } catch (err) {
        fs.appendFileSync('server_errors.log', `${new Date().toISOString()} - Webhook HTML Error: ${err.message}\n`);
        console.error('Erro no Webhook HTML:', err);
        res.status(500).json({ error: err.message });
    }
};

// Rota protegida para listar vídeos com suas respectivas tags
exports.getVideos = async (req, res) => {
    try {
        const videos = await Video.findAll({
            include: [{
                model: Tag,
                attributes: ['id', 'nome'],
                through: { attributes: [] }
            }],
            order: [['data_publicacao', 'DESC']]
        });

        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
