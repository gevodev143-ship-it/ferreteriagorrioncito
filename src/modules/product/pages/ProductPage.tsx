import { startTransition, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";

import { listarProductos, type Producto } from "../../../core/services/producto.service";

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;

const INITIAL_VISIBLE = 40;

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([]);
  const [busquedaGeneral, setBusquedaGeneral] = useState("");
  const [productosVisibles, setProductosVisibles] = useState(INITIAL_VISIBLE);

  const queryUrl = searchParams.get("q")?.trim() ?? "";
  const categoriaDesdeUrl = searchParams.get("categoria")?.trim() ?? "";
  const marcaDesdeUrl = searchParams.get("marca")?.trim() ?? "";

  // Cargar productos una sola vez
  useEffect(() => {
    listarProductos()
      .then((data) => startTransition(() => setProductos(data)))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  // ── Extraer categorías y marcas únicas desde los productos ──
  const categoriasDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          productos.map((p) => normalizarNombre(p.categoria?.ctgraimgnombre, ""))
        )
      ).filter(Boolean),
    [productos]
  );

  const marcasDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          productos.map((p) => normalizarNombre(p.marca?.marcaimgnombre, ""))
        )
      ).filter(Boolean),
    [productos]
  );

  // ── Sincronizar URL → filtros con lógica de prioridad ──
  useEffect(() => {
    // Si hay ?categoria= o ?marca= en la URL, úsalos directamente
    if (categoriaDesdeUrl || marcaDesdeUrl) {
      setCategoriasSeleccionadas(categoriaDesdeUrl ? [categoriaDesdeUrl] : []);
      setMarcasSeleccionadas(marcaDesdeUrl ? [marcaDesdeUrl] : []);
      setBusquedaGeneral("");
      return;
    }

    // Si no hay ?q= tampoco, limpiar todo
    if (!queryUrl) {
      setCategoriasSeleccionadas([]);
      setMarcasSeleccionadas([]);
      setBusquedaGeneral("");
      return;
    }

    // Si aún no cargaron los productos, esperar
    if (productos.length === 0) return;

    const queryLower = queryUrl.toLowerCase();

    // 1️⃣ Prioridad 1: ¿coincide con alguna categoría?
    const categoriasCoincidentes = categoriasDisponibles.filter((cat) =>
      cat.toLowerCase().split(/\s+/).some((palabra) => palabra === queryLower)
    );

    if (categoriasCoincidentes.length > 0) {
      setCategoriasSeleccionadas(categoriasCoincidentes);
      setMarcasSeleccionadas([]);
      setBusquedaGeneral("");
      return;
    }

    // 2️⃣ Prioridad 2: ¿coincide con alguna marca?
    const marcasCoincidentes = marcasDisponibles.filter((mar) =>
      mar.toLowerCase().split(/\s+/).some((palabra) => palabra === queryLower)
    );

    if (marcasCoincidentes.length > 0) {
      setMarcasSeleccionadas(marcasCoincidentes);
      setCategoriasSeleccionadas([]);
      setBusquedaGeneral("");
      return;
    }

    // 3️⃣ Prioridad 3: buscar por nombre de producto
    setCategoriasSeleccionadas([]);
    setMarcasSeleccionadas([]);
    setBusquedaGeneral(queryUrl);
  }, [queryUrl, categoriaDesdeUrl, marcaDesdeUrl, productos, categoriasDisponibles, marcasDisponibles]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setProductosVisibles(INITIAL_VISIBLE);
  }, [busquedaGeneral, categoriasSeleccionadas, marcasSeleccionadas]);

  const toggleCategoria = (cat: string) =>
    setCategoriasSeleccionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleMarca = (mar: string) =>
    setMarcasSeleccionadas((prev) =>
      prev.includes(mar) ? prev.filter((m) => m !== mar) : [...prev, mar]
    );

  return (
    <div>
      <Seccion_1 />
      <div style={{ display: "flex" }}>
        <Seccion_2
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          onCategoriaSeleccionada={toggleCategoria}
          onMarcaSeleccionada={toggleMarca}
        />
        <Seccion_3
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          busquedaGeneral={busquedaGeneral}
          onEliminarCategoria={toggleCategoria}
          onEliminarMarca={toggleMarca}
          productosVisibles={productosVisibles}
          onCargarMas={() => setProductosVisibles((prev) => prev + INITIAL_VISIBLE)}
        />
      </div>
    </div>
  );
}