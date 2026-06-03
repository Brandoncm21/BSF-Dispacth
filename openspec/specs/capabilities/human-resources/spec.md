# Capability: Human Resources

> Gestión de empleados: listado, cambio de roles y activación/desactivación. Solo administradores.

---

### Requirement: Listar empleados

Un administrador debe poder ver la lista de todos los empleados del sistema.

#### Scenario: Lista de empleados
GIVEN un usuario autenticado con rol "admin"
Y está en la página de human-resources
WHAND carga la página
THEN se muestra una tabla con todos los empleados
Y cada fila muestra: nombre, rol, tipo, estado y vendor
Y los resultados están paginados de 16 en 16

#### Scenario: Búsqueda de empleados
GIVEN un admin en la página de human-resources
WHAND ingresa un término de búsqueda
THEN el sistema filtra empleados cuyo nombre o email coincidan
Y actualiza la tabla con los resultados

---

### Requirement: Cambiar rol de un empleado

Un administrador debe poder asignar un rol diferente a un empleado.

#### Scenario: Cambio de rol exitoso
GIVEN un empleado existente con rol "dispatcher"
Y un usuario autenticado con rol "admin"
WHAND selecciona editar el empleado
Y cambia el rol a "logistics"
Y confirma el cambio
THEN el sistema actualiza el `role_id` del empleado
Y el empleado tendrá acceso a los módulos del nuevo rol en su próximo login

#### Scenario: Prevención de cambio por no-admin
GIVEN un usuario autenticado con rol "back_office"
WHAND intenta acceder a `/dashboard/human-resources`
THEN el middleware redirige a `/dashboard?denied=1`
Y no puede ver ni modificar empleados

---

### Requirement: Activar o desactivar un empleado

Un administrador debe poder habilitar o deshabilitar el acceso de un empleado.

#### Scenario: Desactivar empleado
GIVEN un empleado activo
Y un admin en la página de human-resources
WHAND selecciona desactivar el empleado
THEN el sistema cambia `status_id` a 2 (Inactivo)
Y el empleado ya no puede iniciar sesión

#### Scenario: Activar empleado
GIVEN un empleado inactivo
Y un admin en la página de human-resources
WHAND selecciona activar el empleado
THEN el sistema cambia `status_id` a 1 (Activo)
Y el empleado puede volver a iniciar sesión
