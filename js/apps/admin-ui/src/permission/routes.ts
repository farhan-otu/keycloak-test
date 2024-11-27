import type { AppRouteObject } from "../routes";
import { AddPermissionRoute , PermissionListRoute } from "./routes/PermissionRoutes";

const routes: AppRouteObject[] = [AddPermissionRoute,PermissionListRoute];

export default routes;
