# Integração n8n: Automação do Catálogo de Tutoriais

Este documento descreve os nós (nodes) necessários para a construção do fluxo no n8n. Este workflow monitora uma pasta específica no Google Drive, processa novos vídeos utilizando IA e os envia via Webhook para a API do Catálogo de Tutoriais.

## 1. Trigger: Google Drive (Folder Watch)
- **Node**: Google Drive Trigger
- **Configuração**: Use a opção `Watch for: File Created in Folder`. Especifique a ID da pasta "Tutoriais".
- **Objetivo**: Iniciar a automação sempre que um novo arquivo de vídeo for lançado na pasta.

## 2. Permission Node: Google Drive
- **Node**: Google Drive
- **Ação**: `Share` ou `Update Permission`.
- **Configuração**: 
  - File ID: `={{ $json.id }}` (ID vindo do trigger)
  - Role: `reader`
  - Type: `anyone`
- **Objetivo**: Garantir que o link gerado não pedirá login do Google quando embedado no iframe do dashboard.

## 3. Link Transformation (Code Node)
- **Node**: Code
- **Script**:
  ```javascript
  const fileId = $input.item.json.id;
  const originalName = $input.item.json.name;
  
  // Converte a URL para ter o final /preview que é necessário pro iframe não bloquear (X-Frame-Options)
  const iframeLink = `https://drive.google.com/file/d/${fileId}/preview`;
  
  return {
    titulo: originalName.replace(/\.[^/.]+$/, ""), // Remove a extensão
    drive_id: fileId,
    link_iframe: iframeLink
  };
  ```
- **Objetivo**: Extrair as variáveis essenciais e formatar o link corretamente contornando bloqueios de iFrame.

## 4. Processing: FFMPEG (Extração de Áudio)
- **Node**: Execute Command / Advanced Execute
- **Configuração**: Baixar o arquivo binário via N8n (Node Google Drive -> Download File) e rodar FFmpeg via Terminal CMD, ou usar um nó da comunidade FFMPEG.
  - Comando: `ffmpeg -i input_video.mp4 -vn -c:a mp3 audio.mp3`
- **Objetivo**: Extrair apenas o áudio do tutorial em `.mp3`. Arquivos em vídeo puro facilmente estouram o limite de 25MB da OpenAI. Transformando em áudio comprimido otimizamos o Whisper.

## 5. AI Node: OpenAI Whisper (Transcrição)
- **Node**: OpenAI (Audio)
- **Ação**: `Transcribe`
- **Configuração**: Passar a propriedade binária gerada na etapa anterior do FFmpeg (`audio.mp3`) para a inteligência artificial.
- **Saída**: O n8n terá o texto `/text` com a fala total do tutorial.

## 6. AI Node: OpenAI GPT-4 (Resumo e Tags)
- **Node**: OpenAI
- **Ação**: `Chat` -> `Generate Text`
- **Model**: `gpt-4` ou `gpt-4-turbo`
- **System Message**: "Você é um classificador automático de tutoriais. Com base na transcrição fornecida, gere um resumo formatado em no máximo 5 linhas legíveis e um array JSON com as tags/temas do assunto."
- **User Message**: `={{ $json.text }}` (Texto vindo do Whisper)
- **Format Output**: Configure ou utilize o Structured Output do n8n para forçar o retorno no formato exigido pelo nosso banco de dados:
  ```json
  {
    "resumo_ia": "...",
    "tags": ["tag1", "tag2", "tag3"]
  }
  ```

## 7. HTTP Request (Disparar Webhook para o Backend Node.js)
- **Node**: HTTP Request
- **Configuração**: 
  - **Method**: `POST`
  - **URL**: `http://SEU_DOMINIO_OU_IP:3000/webhook` (ou localhost na sua máquina, usando ngrok para testar n8n em nuvem)
  - **Body Format**: `JSON`
  - **Body / Parameters**:
      - `titulo`: `={{ $json.titulo }}` (do nó de conversão)
      - `drive_id`: `={{ $json.drive_id }}`
      - `link_iframe`: `={{ $json.link_iframe }}`
      - `resumo_ia`: `={{ $json.resumo_ia }}` (do GPT-4)
      - `tags`: `={{ $json.tags }}` (do GPT-4)
- **Objetivo**: Enviar o payload de volta para a nossa API em Express.js, que salvará no PostgreSQL usando Sequelize Upsert.
