import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageSection, Title, Button, Form, FormGroup, TextArea, TextInput } from "@patternfly/react-core";
import { useAdminClient } from "../admin-client";
import { useAlerts } from "@keycloak/keycloak-ui-shared";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { fetchResourcesForClient, fetchScopesForClientResource, createScopePermission, updateScopePermission } from "./api/RoleApi";
import type PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import type ResourceRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceRepresentation";
import type ScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/scopeRepresentation";
import { ArrowRightIcon, ArrowDownIcon } from '@patternfly/react-icons';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import "./permission.css";
import { Spinner } from '@patternfly/react-core';

const PermissionDetailPage = () => {
    const { t } = useTranslation();
    const { addError } = useAlerts();
    const { adminClient } = useAdminClient();
    const { realm, clientId, permissionType, permissionId } = useParams();

    const [permission, setPermission] = useState<any>(null);
    const { addAlert } = useAlerts();
    const [selectedClientId, setSelectedClientId] = useState(clientId || "");
    const [roles, setRoles] = useState<RoleRepresentation[]>([]);
    const [policy, setPolicy] = useState<PolicyRepresentation[]>([]);
    const [resource, setResource] = useState<ResourceRepresentation[]>([]);
    const [selectedResources, setSelectedResources] = useState<any[]>([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [availableOptions, setAvailableOptions] = useState<ScopeRepresentation[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<ScopeRepresentation[]>([]);
    const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth <= 800);



    useEffect(() => {
        const fetchData = async () => {
            try {
                const [permission, permissionResources, policies, scopes] = await Promise.all([
                    adminClient.clients.findOnePermission({
                        id: clientId!,
                        type: permissionType!,
                        permissionId: permissionId!,
                    }),
                    adminClient.clients.getAssociatedResources({
                        id: clientId!,
                        permissionId: permissionId!,
                    }),
                    adminClient.clients.getAssociatedPolicies({
                        id: clientId!,
                        permissionId: permissionId!,
                    }),
                    adminClient.clients.getAssociatedScopes({
                        id: clientId!,
                        permissionId: permissionId!,
                    }),
                ]);
               
                setPermission(permission);
                setPolicy(policies || []);
                setSelectedResources(permissionResources || []);
                // setTimeout(() => {
                setSelectedOptions(scopes)
                // }, 2000);

                if (policies && policies.length > 0) {
                    setSelectedPolicyId(policies[0].id || null);
                }
                // setTimeout(async () => {
                const resource = await fetchResourcesForClient(adminClient, selectedClientId);
                setResource(resource || []);
                // }, 1000); 



            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        if (clientId) {
            fetchData();
        }
    }, [clientId, permissionType, permissionId, realm]);

    useEffect(() => {
        const fetchAndFilterScopes = async () => {
            if (selectedResources.length > 0 && selectedResources[0]?._id) {

                try {
                    const resourceAvailable = await fetchScopesForClientResource(
                        adminClient,
                        selectedClientId,
                        selectedResources[0]._id
                    );

                    const filteredResources = resourceAvailable.filter(
                        (availableScope: ScopeRepresentation) =>
                            !selectedOptions.some((selectedScope) => selectedScope.id === availableScope.id)
                    );

                    setAvailableOptions(filteredResources);
                } catch (error) {
                    console.error("Error fetching available scopes:", error);
                } finally {

                }
            }
        };

        fetchAndFilterScopes();
    }, [selectedResources, selectedClientId, selectedOptions, adminClient]);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 850);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleSelect = (option: ScopeRepresentation) => {
        setSelectedOptions((prevSelected) => [...prevSelected, option]);
        setAvailableOptions((prevOptions) =>
            prevOptions.filter((item) => item.id !== option.id)
        );
    };
    const handleRemove = (option: ScopeRepresentation) => {
        setAvailableOptions((prevOptions) => [...prevOptions, option]);
        setSelectedOptions((prevSelected) =>
            prevSelected.filter((item) => item.id !== option.id)
        );
    };

    const handlePolicySelect = (selected: { value: string; label: string | undefined } | null) => {
        if (selected) {
            setSelectedPolicyId(selected.value);
        } else {
            setSelectedPolicyId(null);
        }
    };


    const handleResourceChange = async (
        selected: { value: string, label: string } | null
    ) => {
        if (selected) {

            const selectedId = selected.value;
            console.log(selectedId)
            // setSelectedResources([selected]);
            if (selectedClientId) {
                try {
                    setSelectedResources([{ _id: selectedId, name: selected.label }]);

                    const resourceScopes = await fetchScopesForClientResource(
                        adminClient,
                        selectedClientId,
                        selectedId
                    );

                    // Filter out already selected scopes
                    const filteredScopes = resourceScopes.filter(
                        (scope: ScopeRepresentation) =>
                            !selectedOptions.some(
                                (selectedScope) => selectedScope.id === scope.id
                            )
                    );

                    setAvailableOptions(filteredScopes);

                } catch (error) {
                    console.error("Error fetching scopes for resource:", error);
                    addError("Resources could not fetching scopes", error);
                }
            }

        } else {
            setSelectedResources([]);
        }
    };

    const loadResources = (inputValue: string) =>
        new Promise<any[]>((resolve) => {
            const filteredOptions = resource
                .filter((resourceItem) =>
                    resourceItem.name?.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((resourceItem) => ({
                    value: resourceItem._id || 'default-id',
                    label: resourceItem.name || 'Unnamed Resource',
                }));

            setTimeout(() => {
                resolve(filteredOptions);
            }, 1000);
        });

    const handleUpdatePermission = async () => {
        try {
            if (!selectedClientId || !resource.length || !selectedOptions.length) {
                addError("Please select all the necessary fields", "");
                return;
            }
            const selectedResourceIds = selectedResources.map((resourceItem) => resourceItem._id).filter(Boolean);
            if (selectedResourceIds.length === 0) {
                addError("Please select at least one resource.", "");
                return;
            }
            const selectedScopeIds = selectedOptions
                .map((option) => option.id)
                .filter((id): id is string => id !== undefined);



            if (selectedScopeIds.length === 0) {
                alert("Please select at least one scope.");
                return;
            }
            if (!permissionId) {
                addError("Permission ID is missing.", "");
                return;
            }

            const policyIdToSend = selectedPolicyId || "";

            const result = await updateScopePermission(
                adminClient,
                selectedClientId,
                permissionId,  // Use the permissionId from the URL params
                policyIdToSend,
                selectedResourceIds,
                selectedScopeIds,
                permission?.name
            );

            if (result?.response === 201) {
                addAlert(`Successfully created permission`);
            }
            else {
                addError(`Failed to update permission for scope `, "");
            }

        } catch (error) {
            addError("Failed to create scope permission", "");
        }
    };


    if (!permission) {
        return <div>{t("permissionNotFound")}</div>;
    }

    return (
        <PageSection variant="light" className="pf-v5-u-p-0">
            <section className='pf-v5-c-page__main-breadcrumb pf-v5-c-main-section pf-v5--font-family'>
                <Title headingLevel="h1" className="pf-v5-u-mt-sm pf-v5--font-family">Update Permission</Title>
                <div className='pf-v5-c-flex'>
                    {/* <FormGroup
                        label="Permission Name"
                        fieldId="permission-name"
                        className="pf-v5-c-form-group"
                    > */}
                    <label>Permission Name</label>
                    <TextInput
                        id="permission-name"
                        type="text"
                        value={typeof permission?.name === 'object' ? JSON.stringify(permission.name) : permission?.name || ''}
                        onChange={(event) => {
                            const value = (event.target as HTMLInputElement).value; // Correctly typecast event.target
                            try {
                                // Parse JSON if the value is a valid JSON string
                                const parsedValue = JSON.parse(value);
                                setPermission({ ...permission, name: parsedValue });
                            } catch {
                                // Otherwise, set the value as a string
                                setPermission({ ...permission, name: value });
                            }
                        }}

                        className="pf-v5-c-form-control pf-set-custom-w"
                    />
                    {/* </FormGroup> */}
                </div>
                <div className="pf-v5-c-flex">

                    <label>Select Policy</label>
                    <Select
                        className="pf-v5-c__react-select"
                        options={selectedClientId && policy.length > 0
                            ? policy
                                .filter(p => p.id && p.name)
                                .map(p => ({
                                    value: p.id!,
                                    label: p.name || 'Unknown Policy'
                                }))
                            : []
                        }
                        value={selectedPolicyId
                            ? { value: selectedPolicyId, label: policy.find(p => p.id === selectedPolicyId)?.name || '' }
                            : null
                        }
                        onChange={handlePolicySelect}
                        placeholder={selectedClientId ? t("Select a policy") : t("Please select a Role")}
                        noOptionsMessage={() => {
                            if (!selectedRoleId) {
                                return 'Please select a role to view policies.';
                            }
                            return (policy && policy.length === 0) ? 'No Policy available for this Role.' : 'No Policy available';
                        }}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: "rgb(247, 124, 26)",


                            },
                        })}
                    />

                </div>
                <div className='pf-v5-c-flex'>
                    <label>Select Resource</label>

                    <AsyncSelect
                        className="pf-v5-c__react-select"
                        defaultOptions={resource?.map((resourceItem) => ({
                            value: resourceItem._id || '',
                            label: resourceItem.name || '',
                        })) || []}
                        loadOptions={loadResources}
                        onChange={handleResourceChange}
                        value={selectedResources[0] ? {
                            value: selectedResources[0]._id || '',
                            label: selectedResources[0].name || ''
                        } : null}
                        placeholder={selectedClientId ? "Select a Resource" : "Please select a client first"}
                        noOptionsMessage={() => {
                            if (selectedClientId === null) {
                                return 'Please select a client to view resources.';
                            }
                            return (resource && resource.length === 0) ? 'No resources available for this client.' : 'No Resources available';
                        }}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: "rgb(247, 124, 26)",

                            },
                        })}
                    />
                </div>

                <div className="pf-v5-c-multi-select-container">

                    <div className="pf-v5-c-scope">
                        <h3>Available Scopes</h3>
                        <ul>
                            {!selectedClientId ? (
                                <li style={{ color: "#8a8d90" }}>{t("Please select a client first")}</li>
                            ) : Array.isArray(availableOptions) && availableOptions.length > 0 ? (
                                availableOptions.map((option) => (
                                    <li key={option.id}>
                                        <button className='pf-v5-c-scope-list' onClick={() => handleSelect(option)}>{option.name}</button>
                                    </li>
                                ))
                            ) : (
                                <li style={{ textAlign: "center" }}>No Available Options </li>
                            )}
                        </ul>
                    </div>
                    <div>

                        <div className='pf-v5-c-arrow-container '>
                            {isSmallScreen ? (
                                <ArrowDownIcon className='pf-v5-c-arrow-icon' />
                            ) : (
                                <ArrowRightIcon className='pf-v5-c-arrow-icon' />
                            )}
                        </div>

                    </div>

                    <div className="pf-v5-c-scope">
                        <h3>Selected Scopes</h3>
                        <ul>
                            {!selectedClientId ? (
                                <li style={{ color: "#8a8d90" }}>{t("Please select a client first")}</li>
                            ) : Array.isArray(selectedOptions) && selectedOptions.length > 0 ? (
                                selectedOptions.map((option) => (
                                    <li key={option.id} className="selected-scope-item">
                                        <button className='pf-v5-c-scope-list selected-scope' onClick={() => handleRemove(option)}>{option.name}

                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner/> </li>
                            )}
                        </ul>
                    </div>
                </div>
                <button onClick={handleUpdatePermission} className='pf-v5-c-form__button custom-bg-color'>{t("Update")}</button>

            </section>
        </PageSection>
    );
};

export default PermissionDetailPage
