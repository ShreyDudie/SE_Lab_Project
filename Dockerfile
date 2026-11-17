# ---- 1) build the React frontend ----
FROM node:22-alpine AS client
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- 2) Python runtime: Flask API + the built frontend ----
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 FLASK_DEBUG=0
WORKDIR /app
COPY requirements-deploy.txt ./
RUN pip install --no-cache-dir -r requirements-deploy.txt
COPY app.py models.py init_db.py seed_demo_data.py bootstrap_db.py wsgi.py ./
COPY --from=client /client/dist ./client/dist
RUN mkdir -p instance
EXPOSE 10000
# 1) bootstrap_db.py creates the tables and loads the demo data if the database is empty (runs once)
# 2) then gunicorn starts. $PORT is provided by the host (Render, Railway, Fly...); 10000 locally
CMD ["sh", "-c", "python bootstrap_db.py && exec gunicorn wsgi:app --bind 0.0.0.0:${PORT:-10000} --workers 2 --threads 4 --timeout 60"]
