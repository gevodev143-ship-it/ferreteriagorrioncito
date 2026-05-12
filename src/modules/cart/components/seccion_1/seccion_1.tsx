import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import style from "./seccion_1.module.css";

// ─── tipo compartido con Seccion_4 ───────────────────────────
export type CartItem = {
  id: string;
  titulo: string;
  categoria: string;
  imagen: string;
  cantidad: number;
};

const STORAGE_KEY = "cartItems";

const Seccion_1 = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  // 👇 set de ids seleccionados para el checkbox
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    try {
      const parsed = JSON.parse(data) as CartItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  const persistir = (nextItems: CartItem[]) => {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  };

  // ─── checkbox individual ──────────────────────────────────
  const toggleSeleccionado = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── checkbox "seleccionar todos" ────────────────────────
  const todosSeleccionados =
    items.length > 0 && seleccionados.size === items.length;

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(items.map((i) => i.id)));
    }
  };

  // ─── cantidad ────────────────────────────────────────────
  const cambiarCantidad = (id: string, delta: number) => {
    const nextItems = items.map((item) =>
      item.id === id
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
        : item
    );
    persistir(nextItems);
    window.dispatchEvent(new Event("cartUpdated"));

  };

  // ─── eliminar ────────────────────────────────────────────
  const eliminar = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    // también lo quitamos de seleccionados
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    persistir(nextItems);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // ─── conteo ──────────────────────────────────────────────
  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items]
  );

  const totalSeleccionados = useMemo(
    () =>
      items
        .filter((i) => seleccionados.has(i.id))
        .reduce((acc, item) => acc + item.cantidad, 0),
    [items, seleccionados]
  );

  // ─── carrito vacío ───────────────────────────────────────
  if (items.length === 0) {
    return (
      <section className={style.vacio}>
        <div className={style.vacioIcono}>
          <svg viewBox="0 0 80 80" aria-hidden="true" className={style.vacioSvg}>
            <rect x="16" y="28" width="48" height="28" rx="6" />
            <path d="M28 16h24v16H28z" />
            <circle cx="58" cy="18" r="9" />
            <path d="M56 18h4M60 18l-2 2M60 18l-2-2" />
          </svg>
        </div>
        <h2 className={style.vacioTitulo}>
          Volver a <span>Comprar</span>
        </h2>
        <p className={style.vacioTexto}>
          Tu carrito esta vacio. Explora nuevamente el catalogo y agrega los
          productos que necesitas.
        </p>
        <Link to="/product" className={style.vacioBoton}>
          Volver a comprar
        </Link>
      </section>
    );
  }

  return (
    <section className={style.seccion}>
      <div className={style.contenido}>
        <div className={style.listaArea}>
          <h2 className={style.titulo}>
            <span className={style.tituloIcono}>🛒</span>
            <span>Mi Carrito</span>
          </h2>

          {/* ─── selector global ─── */}
          <div className={style.selector} onClick={toggleTodos}>
            <span
              className={`${style.selectorCheck} ${
                todosSeleccionados ? style.selectorCheckActivo : ""
              }`}
            >
              {todosSeleccionados ? "✓" : ""}
            </span>
            <span>
              {todosSeleccionados ? "Deseleccionar todo" : "Seleccionar todo"}
            </span>
          </div>

          {/* ─── lista de items ─── */}
          <div className={style.lista}>
            {items.map((item) => {
              const estaSeleccionado = seleccionados.has(item.id);

              return (
                <article
                  key={item.id}
                  className={`${style.card} ${
                    estaSeleccionado ? style.cardSeleccionada : ""
                  }`}
                >
                  {/* checkbox individual */}
                  <div
                    className={`${style.cardCheck} ${
                      estaSeleccionado ? style.cardCheckActivo : ""
                    }`}
                    onClick={() => toggleSeleccionado(item.id)}
                    role="checkbox"
                    aria-checked={estaSeleccionado}
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === " " && toggleSeleccionado(item.id)
                    }
                  >
                    {estaSeleccionado ? "✓" : ""}
                  </div>

                  <div className={style.cardImagenWrap}>
                    <img
                      src={item.imagen}
                      alt={item.titulo}
                      className={style.cardImagen}
                    />
                  </div>

                  <div className={style.cardInfo}>
                    <h3 className={style.cardTitulo}>{item.titulo}</h3>
                    <p className={style.cardCategoria}>{item.categoria}</p>
                    <p className={style.cantidadLabel}>Cantidad</p>

                    <div className={style.cardAcciones}>
                      <div className={style.cantidadBox}>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, -1)}
                        >
                          -
                        </button>
                        <span>{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className={style.eliminarBtn}
                        onClick={() => eliminar(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* ─── resumen ─── */}
        <aside className={style.resumen}>
          <h3 className={style.resumenTitulo}>Resumen de la orden</h3>
          <p className={style.resumenTexto}>
            Costo de envio por coordinar via WhatsApp
          </p>

          <div className={style.resumenProductos}>
            Productos en carrito: <strong>{items.length}</strong>
          </div>

          <div className={style.totales}>
            <p>
              <span>Unidades totales:</span>
              <strong>{totalItems}</strong>
            </p>
            <p className={style.totalFinal}>
              <span>Seleccionados:</span>
              <strong>{totalSeleccionados} uds.</strong>
            </p>
          </div>

          <button
            type="button"
            className={style.botonVerde}
            disabled={seleccionados.size === 0}
          >
            Cotizar seleccionados ({seleccionados.size})
          </button>

          <button type="button" className={style.botonVerdeSecundario}>
            Cotizar todo ({items.length})
          </button>

          <Link to="/product" className={style.verMas}>
            Ver mas productos
          </Link>
        </aside>
      </div>
    </section>
  );
};

export default Seccion_1;