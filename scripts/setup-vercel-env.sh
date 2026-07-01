#!/bin/bash
# ══════════════════════════════════════════════════
# Script para configurar variáveis de ambiente no Vercel
# Execute: bash scripts/setup-vercel-env.sh
# Preencha os valores antes de rodar!
# ══════════════════════════════════════════════════

TEAM="roni-silva"
PROJECT="caro-connect-next"

echo "🚀 Configurando variáveis no Vercel..."

# Substitua os valores abaixo antes de rodar:
DATABASE_URL="postgresql://COLOQUE_AQUI"
ANTHROPIC_API_KEY="sk-ant-COLOQUE_AQUI"
META_PHONE_NUMBER_ID="COLOQUE_AQUI"
META_WHATSAPP_TOKEN="COLOQUE_AQUI"
META_VERIFY_TOKEN="caro-connect-2024"
META_INSTAGRAM_TOKEN="COLOQUE_AQUI"
META_INSTAGRAM_ID="COLOQUE_AQUI"

set_env() {
  echo "$2" | npx vercel env add "$1" production --scope "$TEAM" --project "$PROJECT" --yes 2>/dev/null \
    && echo "✅ $1" \
    || echo "⚠️  $1 — já existe ou erro (atualize manualmente no painel)"
}

set_env "DATABASE_URL"         "$DATABASE_URL"
set_env "ANTHROPIC_API_KEY"    "$ANTHROPIC_API_KEY"
set_env "META_PHONE_NUMBER_ID" "$META_PHONE_NUMBER_ID"
set_env "META_WHATSAPP_TOKEN"  "$META_WHATSAPP_TOKEN"
set_env "META_VERIFY_TOKEN"    "$META_VERIFY_TOKEN"
set_env "META_INSTAGRAM_TOKEN" "$META_INSTAGRAM_TOKEN"
set_env "META_INSTAGRAM_ID"    "$META_INSTAGRAM_ID"

echo ""
echo "✅ Pronto! Agora rode: vercel deploy --prod --scope $TEAM"
