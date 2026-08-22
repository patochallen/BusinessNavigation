## Plan: Business Navigation MVP

**Estado actual — 2026-08-21**

El MVP público está implementado y validado con Vite, React, TypeScript, Three.js y un emulador Android conectado por `adb`. Se probaron home, detalle, navegación, permisos de cámara, stream de cámara, overlay AR aproximado y estados de ubicación. La red de caminos, waypoints, recalculo, progreso, instrucciones, heading, calibración y HTTPS local ya están implementados. La simulación GPS mediante `adb emu geo fix` no está disponible en la instancia actual; se agregó `VITE_DEMO_LOCATION=true` para reproducir una ruta demo durante desarrollo.

Construir una app React + Vite + TypeScript, mobile-first, para que una persona llegue desde un QR a un negocio o atraccion, explore categorias y puntos de interes, y consulte un mapa cenital 3D. La primera version usara datos locales tipados y una ruta visual directa entre la ubicacion del usuario y la atraccion; no intentara calcular caminos reales ni dependera de una API de mapas.

**Steps**

1. **Base del proyecto**
   - Inicializar Vite con React y TypeScript en `/Users/patricio.challen/React/BusinessNavigation`.
   - Configurar scripts de desarrollo, build, lint/typecheck, tests, HTTPS local y ubicación demo.
   - Incorporar React Router para rutas publicas por QR y `three` junto con `@react-three/fiber` y `@react-three/drei` para la escena interactiva. Mantener la UI y la escena separadas para que Three.js no gobierne el estado de negocio.
   - Definir tokens visuales y una composicion mobile-first orientada a uso en exteriores: contraste alto, controles grandes, estados de permiso/error visibles y carga rapida.

2. **Modelo de dominio y resolucion del QR**
   - Crear tipos para `Business`, `Attraction`, `Category`, `Coordinate`, `QrTarget` y, desde el inicio, una estructura que permita reemplazar el origen local por una API.
   - Guardar fixtures de al menos dos negocios y varias categorias/atracciones para comprobar el aislamiento por tenant.
   - Resolver URLs del tipo `/b/:businessId` y `/b/:businessId/a/:attractionId`; admitir que un QR apunte al inicio del negocio o directamente a una atraccion.
   - Validar identificadores inexistentes y mostrar una pantalla de no encontrado, sin filtrar datos de otro negocio.

3. **Exploracion publica**
   - Implementar layout responsive con header del negocio, descripcion, ubicacion y acceso al mapa.
   - Implementar listado/filtro de categorias y tarjetas compactas de atracciones con nombre, descripcion breve, distancia cuando exista posicion y accion para abrir detalle.
   - Implementar detalle de atraccion con categoria, coordenadas relativas, informacion relevante y acciones `Ver en mapa` y `Navegar`.
   - Mantener estados de carga, vacio y error aunque los datos iniciales sean locales, para no acoplar la UI al fixture.

4. **Mapa 3D cenital**
   - Crear una escena de Three.js con coordenadas geograficas transformadas a un sistema local de metros alrededor del negocio; no usar latitud/longitud directamente como unidades visuales.
   - Renderizar una superficie simple, marcadores por atraccion, resaltado del punto seleccionado y camara cenital con pan/zoom/orbit controlado.
   - Mostrar la informacion seleccionada en una capa HTML de la UI, no dentro de texto dibujado en WebGL, para mejorar accesibilidad y responsive.
   - Añadir leyenda o filtros solo si ayudan a encontrar puntos; evitar pretender que la geometria es un mapa cartografico real.

5. **Ubicacion y navegacion inicial**
   - Encapsular `navigator.geolocation.watchPosition` en un hook/servicio con estados `idle`, `requesting`, `ready`, `denied`, `unavailable` y `error`.
   - Calcular distancia en metros desde la posicion del usuario a cada atraccion con una funcion aislada y testeable; definir claramente el sistema de coordenadas usado por el fixture.
   - En modo navegacion mostrar posicion, destino, distancia actualizada y una linea directa hacia la atraccion. La linea debe estar etiquetada internamente como ruta visual directa, no como camino recomendado.
   - Implementar fallback si el usuario no concede ubicacion: permitir explorar el mapa y mostrar que la distancia/navegacion en tiempo real no esta disponible.

6. **Fase posterior preparada, fuera del MVP**
   - Diseñar la capa de navegacion para poder sustituir la linea directa por una red de waypoints/caminos definida por el negocio y un algoritmo de ruta.
   - Dejar una interfaz para heading con `DeviceOrientationEvent`, contemplando permisos explicitos en iOS, ausencia de sensores, calibracion y fallback a orientacion desconocida.
   - Tratar la camara de fondo/AR como fase separada: `getUserMedia` requiere HTTPS o localhost, permiso del usuario y controles claros de privacidad; no prometer una experiencia AR real hasta probarla en dispositivos fisicos.
   - Considerar PWA/offline, backend, panel de administracion, autenticacion, dominios por negocio y analitica despues de validar el recorrido publico.

