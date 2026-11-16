# Backups e restauração

## Estado atual

Não há procedimento automatizado de backup, restauração ou teste de recuperação documentado no repositório.

## Escopo de dados

- PostgreSQL por marca no Supabase;
- bucket de imagens no Supabase Storage;
- Redis no Upstash;
- documentos POP em Postgres;
- tokens Google cifrados no banco.

## Prioridade

### Crítico

- usuários;
- clientes;
- profissionais;
- agendamentos;
- disponibilidade e exceções;
- procedures/categorias;
- POPs;
- marca e galeria.

### Recuperável

- códigos OTP;
- estados OAuth temporários;
- cache de usuário;
- sessões.

Perder Redis não perde dados de negócio, mas derruba sessões e fluxos temporários.

## Política recomendada

- backup diário do PostgreSQL;
- retenção mínima de 7 dias;
- backup semanal com retenção maior;
- armazenamento criptografado fora do provedor principal;
- backup do bucket de imagens;
- teste trimestral de restauração em ambiente separado.

## RPO/RTO sugeridos

- RPO desejado: até 24h;
- RTO desejado: até 4h para restauração básica.

São metas propostas, ainda não implementadas.

## Restauração

Procedimento futuro:

1. criar projeto/banco de teste;
2. restaurar dump;
3. validar contagens e integridade;
4. validar login de admin;
5. validar Storage;
6. validar Google Calendar;
7. só então promover.

## Limitações

- sem PITR documentado;
- sem automação de dump;
- sem backup de Storage;
- sem restore drill;
- sem runbook testado.
