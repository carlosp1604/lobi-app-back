# Proxy Inverso Global con Autodescubrimiento (Caddy)

Es aconsejable no desplegar varios entornos en la misma máquina. Sin embargo, por diversas cuestiones, es posible que necesitemos hacerlo. Por ello, este repositorio está preparado para desplegar un Proxy Inverso Caddy para soportar diferentes entornos (`dev`, `prod`, etc.) ejecutándose en el mismo servidor

Este módulo gestiona de forma centralizada el tráfico HTTP/HTTPS del servidor y genera automáticamente los certificados SSL (Let's Encrypt) para el proyecto (o los entornos configurados).

Funciona mediante **autodescubrimiento**: Caddy escucha los eventos de Docker y, cuando levantas un entorno del proyecto, lee sus etiquetas (`labels`) y configura el dominio automáticamente sin interrumpir los demás servicios.

---

## 1. Infraestructura Global

Sigue estos pasos para preparar el servidor antes de desplegar cualquier entorno del proyecto. **Solo se hace una vez por servidor**

### Paso A: Crear la red global de Docker
Caddy necesita una red compartida externa para poder comunicarse internamente con los contenedores de las aplicaciones. Ejecuta este comando en la terminal de tu servidor:

```bash
docker network create caddy_gateway
```

### Paso B: Crear el archivo `docker-compose.yml` del Proxy
Crea una carpeta aislada en tu servidor (por ejemplo, en `/var/www/caddy-gateway/`), guarda el siguiente archivo con el nombre `docker-compose.yml`:

```yaml
services:
  caddy:
    image: lucaslorentz/caddy-docker-proxy:2.8-alpine
    ports:
      - "80:80"
      - "443:443"
    environment:
      - CADDY_INGRESS_NETWORKS=caddy_gateway
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - caddy_data:/data
    restart: unless-stopped
    networks:
      - caddy_gateway
    labels:
      caddy_short_open: "{"
      caddy.request_body: "max_size 1mb"
      caddy_short_close: "}"

      caddy.encode: "zstd gzip"
      caddy.header: |-
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server

networks:
  caddy_gateway:
    external: true

volumes:
  caddy_data:
```

### Paso C: Levantar el Proxy
Dentro de la carpeta donde guardaste el archivo anterior (`/var/www/caddy-gateway/`), enciende el servicio:

```bash
docker compose up -d
```

## 2. Requisitos del Proyecto
   Para que el Caddy global reconozca y exponga automáticamente las instancias del proyecto (`dev` o `prod`), el archivo `docker-compose.yml` que está en la raíz de tu repositorio debe cumplir estrictamente con estos 3 requisitos:

1. No incluir un servicio proxy local (el Caddy global ya hace ese trabajo).

2. Conectarse a la red externa `caddy_gateway`.

3. Definir las etiquetas (`labels`) para indicarle a Caddy su dominio y su puerto interno.

**IMPORTANTE:** El fichero `docker-compose.prod.yml` incluye una configuración compatible con Caddy

## 3. Despliegue e Infraestructura Multi-Entorno

Por defecto, Docker Compose utiliza el nombre de la carpeta raíz del repositorio para identificar y agrupar los recursos de un proyecto (redes, volúmenes, imágenes y contenedores).

⚠️ **IMPORTANTE:** Con el fin de evitar utilizar flags en los comandos de docker, tenemos que asegurarnos de configurar correctamente las variables de entorno `CONTAINER_NAME` y `COMPOSE_PROJECT_NAME`. En caso de no hacerlo, tendremos que trabajar como se indica a continuación:

* **Si solo se despliega un único entorno en la máquina:** El flujo estándar de Docker Compose funcionará sin problemas.
* **Si se despliegan varios entornos en la misma máquina (p. ej., `dev` y `prod` compartiendo el mismo Droplet):** Aunque los proyectos residan en carpetas distintas en el servidor (`lobi-api-dev` y `lobi-api-prod`), al compartir el mismo nombre de servicio (`api`) en el archivo `docker-compose.prod.yml`, Docker Compose sufrirá colisiones de nombres de contenedores, redes e imágenes. Esto provocará que el despliegue de un entorno **recree y tumbe por completo** al entorno vecino.

Para prevenir de forma absoluta estos conflictos y garantizar un aislamiento total a nivel de red, procesos e imágenes, **es imperativo forzar el identificador de proyecto utilizando el flag `-p` (o `--project-name`)** en cualquier comando de ciclo de vida (`up`, `down`, `logs`, etc.). Esto encapsula cada despliegue en un universo lógico totalmente estanco.

### Despliegue del entorno de Desarrollo `dev`
Ubicado en `/var/www/lobi-api-dev`:

```bash
docker compose --env-file .env -p lobi-dev -f docker/docker-compose.prod.yml up -d --build
```

### Despliegue del entorno de Desarrollo `prod`
Ubicado en `/var/www/lobi-api-prod`:

```bash
docker compose --env-file .env -p lobi-prod -f docker/docker-compose.prod.yml up -d --build
```