**Relevant files**

- `/Users/patricio.challen/React/BusinessNavigation/package.json` — scripts y dependencias de la aplicacion.
- `/Users/patricio.challen/React/BusinessNavigation/src/main.tsx` — entrada de React y router.
- `/Users/patricio.challen/React/BusinessNavigation/src/app/` — layout, rutas publicas y composicion de pantallas.
- `/Users/patricio.challen/React/BusinessNavigation/src/domain/` — tipos, fixtures, resolucion de QR y funciones de distancia/coordenadas.
- `/Users/patricio.challen/React/BusinessNavigation/src/features/explorer/` — home del negocio, categorias, detalle de atraccion y estados de UI.
- `/Users/patricio.challen/React/BusinessNavigation/src/features/map/` — escena Three.js, marcadores, transformacion de coordenadas y controles de camara.
- `/Users/patricio.challen/React/BusinessNavigation/src/features/navigation/` — hook de geolocalizacion, modo navegacion y ruta directa.
- `/Users/patricio.challen/React/BusinessNavigation/src/styles/` — variables, responsive layout, accesibilidad y estados de permiso.
- `/Users/patricio.challen/React/BusinessNavigation/src/**/*.test.ts` — pruebas de resolucion de QR, aislamiento por negocio, distancia y estados principales.

**Verification**

1. Ejecutar `npm run build` y el typecheck/lint configurado; corregir errores antes de ampliar funcionalidades.
2. Probar manualmente `/b/<businessId>` y `/b/<businessId>/a/<attractionId>` con varios fixtures, incluyendo IDs invalidos y un ID de atraccion perteneciente a otro negocio.
3. Verificar en viewport mobile que el contenido no desborda, los botones tienen tamano tactil adecuado, el mapa conserva dimensiones estables y la UI HTML no se superpone con canvas ni controles.
4. Comprobar en desktop que la experiencia sigue siendo usable sin convertir el mapa en un panel decorativo dominante.
5. Usar DevTools para simular ubicacion: validar distancia, actualizacion de posicion, destino seleccionado y fallback de permiso denegado.
6. Ejecutar pruebas unitarias para la transformacion local de coordenadas, calculo de distancia, resolucion de QR y aislamiento multi-negocio.
7. Confirmar que la escena no queda en blanco, que los marcadores se renderizan y que pan/zoom/seleccion actualizan la UI.

**Decisions**

- Stack recomendado: Vite + React + TypeScript; se prioriza tipado porque el dominio multi-negocio y la futura migracion a API necesitan contratos claros.
- El QR se modela como un destino de URL con `businessId` y opcionalmente `attractionId`; no se implementa un lector QR dentro de la app en esta etapa.
- Datos iniciales locales tipados; no se agrega backend ni panel de administracion al MVP.
  - La navegación usa una red local de waypoints y segmentos en los fixtures; si no existe red, conserva el fallback visual.
- No se usa API de mapas; Three.js se limita a la visualizacion espacial y la UI conserva la informacion accesible fuera del canvas.
- Incluido: exploracion publica, mapa 3D cenital, multi-negocio por ruta, geolocalizacion opcional, red de caminos, distancia, progreso, heading y cámara AR aproximada.
- Excluido por ahora: datos de producción, offline/PWA, cuentas, CMS, pagos, analítica, dominios personalizados, posicionamiento AR preciso y pruebas GPS automatizadas con el emulador.

**Further Considerations**

1. Antes de implementar la fase 2, decidir si cada negocio cargara una red de caminos/waypoints o si se integrara un motor externo; recomendacion: waypoints propios primero para conservar el requisito de no usar APIs de mapas.
2. Las coordenadas de produccion necesitaran un sistema local y un origen/escala definidos por negocio; no conviene mezclar coordenadas GPS sin transformacion con posiciones artisticas del mapa.
3. Para probar heading y camara sera necesario validar iOS Safari y Android Chrome en dispositivos reales, no solo emulacion de escritorio.
4. El emulador Android validó cámara y UI, pero su ubicación entregada no correspondió al predio y `adb emu geo fix` devolvió comando desconocido; usar Android Studio Location Controls, GPX o un dispositivo real para validar recorrido.
5. El certificado `mkcert` funciona en la Mac; Chrome Android mostró advertencia de confianza, por lo que la CA debe instalarse en dispositivos de prueba o debe usarse un dominio HTTPS real.
