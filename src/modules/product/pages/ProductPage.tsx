// import style from "./ProductPage.module.css";
import style from "./ProductPage.module.css";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../../app/services/apiSupabase";

import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import type { CatalogCategory, CatalogProduct } from "../components/catalogData";
import { getField, resolveCatalogImage } from "../../../shared/utils/catalogImage";
// import Seccion_4 from "../components/seccion_4/seccion_4";
// import Seccion_5 from "../components/seccion_5/seccion_5";
// import Seccion_6 from "../components/seccion_6/seccion_6";
// import Seccion_7 from "../components/seccion_7/seccion_7";
// import Seccion_8 from "../components/seccion_8/seccion_8";

function getStorageUrl(bucketName: string | null, fileName: string | null) {
  if (!bucketName || !fileName) return null;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data?.publicUrl ?? null;
}

function buildDisplayName(rawName: string | null, fileName: string | null, fallback: string) {
  const source = rawName || fileName;
  if (!source) return fallback;

  const baseName = /\.[A-Za-z]{2,5}$/.test(source) ? source.replace(/\.[^.]+$/, "") : source;
  const normalized = baseName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrice(value: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "Consultar precio";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `S/ ${value}`;

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(numeric);
}

async function fetchAllProductos() {
  return fetchAllRows("producto");
}

async function fetchAllRows(tableName: string) {
  const pageSize = 1000;
  const allRows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allRows;
}

const INITIAL_VISIBLE_PRODUCTS = 40;

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState<CatalogProduct[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([]);
  const [productosVisibles, setProductosVisibles] = useState(INITIAL_VISIBLE_PRODUCTS);
  const busquedaGeneral = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const categoriaDesdeUrl = searchParams.get("categoria")?.trim() ?? "";
  const marcaDesdeUrl = searchParams.get("marca")?.trim() ?? "";

  useEffect(() => {
    const cargarProductos = async () => {
      setCargandoProductos(true);

      let data: Record<string, unknown>[];
      try {
        data = await fetchAllProductos();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        console.error("No se pudieron cargar los productos:", message);
        setProductos([]);
        setCargandoProductos(false);
        return;
      }

      const [categoriasResult, marcasResult] = await Promise.allSettled([
        fetchAllRows("categoria"),
        fetchAllRows("marca"),
      ]);

      const categoriasData =
        categoriasResult.status === "fulfilled" ? categoriasResult.value : [];
      const marcasData = marcasResult.status === "fulfilled" ? marcasResult.value : [];

      if (categoriasResult.status === "rejected") {
        console.error("No se pudieron cargar las categorias:", categoriasResult.reason);
      }

      if (marcasResult.status === "rejected") {
        console.error("No se pudieron cargar las marcas:", marcasResult.reason);
      }

      const categoriasMap = new Map<number, string>(
        categoriasData.map((row) => {
          const id = getField<number>(row, "ctgraId", "ctgraid", "id");
          const nombre = getField<string>(
            row,
            "ctgraNombre",
            "ctgranombre",
            "categoriaNombre",
            "categorianombre",
            "nombre"
          );
          const imagenNombre = getField<string>(row, "ctgraImgNombre", "ctgraimgnombre");

          return [
            Number(id),
            buildDisplayName(nombre, imagenNombre, `Categoria ${id ?? ""}`.trim()),
          ];
        })
      );

      const marcasMap = new Map<number, string>(
        marcasData.map((row) => {
          const id = getField<number>(row, "marcaId", "marcaid", "id");
          const nombre = getField<string>(
            row,
            "marcaNombre",
            "marcanombre",
            "nombre"
          );
          const imagenNombre = getField<string>(row, "marcaImgNombre", "marcaimgnombre");

          return [Number(id), buildDisplayName(nombre, imagenNombre, `Marca ${id ?? ""}`.trim())];
        })
      );

      const productosMapeados = data
        .map((row) => {
          const id = getField<number>(row, "prdcId", "prdcid", "productoId", "id");
          const categoriaId = getField<number>(row, "ctgraId", "ctgraid");
          const marcaId = getField<number>(row, "marcaId", "marcaid");
          const precio = getField<string | number>(
            row,
            "prdcPrecio",
            "prdcprecio",
            "precio"
          );
          const nombre = getField<string>(
            row,
            "prdcNombre",
            "prdcnombre",
            "productoNombre",
            "productonombre",
            "nombre"
          );
          const imagenNombre = getField<string>(row, "prdcImgNombre", "prdcimgnombre");
          const imagen = resolveCatalogImage(row, getStorageUrl);

          if (!id || !categoriaId || !marcaId) {
            return null;
          }

          return {
            id: Number(id),
            titulo: buildDisplayName(nombre, imagenNombre, `Producto ${id}`),
            categoria: categoriasMap.get(Number(categoriaId)) || `Categoria ${categoriaId}`,
            marca: marcasMap.get(Number(marcaId)) || `Marca ${marcaId}`,
            precio: formatPrice(precio),
            imagen: String(imagen || ""),
          };
        })
        .filter((item): item is CatalogProduct => Boolean(item));

      startTransition(() => {
        setProductos(productosMapeados);
      });
      setCargandoProductos(false);
    };

    cargarProductos();
  }, []);

  useEffect(() => {
    setProductosVisibles(INITIAL_VISIBLE_PRODUCTS);
  }, [busquedaGeneral, categoriasSeleccionadas, marcasSeleccionadas]);

  useEffect(() => {
    setCategoriasSeleccionadas(categoriaDesdeUrl ? [categoriaDesdeUrl] : []);
    setMarcasSeleccionadas(marcaDesdeUrl ? [marcaDesdeUrl] : []);
  }, [categoriaDesdeUrl, marcaDesdeUrl]);

  const categorias = useMemo<CatalogCategory[]>(() => {
    const conteo = new Map<string, number>();

    for (const producto of productos) {
      conteo.set(producto.categoria, (conteo.get(producto.categoria) ?? 0) + 1);
    }

    return Array.from(conteo.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([nombre, total], index) => ({
        id: index + 1,
        nombre,
        total,
      }));
  }, [productos]);

  const marcas = useMemo(() => {
    return Array.from(new Set(productos.map((producto) => producto.marca))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [productos]);

  const toggleCategoria = (categoria: string) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(categoria)
        ? prev.filter((item) => item !== categoria)
        : [...prev, categoria]
    );
  };

  const toggleMarca = (marca: string) => {
    setMarcasSeleccionadas((prev) =>
      prev.includes(marca) ? prev.filter((item) => item !== marca) : [...prev, marca]
    );
  };

  return (
    <div className={style.contenidoHome}>
      <Seccion_1 />

      <div className={style.fila}>
        <Seccion_2
          categorias={categorias}
          marcas={marcas}
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          onCategoriaSeleccionada={toggleCategoria}
          onMarcaSeleccionada={toggleMarca}
        />
        <Seccion_3
          productos={productos}
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          busquedaGeneral={busquedaGeneral}
          onEliminarCategoria={toggleCategoria}
          onEliminarMarca={toggleMarca}
          productosVisibles={productosVisibles}
          onCargarMas={() => setProductosVisibles((prev) => prev + INITIAL_VISIBLE_PRODUCTS)}
        />
      </div>
    </div>
  );
}
