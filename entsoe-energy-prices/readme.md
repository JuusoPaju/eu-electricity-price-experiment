# Docker commands
docker build -t energy-prices .
docker run --env-file .env --hostname localhost -p 3000:3000 energy-prices