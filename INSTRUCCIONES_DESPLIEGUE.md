
# 🚀 Guía Maestra de Despliegue - ProfesorIA

¡Ya casi estás en línea! Basado en lo que ves en tu pantalla de Vercel, tienes dos caminos:

## Opción A: El camino Automático (GitHub)
En la pantalla que me mostraste, ya aparecen tus proyectos `profesor1` y `aulaVirtual`.
1. **Sincroniza:** Asegúrate de que tu código más reciente esté en GitHub (si el botón de "Sync" falla, usa el método ZIP de abajo).
2. **Importar:** Haz clic en el botón negro **[Import]** al lado de `profesor1`.
3. **Configurar llave:** En la siguiente pantalla, busca **Environment Variables**.
   - **Key:** `API_KEY`
   - **Value:** [Tu llave de Gemini]
   - Haz clic en **Add**.
4. **Deploy:** Haz clic en el botón azul. ¡Listo! Cada vez que subas algo a GitHub, la web se actualizará sola.

## Opción B: El camino Manual (Drag & Drop)
Si prefieres no pelear con GitHub:
1. **Descarga el ZIP:** Pulsa "Download App" aquí en el editor.
2. **Prepara la carpeta:** Descomprime el ZIP en una carpeta limpia.
3. **Sube a Vercel:** 
   - Ve a [vercel.com/new](https://vercel.com/new).
   - **BAJA CON EL RATÓN** hasta el final de la página.
   - Busca un recuadro que dice **"Other"** o un enlace que dice **"Upload a folder"**.
   - Arrastra tu carpeta ahí.
4. **Configura la llave:** Igual que en la Opción A, añade la `API_KEY` en las variables de entorno.
5. **Deploy:** Haz clic en el botón azul.

## ⚠️ NOTA IMPORTANTE SOBRE LA API KEY
Si al entrar a tu web ves que "no carga" o da error de IA:
1. Ve al panel de tu proyecto en Vercel.
2. Ve a **Settings** -> **Environment Variables**.
3. Asegúrate de que `API_KEY` esté escrita exactamente así (en mayúsculas) y con tu código de Google.

¡Ánimo, profesor! Estás a un clic de tener tu aula virtual funcionando. 🎓
