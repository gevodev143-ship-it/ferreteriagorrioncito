import { Route } from "react-router-dom";
import { ProtectedRoute } from "../../../app/routes/ProtectedRoutes"
import ProductPage from "../pages/ProductPage";

/* usamoes el export default para agrupar las rutas y mantener el appRoutes
usamos el protectedRoutes para no permitir que se ingrese sin que tenga el login o la session */

export default [
    <Route key="product" path="/product" element={<ProductPage/>} />,

];