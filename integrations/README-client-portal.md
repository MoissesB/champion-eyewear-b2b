# Champion | portal de recursos para ópticas

## Estado comprobado el 21/10/2026

- Página y formulario públicos: https://champion-innova.com/clientes/.
- Inicio de sesión por enlace de correo, sin cuenta Google. Una prueba real con championinnova@gmail.com completó formulario, correo HTML enviado desde Champion, enlace, validación contra la hoja y entrada a la biblioteca aprobada.
- La hoja Champion | Solicitudes de acceso de ópticas pertenece a championinnova@gmail.com. Solo hay dos activadores activos, ambos de Champion: syncSimple_ cada 15 minutos y onSimpleEdit_ al editar la hoja. Los activadores antiguos de Service Manager se eliminaron con autorización expresa.
- Apps Script está desplegado como Champion (versión 4), ejecuta doPost como propietario y acepta solicitudes anónimas. requestPortalLink comprueba el correo aprobado en la hoja, limita solicitudes por correo a una cada 90 segundos y envía el enlace. confirmPortalSession verifica el token Firebase y vuelve a consultar la hoja antes de escribir el estado en Firestore. El navegador utiliza POST sin lectura de respuesta y consulta su propio perfil en Firestore hasta que aparece.
- Firebase permite vínculo por correo y contraseña, pero las reglas de Firestore solo permiten leer el perfil propio con correo verificado; los usuarios no pueden crear ni aprobar perfiles. El acceso a la biblioteca se comprobó con el estado approved.
- Biblioteca: 128 modelos/color, 580 vistas de catálogo, 519 originales localizados, 128 ZIP por referencia, 29 videos recopilados y seis artes conceptuales deportivos/casuales. La exportación completa de Instagram sigue pendiente; estos 29 videos no equivalen a todas las publicaciones.
- La exportación oficial de Instagram está lista hasta el 25/10/2026 en tres partes de 1,40 GB, 2,67 GB y 2,33 GB. La descarga exige reingresar la contraseña en la pestaña de Meta; se pidió al propietario completar ese paso directamente.

## Entrega de medios pendiente

La vista autenticada permite filtrar y seleccionar recursos. privateMediaUrl continúa vacío: los videos no se reproducen y los ZIP no se descargan aún desde producción. Los ZIP y medios preparados están en el espacio local/Drive privado. No se publicaron enlaces directos de Drive ni URL públicas de GoHighLevel para originales, videos o ZIP.

Las cargas normales de HighLevel Media Storage tienen URL públicas. Su opción de archivo privado se crea mediante Digital Products y ofrece vínculos temporales de diez minutos, por lo que subir allí los archivos de forma normal incumpliría la decisión de mantenerlos privados. Se requiere un servicio que valide el token Firebase y la aprobación vigente al servir cada archivo y generar el ZIP único. El generador local scripts/serve-client-portal.py ya organiza la selección en Modelos, Fotos, Videos, Campañas e inventarios CSV/JSON; escucha solo en 127.0.0.1:8124.

El proyecto Google Cloud de Champion aún muestra «Sign up for the free trial to start using Cloud Storage» y no tiene buckets. Se consultó si el propietario autoriza usar Cloud Storage con facturación para la entrega privada o prefiere un servidor privado existente.

## Comprobaciones siguientes

1. Una llamada con correo no aprobado devolvió la misma respuesta genérica; la implementación retorna antes de generar vínculo o enviar correo. Sigue pendiente verificar con una segunda cuenta real que no se crea acceso.
2. Probar que cambiar un correo a DENEGADO en la hoja suspende una sesión ya abierta.
3. Elegir alojamiento privado de archivos y conectar reproducción, descargas y ZIP único; verificar cada acción con una cuenta aprobada y otra denegada.
4. Completar el inventario/exportación de Instagram y revisar las artes conceptuales antes de ofrecerlas como finales para imprenta.

IDs: Firebase champion-portal-opticas; hoja 16-NoL1aQEbZhZX6v34128yRtSe_-Lk4hqhIlpQ2lX7I; Apps Script 1ZAMwb8rsy_Ity8FCzoZhmVxRg7-7HLAEO9qd70vFSlO_-A6i1pJq_sSq.
