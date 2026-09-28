# Variables de Entorno - Tecno+

Este archivo documenta TODAS las variables de entorno necesarias.
NUNCA subas .env.local a GitHub. Ya esta protegido por .gitignore.

Copia estas variables en el panel de Vercel > Settings > Environment Variables
cuando vayas a produccion, y rellena con tus valores reales.

## Variables requeridas

### BOLD.CO
BOLD_API_KEY=<tu-llave-publica-bold>
BOLD_SECRET_KEY=<tu-llave-secreta-bold>
BOLD_ENVIRONMENT=production

### SUPABASE
NEXT_PUBLIC_SUPABASE_URL=<tu-url-de-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key-supabase>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key-supabase>

### ADMINISTRACION
ADMIN_PASSWORD=<tu-password-de-admin>

### SITIO
NEXT_PUBLIC_SITE_URL=https://TU-DOMINIO.com

## Notas de seguridad

- BOLD_SECRET_KEY: NUNCA con prefijo NEXT_PUBLIC_ - solo servidor
- SUPABASE_SERVICE_ROLE_KEY: NUNCA con prefijo NEXT_PUBLIC_ - solo servidor
- BOLD_API_KEY: Es publica por diseno de Bold (como Stripe publishable_key)
- La firma SHA-256 protege contra manipulacion de precios en Bold
- .env.local esta en .gitignore y NUNCA sube a GitHub
