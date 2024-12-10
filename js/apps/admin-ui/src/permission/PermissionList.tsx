import type PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import type PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import {
  ListEmptyState,
  PaginatingTableToolbar,
  useAlerts,
  useFetch,
} from "@keycloak/keycloak-ui-shared";
import {
  Button,
  PageSection,
  ToolbarItem,
  AlertVariant,
  ButtonVariant
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAdminClient } from "../admin-client";
import { KeycloakSpinner } from "@keycloak/keycloak-ui-shared";
import { useRealm } from "../context/realm-context/RealmContext";
import { MoreLabel } from "../clients/authorization/MoreLabel";
import { SearchDropdown, SearchForm } from "./SearchDropdown";
import "../clients/authorization/permissions.css";
import { Title, Alert } from '@patternfly/react-core';
import Select from 'react-select';
import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";

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
      {row.associatedPolicies?.[0]?.name || "NA"}{" "}
      <MoreLabel array={row.associatedPolicies} />
    </>
  );
};

const PermissionList = ({
  clientId,
  isDisabled = false,
}: PermissionsProps) => {
  const { adminClient } = useAdminClient();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addAlert, addError } = useAlerts();
  const { realm } = useRealm();
  const [clients, setClients] = useState<ClientRepresentation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  const [permissions, setPermissions] =
    useState<ExpandablePolicyRepresentation[]>();
  const [selectedPolicy, setSelectedPolicy] =
    useState<ExpandablePolicyRepresentation>();

  const [policyProviders, setPolicyProviders] =
    useState<PolicyProviderRepresentation[]>();
  const [selectedPermission, setSelectedPermission] =
    useState<PolicyRepresentation>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState<SearchForm>({});

  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);

  const [max, setMax] = useState(10);
  const [first, setFirst] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      const clientsData = await adminClient.clients.find();
      setClients(clientsData);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    setPermissions([]);
    setIsLoading(false);
    setFetchError(null);
    setFirst(0);
    setMax(10);
  }, [selectedClientId]);


  const handleClientSelect = (selectedOption: { value: string; label: string } | null) => {
    setSelectedClientId(selectedOption ? selectedOption.value : null);
  };

  const handleCreatePermission = () => {

    if (realm) {
      navigate(`/${realm}/create-permission`);
    } else {
      console.error("Realm is missing");
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!selectedClientId) return;

      setIsLoading(true);
      setFetchError(null);
      try {
        const permissions = await adminClient.clients.findPermissions({
          first,
          max: max + 1,
          id: selectedClientId,
          ...search,
        });

        if (permissions.length === 0) {
          setPermissions([]);
          return;
        }

        const permissionsWithAssociatedPolicies = await Promise.all(
          permissions.map(async (permission) => {
            const associatedPolicies = await adminClient.clients.getAssociatedPolicies({
              id: selectedClientId,
              permissionId: permission.id!,
            });

            return {
              ...permission,
              associatedPolicies,
              isExpanded: false,
            };
          }),
        );
        setPermissions(permissionsWithAssociatedPolicies);
      } catch (error) {
        setFetchError("permissionsFetchError");
        console.error("Error fetching permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedClientId, first, max, search, adminClient,key]);

  useEffect(() => {
    const fetchPolicyProviders = async () => {
      if (!selectedClientId) return;

      try {
        const params = {
          first: 0,
          max: 1,
        };

        const [policies] = await Promise.all([
          adminClient.clients.listPolicyProviders({ id: selectedClientId }),
        ]);

        setPolicyProviders(policies.filter((p) => p.type === "scope"));
      } catch (error) {
        console.error("Error fetching policy providers:", error);
      }
    };

    fetchPolicyProviders();
  }, [selectedClientId, adminClient]);


  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "deletePermission",
    messageKey: t("deletePermissionConfirm", {
      permission: selectedPermission?.name,
    }),
    continueButtonVariant: ButtonVariant.danger,
    continueButtonLabel: "confirm",
    onConfirm: async () => {
      if (selectedClientId && selectedPermission) {
        try {
          await adminClient.clients.delPermission({
            id: selectedClientId,
            type: selectedPermission.type!,
            permissionId: selectedPermission.id!,
          });
          addAlert(t("permissionDeletedSuccess"), AlertVariant.success);
          refresh();
        } catch (error) {
          addError("permissionDeletedError", error);
        }
      }
    },
  });

  if (isLoading) {
    return <KeycloakSpinner />;
  }

  const noData = permissions?.length === 0 && !fetchError;
  const searching = Object.keys(search).length !== 0;

  return (
    <>
      <PageSection variant="light" className="pf-v5-u-p-0">

        <div className="pf-v5--font-family">
          <Title headingLevel="h1" className="pf-v5-u-ml-lg pf-v5-u-mt-md pf-v5--font-family">Permission List</Title>
          <div className="pf-v5-c-select-client-w">
            <label>Select a Client</label>
            <Select
              className="pf-v5-c__react-select"
              options={clients.length > 0
                ? clients.map((client) => ({
                  value: client.id || '',
                  label: client.clientId || '',
                }))
                : [{ value: '', label: t("No Clients Found") }]
              }
              value={selectedClientId
                ? { value: selectedClientId, label: clients.find(c => c.id === selectedClientId)?.clientId || '' }
                : null
              }
              onChange={handleClientSelect}
              placeholder={t("Select Client")}
              isDisabled={clients.length === 0}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "rgb(247, 124, 26)",
                },
              })}
            />
          </div>
          {(!noData || searching) && (
            <PaginatingTableToolbar
              count={(permissions || []).length}
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
                    onClick={handleCreatePermission}
                    data-testid="create-permission"
                    className="pf-v5-c-add-permission"
                  >
                    {t("createPermission")}
                  </Button>

                </>
              }
            >
              {permissions && permissions.length > 0 ? (
                <Table aria-label={t("permissions") || "Permissions"} variant="compact">
                  <Thead>
                    <Tr>
                      <Th className="pf-v5-c-table-heading">{t("name")}</Th>
                      <Th className="pf-v5-c-table-heading">{t("type")}</Th>
                      <Th className="pf-v5-c-table-heading">{t("Associated policy")}</Th>
                      <Th className="pf-v5-c-table-heading">{t("description")}</Th>
                      <Th aria-hidden="true" />
                    </Tr>
                  </Thead>

                  <Tbody>
                    {permissions?.map((permission, rowIndex) => (
                      <Tr key={permission.id}>
                        <Td className="pf-v5-c-td-name">{permission.name || "NA"}</Td>
                        <Td>{permission.type || "NA"}</Td>
                        <Td>
                          <AssociatedPoliciesRenderer row={permission} />
                        </Td>
                        <Td>{permission.description || "NA"}</Td>
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
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <div className="no-data-container">
                  <span>{t("No data available")}</span>
                </div>
              )}

            </PaginatingTableToolbar>
          )}
          {noData && !searching && (
            <h1 className="pf-v5-u-pl-lg" style={{ color: "rgb(247, 124, 26)" }}>Please select a client to view a permission List</h1>
          )}
          <DeleteConfirm />
        </div>
      </PageSection>
    </>
  );
};

export default PermissionList;
