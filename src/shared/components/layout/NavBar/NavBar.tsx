import { ChangeEvent, FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import style from "./NavBar.module.css";
import { supabase } from "../../../../app/services/apiSupabase";
import type { CatalogProduct } from "../../../../modules/product/components/catalogData";
import { images } from "../../../../assets/img";
import { icon } from "../../../../core/icons";
import { NavBarLogo } from "./NavBarLogo";
import { NavBarSearch } from "./NavBarSearch";

import {
  DEFAULT_BRAND_IMAGE,
  DEFAULT_LOGO_IMAGE,
  getField,
  listStorageFolderFiles,
  resolveFolderImage,
  resolveCatalogImage,
  resolveStorageFileName,
} from "../../../utils/catalogImage";


type CartItem = {
  id: string | number;
  titulo: string;
  categoria: string;
  imagen: string;
  cantidad: number;
};

type DistritoItem = {
  nombre: string;
};

type ProvinciaItem = {
  nombre: string;
  distritos: DistritoItem[];
};

type DepartamentoItem = {
  nombre: string;
  provincias: ProvinciaItem[];
};

const STORAGE_KEY = "cartItems";

const brandingInicial = {
  nombre: "",
  descripcion: "",
  logoUrl: DEFAULT_LOGO_IMAGE,
};

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

async function fetchRowsRange(tableName: string, from: number, to: number) {
  const { data, error } = await supabase.from(tableName).select("*").range(from, to);

  if (error) {
    throw error;
  }

  return (data ?? []) as Record<string, unknown>[];
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

async function fetchNavbarBranding() {
  const { data: navbarData, error: navbarError } = await supabase.from("navbar").select("*").limit(1);

  if (navbarError) {
    throw navbarError;
  }

  const navbarRow = (navbarData ?? [])[0] as Record<string, unknown> | undefined;
  if (!navbarRow) {
    return brandingInicial;
  }

  const companyId = getField<number>(navbarRow, "nbCompanyId", "nbcompanyid");

  const companyResult =
    companyId !== null && companyId !== undefined
      ? await supabase.from("nbCompany").select("*").eq("nbcompanyid", companyId).limit(1)
      : { data: [], error: null };

  if (companyResult.error) {
    throw companyResult.error;
  }

  const companyRow = (companyResult.data ?? [])[0] as Record<string, unknown> | undefined;

  return {
    nombre:
      getField<string>(companyRow, "nbCompanyNombre", "nbcompanynombre", "nombre") ?? "",
    descripcion:
      getField<string>(
        companyRow,
        "nbCompanyDescripcion",
        "nbcompanydescripcion",
        "descripcion"
      ) ?? "",
    logoUrl: DEFAULT_LOGO_IMAGE,
  };
}

const ubicaciones: DepartamentoItem[] = [
  {
    nombre: "Junín",
    provincias: [
      {
        nombre: "Huancayo",
        distritos: [
          { nombre: "Huancayo" },
          { nombre: "Carhuacallanga" },
          { nombre: "Chacapampa" },
          { nombre: "Chicche" },
          { nombre: "Chilca" },
          { nombre: "Chongos Alto" },
          { nombre: "Chupuro" },
          { nombre: "Colca" },
          { nombre: "Cullhuas" },
          { nombre: "El Tambo" },
          { nombre: "Huacrapuquio" },
          { nombre: "Hualhuas" },
          { nombre: "Huancán" },
          { nombre: "Huasicancha" },
          { nombre: "Huayucachi" },
          { nombre: "Ingenio" },
          { nombre: "Pariahuanca" },
          { nombre: "Pilcomayo" },
          { nombre: "Pucará" },
          { nombre: "Quichuay" },
          { nombre: "Quilcas" },
          { nombre: "San Agustín" },
          { nombre: "San Jerónimo de Tunán" },
          { nombre: "Saño" },
          { nombre: "Sapallanga" },
          { nombre: "Sicaya" },
          { nombre: "Santo Domingo de Acobamba" },
          { nombre: "Viques" },
        ],
      },
      {
        nombre: "Concepción",
        distritos: [
          { nombre: "Concepción" },
          { nombre: "Aco" },
          { nombre: "Andamarca" },
          { nombre: "Chambará" },
          { nombre: "Cochas" },
          { nombre: "Comas" },
          { nombre: "Heroinas Toledo" },
          { nombre: "Manzanares" },
          { nombre: "Mariscal Castilla" },
          { nombre: "Matahuasi" },
          { nombre: "Mito" },
          { nombre: "Nueve de Julio" },
          { nombre: "Orcotuna" },
          { nombre: "Santa Rosa de Ocopa" },
        ],
      },
      {
        nombre: "Chanchamayo",
        distritos: [
          { nombre: "La Merced" },
          { nombre: "Perene" },
          { nombre: "Pichanaqui" },
          { nombre: "San Luis de Shuaro" },
          { nombre: "San Ramón" },
          { nombre: "Vitoc" },
        ],
      },
      {
        nombre: "Jauja",
        distritos: [
          { nombre: "Acolla" },
          { nombre: "Apata" },
          { nombre: "Ataura" },
          { nombre: "Canchayllo" },
          { nombre: "Curicaca" },
          { nombre: "El Mantaro" },
          { nombre: "Huamalí" },
          { nombre: "Huaripampa" },
          { nombre: "Huertas" },
          { nombre: "Janjaillo" },
          { nombre: "Julcán" },
          { nombre: "Leonor Ordóñez" },
          { nombre: "Llocllapampa" },
          { nombre: "Marco" },
          { nombre: "Masma" },
          { nombre: "Masma Chicche" },
          { nombre: "Molinos" },
          { nombre: "Monobamba" },
          { nombre: "Muqui" },
          { nombre: "Muquiyauyo" },
          { nombre: "Paca" },
          { nombre: "Paccha" },
          { nombre: "Pancán" },
          { nombre: "Parco" },
          { nombre: "Pomacancha" },
          { nombre: "Ricrán" },
          { nombre: "San Lorenzo" },
          { nombre: "San Pedro de Chunán" },
          { nombre: "Sausa" },
          { nombre: "Sincos" },
          { nombre: "Tunan Marca" },
          { nombre: "Yauli" },
          { nombre: "Yauyos" },
        ],
      },
      {
        nombre: "Junín",
        distritos: [
          { nombre: "Junín" },
          { nombre: "Carhuamayo" },
          { nombre: "Ondores" },
          { nombre: "Ulcumayo" },
        ],
      },
      {
        nombre: "Satipo",
        distritos: [
          { nombre: "Satipo" },
          { nombre: "Coviriali" },
          { nombre: "Llaylla" },
          { nombre: "Mazamari" },
          { nombre: "Pampa Hermosa" },
          { nombre: "Pangoa" },
          { nombre: "Río Negro" },
          { nombre: "Río Tambo" },
          { nombre: "Vizcatán del Ene" },
        ],
      },
      {
        nombre: "Tarma",
        distritos: [
          { nombre: "Tarma" },
          { nombre: "Acobamba" },
          { nombre: "Huaricolca" },
          { nombre: "Huasahuasi" },
          { nombre: "La Unión" },
          { nombre: "Palca" },
          { nombre: "Palcamayo" },
          { nombre: "San Pedro de Cajas" },
          { nombre: "Tapo" },
        ],
      },
      {
        nombre: "Yauli",
        distritos: [
          { nombre: "La Oroya" },
          { nombre: "Chacapalpa" },
          { nombre: "Huay-Huay" },
          { nombre: "Marcapomacocha" },
          { nombre: "Morococha" },
          { nombre: "Paccha" },
          { nombre: "Santa Bárbara de Carhuacayan" },
          { nombre: "Santa Rosa de Sacco" },
          { nombre: "Suitucancha" },
          { nombre: "Yauli" },
        ],
      },
      {
        nombre: "Chupaca",
        distritos: [
          { nombre: "Chupaca" },
          { nombre: "Ahuac" },
          { nombre: "Chongos Bajo" },
          { nombre: "Huáchac" },
          { nombre: "Huamancaca Chico" },
          { nombre: "San Juan de Iscos" },
          { nombre: "San Juan de Jarpa" },
          { nombre: "Tres de Diciembre" },
          { nombre: "Yanacancha" },
        ],
      },
    ],
  },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const whatsappNumber = "51931389001";
  const [branding, setBranding] = useState(brandingInicial);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [mostrarModalCotizar, setMostrarModalCotizar] = useState(false);
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<CatalogProduct | null>(null);
  const [productosCatalogo, setProductosCatalogo] = useState<CatalogProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [archivoAdjunto, setArchivoAdjunto] = useState("");
  const [rucDni, setRucDni] = useState("");
  const [materiales, setMateriales] = useState("");
  const [referencia, setReferencia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [distrito, setDistrito] = useState("");
  const [provincia, setProvincia] = useState("");
  const [categoriasMenu, setCategoriasMenu] = useState<string[]>([]);
  const [marcasMenu, setMarcasMenu] = useState<{ nombre: string; imagen: string }[]>([]);

  
  const [menuCargado, setMenuCargado] = useState(false);
  const [cargandoMenu, setCargandoMenu] = useState(false);



// Función reutilizable para leer el carrito
const leerCarrito = (): CartItem[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// En el componente NavBar:
useEffect(() => {
  // Carga inicial
  setCartItems(leerCarrito());

  // ✅ Escucha cambios desde otros componentes (mismo tab)
  const handleCartUpdate = () => setCartItems(leerCarrito());
  window.addEventListener("cartUpdated", handleCartUpdate);

  // ✅ También escucha cambios desde otras pestañas
  window.addEventListener("storage", handleCartUpdate);

  return () => {
    window.removeEventListener("cartUpdated", handleCartUpdate);
    window.removeEventListener("storage", handleCartUpdate);
  };
}, []);



  useEffect(() => {
    if (!mostrarCategorias || menuCargado || cargandoMenu) {
      return;
    }

    const cargarMenu = async () => {
      setCargandoMenu(true);

      let data: Record<string, unknown>[];
      try {
        data = await fetchRowsRange("producto", 0, 47);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        console.error("No se pudieron cargar los productos del menu:", message);
        setProductosCatalogo([]);
        setCategoriasMenu([]);
        setMarcasMenu([]);
        setCargandoMenu(false);
        return;
      }

      const [categoriasResult, marcasResult] = await Promise.allSettled([
        fetchAllRows("categoria"),
        fetchAllRows("marca"),
      ]);

      const categoriasData =
        categoriasResult.status === "fulfilled" ? categoriasResult.value : [];
      const marcasData = marcasResult.status === "fulfilled" ? marcasResult.value : [];
      let archivosMarca: string[] = [];

      try {
        archivosMarca = await listStorageFolderFiles("marca");
      } catch (error) {
        console.error("No se pudieron listar los archivos de marcas:", error);
      }

      if (categoriasResult.status === "rejected") {
        console.error("No se pudieron cargar las categorias del menu:", categoriasResult.reason);
      }

      if (marcasResult.status === "rejected") {
        console.error("No se pudieron cargar las marcas del menu:", marcasResult.reason);
      }

      const categoriasMap = new Map<number, string>();
      const categoriasLabels: string[] = [];
      for (const row of categoriasData) {
        const id = getField<number>(row, "ctgraId", "ctgraid", "id");
        if (id === null || id === undefined) continue;

        const nombre = getField<string>(
          row,
          "ctgraNombre",
          "ctgranombre",
          "categoriaNombre",
          "categorianombre",
          "nombre"
        );
        const imagenNombre = getField<string>(row, "ctgraImgNombre", "ctgraimgnombre");
        const label = buildDisplayName(nombre, imagenNombre, `Categoria ${id}`);
        categoriasMap.set(Number(id), label);
        categoriasLabels.push(label);
      }

      const marcasMap = new Map<number, string>();
      const marcasLista: { nombre: string; imagen: string }[] = [];
      for (const row of marcasData) {
        const id = getField<number>(row, "marcaId", "marcaid", "id");
        if (id === null || id === undefined) continue;

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
        const label = buildDisplayName(nombre, imagenNombre, `Marca ${id}`);
        const imagen = resolveFolderImage("marca", archivoResuelto, getStorageUrl, DEFAULT_BRAND_IMAGE);

        marcasMap.set(Number(id), label);
        marcasLista.push({ nombre: label, imagen });
      }

      const productosMapeados = data
        .map((row) => {
          const id = getField<number>(row, "prdcId", "prdcid", "productoId", "id");
          const categoriaId = getField<number>(row, "ctgraId", "ctgraid");
          const marcaId = getField<number>(row, "marcaId", "marcaid");
          const precio = getField<string | number>(
            row,
            "prdcPrecio",
            "prdcprecio",
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
          
            imagen: String(imagen || ""),
          };
        })
        .filter((item): item is CatalogProduct => Boolean(item));

      startTransition(() => {
        setProductosCatalogo(productosMapeados);
        setCategoriasMenu(
          Array.from(new Set(categoriasLabels)).sort((a, b) => a.localeCompare(b))
        );
        setMarcasMenu(
          marcasLista
            .filter(
              (marca, index, array) =>
                array.findIndex((item) => item.nombre === marca.nombre) === index
            )
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        setMenuCargado(true);
      });

      setCargandoMenu(false);
    };

    cargarMenu();
  }, [cargandoMenu, menuCargado, mostrarCategorias]);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.cantidad, 0),
    [cartItems] 
  );

  const departamentoActivo =
    ubicaciones.find((item) => item.nombre === departamento) ?? ubicaciones[0];

  const provinciasDisponibles = departamentoActivo.provincias;

  const provinciaActiva = provincia
    ? provinciasDisponibles.find((item) => item.nombre === provincia) ??
      provinciasDisponibles[0]
    : undefined;

  const distritosDisponibles = provinciaActiva?.distritos ?? [];

  const distritoActivo = distrito
    ? distritosDisponibles.find((item) => item.nombre === distrito) ??
      distritosDisponibles[0]
    : undefined;

  const ubicacionSeleccionada =
    departamento && distrito && provincia
      ? `${departamento}, ${provincia}, ${distrito}`
      : "Seleccionar Ubicacion";

  const abrirModalCompra = (producto: CatalogProduct) => {
    setProductoSeleccionado(producto);
    setMostrarModalCompra(true);
  };

  const anadirAlCarrito = () => {
    if (!productoSeleccionado) return;

    const existente = cartItems.find((item) => item.id === productoSeleccionado.id);
    let nextItems: CartItem[];

    if (existente) {
      nextItems = cartItems.map((item) =>
        item.id === productoSeleccionado.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      );
    } else {
      nextItems = [
        ...cartItems,
        {
          id: productoSeleccionado.id,
          titulo: productoSeleccionado.titulo,
          categoria: productoSeleccionado.categoria,
          
          imagen: productoSeleccionado.imagen,
          cantidad: 1,
        },
      ];
    }

    setCartItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    setMostrarModalCompra(false);
    setMostrarCategorias(false);
  };

  const abrirCotizar = () => {
    setMostrarModalCotizar(true);
    setMostrarUbicacion(false);
    setArchivoAdjunto("");
  };

  const cerrarCotizar = () => {
    setMostrarModalCotizar(false);
    setMostrarUbicacion(false);
    setArchivoAdjunto("");
    setRucDni("");
    setMateriales("");
    setReferencia("");
    setDepartamento("");
    setProvincia("");
    setDistrito("");
  };

  const handleArchivo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setArchivoAdjunto(file ? file.name : "");
  };

  const handleRucDniChange = (event: ChangeEvent<HTMLInputElement>) => {
    const soloNumeros = event.target.value.replace(/\D/g, "").slice(0, 11);
    setRucDni(soloNumeros);
  };

  const cambiarDepartamento = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDepartamento = event.target.value;
    const departamentoEncontrado =
      ubicaciones.find((item) => item.nombre === nextDepartamento) ?? ubicaciones[0];
    const siguienteProvincia = departamentoEncontrado.provincias[0];
    const siguienteDistrito = siguienteProvincia.distritos[0];

    setDepartamento(nextDepartamento);
    setProvincia(siguienteProvincia.nombre);
    setDistrito(siguienteDistrito.nombre);
  };

  const cambiarProvincia = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProvincia = event.target.value;
    const provinciaEncontrada =
      provinciasDisponibles.find((item) => item.nombre === nextProvincia) ??
      provinciasDisponibles[0];

    setProvincia(nextProvincia);
    setDistrito(provinciaEncontrada.distritos[0]?.nombre ?? "");
  };

  const cotizarPorWhatsapp = () => {
    const documento = rucDni.trim();

    if (!documento) {
      window.alert("Ingresa tu DNI o RUC para continuar.");
      return;
    }

    if (documento.length !== 8 && documento.length !== 11) {
      window.alert("El DNI debe tener 8 digitos y el RUC 11 digitos.");
      return;
    }

    const mensaje = [
      `DNI/RUC: ${documento || "-"}`,
      `UBICACION: ${
        departamento && provincia && distrito
          ? `${departamento}-${provincia}-${distrito}`
          : "-"
      }`,
      `REFERENCIA: ${referencia.trim() || "-"}`,
      `MATERIALES: ${materiales.trim() || "-"}`,
      `LISTA ADJUNTADA: ${archivoAdjunto || "No adjunto archivo"}`,
    ].join("\n\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };




  return (
    <div className={style.wrapper}>
      <header className={style.navbar}>

        <NavBarLogo/>
        <NavBarSearch/>

        <nav className={style.menu}>
          <Link to="/nosotros" className={style.link}>
            Nosotros
          </Link>
          <Link to="/product" className={style.link}>
            Productos
          </Link>
          <button
            type="button"
            className={style.linkButton}
            onClick={() => setMostrarCategorias((prev) => !prev)}
          >
            Categorias
            <span className={style.arrow}>v</span>
          </button>
        </nav>

        <div className={style.actions}>
          <button type="button" className={style.quoteButton} onClick={abrirCotizar}>
            Cotizar
          </button>

          <Link to="/cart" className={style.cartButton} aria-label="Carrito">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3h2l2.4 12.1a1 1 0 0 0 1 .9h9.7a1 1 0 0 0 1-.8L21 7H7"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
            </svg>
            {totalItems > 0 && <span className={style.cartCount}>{totalItems}</span>}
          </Link>
        </div>
      </header>

      {mostrarCategorias && (
        <div
          className={style.overlay}
          onClick={() => setMostrarCategorias(false)}
        >
          <div
            className={style.panel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={style.panelContenido}>
              <aside className={style.sidebar}>
                <h3 className={style.panelTitulo}>Categorias</h3>
                <p className={style.panelSubtitulo}>
                  Explora el catalogo por familia de productos.
                </p>
                <div className={style.listaCategorias}>
                  {categoriasMenu.length > 0 ? (
                    categoriasMenu.map((categoria, index) => (
                      <button
                        key={categoria}
                        type="button"
                        className={`${style.categoriaItem} ${
                          index === 0 ? style.categoriaActiva : ""
                        }`}
                      >
                        <span>{categoria}</span>
                        <span className={style.categoriaFlecha}>{index === 0 ? ">" : "+"}</span>
                      </button>
                    ))
                  ) : (
                    <div className={style.panelVacio}>No hay categorias disponibles.</div>
                  )}
                </div>
              </aside>

              <section className={style.productosArea}>
                <div className={style.productosEncabezado}>
                  <div>
                    <h3 className={style.productosTitulo}>Productos destacados</h3>
                    <p className={style.productosTexto}>
                      Una vista rapida del catalogo disponible.
                    </p>
                  </div>
                  <span className={style.productosBadge}>{productosCatalogo.length}</span>
                </div>

                {productosCatalogo.length > 0 ? (
                  <div className={style.gridProductos}>
                    {productosCatalogo.map((producto) => (
                      <article key={producto.id} className={style.productoCard}>
                        <div className={style.productoImagenWrap}>
                          {producto.imagen ? (
                            <img
                              src={producto.imagen}
                              alt={producto.titulo}
                              className={style.productoImagen}
                            />
                          ) : (
                            <div className={style.productoPlaceholder}>Sin imagen</div>
                          )}
                        </div>

                        <h4 className={style.productoTitulo}>{producto.titulo}</h4>
                        

                        <button
                          type="button"
                          className={style.productoBoton}
                          onClick={() => abrirModalCompra(producto)}
                        >
                          Lo quiero
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={style.panelVacioCentro}>No hay productos para mostrar.</div>
                )}
              </section>

              <aside className={style.marcasBox}>
                <h3 className={style.panelTitulo}>Marcas</h3>
                <p className={style.panelSubtitulo}>Aliados con presencia constante en stock.</p>
                <div className={style.marcasLista}>
                  {marcasMenu.length > 0 ? (
                    marcasMenu.map((marca) => (
                      <div key={marca.nombre} className={style.marcaItem}>
                        {marca.imagen ? (
                          <img src={marca.imagen} alt={marca.nombre} className={style.marcaImg} />
                        ) : (
                          <div className={style.marcaPlaceholder}>{marca.nombre}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={style.panelVacio}>No hay marcas disponibles.</div>
                  )}
                </div>
              </aside>
            </div>

            <button type="button" className={style.verMas}>
              Ver mas productos
            </button>
          </div>
        </div>
      )}


      {mostrarModalCompra && (
        <div
          className={style.modalOverlay}
          onClick={() => setMostrarModalCompra(false)}
        >
          <div
            className={style.modalCompra}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={style.modalTitulo}>Como deseas continuar?</h3>
            <p className={style.modalTexto}>
              Elige una opcion para poder completar tu compra
            </p>

            <button
              type="button"
              className={style.modalBotonNaranja}
              onClick={anadirAlCarrito}
            >
              <span className={style.modalIcono}>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={style.modalSvg}
                >
                  <path
                    d="M7 6h14l-1.5 7.5H9L7 4H3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="19" r="1.6" fill="currentColor" />
                  <circle cx="18" cy="19" r="1.6" fill="currentColor" />
                </svg>
              </span>
              <span>Anadir al carrito</span>
            </button>

            <button type="button" className={style.modalBotonVerde}>
              <span className={style.modalIcono}>
                <img src={images.whatsapp} alt="Whatsapp" />
              </span>
              <span>Realizar la compra</span>
            </button>
          </div>
        </div>
      )}

      {mostrarModalCotizar && (
        <div className={style.quoteOverlay} onClick={cerrarCotizar}>
          <div
            className={style.quoteModal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={style.quoteClose}
              onClick={cerrarCotizar}
              aria-label="Cerrar cotizacion"
            >
              ×
            </button>

            <div className={style.quoteHeader}>
            
                <img
                  src={images.logoGorrion}
                  alt="Logo Gorrioncito"
                  className={style.quoteLogo}
                />
    
              <div>
                <h3 className={style.quoteTitle}>{branding.nombre}</h3>
                <p className={style.quoteSubtitle}>{branding.descripcion}</p>
              </div>
            </div>

            <p className={style.quoteIntro}>
              Completa tus datos y te ayudamos a cotizar más rápido.
            </p>

            <div className={style.inputWrap}>
              <span className={style.inputIcon}>ID</span>
              <input
                type="text"
                placeholder="RUC/DNI"
                className={style.quoteInput}
                value={rucDni}
                onChange={handleRucDniChange}
                inputMode="numeric"
                maxLength={11}
              />
            </div>

            <button
              type="button"
              className={style.selectTrigger}
              onClick={() => setMostrarUbicacion((prev) => !prev)}
            >
              {icon.iconUbicacion({ className: style.ubicacionIcon })}
              <span>{ubicacionSeleccionada}</span>
              <span className={style.selectArrow}>v</span>
            </button>
 
            {mostrarUbicacion && (
            <div className={style.selectPanel}>
              <div className={style.realSelectWrap}>
                <select
                  className={style.realSelect}
                  value={departamento}
                  onChange={cambiarDepartamento}
                >
                  <option value="">Departamento</option>
                  {ubicaciones.map((item) => (
                    <option key={item.nombre} value={item.nombre}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={style.realSelectWrap}>
                <select
                  className={style.realSelect}
                  value={provincia}
                  onChange={cambiarProvincia}
                >
                  <option value="">Provincia</option>
                  {provinciasDisponibles.map((item) => (
                    <option key={item.nombre} value={item.nombre}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={style.realSelectWrap}>
                <select
                  className={style.realSelect}
                  value={distrito}
                  onChange={(event) => setDistrito(event.target.value)}
                >
                  <option value="">Distrito</option>
                  {distritosDisponibles.map((item) => (
                    <option key={item.nombre} value={item.nombre}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={style.referenciaBox}>
                <div className={style.referenciaTitulo}>Referencia</div>
                <textarea
                  className={style.referenciaInput}
                  placeholder="Escribe una referencia"
                  value={referencia}
                  onChange={(event) => setReferencia(event.target.value)}
                />
              </div>
            </div>
            )}

            <textarea
              className={style.quoteTextarea}
              placeholder="Escribe aquí tu lista de materiales..."
              value={materiales}
              onChange={(event) => setMateriales(event.target.value)}
            />

            <label className={style.uploadButton}>
              <input type="file" className={style.fileInput} onChange={handleArchivo} />
              Adjuntar lista (Opcional)
            </label>

            {archivoAdjunto && <p className={style.fileName}>{archivoAdjunto}</p>}

            <button type="button" className={style.quoteSubmit} onClick={cotizarPorWhatsapp}>
              <span >
                {icon.iconWhatsApp({ className: style.whatsappIcon })}
              </span>
              <span>Cotizar</span>
            </button>
            <p className={style.quotePhone}>o comunicate con el +51 915 144 663</p>
          </div>
        </div>
      )}
    </div>
  );
}
