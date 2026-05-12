import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_2.module.css";

import {
  listarCategorias,
  type Categoria,
} from "../../../../core/services/categoria.service";

import {
  listarMarcas,
  type Marca,
} from "../../../../core/services/marca.service";

type Props = {
  categoriasSeleccionadas: string[];
  marcasSeleccionadas: string[];
  onCategoriaSeleccionada: (categoria: string) => void;
  onMarcaSeleccionada: (marca: string) => void;
};

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;

export default function Seccion_2({
  categoriasSeleccionadas,
  marcasSeleccionadas,
  onCategoriaSeleccionada,
  onMarcaSeleccionada,
}: Props) {
  const [tabActiva, setTabActiva] = useState<"categorias" | "marcas">("categorias");
  const [busqueda, setBusqueda] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => {
    listarCategorias().then((data) => setCategorias(data as Categoria[]));
    listarMarcas().then((data) => setMarcas(data as Marca[]));
  }, []);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((item) =>
      normalizarNombre(item.ctgraimgnombre, "")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, categorias]);

  const marcasFiltradas = useMemo(() => {
    return marcas.filter((item) =>
      normalizarNombre(item.marcaimgnombre, "")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, marcas]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "categorias" ? styles.tabActiva : ""}`}
          onClick={() => setTabActiva("categorias")}
        >
          Categorias
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "marcas" ? styles.tabActiva : ""}`}
          onClick={() => setTabActiva("marcas")}
        >
          Marcas
        </button>
      </div>

      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>Q</span>
        <input
          type="text"
          placeholder={tabActiva === "categorias" ? "Buscar Categoria" : "Buscar Marca"}
          className={styles.searchInput}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {tabActiva === "categorias" ? (
        <div className={styles.lista}>
          <h3 className={styles.titulo}>Categorias</h3>
          {categoriasFiltradas.map((categoria) => {
            const nombre = normalizarNombre(categoria.ctgraimgnombre, "Sin categoria");
            return (
              <button
                key={categoria.ctgraid}
                type="button"
                className={`${styles.item} ${
                  categoriasSeleccionadas.includes(nombre) ? styles.itemActivo : ""
                }`}
                onClick={() => onCategoriaSeleccionada(nombre)}
              >
                <span>{nombre}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.lista}>
          <h3 className={styles.titulo}>Marcas</h3>
          {marcasFiltradas.map((marca) => {
            const nombre = normalizarNombre(marca.marcaimgnombre, "Sin marca");
            return (
              <button
                key={marca.marcaid}
                type="button"
                className={`${styles.item} ${
                  marcasSeleccionadas.includes(nombre) ? styles.itemActivo : ""
                }`}
                onClick={() => onMarcaSeleccionada(nombre)}
              >
                <span>{nombre}</span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}