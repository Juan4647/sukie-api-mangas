# 1. Usar a imagem oficial do Playwright da Microsoft
#    Esta imagem JÁ VEM com todas as dependências do sistema (como a libglib) instaladas.
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# 2. Definir o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copiar os arquivos de dependência do seu projeto
COPY package*.json ./

# 4. Instalar as dependências do seu projeto (npm install)
#    Note que NÃO precisamos mais de "npx playwright install", pois o navegador já vem na imagem.
RUN npm install

# 5. Copiar o resto do código da sua aplicação
COPY . .

# 6. Remover o script postinstall do package.json (se ainda estiver lá)
#    Este passo é opcional mas recomendado para limpeza. Você pode fazer isso localmente.
#    O Dockerfile ignora o script postinstall de qualquer forma.

# 7. Expor a porta que sua aplicação usa
#    O seu código já usa process.env.PORT, o que é perfeito.
EXPOSE 3000

# 8. Comando para iniciar sua aplicação
#    (Ajuste "server.js" para o nome do seu arquivo principal, se for diferente)
CMD ["node", "server.js"]