# Runbook

## Verificações rápidas

### Backend

```bash
curl https://<backend>.vercel.app/health
```

### CORS

```bash
curl -i -X OPTIONS https://<backend>.vercel.app/auth/request-code \
  -H "Origin: https://<frontend>.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

### Frontend

Abrir a URL oficial e verificar carregamento da landing.

## Login não recebe código

1. confirmar qual backend o frontend está usando;
2. verificar `VITE_API_BASE_URL`;
3. confirmar que o telefone existe no banco correto;
4. verificar se o endpoint retornou `demo_code`;
5. verificar o modal no frontend.

## Código incorreto ou expirado

- código vale 5 minutos;
- reenvio após 90 segundos;
- confirmar se a instância não foi trocada;
- confirmar `SITE_ID` correto.

## Telefone não cadastrado

- confirmar banco da marca;
- conferir seed demo;
- conferir se o número foi digitado com 11 dígitos.

## Erro de CORS

1. conferir `CORS_ORIGINS` no backend;
2. confirmar domínio exato do frontend;
3. confirmar método HTTP;
4. lembrar que `PUT` não está liberado atualmente.

## Agenda sem horários

1. verificar work schedules do profissional;
2. verificar exceções;
3. verificar vínculo procedimento-profissional;
4. verificar duração do procedimento;
5. verificar se a data está no intervalo permitido.

## Google Calendar não sincroniza

1. verificar status da conexão;
2. confirmar admin conectado;
3. verificar logs do backend;
4. confirmar `GOOGLE_REDIRECT_URI`;
5. confirmar escopo e refresh token;
6. executar sincronização manual.

## Deploy falhou

1. abrir logs da Vercel;
2. verificar envs obrigatórias;
3. rodar build local;
4. verificar SHA;
5. promover deployment anterior se necessário.

## Banco indisponível

1. verificar Supabase;
2. verificar pooler e SSL;
3. verificar limites do plano;
4. avaliar restauração, se houver corrupção.

## Redis indisponível

1. verificar Upstash;
2. verificar `REDIS_URL` e REST;
3. lembrar que sessões/OTP podem ser perdidos;
4. rate limit pode cair para memória.

## Contatos de emergência

A definir com os mantenedores e orientadores.
