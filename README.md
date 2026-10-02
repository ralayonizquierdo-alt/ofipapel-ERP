# Ofipapel ERP

ERP de gestión mayorista/minorista de Ofipapel: Catálogo, Stock, Clientes,
Proveedores, Ventas, Compras, Facturación, Tienda web, Usuarios, TPV,
Contabilidad, Fiscalidad (Veri*Factu), Familias y tarifas, Informes avanzados,
Multi-almacén y Flota de vehículos.

React 19 + TypeScript + Vite + Tailwind CSS v4, con **Firebase (Firestore +
Authentication anónima)** como base de datos compartida en tiempo real: los
cambios que hace una persona aparecen para las demás sin recargar.

## Desarrollo local

```bash
npm ci
cp .env.example .env.local   # rellena los valores (ver más abajo)
npm run dev
```

## Variables de entorno

Ver `.env.example`. Se necesitan:
- `VITE_APP_PASSWORD` — contraseña compartida de la pantalla de acceso.
- `VITE_FIREBASE_*` — config del proyecto Firebase (Configuración del
  proyecto → General → tus apps → Web, en la consola de Firebase).

En producción (GitHub Actions) estas mismas variables van como **Secrets**
del repositorio (Settings → Secrets and variables → Actions), con los
mismos nombres.

## Despliegue

`npm run build` genera un build normal (varios ficheros) en `dist/`, pensado
para publicarse en GitHub Pages bajo `/ofipapel-erp/`. El workflow
`.github/workflows/deploy.yml` lo hace automáticamente en cada push a `main`.

`npm run build:static` genera en su lugar un único `index.html`
autocontenido (todo inlineado, sin red necesaria salvo para Firebase) útil
para abrir el archivo a mano con doble clic si hiciera falta.

## Base de datos compartida (Firestore)

Cada colección de `Database` (`src/types/index.ts`) es una colección de
Firestore con el mismo nombre; cada registro es un documento (su `id` como
ID de documento). `src/lib/DatabaseContext.tsx` suscribe las 18 colecciones
en tiempo real (`onSnapshot`) y expone la misma API que antes
(`useCollection`/`useDatabase`), así que las páginas no saben que el backend
cambió.

La primera vez que la base de datos está vacía, la app carga sola los datos
de ejemplo (`src/lib/seed.ts` vía `src/lib/firestoreSync.ts`).

### Reglas de seguridad

`firestore.rules` contiene las reglas a pegar en la consola de Firebase
(Firestore Database → Reglas): cualquier sesión autenticada (incluida la
anónima que abre la propia app) puede leer y escribir. **El filtro de acceso
real es la pantalla de contraseña compartida** (`VITE_APP_PASSWORD`), no
estas reglas — mismo modelo que el resto de apps del ecosistema Ofipapel:
sencillo, no es seguridad fuerte, pensado para un equipo pequeño y de
confianza.

## Estructura

Ver `src/pages/` para cada módulo y `src/data/menu.ts` para el menú y las
fases (Fase 1 / Fase 2 / Fase 3 / Opcional).
