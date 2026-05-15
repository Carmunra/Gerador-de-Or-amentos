#Estágio 1: Builder (COnstrução)

FROM python:3.11-slim as builder
WORKDIR /build
COPY requirements.txt

#Instala as dependências nas pastas /root/.local
RUN pip install --user --no-cache-dir -r requirements.txt

#Estágio 2: Runner (execução)
FROM python:3.11-slim as runner
WORKDIR /app

#Copia as dependências instaladas do estágio anterior
COPY --from=builder /root/.local /root/.local
#Copia todo o conteúdo do seu projeto para dentro da imagem
COPY . .

#Adiciona o caminho dos pacotes instalados ao sistema
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

#Comando para rodar a aplicação chamado o main dentro da pasta app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
