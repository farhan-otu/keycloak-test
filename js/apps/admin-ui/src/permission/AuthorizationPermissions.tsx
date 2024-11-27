import type PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import type PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import {
  ListEmptyState,
  PaginatingTableToolbar,
  useAlerts,
  useFetch,
} from "@keycloak/keycloak-ui-shared";
import {
  Alert,
  AlertVariant,
  ButtonVariant,
  Button,
  PageSection,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAdminClient } from "../admin-client";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import { KeycloakSpinner } from "@keycloak/keycloak-ui-shared";
import { useRealm } from "../context/realm-context/RealmContext";
import { EmptyPermissionsState } from "../clients/authorization/EmptyPermissionsState";
import { MoreLabel } from "../clients/authorization/MoreLabel";
import { SearchDropdown, SearchForm } from "../clients/authorization/SearchDropdown";
import "../clients/authorization/permissions.css";

type PermissionsProps = {
  clientId: string;
  isDisabled?: boolean;
};

type ExpandablePolicyRepresentation = PolicyRepresentation & {
  associatedPolicies?: PolicyRepresentation[];
  isExpanded: boolean;
};

const AssociatedPoliciesRenderer = ({
  row,
}: {
  row: ExpandablePolicyRepresentation;
}) => {
  return (
    <>
      {row.associatedPolicies?.[0]?.name || "—"}{" "}
      <MoreLabel array={row.associatedPolicies} />
    </>
  );
};

const AuthorizationPermissions = ({
  clientId,
  isDisabled = false,
}: PermissionsProps) => {
  const { adminClient } = useAdminClient();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addAlert, addError } = useAlerts();
  const { realm } = useRealm();

  const [permissions, setPermissions] =
    useState<ExpandablePolicyRepresentation[]>();
  const [selectedPermission, setSelectedPermission] =
    useState<PolicyRepresentation>();
  const [policyProviders, setPolicyProviders] =
    useState<PolicyProviderRepresentation[]>();
  const [disabledCreate, setDisabledCreate] = useState<{
    resources: boolean;
    scopes: boolean;
  }>();

  const [search, setSearch] = useState<SearchForm>({});

  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);

  const [max, setMax] = useState(10);
  const [first, setFirst] = useState(0);

  const handleCreatePermission = () => {

    if (realm) {
      navigate(`/${realm}/create-permission`);
    } else {
      console.error("Realm is missing");
    }
  };

  useFetch(
    async () => {
      const permissions = await adminClient.clients.findPermissions({
        first,
        max: max + 1,
        id: clientId,
        ...search,
      });
      console.log(adminClient)

      return await Promise.all(
        permissions.map(async (permission) => {
          const associatedPolicies =
            await adminClient.clients.getAssociatedPolicies({
              id: clientId,
              permissionId: permission.id!,
            });

          return {
            ...permission,
            associatedPolicies,
            isExpanded: false,
          };
        }),
      );
    },
    setPermissions,
    [key, search, first, max],
  );

  useFetch(
    async () => {
      const params = {
        first: 0,
        max: 1,
      };
      const [policies, resources, scopes] = await Promise.all([
        adminClient.clients.listPolicyProviders({
          id: clientId,
        }),
        adminClient.clients.listResources({ ...params, id: clientId }),
        adminClient.clients.listAllScopes({ ...params, id: clientId }),
      ]);
      return {
        policies: policies.filter(
          (p) => p.type === "resource" || p.type === "scope",
        ),
        resources: resources.length !== 1,
        scopes: scopes.length !== 1,
      };
    },
    ({ policies, resources, scopes }) => {
      setPolicyProviders(policies);
      setDisabledCreate({ resources, scopes });
    },
    [],
  );

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "deletePermission",
    messageKey: t("deletePermissionConfirm", {
      permission: selectedPermission?.name,
    }),
    continueButtonVariant: ButtonVariant.danger,
    continueButtonLabel: "confirm",
    onConfirm: async () => {
      try {
        await adminClient.clients.delPermission({
          id: clientId,
          type: selectedPermission?.type!,
          permissionId: selectedPermission?.id!,
        });
        addAlert(t("permissionDeletedSuccess"), AlertVariant.success);
        refresh();
      } catch (error) {
        addError("permissionDeletedError", error);
      }
    },
  });

  if (!permissions) {
    return <KeycloakSpinner />;
  }

  const noData = permissions.length === 0;
  const searching = Object.keys(search).length !== 0;
  return (
    <PageSection variant="light" className="pf-v5-u-p-0">
      <DeleteConfirm />
      {(!noData || searching) && (
        <PaginatingTableToolbar
          count={permissions.length}
          first={first}
          max={max}
          onNextClick={setFirst}
          onPreviousClick={setFirst}
          onPerPageSelect={(first, max) => {
            setFirst(first);
            setMax(max);
          }}
          toolbarItem={
            <>
              <ToolbarItem>
                <SearchDropdown
                  types={policyProviders}
                  search={search}
                  onSearch={setSearch}
                  type="permission"
                />
              </ToolbarItem>
              <Button
                variant="primary"
                isDisabled={isDisabled}
                onClick={handleCreatePermission}
                data-testid="create-permission"
                style={{ backgroundColor: 'rgb(247, 124, 26)' }}
              >
                {t("createPermission")}
              </Button>

              {isDisabled && (
                <Alert
                  className="pf-v5-u-mt-sm"
                  variant="warning"
                  isInline
                  isPlain
                  title={t("noPermissionCreateHint")}
                />
              )}
            </>
          }
        >
          {!noData && (
            <Table aria-label={t("resources")} variant="compact">
              <Thead>
                <Tr>
                  <Th style={{ fontWeight: "bold" }}>{t("name")}</Th>
                  <Th style={{ fontWeight: "bold" }}>{t("type")}</Th>
                  <Th style={{ fontWeight: "bold" }}>{t("associatedPolicy")}</Th>
                  <Th style={{ fontWeight: "bold" }}>{t("description")}</Th>
                  <Th aria-hidden="true" />
                </Tr>
              </Thead>
              {permissions.map((permission, rowIndex) => (
                <Tbody key={permission.id} isExpanded={permission.isExpanded}>
                  <Tr>

                    <Td data-testid={`name-column-${permission.name}`}
                      style={{ color: 'rgb(247, 124, 26)' }}
                    >
                      {permission.name || "—"}
                    </Td>
                    <Td>
                      {
                        policyProviders?.find((p) => p.type === permission.type)
                          ?.name || "-"
                      }
                    </Td>
                    <Td>
                      <AssociatedPoliciesRenderer row={permission} />
                    </Td>
                    <Td >{permission.description || "—"}</Td>
                    <Td
                      actions={{
                        items: [
                          {
                            title: t("delete"),
                            onClick: async () => {
                              setSelectedPermission(permission);
                              toggleDeleteDialog();
                            },
                          },
                        ],
                      }}
                    ></Td>
                  </Tr>

                </Tbody>
              ))}
            </Table>
          )}
        </PaginatingTableToolbar>
      )}
      {noData && !searching && (
        <EmptyPermissionsState
          clientId={clientId}
          isResourceEnabled={!isDisabled && disabledCreate?.resources}
          isScopeEnabled={!isDisabled && disabledCreate?.scopes}
        />
      )}
      {noData && searching && (
        <ListEmptyState
          isSearchVariant
          message={t("noSearchResults")}
          instructions={t("noSearchResultsInstructions")}
        />
      )}
    </PageSection>
  );
};

export default AuthorizationPermissions;
