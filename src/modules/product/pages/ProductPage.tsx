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
  const [productosVisibles, setProductosVisibles] = useState(INITIAL_VISIBLE);

  const busquedaGeneral = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const categoriaDesdeUrl = searchParams.get("categoria")?.trim() ?? "";
  const marcaDesdeUrl = searchParams.get("marca")?.trim() ?? "";

  // Cargar productos una sola vez
  useEffect(() => {
    listarProductos()
      .then((data) => startTransition(() => setProductos(data)))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  // Sincronizar filtros con la URL
  useEffect(() => {
    setCategoriasSeleccionadas(categoriaDesdeUrl ? [categoriaDesdeUrl] : []);
    setMarcasSeleccionadas(marcaDesdeUrl ? [marcaDesdeUrl] : []);
  }, [categoriaDesdeUrl, marcaDesdeUrl]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setProductosVisibles(INITIAL_VISIBLE);
  }, [busquedaGeneral, categoriasSeleccionadas, marcasSeleccionadas]);

  const categorias = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const p of productos) {
      const nombre = normalizarNombre(p.categoria?.ctgraimgnombre, "Sin categoria");
      conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
    }
    return Array.from(conteo.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([nombre, total], index) => ({ id: index + 1, nombre, total }));
  }, [productos]);

  const marcas = useMemo(() => {
    return Array.from(
      new Set(productos.map((p) => normalizarNombre(p.marca?.marcaimgnombre, "Sin marca")))
    ).sort((a, b) => a.localeCompare(b));
  }, [productos]);

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