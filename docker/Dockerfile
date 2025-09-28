# Dockerfile para MariaDB 10.3.39
# Basado en la versión oficial de MariaDB
FROM mariadb:10.3.39

# Configurar variables de entorno por defecto
# Estas pueden ser sobrescritas por docker-compose.yml
ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_USER=animecream
ENV MYSQL_PASSWORD=animecream123

# Crear directorio para scripts de inicialización
RUN mkdir -p /docker-entrypoint-initdb.d

# Copiar scripts SQL de todos los módulos
COPY sql/ /docker-entrypoint-initdb.d/

# Configurar puerto
EXPOSE 3306

# Comando por defecto
CMD ["mysqld"]
