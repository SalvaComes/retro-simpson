# Retro Simpsons 🍩

Plataforma web para retrospectivas de equipo, tematizada con Los Simpson.
Serverless, sin necesidad de gestionar servidores: Next.js + Supabase + Vercel.

## Flujo

**Miembros** (acceden por link, sin cuenta):
1. Rompe hielo: proponen y votan capítulos favoritos (máx. 3 por persona).
2. Eligen su personaje Simpson favorito.
3. Check-in emocional: arrastran su personaje a un spectrum de 8 estados de ánimo (ilimitado).
4. Tabla retrospectiva estándar: qué salió bien / mal / qué mejorar (siempre anónimo).
5. Plan de acción: proponen acciones a realizar.

**Administrador** (panel separado con contraseña):
- Controla en tiempo real a qué paso avanza todo el equipo.
- Ve todas las respuestas, edita y elimina duplicados.
- Activa/desactiva el anonimato en el check-in y en el plan de acción.
- Selecciona qué acciones se ejecutan, asigna responsable y fecha límite.
- Exporta el plan de acción y el resumen de la retro a Excel.

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la expongas al cliente!)
4. Ve a **Storage** y crea un bucket público llamado `characters` si quieres servir
   las imágenes de los personajes desde Supabase (opcional, ver sección de imágenes).

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores de Supabase.

Para la contraseña del panel de admin, genera un hash con:

```bash
node scripts/hash-password.js "tu_contraseña_elegida"
```

Pega el resultado en `ADMIN_PASSWORD_HASH`. Genera también una cadena aleatoria
larga para `ADMIN_SESSION_SECRET` (por ejemplo con `openssl rand -hex 32`).

## 3. Instalar y ejecutar en local

```bash
npm install
npm run dev
```

- Panel de miembros: `http://localhost:3000/session/<sessionId>` (el link se
  genera al crear una sesión desde el panel de admin).
- Panel de admin: `http://localhost:3000/admin/login`

## 4. Desplegar en Vercel

1. Sube este repositorio a GitHub.
2. Importa el repositorio en [vercel.com](https://vercel.com).
3. Añade las mismas variables de entorno de `.env.local` en el apartado
   **Settings → Environment Variables** del proyecto en Vercel.
4. Despliega. Vercel detecta Next.js automáticamente.

## 5. Imágenes de los personajes (IMPORTANTE)

Por derechos de autor, este proyecto **no incluye imágenes de Los Simpson**.
El código usa emojis de marcador de posición (`src/lib/constants.ts`) para que
todo funcione desde el primer momento.

Para usar imágenes reales de la serie (para uso interno de equipo), debes
conseguirlas tú mismo y colocarlas en:

```
public/images/characters/{slug}/{zona-emocional}.png
```

Por ejemplo, para Homer en la zona 8 (Eufórico):
`public/images/characters/homer/8.png`

Los `slug` disponibles están en `src/lib/constants.ts` (CHARACTERS), y las
8 zonas emocionales (1-8) en `EMOTIONS` del mismo archivo. El componente
`src/components/CharacterIcon.tsx` ya sirve automáticamente la imagen de
cada personaje/zona en toda la app (check-in, selector de personaje, panel
de admin) — no hace falta tocar código. Si falta un archivo, muestra el
emoji de marcador de posición en su lugar, así que puedes ir subiendo las
imágenes poco a poco sin romper nada. Para el selector de personaje y para
identificar autores en la tabla retrospectiva se usa siempre la imagen de
la zona 4 (Neutral) como retrato del personaje.

## 6. Cómo crear una retrospectiva el día del evento

1. Entra a `/admin/login` con tu contraseña.
2. Crea una nueva sesión con un nombre (ej. "Sprint 42").
3. Copia el enlace de miembro y compártelo en el chat de Teams justo antes
   de empezar.
4. Usa los botones de "Control de la retrospectiva" en tu panel para avanzar
   de paso en tiempo real — todos los miembros se sincronizan automáticamente.
5. Al terminar, exporta el plan de acción a Excel y compártelo en Teams.

## Estructura del proyecto

```
src/
  app/
    session/[sessionId]/       Pantallas para los miembros del equipo
    admin/                     Login, dashboard y panel de control
    api/                       Endpoints backend (Next.js API Routes)
  components/                  Componentes compartidos (StepGuard)
  lib/                          Supabase clients, auth, constantes, hooks
  types/                        Tipos TypeScript compartidos
supabase/schema.sql             Esquema completo de base de datos
scripts/hash-password.js        Utilidad para generar el hash de admin
```
