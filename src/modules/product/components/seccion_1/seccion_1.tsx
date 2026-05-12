import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_1.module.css";
import { supabase } from "../../../../app/services/apiSupabase";
import {
  getField,
  listStorageFolderFiles,
  resolveFolderImage,
  resolveStorageFileName,
} from "../../../../shared/utils/catalogImage";

type MarcaItem = {
  id: number;
  nombre: string;
  imagen: string;
};

function getStorageUrl(bucketName: string | null, fileName: string | null) {
  if (!bucketName || !fileName) return "";

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data?.publicUrl ?? "";
}

function buildDisplayName(rawName: string | null, fileName: string | null, fallback: string) {
  const source = rawName || fileName;
  if (!source) return fallback;

  const baseName = source.replace(/\.[^.]+$/, "");
  const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Seccion_1() {
  const [pausado, setPausado] = useState(false);
  const [direccion, setDireccion] = useState<"normal" | "reverse">("normal");
  const [marcas, setMarcas] = useState<MarcaItem[]>([]);

  useEffect(() => {
    const cargarMarcas = async () => {
      try {
        const [{ data, error }, archivosMarca] = await Promise.all([
          supabase.from("marca").select("*").limit(12),
          listStorageFolderFiles("marca"),
        ]);

        if (error) {
          throw error;
        }

        const marcasMapeadas = ((data ?? []) as Record<string, unknown>[])
          .map((row, index) => {
            const id = getField<number>(row, "marcaId", "marcaid", "id") ?? index + 1;
            const nombre = getField<string>(row, "marcaNombre", "marcanombre", "nombre");
            const imagenNombre = getField<string>(row, "marcaImgNombre", "marcaimgnombre");
            const imagenArchivo = getField<string>(
              row,
              "marcaImgNombreBucket",
              "marcaimgnombrebucket"
            );
            const archivoResuelto = resolveStorageFileName(
              imagenArchivo,
              imagenNombre ?? nombre,
              archivosMarca
            );

            return {
              id: Number(id),
              nombre: buildDisplayName(nombre, imagenNombre, `Marca ${id}`),
              imagen: resolveFolderImage("marca", archivoResuelto, getStorageUrl),
            };
          })
          .filter((item) => item.nombre);

        setMarcas(marcasMapeadas);
      } catch (error) {
        console.error("No se pudieron cargar las marcas del carrusel:", error);
        setMarcas([]);
      }
    };

    cargarMarcas();
  }, []);

  const marcasLoop = useMemo(() => {
    if (marcas.length === 0) return [];
    return [...marcas, ...marcas];
  }, [marcas]);

  const siguiente = () => {
    setDireccion("normal");
  };

  const anterior = () => {
    setDireccion("reverse");
  };

  return (
    <section
      className={styles.seccion}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <button type="button" className={styles.flecha} onClick={anterior} aria-label="Anterior">
        {"<"}
      </button>

      <div className={styles.carrusel}>
        {marcasLoop.length > 0 ? (
          <div
            className={`${styles.pista} ${pausado ? styles.pistaPausada : ""}`}
            style={{ animationDirection: direccion }}
          >
            {marcasLoop.map((marca, index) => (
              <article key={`${marca.id}-${index}`} className={styles.logoCard}>
                {marca.imagen ? (
                  <img src={marca.imagen} alt={marca.nombre} className={styles.logo} />
                ) : (
                  <div className={styles.logoPlaceholder}>{marca.nombre}</div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.vacio}>No hay marcas disponibles.</div>
        )}
      </div>

      <button type="button" className={styles.flecha} onClick={siguiente} aria-label="Siguiente">
        {">"}
      </button>
    </section>
  );
}
