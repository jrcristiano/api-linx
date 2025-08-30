#!/usr/bin/env sh

host="$1"
port="$2"
shift 2

echo "⏳ Aguardando Postgres em $host:$port..."
until nc -z "$host" "$port"; do
  echo "Ainda aguardando..."
  sleep 2
done

echo "✅ Postgres disponível em $host:$port"

# Rodando migrations
echo "🚀 Executando migrations..."
npx prisma migrate dev

# Rodando seeds
echo "🌱 Executando seeds..."
npm run seed

# Iniciando a aplicação
echo "✅ Iniciando aplicação Nest.js..."
exec "$@"
