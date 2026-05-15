import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./seccion_3.module.css";
import { icon } from "../../../../core/icons";

import {
  buscarProductosPorNombre,
  getImagenProducto,
  listarProductos,
  type Producto,
} from "../../../../core/services/producto.service";

type Props = {
  categoriasSeleccionadas: string[];
  marcasSeleccionadas: string[];
  busquedaGeneral: string;
  onEliminarCategoria: (categoria: string) => void;
  onEliminarMarca: (marca: string) => void;
  productosVisibles: number;
  onCargarMas: () => void;
};

type CartItem = {
  id: number;
  titulo: string;
  categoria: string;
  imagen: string;
  cantidad: number;
};

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;

export default function Seccion_3({
  categoriasSeleccionadas,
  marcasSeleccionadas,
  busquedaGeneral,
  onEliminarCategoria,
  onEliminarMarca,
  productosVisibles,
  onCargarMas,
}: Props) {
  const STORAGE_KEY = "cartItems";
  const whatsappNumber = "51915144663";

  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // ─── Productos base (sin búsqueda de texto) ───────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // ─── Resultados de búsqueda por texto ────────────────────────────────────
  const [productosBusqueda, setProductosBusqueda] = useState<Producto[]>([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true);
        const data = await listarProductos();
        setProductos(data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setCargandoProductos(false);
      }
    };
    cargarProductos();
  }, []);

  // ─── Búsqueda real contra BD con debounce ────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!busquedaGeneral.trim()) {
      setProductosBusqueda([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setCargandoBusqueda(true);
        const resultados = await buscarProductosPorNombre(busquedaGeneral.trim());
        setProductosBusqueda(resultados);
      } catch (error) {
        console.error("Error en búsqueda:", error);
        setProductosBusqueda([]);
      } finally {
        setCargandoBusqueda(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busquedaGeneral]);

  // ─── Lista base: si hay búsqueda de texto usa resultados de BD, si no usa todos ──
  const productosFiltrados = useMemo(() => {
    const base = busquedaGeneral.trim() ? productosBusqueda : productos;

    // Aplicar filtros de categoría y marca encima
    return base.filter((producto) => {
      const categoria = normalizarNombre(producto.categoria?.ctgraimgnombre, "Sin categoria");
      const marca = normalizarNombre(producto.marca?.marcaimgnombre, "Sin marca");

      const coincideCategoria =
        categoriasSeleccionadas.length === 0 ||
        categoriasSeleccionadas.includes(categoria);

      const coincideMarca =
        marcasSeleccionadas.length === 0 ||
        marcasSeleccionadas.includes(marca);

      return coincideCategoria && coincideMarca;
    });
  }, [productos, productosBusqueda, busquedaGeneral, categoriasSeleccionadas, marcasSeleccionadas]);

  const productosRenderizados = useMemo(
    () => productosFiltrados.slice(0, productosVisibles),
    [productosFiltrados, productosVisibles]
  );

  const cargando = cargandoProductos || cargandoBusqueda;

  // ─── Modal y carrito ──────────────────────────────────────────────────────
  const abrirModalCompra = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarModalCompra(true);
  };

  const cerrarModalCompra = () => {
    setMostrarModalCompra(false);
    setProductoSeleccionado(null);
  };

  const anadirAlCarrito = () => {
    if (!productoSeleccionado) return;

    const titulo = normalizarNombre(productoSeleccionado.prdcimgnombre, `Producto ${productoSeleccionado.prdcid}`);
    const categoria = normalizarNombre(productoSeleccionado.categoria?.ctgraimgnombre, "Sin categoria");
    const imagen = productoSeleccionado.prdcimgnombrebucket
      ? getImagenProducto(productoSeleccionado.prdcimgnombrebucket)
      : "";

    const actual = localStorage.getItem(STORAGE_KEY);
    const cartItems: CartItem[] = actual ? JSON.parse(actual) : [];
    const existente = cartItems.find((item) => item.id === productoSeleccionado.prdcid);

    const nextItems = existente
      ? cartItems.map((item) =>
          item.id === productoSeleccionado.prdcid
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      : [
          ...cartItems,
          { id: productoSeleccionado.prdcid, titulo, categoria, imagen, cantidad: 1 },
        ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("cartUpdated"));
    cerrarModalCompra();
  };

  const comprarPorWhatsapp = () => {
    if (!productoSeleccionado) return;

    const titulo = normalizarNombre(productoSeleccionado.prdcimgnombre, `Producto ${productoSeleccionado.prdcid}`);
    const marca = normalizarNombre(productoSeleccionado.marca?.marcaimgnombrebucket, "Sin marca");
    const categoria = normalizarNombre(productoSeleccionado.categoria?.ctgraimgnombre, "Sin categoria");

    const mensaje = [
      "Hola, quiero comprar este producto:",
      titulo,
      `Marca: ${marca}`,
      `Categoria: ${categoria}`,
    ].join("\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <section className={styles.contenido}>
        <div className={styles.resumen}>
          <div className={styles.resumenCabecera}>
            <div>
              <p className={styles.resumenTitulo}>Filtros activos</p>
              <p className={styles.resumenTexto}>
                Ajusta categorias y marcas para encontrar mas rapido.
              </p>
            </div>
          </div>

          <div className={styles.resumenGrid}>
            <div className={styles.resumenBloque}>
              <p className={styles.etiqueta}>Marca</p>
              <div className={styles.tagsFila}>
                {marcasSeleccionadas.length > 0 ? (
                  marcasSeleccionadas.map((marca) => (
                    <button
                      key={marca}
                      type="button"
                      className={styles.tagBoton}
                      onClick={() => onEliminarMarca(marca)}
                    >
                      <span className={styles.tagTexto}>{marca}</span>
                      <span className={styles.tagCerrar}>x</span>
                    </button>
                  ))
                ) : (
                  <span className={styles.tag}>Todas</span>
                )}
              </div>
            </div>

            <div className={styles.resumenBloque}>
              <p className={styles.etiqueta}>Categorias</p>
              <div className={styles.tagsFila}>
                {categoriasSeleccionadas.length > 0 ? (
                  categoriasSeleccionadas.map((categoria) => (
                    <button
                      key={categoria}
                      type="button"
                      className={styles.tagBoton}
                      onClick={() => onEliminarCategoria(categoria)}
                    >
                      <span className={styles.tagTexto}>{categoria}</span>
                      <span className={styles.tagCerrar}>x</span>
                    </button>
                  ))
                ) : (
                  <span className={styles.tag}>Todas</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cuerpo}>
          <div className={styles.productosArea}>
            {cargando ? (
              <div className={styles.vacio}>
                {cargandoBusqueda ? "Buscando productos..." : "Cargando productos..."}
              </div>
            ) : productosFiltrados.length > 0 ? (
              <div className={styles.gridProductos}>
                {productosRenderizados.map((producto) => {
                  const titulo = normalizarNombre(producto.prdcimgnombre, `Producto ${producto.prdcid}`);
                  const categoria = normalizarNombre(producto.categoria?.ctgraimgnombre, "Sin categoria");
                  const marca = normalizarNombre(producto.marca?.marcaimgnombre, "Sin marca");
                  const imagen = producto.prdcimgnombrebucket
                    ? getImagenProducto(producto.prdcimgnombrebucket)
                    : "";

                  return (
                    <article key={producto.prdcid} className={styles.productoCard}>
                      <div className={styles.productoImagenWrap}>
                        {imagen ? (
                          <img
                            src={imagen}
                            alt={titulo}
                            className={styles.productoImagen}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.productoPlaceholder}>Sin imagen</div>
                        )}
                      </div>

                      <h3 className={styles.productoTitulo}>{titulo}</h3>
                      <p className={styles.productoCategoria}>{categoria}</p>
                      <p className={styles.productoMarca}>{marca}</p>

                      <button
                        type="button"
                        className={styles.loQuieroButton}
                        onClick={() => abrirModalCompra(producto)}
                      >
                        <p>{icon.iconCarrito({ className: styles.modalSvg })}</p>
                        Lo quiero
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.vacio}>
                {busquedaGeneral.trim()
                  ? `No se encontraron productos para "${busquedaGeneral}".`
                  : "No hay productos para la seleccion actual."}
              </div>
            )}

            {productosFiltrados.length > productosRenderizados.length && (
              <div className={styles.acciones}>
                <button type="button" className={styles.cargarMas} onClick={onCargarMas}>
                  Ver mas productos
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {mostrarModalCompra && productoSeleccionado && (
        <div className={styles.modalOverlay} onClick={cerrarModalCompra}>
          <div className={styles.modalCompra} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitulo}>Como deseas continuar?</h3>
            <p className={styles.modalTexto}>
              Elige una opcion para poder completar tu compra
            </p>

            <button type="button" className={styles.modalBotonNaranja} onClick={anadirAlCarrito}>
              <span className={styles.modalIcono}>
                {icon.iconCarrito({ className: styles.modalCarrito })}
              </span>
              <span>Añadir al carrito</span>
            </button>

            <button type="button" className={styles.modalBotonVerde} onClick={comprarPorWhatsapp}>
              <p>{icon.iconWhatsApp({ className: styles.modalWhatsapp })}</p>
              <span>Realizar la compra</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}