#!/bin/bash
# ══════════════════════════════════════════════════════════════
# CA.RO CONNECT — Setup Completo
# Execute no Terminal: cd caro-connect-next && bash setup-completo.sh
# ══════════════════════════════════════════════════════════════

set -e

TEAM="roni-silva"
PROJECT="caro-connect-next"

# ── CREDENCIAIS META (já configuradas) ────────────────────────
PHONE_NUMBER_ID="11942173633775334"
WA_TOKEN="EAAOaiPFMUvkBR0J5Dg7KhZCNjvyTWKhzY1FX4MlxgP9d5ONvYFM914RLBqwZBcdRgu5T6Rvm1XjVRjQjuXQ668LV2ThXAErTwSXTp1A2ZCDZBSKjByUxA4eiroOfip0s08hZCtMBzQ58fKMF1aUCIyF3YFZCCViGehENjKIcna2MVZCQbjeZBygtVkmURqTdfXA4w1HemlPM0e5bRLvUEhqBefJtofgZBVZCiUTVGJvnp5UJkMOi11K5vqeHUdRkBH2jHZAbzekoV42Ct32imJhGVKr3fWMVQZDZD"
VERIFY_TOKEN="caro-connect-2024"
APP_ID="1014337884672761"

# ── BANCO (já encontrado de sessão anterior) ───────────────────
DATABASE_URL="postgresql://neondb_owner:npg_fj3ke4yKZuYD@ep-billowing-meadow-ajpdbwiv-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

ANTHROPIC_API_KEY="SUA_ANTHROPIC_API_KEY_AQUI"

# ── WEBHOOK URL ───────────────────────────────────────────────
WEBHOOK_URL="https://camilarocha.carostudio.com.br/api/webhook"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   CA.RO CONNECT — Setup Automático   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. INSTALAR DEPENDÊNCIAS ──────────────────────────────────
echo "📦 Instalando dependências..."
npm install --silent

# ── 2. VARIÁVEIS DE AMBIENTE NO VERCEL ───────────────────────
echo ""
echo "🔑 Configurando variáveis de ambiente no Vercel..."

add_env() {
  local name=$1
  local value=$2
  echo "$value" | npx vercel env add "$name" production \
    --scope "$TEAM" --yes 2>/dev/null \
    && echo "  ✅ $name" \
    || echo "  ⚠️  $name (já existe — atualize no painel se necessário)"
}

add_env "META_PHONE_NUMBER_ID"  "$PHONE_NUMBER_ID"
add_env "META_WHATSAPP_TOKEN"   "$WA_TOKEN"
add_env "META_VERIFY_TOKEN"     "$VERIFY_TOKEN"
add_env "DATABASE_URL"          "$DATABASE_URL"
add_env "ANTHROPIC_API_KEY"     "$ANTHROPIC_API_KEY"

# ── 3. DEPLOY ─────────────────────────────────────────────────
echo ""
echo "🚀 Fazendo deploy no Vercel..."
npx vercel deploy --prod --scope "$TEAM" --yes

# ── 4. ADICIONAR DOMÍNIO ──────────────────────────────────────
echo ""
echo "🌐 Adicionando domínio..."
npx vercel domains add camilarocha.carostudio.com.br \
  --scope "$TEAM" --yes 2>/dev/null \
  || echo "  ℹ️  Domínio já configurado ou será validado em breve"

# ── 5. TESTAR WEBHOOK ─────────────────────────────────────────
echo ""
echo "🔗 Testando webhook..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$WEBHOOK_URL?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=TEST123")

if [ "$STATUS" = "200" ]; then
  echo "  ✅ Webhook ativo e respondendo!"
else
  echo "  ⚠️  Webhook ainda propagando DNS (aguarde 5 min e teste novamente)"
fi

# ── 6. CONFIGURAR WEBHOOK NA META ─────────────────────────────
echo ""
echo "📡 Configurando webhook na Meta..."
RESULT=$(curl -s -X POST \
  "https://graph.facebook.com/v19.0/$APP_ID/subscriptions" \
  -H "Content-Type: application/json" \
  -d "{
    \"object\": \"whatsapp_business_account\",
    \"callback_url\": \"$WEBHOOK_URL\",
    \"verify_token\": \"$VERIFY_TOKEN\",
    \"fields\": [\"messages\"],
    \"access_token\": \"$WA_TOKEN\"
  }")

if echo "$RESULT" | grep -q '"success":true'; then
  echo "  ✅ Webhook registrado na Meta!"
else
  echo "  ⚠️  Webhook Meta: $RESULT"
  echo "  → Configure manualmente em: developers.facebook.com/apps/$APP_ID/webhooks"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup concluído!                                  ║"
echo "║                                                       ║"
echo "║  Bio da Camila: camilarocha.carostudio.com.br        ║"
echo "║  Webhook:       .../api/webhook                      ║"
echo "║                                                       ║"
echo "║  Próximo passo: adicionar número real da Camila       ║"
echo "║  Etapa 2 no Meta Developers                           ║"
echo "╚══════════════════════════════════════════════════════╝"
