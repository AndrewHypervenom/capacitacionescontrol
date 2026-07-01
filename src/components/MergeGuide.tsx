export function MergeGuide() {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-bold text-lg flex items-center gap-2">
        🧭 ¿Qué hago para que el merge no se dañe?
      </h2>
      <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 mt-3">
        <li>
          <b>Antes de tocar un archivo</b>, márcalo aquí con tu rama. Así los demás saben
          que es tuyo.
        </li>
        <li>
          Si ves una <span className="text-rose-600 font-semibold">alerta roja</span>,
          significa que ese archivo lo trabajan en <b>2 ramas distintas</b> → habrá
          conflicto al unir. Hablen y decidan quién lo edita.
        </li>
        <li>
          Si solo <b>una persona</b> trabaja el archivo (aunque sea en otra rama), no hay
          problema: avisa cuando termines.
        </li>
        <li>
          Cuando termines y hagas push, pulsa <b>“Liberar”</b> en tu tarjeta para soltar el
          archivo.
        </li>
        <li>
          Orden de unión sugerido:{" "}
          <code className="bg-slate-100 px-1 rounded">main → isa → paola</code>. Hagan{" "}
          <code className="bg-slate-100 px-1 rounded">git pull origin main</code> en su rama{" "}
          <b>antes</b> de empezar, para reducir choques.
        </li>
      </ol>
    </section>
  );
}
