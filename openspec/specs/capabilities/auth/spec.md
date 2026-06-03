# Capability: Authentication & Authorization

> Autenticación de usuarios, control de acceso basado en roles y gestión de sesiones.

---

### Requirement: Login con email y password

Un usuario debe poder iniciar sesión con credenciales válidas para acceder al sistema.

#### Scenario: Login exitoso
GIVEN un usuario no autenticado en la página de login
WHEN ingresa un email y password válidos registrados en Supabase Auth
Y presiona el botón de iniciar sesión
THEN el sistema autentica al usuario
Y redirige a `/dashboard`
Y establece la sesión en cookies SSR

#### Scenario: Login con credenciales inválidas
GIVEN un usuario no autenticado en la página de login
WHEN ingresa un email o password incorrecto
Y presiona el botón de iniciar sesión
THEN el sistema muestra un mensaje de error indicando que las credenciales son inválidas
Y permanece en la página de login

#### Scenario: Login de usuario sin rol asignado
GIVEN un usuario autenticado en Supabase Auth
Y sin un registro correspondiente en la tabla `employees`
WHEN intenta acceder a cualquier ruta protegida
THEN el middleware redirige a `/login?error=No role assigned`

---

### Requirement: Cierre de sesión

Un usuario autenticado debe poder cerrar su sesión de forma segura.

#### Scenario: Logout exitoso
GIVEN un usuario autenticado en la aplicación
WHEN hace clic en "Cerrar Sesión" en el Sidebar
THEN el sistema invalida la sesión
Y redirige a `/login`
Y limpia las cookies de autenticación

---

### Requirement: Control de acceso por roles (RBAC)

El sistema debe restringir el acceso a módulos y funcionalidades según el rol del usuario.

#### Scenario: Acceso permitido según rol
GIVEN un usuario autenticado con rol "dispatcher"
WHEN navega a `/loads`
THEN el middleware permite el acceso porque el rol tiene permiso para el módulo "loads"

#### Scenario: Acceso denegado a módulo no autorizado
GIVEN un usuario autenticado con rol "dispatcher"
WHEN intenta acceder a `/dashboard/human-resources`
THEN el middleware redirige a `/dashboard?denied=1`
Y no muestra la página de recursos humanos

#### Scenario: Admin tiene acceso total
GIVEN un usuario autenticado con rol "admin"
WHEN navega a cualquier ruta protegida
THEN el sistema permite el acceso sin restricciones de módulo

---

### Requirement: Auto-provisionamiento de empleados

Cuando un nuevo usuario se registra en Supabase Auth, el sistema debe crear automáticamente un registro de empleado.

#### Scenario: Creación automática de empleado al registrar usuario
GIVEN un administrador crea un nuevo usuario en Supabase Auth
WHEN el usuario se registra exitosamente
THEN un trigger en la base de datos crea automáticamente un registro en `employees`
Y vincula `auth_user_id` con el UUID de Supabase Auth
Y asigna un rol por defecto

---

### Requirement: Sidebar dinámico por rol

La navegación lateral debe mostrar solo los módulos a los que el usuario tiene acceso.

#### Scenario: Renderizado de nav items según rol
GIVEN un usuario autenticado con rol "sales"
WHEN la aplicación renderiza el Sidebar
THEN solo se muestran los enlaces a: Dashboard, Brokers, Reports, Sales, Executive
Y no se muestran enlaces a Loads, Trucks, Drivers, Carriers, Traceability

---

### Requirement: Verificación de sesión en tiempo real

El sistema debe verificar la validez de la sesión y el rol en cada request protegido.

#### Scenario: Middleware verifica sesión en ruta protegida
GIVEN un usuario con sesión válida
WHEN accede a `/loads`
THEN el middleware verifica el JWT
Y consulta el rol desde la base de datos vía RPC `get_user_role_type()`
Y permite el acceso si el rol tiene permiso para el módulo

#### Scenario: Sesión expirada redirige a login
GIVEN un usuario con sesión expirada o inválida
WHEN intenta acceder a `/dashboard`
THEN el middleware redirige a `/login?redirect=/dashboard`
Y no renderiza la página protegida
