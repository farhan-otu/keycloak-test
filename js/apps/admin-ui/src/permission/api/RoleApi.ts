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
    throw error;
  }
};

export const fetchPoliciesForClient = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string
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
      "authz/resource-server/policy"
    );

    const urlWithParams = `${url}?permission=false`;
    const response = await fetchWithError(urlWithParams, {
      method: "GET",
      headers: getAuthorizationHeaders(accessToken),
    });


    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching policies:", error);

  }
};
//  fetch All auth-resources
export const fetchResourcesForClient = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string
): Promise<any> => {
  try {
    // Get the access token
    const accessToken = await adminClient.getAccessToken();

    // Construct the URL for fetching client policies
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

    // Fetch the policies from Keycloak
    const response = await fetchWithError(url, {
      method: "GET",
      headers: getAuthorizationHeaders(accessToken),
    });

    // Parse and return the response data
    const data = await response.json();
    return data;  // Return the policies data
  } catch (error) {
    console.error("Error fetching policies:", error);

  }
};

//  fetch for auth scopes 
export const fetchScopesForClient = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string
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
      "authz/resource-server/scope"
    );

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

export const createScopePermission = async (
  adminClient: KeycloakAdminClient,
  selectedClientId: string,
  selectedPolicyId: string,
  selectedResources: string[],
  selectedScopes: string[]
) => {
  const requestData = {
    id: selectedClientId,
    name: 'new-scope-permission',
    description: 'Description of the new scope permission',
    policies: [selectedPolicyId],
    resources: selectedResources,
    scopes: selectedScopes,
    logic: 'POSITIVE',
    decisionStrategy: 'UNANIMOUS',
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

    return await response.json();
  }
  catch (err) {
    console.log(err)
  }
};
