import { useEffect, useState } from "react";
import styles from "./seccion_2.module.css";
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

export default function Seccion_2() {
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
        console.error("No se pudieron cargar las marcas de Nosotros:", error);
        setMarcas([]);
      }
    };

    cargarMarcas();
  }, []);

  return (
    <section className={styles.seccion}>
      <div className={styles.contenido}>
        <div className={styles.encabezado}>
          <div>
            <span className={styles.kicker}>Respaldo comercial</span>
            <h2 className={styles.titulo}>Marcas reconocidas en nuestro portafolio</h2>
            <p className={styles.descripcion}>
              Trabajamos con fabricantes y lineas comerciales con presencia
              constante en seguridad industrial, ferreteria y suministros para obra.
            </p>
          </div>
          <div className={styles.resumen}>
            <strong>{marcas.length}</strong>
            <span>marcas destacadas</span>
          </div>
        </div>

        <div className={styles.grid}>
          {marcas.length > 0 ? (
            marcas.map((marca) => (
              <div key={marca.id} className={styles.marcaCard}>
                {marca.imagen ? (
                  <img src={marca.imagen} alt={marca.nombre} className={styles.marcaImg} />
                ) : (
                  <div className={styles.placeholder}>{marca.nombre}</div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.vacio}>No hay marcas disponibles.</div>
          )}
        </div>
      </div>
    </section>
  );
}
