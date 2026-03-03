const { Video, Tag } = require('../models');

// O n8n vai bater nessa rota com title, resumo_ia, link_iframe, drive_id, duracao, e um array de nomes de tags.
exports.webhookN8n = async (req, res) => {
    try {
        const { titulo, resumo_ia, link_iframe, drive_id, tags, duracao } = req.body;

        // 1. Opcionalmente converta o link de "view" para "preview" se o n8n já não tiver feito:
        const safeIframeLink = link_iframe ? link_iframe.replace(/\/view.*$/, '/preview') : '';

        // 2. Insere ou Atualiza o vídeo baseado no drive_id
        const [video, created] = await Video.upsert({
            drive_id,
            titulo,
            resumo_ia,
            link_iframe: safeIframeLink,
            duracao
        }, { returning: true });

        // 3. Processar Tags
        if (tags && Array.isArray(tags)) {
            const tagInstances = [];
            for (const tagName of tags) {
                const [tag] = await Tag.findOrCreate({
                    where: { nome: tagName.toLowerCase().trim() }
                });
                tagInstances.push(tag);
            }

            // Sincronizar as tags com o video
            await video.setTags(tagInstances);
        }

        res.status(200).json({ msg: 'Vídeo e tags processados com sucesso pelo webhook.', video });
    } catch (err) {
        const fs = require('fs');
        fs.appendFileSync('server_errors.log', `${new Date().toISOString()} - Webhook Error: ${err.message}\nBody received: ${JSON.stringify(req.body)}\n`);
        console.error('Erro no Webhook:', err);
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
