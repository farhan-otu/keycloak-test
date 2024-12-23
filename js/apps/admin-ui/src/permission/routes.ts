import type { AppRouteObject } from "../routes";
import { AddPermissionRoute, PermissionListRoute,PermissionDetailsRoute } from "./routes/PermissionRoutes";

const routes: AppRouteObject[] = [AddPermissionRoute, PermissionListRoute,PermissionDetailsRoute];

export default routes;
