#!/bin/bash
# ══════════════════════════════════════════════════════════════
# CA.RO CONNECT — Fix Webhook + Migrar Banco
# Execute no Terminal: cd ~/... && bash fix-webhook.sh
# ══════════════════════════════════════════════════════════════

set -e

WA_TOKEN="EAAOaiPFMUvkBR0J5Dg7KhZCNjvyTWKhzY1FX4MlxgP9d5ONvYFM914RLBqwZBcdRgu5T6Rvm1XjVRjQjuXQ668LV2ThXAErTwSXTp1A2ZCDZBSKjByUxA4eiroOfip0s08hZCtMBzQ58fKMF1aUCIyF3YFZCCViGehENjKIcna2MVZCQbjeZBygtVkmURqTdfXA4w1HemlPM0e5bRLvUEhqBefJtofgZBVZCiUTVGJvnp5UJkMOi11K5vqeHUdRkBH2jHZAbzekoV42Ct32imJhGVKr3fWMVQZDZD"
WABA_ID="15938481423310923"
PHONE_NUMBER_ID="11942173633775334"
APP_ID="1014337884672761"
WEBHOOK_URL="https://camilarocha.carostudio.com.br/api/webhook"
VERIFY_TOKEN="caro-connect-2024"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   CA.RO CONNECT — Corrigindo Webhook + DB    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. INSCREVER WABA NO WEBHOOK DO APP ──────────────────────
echo "📡 Inscrevendo WABA no webhook..."
RESULT=$(curl -s -X POST \
  "https://graph.facebook.com/v20.0/${WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer ${WA_TOKEN}" \
  -H "Content-Type: application/json")

echo "   Resposta: $RESULT"
if echo "$RESULT" | grep -q '"success":true'; then
  echo "  ✅ WABA inscrita! Meta agora vai enviar mensagens para o webhook."
else
  echo "  ⚠️  Verificar resposta acima"
fi

echo ""

# ── 2. VERIFICAR CAMPOS DO WEBHOOK INSCRITOS ──────────────────
echo "🔍 Verificando webhook fields do app..."
FIELDS=$(curl -s \
  "https://graph.facebook.com/v20.0/${APP_ID}/subscriptions?access_token=${WA_TOKEN}")
echo "   $FIELDS"
echo ""

# ── 3. MIGRAR BANCO DE DADOS ──────────────────────────────────
echo "🗄️  Criando tabelas no Neon (migração)..."
node scripts/migrate.js
echo ""

# ── 4. SEED (configurar Camila) ───────────────────────────────
echo "🌱 Configurando Camila Rocha no banco..."
node scripts/seed.js
echo ""

# ── 5. TESTAR ENVIANDO MENSAGEM PARA SEU NÚMERO ───────────────
echo "📱 Enviando mensagem de teste para seu WhatsApp..."
echo "   (você receberá um 'Olá!' do número de teste)"

# Substitua +55XXXXXXXXXXX pelo seu número com código do país
MY_NUMBER="5511912142810"  # ← ALTERE PARA SEU NÚMERO PESSOAL

MSG=$(curl -s -X POST \
  "https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${WA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${MY_NUMBER}\",
    \"type\": \"text\",
    \"text\": { \"body\": \"Olá! Sou a assistente da Camila Rocha 🌸 Este é um teste do CA.RO Connect. Me responda qualquer coisa!\" }
  }")

echo "   Resposta envio: $MSG"
if echo "$MSG" | grep -q '"messages"'; then
  echo "  ✅ Mensagem enviada! Verifique seu WhatsApp e RESPONDA para testar a IA."
else
  echo "  ⚠️  Erro no envio — verifique o número acima"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ Fix completo!                                         ║"
echo "║                                                           ║"
echo "║  Próximo passo: RESPONDA a mensagem no WhatsApp          ║"
echo "║  A IA da Camila deve responder em segundos!              ║"
echo "╚══════════════════════════════════════════════════════════╝"
