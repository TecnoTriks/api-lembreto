# API Lembreto

API RESTful para gerenciamento de lembretes com suporte a notificações via WhatsApp.

## 🚀 Requisitos

- Node.js >= 14.x
- MySQL >= 8.0
- NPM ou Yarn
- Conta na API de WhatsApp (evolution.basechurchbr.com)

## 📦 Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd api-lembreto
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:
```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=lembreto

# JWT
JWT_SECRET=seu_jwt_secret_seguro

# WhatsApp
WHATSAPP_API_URL=https://evolution.basechurchbr.com/message/sendText/zatyphone
WHATSAPP_API_KEY=sua_chave_api
```

5. Execute as migrações do banco de dados:
```bash
npm run migrate
```

6. Inicie o servidor:
```bash
npm start
```

## 🔧 Configuração para Produção

1. Atualize as variáveis de ambiente para produção:
```env
NODE_ENV=production
PORT=80 # ou sua porta preferida

# Use um banco de dados dedicado para produção
DB_HOST=seu_host_producao
DB_USER=usuario_producao
DB_PASSWORD=senha_producao
DB_NAME=lembreto_prod

# Use um JWT_SECRET forte e único
JWT_SECRET=chave_muito_segura_e_longa

# Credenciais da API de WhatsApp
WHATSAPP_API_KEY=sua_chave_producao
```

2. Recomendações de Segurança:
   - Use HTTPS em produção
   - Configure um proxy reverso (Nginx/Apache)
   - Ative o firewall
   - Mantenha as dependências atualizadas
   - Faça backup regular do banco de dados

3. Exemplo de configuração Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Use um gerenciador de processos (PM2):
```bash
# Instalar PM2
npm install -g pm2

# Iniciar a aplicação
pm2 start src/server.js --name api-lembreto

# Configurar para iniciar com o sistema
pm2 startup
pm2 save
```

## 📝 Endpoints da API

### Autenticação
- `POST /api/usuarios/registro` - Registro de usuário
- `POST /api/usuarios/login` - Login (retorna JWT e API Key)

### Lembretes
- `GET /api/lembretes` - Lista lembretes
- `POST /api/lembretes` - Cria lembrete
- `PUT /api/lembretes/:id` - Atualiza lembrete
- `DELETE /api/lembretes/:id` - Remove lembrete

### Tags
- `GET /api/tags` - Lista tags
- `POST /api/tags` - Cria tag
- `PUT /api/tags/:id` - Atualiza tag
- `DELETE /api/tags/:id` - Remove tag

### Notificações
- `GET /api/notificacoes` - Lista notificações
- `POST /api/notificacoes` - Cria notificação
- `PUT /api/notificacoes/:id` - Atualiza notificação
- `DELETE /api/notificacoes/:id` - Remove notificação

## 🔒 Autenticação

A API suporta dois métodos de autenticação:
1. JWT Token (para aplicações web/mobile)
2. API Key (para integrações externas)

Inclua o token no header:
```
Authorization: Bearer <jwt_token_ou_api_key>
```

## 📱 Exemplo de Uso

```bash
# Login
curl -X POST http://seu-dominio.com/api/usuarios/login \
-H "Content-Type: application/json" \
-d '{"email":"seu@email.com","senha":"sua_senha"}'

# Criar lembrete (com JWT)
curl -X POST http://seu-dominio.com/api/lembretes \
-H "Authorization: Bearer seu_jwt_token" \
-H "Content-Type: application/json" \
-d '{
  "titulo": "Reunião importante",
  "descricao": "Discussão do projeto",
  "data_hora": "2024-12-20T15:00:00",
  "tipo": "Trabalho"
}'
```

## 🤝 Contribuindo

1. Faça o fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
