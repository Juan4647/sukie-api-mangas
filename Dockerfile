# 1. Escolha a imagem oficial do Playwright, que já vem com todas as dependências do sistema instaladas.
#    Use uma versão específica para garantir que seu build não quebre no futuro. Ex: v1.40.0-jammy
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# 2. Defina o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copie os arquivos de definição de dependências
COPY package.json ./
COPY package-lock.json ./

# 4. Instale apenas as dependências do seu projeto (não precisa mais do Playwright, pois ele já vem na imagem)
RUN npm install

# 5. Copie o resto do código da sua aplicação
COPY . .

# 6. Exponha a porta em que sua API vai rodar
EXPOSE 3000

# 7. Defina o comando para iniciar a sua aplicação quando o container iniciar
#    (Substitua 'index.js' pelo nome do seu arquivo principal, se for diferente)
CMD ["node", "index.js"]
