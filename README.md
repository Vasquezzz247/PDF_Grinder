# PDF Grinder

## Docker Quick Commands

```bash
# Build and run
docker-compose up --build

# Normal start
docker-compose up

# Stop containers
docker-compose down

# Run in background
docker-compose up -d

# Force rebuild
docker-compose build --no-cache

# Show logs
docker-compose logs -f

# Delete container
docker volume rm -f pdf-grinder-api_pgdata
