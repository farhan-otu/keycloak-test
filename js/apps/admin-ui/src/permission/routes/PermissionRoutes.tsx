import { lazy } from "react";
import { AppRouteObject } from "../../routes";

const NewPermissionForm = lazy(() => import("../NewPermissionForm"));
const PermissionList = lazy(() => import("../PermissionList"));

export type PermissionParams = { realm: string };

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
