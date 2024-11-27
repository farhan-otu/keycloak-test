// src/routes/permissionRoutes.tsx
import { lazy } from "react";
import { AppRouteObject } from "../../routes";
import { generateEncodedPath } from "../../utils/generateEncodedPath"; // Ensure this utility exists
import type { Path } from "react-router-dom";

// Lazy load the PermissionButton component
const NewPermissionForm = lazy(() => import("../NewPermissionForm"));
const PermissionList = lazy(() => import("../AuthorizationPermissions"));

export type PermissionParams = { realm: string }; // Example: route parameter for realm

// Define the route for permission button
export const AddPermissionRoute: AppRouteObject = {
  path: "/:realm/create-permission", // Example path with a dynamic realm parameter
  element: <NewPermissionForm />,
  breadcrumb: (t) => t("permissions"),
  handle: {
    access: "anyone",
  },
};
const clientId = "781abafb-7e36-41da-b918-f78241d8426f";

export const PermissionListRoute: AppRouteObject = {
  path: "/:realm/permissions", // Example path with a dynamic realm parameter
  element: <PermissionList clientId={clientId || ''} />,
  breadcrumb: (t) => t("permissions"),
  handle: {
    access: "anyone", // Set appropriate access control
  },
};
// Function to generate the path for permissions route
// export const toPermission = (params: PermissionParams): Partial<Path> => ({
//   pathname: generateEncodedPath(PermissionRoute.path, params),
// });
