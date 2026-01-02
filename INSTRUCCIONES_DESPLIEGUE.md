
# 🚀 Guía de Actualización en Vercel - ProfesorIA v3.0

Para subir esta nueva versión (con soporte de Rigor Académico y Visión Artificial) a tu servidor de Vercel, sigue estos pasos:

## 1. Descarga el Proyecto
Haz clic en el botón **"Download App"** (icono de descarga) aquí en el editor para obtener el archivo `.zip` con todo el código corregido.

## 2. Preparación
1. Descomprime el archivo `.zip` en una carpeta de tu computadora.
2. Asegúrate de que no haya una carpeta llamada `node_modules` o `dist` (si las hay, bórralas para que Vercel haga una instalación limpia).

## 3. Despliegue en Vercel (Panel Web)
1. Ve a tu [Vercel Dashboard](https://vercel.com/dashboard).
2. Selecciona tu proyecto existente (el que ya tenías de la versión anterior).
3. Ve a la pestaña **"Settings"** -> **"Environment Variables"**.
4. **IMPORTANTE:** Verifica que tengas la variable `API_KEY`. 
   - Si no está, agrégala.
   - Si ya está, asegúrate de que sea una llave válida de [Google AI Studio](https://aistudio.google.com/).
5. Ve a la pestaña **"Deployments"**.
6. En la parte superior verás un botón o área que dice **"Drag and drop a folder to deploy"**. 
7. Arrastra la carpeta donde descomprimiste el código. Vercel comenzará a compilar la nueva versión automáticamente.

## 4. Despliegue vía CLI (Si usas terminal)
Si tienes instalado Vercel CLI, simplemente abre la terminal en la carpeta y ejecuta:
```bash
vercel --prod
```

## 5. Verificación de Seguridad
Una vez desplegado, entra a tu URL y:
1. Haz una prueba cargando una foto de un temario.
2. Verifica que la IA detecte las unidades por separado (como configuramos en el Rigor Académico).
3. Si la página no carga la IA, revisa en Vercel que la `API_KEY` no tenga espacios en blanco al principio o al final.

---
**Nota Técnica:** Esta versión utiliza `gemini-3-flash-preview`, que es más rápido y preciso para leer tablas de contenido en fotos de temarios oficiales.
