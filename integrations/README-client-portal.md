# Champion | portal de recursos para ópticas

## Estado comprobado el 21/10/2026

- Página y formulario públicos: https://champion-innova.com/clientes/.
- Inicio de sesión por enlace de correo, sin cuenta Google. Una prueba real con championinnova@gmail.com completó formulario, correo HTML enviado desde Champion, enlace, validación contra la hoja y entrada a la biblioteca aprobada.
- La hoja Champion | Solicitudes de acceso de ópticas pertenece a championinnova@gmail.com. Solo hay dos activadores activos, ambos de Champion: syncSimple_ cada 15 minutos y onSimpleEdit_ al editar la hoja. Los activadores antiguos de Service Manager se eliminaron con autorización expresa.
- Apps Script está desplegado como Champion (versión 4), ejecuta doPost como propietario y acepta solicitudes anónimas. requestPortalLink comprueba el correo aprobado en la hoja, limita solicitudes por correo a una cada 90 segundos y envía el enlace. confirmPortalSession verifica el token Firebase y vuelve a consultar la hoja antes de escribir el estado en Firestore. El navegador utiliza POST sin lectura de respuesta y consulta su propio perfil en Firestore hasta que aparece.
- Firebase permite vínculo por correo y contraseña, pero las reglas de Firestore solo permiten leer el perfil propio con correo verificado; los usuarios no pueden crear ni aprobar perfiles. El acceso a la biblioteca se comprobó con el estado approved.
- Biblioteca: 128 modelos/color, 580 vistas de catálogo, 519 originales localizados, 128 ZIP por referencia, 29 videos recopilados y seis artes conceptuales deportivos/casuales. La exportación completa de Instagram sigue pendiente; estos 29 videos no equivalen a todas las publicaciones.
- La exportación oficial de Instagram está lista hasta el 25/10/2026 en tres partes de 1,40 GB, 2,67 GB y 2,33 GB. La parte 1 se descargó en Codex y pasó la comprobación ZIP: 702 entradas en media/posts (655 MP4, 40 JPG y 7 SRT), de las cuales 54 videos y 17 imágenes tienen contenido distinto. El navegador integrado bloqueó las partes 2 y 3 con ERR_BLOCKED_BY_CLIENT. Se solicitó otra exportación limitada a contenido multimedia del 21/04/2026 al 21/10/2026, en JSON; Meta la muestra como «Solicitados». El perfil público muestra 58 publicaciones y la más antigua está fechada el 6/05/2026, dentro de ese intervalo. Meta no ofrece un control de tamaño por archivo en la pantalla de exportación.

## Entrega de medios pendiente

La vista autenticada permite filtrar y seleccionar recursos. `privateMediaUrl` continúa vacío: los videos no se reproducen y los ZIP no se descargan aún desde producción. Los ZIP y originales preparados siguen en el espacio local/Drive privado. En la cuenta Champion de GoHighLevel Media Storage se cargaron `Champion Ópticas | Videos Instagram` (29 MP4, 71,39 MB; reproducción comprobada), `Champion Ópticas | Catálogo digital` (580 WebP, 14,55 MB) y `Champion Ópticas | Publicaciones Instagram` (54 MP4 y 17 JPG distintos extraídos de la primera parte oficial, 159,18 MB; reproducción comprobada). La interfaz de carga registró 680 archivos multimedia, suma de los tres lotes. En la carpeta de catálogo también se cargó `Champion_catalogo_digital_580_vistas.csv` con una fila por vista, modelo, SKU, color, material, medidas, descripción bilingüe, tamaño y URL de GHL. Los 580 nombres del CSV y del catálogo web coinciden uno a uno con los 580 archivos inventariados en GHL. La carpeta de publicaciones tiene `Champion_Instagram_parte1_71_archivos.csv` con URL y procedencia de cada archivo, y `Champion_Instagram_58_publicaciones.csv` con enlaces y textos visibles de las publicaciones; todavía no hay relación validada entre las filas de ambos CSV. `Champion Ópticas | Campañas` ya contenía seis piezas conceptuales antes de estas cargas.

El usuario eligió Media Storage normal de GoHighLevel como repositorio. Sus enlaces directos no están protegidos por la aprobación de la hoja, por lo que los originales de alta resolución y los ZIP privados no se cargan allí sin una decisión expresa que cambie ese requisito. La carpeta de videos contiene materiales ya publicados por Champion y la de catálogo contiene las mismas imágenes digitales que muestra el sitio público. El generador local `scripts/serve-client-portal.py` organiza la selección en Modelos, Fotos, Videos, Campañas e inventarios CSV/JSON; escucha solo en 127.0.0.1:8124. Media Storage por sí solo no valida cada descarga ni arma un ZIP dinámico de la selección.

El proyecto Google Cloud de Champion aún muestra «Sign up for the free trial to start using Cloud Storage» y no tiene buckets; el usuario expresó preferencia por GoHighLevel.

## Comprobaciones siguientes

1. Una llamada con correo no aprobado devolvió la misma respuesta genérica; la implementación retorna antes de generar vínculo o enviar correo. Sigue pendiente verificar con una segunda cuenta real que no se crea acceso.
2. Probar que cambiar un correo a DENEGADO en la hoja suspende una sesión ya abierta.
3. Resolver cómo servir descargas privadas y el ZIP único desde los medios almacenados en GoHighLevel; verificar cada acción con una cuenta aprobada y otra denegada.
4. Completar el inventario/exportación de Instagram y revisar las artes conceptuales antes de ofrecerlas como finales para imprenta.

IDs: Firebase champion-portal-opticas; hoja 16-NoL1aQEbZhZX6v34128yRtSe_-Lk4hqhIlpQ2lX7I; Apps Script 1ZAMwb8rsy_Ity8FCzoZhmVxRg7-7HLAEO9qd70vFSlO_-A6i1pJq_sSq.
