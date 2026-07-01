# 🗂️ Mesa de Control — ¿Quién trabaja en qué archivo?

Cuando varias personas tocan el mismo repositorio a la vez, es fácil que dos
editen **el mismo archivo** sin saberlo y al unir las ramas se arme un **conflicto**
molesto. La **Mesa de Control** existe para evitar eso: es un tablero en vivo donde
cada quien **avisa qué archivo va a tocar** antes de empezar, y todos ven al instante
en qué está trabajando el resto.

En pocas palabras: **un semáforo compartido para que el equipo no se pise** al
coordinar las ramas **main · isa · paola**.

---

## ¿Para qué sirve?

- **Saber quién está tocando qué**, en tiempo real, sin preguntar por WhatsApp.
- **Prevenir conflictos** antes de que ocurran: si dos personas van por el mismo
  archivo, el sitio lo advierte al momento.
- **Ver el estado real del merge** en GitHub sin abrir la terminal.
- **Ponerse de acuerdo** con reglas claras de quién edita primero.

---

## Qué puedes hacer en el sitio

### Marcar un archivo
Eliges tu rama y el archivo que vas a tocar, y lo "marcas". Desde ese momento
aparece en el tablero con tu nombre y avatar de GitHub, para que nadie más lo toque
a ciegas. Al terminar, lo **liberas** con un clic.

### Ver el tablero en vivo
Lista de todos los archivos que el equipo está trabajando ahora mismo:
- ✅ **verde** = solo una persona lo tiene, todo tranquilo.
- 🚨 **rojo** = dos o más personas (o dos ramas) van por el mismo archivo → riesgo de
  choque. Lo que marca uno, los demás lo ven al instante.

Puedes filtrar por texto, por rama, o ver solo los tuyos.

### Alertas de choque *(intención)*
Si alguien marca un archivo que tú ya tienes —o el mismo archivo en otra rama—
salta una **alerta roja** que explica qué hacer para que el merge no se dañe.
Además recibes un **aviso en pantalla y una notificación del navegador**, aunque
estés en otra pestaña.

### Conflictos reales *(realidad)*
La Mesa también **compara las ramas directamente en GitHub** y te dice qué archivos
**van a chocar de verdad** al unir, los haya marcado alguien o no. Si detecta uno que
nadie reservó, con el botón **🔒 Marcarlo yo** lo reservas al instante.

> La diferencia: las *Alertas* salen de lo que el equipo **dijo** que iba a tocar;
> los *Conflictos reales* salen de lo que **git ya ve** cambiado en varias ramas.

### Pull Requests abiertos
Muestra los PRs abiertos del repositorio con su estado de fusión — **✅ se puede unir**,
**⚠️ con conflictos**, **borrador** — y enlaces directos a GitHub. Así ves el momento
real del merge sin salir de la Mesa.

### "Avísame cuando se libere" 🔔
¿Necesitas un archivo que otra persona tiene marcado? Pulsa **🔔 Avísame** y, en cuanto
quede libre, recibes un aviso en la app y una notificación del navegador. Sin tener
que estar revisando.

### Quién está en línea
Una barra muestra los **avatares de quienes tienen la Mesa abierta** en este momento.

### Historial
Una bitácora de los últimos movimientos: quién marcó o liberó qué archivo y cuándo.

### Guía de merge
Un recordatorio siempre a la vista de los pasos para unir las ramas sin romper nada
(orden sugerido: `main → isa → paola`, hacer `git pull` antes de empezar, etc.).

---

## Cómo se usa (el día a día)

1. **Entra con tu cuenta de GitHub** (tu nombre y avatar reales, sin escribir nada).
2. **Marca** la rama y el archivo que vas a tocar → **🔒 Marcar archivo**.
3. Trabaja tranquilo mirando el tablero: si aparece una alerta roja, **ponte de
   acuerdo** con la otra persona sobre quién edita primero.
4. Al terminar y hacer push, pulsa **Liberar** en tu tarjeta.

Eso es todo. La idea es que en 5 segundos avises al equipo y evites horas de arreglar
conflictos.

---

## Cosas que conviene saber

- **Solo el equipo.** El acceso puede limitarse a una lista de correos, para que solo
  entren las personas autorizadas.
- **Admins.** Si alguien marca un archivo y olvida liberarlo, un administrador puede
  liberarlo por él y limpiar de golpe los archivos "olvidados".
- **Modo oscuro** de fábrica.

---

*La versión original con Supabase quedó en `legacy-supabase/` solo como referencia; ya
no se usa.*
