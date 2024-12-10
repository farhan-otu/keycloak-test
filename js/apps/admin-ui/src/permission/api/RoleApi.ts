import KeycloakAdminClient, { fetchWithError } from "@keycloak/keycloak-admin-client";
import { getAuthorizationHeaders } from "../../utils/getAuthorizationHeaders";
import { joinPath } from "../../utils/joinPath";

export const fetchRolesForClient = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string
): Promise<any> => {
  try {
    const accessToken = await adminClient.getAccessToken();
    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "roles"
    );
    const response = await fetchWithError(url, {
      method: "GET",
      headers: getAuthorizationHeaders(accessToken),
    });

    const data = await response.json();
    console.log("Fetched roles:", data);
    return data;
  } catch (error) {
    console.error("Error fetching roles:", error);
  }
};

export const fetchPoliciesForClient = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string,
  first: number = 0,
  max: number = 11,
  permission: boolean = false,
  type: string = "role"
): Promise<any> => {
  try {
    
    const accessToken = await adminClient.getAccessToken();
    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "authz/resource-server/policy"
    );

    const urlWithParams = `${url}?first=${first}&max=${max}&permission=${permission}&type=${encodeURIComponent(type)}`;
    const response = await fetchWithError(urlWithParams, {
      method: "GET",
      headers: getAuthorizationHeaders(accessToken),
    });

    // Parse and return the JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching policies:", error);

  }
};

export const fetchResourcesForClient = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string
): Promise<any> => {
  try {

    const accessToken = await adminClient.getAccessToken();

    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "authz/resource-server/resource"
    );

    console.log(`Fetching policies from: ${url}`);
    const response = await fetchWithError(url, {
      method: "GET",
      headers: getAuthorizationHeaders(accessToken),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching policies:", error);

  }
};

export const fetchScopesForClientResource = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string,
  selectedResourceId: string
): Promise<any> => {
  try {
    // Get the access token
    const accessToken = await adminClient.getAccessToken();
    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "authz/resource-server/resource",
      encodeURIComponent(selectedResourceId),
    );

    const response = await fetchWithError(url, {
      method: "GET",
      headers: getAuthorizationHeaders(accessToken),
    });
    const data = await response.json();
    if (data && Array.isArray(data.scopes) && data.scopes.length > 0) {
      return data.scopes;
    } else {

      console.log("No scopes found for this resource.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching policies:", error);

  }
};

export const createRole = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string,
  roleData: { name: string; description: string }
): Promise<any> => {

  try {

    if (!selectedClientId) {
      throw new Error("No client selected");
    }

    const accessToken = await adminClient.getAccessToken();
    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "roles"
    );

    const response = await fetchWithError(url, {
      method: "POST",
      headers: {
        ...getAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roleData),
    });

    return await response.json();
  }
  catch (err) {
    console.log(err)
  }
};

export const createRolePolicy = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string,
  formData: { name: string; description: string; roles: { id: string; required: boolean }[] }
): Promise<any> => {

  try {

    if (!selectedClientId) {
      console.log("No client selected");
      return;
    }

    const roleData = {
      name: formData.name,
      description: formData.description,
      roles: formData.roles,
    };

    const accessToken = await adminClient.getAccessToken();
    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "authz/resource-server/policy/role"
    );

    const response = await fetchWithError(url, {
      method: "POST",
      headers: {
        ...getAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from server:", errorText);
      throw new Error(`Server returned an error: ${response.status}`);
    }


    return await response.json();
  }
  catch (err) {
    console.log(err)
  }
};


export const createScopePermission = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string,
  selectedPolicyId: string,
  selectedResources: string[],
  selectedScopes: string[],
  name: string
) => {
  const requestData = {
    id: selectedClientId,
    name: name,
    // description: 'Description has been added',
    policies: [selectedPolicyId],
    resources: selectedResources,
    scopes: selectedScopes,
  };
  try {


    if (!selectedClientId) {
      throw new Error("No client selected");
    }

    const accessToken = await adminClient.getAccessToken();
    const baseUrl = adminClient.baseUrl;
    const url = joinPath(
      baseUrl,
      "admin/realms",
      encodeURIComponent(adminClient.realmName),
      "clients",
      encodeURIComponent(selectedClientId),
      "authz/resource-server/permission/scope"
    );

    const response = await fetchWithError(url, {
      method: "POST",
      headers: {
        ...getAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Error creating permission:", errorResponse);
    }

    return await response.json();
  }
  catch (err) {
    console.log(err)
  }
};
