FROM node:18

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 3000

# Iniciar aplicação
CMD ["node", "server.js"]