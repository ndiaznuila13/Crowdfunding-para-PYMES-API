# Crowdfunding para PYMES - API

Esta es la API para la plataforma de Crowdfunding para PYMES construida con **NestJS**, **Prisma ORM** y **PostgreSQL**.

A continuación se detalla paso a paso cómo instalar y correr el proyecto en un entorno de desarrollo local (Windows, macOS o Linux).

## 📋 Requisitos Previos

Asegúrate de tener instalados en tu sistema:
- **Node.js** (versión 18 o superior recomendada)
- **npm** (usualmente viene instalado junto con Node.js)
- **PostgreSQL** (instalado y corriendo en tu máquina)

---

## 🚀 Guía Paso a Paso de Instalación

### Paso 1: Clonar / Abrir el proyecto
Abre una terminal y dirígete a la carpeta raíz del proyecto.
```bash
cd crowdfunding-para-pymes-api
```

### Paso 2: Instalar Dependencias
Instala todos los paquetes necesarios de Node.js mediante el comando:
```bash
npm install
```

### Paso 3: Crear la Base de Datos en PostgreSQL
Debes crear una base de datos vacía en PostgreSQL antes de poder ejecutar las migraciones de Prisma.
Puedes usar herramientas como **pgAdmin**, **DBeaver**, o la terminal (usando `psql` o el Shell de SQL en Windows).

**Desde la terminal psql:**
1. Ingresa a la interfaz de psql:
   ```bash
   psql -U postgres
   ```
   *(Te pedirá la contraseña de tu usuario postgres)*

2. Crea la base de datos:
   ```sql
   CREATE DATABASE crowdfunding_pymes;
   ```

3. Sal de la terminal:
   ```sql
   \q
   ```

### Paso 4: Configurar Variables de Entorno (`.env`)
En la raíz del proyecto, debes crear un archivo llamado `.env` (si no existe, renombra o copia el contenido de un archivo `.env.example`).

Agrega las siguientes variables, reemplazando la contraseña de `postgres` si es diferente (en este ejemplo la contraseña es `1234`):

```env
# Conexión a la base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:1234@localhost:5432/crowdfunding_pymes"

# Configuración de Autenticación (JWT)
JWT_SECRET="mi_super_secreto_para_el_entorno_de_desarrollo"
JWT_EXPIRES_IN="1d"

# Variables de Negocio
INVESTOR_INITIAL_BALANCE=1000
```

### Paso 5: Ejecutar Migraciones de Prisma
Para que la base de datos recién creada adopte la estructura (tablas y columnas) de nuestra aplicación, debes ejecutar las migraciones de Prisma:

```bash
npx prisma migrate dev --name init
```
*Si te pregunta algo, acepta.* Esto creará las tablas necesarias (`User`, `Project`, `Investment`, etc.) en tu base de datos de Postgres.

*(Opcional)* Si quieres ver el cliente gráfico de tu base de datos mediante el navegador, puedes ejecutar:
```bash
npx prisma studio
```

### Paso 6: Iniciar el Servidor de NestJS
Finalmente, levanta la aplicación en modo desarrollo para que detecte los cambios en tiempo real:

```bash
npm run start:dev
```
Si todo está bien configurado, deberías ver en la consola un mensaje indicando que la aplicación ha iniciado exitosamente y está escuchando en el puerto `3000`.

---

## 📖 Documentación de la API (Swagger)

La API cuenta con documentación autogenerada con Swagger. Una vez que el servidor esté corriendo, puedes ver y probar los endpoints interactivos desde tu navegador:

- **Ruta de Swagger:** [http://localhost:3000/api](http://localhost:3000/api)

---

## 🧪 Pruebas (Testing)

El proyecto cuenta con un conjunto de pruebas unitarias robusto configurado con Jest.

Para ejecutar las pruebas:
```bash
# Correr los tests una sola vez
npm run test

# Correr los tests y mostrar el reporte de cobertura (Coverage)
npm run test:cov
```
