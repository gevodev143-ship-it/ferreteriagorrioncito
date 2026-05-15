import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import style from "./NavBar.module.css";
import { supabase } from "../../../../lib/supabase";
import { images } from "../../../../assets/img";
import { icon } from "../../../../core/icons";
import { NavBarLogo } from "./NavBarLogo";
import { NavBarSearch } from "./NavBarSearch";
import { NavBarCategoria } from "./NavBarCategoria";
import { DEFAULT_LOGO_IMAGE, getField } from "../../../utils/catalogImage";

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  id: string | number;
  titulo: string;
  categoria: string;
  imagen: string;
  cantidad: number;
};

type DistritoItem = { nombre: string };
type ProvinciaItem = { nombre: string; distritos: DistritoItem[] };
type DepartamentoItem = { nombre: string; provincias: ProvinciaItem[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cartItems";

const brandingInicial = {
  nombre: "",
  descripcion: "",
  logoUrl: DEFAULT_LOGO_IMAGE,
};

const ubicaciones: DepartamentoItem[] = [
  {
    nombre: "Junín",
    provincias: [
      {
        nombre: "Huancayo",
        distritos: [
          { nombre: "Huancayo" }, { nombre: "Carhuacallanga" }, { nombre: "Chacapampa" },
          { nombre: "Chicche" }, { nombre: "Chilca" }, { nombre: "Chongos Alto" },
          { nombre: "Chupuro" }, { nombre: "Colca" }, { nombre: "Cullhuas" },
          { nombre: "El Tambo" }, { nombre: "Huacrapuquio" }, { nombre: "Hualhuas" },
          { nombre: "Huancán" }, { nombre: "Huasicancha" }, { nombre: "Huayucachi" },
          { nombre: "Ingenio" }, { nombre: "Pariahuanca" }, { nombre: "Pilcomayo" },
          { nombre: "Pucará" }, { nombre: "Quichuay" }, { nombre: "Quilcas" },
          { nombre: "San Agustín" }, { nombre: "San Jerónimo de Tunán" }, { nombre: "Saño" },
          { nombre: "Sapallanga" }, { nombre: "Sicaya" },
          { nombre: "Santo Domingo de Acobamba" }, { nombre: "Viques" },
        ],
      },
      {
        nombre: "Concepción",
        distritos: [
          { nombre: "Concepción" }, { nombre: "Aco" }, { nombre: "Andamarca" },
          { nombre: "Chambará" }, { nombre: "Cochas" }, { nombre: "Comas" },
          { nombre: "Heroinas Toledo" }, { nombre: "Manzanares" },
          { nombre: "Mariscal Castilla" }, { nombre: "Matahuasi" }, { nombre: "Mito" },
          { nombre: "Nueve de Julio" }, { nombre: "Orcotuna" },
          { nombre: "Santa Rosa de Ocopa" },
        ],
      },
      {
        nombre: "Chanchamayo",
        distritos: [
          { nombre: "La Merced" }, { nombre: "Perene" }, { nombre: "Pichanaqui" },
          { nombre: "San Luis de Shuaro" }, { nombre: "San Ramón" }, { nombre: "Vitoc" },
        ],
      },
      {
        nombre: "Jauja",
        distritos: [
          { nombre: "Acolla" }, { nombre: "Apata" }, { nombre: "Ataura" },
          { nombre: "Canchayllo" }, { nombre: "Curicaca" }, { nombre: "El Mantaro" },
          { nombre: "Huamalí" }, { nombre: "Huaripampa" }, { nombre: "Huertas" },
          { nombre: "Janjaillo" }, { nombre: "Julcán" }, { nombre: "Leonor Ordóñez" },
          { nombre: "Llocllapampa" }, { nombre: "Marco" }, { nombre: "Masma" },
          { nombre: "Masma Chicche" }, { nombre: "Molinos" }, { nombre: "Monobamba" },
          { nombre: "Muqui" }, { nombre: "Muquiyauyo" }, { nombre: "Paca" },
          { nombre: "Paccha" }, { nombre: "Pancán" }, { nombre: "Parco" },
          { nombre: "Pomacancha" }, { nombre: "Ricrán" }, { nombre: "San Lorenzo" },
          { nombre: "San Pedro de Chunán" }, { nombre: "Sausa" }, { nombre: "Sincos" },
          { nombre: "Tunan Marca" }, { nombre: "Yauli" }, { nombre: "Yauyos" },
        ],
      },
      {
        nombre: "Junín",
        distritos: [
          { nombre: "Junín" }, { nombre: "Carhuamayo" },
          { nombre: "Ondores" }, { nombre: "Ulcumayo" },
        ],
      },
      {
        nombre: "Satipo",
        distritos: [
          { nombre: "Satipo" }, { nombre: "Coviriali" }, { nombre: "Llaylla" },
          { nombre: "Mazamari" }, { nombre: "Pampa Hermosa" }, { nombre: "Pangoa" },
          { nombre: "Río Negro" }, { nombre: "Río Tambo" }, { nombre: "Vizcatán del Ene" },
        ],
      },
      {
        nombre: "Tarma",
        distritos: [
          { nombre: "Tarma" }, { nombre: "Acobamba" }, { nombre: "Huaricolca" },
          { nombre: "Huasahuasi" }, { nombre: "La Unión" }, { nombre: "Palca" },
          { nombre: "Palcamayo" }, { nombre: "San Pedro de Cajas" }, { nombre: "Tapo" },
        ],
      },
      {
        nombre: "Yauli",
        distritos: [
          { nombre: "La Oroya" }, { nombre: "Chacapalpa" }, { nombre: "Huay-Huay" },
          { nombre: "Marcapomacocha" }, { nombre: "Morococha" }, { nombre: "Paccha" },
          { nombre: "Santa Bárbara de Carhuacayan" }, { nombre: "Santa Rosa de Sacco" },
          { nombre: "Suitucancha" }, { nombre: "Yauli" },
        ],
      },
      {
        nombre: "Chupaca",
        distritos: [
          { nombre: "Chupaca" }, { nombre: "Ahuac" }, { nombre: "Chongos Bajo" },
          { nombre: "Huáchac" }, { nombre: "Huamancaca Chico" },
          { nombre: "San Juan de Iscos" }, { nombre: "San Juan de Jarpa" },
          { nombre: "Tres de Diciembre" }, { nombre: "Yanacancha" },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchNavbarBranding() {
  const { data: navbarData, error: navbarError } = await supabase
    .from("navbar")
    .select("*")
    .limit(1);

  if (navbarError) throw navbarError;

  const navbarRow = (navbarData ?? [])[0] as Record<string, unknown> | undefined;
  if (!navbarRow) return brandingInicial;

  const companyId = getField<number>(navbarRow, "nbCompanyId", "nbcompanyid");

  const companyResult =
    companyId !== null && companyId !== undefined
      ? await supabase.from("nbCompany").select("*").eq("nbcompanyid", companyId).limit(1)
      : { data: [], error: null };

  if (companyResult.error) throw companyResult.error;

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const whatsappNumber = "51931389001";
  const [branding, setBranding] = useState(brandingInicial);
  const [mostrarModalCotizar, setMostrarModalCotizar] = useState(false);
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [archivoAdjunto, setArchivoAdjunto] = useState("");
  const [rucDni, setRucDni] = useState("");
  const [materiales, setMateriales] = useState("");
  const [referencia, setReferencia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [distrito, setDistrito] = useState("");
  const [provincia, setProvincia] = useState("");

  // ── Carrito ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setCartItems(leerCarrito());

    const handleCartUpdate = () => setCartItems(leerCarrito());
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.cantidad, 0),
    [cartItems]
  );

  // ── Ubicación ───────────────────────────────────────────────────────────────

  const departamentoActivo =
    ubicaciones.find((item) => item.nombre === departamento) ?? ubicaciones[0];
  const provinciasDisponibles = departamentoActivo.provincias;
  const provinciaActiva = provincia
    ? provinciasDisponibles.find((item) => item.nombre === provincia) ??
      provinciasDisponibles[0]
    : undefined;
  const distritosDisponibles = provinciaActiva?.distritos ?? [];
  const ubicacionSeleccionada =
    departamento && distrito && provincia
      ? `${departamento}, ${provincia}, ${distrito}`
      : "Seleccionar Ubicacion";

  const cambiarDepartamento = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDepartamento = event.target.value;
    const dep =
      ubicaciones.find((item) => item.nombre === nextDepartamento) ?? ubicaciones[0];
    const prov = dep.provincias[0];
    setDepartamento(nextDepartamento);
    setProvincia(prov.nombre);
    setDistrito(prov.distritos[0].nombre);
  };

  const cambiarProvincia = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProvincia = event.target.value;
    const prov =
      provinciasDisponibles.find((item) => item.nombre === nextProvincia) ??
      provinciasDisponibles[0];
    setProvincia(nextProvincia);
    setDistrito(prov.distritos[0]?.nombre ?? "");
  };

  // ── Cotizar ─────────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={style.wrapper}>
      <header className={style.navbar}>
        <NavBarLogo />
        <NavBarSearch />

        <nav className={style.menu}>
          <Link to="/nosotros" className={style.link}>
            Nosotros
          </Link>
          <Link to="/product" className={style.link}>
            Productos
          </Link>
          <NavBarCategoria />
        </nav>

        <div className={style.actions}>
          <button type="button" className={style.quoteButton} onClick={abrirCotizar}>
            Cotizar
          </button>

          <Link to="/cart" className={style.cartButton} aria-label="Carrito">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 30 30"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h2l2.4 12.1a1 1 0 0 0 1 .9h9.7a1 1 0 0 0 1-.8L21 7H7" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            {totalItems > 0 && <span className={style.cartCount}>{totalItems}</span>}
          </Link>
        </div>
      </header>

      {/* ── Modal Cotizar ───────────────────────────────────────────────────── */}
      {mostrarModalCotizar && (
        <div className={style.quoteOverlay} onClick={cerrarCotizar}>
          <div className={style.quoteModal} onClick={(e) => e.stopPropagation()}>
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
                    onChange={(e) => setDistrito(e.target.value)}
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
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>
              </div>
            )}

            <textarea
              className={style.quoteTextarea}
              placeholder="Escribe aquí tu lista de materiales..."
              value={materiales}
              onChange={(e) => setMateriales(e.target.value)}
            />

            <label className={style.uploadButton}>
              <input type="file" className={style.fileInput} onChange={handleArchivo} />
              Adjuntar lista (Opcional)
            </label>

            {archivoAdjunto && <p className={style.fileName}>{archivoAdjunto}</p>}

            <button type="button" className={style.quoteSubmit} onClick={cotizarPorWhatsapp}>
              <span>{icon.iconWhatsApp({ className: style.whatsappIcon })}</span>
              <span>Cotizar</span>
            </button>
            <p className={style.quotePhone}>o comunicate con el +51 915 144 663</p>
          </div>
        </div>
      )}
    </div>
  );
}