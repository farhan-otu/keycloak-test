  import { lazy } from "react";
  import { AppRouteObject } from "../../routes";
  import type { Path } from "react-router-dom";
  import { generateEncodedPath } from "../../utils/generateEncodedPath";

  const NewPermissionForm = lazy(() => import("../NewPermissionForm"));
  const PermissionList = lazy(() => import("../PermissionList"));
  const PermissionDetailPage=lazy(()=>import("../PermissionDetailPage"));

  export type PermissionParams = { realm: string };

  export type PermissionDetailsParams = {
    realm: string;
    clientId: string;
    permissionType: string ;
    permissionId: string;
  };

  export const AddPermissionRoute: AppRouteObject = {
    path: "/:realm/create-permission",
    element: <NewPermissionForm />,
    breadcrumb: (t) => t("permissions"),
    handle: {
      access: "anyone",
    },
  };
  // const clientId = "781abafb-7e36-41da-b918-f78241d8426f";

  export const PermissionListRoute: AppRouteObject = {
    path: "/:realm/permissions",
    element: <PermissionList clientId="" />,
    breadcrumb: (t) => t("permissions"),
    handle: {
      access: "anyone", 
    },
  };
  
  export const PermissionDetailsRoute: AppRouteObject = {
    path: "/:realm/:clientId/update-permissions/:permissionType/:permissionId",
    element: <PermissionDetailPage />,
    breadcrumb: (t) => t("permissionDetails"),
    handle: {
      access: "anyone",
    },
  };

  export const toPermissionDetails = (
    params: PermissionDetailsParams,
  ): Partial<Path> => ({
    pathname: generateEncodedPath(PermissionDetailsRoute.path, params),
  });